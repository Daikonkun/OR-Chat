// Shared utilities for Vercel serverless functions

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
