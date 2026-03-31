// Vercel Serverless Function: Session check endpoint

import { setCorsHeaders, authEnabled, parseCookies, verifyJwt } from './utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authEnabled()) {
    return res.status(200).json({ authenticated: true, authRequired: false });
  }

  const cookies = parseCookies(req);
  const token = cookies.session_token;

  if (!token || !verifyJwt(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({ authenticated: true, authRequired: true });
}
