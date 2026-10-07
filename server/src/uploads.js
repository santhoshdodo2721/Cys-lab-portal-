import express from 'express';
import mongoose from 'mongoose';
import { pipeline } from 'node:stream/promises';

export function fileType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
  if (buffer.length >= 12 && buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP') return 'image/webp';
  if (buffer.toString('ascii',0,5) === '%PDF-') return 'application/pdf';
  return null;
}
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
export function registerUploads(app, auth, admin) {
  app.post('/api/files', auth, admin, express.raw({ type: ['image/png','image/jpeg','image/webp','application/pdf'], limit: '5mb' }), async (req, res, next) => {
    try {
      const type = fileType(req.body);
      if (!type || type !== req.get('Content-Type')?.split(';')[0]) return res.status(400).json({ error: 'Choose a PNG, JPEG, WebP image or PDF, up to 5 MB.' });
      const extension = { 'image/png':'png', 'image/jpeg':'jpg', 'image/webp':'webp', 'application/pdf':'pdf' }[type];
      const upload = bucket().openUploadStream('attachment.' + extension, { metadata: { contentType: type, uploadedBy: req.identity.id } });
      await new Promise((resolve, reject) => { upload.once('finish', resolve); upload.once('error', reject); upload.end(req.body); });
      res.status(201).json({ url: '/api/files/' + upload.id });
    } catch (error) { next(error); }
  });
  app.get('/api/files/:id', async (req, res, next) => {
    try {
      if (!/^[a-f0-9]{24}$/.test(req.params.id)) return res.status(404).json({ error: 'File not found.' });
      const id = new mongoose.Types.ObjectId(req.params.id);
      const file = await bucket().find({ _id: id }).next();
      if (!file) return res.status(404).json({ error: 'File not found.' });
      const type = file.metadata?.contentType;
      if (!['image/png','image/jpeg','image/webp','application/pdf'].includes(type)) return res.status(404).json({ error: 'File not found.' });
      res.setHeader('Content-Type', type);
      res.setHeader('Content-Length', file.length);
      res.setHeader('Content-Disposition', (type === 'application/pdf' ? 'attachment' : 'inline') + '; filename="' + file.filename + '"');
      await pipeline(bucket().openDownloadStream(id), res);
    } catch (error) { if (res.headersSent) res.destroy(); else next(error); }
  });
}
