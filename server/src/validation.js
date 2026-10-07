import { z } from 'zod';

const clean = (limit = 2000) => z.string().trim().min(1).max(limit).refine(s => !/[<>\u0000-\u001f]/.test(s), 'HTML and control characters are not allowed');
const url = z.string().trim().url().max(500).refine(s => /^https:\/\//i.test(s), 'Use an HTTPS URL');
const github = url.refine(s => new URL(s).hostname === 'github.com', 'Use a GitHub URL');
const linkedin = url.refine(s => ['linkedin.com', 'www.linkedin.com'].includes(new URL(s).hostname), 'Use a LinkedIn URL');
const person = z.object({ name: clean(120), linkedinUrl: linkedin });
const profile = z.object({ name: clean(120), profileUrl: linkedin });
export const schemas = {
  projects: z.object({ name: clean(160), shortDescription: clean(240), fullDescription: clean(5000), domain: clean(120), techStack: z.array(clean(80)).min(1).max(20), ip: z.string().trim().max(100).refine(s => !/[<>\u0000-\u001f]/.test(s)), githubUrl: github, members: z.array(person).min(1).max(30), guide: profile }),
  cves: z.object({ cveNumber: z.string().trim().regex(/^CVE-\d{4}-\d{4,}$/i, 'Use CVE-YYYY-NNNN'), shortDescription: clean(240), fullDescription: clean(5000), githubUrl: github, members: z.array(person).min(1).max(30) }),
  achievements: z.object({ eventName: clean(160), eventType: z.enum(['CTF', 'Hackathon', 'Competition', 'Conference', 'Other']), prize: clean(160), place: z.coerce.number().int().min(1).max(9999), description: clean(5000), members: z.array(profile).min(1).max(30) })
};
