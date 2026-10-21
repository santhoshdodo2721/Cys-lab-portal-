import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, Award, BookOpen, Check, ChevronRight, CircleAlert, Code2, ExternalLink, Github, GripVertical, LockKeyhole, LogOut, Newspaper, Plus, Radar, Shield, ShieldCheck, Search, Trash2, Users, X } from 'lucide-react';
import './style.css';
import UploadField from './UploadField.jsx';
import { translatedJsx, LanguageSelector, TranslationProvider } from './translation.jsx';
import LandingAnimationCanvas from './LandingAnimationCanvas.jsx';

function formatExternalUrl(input) {
  if (!input) return '';
  const trimmed = String(input).trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

const tabs = [
  { key: 'projects', label: 'Projects', icon: Code2, singular: 'Project' },
  { key: 'cves', label: 'CVE', icon: Shield, singular: 'CVE' },
  { key: 'achievements', label: 'Achievements', icon: Award, singular: 'Achievement' }
];
const initial = { projects: [], cves: [], achievements: [] };
const empty = {
  projects: { name: '', shortDescription: '', fullDescription: '', domain: '', techStack: '', ip: '', githubUrl: '', teamName: '', members: [{ name: '', linkedinUrl: '' }], guide: { name: '', qualification: '', profileUrl: '' }, guides: [{ name: '', qualification: '', profileUrl: '' }], additionalMedia: '', mediaLinks: [] },
  cves: { applicationName: '', cveNumber: '', shortDescription: '', fullDescription: '', githubUrl: '', members: [{ name: '', linkedinUrl: '' }] },
  achievements: { photographUrl: '', eventName: '', eventType: 'CTF', prize: '', place: 1, description: '', members: [{ name: '', profileUrl: '' }] }
};
async function api(path, options = {}) {
  const res = await fetch('/api' + path, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed. Please try again.');
  return data;
}
function useDialog(onClose) { useEffect(() => { const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; const onKey = event => { if (event.key === 'Escape') onClose(); }; document.addEventListener('keydown', onKey); return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); }; }, [onClose]); }
function InstitutionMark() { return <div className="institution-mark"><img src="/siet-crest.jpg" alt="Sri Shakthi Institute of Engineering and Technology crest"/><span>Sri Shakthi Institute of<br/>Engineering and Technology</span></div>; }
function Link({ href, children, icon = false }) { if (!href) return null; return <a className="external-link" href={formatExternalUrl(href)} target="_blank" rel="noopener noreferrer">{children}{icon && <ExternalLink size={14}/>}</a>; }
function RankBadge({ place }) { const tone = place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : 'blue'; return <span className={`rank rank-${tone}`}>{({ 1: 'I', 2: 'II', 3: 'III' })[place] || String(place)} {place === 1 ? 'Gold' : place === 2 ? 'Silver' : place === 3 ? 'Bronze' : 'Place'}</span>; }
function MemberList({ members, title = 'Team members' }) {
  const validMembers = members?.filter(m => m && m.name && m.name.trim());
  if (!validMembers || validMembers.length === 0) return null;
  return <section className="detail-section"><h3><Users size={16}/>{title}</h3><div className="member-grid">{validMembers.map((m, i) => <div className="member" key={i}><span className="avatar">{(m.name || '?').slice(0, 1).toUpperCase()}</span><span>{m.name}{m.qualification && <small className="member-qualification">{m.qualification}</small>}{m.certificateUrl && <a className="certificate-link" href={m.certificateUrl} target="_blank" rel="noopener noreferrer">View certificate</a>}</span><Link href={m.linkedinUrl || m.profileUrl} icon><span className="linkedin">in</span></Link></div>)}</div></section>;
}
function Card({ kind, item, serialNumber, isDraggable, isDragging, isDragOver, onDragStart, onDragOver, onDragEnter, onDragLeave, onDrop, onDragEnd, onClick }) {
  const config = kind === 'projects' ? { title: item.name, short: item.shortDescription, kicker: item.domain, icon: Code2, type: 'Project' } : kind === 'cves' ? { title: item.cveNumber, short: item.shortDescription, kicker: item.applicationName || 'Vulnerability research', icon: Shield, type: 'CVE report' } : { title: item.eventName, short: item.description, kicker: item.eventType, icon: Award, type: 'Achievement' };
  const Icon = config.icon;
  return (
    <div
      className={`card card-${kind}${isDraggable ? ' is-draggable' : ''}${isDragging ? ' is-dragging' : ''}${isDragOver ? ' is-drag-over' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="card-top">
        <div className="card-top-left">
          {isDraggable && (
            <span className="card-drag-grip" title="Drag to rearrange order using cursor" onClick={e => e.stopPropagation()}>
              <GripVertical size={16} />
            </span>
          )}
          <span className="card-icon"><Icon size={21}/></span>
          {kind === 'projects' ? (
            <span className="card-type serial-label">S.No. {serialNumber}</span>
          ) : (
            <span className="card-type">{config.type}</span>
          )}
        </div>
        {kind === 'projects' && item.ip && (
          <a
            className="card-ip-link"
            href={formatExternalUrl(item.ip)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title={`Redirect to ${item.ip}`}
          >
            <ExternalLink size={12} />
            <span className="card-ip-text">{item.ip}</span>
          </a>
        )}
      </div>
      <div className="card-body">
        <span className="eyebrow">{config.kicker}</span>
        <h3>{config.title}</h3>
        <p>{config.short}</p>
        {kind === 'projects' && (() => {
          const guides = item.guides?.length ? item.guides : (item.guide?.name ? [item.guide] : []);
          if (!guides.length) return null;
          return (
            <div className="card-guides-container">
              {guides.map((g, gi) => (
                <div className="card-guide" key={gi}>
                  <span className="card-guide-label">{guides.length > 1 ? `Guide ${gi + 1}:` : 'Guide:'}</span>
                  <span className="card-guide-name">{g.name}</span>
                  {g.qualification && <span className="card-guide-qual">({g.qualification})</span>}
                  {g.profileUrl && (
                    <a
                      className="card-guide-link"
                      href={formatExternalUrl(g.profileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      title={`${g.name}'s profile`}
                    >
                      <span className="linkedin">in</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
      {kind === 'achievements' && <div className="card-meta"><RankBadge place={item.place}/><span>Prize pool: {item.prize}</span></div>}
      <div className="card-foot">
        <span>
          {kind === 'projects' && item.teamName ? (
            <span className="card-team-badge" title={`Team: ${item.teamName}`}>
              <Users size={13}/> {item.teamName}
              {item.members?.length ? ` · ${item.members.length} members` : ''}
            </span>
          ) : (
            `${item.members?.length || 0} ${(item.members?.length || 0) === 1 ? 'contributor' : 'contributors'}`
          )}
        </span>
        {kind === 'projects' && (item.additionalMedia || (item.mediaLinks && item.mediaLinks.length > 0)) && (
          <span className="card-media-badge" title={item.mediaLinks?.length ? `${item.mediaLinks.length} media report(s)` : "Additional media coverage"}>
            <Newspaper size={12}/> {item.mediaLinks?.length ? `${item.mediaLinks.length} media` : 'Media'}
          </span>
        )}
        {item.githubUrl && (
          <a
            className="card-repo-link"
            href={formatExternalUrl(item.githubUrl)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title="Open repository"
          >
            <Github size={13} />
            <span>Repository</span>
          </a>
        )}
        <span className="card-open">View details <ArrowRight size={16}/></span>
      </div>
    </div>
  );
}
function DetailModal({ kind, item, serialNumber, onClose, onEdit, onDelete, admin }) {
  useDialog(onClose);
  const isProject = kind === 'projects', isCve = kind === 'cves', title = isProject ? item.name : isCve ? item.cveNumber : item.eventName;
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <article className="detail-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-nav">
          <button className="text-button" onClick={onClose}><ArrowLeft size={17}/> Back to {tabs.find(t => t.key === kind).label}</button>
          <button className="icon-button" aria-label="Close" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="detail-content">
          <div className="detail-kicker">
            <span className="live-dot"/> Lab / {tabs.find(t => t.key === kind).label}
            {isProject && serialNumber ? ` · S.No. ${serialNumber}` : ''}
          </div>
          <div className="detail-heading">
            {kind === 'achievements' && <RankBadge place={item.place}/>}
            <h2>{title}</h2>
          </div>
          <p className="detail-description">{isProject || isCve ? item.fullDescription : item.description}</p>
          {isProject && (
            <>
              <div className="info-grid">
                <div><small>Domain</small><strong>{item.domain}</strong></div>
                <div><small>Tech stack</small><strong>{item.techStack?.join(' · ') || 'Not specified'}</strong></div>
                <div>
                  <small>IP address / link</small>
                  {item.ip ? (
                    <a
                      className="detail-ip-link external-link"
                      href={formatExternalUrl(item.ip)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Redirect to ${item.ip}`}
                    >
                      <strong>{item.ip}</strong> <ExternalLink size={14}/>
                    </a>
                  ) : (
                    <strong>Not specified</strong>
                  )}
                </div>
              </div>
              {item.teamName && (
                <div className="detail-team-banner">
                  <small>Team</small>
                  <strong><Users size={16}/> {item.teamName}</strong>
                </div>
              )}
              {item.githubUrl && (
                <section className="detail-section">
                  <h3><Github size={17}/> Repository</h3>
                  <Link href={formatExternalUrl(item.githubUrl)} icon>{item.githubUrl}</Link>
                </section>
              )}
              <MemberList members={item.members} title={item.teamName ? `Team members (${item.teamName})` : "Team members"}/>
              {(() => {
                const guides = item.guides?.length ? item.guides : (item.guide?.name ? [item.guide] : []);
                return guides.length > 0 ? (
                  <MemberList members={guides} title={guides.length > 1 ? "Project Guides" : "Project Guide"}/>
                ) : null;
              })()}
              {(item.additionalMedia || (item.mediaLinks && item.mediaLinks.length > 0)) && (
                <section className="detail-section detail-media-section">
                  <h3><Newspaper size={17}/> Additional media information</h3>
                  {item.additionalMedia && (
                    <p className="detail-media-text">{item.additionalMedia}</p>
                  )}
                  {item.mediaLinks && item.mediaLinks.length > 0 && (
                    <div className="media-links-grid">
                      {item.mediaLinks.map((media, idx) => (
                        <div className="media-link-card" key={idx}>
                          <div className="media-link-header">
                            <span className="media-link-title">{media.title || "Media coverage"}</span>
                            {media.platform && <span className="media-platform-tag">{media.platform}</span>}
                          </div>
                          {media.description && <p className="media-link-desc">{media.description}</p>}
                          {media.url && (
                            <a
                              className="external-link media-url-link"
                              href={formatExternalUrl(media.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span>{media.url}</span>
                              <ExternalLink size={13}/>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
          {isCve && (
            <>
              {item.applicationName && <section className="detail-section"><h3>Application name</h3><p>{item.applicationName}</p></section>}
              {item.githubUrl && (
                <section className="detail-section">
                  <h3><Github size={17}/> GitHub repository</h3>
                  <Link href={formatExternalUrl(item.githubUrl)} icon>{item.githubUrl}</Link>
                </section>
              )}
              <MemberList members={item.members} title="Members"/>
            </>
          )}
          {kind === 'achievements' && (
            <>
              {item.photographUrl && (
                <section className="detail-section">
                  <h3>Photograph</h3>
                  <img className="achievement-photo" src={item.photographUrl} alt={item.eventName}/>
                </section>
              )}
              <MemberList members={item.members} title="Team members"/>
            </>
          )}
          {admin && (
            <div className="admin-actions">
              <button className="button secondary" onClick={onEdit}>Edit entry</button>
              <button className="button danger" onClick={onDelete}><Trash2 size={16}/> Delete</button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
function Field({ label, value, onChange, type = 'text', required = true, placeholder = '' }) { return <label className="field"><span>{label}</span><input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}/></label>; }
function AdminForm({ kind, record, onClose, onSaved, eventNames = [] }) {
  useDialog(onClose);
  const [form, setForm] = useState(() => {
    if (!record) return structuredClone(empty[kind]);
    const guides = record.guides?.length
      ? record.guides.map(g => ({ name: g.name || '', qualification: g.qualification || '', profileUrl: g.profileUrl || '' }))
      : record.guide?.name
        ? [{ name: record.guide.name || '', qualification: record.guide.qualification || '', profileUrl: record.guide.profileUrl || '' }]
        : [{ name: '', qualification: '', profileUrl: '' }];
    return {
      ...record,
      teamName: record.teamName || '',
      techStack: record.techStack?.join(', ') || '',
      guides,
      guide: guides[0] || { name: '', qualification: '', profileUrl: '' },
      members: record.members?.length
        ? record.members
        : (record.teamName ? [] : [{ name: '', [kind === 'achievements' ? 'profileUrl' : 'linkedinUrl']: '' }]),
      additionalMedia: record.additionalMedia || '',
      mediaLinks: record.mediaLinks?.length
        ? record.mediaLinks.map(m => ({ title: m.title || '', url: m.url || '', platform: m.platform || '', description: m.description || '' }))
        : [],
      ...(kind === 'achievements' ? { eventType: record.eventType || '', place: record.place ?? '' } : {})
    };
  });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [uploading, setUploading] = useState(0);
  const [customEventType, setCustomEventType] = useState(Boolean(record?.eventType && !['CTF', 'Hackathon', 'Conference', 'Other'].includes(record.eventType)));
  const [customEventTypeValue, setCustomEventTypeValue] = useState(record?.eventType || '');
  const [customRank, setCustomRank] = useState(Boolean(record && ![1, 2, 3].includes(record.place)));
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const memberKey = kind === 'achievements' ? 'profileUrl' : 'linkedinUrl';
  const updateMember = (index, key, value) => setForm(f => ({ ...f, members: f.members.map((m, i) => i === index ? { ...m, [key]: value } : m) }));
  const updateGuide = (index, key, value) => setForm(f => ({ ...f, guides: (f.guides || []).map((g, i) => i === index ? { ...g, [key]: value } : g) }));
  const updateMediaLink = (index, key, value) => setForm(f => ({ ...f, mediaLinks: (f.mediaLinks || []).map((m, i) => i === index ? { ...m, [key]: value } : m) }));
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const validGuides = (form.guides || []).filter(g => g && g.name && g.name.trim()).map(g => ({
        name: g.name.trim(),
        qualification: g.qualification?.trim() || '',
        profileUrl: g.profileUrl?.trim() || ''
      }));
      const validMembers = (form.members || []).filter(m => m && m.name && m.name.trim()).map(m => ({
        name: m.name.trim(),
        [memberKey]: m[memberKey]?.trim() || '',
        ...(kind === 'achievements' && m.certificateUrl ? { certificateUrl: m.certificateUrl } : {})
      }));

      const hasTeamName = kind === 'projects' && Boolean(form.teamName?.trim());
      if (!hasTeamName && validMembers.length === 0) {
        throw new Error(kind === 'projects' ? 'Please provide either a team name or at least one team member.' : 'Please add at least one member with a name.');
      }

      const validMediaLinks = (form.mediaLinks || []).filter(m => m && ((m.title && m.title.trim()) || (m.url && m.url.trim()))).map(m => ({
        title: m.title?.trim() || m.url?.trim() || 'Media report',
        url: m.url?.trim() || '',
        platform: m.platform?.trim() || '',
        description: m.description?.trim() || ''
      }));

      const payload = {
        ...form,
        members: validMembers,
        ...(kind === 'projects' ? {
          teamName: form.teamName?.trim() || '',
          techStack: typeof form.techStack === 'string' ? form.techStack.split(',').map(x => x.trim()).filter(Boolean) : (form.techStack || []),
          guides: validGuides,
          guide: validGuides[0] || undefined,
          additionalMedia: form.additionalMedia?.trim() || '',
          mediaLinks: validMediaLinks
        } : {})
      };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      await api(`/${kind}${record ? '/' + record._id : ''}`, { method: record ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="form-modal" role="dialog" aria-modal="true" aria-label={`${record ? 'Edit' : 'Add'} ${kind}`}>
        <div className="modal-nav">
          <span className="form-kicker">Content management</span>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={20}/></button>
        </div>
        <form onSubmit={submit}>
          <h2>{record ? 'Edit' : 'Add new'} {tabs.find(t => t.key === kind).singular}</h2>
          <p className="form-intro">This entry will be visible to all visitors as soon as it is saved.</p>
          <div className="form-fields">
            {kind === 'projects' && (
              <>
                <Field label="Project name" value={form.name} onChange={v => set('name', v)}/>
                <TextArea label="Description" value={form.fullDescription} onChange={v => set('fullDescription', v)}/>
                <div className="form-row">
                  <Field label="Domain" value={form.domain} onChange={v => set('domain', v)}/>
                  <Field label="Tech stack (optional, comma-separated)" value={form.techStack} onChange={v => set('techStack', v)} required={false}/>
                </div>
                <div className="form-row">
                  <Field label="IP address / link (optional)" value={form.ip} onChange={v => set('ip', v)} required={false} placeholder="e.g. 192.168.1.100:3000 or https://..."/>
                  <Field label="GitHub URL (optional)" required={false} type="url" value={form.githubUrl} onChange={v => set('githubUrl', v)}/>
                </div>
                <Field
                  label="Team name (optional — if provided, team members can be omitted for teams > 10)"
                  value={form.teamName}
                  onChange={v => set('teamName', v)}
                  required={false}
                  placeholder="e.g. Cyber Squad Alpha / CYS Batch 2026"
                />
              </>
            )}
            {kind === 'cves' && (
              <>
                <Field label="Application name" value={form.applicationName} onChange={v => set('applicationName', v)}/>
                <Field label="CVE number" value={form.cveNumber} onChange={v => set('cveNumber', v)} placeholder="CVE-2025-12345"/>
                <TextArea label="Description" value={form.fullDescription} onChange={v => set('fullDescription', v)}/>
                <Field label="GitHub repository URL (optional)" type="url" required={false} value={form.githubUrl} onChange={v => set('githubUrl', v)}/>
              </>
            )}
            {kind === 'achievements' && (
              <>
                <Field label="Event name" value={form.eventName} onChange={v => set('eventName', v)}/>
                <div className="form-row">
                  <label className="field"><span>Event type</span>
                    <select required value={customEventType ? '__custom' : form.eventType} onChange={e => { const custom = e.target.value === '__custom'; setCustomEventType(custom); set('eventType', custom ? customEventTypeValue : e.target.value); }}>
                      <option value="" disabled>Select event type</option>
                      {['CTF', 'Hackathon', 'Conference', 'Other'].map(x => <option key={x}>{x}</option>)}
                      <option value="__custom">Custom</option>
                    </select>
                  </label>
                  <label className="field"><span>Place / rank</span>
                    <select required value={customRank ? '__custom' : form.place} onChange={e => { setCustomRank(e.target.value === '__custom'); set('place', e.target.value === '__custom' ? '' : Number(e.target.value)); }}>
                      <option value="" disabled>Select rank</option>
                      <option value="1">I</option>
                      <option value="2">II</option>
                      <option value="3">III</option>
                      <option value="__custom">Custom</option>
                    </select>
                  </label>
                </div>
                {customEventType && <Field label="Custom event type" value={form.eventType} onChange={v => { setCustomEventTypeValue(v); set('eventType', v); }} placeholder="Enter event type"/>}
                {customRank && <Field label="Custom rank" value={form.place} onChange={v => set('place', v)} placeholder="e.g. Finalist or 4th place"/>}
                <Field label="Prize pool" value={form.prize} onChange={v => set('prize', v)}/>
                <TextArea label="Description" value={form.description} onChange={v => set('description', v)}/>
                <UploadField label="Photograph (optional)" value={form.photographUrl} onChange={v => set('photographUrl', v)} accept="image/png,image/jpeg,image/webp" onBusy={delta => setUploading(n => n + delta)}/>
              </>
            )}
            <div className="repeater-head">
              <h3>Team members {kind === 'projects' && form.teamName?.trim() ? <span className="sub-tag">(optional when team name is set)</span> : null}</h3>
              <button type="button" className="text-button accent" onClick={() => set('members', [...(form.members || []), { name: '', [memberKey]: '' }])}><Plus size={16}/> Add member</button>
            </div>
            {kind === 'projects' && form.teamName?.trim() && (!form.members || form.members.length === 0) && (
              <p className="form-hint">Team name "{form.teamName.trim()}" is set. Individual team members are optional.</p>
            )}
            {(form.members || []).map((m, i) => (
              <div className="member-form-row" key={i}>
                <Field
                  label={`Member ${i + 1} name`}
                  value={m.name}
                  onChange={v => updateMember(i, 'name', v)}
                  required={!(kind === 'projects' && form.teamName?.trim())}
                  placeholder={kind === 'projects' && form.teamName?.trim() ? "Optional member name" : ""}
                />
                <Field label="LinkedIn URL (optional)" required={false} type="url" value={m[memberKey]} onChange={v => updateMember(i, memberKey, v)}/>
                {kind === 'achievements' && <UploadField label="Certificate (optional)" value={m.certificateUrl} onChange={v => updateMember(i, 'certificateUrl', v)} accept="application/pdf,image/png,image/jpeg,image/webp" onBusy={delta => setUploading(n => n + delta)}/>}
                <button
                  type="button"
                  className="icon-button remove-member"
                  aria-label="Remove member"
                  disabled={uploading > 0 || (!(kind === 'projects' && form.teamName?.trim()) && (form.members || []).length <= 1)}
                  onClick={() => set('members', form.members.filter((_, n) => n !== i))}
                >
                  <X size={17}/>
                </button>
              </div>
            ))}
            {kind === 'projects' && (
              <>
                <div className="repeater-head">
                  <h3>Project Guides</h3>
                  <button
                    type="button"
                    className="text-button accent"
                    onClick={() => set('guides', [...(form.guides || []), { name: '', qualification: '', profileUrl: '' }])}
                  >
                    <Plus size={16}/> Add guide
                  </button>
                </div>
                {(form.guides || [{ name: '', qualification: '', profileUrl: '' }]).map((g, i) => (
                  <div className="member-form-row guide-form-row" key={i}>
                    <Field
                      label={`Guide ${i + 1} name`}
                      value={g.name}
                      onChange={v => updateGuide(i, 'name', v)}
                      required={false}
                      placeholder="e.g. Dr. K. Ramanathan"
                    />
                    <Field
                      label="Qualification (optional)"
                      required={false}
                      value={g.qualification}
                      onChange={v => updateGuide(i, 'qualification', v)}
                      placeholder="e.g. Ph.D, Associate Professor"
                    />
                    <Field
                      label="Guide LinkedIn URL (optional)"
                      required={false}
                      type="url"
                      value={g.profileUrl}
                      onChange={v => updateGuide(i, 'profileUrl', v)}
                      placeholder="https://www.linkedin.com/in/..."
                    />
                    <button
                      type="button"
                      className="icon-button remove-member"
                      aria-label="Remove guide"
                      disabled={(form.guides || []).length <= 1}
                      onClick={() => set('guides', (form.guides || []).filter((_, n) => n !== i))}
                    >
                      <X size={17}/>
                    </button>
                  </div>
                ))}
                <div className="repeater-head" style={{ marginTop: '22px' }}>
                  <h3>Additional media information <span className="sub-tag">(optional)</span></h3>
                  <button
                    type="button"
                    className="text-button accent"
                    onClick={() => set('mediaLinks', [...(form.mediaLinks || []), { title: '', url: '', platform: '', description: '' }])}
                  >
                    <Plus size={16}/> Add media link / report
                  </button>
                </div>
                <TextArea
                  label="Information posted on various sites & reports (optional)"
                  value={form.additionalMedia}
                  onChange={v => set('additionalMedia', v)}
                  required={false}
                  placeholder="Summary of external coverage, articles, reports, or details posted across various sites..."
                />
                {(form.mediaLinks || []).map((m, i) => (
                  <div className="member-form-row media-form-row" key={i}>
                    <Field
                      label={`Media #${i + 1} title / site name`}
                      value={m.title}
                      onChange={v => updateMediaLink(i, 'title', v)}
                      required={false}
                      placeholder="e.g. Featured in TechPortal / Project Report"
                    />
                    <Field
                      label="Report / site URL"
                      type="url"
                      value={m.url}
                      onChange={v => updateMediaLink(i, 'url', v)}
                      required={false}
                      placeholder="https://..."
                    />
                    <Field
                      label="Platform (optional)"
                      value={m.platform}
                      onChange={v => updateMediaLink(i, 'platform', v)}
                      required={false}
                      placeholder="e.g. Medium / News / Blog / Report"
                    />
                    <button
                      type="button"
                      className="icon-button remove-member"
                      aria-label="Remove media item"
                      onClick={() => set('mediaLinks', form.mediaLinks.filter((_, n) => n !== i))}
                    >
                      <X size={17}/>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
          {error && <p className="error"><CircleAlert size={16}/>{error}</p>}
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button className="button primary" disabled={busy || uploading > 0}>{uploading > 0 ? 'Uploading…' : busy ? 'Saving…' : 'Save entry'}<Check size={16}/></button>
          </div>
        </form>
      </section>
    </div>
  );
}
function ManagePanel({ kind, items, onClose, onAdd, onEdit, onDelete, onReorder }) {
  useDialog(onClose);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const label = tabs.find(t => t.key === kind).label;
  const title = item => kind === 'projects' ? item.name : kind === 'cves' ? item.cveNumber : item.eventName;
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="manage-modal" role="dialog" aria-modal="true" aria-label={`Manage ${label}`}>
        <div className="modal-nav">
          <span className="form-kicker">Admin / Content management</span>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={20}/></button>
        </div>
        <div className="manage-content">
          <div className="manage-heading">
            <div>
              <h2>Manage {label}</h2>
              <p>{items.length} published {items.length === 1 ? 'entry' : 'entries'} · Drag rows to arrange order</p>
            </div>
            <button className="button primary" onClick={onAdd}><Plus size={16}/> Add {tabs.find(t => t.key === kind).singular}</button>
          </div>
          {items.length ? (
            <div className="manage-list">
              {items.map((item, idx) => (
                <div
                  className={`manage-row${draggedId === item._id ? ' is-dragging' : ''}${dragOverId === item._id ? ' is-drag-over' : ''}`}
                  key={item._id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', item._id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedId(item._id);
                  }}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverId !== item._id) setDragOverId(item._id); }}
                  onDragLeave={() => { if (dragOverId === item._id) setDragOverId(null); }}
                  onDrop={e => {
                    e.preventDefault();
                    const sourceId = e.dataTransfer.getData('text/plain') || draggedId;
                    if (sourceId && sourceId !== item._id && onReorder) {
                      onReorder(sourceId, item._id);
                    }
                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                >
                  <div className="manage-row-main">
                    <span className="manage-drag-grip" title="Drag to reorder using cursor"><GripVertical size={16}/></span>
                    <span className="manage-sno">#{idx + 1}</span>
                    <div>
                      <strong>{title(item)}</strong>
                      <small>
                        {kind === 'achievements'
                          ? item.eventType
                          : kind === 'projects'
                            ? (() => {
                                const teamPrefix = item.teamName ? `Team: ${item.teamName} · ` : '';
                                const guides = item.guides?.length ? item.guides : (item.guide?.name ? [item.guide] : []);
                                const guidePrefix = guides.length ? `${guides.length > 1 ? 'Guides' : 'Guide'}: ${guides.map(g => g.name).join(', ')} · ` : '';
                                return teamPrefix + guidePrefix + item.shortDescription;
                              })()
                            : item.shortDescription}
                      </small>
                    </div>
                  </div>
                  <div className="manage-row-actions">
                    <button className="button secondary" onClick={() => onEdit(item)}>Edit</button>
                    <button className="icon-button manage-delete" onClick={() => onDelete(item)} aria-label={`Delete ${title(item)}`} title="Delete"><Trash2 size={17}/></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="manage-empty">No entries in this section yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
function TextArea({ label, value, onChange }) { return <label className="field"><span>{label}</span><textarea value={value} onChange={e => onChange(e.target.value)} rows="4" required/></label>; }
function PublicHeader() {
  return <header className="login-header"><a className="brand" href="/" style={{ textDecoration: 'none' }}><span className="brand-mark"><img src="/incognitrix-logo.png" alt="Cyber Research Lab logo"/></span><span>Lab<span className="brand-accent"> Portal</span><small>Cyber Research Lab</small></span></a><InstitutionMark/><LanguageSelector/></header>;
}
function PublicNavigation({ current, onNavigate }) {
  return <nav className="landing-nav" aria-label="Public content">{['projects', 'cves', 'achievements'].map(key => { const section = tabs.find(t => t.key === key); return <a key={key} href={'/' + key} aria-current={current === key ? 'page' : undefined} onClick={event => { if (onNavigate && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onNavigate('/' + key); } }}><section.icon size={18}/>{key === 'cves' ? 'CVE' : section.singular}</a>; })}</nav>;
}
function Login({ onLogin, onBack, onNavigate, landing = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { user } = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      onLogin(user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <div className={`login-page${landing ? " landing-page-active" : ""}`}>
    {landing ? (
      <LandingAnimationCanvas />
    ) : (
      <img className="login-background-logo" src="/incognitrix-emblem.png" alt="" aria-hidden="true"/>
    )}
    <PublicHeader/>
    <PublicNavigation onNavigate={onNavigate}/>
    <main className={`login-main${landing ? " public-landing-main" : ""}`}>
      <div className="login-context">
        <div className="landing-emblem-container">
          <div className="landing-emblem-halo" />
          <img className="login-context-logo landing-animated-logo" src="/incognitrix-emblem.png" alt="Cyber Research Lab emblem"/>
        </div>
        <span className="login-context-label">
          SIET Cloud Computing and Cyber Security Research Lab
        </span>
        <h1 className="lab-name">Cyber Research Lab</h1>
        <p>Projects, vulnerability reports, and competition results from our student teams at Sri Shakthi Institute of Engineering and Technology.</p>
      </div>
      {!landing && <section className="login-panel" aria-labelledby="login-title">
        {!landing && <button className="text-button" onClick={onBack}><ArrowLeft size={17}/> Back to home</button>}
        <h2 id="login-title">Admin sign in</h2>
        <p>Sign in to manage the lab’s published content.</p>
        <form onSubmit={submit}>
          <label className="field"><span>Email address</span><input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@college.edu"/></label>
          <label className="field"><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password"/></label>
          {error && <p className="error"><CircleAlert size={16}/>{error}</p>}
          <button className="button primary login-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<ArrowRight size={17}/></button>
        </form>
        <p className="login-help">Need access? Contact the lab administrator.</p>
      </section>}
    </main>
    <footer className="login-footer">Cyber Research Lab · Sri Shakthi Institute of Engineering and Technology</footer>
  </div>;
}
function DashboardMenu({ user, tab, onSelect, onLogout, adminPage, onNavigate }) {
  return <details className="dashboard-menu" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary').focus(); } }}>
    <summary aria-label="Dashboard navigation"><span/><span/><span/></summary>
    <nav aria-label="Dashboard menu">
      {user && <div className="menu-account"><div className="menu-avatar">{user.name.slice(0, 1).toUpperCase()}</div><div className="menu-account-name"><strong>{user.name}</strong><small>{user?.role === 'admin' ? 'Administrator' : 'Viewer access'}</small></div><span className="account-role">{user?.role === 'admin' ? 'Admin' : 'Viewer'}</span></div>}
      {tabs.map(section => <button key={section.key} aria-current={tab === section.key ? 'page' : undefined} onClick={event => { onSelect(section.key); event.currentTarget.closest('details').open = false; }}>{section.label}</button>)}
      <button onClick={() => onNavigate(adminPage ? "/projects" : "/lab-portal/admin")}>{adminPage ? "View public site" : "Admin panel"}</button>
      <button onClick={() => onNavigate("/")}>Home</button>
      {user && <button className="dashboard-menu-logout" onClick={onLogout}>Log out</button>}
    </nav>
  </details>;
}
function App() {
  const [adminLogin, setAdminLogin] = useState(window.location.pathname.replace(/\/$/, '') === '/lab-portal/admin');
  const [landing, setLanding] = useState(window.location.pathname === '/');
  const [adminPage, setAdminPage] = useState(['/lab-portal/admin', '/lab-portal/admin/dashboard'].includes(window.location.pathname.replace(/\/$/, '')));
  const navigate = path => {
    window.history.pushState({}, '', path);
    setAdminPage(['/lab-portal/admin', '/lab-portal/admin/dashboard'].includes(path));
    setAdminLogin(path === '/lab-portal/admin');
    setLanding(path === '/');
    if (tabs.some(t => '/' + t.key === path)) setTab(path.slice(1));
    setDetail(null);
    setEditing(null);
    setManage(false);
    setQuery('');
  };
  useEffect(() => {
    const onPop = () => {
      setLanding(window.location.pathname === '/');
      if (tabs.some(t => '/' + t.key === window.location.pathname)) setTab(window.location.pathname.slice(1));
      setAdminPage(['/lab-portal/admin', '/lab-portal/admin/dashboard'].includes(window.location.pathname.replace(/\/$/, '')));
      setAdminLogin(window.location.pathname.replace(/\/$/, '') === '/lab-portal/admin');
      setDetail(null);
      setEditing(null);
      setManage(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [user, setUser] = useState(undefined);
  const [tab, setTab] = useState(() => tabs.find(t => '/' + t.key === window.location.pathname)?.key || 'projects');
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [manage, setManage] = useState(false);
  const [query, setQuery] = useState('');
  const [cveOrder, setCveOrder] = useState('latest');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    api('/auth/me').then(r => setUser(r.user)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api('/' + tab).then(items => {
      if (active) setData(d => ({ ...d, [tab]: items }));
    }).catch(e => {
      if (active) setError(e.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    const events = new EventSource('/api/events', { withCredentials: true });
    events.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.kind === tab) api('/' + tab).then(items => setData(d => ({ ...d, [tab]: items }))).catch(() => {});
    };
    return () => events.close();
  }, [tab]);

  const refresh = async () => {
    setEditing(null);
    setDetail(null);
    setLoading(true);
    try {
      const items = await api('/' + tab);
      setData(d => ({ ...d, [tab]: items }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (sourceId, targetId) => {
    if (user?.role !== 'admin') return;
    const currentList = [...data[tab]];
    const sourceIndex = currentList.findIndex(x => x._id === sourceId);
    const targetIndex = currentList.findIndex(x => x._id === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const [moved] = currentList.splice(sourceIndex, 1);
    currentList.splice(targetIndex, 0, moved);

    setData(d => ({ ...d, [tab]: currentList }));

    try {
      await api(`/${tab}/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ ids: currentList.map(x => x._id) })
      });
    } catch (err) {
      console.error('Failed to persist order:', err);
    }
  };

  const removeRecord = async item => {
    if (user?.role !== 'admin') return;
    if (!window.confirm(`Delete ${tab === 'projects' ? item.name : tab === 'cves' ? item.cveNumber : item.eventName}? This cannot be undone.`)) return;
    try {
      await api(`/${tab}/${item._id}`, { method: 'DELETE' });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = () => removeRecord(detail);
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    navigate('/');
  };

  if (landing) return <Login landing onNavigate={navigate} onLogin={account => { setUser(account); navigate('/lab-portal/admin/dashboard'); }} onBack={() => navigate('/')}/>;
  if (adminPage && !adminLogin && user === undefined) return <div className="boot"><ShieldCheck size={35}/> Loading Lab Portal…</div>;
  if (adminPage && (adminLogin || user?.role !== 'admin')) return <Login onNavigate={navigate} onLogin={account => { setUser(account); navigate('/lab-portal/admin/dashboard'); }} onBack={() => navigate('/')}/>;

  const isAdmin = user?.role === 'admin';
  const canReorder = isAdmin && !query;
  const current = tabs.find(t => t.key === tab);
  const visibleItems = data[tab].filter(item => [item.name, item.applicationName, item.cveNumber, item.eventName, item.shortDescription, item.description, item.domain, item.eventType].some(value => String(value || '').toLowerCase().includes(query.toLowerCase())));
  if (tab === 'cves') visibleItems.sort((a, b) => {
    const timestamp = item => {
      const value = Date.parse(item.createdAt);
      return Number.isFinite(value) ? value : 0;
    };
    return cveOrder === 'latest' ? timestamp(b) - timestamp(a) : timestamp(a) - timestamp(b);
  });

  return (
    <div className={`login-page public-archive${adminPage ? " admin-archive" : ""}`}>
      <img className="login-background-logo" src="/incognitrix-emblem.png" alt="" aria-hidden="true"/>
      <PublicHeader/>
      <main className="main">
        <PublicNavigation current={tab} onNavigate={path => {
          if (adminPage) {
            setTab(path.slice(1));
            setDetail(null);
            setEditing(null);
            setManage(false);
            setQuery('');
          } else navigate(path);
        }}/>
        {adminPage && (
          <div className="admin-session-bar">
            <span><ShieldCheck size={16}/> Signed in as {user.name}</span>
            <div>
              <button className="text-button" onClick={() => navigate('/projects')}>View public site</button>
              <button className="text-button" onClick={logout}><LogOut size={16}/> Log out</button>
            </div>
          </div>
        )}
        <div className="content">
          <div className="section-heading">
            <div>
              <h1>{current.label}</h1>
              <p>{tab === 'projects' ? 'Student-built tools and experiments from the lab.' : tab === 'cves' ? 'Documented vulnerability research and technical write-ups.' : 'Competition results and milestones earned by lab teams.'}</p>
            </div>
            {isAdmin && (
              <div className="heading-actions">
                <button className="button secondary manage-button" onClick={() => setManage(true)}>Manage entries</button>
                <button className="button primary add-button" onClick={() => setEditing({})}><Plus size={17}/> Add {current.singular}</button>
              </div>
            )}
          </div>
          <div className="mobile-tabs" role="tablist">
            {tabs.map(t => <button role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)} key={t.key}>{t.label}</button>)}
          </div>
          <div className="collection-bar">
            <div className="collection-title">
              <span className="collection-icon"><current.icon size={18}/></span>
              <div>
                <strong>{current.label} archive</strong>
                <small>{data[tab].length} published {data[tab].length === 1 ? "entry" : "entries"}{canReorder ? " · Drag & drop to arrange order" : ""}</small>
              </div>
            </div>
            <div className="collection-controls">
              {tab === 'cves' && (
                <label className="archive-sort">
                  <span>Filter</span>
                  <select aria-label="Order CVEs by date added" title="Sort by the date entries were added to the archive" value={cveOrder} onChange={e => setCveOrder(e.target.value)}>
                    <option value="latest">New to old</option>
                    <option value="oldest">Old to new</option>
                  </select>
                </label>
              )}
              <label className="search-box">
                <Search size={17}/>
                <input aria-label={`Search ${current.label}`} placeholder={`Search ${current.label.toLowerCase()}...`} value={query} onChange={e => setQuery(e.target.value)}/>
                {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15}/></button>}
              </label>
            </div>
          </div>
          {error && <div className="inline-error"><CircleAlert size={17}/>{error}<button onClick={refresh}>Retry</button></div>}
          {loading ? (
            <div className="loading-grid">{[1, 2, 3].map(x => <div className="skeleton" key={x}/>)}</div>
          ) : visibleItems.length ? (
            <div className="card-grid">
              {visibleItems.map((item, index) => {
                const actualIndex = data[tab].findIndex(x => x._id === item._id);
                const serialNumber = actualIndex !== -1 ? actualIndex + 1 : index + 1;
                return (
                  <Card
                    key={item._id}
                    kind={tab}
                    item={item}
                    serialNumber={serialNumber}
                    isDraggable={canReorder}
                    isDragging={canReorder && draggedId === item._id}
                    isDragOver={canReorder && dragOverId === item._id}
                    onDragStart={canReorder ? (e => {
                      e.dataTransfer.setData('text/plain', item._id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedId(item._id);
                    }) : undefined}
                    onDragEnd={canReorder ? (() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }) : undefined}
                    onDragOver={canReorder ? (e => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverId !== item._id) setDragOverId(item._id);
                    }) : undefined}
                    onDragLeave={canReorder ? (() => {
                      if (dragOverId === item._id) setDragOverId(null);
                    }) : undefined}
                    onDrop={canReorder ? (e => {
                      e.preventDefault();
                      const sourceId = e.dataTransfer.getData('text/plain') || draggedId;
                      if (sourceId && sourceId !== item._id) {
                        handleReorder(sourceId, item._id);
                      }
                      setDraggedId(null);
                      setDragOverId(null);
                    }) : undefined}
                    onClick={() => setDetail(item)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><BookOpen size={27}/></div>
              <h3>{query ? "No matching entries" : `No ${current.label.toLowerCase()} uploaded yet`}</h3>
              <p>{query ? "Try a different search term." : "Check back soon for new work from the lab."}</p>
              {isAdmin && <button className="button primary" onClick={() => setEditing({})}><Plus size={16}/> Add first {current.singular}</button>}
            </div>
          )}
          <footer className="main-footer">
            <span>Cyber Research Lab · Sri Shakthi Institute of Engineering and Technology</span>
          </footer>
        </div>
      </main>
      {manage && isAdmin && (
        <ManagePanel
          kind={tab}
          items={data[tab]}
          onClose={() => setManage(false)}
          onAdd={() => { setManage(false); setEditing({}); }}
          onEdit={item => { setManage(false); setEditing(item); }}
          onDelete={removeRecord}
          onReorder={handleReorder}
        />
      )}
      {detail && (
        <DetailModal
          kind={tab}
          item={detail}
          serialNumber={(() => {
            const idx = data[tab].findIndex(x => x._id === detail._id);
            return idx !== -1 ? idx + 1 : 1;
          })()}
          onClose={() => setDetail(null)}
          admin={isAdmin}
          onEdit={() => { setEditing(detail); setDetail(null); }}
          onDelete={remove}
        />
      )}
      {editing && isAdmin && (
        <AdminForm
          eventNames={data.achievements.map(item => item.eventName)}
          kind={tab}
          record={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById('root')).render(<TranslationProvider><App/></TranslationProvider>);
