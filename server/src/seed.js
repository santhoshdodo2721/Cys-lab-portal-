import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models.js';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('Set MONGODB_URI before starting the application.');
await mongoose.connect(uri);
try {
  if (!await User.exists({ role: 'admin' })) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 12) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) to create the first admin.');
    await User.create({
      name: process.env.ADMIN_NAME || 'Lab Admin',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin'
    });
  }
  console.log('Admin setup complete. Content is managed through the CMS.');
} finally {
  await mongoose.disconnect();
}
