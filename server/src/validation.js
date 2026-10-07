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
const profile = z.object({ name: clean(120), certificateUrl: attachment, profileUrl: linkedin });
export const schemas = {
  projects: z.object({ name: clean(160), fullDescription: multiline(), domain: clean(120), techStack: z.array(clean(80)).max(20).optional().default([]), ip: z.string().trim().max(100).refine(s => !/[<>\u0000-\u001f]/.test(s)).optional().default(''), githubUrl: github, members: z.array(person).min(1).max(30), guide: guide }).transform(data => ({ ...data, shortDescription: data.fullDescription.slice(0, 240) })),
  cves: z.object({ applicationName: clean(160).or(z.literal('')).optional().default(''), cveNumber: z.string().trim().regex(/^CVE-\d{4}-\d{4,}$/i, 'Use CVE-YYYY-NNNN'), fullDescription: multiline(), githubUrl: optionalUrl(github), members: z.array(person).min(1).max(30) }).transform(data => ({ ...data, shortDescription: data.fullDescription.slice(0, 240) })),
  achievements: z.object({ eventName: clean(160), eventType: z.enum(['CTF', 'Hackathon', 'Conference', 'Other']), prize: clean(160), place: rank, description: multiline(), photographUrl: attachment, members: z.array(profile).min(1).max(30) })
};
