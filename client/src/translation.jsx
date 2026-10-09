import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { languages } from './languages.js';
import { Globe2 } from 'lucide-react';

const TranslationContext = createContext(null);
const eligible = text => typeof text === 'string' && /\p{L}/u.test(text) && text.length <= 10000 && !/^(?:https?:\/\/|CVE-\d{4}-\d+|\S+@\S+|\/api\/)/i.test(text.trim());
const preference = () => { try { const saved = localStorage.getItem('portal-language'); return languages.some(([code]) => code === saved) ? saved : 'en'; } catch { return 'en'; } };

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(preference);
  const [dictionary, setDictionary] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(new Set());
  const cache = useRef(new Map());
  const timer = useRef();
  const active = useRef(language);
  const failed = useRef(false);
  const request = useRef();
  useEffect(() => {
    active.current = language;
    failed.current = false;
    pending.current.clear();
    clearTimeout(timer.current); timer.current = undefined;
    request.current?.abort();
    setError(''); setBusy(false);
    setDictionary(cache.current.get(language) || {});
    document.documentElement.lang = language;
    document.documentElement.dir = ['ur', 'sd'].includes(language) ? 'rtl' : 'ltr';
    try { localStorage.setItem('portal-language', language); } catch { /* Storage can be disabled. */ }
    return () => { clearTimeout(timer.current); timer.current = undefined; request.current?.abort(); };
  }, [language]);
  const context = useMemo(() => {
    const collect = text => {
      if (language === 'en' || !eligible(text) || dictionary[text] !== undefined || failed.current) return;
      pending.current.add(text);
      if (timer.current || busy) return;
      timer.current = setTimeout(async () => {
        timer.current = undefined;
        const target = language;
        if (active.current !== target) return;
        const texts = [];
        let length = 0;
        for (const text of pending.current) {
          if (texts.length >= 100 || length + text.length > 20000) break;
          texts.push(text); length += text.length;
        }
        texts.forEach(text => pending.current.delete(text));
        if (!texts.length) return;
        const controller = new AbortController(); request.current = controller;
        setBusy(true);
        try {
          const response = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, texts }), signal: controller.signal });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Translation failed.');
          if (active.current !== target) return;
          const next = { ...(cache.current.get(target) || {}) };
          texts.forEach((text, index) => { next[text] = result.translations[index]; });
          cache.current.set(target, next); setDictionary(next);
        } catch (err) {
          if (err.name !== 'AbortError' && active.current === target) { failed.current = true; setError(err.message); }
        } finally { if (active.current === target) setBusy(false); }
      }, 80);
    };
    return { language, setLanguage, dictionary, collect, busy, error, retry: () => { failed.current = false; setError(''); } };
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
    return context.language === 'en' ? text : context.dictionary[text] ?? text;
  };
  const translatedChildren = React.Children.map(children, child => typeof child === 'string' ? translate(child) : child);
  const attributes = { ...props };
  for (const name of ['placeholder', 'title', 'aria-label', 'alt']) if (attributes[name]) attributes[name] = translate(attributes[name]);
  // A translated option label must not change the submitted value.
  if (element === 'option' && attributes.value === undefined && typeof children === 'string') attributes.value = children;
  const signature = JSON.stringify(texts);
  useEffect(() => { texts.forEach(text => context?.collect(text)); }, [context, signature]);
  return React.createElement(element, attributes, translatedChildren);
}

export function translatedJsx(type, props, ...children) {
  if (typeof type !== 'string') return React.createElement(type, props, ...children);
  return React.createElement(TranslatedElement, { ...props, element: type }, ...children);
}

export function LanguageSelector() {
  const context = useContext(TranslationContext);
  const menu = useRef(null);
  useEffect(() => {
    const closeOutside = event => { if (menu.current && !menu.current.contains(event.target)) menu.current.open = false; };
    const closeOnEscape = event => { if (event.key === 'Escape' && menu.current?.open) { menu.current.open = false; menu.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, []);
  return React.createElement('details', { ref: menu, className: 'language-control', translate: 'no' },
    React.createElement('summary', { className: 'language-globe', 'aria-label': 'Choose language', title: 'Choose language' }, React.createElement(Globe2, { size: 22, 'aria-hidden': true })),
    React.createElement('div', { className: 'language-panel' },
    React.createElement('label', null, React.createElement('span', null, 'Language'),
      React.createElement('select', { 'aria-label': 'Portal language', value: context.language, onChange: event => context.setLanguage(event.target.value) },
        languages.map(([code, label]) => React.createElement('option', { key: code, value: code }, label)))),
    context.busy && React.createElement('small', { role: 'status' }, 'Translating…'),
    context.error && React.createElement('small', { role: 'alert', className: 'translation-error' }, context.error, React.createElement('button', { type: 'button', onClick: context.retry }, 'Retry'))));
}
