import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Project, Cve, Achievement } from './models.js';
import { schemas } from './validation.js';
import { registerUploads } from './uploads.js';
import { registerTranslation } from './translation.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
registerTranslation(app);
const cookie = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000, path: '/' };

function auth(req, res, next) {
  try { req.identity = jwt.verify(req.cookies.lab_token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); next(); }
  catch { res.status(401).json({ error: 'Please sign in again.' }); }
}
function admin(req, res, next) { if (req.identity.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' }); next(); }
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' })
});
app.post('/api/auth/login', loginLimit, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password || email.length > 254 || password.length > 200) return res.status(400).json({ error: 'Enter a valid email and password.' });
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Incorrect email or password.' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  res.cookie('lab_token', jwt.sign({ id: String(user.id), role: user.role }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' }), cookie);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
app.post('/api/auth/logout', (_req, res) => { res.clearCookie('lab_token', cookie); res.json({ ok: true }); });
app.get('/api/auth/me', auth, async (req, res) => {
  const user = await User.findById(req.identity.id).select('name email role');
  if (!user || user.role !== req.identity.role) return res.status(401).json({ error: 'Please sign in again.' });
  res.json({ user });
});
registerUploads(app, auth, admin);
const collections = { projects: Project, cves: Cve, achievements: Achievement };
const listeners = new Set();
function publish(kind) { for (const res of listeners) res.write(`data: ${JSON.stringify({ kind })}\n\n`); }
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(': connected\n\n');
  listeners.add(res);
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(keepAlive); listeners.delete(res); });
});
app.get('/api/:kind', async (req, res) => {
  const Model = collections[req.params.kind];
  if (!Model) return res.status(404).json({ error: 'Unknown collection.' });
  res.json(await Model.find().sort({ createdAt: -1 }).lean());
});
app.post('/api/:kind', auth, admin, async (req, res) => {
  const Model = collections[req.params.kind], schema = schemas[req.params.kind];
  if (!Model) return res.status(404).json({ error: 'Unknown collection.' });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  try { const item = await Model.create(parsed.data); publish(req.params.kind); res.status(201).json(item); }
  catch (e) { if (e.code === 11000) return res.status(409).json({ error: 'That identifier already exists.' }); throw e; }
});
app.put('/api/:kind/:id', auth, admin, async (req, res) => {
  const Model = collections[req.params.kind], schema = schemas[req.params.kind];
  if (!Model || !mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Entry not found.' });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  try { const item = await Model.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true }); if (!item) return res.status(404).json({ error: 'Entry not found.' }); publish(req.params.kind); res.json(item); }
  catch (e) { if (e.code === 11000) return res.status(409).json({ error: 'That identifier already exists.' }); throw e; }
});
app.delete('/api/:kind/:id', auth, admin, async (req, res) => {
  const Model = collections[req.params.kind];
  if (!Model || !mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Entry not found.' });
  const item = await Model.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Entry not found.' });
  publish(req.params.kind);
  res.json({ ok: true });
});
app.use((err, _req, res, _next) => { if (err.type === 'entity.too.large') return res.status(413).json({ error: 'The file is too large. Maximum upload size is 5 MB.' }); console.error(err); res.status(500).json({ error: 'Something went wrong. Please try again.' }); });

if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI before starting the application.');
await mongoose.connect(process.env.MONGODB_URI);
// Retire the old CVE-number constraint without changing existing entries.
try {
  const indexes = await Cve.collection.indexes();
  for (const index of indexes) {
    if (index.unique && Object.keys(index.key).length === 1 && index.key.cveNumber === 1) await Cve.collection.dropIndex(index.name);
  }
} catch (error) { if (error.code !== 26) throw error; }
app.listen(Number(process.env.PORT || 4000), () => console.log(`Lab Portal API on port ${process.env.PORT || 4000}`));
