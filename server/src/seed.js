import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Project, Cve, Achievement } from './models.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab-portal';
await mongoose.connect(uri);
const users = [
  { name: process.env.ADMIN_NAME || 'Lab Admin', email: process.env.ADMIN_EMAIL || 'admin@lab.local', password: process.env.ADMIN_PASSWORD, role: 'admin' }
];
for (const u of users) {
  if (!u.password || u.password.length < 12) throw new Error(`${u.role.toUpperCase()}_PASSWORD must be at least 12 characters`);
  const existing = await User.findOne({ role: u.role });
  if (!existing) await User.create({ name: u.name, email: u.email, passwordHash: await bcrypt.hash(u.password, 12), role: u.role });
}
const people = [{ name: 'Aisha Khan', linkedinUrl: 'https://www.linkedin.com/in/aisha-khan' }, { name: 'Rohan Mehta', linkedinUrl: 'https://www.linkedin.com/in/rohan-mehta' }];
if (await Project.countDocuments() === 0) await Project.insertMany([
  { name: 'Sentinel Network Monitor', shortDescription: 'Real-time network anomaly detection for campus infrastructure.', fullDescription: 'Sentinel inspects network flow metadata and raises alerts when traffic deviates from normal campus patterns. The project includes a dashboard for triage and historical analysis.', domain: 'Network Security', techStack: ['Python', 'FastAPI', 'React'], ip: 'Lab VLAN 10.20.0.15', githubUrl: 'https://github.com/topics/network-security', members: people, guide: { name: 'Dr. Maya Rao', profileUrl: 'https://www.linkedin.com/in/maya-rao' } },
  { name: 'PhishGuard', shortDescription: 'A browser-based toolkit for spotting suspicious links and emails.', fullDescription: 'PhishGuard combines URL feature analysis with a simple training interface that helps students recognize phishing tactics and report suspicious messages.', domain: 'Threat Intelligence', techStack: ['TypeScript', 'Node.js', 'MongoDB'], ip: 'Demo service: 10.20.0.24', githubUrl: 'https://github.com/topics/phishing-detection', members: people.slice(0, 1), guide: { name: 'Dr. Maya Rao', profileUrl: 'https://www.linkedin.com/in/maya-rao' } },
  { name: 'VaultLab', shortDescription: 'Hands-on secrets management exercises for security training.', fullDescription: 'VaultLab is a guided practice environment for credential rotation, access policies, and audit trails in a contained lab network.', domain: 'Application Security', techStack: ['Docker', 'Go', 'PostgreSQL'], ip: 'Internal lab: 10.20.0.31', githubUrl: 'https://github.com/topics/secrets-management', members: people, guide: { name: 'Prof. Neha Iyer', profileUrl: 'https://www.linkedin.com/in/neha-iyer' } }
]);
if (await Cve.countDocuments() === 0) await Cve.insertMany([
  { cveNumber: 'CVE-2025-10001', shortDescription: 'Illustrative access-control flaw in a training application.', fullDescription: 'Sample training record: the team found an insecure direct object reference in a deliberately vulnerable lab application and documented its impact and remediation.', githubUrl: 'https://github.com/topics/idor', members: people },
  { cveNumber: 'CVE-2025-10002', shortDescription: 'Illustrative input-validation issue in a lab service.', fullDescription: 'Sample training record: malformed input to a contained demonstration service bypassed validation. The write-up shows how strict server-side checks addressed it.', githubUrl: 'https://github.com/topics/input-validation', members: people.slice(0, 1) }
]);
if (await Achievement.countDocuments() === 0) await Achievement.insertMany([
  { eventName: 'CyberSprint CTF', eventType: 'CTF', prize: '₹25,000', place: 1, description: 'The lab team placed first after solving web, crypto, and forensics challenges across a 24-hour competition.', members: people.map(p => ({ name: p.name, profileUrl: p.linkedinUrl })) },
  { eventName: 'SecureBuild Hackathon', eventType: 'Hackathon', prize: 'Innovation award', place: 2, description: 'A prototype for accessible threat reporting earned second place at the inter-college hackathon.', members: people.slice(0, 1).map(p => ({ name: p.name, profileUrl: p.linkedinUrl })) },
  { eventName: 'Blue Team Challenge', eventType: 'Other', prize: 'Finalist certificate', place: 3, description: 'Students investigated simulated incidents and finished among the top finalists.', members: people.map(p => ({ name: p.name, profileUrl: p.linkedinUrl })) }
]);
console.log('Seed complete');
await mongoose.disconnect();
