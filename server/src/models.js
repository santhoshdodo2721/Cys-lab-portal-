import mongoose from 'mongoose';

const member = new mongoose.Schema({ name: String, linkedinUrl: String, profileUrl: String }, { _id: false });
const options = { timestamps: true, versionKey: false };
export const User = mongoose.model('User', new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true }, passwordHash: { type: String, required: true }, role: { type: String, enum: ['admin', 'viewer'], required: true } }, options));
export const Project = mongoose.model('Project', new mongoose.Schema({ name: String, shortDescription: String, fullDescription: String, domain: String, techStack: [String], ip: String, githubUrl: String, members: [member], guide: member }, options));
export const Cve = mongoose.model('Cve', new mongoose.Schema({ applicationName: { type: String, default: '' }, cveNumber: { type: String, unique: true }, shortDescription: String, fullDescription: String, githubUrl: String, members: [member] }, options));
export const Achievement = mongoose.model('Achievement', new mongoose.Schema({ eventName: String, eventType: String, prize: String, place: Number, description: String, members: [member] }, options));
