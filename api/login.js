// Vercel Serverless Function: Login endpoint

import { timingSafeEqual } from 'crypto';
import { setCorsHeaders, authEnabled, createSessionToken } from './utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authEnabled()) {
    return res.status(200).json({ ok: true });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const password = body.password || '';
  const expected = process.env.APP_PASSWORD || '';

  // Constant-time comparison
  const pwBuf = Buffer.from(password);
  const expBuf = Buffer.from(expected);
  if (pwBuf.length !== expBuf.length || !timingSafeEqual(pwBuf, expBuf)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = createSessionToken();
  const ttlHours = parseInt(process.env.SESSION_TTL_HOURS || '24', 10);
  const isSecure = (req.headers['x-forwarded-proto'] || '').includes('https');
  const cookieFlags = [
    `session_token=${token}`,
    'HttpOnly',
    `Max-Age=${ttlHours * 3600}`,
    'Path=/',
    'SameSite=Strict',
  ];
  if (isSecure) cookieFlags.push('Secure');

  res.setHeader('Set-Cookie', cookieFlags.join('; '));
  return res.status(200).json({ ok: true });
}
