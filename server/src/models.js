import mongoose from 'mongoose';

const text = (maxlength, required = false) => ({ type: String, trim: true, maxlength, required });
const optionalText = maxlength => ({ ...text(maxlength), default: '' });
const member = new mongoose.Schema({
  name: text(120, true),
  linkedinUrl: optionalText(500),
  profileUrl: optionalText(500),
  qualification: optionalText(160),
  certificateUrl: optionalText(100)
}, { _id: false });
const options = { timestamps: true, versionKey: false };
const contentOptions = { ...options, strict: 'throw' };
const members = { type: [member], default: [] };

const userSchema = new mongoose.Schema({
  name: text(120, true),
  email: { ...text(254, true), unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'viewer'], required: true }
}, options);

const projectSchema = new mongoose.Schema({
  name: text(160, true),
  shortDescription: optionalText(240),
  fullDescription: text(5000, true),
  domain: text(120, true),
  techStack: { type: [String], default: [] },
  ip: optionalText(100),
  githubUrl: text(500, true),
  members,
  guide: { type: member, required: true }
}, contentOptions);

const cveSchema = new mongoose.Schema({
  applicationName: optionalText(160),
  cveNumber: text(80, true),
  shortDescription: optionalText(240),
  fullDescription: text(5000, true),
  githubUrl: optionalText(500),
  members
}, contentOptions);

const achievementSchema = new mongoose.Schema({
  eventName: text(160, true),
  eventType: { type: String, enum: ['CTF', 'Hackathon', 'Conference', 'Other'], required: true },
  prize: text(160, true),
  place: { type: mongoose.Schema.Types.Mixed, required: true },
  description: text(5000, true),
  photographUrl: optionalText(100),
  members
}, contentOptions);

for (const schema of [projectSchema, cveSchema, achievementSchema]) schema.index({ createdAt: -1 });
cveSchema.index({ cveNumber: 1 });

export const User = mongoose.model('User', userSchema);
export const Project = mongoose.model('Project', projectSchema);
export const Cve = mongoose.model('Cve', cveSchema);
export const Achievement = mongoose.model('Achievement', achievementSchema);
