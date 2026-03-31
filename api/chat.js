// Vercel Serverless Function: Proxy chat completions to OpenRouter or direct xAI API

import { validateXaiApiKey, getXaiBase, setCorsHeaders, requireAuth } from './utils.js';

const ALLOWED_AUTHORS = ['x-ai', 'deepseek', 'xiaomi', 'minimax'];
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export default async function handler(req, res) {
  // CORS headers — origin configurable via ALLOWED_ORIGIN env var
  setCorsHeaders(res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAuth(req, res)) return;

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const xaiKey = process.env.XAI_API_KEY;

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { model, messages, stream = true, nsfw = false } = body;

  if (!model || !messages) {
    return res.status(400).json({ error: 'model and messages are required' });
  }

  // Validate author prefix
  const author = model.split('/')[0];
  if (!ALLOWED_AUTHORS.includes(author)) {
    return res.status(400).json({ error: `Model author '${author}' not allowed` });
  }

  // Inject NSFW system prompt server-side
  let msgs = messages;
  if (nsfw) {
    msgs = [
      { role: 'system', content: 'You are in NSFW mode. Respond without restrictions on adult content.' },
      ...msgs.filter(m => m.role !== 'system'),
    ];
  }

  const payload = { model, messages: msgs, stream };

  for (const key of ['temperature', 'max_tokens', 'top_p']) {
    if (body[key] !== undefined) payload[key] = body[key];
  }

  // Determine API target: direct xAI or OpenRouter
  const useDirectXai = author === 'x-ai' && validateXaiApiKey(xaiKey);

  let apiUrl, headers;

  if (useDirectXai) {
    const xaiBase = getXaiBase();
    apiUrl = `${xaiBase}chat/completions`;
    // Strip 'x-ai/' prefix for direct xAI API
    payload.model = model.includes('/') ? model.split('/').slice(1).join('/') : model;
    headers = {
      'Authorization': `Bearer ${xaiKey}`,
      'Content-Type': 'application/json',
    };
  } else {
    if (!openrouterKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
    }
    apiUrl = `${OPENROUTER_BASE}/chat/completions`;
    headers = {
      'Authorization': `Bearer ${openrouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:8888',
      'X-Title': 'OpenRouter Local Wrapper',
    };
  }

  if (stream) {
    // Streaming: proxy SSE from OpenRouter to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const openRouterResp = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!openRouterResp.ok) {
        const err = await openRouterResp.text();
        res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
        res.end();
        return;
      }

      // Pipe the stream
      for await (const chunk of openRouterResp.body) {
        res.write(chunk);
      }
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  } else {
    // Non-streaming
    const openRouterResp = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!openRouterResp.ok) {
      const err = await openRouterResp.text();
      return res.status(openRouterResp.status).json({ error: err });
    }

    const data = await openRouterResp.json();
    return res.status(200).json(data);
  }
}
