import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas } from '../src/validation.js';

test('project schema validates project with full guide details', () => {
  const result = schemas.projects.safeParse({
    name: 'Autonomous Penetration Testing Agent',
    fullDescription: 'Detailed description of the autonomous cyber agent test system.',
    domain: 'Offensive Security',
    techStack: ['Python', 'Docker'],
    ip: '192.168.1.50:8000',
    githubUrl: 'https://github.com/lab/cyber-agent',
    members: [{ name: 'Alex Johnson', linkedinUrl: 'https://www.linkedin.com/in/alex' }],
    guide: {
      name: 'Dr. K. Ramanathan',
      qualification: 'Ph.D, Associate Professor',
      profileUrl: 'https://www.linkedin.com/in/ramanathan'
    },
    order: 1
  });
  assert.equal(result.success, true);
  assert.equal(result.data.guide.name, 'Dr. K. Ramanathan');
  assert.equal(result.data.guides.length, 1);
  assert.equal(result.data.guides[0].name, 'Dr. K. Ramanathan');
  assert.equal(result.data.order, 1);
  assert.equal(result.data.ip, '192.168.1.50:8000');
});

test('project schema validates multiple guides', () => {
  const result = schemas.projects.safeParse({
    name: 'Zero Trust Network Architecture',
    fullDescription: 'Implementation of microsegmentation and continuous authentication.',
    domain: 'Network Security',
    members: [{ name: 'Alex Johnson' }],
    guides: [
      {
        name: 'Dr. K. Ramanathan',
        qualification: 'Ph.D, Professor',
        profileUrl: 'https://www.linkedin.com/in/ramanathan'
      },
      {
        name: 'Prof. S. Meenakshi',
        qualification: 'M.E., Assistant Professor',
        profileUrl: 'https://www.linkedin.com/in/meenakshi'
      }
    ]
  });
  assert.equal(result.success, true);
  assert.equal(result.data.guides.length, 2);
  assert.equal(result.data.guides[0].name, 'Dr. K. Ramanathan');
  assert.equal(result.data.guides[1].name, 'Prof. S. Meenakshi');
  assert.equal(result.data.guide.name, 'Dr. K. Ramanathan');
});

test('project schema accepts optional guide when omitted or empty', () => {
  const result = schemas.projects.safeParse({
    name: 'Vulnerability Scanner',
    fullDescription: 'Custom scanner for IoT security flaws.',
    domain: 'IoT Security',
    members: [{ name: 'Sam Lee' }],
    guide: { name: '', qualification: '', profileUrl: '' },
    guides: []
  });
  assert.equal(result.success, true);
  assert.equal(result.data.guide, null);
  assert.deepEqual(result.data.guides, []);
});

test('project schema allows valid IP and repository url', () => {
  const result = schemas.projects.safeParse({
    name: 'SIEM Log Analyzer',
    fullDescription: 'Elasticsearch-based log ingestion and anomaly detector.',
    domain: 'Cloud Security',
    ip: '10.0.1.200:9200',
    githubUrl: 'https://github.com/lab/siem-analyzer',
    members: [{ name: 'Robin Chen' }]
  });
  assert.equal(result.success, true);
  assert.equal(result.data.ip, '10.0.1.200:9200');
});

test('project schema validates project with teamName and no members (for large teams > 10 members)', () => {
  const result = schemas.projects.safeParse({
    name: 'Campus Threat Hunting Exercise',
    fullDescription: 'Large-scale collaborative threat hunting project conducted by multiple cohorts.',
    domain: 'Incident Response',
    teamName: 'CYS Red & Blue Cohort 2026',
    members: []
  });
  assert.equal(result.success, true);
  assert.equal(result.data.teamName, 'CYS Red & Blue Cohort 2026');
  assert.deepEqual(result.data.members, []);
});

test('project schema validates project with both teamName and individual members', () => {
  const result = schemas.projects.safeParse({
    name: 'Collaborative Malware Analysis Sandbox',
    fullDescription: 'Sandbox designed and maintained by the malware research workgroup.',
    domain: 'Malware Analysis',
    teamName: 'Binary Analysis Taskforce',
    members: [
      { name: 'Lead Analyst 1', linkedinUrl: 'https://www.linkedin.com/in/lead1' },
      { name: 'Lead Analyst 2' }
    ]
  });
  assert.equal(result.success, true);
  assert.equal(result.data.teamName, 'Binary Analysis Taskforce');
  assert.equal(result.data.members.length, 2);
});

test('project schema rejects project when neither teamName nor members are provided', () => {
  const result = schemas.projects.safeParse({
    name: 'Unassigned Project',
    fullDescription: 'Project without team name and without any members.',
    domain: 'General Security',
    teamName: '',
    members: []
  });
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /Provide either a team name or at least one team member/);
});
