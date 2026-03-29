---
name: OpenRouter Wrapper Instructions
description: "Global instructions for the OpenRouter API wrapper project. A lightweight local chat interface for OpenRouter models with image upload support."
---

# OpenRouter Wrapper — Project Instructions

## Project Overview
A lightweight local web application that wraps the OpenRouter API, providing a clean chat interface with model selection and image upload capabilities.

## Core Principles
- **Simplicity**: Minimal dependencies, easy to run locally
- **Security**: API key never exposed to frontend; stored in `.env`
- **Streaming**: Real-time token streaming via Server-Sent Events
- **Vision support**: Upload images for vision-capable models

## Tech Stack
- **Backend**: Python 3.10+, FastAPI, httpx, python-dotenv
- **Frontend**: Vanilla HTML/CSS/JS (no build step)
- **API**: OpenRouter REST API (OpenAI-compatible)

## Key Files
- `server.py` — FastAPI backend (API proxy, model listing, image handling)
- `static/index.html` — Chat UI
- `static/app.js` — Frontend logic (chat, streaming, image upload)
- `static/style.css` — UI styles
- `.env` — `OPENROUTER_API_KEY=sk-or-...`
- `requirements.txt` — Python dependencies

## Model Filtering
- Prioritize authors: `xai`, `deepseek`
- Show model ID, context length, and pricing info
- Group by author in the model selector

## API Endpoints
- `GET /api/models` — List available models (filtered)
- `POST /api/chat` — Send chat completion request (supports streaming)
- `GET /` — Serve the frontend

## Best Practices
- Never log or expose the API key
- Validate image MIME types before sending
- Use streaming for better UX on long responses
- Handle rate limits and API errors gracefully
