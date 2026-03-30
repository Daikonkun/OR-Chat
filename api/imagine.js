// Vercel Serverless Function: Proxy image generation to xAI Grok Imagine API

import { validateXaiApiKey, getXaiBase, setCorsHeaders } from './utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const xaiKey = process.env.XAI_API_KEY;
  if (!validateXaiApiKey(xaiKey)) {
    return res.status(500).json({ error: 'XAI_API_KEY not set or invalid. Image generation requires a valid xAI API key.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { prompt, n = 1, response_format = 'url', model = 'grok-imagine-image', aspect_ratio, resolution } = body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required and must be a string' });
  }

  if (n < 1 || n > 10) {
    return res.status(400).json({ error: 'n must be between 1 and 10' });
  }

  const xaiBase = getXaiBase();
  const payload = { model, prompt, n, response_format };

  if (aspect_ratio) payload.aspect_ratio = aspect_ratio;
  if (resolution) payload.resolution = resolution;

  try {
    const resp = await fetch(`${xaiBase}images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: err });
    }

    const data = await resp.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
