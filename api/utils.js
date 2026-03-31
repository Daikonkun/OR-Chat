// Shared utilities for Vercel serverless functions

import { createHmac, timingSafeEqual } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const authorsConfig = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'allowed-authors.json'), 'utf-8')
);

/**
 * Get the list of allowed author IDs from the shared config.
 */
export function getAllowedAuthors() {
  return authorsConfig.map(a => a.id);
}

/**
 * Get the full authors config (id + label) for API responses.
 */
export function getAuthorsConfig() {
  return authorsConfig;
}

const XAI_BASE_DEFAULT = 'https://api.x.ai/v1/';

/**
 * Validate xAI API key format.
 * Keys start with 'xai-', min 8 chars, alphanumeric + hyphens after prefix.
 */
export function validateXaiApiKey(key) {
  if (!key || typeof key !== 'string') return false;
  if (!key.startsWith('xai-')) return false;
  if (key.length < 8) return false;
  const suffix = key.slice(4);
  return /^[a-zA-Z0-9-]+$/.test(suffix);
}

/**
 * Get validated XAI_BASE URL from env, with trailing slash.
 */
export function getXaiBase() {
  const raw = process.env.XAI_BASE || XAI_BASE_DEFAULT;
  try {
    const parsed = new URL(raw);
    if (!parsed.protocol || !parsed.host) return XAI_BASE_DEFAULT;
    return raw.endsWith('/') ? raw : raw + '/';
  } catch {
    return XAI_BASE_DEFAULT;
  }
}

/**
 * Set CORS headers on response.
 */
export function setCorsHeaders(res, methods = 'GET, OPTIONS') {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ── Session / Auth helpers ────────────────────────────

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET env var is required when APP_PASSWORD is set');
  }
  return secret;
}

function getSessionTTL() {
  return parseInt(process.env.SESSION_TTL_HOURS || '24', 10) * 3600;
}

function base64urlEncode(data) {
  return Buffer.from(data).toString('base64url');
}

function base64urlDecode(str) {
  return Buffer.from(str, 'base64url').toString();
}

/**
 * Create an HS256 JWT compatible with PyJWT.
 */
export function signJwt(payload) {
  const secret = getSessionSecret();
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verify an HS256 JWT. Returns decoded payload or null.
 */
export function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const secret = getSessionSecret();
  const expected = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  // Constant-time comparison
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Create a session token with expiry.
 */
export function createSessionToken() {
  const ttl = getSessionTTL();
  const exp = Math.floor(Date.now() / 1000) + ttl;
  return signJwt({ exp });
}

/**
 * Parse cookies from request header.
 */
export function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const cookies = {};
  header.split(';').forEach(pair => {
    const [name, ...rest] = pair.trim().split('=');
    if (name) cookies[name] = rest.join('=');
  });
  return cookies;
}

/**
 * Check if auth is enabled (APP_PASSWORD is set).
 */
export function authEnabled() {
  return !!process.env.APP_PASSWORD;
}

/**
 * Verify session from request cookies. Returns true if valid or auth disabled.
 * If invalid, sends 401 and returns false.
 */
export function requireAuth(req, res) {
  if (!authEnabled()) return true;
  const cookies = parseCookies(req);
  const token = cookies.session_token;
  if (!token || !verifyJwt(token)) {
    setCorsHeaders(res);
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
