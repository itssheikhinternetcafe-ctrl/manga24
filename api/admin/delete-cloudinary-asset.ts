import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function adminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Server authentication is not configured.');
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

function publicIdFromUrl(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) throw new Error('Invalid Cloudinary asset URL.');
  return match[1].replace(/\.[^.\/]+$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    const decoded = await getAuth(adminApp()).verifyIdToken(token);
    if (decoded.admin !== true) return res.status(403).json({ error: 'Admin access required.' });

    const url = typeof req.body?.url === 'string' ? req.body.url : '';
    const publicId = publicIdFromUrl(url);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary deletion is not configured.');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto.createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex');
    const body = new URLSearchParams({ public_id: publicId, timestamp, api_key: apiKey, signature });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`, { method: 'POST', body });
    if (!response.ok) throw new Error('Cloudinary asset deletion failed.');
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Asset deletion failed.' });
  }
}
