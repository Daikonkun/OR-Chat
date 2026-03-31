// Vercel Serverless Function: Logout endpoint

import { setCorsHeaders } from './utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', 'session_token=; HttpOnly; Max-Age=0; Path=/; SameSite=Strict');
  return res.status(200).json({ ok: true });
}
