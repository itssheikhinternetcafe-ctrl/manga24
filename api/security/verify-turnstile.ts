import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  if (!secret || !token) return res.status(400).json({ ok: false, error: 'CAPTCHA is not configured.' });

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: req.headers['x-forwarded-for'] }),
    });
    const result = await response.json() as { success?: boolean };
    return res.status(result.success ? 200 : 403).json({ ok: Boolean(result.success) });
  } catch {
    return res.status(502).json({ ok: false, error: 'CAPTCHA verification failed.' });
  }
}
