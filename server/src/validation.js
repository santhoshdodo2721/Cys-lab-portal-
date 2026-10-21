import { z } from 'zod';

const clean = (limit = 2000) => z.string().trim().min(1).max(limit).refine(s => !/[<>\u0000-\u001f]/.test(s), 'HTML and control characters are not allowed');
const multiline = (limit = 5000) => z.string().trim().min(1).max(limit).refine(s => !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s), 'HTML and unsupported control characters are not allowed');
const url = z.string().trim().url().max(500).refine(s => /^https:\/\//i.test(s), 'Use an HTTPS URL');
const hostname = value => { try { return new URL(value).hostname; } catch { return ''; } };
const github = url.refine(s => hostname(s) === 'github.com', 'Use a GitHub URL');
const linkedin = url.refine(s => ['linkedin.com', 'www.linkedin.com'].includes(hostname(s)), 'Use a LinkedIn URL');
const optionalUrl = schema => z.preprocess(value => typeof value === 'string' && !value.trim() ? undefined : value, schema.optional().transform(value => value ?? ''));
const attachment = z.string().regex(/^\/api\/files\/[a-f0-9]{24}$/).or(z.literal('')).optional().default('');
const rank = z.union([z.number().int().min(1).max(9999), clean(120)]).transform(value => /^[1-3]$/.test(String(value)) ? Number(value) : value);
const person = z.object({ name: clean(120), linkedinUrl: optionalUrl(linkedin) });
const guide = z.object({ name: clean(120), qualification: clean(160).or(z.literal('')).optional().default(''), profileUrl: optionalUrl(linkedin) });
const optionalGuide = z.preprocess(v => (!v || typeof v !== 'object' || !v.name || !String(v.name).trim() ? undefined : v), guide.optional());
const guidesSchema = z.preprocess(v => {
  if (Array.isArray(v)) return v.filter(g => g && typeof g === 'object' && g.name && String(g.name).trim());
  return [];
}, z.array(guide).max(10).optional().default([]));
const profile = z.object({ name: clean(120), certificateUrl: attachment, profileUrl: optionalUrl(linkedin) });
export const schemas = {
  projects: z.object({
    name: clean(160),
    fullDescription: multiline(),
    domain: clean(120),
    techStack: z.array(clean(80)).max(20).optional().default([]),
    ip: z.string().trim().max(100).refine(s => !/[<>\u0000-\u001f]/.test(s)).optional().default(''),
    githubUrl: optionalUrl(github),
    teamName: z.string().trim().max(160).refine(s => !/[<>\u0000-\u001f]/.test(s), 'HTML and control characters are not allowed').optional().default(''),
    members: z.preprocess(v => {
      if (Array.isArray(v)) return v.filter(m => m && typeof m === 'object' && m.name && String(m.name).trim());
      return [];
    }, z.array(person).max(100).optional().default([])),
    guide: optionalGuide,
    guides: guidesSchema,
    order: z.number().int().optional().default(0)
  }).refine(
    data => (data.teamName && data.teamName.trim().length > 0) || (data.members && data.members.length > 0),
    'Provide either a team name or at least one team member.'
  ).transform(data => {
    const mergedGuides = data.guides && data.guides.length > 0 ? data.guides : (data.guide ? [data.guide] : []);
    return { ...data, guides: mergedGuides, guide: mergedGuides[0] || null, shortDescription: data.fullDescription.slice(0, 240) };
  }),
  cves: z.object({ applicationName: clean(160).or(z.literal('')).optional().default(''), cveNumber: z.string().trim().regex(/^CVE-\d{4}-\d{4,}$/i, 'Use CVE-YYYY-NNNN'), fullDescription: multiline(), githubUrl: optionalUrl(github), members: z.array(person).min(1).max(30), order: z.number().int().optional().default(0) }).transform(data => ({ ...data, shortDescription: data.fullDescription.slice(0, 240) })),
  achievements: z.object({ eventName: clean(160), eventType: clean(120), prize: clean(160), place: rank, description: multiline(), photographUrl: attachment, members: z.array(profile).min(1).max(30), order: z.number().int().optional().default(0) })
};
