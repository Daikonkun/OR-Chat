import os
import json
import hmac
import secrets
import logging
from typing import Optional
from urllib.parse import urlparse, urljoin

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response, Cookie, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
XAI_API_KEY = os.getenv("XAI_API_KEY", "")
OPENROUTER_BASE = "https://openrouter.ai/api/v1"

# Configurable xAI API endpoint with validation
XAI_BASE_DEFAULT = "https://api.x.ai/v1/"
XAI_BASE_RAW = os.getenv("XAI_BASE", XAI_BASE_DEFAULT)

# Validate XAI_BASE URL
if XAI_BASE_RAW:
    try:
        parsed = urlparse(XAI_BASE_RAW)
        if not all([parsed.scheme, parsed.netloc]):
            raise ValueError(f"Invalid XAI_BASE URL: {XAI_BASE_RAW}")
        # Ensure URL ends with / for proper urljoin behavior with paths
        XAI_BASE = XAI_BASE_RAW.rstrip('/') + '/'
    except Exception as e:
        logger.warning(f"Invalid XAI_BASE URL '{XAI_BASE_RAW}': {e}")
        logger.warning(f"Falling back to default: {XAI_BASE_DEFAULT}")
        XAI_BASE = XAI_BASE_DEFAULT
else:
    XAI_BASE = XAI_BASE_DEFAULT

# Validate XAI_API_KEY format
def validate_xai_api_key(key: str) -> bool:
    """
    Validate xAI API key format.
    
    Validation assumptions (based on xAI API key patterns as of 2026-03-30):
    1. Keys start with 'xai-' prefix
    2. Minimum total length of 8 characters (prefix + content)
    3. Suffix after 'xai-' contains only alphanumeric characters and hyphens
    
    Note: These assumptions may need updating if xAI changes their key format.
    This validation catches obviously invalid keys early while allowing flexibility.
    
    Args:
        key: The API key to validate
        
    Returns:
        bool: True if key appears valid, False otherwise
    """
    if not key:
        return False
    
    # Check if key starts with 'xai-'
    if not key.startswith('xai-'):
        return False
    
    # Check minimum length (prefix + at least some content)
    if len(key) < 8:
        return False
    
    # Check that the part after 'xai-' contains only alphanumeric characters and hyphens
    suffix = key[4:]  # Remove 'xai-'
    if not all(c.isalnum() or c == '-' for c in suffix):
        return False
    
    return True

# Log warning if XAI_API_KEY format appears invalid
# Track if we've warned about this invalid key to avoid duplicate warnings
has_warned_about_invalid_key = False
if XAI_API_KEY and not validate_xai_api_key(XAI_API_KEY):
    logger.warning("XAI_API_KEY format appears invalid.")
    logger.warning("xAI API keys typically start with 'xai-' and contain alphanumeric characters.")
    logger.warning("Update your .env file with a valid key or this may cause API call failures.")
    has_warned_about_invalid_key = True

ALLOWED_AUTHORS = {"x-ai", "deepseek"}

# ── Session / Auth config ─────────────────────────────
APP_PASSWORD = os.getenv("APP_PASSWORD", "")
SESSION_SECRET = os.getenv("SESSION_SECRET", "") or secrets.token_hex(32)
SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "24"))

def auth_enabled() -> bool:
    """Auth is active only when APP_PASSWORD is configured."""
    return bool(APP_PASSWORD)

import datetime

def create_session_token() -> str:
    """Create a signed JWT session token."""
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=SESSION_TTL_HOURS)
    return jwt.encode({"exp": exp}, SESSION_SECRET, algorithm="HS256")

def verify_session_token(token: str) -> bool:
    """Verify a JWT session token. Returns True if valid and not expired."""
    try:
        jwt.decode(token, SESSION_SECRET, algorithms=["HS256"])
        return True
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return False

async def require_auth(request: Request):
    """FastAPI dependency that enforces session auth on protected routes."""
    if not auth_enabled():
        return  # No password configured — auth disabled
    token = request.cookies.get("session_token")
    if not token or not verify_session_token(token):
        raise HTTPException(status_code=401, detail="Unauthorized")

app = FastAPI(title="OpenRouter Wrapper")


# ── Login / Session endpoints ─────────────────────────
@app.post("/api/login")
async def login(request: Request):
    """Validate password and issue a session cookie."""
    if not auth_enabled():
        return {"ok": True}

    body = await request.json()
    password = body.get("password", "")

    if not hmac.compare_digest(password, APP_PASSWORD):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_session_token()
    response = JSONResponse({"ok": True})
    is_secure = request.url.scheme == "https"
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=is_secure,
        samesite="strict",
        max_age=SESSION_TTL_HOURS * 3600,
        path="/",
    )
    return response


@app.get("/api/session")
async def check_session(request: Request):
    """Return 200 if session is valid (or auth disabled), 401 otherwise."""
    if not auth_enabled():
        return {"authenticated": True, "authRequired": False}

    token = request.cookies.get("session_token")
    if not token or not verify_session_token(token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"authenticated": True, "authRequired": True}


@app.post("/api/logout")
async def logout():
    """Clear the session cookie."""
    response = JSONResponse({"ok": True})
    response.delete_cookie(key="session_token", path="/")
    return response


@app.get("/api/models")
async def list_models(request: Request, _=Depends(require_auth)):
    """Fetch models from OpenRouter, filtered to allowed authors."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            urljoin(OPENROUTER_BASE, "models"),
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
                "uses_direct_api": author == "x-ai" and XAI_API_KEY and validate_xai_api_key(XAI_API_KEY),  # Indicate if direct xAI API will be used
                "prompt_price": pricing.get("prompt"),
                "completion_price": pricing.get("completion"),
            }
        )

    # Sort: group by author, then alphabetically
    models.sort(key=lambda x: (x["author"], x["name"]))
    return {"models": models}


@app.post("/api/chat")
async def chat(request: Request, _=Depends(require_auth)):
    """Proxy a chat completion request to OpenRouter or direct xAI API."""
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

    # Determine which API to use
    # Check if x-ai model is selected but XAI_API_KEY is invalid
    if author == "x-ai" and XAI_API_KEY and not validate_xai_api_key(XAI_API_KEY):
        if not has_warned_about_invalid_key:
            logger.warning("x-ai model selected but XAI_API_KEY format appears invalid.")
            logger.warning("Falling back to OpenRouter API. Update your .env file with a valid xAI API key to use direct xAI API.")
    
    use_direct_xai = (author == "x-ai" and XAI_API_KEY and validate_xai_api_key(XAI_API_KEY))
    
    if use_direct_xai:
        # Use direct xAI API
        api_base = XAI_BASE
        api_key = XAI_API_KEY
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        # xAI API might have different parameter names or requirements
        # TODO: Investigate xAI API differences and implement proper parameter mapping
        # For now, use same payload structure
        payload = {
            "model": model.split("/")[1] if "/" in model else model,  # Remove "x-ai/" prefix for direct API
            "messages": messages,
            "stream": stream,
        }
    else:
        # Use OpenRouter API
        if not OPENROUTER_API_KEY:
            raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set")
        
        api_base = OPENROUTER_BASE
        api_key = OPENROUTER_API_KEY
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("OPENROUTER_HTTP_REFERER", "http://localhost:8888"),
            "X-Title": os.getenv("OPENROUTER_X_TITLE", "OpenRouter Local Wrapper"),
        }
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
        }

    # Forward optional parameters
    for key in ("temperature", "max_tokens", "top_p"):
        if key in body:
            payload[key] = body[key]

    if stream:
        return StreamingResponse(
            _stream_response(payload, headers, api_base, use_direct_xai),
            media_type="text/event-stream",
        )
    else:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                urljoin(api_base, "chat/completions"),
                json=payload,
                headers=headers,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            return resp.json()


async def _stream_response(payload: dict, headers: dict, api_base: str, is_xai_direct: bool = False):
    """Stream SSE chunks from API back to the client."""
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            urljoin(api_base, "chat/completions"),
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


ALLOWED_IMAGINE_MODELS = {"grok-imagine-image", "grok-imagine-image-pro"}
ALLOWED_ASPECT_RATIOS = {
    "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3",
    "2:1", "1:2", "19.5:9", "9:19.5", "20:9", "9:20", "auto",
}
ALLOWED_RESOLUTIONS = {"1k", "2k"}


@app.post("/api/imagine")
async def imagine(request: Request, _=Depends(require_auth)):
    """Proxy image generation requests to the xAI Grok Imagine API."""
    if not validate_xai_api_key(XAI_API_KEY):
        raise HTTPException(
            status_code=500,
            detail="XAI_API_KEY not set or invalid. Image generation requires a valid xAI API key.",
        )

    body = await request.json()
    prompt = body.get("prompt")
    model = body.get("model", "grok-imagine-image-pro")
    n = body.get("n", 1)
    response_format = body.get("response_format", "url")
    aspect_ratio = body.get("aspect_ratio")
    resolution = body.get("resolution")

    if not prompt or not isinstance(prompt, str):
        raise HTTPException(status_code=400, detail="prompt is required and must be a string")

    if len(prompt) > 4000:
        raise HTTPException(status_code=400, detail="prompt must be 4000 characters or fewer")

    if model not in ALLOWED_IMAGINE_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Model '{model}' not allowed. Allowed: {', '.join(sorted(ALLOWED_IMAGINE_MODELS))}",
        )

    if not isinstance(n, int) or n < 1 or n > 10:
        raise HTTPException(status_code=400, detail="n must be an integer between 1 and 10")

    if aspect_ratio and aspect_ratio not in ALLOWED_ASPECT_RATIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid aspect_ratio. Allowed: {', '.join(sorted(ALLOWED_ASPECT_RATIOS))}",
        )

    if resolution and resolution not in ALLOWED_RESOLUTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid resolution. Allowed: {', '.join(sorted(ALLOWED_RESOLUTIONS))}",
        )

    payload = {"model": model, "prompt": prompt, "n": n, "response_format": response_format}
    if aspect_ratio:
        payload["aspect_ratio"] = aspect_ratio
    if resolution:
        payload["resolution"] = resolution

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            urljoin(XAI_BASE, "images/generations"),
            json=payload,
            headers={
                "Authorization": f"Bearer {XAI_API_KEY}",
                "Content-Type": "application/json",
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


# Serve static files (frontend)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8888)
