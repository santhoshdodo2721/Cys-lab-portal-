import React, { useEffect, useId, useRef, useState } from 'react';
import { RotateCw, FlipHorizontal, Upload, X, Pencil } from 'lucide-react';
import { translatedJsx } from './translation.jsx';
import { defaultEdits, encodeImage, formatSize, readImage, renderImage } from './image-editor.js';

const LIMIT = 5 * 1024 * 1024;
export default function UploadField({ label, value, onChange, accept, onBusy }) {
  const [source, setSource] = useState(null), [edits, setEdits] = useState(defaultEdits);
  const [prepared, setPrepared] = useState(null), [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0), [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const inputId = useId(), input = useRef(null), request = useRef(null), loader = useRef(null);
  const mounted = useRef(true), notify = useRef(onBusy);
  notify.current = onBusy;
  const active = Boolean(source) || loading || busy;
  useEffect(() => { if (active) { notify.current(1); return () => notify.current(-1); } }, [active]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); loader.current?.abort(); }; }, []);
  useEffect(() => {
    if (!source?.image) { setPrepared(source?.blob || null); setPreview(''); return; }
    let cancelled = false, url;
    setPrepared(null); setError('');
    try {
      const canvas = renderImage(source.image, edits);
      encodeImage(canvas, edits.quality).then(blob => {
        if (cancelled) return;
        url = URL.createObjectURL(blob); setPreview(url); setPrepared(blob);
      }).catch(err => { if (!cancelled) setError(err.message); });
    } catch (err) { setError(err.message); }
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [source, edits]);

  const openFile = async (blob, name) => {
    const imageFile = blob.type.startsWith('image/');
    if (!accept.split(',').includes(blob.type)) throw new Error('Choose a PNG, JPEG, WebP image or an accepted PDF.');
    if (blob.size > (imageFile ? 20 * 1024 * 1024 : LIMIT)) throw new Error(imageFile ? 'Choose an image up to 20 MB. It will be resized before upload.' : 'Choose a PDF up to 5 MB.');
    const image = imageFile ? await readImage(blob) : null;
    if (!mounted.current) return;
    setEdits({ ...defaultEdits }); setSource({ blob, name, image }); setMessage('');
  };
  const choose = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setError(''); setLoading(true);
    try { await openFile(file, file.name); } catch (err) { if (mounted.current) setError(err.message); }
    finally { if (mounted.current) setLoading(false); }
  };
  const editExisting = async () => {
    setError(''); setLoading(true);
    const controller = new AbortController(); loader.current = controller;
    try {
      const response = await fetch(value, { credentials: 'include', signal: controller.signal });
      if (!response.ok) throw new Error('Could not load the uploaded image. Please try again.');
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('PDF certificates can be replaced using Choose file. Image certificates support editing.');
      await openFile(blob, 'Uploaded image');
    } catch (err) { if (mounted.current && err.name !== 'AbortError') setError(err.message); }
    finally { if (mounted.current) setLoading(false); }
  };
  const discard = () => { setSource(null); setPrepared(null); setError(''); };
  const upload = () => {
    if (!prepared || busy) return;
    if (prepared.size > LIMIT) { setError('The prepared image exceeds 5 MB. Reduce its size or quality before uploading.'); return; }
    setBusy(true); setProgress(0); setError(''); setMessage('');
    const xhr = new XMLHttpRequest(); request.current = xhr;
    xhr.open('POST', '/api/files'); xhr.withCredentials = true; xhr.timeout = 120000;
    xhr.setRequestHeader('Content-Type', prepared.type);
    xhr.upload.onprogress = event => { if (mounted.current && event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
    const finish = () => { if (mounted.current) setBusy(false); request.current = null; };
    xhr.onload = () => {
      if (!mounted.current) return;
      let data;
      try { data = JSON.parse(xhr.responseText); } catch { data = {}; }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) {
        onChange(data.url); setMessage('File uploaded. Save the entry to keep your changes.'); setSource(null);
      } else setError(data.error || 'Upload failed. Please try again.');
      finish();
    };
    xhr.onerror = () => { if (mounted.current) setError('Upload failed. Check your connection and try again.'); finish(); };
    xhr.ontimeout = () => { if (mounted.current) setError('The upload took too long. Reduce the file size or try again.'); finish(); };
    xhr.onabort = finish;
    xhr.send(prepared);
  };
  const change = (key, value) => setEdits(previous => ({ ...previous, [key]: value }));
  return <div className="upload-field">
    <label className="field" htmlFor={inputId}><span>{label}</span><input ref={input} id={inputId} type="file" accept={accept} onChange={choose} disabled={busy || loading}/></label>
    <small>{loading ? 'Opening image…' : 'Images up to 20 MB; prepared uploads and PDFs up to 5 MB.'}</small>
    {source && <section className="attachment-editor" aria-label="Attachment editor">
      <div className="attachment-editor-heading"><strong>{source.image ? 'Edit image' : 'Selected certificate'}</strong><button type="button" className="icon-button" onClick={discard} disabled={busy} aria-label="Cancel file selection"><X size={17}/></button></div>
      {source.image ? <>
        <div className="attachment-preview">{preview && <img src={preview} alt="Edited image preview"/>}</div>
        <div className="image-edit-buttons"><button type="button" className="button secondary" disabled={busy} onClick={() => change('rotation', (edits.rotation + 90) % 360)}><RotateCw size={16}/> Rotate</button><button type="button" className="button secondary" disabled={busy} onClick={() => change('flip', !edits.flip)}><FlipHorizontal size={16}/> Flip</button><button type="button" className="text-button" disabled={busy} onClick={() => setEdits({ ...defaultEdits })}>Reset edits</button></div>
        <fieldset disabled={busy} className="image-edit-controls">
          <label className="field"><span>Crop</span><select value={edits.crop} onChange={e => change('crop', e.target.value)}><option value="original">Full image</option><option value="square">Square</option><option value="landscape">Landscape (4:3)</option><option value="portrait">Portrait (3:4)</option></select></label>
          <label className="field"><span>Maximum image size</span><select value={edits.maxSize} onChange={e => change('maxSize', Number(e.target.value))}><option value="2400">2400 px · High detail</option><option value="1600">1600 px · Smaller file</option><option value="1200">1200 px · Fast upload</option></select></label>
          {edits.crop !== 'original' && <><label className="field"><span>Crop position: horizontal</span><input type="range" min="0" max="100" value={edits.horizontal} onChange={e => change('horizontal', Number(e.target.value))}/></label><label className="field"><span>Crop position: vertical</span><input type="range" min="0" max="100" value={edits.vertical} onChange={e => change('vertical', Number(e.target.value))}/></label></>}
          <label className="field"><span>Brightness ({edits.brightness}%)</span><input type="range" min="50" max="150" value={edits.brightness} onChange={e => change('brightness', Number(e.target.value))}/></label>
          <label className="field"><span>Quality ({edits.quality}%)</span><input type="range" min="60" max="100" value={edits.quality} onChange={e => change('quality', Number(e.target.value))}/></label>
        </fieldset>
      </> : <p className="selected-file-name">{source.name}</p>}
      <p className="prepared-file-size">Original: {formatSize(source.blob.size)}{prepared ? <> · Upload: {formatSize(prepared.size)}</> : ' · Preparing image…'}</p>
      {busy && <div className="upload-progress" role="status"><progress max="100" value={progress}/><span>{progress < 100 ? `Uploading ${progress}%` : 'Saving file…'}</span></div>}
      <div className="upload-actions"><button type="button" className="button primary" onClick={upload} disabled={busy || !prepared || prepared.size > LIMIT}><Upload size={16}/>{busy ? 'Uploading…' : 'Upload file'}</button><button type="button" className="text-button" onClick={discard} disabled={busy}>Cancel</button>{busy && <button type="button" className="text-button" onClick={() => request.current?.abort()}>Stop upload</button>}</div>
      {prepared?.size > LIMIT && <small className="error">Reduce image size or quality to get below 5 MB.</small>}
    </section>}
    {value && !source && <div className="upload-actions"><a href={value} target="_blank" rel="noopener noreferrer">View uploaded file</a><button type="button" className="text-button" disabled={busy || loading} onClick={editExisting}><Pencil size={14}/> Edit image</button><button type="button" className="text-button" disabled={busy || loading} onClick={() => { onChange(''); setMessage(''); }}>Remove</button></div>}
    {message && <small role="status">{message}</small>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}
