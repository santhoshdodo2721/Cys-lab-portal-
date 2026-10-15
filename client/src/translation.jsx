import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { languages } from './languages.js';
import { Globe2, Loader2, RotateCw, Check } from 'lucide-react';

const TranslationContext = createContext(null);
const eligible = text => typeof text === 'string' && /\p{L}/u.test(text) && text.length <= 10000 && !/^(?:https?:\/\/|CVE-\d{4}-\d+|\S+@\S+|\/api\/)/i.test(text.trim());

const getStoredPreference = () => {
  try {
    const saved = localStorage.getItem('portal-language');
    return languages.some(([code]) => code === saved) ? saved : 'en';
  } catch {
    return 'en';
  }
};

const getStoredDict = lang => {
  try {
    const data = localStorage.getItem(`portal-dict-${lang}`);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const setStoredDict = (lang, dict) => {
  try {
    localStorage.setItem(`portal-dict-${lang}`, JSON.stringify(dict));
  } catch {}
};

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(getStoredPreference);
  const [dictionary, setDictionary] = useState(() => getStoredDict(language));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const pending = useRef(new Set());
  const cache = useRef(new Map());
  const timer = useRef();
  const active = useRef(language);
  const failed = useRef(false);
  const request = useRef();
  const isBusyRef = useRef(false);

  useEffect(() => {
    active.current = language;
    failed.current = false;
    pending.current.clear();
    clearTimeout(timer.current);
    timer.current = undefined;
    request.current?.abort();
    setError('');
    isBusyRef.current = false;
    setBusy(false);

    // Load from memory cache or persistent storage
    const stored = cache.current.get(language) || getStoredDict(language);
    cache.current.set(language, stored);
    setDictionary(stored);

    document.documentElement.lang = language;
    document.documentElement.dir = ['ur', 'sd'].includes(language) ? 'rtl' : 'ltr';

    try {
      localStorage.setItem('portal-language', language);
    } catch {}

    return () => {
      clearTimeout(timer.current);
      timer.current = undefined;
      request.current?.abort();
    };
  }, [language]);

  const scheduleBatch = () => {
    if (language === 'en' || failed.current || timer.current || isBusyRef.current) return;
    if (!pending.current.size) return;

    timer.current = setTimeout(async () => {
      timer.current = undefined;
      const target = language;
      if (active.current !== target || !pending.current.size) return;

      const texts = [];
      let length = 0;
      for (const text of pending.current) {
        if (texts.length >= 100 || length + text.length > 20000) break;
        texts.push(text);
        length += text.length;
      }
      texts.forEach(text => pending.current.delete(text));
      if (!texts.length) return;

      const controller = new AbortController();
      request.current = controller;
      isBusyRef.current = true;
      setBusy(true);

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target, texts }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Translation failed.');
        if (active.current !== target) return;

        const next = { ...(cache.current.get(target) || getStoredDict(target)) };
        texts.forEach((text, index) => {
          if (result.translations && typeof result.translations[index] === 'string') {
            let trans = result.translations[index];
            if (text.startsWith(' ') && !trans.startsWith(' ')) trans = ' ' + trans;
            if (text.endsWith(' ') && !trans.endsWith(' ')) trans = trans + ' ';
            next[text] = trans;
            next[text.trim()] = trans.trim();
          }
        });
        cache.current.set(target, next);
        setStoredDict(target, next);
        setDictionary(next);
      } catch (err) {
        if (err.name !== 'AbortError' && active.current === target) {
          setError(err.message || 'Translation unavailable.');
        }
      } finally {
        if (active.current === target) {
          isBusyRef.current = false;
          setBusy(false);
          // Automatically drain any queued texts that arrived during translation
          if (pending.current.size > 0 && !failed.current) {
            scheduleBatch();
          }
        }
      }
    }, 40);
  };

  const context = useMemo(() => {
    const collect = text => {
      if (language === 'en' || !eligible(text)) return;
      if (dictionary[text] !== undefined || dictionary[text.trim()] !== undefined) return;
      pending.current.add(text);
      scheduleBatch();
    };

    return {
      language,
      setLanguage,
      dictionary,
      collect,
      busy,
      error,
      retry: () => {
        failed.current = false;
        setError('');
        scheduleBatch();
      },
    };
  }, [language, dictionary, busy, error]);

  return React.createElement(TranslationContext.Provider, { value: context }, children);
}

// React renders translated text itself; form values and stored records stay untouched.
function TranslatedElement({ element, children, ...props }) {
  const context = useContext(TranslationContext);
  const skip = props.translate === 'no' || ['script', 'style', 'code', 'pre'].includes(element);
  const texts = [];

  const translate = text => {
    if (!context || skip || !eligible(text)) return text;
    texts.push(text);
    if (context.language === 'en') return text;
    const dict = context.dictionary || {};
    if (dict[text] !== undefined) return dict[text];
    const trimmed = text.trim();
    if (dict[trimmed] !== undefined) {
      let val = dict[trimmed];
      if (text.startsWith(' ') && !val.startsWith(' ')) val = ' ' + val;
      if (text.endsWith(' ') && !val.endsWith(' ')) val = val + ' ';
      return val;
    }
    return text;
  };

  const translatedChildren = React.Children.map(children, child =>
    typeof child === 'string' ? translate(child) : child
  );

  const attributes = { ...props };
  for (const name of ['placeholder', 'title', 'aria-label', 'alt']) {
    if (attributes[name]) attributes[name] = translate(attributes[name]);
  }

  // A translated option label must not change the submitted value.
  if (element === 'option' && attributes.value === undefined && typeof children === 'string') {
    attributes.value = children;
  }

  const signature = JSON.stringify(texts);
  useEffect(() => {
    texts.forEach(text => context?.collect(text));
  }, [context, signature]);

  return React.createElement(element, attributes, translatedChildren);
}

export function translatedJsx(type, props, ...children) {
  if (typeof type !== 'string') return React.createElement(type, props, ...children);
  return React.createElement(TranslatedElement, { ...props, element: type }, ...children);
}

export function LanguageSelector() {
  const context = useContext(TranslationContext);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        containerRef.current?.querySelector('button.language-globe')?.focus();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const currentLabel = languages.find(([code]) => code === context.language)?.[1] || 'English';

  const selectLanguage = code => {
    context.setLanguage(code);
    setOpen(false);
  };

  return React.createElement(
    'div',
    { ref: containerRef, className: `language-control${open ? ' is-open' : ''}`, translate: 'no' },
    React.createElement(
      'button',
      {
        type: 'button',
        className: `language-globe${context.busy ? ' is-translating' : ''}${open ? ' active' : ''}`,
        'aria-label': `Language: ${currentLabel}`,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        title: context.busy ? 'Translating content…' : `Language: ${currentLabel}`,
        onClick: () => setOpen(prev => !prev),
      },
      context.busy
        ? React.createElement(Loader2, { size: 20, className: 'globe-spinner', 'aria-hidden': true })
        : React.createElement(Globe2, { size: 20, 'aria-hidden': true })
    ),
    open &&
      React.createElement(
        'div',
        { className: 'language-panel', role: 'dialog', 'aria-label': 'Select language' },
        React.createElement(
          'div',
          { className: 'language-panel-header' },
          React.createElement('span', null, 'Language'),
          context.busy &&
            React.createElement(
              'span',
              { className: 'language-panel-translating' },
              React.createElement(Loader2, { size: 12, className: 'globe-spinner' }),
              ' Translating…'
            )
        ),
        React.createElement(
          'div',
          { className: 'language-list', role: 'listbox', 'aria-label': 'Available languages' },
          languages.map(([code, label]) => {
            const isSelected = context.language === code;
            return React.createElement(
              'button',
              {
                key: code,
                type: 'button',
                role: 'option',
                'aria-selected': isSelected,
                className: `language-option-btn${isSelected ? ' is-selected' : ''}`,
                onClick: () => selectLanguage(code),
              },
              React.createElement('span', { className: 'language-option-text' }, label),
              isSelected && React.createElement(Check, { size: 15, className: 'language-check-icon' })
            );
          })
        ),
        context.busy &&
          React.createElement(
            'small',
            { role: 'status', className: 'translation-busy-status' },
            React.createElement(Loader2, { size: 14, className: 'globe-spinner' }),
            ' Translating page content…'
          ),
        context.error &&
          React.createElement(
            'small',
            { role: 'alert', className: 'translation-error' },
            context.error,
            ' ',
            React.createElement(
              'button',
              { type: 'button', onClick: context.retry, className: 'translation-retry-btn' },
              React.createElement(RotateCw, { size: 12 }),
              ' Retry'
            )
          )
      )
  );
}
