// ── State ──────────────────────────────────────────────
let conversationMessages = [];   // {role, content} — sent to API
let pendingImages = [];          // {dataUrl, base64, mimeType}
let isStreaming = false;
let nsfwMode = localStorage.getItem('nsfwMode') === 'true';

// ── DOM refs ──────────────────────────────────────────
const loginOverlay  = document.getElementById('login-overlay');
const loginForm     = document.getElementById('login-form');
const loginPassword = document.getElementById('login-password');
const loginBtn      = document.getElementById('login-btn');
const loginError    = document.getElementById('login-error');
const appDiv        = document.getElementById('app');
const logoutBtn     = document.getElementById('logout-btn');
const authorSelect  = document.getElementById('author-select');
const modelSelect   = document.getElementById('model-select');
const messagesDiv   = document.getElementById('messages');
const chatForm      = document.getElementById('chat-form');
const messageInput  = document.getElementById('message-input');
const sendBtn       = document.getElementById('send-btn');
const imageInput    = document.getElementById('image-input');
const previewBar    = document.getElementById('image-preview-bar');
const newChatBtn    = document.getElementById('new-chat-btn');
const footerEl      = document.querySelector('footer');
const chatContainer = document.getElementById('chat-container');
const nsfwToggleBtn = document.getElementById('nsfw-toggle-btn');
const apiBadge     = document.getElementById('api-badge');
const imagineBtn   = document.getElementById('imagine-btn');
const aspectSelect = document.getElementById('aspect-ratio-select');

// Model metadata cache (keyed by model id)
let modelMeta = {};
// Full model list cache (all authors)
let allModels = [];

// Apply persisted NSFW toggle state
if (nsfwMode) {
  nsfwToggleBtn.classList.add('nsfw-active');
  nsfwToggleBtn.title = 'NSFW mode ON';
}

// ── NSFW toggle ───────────────────────────────────────
nsfwToggleBtn.addEventListener('click', () => {
  nsfwMode = !nsfwMode;
  localStorage.setItem('nsfwMode', nsfwMode);
  nsfwToggleBtn.classList.toggle('nsfw-active', nsfwMode);
  nsfwToggleBtn.title = nsfwMode ? 'NSFW mode ON' : 'Toggle NSFW mode';
});

// ── Load models ───────────────────────────────────────
async function loadModels() {
  try {
    const resp = await fetch('/api/models');
    if (handle401(resp)) return;
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();

    allModels = data.models || [];
    modelMeta = {};
    for (const m of allModels) {
      modelMeta[m.id] = m;
    }

    // Populate author dropdown from API response
    const authors = data.authors || [];
    authorSelect.innerHTML = '';
    for (const a of authors) {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.label;
      authorSelect.appendChild(opt);
    }

    // Restore persisted author or default to first option
    const savedAuthor = localStorage.getItem('selectedAuthor');
    if (savedAuthor && [...authorSelect.options].some(o => o.value === savedAuthor)) {
      authorSelect.value = savedAuthor;
    }

    filterModelsByAuthor();
  } catch (err) {
    modelSelect.innerHTML = `<option value="">Error loading models</option>`;
    console.error('Failed to load models:', err);
  }
}

// ── Filter models by selected author ─────────────────
function filterModelsByAuthor() {
  const author = authorSelect.value;
  localStorage.setItem('selectedAuthor', author);

  const filtered = allModels.filter(m => m.author === author);
  modelSelect.innerHTML = '';

  for (const m of filtered) {
    const opt = document.createElement('option');
    opt.value = m.id;
    const ctx = m.context_length ? ` (${(m.context_length / 1000).toFixed(0)}k)` : '';
    const vision = m.supports_vision ? ' 👁' : '';
    const direct = m.uses_direct_api ? ' ⚡' : '';
    opt.textContent = `${m.name}${ctx}${vision}${direct}`;
    modelSelect.appendChild(opt);
  }

  if (filtered.length === 0) {
    modelSelect.innerHTML = '<option value="">No models available</option>';
  }

  updateApiBadge();
}

authorSelect.addEventListener('change', filterModelsByAuthor);

// ── API source badge ──────────────────────────────────
modelSelect.addEventListener('change', updateApiBadge);

function updateApiBadge() {
  const meta = modelMeta[modelSelect.value];
  if (!meta) {
    apiBadge.hidden = true;
    return;
  }
  apiBadge.hidden = false;
  if (meta.uses_direct_api) {
    apiBadge.textContent = '⚡ xAI Direct';
    apiBadge.className = 'api-badge api-badge-direct';
  } else {
    apiBadge.textContent = '🔀 OpenRouter';
    apiBadge.className = 'api-badge api-badge-openrouter';
  }
}

// ── Send message ──────────────────────────────────────
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isStreaming) return;

  const text = messageInput.value.trim();
  if (!text && pendingImages.length === 0) return;

  // Check for /imagine command
  if (text.startsWith('/imagine ')) {
    const prompt = text.slice(9).trim();
    if (!prompt) { alert('Usage: /imagine <prompt>'); return; }
    messageInput.value = '';
    messageInput.style.height = 'auto';
    await generateImage(prompt);
    return;
  }

  const model = modelSelect.value;
  if (!model) { alert('Select a model first'); return; }

  // Build content array (text + images)
  const contentParts = [];

  for (const img of pendingImages) {
    contentParts.push({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    });
  }

  if (text) {
    contentParts.push({ type: 'text', text });
  }

  // If no images, just send plain text string
  const content = pendingImages.length > 0 ? contentParts : text;

  const userMsg = { role: 'user', content };
  conversationMessages.push(userMsg);

  // Render user message
  renderUserMessage(text, pendingImages.map(i => i.dataUrl));

  // Clear input
  messageInput.value = '';
  messageInput.style.height = 'auto';
  pendingImages = [];
  previewBar.innerHTML = '';

  // Stream response
  await streamAssistantResponse(model);
});

async function streamAssistantResponse(model) {
  isStreaming = true;
  sendBtn.disabled = true;

  const assistantEl = createMessageEl('assistant', '');
  const contentSpan = assistantEl.querySelector('.content');

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: conversationMessages,
        nsfw: nsfwMode,
        stream: true,
      }),
    });

    if (handle401(resp)) return;

    if (!resp.ok) {
      const errText = await resp.text();
      contentSpan.innerHTML = `<span class="error-text">Error: ${escapeHtml(errText)}</span>`;
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            contentSpan.innerHTML += `<span class="error-text">${escapeHtml(JSON.stringify(parsed.error))}</span>`;
            continue;
          }
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            assistantText += delta;
            contentSpan.textContent = assistantText;
            scrollToBottom();
          }
        } catch { /* skip non-JSON lines */ }
      }
    }

    conversationMessages.push({ role: 'assistant', content: assistantText });

    // Final render: parse markdown images with URL validation
    renderAssistantContent(contentSpan, assistantText);
    scrollToBottom();
  } catch (err) {
    contentSpan.innerHTML = `<span class="error-text">Network error: ${escapeHtml(err.message)}</span>`;
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

// ── Base64 validation ─────────────────────────────────
function isValidBase64(str) {
  if (typeof str !== 'string' || str.length === 0) return false;
  if (str.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
}

// ── Image URL validation ──────────────────────────────
function isAllowedImageUrl(url) {
  if (typeof url !== 'string' || url.length === 0) return false;

  // Allow data:image/* URLs only if base64 payload is valid
  const dataMatch = url.match(/^data:image\/(png|jpeg|gif|webp);base64,(.+)$/i);
  if (dataMatch) return isValidBase64(dataMatch[2]);

  // Reject all other data: URLs (e.g. data:text/html, data:image/svg+xml)
  if (/^data:/i.test(url)) return false;

  try {
    const parsed = new URL(url);
    // Only allow https: scheme — reject http:, javascript:, blob:, etc.
    if (parsed.protocol !== 'https:') return false;
    return true;
  } catch {
    // Malformed URL
    return false;
  }
}

// ── Render helpers ────────────────────────────────────
function renderAssistantContent(contentEl, text) {
  // Clear previous content
  contentEl.textContent = '';

  // Match markdown image syntax: ![alt](url)
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = imagePattern.exec(text)) !== null) {
    // Append text before this match
    if (match.index > lastIndex) {
      contentEl.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    const alt = match[1];
    const url = match[2];

    if (isAllowedImageUrl(url)) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = alt; // alt is set via DOM property, safe from injection
      img.className = 'assistant-image';
      contentEl.appendChild(img);
    } else {
      // Rejected URL — render as escaped plain text with warning
      const warning = document.createElement('span');
      warning.className = 'blocked-image';
      warning.textContent = `[Image blocked: ${url}]`;
      contentEl.appendChild(warning);
    }

    lastIndex = imagePattern.lastIndex;
  }

  // Append remaining text after last match
  if (lastIndex < text.length) {
    contentEl.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

function renderUserMessage(text, imageDataUrls) {
  const el = createMessageEl('user', text);
  const contentEl = el.querySelector('.content');
  for (const url of imageDataUrls) {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'attached-image';
    contentEl.appendChild(img);
  }
  scrollToBottom();
}

function createMessageEl(role, text) {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  el.innerHTML = `<div class="role-label">${role}</div><div class="content"></div>`;
  el.querySelector('.content').textContent = text;
  messagesDiv.appendChild(el);
  return el;
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Image handling ────────────────────────────────────
imageInput.addEventListener('change', () => {
  for (const file of imageInput.files) {
    addImageFile(file);
  }
  imageInput.value = '';
});

function addImageFile(file) {
  const ALLOWED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (!ALLOWED.includes(file.type)) {
    alert(`Unsupported image type: ${file.type}`);
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    alert('Image too large (max 20 MB)');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const base64 = dataUrl.split(',')[1];
    if (!isValidBase64(base64)) {
      alert('Image file produced invalid base64 data. Please try another file.');
      return;
    }
    pendingImages.push({ dataUrl, base64, mimeType: file.type });
    renderImagePreview(dataUrl, pendingImages.length - 1);
  };
  reader.readAsDataURL(file);
}

function renderImagePreview(dataUrl, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'image-preview';

  const img = document.createElement('img');
  img.src = dataUrl;
  wrapper.appendChild(img);

  const btn = document.createElement('button');
  btn.className = 'remove-btn';
  btn.dataset.idx = index;
  btn.textContent = '\u00D7';
  btn.addEventListener('click', (e) => {
    const idx = parseInt(e.target.dataset.idx, 10);
    pendingImages.splice(idx, 1);
    rebuildPreviews();
  });
  wrapper.appendChild(btn);

  previewBar.appendChild(wrapper);
}

function rebuildPreviews() {
  previewBar.innerHTML = '';
  pendingImages.forEach((img, i) => renderImagePreview(img.dataUrl, i));
}

// ── Drag & drop ───────────────────────────────────────
footerEl.addEventListener('dragenter', (e) => { e.preventDefault(); footerEl.classList.add('drag-over'); });
footerEl.addEventListener('dragover',  (e) => { e.preventDefault(); });
footerEl.addEventListener('dragleave', (e) => { e.preventDefault(); footerEl.classList.remove('drag-over'); });
footerEl.addEventListener('drop', (e) => {
  e.preventDefault();
  footerEl.classList.remove('drag-over');
  for (const file of e.dataTransfer.files) {
    if (file.type.startsWith('image/')) addImageFile(file);
  }
});

// ── Auto-resize textarea ─────────────────────────────
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
});

// Shift+Enter for newline, Enter to send
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// Show/hide imagine controls based on /imagine prefix
messageInput.addEventListener('input', () => {
  const show = messageInput.value.trimStart().startsWith('/imagine');
  aspectSelect.classList.toggle('imagine-visible', show);
  imagineBtn.classList.toggle('imagine-visible', show);
});

// ── Imagine button ────────────────────────────────────
imagineBtn.addEventListener('click', async () => {
  if (isStreaming) return;
  const text = messageInput.value.trim();
  if (!text) { alert('Type a prompt first, then click 🎨'); return; }
  messageInput.value = '';
  messageInput.style.height = 'auto';
  await generateImage(text);
});

// ── Image generation ──────────────────────────────────
async function generateImage(prompt) {
  isStreaming = true;
  sendBtn.disabled = true;
  imagineBtn.disabled = true;

  // Show user prompt and add to conversation history
  const userMsg = { role: 'user', content: `/imagine ${prompt}` };
  conversationMessages.push(userMsg);
  renderUserMessage(`/imagine ${prompt}`, []);

  // Create assistant message with loading state
  const assistantEl = createMessageEl('assistant', '');
  const contentEl = assistantEl.querySelector('.content');
  contentEl.innerHTML = '<div class="imagine-loading"><span class="spinner"></span> Generating image…</div>';
  scrollToBottom();

  const aspect_ratio = aspectSelect.value || undefined;

  try {
    const resp = await fetch('/api/imagine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: 'grok-imagine-image-pro', aspect_ratio }),
    });

    if (handle401(resp)) return;

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({ error: resp.statusText }));
      contentEl.innerHTML = `<span class="error-text">Image generation failed: ${escapeHtml(typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error))}</span>`;
      return;
    }

    const data = await resp.json();
    contentEl.innerHTML = '';

    if (data.data && data.data.length > 0) {
      for (const img of data.data) {
        const url = img.url || img.b64_json;
        if (!url) continue;

        const imgEl = document.createElement('img');
        imgEl.className = 'generated-image';

        if (img.b64_json) {
          imgEl.src = `data:${img.mime_type || 'image/jpeg'};base64,${img.b64_json}`;
        } else if (isAllowedImageUrl(url)) {
          imgEl.src = url;
        } else {
          const warning = document.createElement('span');
          warning.className = 'blocked-image';
          warning.textContent = `[Image blocked: invalid URL]`;
          contentEl.appendChild(warning);
          continue;
        }

        imgEl.alt = prompt;
        contentEl.appendChild(imgEl);
      }

      if (data.data[0]?.revised_prompt) {
        const revised = document.createElement('div');
        revised.className = 'revised-prompt';
        revised.textContent = data.data[0].revised_prompt;
        contentEl.appendChild(revised);
      }

      // Add to conversation history so LLM has context
      const imageUrls = data.data.map(d => d.url).filter(Boolean);
      conversationMessages.push({
        role: 'assistant',
        content: `[Generated image for: ${prompt}]${imageUrls.length ? '\n' + imageUrls.join('\n') : ''}`,
      });
    } else {
      contentEl.innerHTML = '<span class="error-text">No images returned</span>';
    }

    scrollToBottom();
  } catch (err) {
    contentEl.innerHTML = `<span class="error-text">Network error: ${escapeHtml(err.message)}</span>`;
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    imagineBtn.disabled = false;
    messageInput.focus();
  }
}

// ── New chat ──────────────────────────────────────────
newChatBtn.addEventListener('click', () => {
  conversationMessages = [];
  pendingImages = [];
  messagesDiv.innerHTML = '';
  previewBar.innerHTML = '';
  messageInput.value = '';
  messageInput.style.height = 'auto';
  messageInput.focus();
});

// ── Session / Login ───────────────────────────────────
function showLogin() {
  loginOverlay.hidden = false;
  appDiv.hidden = true;
  logoutBtn.hidden = true;
  loginPassword.value = '';
  loginError.hidden = true;
  loginPassword.focus();
}

function showApp(authRequired) {
  loginOverlay.hidden = true;
  appDiv.hidden = false;
  logoutBtn.hidden = !authRequired;
  loadModels();
  messageInput.focus();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginBtn.disabled = true;
  loginError.hidden = true;

  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: loginPassword.value }),
    });

    if (!resp.ok) {
      loginError.textContent = 'Invalid password';
      loginError.hidden = false;
      loginPassword.select();
      return;
    }

    showApp(true);
  } catch (err) {
    loginError.textContent = 'Connection error';
    loginError.hidden = false;
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch { /* ignore */ }
  conversationMessages = [];
  messagesDiv.innerHTML = '';
  showLogin();
});

// Handle 401 on any API call — redirect to login
function handle401(resp) {
  if (resp.status === 401) {
    showLogin();
    return true;
  }
  return false;
}

// ── Init ──────────────────────────────────────────────
async function init() {
  try {
    const resp = await fetch('/api/session');
    if (resp.ok) {
      const data = await resp.json();
      showApp(data.authRequired);
    } else {
      showLogin();
    }
  } catch {
    // Network error — show app anyway (might be local dev without auth)
    showApp(false);
  }
}

init();
