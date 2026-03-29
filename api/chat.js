// Vercel Serverless Function: Proxy chat completions to OpenRouter

const ALLOWED_AUTHORS = ['x-ai', 'deepseek'];
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
  }

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

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:8888',
    'X-Title': 'OpenRouter Local Wrapper',
  };

  if (stream) {
    // Streaming: proxy SSE from OpenRouter to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const openRouterResp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
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
    const openRouterResp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
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
