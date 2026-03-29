// ── State ──────────────────────────────────────────────
let conversationMessages = [];   // {role, content} — sent to API
let pendingImages = [];          // {dataUrl, base64, mimeType}
let isStreaming = false;

// ── DOM refs ──────────────────────────────────────────
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

// ── Load models ───────────────────────────────────────
async function loadModels() {
  try {
    const resp = await fetch('/api/models');
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();

    modelSelect.innerHTML = '';
    let currentGroup = null;
    let optgroup = null;

    for (const m of data.models) {
      if (m.author !== currentGroup) {
        currentGroup = m.author;
        optgroup = document.createElement('optgroup');
        optgroup.label = currentGroup.toUpperCase();
        modelSelect.appendChild(optgroup);
      }
      const opt = document.createElement('option');
      opt.value = m.id;
      const ctx = m.context_length ? ` (${(m.context_length / 1000).toFixed(0)}k)` : '';
      const vision = m.supports_vision ? ' 👁' : '';
      opt.textContent = `${m.name}${ctx}${vision}`;
      optgroup.appendChild(opt);
    }

    if (data.models.length === 0) {
      modelSelect.innerHTML = '<option value="">No models available</option>';
    }
  } catch (err) {
    modelSelect.innerHTML = `<option value="">Error loading models</option>`;
    console.error('Failed to load models:', err);
  }
}

// ── Send message ──────────────────────────────────────
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isStreaming) return;

  const text = messageInput.value.trim();
  if (!text && pendingImages.length === 0) return;

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
        stream: true,
      }),
    });

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
  } catch (err) {
    contentSpan.innerHTML = `<span class="error-text">Network error: ${escapeHtml(err.message)}</span>`;
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

// ── Render helpers ────────────────────────────────────
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
    pendingImages.push({ dataUrl, base64, mimeType: file.type });
    renderImagePreview(dataUrl, pendingImages.length - 1);
  };
  reader.readAsDataURL(file);
}

function renderImagePreview(dataUrl, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'image-preview';
  wrapper.innerHTML = `<img src="${dataUrl}"><button class="remove-btn" data-idx="${index}">&times;</button>`;
  wrapper.querySelector('.remove-btn').addEventListener('click', (e) => {
    const idx = parseInt(e.target.dataset.idx, 10);
    pendingImages.splice(idx, 1);
    rebuildPreviews();
  });
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

// ── Init ──────────────────────────────────────────────
loadModels();
