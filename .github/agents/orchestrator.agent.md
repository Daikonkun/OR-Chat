---
name: OpenRouter Wrapper Orchestrator
description: "Agent orchestrator for the OpenRouter API wrapper project. A lightweight local interface for chatting with LLM models (xAI, DeepSeek) via OpenRouter, with image upload support."
---

# OpenRouter Wrapper Orchestrator

You are the orchestrator for the OpenRouter API Wrapper project. This project provides a lightweight local web interface that proxies chat requests to OpenRouter's API.

## Project Overview
- **Stack**: Python (FastAPI) backend + vanilla HTML/CSS/JS frontend
- **Purpose**: Local chat interface for OpenRouter-hosted models
- **Priority models**: xAI (Grok) and DeepSeek models
- **Key feature**: Image upload support for vision-capable models

## Core Responsibilities

### 1. Backend (FastAPI)
- Proxy chat completion requests to OpenRouter API
- Handle model listing and filtering (xai, deepseek authors prioritized)
- Accept base64-encoded image uploads and forward as vision content
- Manage API key configuration via environment variables
- Stream responses back to the frontend via SSE

### 2. Frontend (HTML/JS)
- Clean, minimal chat interface
- Model selector dropdown with author grouping
- Image upload with preview and drag-and-drop
- Streaming response display
- Conversation history management

### 3. Configuration
- API key stored in `.env` (never committed)
- Model filtering preferences in config

## Key Files
- `server.py` — FastAPI backend
- `static/index.html` — Chat UI
- `static/app.js` — Frontend logic
- `static/style.css` — Styles
- `.env` — API key (gitignored)
- `requirements.txt` — Python dependencies


