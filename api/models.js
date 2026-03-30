// Vercel Serverless Function: List available models
// Filters to x-ai and deepseek authors

import { validateXaiApiKey, setCorsHeaders } from './utils.js';

const ALLOWED_AUTHORS = ['x-ai', 'deepseek'];

export default async function handler(req, res) {
  // CORS headers — origin configurable via ALLOWED_ORIGIN env var
  setCorsHeaders(res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  }

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: err });
    }

    const data = await resp.json();
    const models = [];

    const xaiKey = process.env.XAI_API_KEY;
    const useDirectXai = validateXaiApiKey(xaiKey);

    for (const m of data.data || []) {
      const modelId = m.id || '';
      const author = modelId.split('/')[0];
      if (!ALLOWED_AUTHORS.includes(author)) continue;

      models.push({
        id: modelId,
        name: m.name || modelId,
        author,
        context_length: m.context_length,
        supports_vision: m.architecture?.modalities?.includes('image') || false,
        uses_direct_api: author === 'x-ai' && useDirectXai,
        prompt_price: m.pricing?.prompt,
        completion_price: m.pricing?.completion,
      });
    }

    models.sort((a, b) => (a.author > b.author) || (a.author === b.author && a.name > b.name));

    return res.status(200).json({ models });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
