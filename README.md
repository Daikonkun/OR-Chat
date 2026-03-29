# OpenRouter Chat Wrapper

A lightweight local web interface for chatting with LLM models via [OpenRouter](https://openrouter.ai). Prioritizes **xAI (Grok)** and **DeepSeek** models. Supports image uploads for vision-capable models.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set your API key
cp .env.example .env
# Edit .env and paste your OpenRouter API key

# 3. Run
python server.py
```

Open http://localhost:8888

## Features

- **Model selector** — auto-fetches available xAI and DeepSeek models from OpenRouter
- **Streaming responses** — token-by-token display via SSE
- **Image upload** — attach images via button, paste, or drag-and-drop (PNG, JPEG, GIF, WebP)
- **Conversation history** — multi-turn context maintained per session
- **Minimal footprint** — no build step, no frontend framework

## Project Structure

```
├── server.py              # FastAPI backend (API proxy)
├── static/
│   ├── index.html         # Chat UI
│   ├── app.js             # Frontend logic
│   └── style.css          # Styles
├── .env.example           # API key template
├── requirements.txt       # Python deps
├── .github/               # Vibe agent orchestrator (from vibe-master)
│   ├── agents/
│   ├── prompts/
│   └── skills/
└── copilot-instructions.md
```

## Configuration

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key (required) |

To allow additional model authors, edit `ALLOWED_AUTHORS` in `server.py`.
