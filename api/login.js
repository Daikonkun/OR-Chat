// Vercel Serverless Function: Login endpoint

import { timingSafeEqual } from 'crypto';
import { setCorsHeaders, authEnabled, createSessionToken } from './utils.js';

// ── Rate-limit config ─────────────────────────────────
const RATE_LIMIT_MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10);
const RATE_LIMIT_WINDOW_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '900', 10);

// In-memory rate-limit store: Map<ip, { count, windowStart }>
const loginAttempts = new Map();
let lastSweep = 0;

function sweepExpired() {
  const now = Date.now();
  if ((now - lastSweep) / 1000 < RATE_LIMIT_WINDOW_SECONDS) return;
  lastSweep = now;
  for (const [ip, record] of loginAttempts) {
    if ((now - record.windowStart) / 1000 >= RATE_LIMIT_WINDOW_SECONDS) {
      loginAttempts.delete(ip);
    }
  }
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return null;
  const elapsed = (Date.now() - record.windowStart) / 1000;
  if (elapsed >= RATE_LIMIT_WINDOW_SECONDS) {
    loginAttempts.delete(ip);
    return null;
  }
  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return Math.ceil(RATE_LIMIT_WINDOW_SECONDS - elapsed);
  }
  return null;
}

function recordFailedAttempt(ip) {
  sweepExpired();
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || (now - record.windowStart) / 1000 >= RATE_LIMIT_WINDOW_SECONDS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    record.count += 1;
  }
}

function clearRateLimit(ip) {
  loginAttempts.delete(ip);
}

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

  const clientIp = getClientIp(req);

  // Check rate limit before processing
  const retryAfter = checkRateLimit(clientIp);
  if (retryAfter !== null) {
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many failed login attempts. Try again later.' });
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
    recordFailedAttempt(clientIp);
    return res.status(401).json({ error: 'Invalid password' });
  }

  clearRateLimit(clientIp);

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
