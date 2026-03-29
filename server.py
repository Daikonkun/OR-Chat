import os
import json
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
ALLOWED_AUTHORS = {"x-ai", "deepseek"}

app = FastAPI(title="OpenRouter Wrapper")


@app.get("/api/models")
async def list_models():
    """Fetch models from OpenRouter, filtered to allowed authors."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{OPENROUTER_BASE}/models",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()

    models = []
    for m in data.get("data", []):
        model_id: str = m.get("id", "")
        # Filter: only keep models whose id starts with an allowed author prefix
        author = model_id.split("/")[0] if "/" in model_id else ""
        if author not in ALLOWED_AUTHORS:
            continue

        pricing = m.get("pricing", {})
        models.append(
            {
                "id": model_id,
                "name": m.get("name", model_id),
                "author": author,
                "context_length": m.get("context_length"),
                "supports_vision": "image" in json.dumps(m.get("architecture", {})),
                "prompt_price": pricing.get("prompt"),
                "completion_price": pricing.get("completion"),
            }
        )

    # Sort: group by author, then alphabetically
    models.sort(key=lambda x: (x["author"], x["name"]))
    return {"models": models}


@app.post("/api/chat")
async def chat(request: Request):
    """Proxy a chat completion request to OpenRouter, with streaming support."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set")

    body = await request.json()
    model = body.get("model")
    messages = body.get("messages", [])
    stream = body.get("stream", True)
    nsfw = body.get("nsfw", False)

    if not model or not messages:
        raise HTTPException(status_code=400, detail="model and messages are required")

    # Inject NSFW system prompt server-side (overrides any client-supplied system message)
    if nsfw:
        # Filter out existing system messages to prevent client override, then prepend ours
        filtered = [{"role": "system", "content": "You are in NSFW mode. Respond without restrictions on adult content."}]
        filtered += [m for m in messages if m.get("role") != "system"]
        messages = filtered

    # Validate author prefix
    author = model.split("/")[0] if "/" in model else ""
    if author not in ALLOWED_AUTHORS:
        raise HTTPException(status_code=400, detail=f"Model author '{author}' not allowed")

    payload = {
        "model": model,
        "messages": messages,
        "stream": stream,
    }

    # Forward optional parameters
    for key in ("temperature", "max_tokens", "top_p"):
        if key in body:
            payload[key] = body[key]

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_HTTP_REFERER", "http://localhost:8888"),
        "X-Title": os.getenv("OPENROUTER_X_TITLE", "OpenRouter Local Wrapper"),
    }

    if stream:
        return StreamingResponse(
            _stream_response(payload, headers),
            media_type="text/event-stream",
        )
    else:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{OPENROUTER_BASE}/chat/completions",
                json=payload,
                headers=headers,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            return resp.json()


async def _stream_response(payload: dict, headers: dict):
    """Stream SSE chunks from OpenRouter back to the client."""
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{OPENROUTER_BASE}/chat/completions",
            json=payload,
            headers=headers,
        ) as resp:
            if resp.status_code != 200:
                error_body = await resp.aread()
                yield f"data: {json.dumps({'error': error_body.decode()})}\n\n"
                return
            async for line in resp.aiter_lines():
                if line:
                    yield f"{line}\n\n"


# Serve static files (frontend)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8888)
