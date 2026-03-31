# add login session

**ID**: REQ-1774891701  
**Status**: CODE_REVIEW  
**Priority**: MEDIUM  
**Created**: 2026-03-30T17:28:21Z  

## Description

add a login session to prevent abusive use of my API key

## Success Criteria

- [ ] A login page is presented before access to the chat UI; unauthenticated requests to `/api/chat`, `/api/imagine`, and `/api/models` return HTTP 401
- [ ] Users can authenticate with a password (or passphrase) configured via an environment variable (e.g., `APP_PASSWORD`)
- [ ] On successful login, a server-side session token (cookie or JWT) is issued and validated on every subsequent API request
- [ ] Sessions expire after a configurable idle timeout (default 24 hours) and the user is redirected back to the login page
- [ ] The login mechanism works on both the local FastAPI server (`server.py`) and the Vercel serverless deployment (`api/` handlers)

## Technical Notes

- **Approach**: Add a lightweight session/auth middleware layer. A simple password-based gate (single shared password from env var) is sufficient — no user accounts needed. Issue a signed session token (JWT or HMAC-signed cookie) on successful login.
- **Backend — `server.py`**: Add a FastAPI dependency or middleware that checks for a valid session cookie/token on all `/api/*` routes. Add a `POST /api/login` endpoint that validates the password and sets the session cookie.
- **Backend — `api/` (Vercel)**: Add token validation logic in `api/utils.js` so `chat.js`, `models.js`, and `imagine.js` can reuse it. Add an `api/login.js` serverless function. Vercel functions are stateless, so use a JWT or signed cookie approach (not server-side session store).
- **Frontend — `static/index.html` & `static/app.js`**: Add a login form overlay. On page load, check session validity (e.g., call a `/api/session` endpoint or check cookie presence). If invalid, show login form and block chat UI. After login, hide the form and proceed normally.
- **Environment variables**: New `APP_PASSWORD` (required) and optionally `SESSION_SECRET` (for signing tokens) and `SESSION_TTL_HOURS` (default 24).
- **Security considerations**: Use `httpOnly`, `secure` (in production), and `SameSite=Strict` cookie flags. Rate-limit login attempts to prevent brute-force. Hash the password comparison using constant-time comparison. Never expose the password in client-side code or API responses.
- **Affected files**: `server.py`, `api/utils.js`, `api/chat.js`, `api/models.js`, `api/imagine.js`, `static/index.html`, `static/app.js`, `static/style.css`, `.env.example`, `vercel.json` (new route for login), `requirements.txt` (add `PyJWT` or similar).


## Development Plan

1. **Add auth dependencies and environment config**
   - Add `PyJWT` to `requirements.txt`. Add `APP_PASSWORD`, `SESSION_SECRET`, `SESSION_TTL_HOURS` to `.env.example`.
   - Files: `requirements.txt`, `.env.example`

2. **Implement login endpoint and session middleware in `server.py`**
   - Add `POST /api/login` that validates `APP_PASSWORD` and returns a signed JWT in an `httpOnly` cookie. Add a FastAPI dependency that verifies the JWT cookie on all `/api/chat`, `/api/imagine`, `/api/models` routes — returning 401 if missing/expired. Add `GET /api/session` for frontend session checks. Use `hmac.compare_digest` for password comparison.
   - Files: `server.py`

3. **Implement Vercel serverless auth (`api/login.js` + shared validation)**
   - Add JWT signing/verification helpers in `api/utils.js`. Create `api/login.js` serverless function. Guard `api/chat.js`, `api/models.js`, `api/imagine.js` with token validation. Add login route to `vercel.json`.
   - Files: `api/login.js` (new), `api/utils.js`, `api/chat.js`, `api/models.js`, `api/imagine.js`, `vercel.json`

4. **Build login UI in the frontend**
   - Add a login form overlay to `static/index.html`. In `static/app.js`, check `/api/session` on page load — if 401, show login form and block chat; on successful login POST, hide form and initialize chat. Add login form styles to `static/style.css`.
   - Files: `static/index.html`, `static/app.js`, `static/style.css`

5. **End-to-end validation and docs sync**
   - Start the local server, verify: unauthenticated `/api/chat` returns 401; login with correct password sets cookie; subsequent requests succeed; session expiry redirects to login. Run `scripts/regenerate-docs.sh`. Verify with `scripts/show-requirement.sh REQ-1774891701`.
   - Commands: `python server.py`, `bash scripts/regenerate-docs.sh`, `bash scripts/show-requirement.sh REQ-1774891701`

**Last updated**: 2026-03-31T00:00:00Z

## Dependencies

None

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
