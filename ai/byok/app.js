/* =============================================
   LLM PLAYGROUND — BYOK
   app.js — Vanilla JS, no dependencies
   ============================================= */

'use strict';

// ── CONFIG ──────────────────────────────────────────────────────────────────

// ① Conversation history limits
// Only the last MAX_CONTEXT_MESSAGES are sent to the API.
// When older messages are dropped, a compact local summary is prepended
// so the model retains context — no extra API call needed.
const MAX_CONTEXT_MESSAGES = 20;   // 10 user/assistant pairs
const WARN_AT_MESSAGES     = 16;   // show a soft notice before trimming kicks in

const PROVIDERS = {
  claude: {
    label:    'Claude',
    keyHint:  'console.anthropic.com',
    placeholder: 'sk-ant-••••••••••••••••••',
    models: [
      { id: 'claude-opus-4-6',           label: 'Claude Opus 4.6'   },
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5'  },
    ],
    endpoint: 'https://api.anthropic.com/v1/messages',
  },
  openai: {
    label:    'ChatGPT',
    keyHint:  'platform.openai.com',
    placeholder: 'sk-••••••••••••••••••••••',
    models: [
      { id: 'gpt-4o',        label: 'GPT-4o'        },
      { id: 'gpt-4o-mini',   label: 'GPT-4o mini'   },
      { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo'   },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
  gemini: {
    label:    'Gemini',
    keyHint:  'aistudio.google.com',
    placeholder: 'AIza••••••••••••••••••••',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro'   },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
    // Endpoint is built dynamically for Gemini (model + key in URL)
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
};

// ── STATE ────────────────────────────────────────────────────────────────────

let state = {
  theme:        'dark',
  provider:     'claude',
  model:        PROVIDERS.claude.models[0].id,
  apiKey:       '',
  saveKey:      true,    // ② whether to persist key in localStorage
  systemPrompt: 'You are a helpful, concise assistant. Answer clearly and directly.',
  temperature:  0.7,
  messages:     [],      // full display history { role, content }
  loading:      false,
  maxTokens:    1024,
};

// ── DOM REFS ─────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const els = {
  providerBtns:       document.querySelectorAll('.seg-btn'),
  providerInput:      $('provider'),
  modelSelect:        $('model'),
  apiKeyInput:        $('api-key'),
  toggleKey:          $('toggle-key'),
  keyHint:            $('key-hint'),
  saveKeyCheckbox:    $('save-key-checkbox'),   // ②
  btnForgetKey:       $('btn-forget-key'),       // ②
  systemPromptTA:     $('system-prompt'),
  systemPromptPrev:   $('system-prompt-preview'),
  toggleSystemPrompt: $('toggle-system-prompt'),
  temperature:        $('temperature'),
  tempValue:          $('temp-value'),
  chatWindow:         $('chat-window'),
  chatEmpty:          $('chat-empty'),
  userInput:          $('user-input'),
  charCount:          $('char-count'),
  btnSend:            $('btn-send'),
  btnText:            $('btn-text'),
  btnIcon:            $('btn-icon'),
  spinner:            $('spinner'),
  btnClear:           $('btn-clear'),
  themeToggleBtn:     $('theme-toggle-btn'),     // ④
  tokensSlider:       $('tokens-slider'),
  maxTokensValue:     $('tokens-value'),
};

// ── INIT ──────────────────────────────────────────────────────────────────────

(function init() {
  populateModels(state.provider);
  bindEvents();

  const body = document.body;

  // Theme: localStorage wins, then system preference, default = dark
  const savedTheme = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
    body.className = 'light-mode';
    state.theme = 'light';
  }

  // Restore last provider
  const lastProvider = localStorage.getItem('provider');
  if (lastProvider && PROVIDERS[lastProvider]) {
    setProvider(lastProvider);
  }

  // ② Restore save-key preference
  const savedSaveKey = localStorage.getItem('save_key');
  state.saveKey = savedSaveKey !== 'false';   // default: true
  els.saveKeyCheckbox.checked = state.saveKey;

  // ② Restore API key only if saveKey is on
  if (state.saveKey) {
    const lastKey = localStorage.getItem('api_key');
    if (lastKey) {
      state.apiKey = lastKey;
      els.apiKeyInput.value = lastKey;
    }
  }
})();

// ── EVENTS ────────────────────────────────────────────────────────────────────

function bindEvents() {

  // Provider segmented control
  els.providerBtns.forEach(btn => {
    btn.addEventListener('click', () => setProvider(btn.dataset.provider));
  });

  // Model select
  els.modelSelect.addEventListener('change', () => {
    state.model = els.modelSelect.value;
  });

  // API Key input
  els.apiKeyInput.addEventListener('input', () => {
    state.apiKey = els.apiKeyInput.value.trim();
    if (state.saveKey) {
      localStorage.setItem('api_key', state.apiKey);
      localStorage.setItem('provider', state.provider);
    }
  });

  // Toggle API key visibility
  els.toggleKey.addEventListener('click', () => {
    const isPassword = els.apiKeyInput.type === 'password';
    els.apiKeyInput.type = isPassword ? 'text' : 'password';
    els.toggleKey.title = isPassword ? 'Hide key' : 'Show key';
    els.toggleKey.querySelector('svg').style.opacity = isPassword ? '0.4' : '1';
  });

  // ② Save-key checkbox
  els.saveKeyCheckbox.addEventListener('change', () => {
    state.saveKey = els.saveKeyCheckbox.checked;
    localStorage.setItem('save_key', String(state.saveKey));
    if (!state.saveKey) {
      // User unchecked — wipe the stored key immediately
      localStorage.removeItem('api_key');
    } else if (state.apiKey) {
      // User re-checked and a key is already in the field — save it now
      localStorage.setItem('api_key', state.apiKey);
      localStorage.setItem('provider', state.provider);
    }
  });

  // ② Forget-key button
  els.btnForgetKey.addEventListener('click', () => {
    localStorage.removeItem('api_key');
    localStorage.removeItem('provider');
    state.apiKey = '';
    els.apiKeyInput.value = '';
    // Also uncheck "remember" so it doesn't get re-saved on next input
    state.saveKey = false;
    els.saveKeyCheckbox.checked = false;
    localStorage.setItem('save_key', 'false');
    // Visual feedback
    els.apiKeyInput.style.borderColor = 'var(--accent)';
    setTimeout(() => (els.apiKeyInput.style.borderColor = ''), 1400);
  });

  // System prompt toggle
  els.toggleSystemPrompt.addEventListener('click', toggleSystemPromptEdit);
  els.systemPromptPrev.addEventListener('click', toggleSystemPromptEdit);

  els.systemPromptTA.addEventListener('input', () => {
    state.systemPrompt = els.systemPromptTA.value;
    els.systemPromptPrev.textContent = state.systemPrompt || '(empty)';
  });

  // Temperature slider
  els.temperature.addEventListener('input', () => {
    state.temperature = parseFloat(els.temperature.value);
    els.tempValue.textContent = state.temperature.toFixed(1);
  });

  // Tokens slider
  els.tokensSlider.addEventListener('input', () => {
    state.maxTokens = parseInt(els.tokensSlider.value);
    els.maxTokensValue.textContent = state.maxTokens;
  });

  // ④ Theme toggle button in header
  els.themeToggleBtn.addEventListener('click', () => {
    const body = document.body;
    if (state.theme === 'dark') {
      state.theme = 'light';
      body.className = 'light-mode';
    } else {
      state.theme = 'dark';
      body.className = '';
    }
    localStorage.setItem('theme', state.theme);
  });

  // User input char counter
  els.userInput.addEventListener('input', () => {
    const len = els.userInput.value.length;
    els.charCount.textContent = len;
    els.charCount.style.color = len > 1800 ? '#ff9b9b' : '';
  });

  // Enter to send (Shift+Enter = newline)
  els.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Send button
  els.btnSend.addEventListener('click', handleSend);

  // Clear chat
  els.btnClear.addEventListener('click', clearChat);
}

// ── PROVIDER ─────────────────────────────────────────────────────────────────

function setProvider(p) {
  if (!PROVIDERS[p]) return;
  state.provider = p;
  state.model    = PROVIDERS[p].models[0].id;

  els.providerBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === p);
  });

  els.keyHint.textContent     = PROVIDERS[p].keyHint;
  els.apiKeyInput.placeholder = PROVIDERS[p].placeholder;
  if (els.apiKeyInput.value === '') state.apiKey = '';

  populateModels(p);
}

function populateModels(p) {
  const models = PROVIDERS[p].models;
  els.modelSelect.innerHTML = models
    .map(m => `<option value="${m.id}">${m.label}</option>`)
    .join('');
  state.model = models[0].id;
}

// ── SYSTEM PROMPT TOGGLE ──────────────────────────────────────────────────────

function toggleSystemPromptEdit() {
  const isEditing = !els.systemPromptTA.classList.contains('hidden');
  if (isEditing) {
    els.systemPromptTA.classList.add('hidden');
    els.systemPromptPrev.classList.remove('hidden');
    els.toggleSystemPrompt.textContent = 'edit';
    els.systemPromptPrev.textContent   = state.systemPrompt || '(empty)';
  } else {
    els.systemPromptTA.classList.remove('hidden');
    els.systemPromptPrev.classList.add('hidden');
    els.toggleSystemPrompt.textContent = 'done';
    els.systemPromptTA.value           = state.systemPrompt;
    els.systemPromptTA.focus();
  }
}

// ── SEND ─────────────────────────────────────────────────────────────────────

async function handleSend() {
  const text = els.userInput.value.trim();

  if (!text)         return showError('Please enter a message.');
  if (!state.apiKey) return showError('Please enter your API key.');
  if (state.loading) return;

  addMessage('user', text);
  state.messages.push({ role: 'user', content: text });
  els.userInput.value = '';
  els.charCount.textContent = '0';

  // ① Warn the user once, just before the window starts trimming
  if (state.messages.length === WARN_AT_MESSAGES) {
    addNotice(`ℹ️ Conversation is getting long. Oldest messages will be summarised for context to stay within token limits.`);
  }

  setLoading(true);
  const typingId = showTypingIndicator();

  try {
    let responseText;
    switch (state.provider) {
      case 'claude':  responseText = await callClaude();  break;
      case 'openai':  responseText = await callOpenAI();  break;
      case 'gemini':  responseText = await callGemini();  break;
      default: throw new Error(`Unknown provider: ${state.provider}`);
    }

    removeTypingIndicator(typingId);
    addMessage('assistant', responseText, state.provider);
    state.messages.push({ role: 'assistant', content: responseText });

    // ① Notify whenever a trim just happened (first time and every time after)
    if (state.messages.length > MAX_CONTEXT_MESSAGES) {
      const dropped = state.messages.length - MAX_CONTEXT_MESSAGES;
      addNotice(`↩ ${dropped} older message${dropped > 1 ? 's' : ''} condensed into context summary sent to the model.`);
    }

  } catch (err) {
    removeTypingIndicator(typingId);
    addMessage('error', formatError(err));
    state.messages.pop();   // revert the user message from state
  }

  setLoading(false);
}

// ── HISTORY WINDOWING ────────────────────────────────────────────────────────
//
// ① state.messages keeps the FULL chat history (for display).
//    getWindowedMessages() returns only what's sent to the API.
//
//    When the history exceeds MAX_CONTEXT_MESSAGES, the oldest messages are
//    dropped and replaced with a compact plain-text summary injected as the
//    opening user/assistant pair — no extra API call required.

function getWindowedMessages() {
  const msgs = state.messages;
  if (msgs.length <= MAX_CONTEXT_MESSAGES) return msgs;

  const dropped = msgs.slice(0, msgs.length - MAX_CONTEXT_MESSAGES);
  const kept    = msgs.slice(msgs.length - MAX_CONTEXT_MESSAGES);

  // Build a compact summary of the dropped messages (≤120 chars per turn)
  const summaryLines = dropped.map(m => {
    const who     = m.role === 'user' ? 'User' : 'Assistant';
    const preview = m.content.length > 120
      ? m.content.slice(0, 120) + '…'
      : m.content;
    return `${who}: ${preview}`;
  }).join('\n');

  const contextMsg = {
    role: 'user',
    content: `[Summary of ${dropped.length} earlier message${dropped.length > 1 ? 's' : ''}:\n${summaryLines}]`,
  };
  const ackMsg = {
    role: 'assistant',
    content: '[Understood. Continuing from the above context.]',
  };

  return [contextMsg, ackMsg, ...kept];
}

// ── API CALLS ─────────────────────────────────────────────────────────────────

async function callClaude() {
  const body = {
    model:       state.model,
    max_tokens:  state.maxTokens,
    temperature: state.temperature,
    system:      state.systemPrompt,
    messages:    getWindowedMessages().map(m => ({ role: m.role, content: m.content })),
  };

  const res = await fetch(PROVIDERS.claude.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':                              'application/json',
      'x-api-key':                                 state.apiKey,
      'anthropic-version':                         '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude API error ${res.status}`);
  }

  return data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
}

async function callOpenAI() {
  const messages = [
    { role: 'system', content: state.systemPrompt },
    ...getWindowedMessages().map(m => ({ role: m.role, content: m.content })),
  ];

  const body = {
    model:       state.model,
    messages,
    max_tokens:  state.maxTokens,
    temperature: Math.min(state.temperature, 2),
  };

  const res = await fetch(PROVIDERS.openai.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `OpenAI API error ${res.status}`);
  }

  return data.choices?.[0]?.message?.content?.trim() ?? '(empty response)';
}

async function callGemini() {
  const contents = getWindowedMessages().map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Gemini 1.x caps at 1.0; Gemini 2.x supports up to 2.0
  const tempToSet = state.model.startsWith('gemini-1')
    ? Math.min(state.temperature, 1)
    : Math.min(state.temperature, 2);

  const body = {
    contents,
    systemInstruction: state.systemPrompt
      ? { parts: [{ text: state.systemPrompt }] }
      : undefined,
    generationConfig: {
      temperature:     tempToSet,
      maxOutputTokens: state.maxTokens,
    },
  };

  const url = `${PROVIDERS.gemini.endpoint}/${state.model}:generateContent?key=${state.apiKey}`;

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini API error ${res.status}`);
  }

  const candidate = data.candidates?.[0];
  const parts     = candidate?.content?.parts ?? [];
  const text      = parts.map(p => p.text ?? '').join('').trim();

  if (!text) {
    const reason = candidate?.finishReason;
    throw new Error(`No content returned. Finish reason: ${reason || 'unknown'}`);
  }

  return text;
}

// ── UI HELPERS ───────────────────────────────────────────────────────────────

function setLoading(loading) {
  state.loading = loading;
  els.btnSend.disabled = loading;
  els.btnText.classList.toggle('hidden', loading);
  els.btnIcon.classList.toggle('hidden', loading);
  els.spinner.classList.toggle('hidden', !loading);
}

function addMessage(role, content, provider = null) {
  if (els.chatEmpty) els.chatEmpty.classList.add('hidden');

  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const roleLabel = role === 'user'
    ? 'You'
    : role === 'error'
    ? 'Error'
    : PROVIDERS[provider]?.label ?? 'Assistant';

  const providerTag = (role === 'assistant' && provider)
    ? `<span class="provider-tag ${provider}">${escapeHtml(PROVIDERS[provider].label)}</span>`
    : '';

  wrap.innerHTML = `
    <div class="message-meta">
      <span class="role">${escapeHtml(roleLabel)}</span>
      ${providerTag}
      <span class="message-time">${timestamp()}</span>
    </div>
    <div class="message-body">${escapeHtml(content)}</div>
  `;

  els.chatWindow.appendChild(wrap);
  scrollToBottom();
}

// ① Lightweight notice bar — display only, not stored in state
function addNotice(text) {
  const wrap = document.createElement('div');
  wrap.className = 'message notice';
  wrap.innerHTML = `<div class="message-body">${escapeHtml(text)}</div>`;
  els.chatWindow.appendChild(wrap);
  scrollToBottom();
}

function showTypingIndicator() {
  const id = `typing-${Date.now()}`;
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'message assistant typing-indicator';
  wrap.innerHTML = `
    <div class="message-meta">
      <span class="role">${escapeHtml(PROVIDERS[state.provider]?.label ?? 'Assistant')}</span>
      <span class="provider-tag ${state.provider}">${escapeHtml(PROVIDERS[state.provider]?.label ?? '')}</span>
    </div>
    <div class="message-body">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  els.chatWindow.appendChild(wrap);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function showError(msg) {
  els.userInput.style.borderColor = '#ff6b6b';
  setTimeout(() => (els.userInput.style.borderColor = ''), 1200);
  addMessage('error', msg);
}

function clearChat() {
  state.messages = [];
  els.chatWindow.innerHTML = '';
  const empty = document.createElement('div');
  empty.id = 'chat-empty';
  empty.className = 'chat-empty';
  empty.innerHTML = `
    <div class="empty-icon">⬡</div>
    <p>Configure your provider and key,<br/>then send a message to begin.</p>
  `;
  els.chatWindow.appendChild(empty);
  els.chatEmpty = document.getElementById('chat-empty');
}

function formatError(err) {
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return 'Network error: Could not reach the API. Check your connection or CORS settings.';
  }
  return err.message || String(err);
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    els.chatWindow.scrollTop = els.chatWindow.scrollHeight;
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
/* =============================================
   LLM PLAYGROUND — BYOK
   app.js — Vanilla JS, no dependencies
   ============================================= */

'use strict';

// ── CONFIG ──────────────────────────────────────────────────────────────────

// ① Conversation history limits
// Only the last MAX_CONTEXT_MESSAGES are sent to the API.
// When older messages are dropped, a compact local summary is prepended
// so the model retains context — no extra API call needed.
const MAX_CONTEXT_MESSAGES = 20;   // 10 user/assistant pairs
const WARN_AT_MESSAGES     = 16;   // show a soft notice before trimming kicks in

const PROVIDERS = {
  claude: {
    label:    'Claude',
    keyHint:  'console.anthropic.com',
    placeholder: 'sk-ant-••••••••••••••••••',
    models: [
      { id: 'claude-opus-4-6',           label: 'Claude Opus 4.6'   },
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5'  },
    ],
    endpoint: 'https://api.anthropic.com/v1/messages',
  },
  openai: {
    label:    'ChatGPT',
    keyHint:  'platform.openai.com',
    placeholder: 'sk-••••••••••••••••••••••',
    models: [
      { id: 'gpt-4o',        label: 'GPT-4o'        },
      { id: 'gpt-4o-mini',   label: 'GPT-4o mini'   },
      { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo'   },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
  gemini: {
    label:    'Gemini',
    keyHint:  'aistudio.google.com',
    placeholder: 'AIza••••••••••••••••••••',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro'   },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
    // Endpoint is built dynamically for Gemini (model + key in URL)
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
};

// ── STATE ────────────────────────────────────────────────────────────────────

let state = {
  theme:        'dark',
  provider:     'claude',
  model:        PROVIDERS.claude.models[0].id,
  apiKey:       '',
  saveKey:      true,    // ② whether to persist key in localStorage
  systemPrompt: 'You are a helpful, concise assistant. Answer clearly and directly.',
  temperature:  0.7,
  messages:     [],      // full display history { role, content }
  loading:      false,
  maxTokens:    1024,
};

// ── DOM REFS ─────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const els = {
  providerBtns:       document.querySelectorAll('.seg-btn'),
  providerInput:      $('provider'),
  modelSelect:        $('model'),
  apiKeyInput:        $('api-key'),
  toggleKey:          $('toggle-key'),
  keyHint:            $('key-hint'),
  saveKeyCheckbox:    $('save-key-checkbox'),   // ②
  btnForgetKey:       $('btn-forget-key'),       // ②
  systemPromptTA:     $('system-prompt'),
  systemPromptPrev:   $('system-prompt-preview'),
  toggleSystemPrompt: $('toggle-system-prompt'),
  temperature:        $('temperature'),
  tempValue:          $('temp-value'),
  chatWindow:         $('chat-window'),
  chatEmpty:          $('chat-empty'),
  userInput:          $('user-input'),
  charCount:          $('char-count'),
  btnSend:            $('btn-send'),
  btnText:            $('btn-text'),
  btnIcon:            $('btn-icon'),
  spinner:            $('spinner'),
  btnClear:           $('btn-clear'),
  themeToggleBtn:     $('theme-toggle-btn'),     // ④
  tokensSlider:       $('tokens-slider'),
  maxTokensValue:     $('tokens-value'),
};

// ── INIT ──────────────────────────────────────────────────────────────────────

(function init() {
  populateModels(state.provider);
  bindEvents();

  const body = document.body;

  // Theme: localStorage wins, then system preference, default = dark
  const savedTheme = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
    body.className = 'light-mode';
    state.theme = 'light';
  }

  // Restore last provider
  const lastProvider = localStorage.getItem('provider');
  if (lastProvider && PROVIDERS[lastProvider]) {
    setProvider(lastProvider);
  }

  // ② Restore save-key preference
  const savedSaveKey = localStorage.getItem('save_key');
  state.saveKey = savedSaveKey !== 'false';   // default: true
  els.saveKeyCheckbox.checked = state.saveKey;

  // ② Restore API key only if saveKey is on
  if (state.saveKey) {
    const lastKey = localStorage.getItem('api_key');
    if (lastKey) {
      state.apiKey = lastKey;
      els.apiKeyInput.value = lastKey;
    }
  }
})();

// ── EVENTS ────────────────────────────────────────────────────────────────────

function bindEvents() {

  // Provider segmented control
  els.providerBtns.forEach(btn => {
    btn.addEventListener('click', () => setProvider(btn.dataset.provider));
  });

  // Model select
  els.modelSelect.addEventListener('change', () => {
    state.model = els.modelSelect.value;
  });

  // API Key input
  els.apiKeyInput.addEventListener('input', () => {
    state.apiKey = els.apiKeyInput.value.trim();
    if (state.saveKey) {
      localStorage.setItem('api_key', state.apiKey);
      localStorage.setItem('provider', state.provider);
    }
  });

  // Toggle API key visibility
  els.toggleKey.addEventListener('click', () => {
    const isPassword = els.apiKeyInput.type === 'password';
    els.apiKeyInput.type = isPassword ? 'text' : 'password';
    els.toggleKey.title = isPassword ? 'Hide key' : 'Show key';
    els.toggleKey.querySelector('svg').style.opacity = isPassword ? '0.4' : '1';
  });

  // ② Save-key checkbox
  els.saveKeyCheckbox.addEventListener('change', () => {
    state.saveKey = els.saveKeyCheckbox.checked;
    localStorage.setItem('save_key', String(state.saveKey));
    if (!state.saveKey) {
      // User unchecked — wipe the stored key immediately
      localStorage.removeItem('api_key');
    } else if (state.apiKey) {
      // User re-checked and a key is already in the field — save it now
      localStorage.setItem('api_key', state.apiKey);
      localStorage.setItem('provider', state.provider);
    }
  });

  // ② Forget-key button
  els.btnForgetKey.addEventListener('click', () => {
    localStorage.removeItem('api_key');
    localStorage.removeItem('provider');
    state.apiKey = '';
    els.apiKeyInput.value = '';
    // Also uncheck "remember" so it doesn't get re-saved on next input
    state.saveKey = false;
    els.saveKeyCheckbox.checked = false;
    localStorage.setItem('save_key', 'false');
    // Visual feedback
    els.apiKeyInput.style.borderColor = 'var(--accent)';
    setTimeout(() => (els.apiKeyInput.style.borderColor = ''), 1400);
  });

  // System prompt toggle
  els.toggleSystemPrompt.addEventListener('click', toggleSystemPromptEdit);
  els.systemPromptPrev.addEventListener('click', toggleSystemPromptEdit);

  els.systemPromptTA.addEventListener('input', () => {
    state.systemPrompt = els.systemPromptTA.value;
    els.systemPromptPrev.textContent = state.systemPrompt || '(empty)';
  });

  // Temperature slider
  els.temperature.addEventListener('input', () => {
    state.temperature = parseFloat(els.temperature.value);
    els.tempValue.textContent = state.temperature.toFixed(1);
  });

  // Tokens slider
  els.tokensSlider.addEventListener('input', () => {
    state.maxTokens = parseInt(els.tokensSlider.value);
    els.maxTokensValue.textContent = state.maxTokens;
  });

  // ④ Theme toggle button in header
  els.themeToggleBtn.addEventListener('click', () => {
    const body = document.body;
    if (state.theme === 'dark') {
      state.theme = 'light';
      body.className = 'light-mode';
    } else {
      state.theme = 'dark';
      body.className = '';
    }
    localStorage.setItem('theme', state.theme);
  });

  // User input char counter
  els.userInput.addEventListener('input', () => {
    const len = els.userInput.value.length;
    els.charCount.textContent = len;
    els.charCount.style.color = len > 1800 ? '#ff9b9b' : '';
  });

  // Enter to send (Shift+Enter = newline)
  els.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Send button
  els.btnSend.addEventListener('click', handleSend);

  // Clear chat
  els.btnClear.addEventListener('click', clearChat);
}

// ── PROVIDER ─────────────────────────────────────────────────────────────────

function setProvider(p) {
  if (!PROVIDERS[p]) return;
  state.provider = p;
  state.model    = PROVIDERS[p].models[0].id;

  els.providerBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === p);
  });

  els.keyHint.textContent     = PROVIDERS[p].keyHint;
  els.apiKeyInput.placeholder = PROVIDERS[p].placeholder;
  if (els.apiKeyInput.value === '') state.apiKey = '';

  populateModels(p);
}

function populateModels(p) {
  const models = PROVIDERS[p].models;
  els.modelSelect.innerHTML = models
    .map(m => `<option value="${m.id}">${m.label}</option>`)
    .join('');
  state.model = models[0].id;
}

// ── SYSTEM PROMPT TOGGLE ──────────────────────────────────────────────────────

function toggleSystemPromptEdit() {
  const isEditing = !els.systemPromptTA.classList.contains('hidden');
  if (isEditing) {
    els.systemPromptTA.classList.add('hidden');
    els.systemPromptPrev.classList.remove('hidden');
    els.toggleSystemPrompt.textContent = 'edit';
    els.systemPromptPrev.textContent   = state.systemPrompt || '(empty)';
  } else {
    els.systemPromptTA.classList.remove('hidden');
    els.systemPromptPrev.classList.add('hidden');
    els.toggleSystemPrompt.textContent = 'done';
    els.systemPromptTA.value           = state.systemPrompt;
    els.systemPromptTA.focus();
  }
}

// ── SEND ─────────────────────────────────────────────────────────────────────

async function handleSend() {
  const text = els.userInput.value.trim();

  if (!text)         return showError('Please enter a message.');
  if (!state.apiKey) return showError('Please enter your API key.');
  if (state.loading) return;

  addMessage('user', text);
  state.messages.push({ role: 'user', content: text });
  els.userInput.value = '';
  els.charCount.textContent = '0';

  // ① Warn the user once, just before the window starts trimming
  if (state.messages.length === WARN_AT_MESSAGES) {
    addNotice(`ℹ️ Conversation is getting long. Oldest messages will be summarised for context to stay within token limits.`);
  }

  setLoading(true);
  const typingId = showTypingIndicator();

  try {
    let responseText;
    switch (state.provider) {
      case 'claude':  responseText = await callClaude();  break;
      case 'openai':  responseText = await callOpenAI();  break;
      case 'gemini':  responseText = await callGemini();  break;
      default: throw new Error(`Unknown provider: ${state.provider}`);
    }

    removeTypingIndicator(typingId);
    addMessage('assistant', responseText, state.provider);
    state.messages.push({ role: 'assistant', content: responseText });

    // ① Notify whenever a trim just happened (first time and every time after)
    if (state.messages.length > MAX_CONTEXT_MESSAGES) {
      const dropped = state.messages.length - MAX_CONTEXT_MESSAGES;
      addNotice(`↩ ${dropped} older message${dropped > 1 ? 's' : ''} condensed into context summary sent to the model.`);
    }

  } catch (err) {
    removeTypingIndicator(typingId);
    addMessage('error', formatError(err));
    state.messages.pop();   // revert the user message from state
  }

  setLoading(false);
}

// ── HISTORY WINDOWING ────────────────────────────────────────────────────────
//
// ① state.messages keeps the FULL chat history (for display).
//    getWindowedMessages() returns only what's sent to the API.
//
//    When the history exceeds MAX_CONTEXT_MESSAGES, the oldest messages are
//    dropped and replaced with a compact plain-text summary injected as the
//    opening user/assistant pair — no extra API call required.

function getWindowedMessages() {
  const msgs = state.messages;
  if (msgs.length <= MAX_CONTEXT_MESSAGES) return msgs;

  const dropped = msgs.slice(0, msgs.length - MAX_CONTEXT_MESSAGES);
  const kept    = msgs.slice(msgs.length - MAX_CONTEXT_MESSAGES);

  // Build a compact summary of the dropped messages (≤120 chars per turn)
  const summaryLines = dropped.map(m => {
    const who     = m.role === 'user' ? 'User' : 'Assistant';
    const preview = m.content.length > 120
      ? m.content.slice(0, 120) + '…'
      : m.content;
    return `${who}: ${preview}`;
  }).join('\n');

  const contextMsg = {
    role: 'user',
    content: `[Summary of ${dropped.length} earlier message${dropped.length > 1 ? 's' : ''}:\n${summaryLines}]`,
  };
  const ackMsg = {
    role: 'assistant',
    content: '[Understood. Continuing from the above context.]',
  };

  return [contextMsg, ackMsg, ...kept];
}

// ── API CALLS ─────────────────────────────────────────────────────────────────

async function callClaude() {
  const body = {
    model:       state.model,
    max_tokens:  state.maxTokens,
    temperature: state.temperature,
    system:      state.systemPrompt,
    messages:    getWindowedMessages().map(m => ({ role: m.role, content: m.content })),
  };

  const res = await fetch(PROVIDERS.claude.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':                              'application/json',
      'x-api-key':                                 state.apiKey,
      'anthropic-version':                         '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude API error ${res.status}`);
  }

  return data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
}

async function callOpenAI() {
  const messages = [
    { role: 'system', content: state.systemPrompt },
    ...getWindowedMessages().map(m => ({ role: m.role, content: m.content })),
  ];

  const body = {
    model:       state.model,
    messages,
    max_tokens:  state.maxTokens,
    temperature: Math.min(state.temperature, 2),
  };

  const res = await fetch(PROVIDERS.openai.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `OpenAI API error ${res.status}`);
  }

  return data.choices?.[0]?.message?.content?.trim() ?? '(empty response)';
}

async function callGemini() {
  const contents = getWindowedMessages().map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Gemini 1.x caps at 1.0; Gemini 2.x supports up to 2.0
  const tempToSet = state.model.startsWith('gemini-1')
    ? Math.min(state.temperature, 1)
    : Math.min(state.temperature, 2);

  const body = {
    contents,
    systemInstruction: state.systemPrompt
      ? { parts: [{ text: state.systemPrompt }] }
      : undefined,
    generationConfig: {
      temperature:     tempToSet,
      maxOutputTokens: state.maxTokens,
    },
  };

  const url = `${PROVIDERS.gemini.endpoint}/${state.model}:generateContent?key=${state.apiKey}`;

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini API error ${res.status}`);
  }

  const candidate = data.candidates?.[0];
  const parts     = candidate?.content?.parts ?? [];
  const text      = parts.map(p => p.text ?? '').join('').trim();

  if (!text) {
    const reason = candidate?.finishReason;
    throw new Error(`No content returned. Finish reason: ${reason || 'unknown'}`);
  }

  return text;
}

// ── UI HELPERS ───────────────────────────────────────────────────────────────

function setLoading(loading) {
  state.loading = loading;
  els.btnSend.disabled = loading;
  els.btnText.classList.toggle('hidden', loading);
  els.btnIcon.classList.toggle('hidden', loading);
  els.spinner.classList.toggle('hidden', !loading);
}

function addMessage(role, content, provider = null) {
  if (els.chatEmpty) els.chatEmpty.classList.add('hidden');

  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const roleLabel = role === 'user'
    ? 'You'
    : role === 'error'
    ? 'Error'
    : PROVIDERS[provider]?.label ?? 'Assistant';

  const providerTag = (role === 'assistant' && provider)
    ? `<span class="provider-tag ${provider}">${escapeHtml(PROVIDERS[provider].label)}</span>`
    : '';

  wrap.innerHTML = `
    <div class="message-meta">
      <span class="role">${escapeHtml(roleLabel)}</span>
      ${providerTag}
      <span class="message-time">${timestamp()}</span>
    </div>
    <div class="message-body">${escapeHtml(content)}</div>
  `;

  els.chatWindow.appendChild(wrap);
  scrollToBottom();
}

// ① Lightweight notice bar — display only, not stored in state
function addNotice(text) {
  const wrap = document.createElement('div');
  wrap.className = 'message notice';
  wrap.innerHTML = `<div class="message-body">${escapeHtml(text)}</div>`;
  els.chatWindow.appendChild(wrap);
  scrollToBottom();
}

function showTypingIndicator() {
  const id = `typing-${Date.now()}`;
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'message assistant typing-indicator';
  wrap.innerHTML = `
    <div class="message-meta">
      <span class="role">${escapeHtml(PROVIDERS[state.provider]?.label ?? 'Assistant')}</span>
      <span class="provider-tag ${state.provider}">${escapeHtml(PROVIDERS[state.provider]?.label ?? '')}</span>
    </div>
    <div class="message-body">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  els.chatWindow.appendChild(wrap);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function showError(msg) {
  els.userInput.style.borderColor = '#ff6b6b';
  setTimeout(() => (els.userInput.style.borderColor = ''), 1200);
  addMessage('error', msg);
}

function clearChat() {
  state.messages = [];
  els.chatWindow.innerHTML = '';
  const empty = document.createElement('div');
  empty.id = 'chat-empty';
  empty.className = 'chat-empty';
  empty.innerHTML = `
    <div class="empty-icon">⬡</div>
    <p>Configure your provider and key,<br/>then send a message to begin.</p>
  `;
  els.chatWindow.appendChild(empty);
  els.chatEmpty = document.getElementById('chat-empty');
}

function formatError(err) {
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return 'Network error: Could not reach the API. Check your connection or CORS settings.';
  }
  return err.message || String(err);
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    els.chatWindow.scrollTop = els.chatWindow.scrollHeight;
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
/* =============================================
   LLM PLAYGROUND — BYOK
   app.js — Vanilla JS, no dependencies
   ============================================= */

'use strict';

// ── CONFIG ──────────────────────────────────────────────────────────────────

// ① Conversation history limits
// Only the last MAX_CONTEXT_MESSAGES are sent to the API.
// When older messages are dropped, a compact local summary is prepended
// so the model retains context — no extra API call needed.
const MAX_CONTEXT_MESSAGES = 20;   // 10 user/assistant pairs
const WARN_AT_MESSAGES     = 16;   // show a soft notice before trimming kicks in

const PROVIDERS = {
  claude: {
    label:    'Claude',
    keyHint:  'console.anthropic.com',
    placeholder: 'sk-ant-••••••••••••••••••',
    models: [
      { id: 'claude-opus-4-6',           label: 'Claude Opus 4.6'   },
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5'  },
    ],
    endpoint: 'https://api.anthropic.com/v1/messages',
  },
  openai: {
    label:    'ChatGPT',
    keyHint:  'platform.openai.com',
    placeholder: 'sk-••••••••••••••••••••••',
    models: [
      { id: 'gpt-4o',        label: 'GPT-4o'        },
      { id: 'gpt-4o-mini',   label: 'GPT-4o mini'   },
      { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo'   },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
  gemini: {
    label:    'Gemini',
    keyHint:  'aistudio.google.com',
    placeholder: 'AIza••••••••••••••••••••',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro'   },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
    // Endpoint is built dynamically for Gemini (model + key in URL)
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
};

// ── STATE ────────────────────────────────────────────────────────────────────

let state = {
  theme:        'dark',
  provider:     'claude',
  model:        PROVIDERS.claude.models[0].id,
  apiKey:       '',
  saveKey:      true,    // ② whether to persist key in localStorage
  systemPrompt: 'You are a helpful, concise assistant. Answer clearly and directly.',
  temperature:  0.7,
  messages:     [],      // full display history { role, content }
  loading:      false,
  maxTokens:    1024,
};

// ── DOM REFS ─────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const els = {
  providerBtns:       document.querySelectorAll('.seg-btn'),
  providerInput:      $('provider'),
  modelSelect:        $('model'),
  apiKeyInput:        $('api-key'),
  toggleKey:          $('toggle-key'),
  keyHint:            $('key-hint'),
  saveKeyCheckbox:    $('save-key-checkbox'),   // ②
  btnForgetKey:       $('btn-forget-key'),       // ②
  systemPromptTA:     $('system-prompt'),
  systemPromptPrev:   $('system-prompt-preview'),
  toggleSystemPrompt: $('toggle-system-prompt'),
  temperature:        $('temperature'),
  tempValue:          $('temp-value'),
  chatWindow:         $('chat-window'),
  chatEmpty:          $('chat-empty'),
  userInput:          $('user-input'),
  charCount:          $('char-count'),
  btnSend:            $('btn-send'),
  btnText:            $('btn-text'),
  btnIcon:            $('btn-icon'),
  spinner:            $('spinner'),
  btnClear:           $('btn-clear'),
  themeToggleBtn:     $('theme-toggle-btn'),     // ④
  tokensSlider:       $('tokens-slider'),
  maxTokensValue:     $('tokens-value'),
};

// ── INIT ──────────────────────────────────────────────────────────────────────

(function init() {
  populateModels(state.provider);
  bindEvents();

  const body = document.body;

  // Theme: localStorage wins, then system preference, default = dark
  const savedTheme = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
    body.className = 'light-mode';
    state.theme = 'light';
  }

  // Restore last provider
  const lastProvider = localStorage.getItem('provider');
  if (lastProvider && PROVIDERS[lastProvider]) {
    setProvider(lastProvider);
  }

  // ② Restore save-key preference
  const savedSaveKey = localStorage.getItem('save_key');
  state.saveKey = savedSaveKey !== 'false';   // default: true
  els.saveKeyCheckbox.checked = state.saveKey;

  // ② Restore API key only if saveKey is on
  if (state.saveKey) {
    const lastKey = localStorage.getItem('api_key');
    if (lastKey) {
      state.apiKey = lastKey;
      els.apiKeyInput.value = lastKey;
    }
  }
})();

// ── EVENTS ────────────────────────────────────────────────────────────────────

function bindEvents() {

  // Provider segmented control
  els.providerBtns.forEach(btn => {
    btn.addEventListener('click', () => setProvider(btn.dataset.provider));
  });

  // Model select
  els.modelSelect.addEventListener('change', () => {
    state.model = els.modelSelect.value;
  });

  // API Key input
  els.apiKeyInput.addEventListener('input', () => {
    state.apiKey = els.apiKeyInput.value.trim();
    if (state.saveKey) {
      localStorage.setItem('api_key', state.apiKey);
      localStorage.setItem('provider', state.provider);
    }
  });

  // Toggle API key visibility
  els.toggleKey.addEventListener('click', () => {
    const isPassword = els.apiKeyInput.type === 'password';
    els.apiKeyInput.type = isPassword ? 'text' : 'password';
    els.toggleKey.title = isPassword ? 'Hide key' : 'Show key';
    els.toggleKey.querySelector('svg').style.opacity = isPassword ? '0.4' : '1';
  });

  // ② Save-key checkbox
  els.saveKeyCheckbox.addEventListener('change', () => {
    state.saveKey = els.saveKeyCheckbox.checked;
    localStorage.setItem('save_key', String(state.saveKey));
    if (!state.saveKey) {
      // User unchecked — wipe the stored key immediately
      localStorage.removeItem('api_key');
    } else if (state.apiKey) {
      // User re-checked and a key is already in the field — save it now
      localStorage.setItem('api_key', state.apiKey);
      localStorage.setItem('provider', state.provider);
    }
  });

  // ② Forget-key button
  els.btnForgetKey.addEventListener('click', () => {
    localStorage.removeItem('api_key');
    localStorage.removeItem('provider');
    state.apiKey = '';
    els.apiKeyInput.value = '';
    // Also uncheck "remember" so it doesn't get re-saved on next input
    state.saveKey = false;
    els.saveKeyCheckbox.checked = false;
    localStorage.setItem('save_key', 'false');
    // Visual feedback
    els.apiKeyInput.style.borderColor = 'var(--accent)';
    setTimeout(() => (els.apiKeyInput.style.borderColor = ''), 1400);
  });

  // System prompt toggle
  els.toggleSystemPrompt.addEventListener('click', toggleSystemPromptEdit);
  els.systemPromptPrev.addEventListener('click', toggleSystemPromptEdit);

  els.systemPromptTA.addEventListener('input', () => {
    state.systemPrompt = els.systemPromptTA.value;
    els.systemPromptPrev.textContent = state.systemPrompt || '(empty)';
  });

  // Temperature slider
  els.temperature.addEventListener('input', () => {
    state.temperature = parseFloat(els.temperature.value);
    els.tempValue.textContent = state.temperature.toFixed(1);
  });

  // Tokens slider
  els.tokensSlider.addEventListener('input', () => {
    state.maxTokens = parseInt(els.tokensSlider.value);
    els.maxTokensValue.textContent = state.maxTokens;
  });

  // ④ Theme toggle button in header
  els.themeToggleBtn.addEventListener('click', () => {
    const body = document.body;
    if (state.theme === 'dark') {
      state.theme = 'light';
      body.className = 'light-mode';
    } else {
      state.theme = 'dark';
      body.className = '';
    }
    localStorage.setItem('theme', state.theme);
  });

  // User input char counter
  els.userInput.addEventListener('input', () => {
    const len = els.userInput.value.length;
    els.charCount.textContent = len;
    els.charCount.style.color = len > 1800 ? '#ff9b9b' : '';
  });

  // Enter to send (Shift+Enter = newline)
  els.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Send button
  els.btnSend.addEventListener('click', handleSend);

  // Clear chat
  els.btnClear.addEventListener('click', clearChat);
}

// ── PROVIDER ─────────────────────────────────────────────────────────────────

function setProvider(p) {
  if (!PROVIDERS[p]) return;
  state.provider = p;
  state.model    = PROVIDERS[p].models[0].id;

  els.providerBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === p);
  });

  els.keyHint.textContent     = PROVIDERS[p].keyHint;
  els.apiKeyInput.placeholder = PROVIDERS[p].placeholder;
  if (els.apiKeyInput.value === '') state.apiKey = '';

  populateModels(p);
}

function populateModels(p) {
  const models = PROVIDERS[p].models;
  els.modelSelect.innerHTML = models
    .map(m => `<option value="${m.id}">${m.label}</option>`)
    .join('');
  state.model = models[0].id;
}

// ── SYSTEM PROMPT TOGGLE ──────────────────────────────────────────────────────

function toggleSystemPromptEdit() {
  const isEditing = !els.systemPromptTA.classList.contains('hidden');
  if (isEditing) {
    els.systemPromptTA.classList.add('hidden');
    els.systemPromptPrev.classList.remove('hidden');
    els.toggleSystemPrompt.textContent = 'edit';
    els.systemPromptPrev.textContent   = state.systemPrompt || '(empty)';
  } else {
    els.systemPromptTA.classList.remove('hidden');
    els.systemPromptPrev.classList.add('hidden');
    els.toggleSystemPrompt.textContent = 'done';
    els.systemPromptTA.value           = state.systemPrompt;
    els.systemPromptTA.focus();
  }
}

// ── SEND ─────────────────────────────────────────────────────────────────────

async function handleSend() {
  const text = els.userInput.value.trim();

  if (!text)         return showError('Please enter a message.');
  if (!state.apiKey) return showError('Please enter your API key.');
  if (state.loading) return;

  addMessage('user', text);
  state.messages.push({ role: 'user', content: text });
  els.userInput.value = '';
  els.charCount.textContent = '0';

  // ① Warn the user once, just before the window starts trimming
  if (state.messages.length === WARN_AT_MESSAGES) {
    addNotice(`ℹ️ Conversation is getting long. Oldest messages will be summarised for context to stay within token limits.`);
  }

  setLoading(true);
  const typingId = showTypingIndicator();

  try {
    let responseText;
    switch (state.provider) {
      case 'claude':  responseText = await callClaude();  break;
      case 'openai':  responseText = await callOpenAI();  break;
      case 'gemini':  responseText = await callGemini();  break;
      default: throw new Error(`Unknown provider: ${state.provider}`);
    }

    removeTypingIndicator(typingId);
    addMessage('assistant', responseText, state.provider);
    state.messages.push({ role: 'assistant', content: responseText });

    // ① Notify whenever a trim just happened (first time and every time after)
    if (state.messages.length > MAX_CONTEXT_MESSAGES) {
      const dropped = state.messages.length - MAX_CONTEXT_MESSAGES;
      addNotice(`↩ ${dropped} older message${dropped > 1 ? 's' : ''} condensed into context summary sent to the model.`);
    }

  } catch (err) {
    removeTypingIndicator(typingId);
    addMessage('error', formatError(err));
    state.messages.pop();   // revert the user message from state
  }

  setLoading(false);
}

// ── HISTORY WINDOWING ────────────────────────────────────────────────────────
//
// ① state.messages keeps the FULL chat history (for display).
//    getWindowedMessages() returns only what's sent to the API.
//
//    When the history exceeds MAX_CONTEXT_MESSAGES, the oldest messages are
//    dropped and replaced with a compact plain-text summary injected as the
//    opening user/assistant pair — no extra API call required.

function getWindowedMessages() {
  const msgs = state.messages;
  if (msgs.length <= MAX_CONTEXT_MESSAGES) return msgs;

  const dropped = msgs.slice(0, msgs.length - MAX_CONTEXT_MESSAGES);
  const kept    = msgs.slice(msgs.length - MAX_CONTEXT_MESSAGES);

  // Build a compact summary of the dropped messages (≤120 chars per turn)
  const summaryLines = dropped.map(m => {
    const who     = m.role === 'user' ? 'User' : 'Assistant';
    const preview = m.content.length > 120
      ? m.content.slice(0, 120) + '…'
      : m.content;
    return `${who}: ${preview}`;
  }).join('\n');

  const contextMsg = {
    role: 'user',
    content: `[Summary of ${dropped.length} earlier message${dropped.length > 1 ? 's' : ''}:\n${summaryLines}]`,
  };
  const ackMsg = {
    role: 'assistant',
    content: '[Understood. Continuing from the above context.]',
  };

  return [contextMsg, ackMsg, ...kept];
}

// ── API CALLS ─────────────────────────────────────────────────────────────────

async function callClaude() {
  const body = {
    model:       state.model,
    max_tokens:  state.maxTokens,
    temperature: state.temperature,
    system:      state.systemPrompt,
    messages:    getWindowedMessages().map(m => ({ role: m.role, content: m.content })),
  };

  const res = await fetch(PROVIDERS.claude.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':                              'application/json',
      'x-api-key':                                 state.apiKey,
      'anthropic-version':                         '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude API error ${res.status}`);
  }

  return data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
}

async function callOpenAI() {
  const messages = [
    { role: 'system', content: state.systemPrompt },
    ...getWindowedMessages().map(m => ({ role: m.role, content: m.content })),
  ];

  const body = {
    model:       state.model,
    messages,
    max_tokens:  state.maxTokens,
    temperature: Math.min(state.temperature, 2),
  };

  const res = await fetch(PROVIDERS.openai.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `OpenAI API error ${res.status}`);
  }

  return data.choices?.[0]?.message?.content?.trim() ?? '(empty response)';
}

async function callGemini() {
  const contents = getWindowedMessages().map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Gemini 1.x caps at 1.0; Gemini 2.x supports up to 2.0
  const tempToSet = state.model.startsWith('gemini-1')
    ? Math.min(state.temperature, 1)
    : Math.min(state.temperature, 2);

  const body = {
    contents,
    systemInstruction: state.systemPrompt
      ? { parts: [{ text: state.systemPrompt }] }
      : undefined,
    generationConfig: {
      temperature:     tempToSet,
      maxOutputTokens: state.maxTokens,
    },
  };

  const url = `${PROVIDERS.gemini.endpoint}/${state.model}:generateContent?key=${state.apiKey}`;

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini API error ${res.status}`);
  }

  const candidate = data.candidates?.[0];
  const parts     = candidate?.content?.parts ?? [];
  const text      = parts.map(p => p.text ?? '').join('').trim();

  if (!text) {
    const reason = candidate?.finishReason;
    throw new Error(`No content returned. Finish reason: ${reason || 'unknown'}`);
  }

  return text;
}

// ── UI HELPERS ───────────────────────────────────────────────────────────────

function setLoading(loading) {
  state.loading = loading;
  els.btnSend.disabled = loading;
  els.btnText.classList.toggle('hidden', loading);
  els.btnIcon.classList.toggle('hidden', loading);
  els.spinner.classList.toggle('hidden', !loading);
}

function addMessage(role, content, provider = null) {
  if (els.chatEmpty) els.chatEmpty.classList.add('hidden');

  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const roleLabel = role === 'user'
    ? 'You'
    : role === 'error'
    ? 'Error'
    : PROVIDERS[provider]?.label ?? 'Assistant';

  const providerTag = (role === 'assistant' && provider)
    ? `<span class="provider-tag ${provider}">${escapeHtml(PROVIDERS[provider].label)}</span>`
    : '';

  wrap.innerHTML = `
    <div class="message-meta">
      <span class="role">${escapeHtml(roleLabel)}</span>
      ${providerTag}
      <span class="message-time">${timestamp()}</span>
    </div>
    <div class="message-body">${escapeHtml(content)}</div>
  `;

  els.chatWindow.appendChild(wrap);
  scrollToBottom();
}

// ① Lightweight notice bar — display only, not stored in state
function addNotice(text) {
  const wrap = document.createElement('div');
  wrap.className = 'message notice';
  wrap.innerHTML = `<div class="message-body">${escapeHtml(text)}</div>`;
  els.chatWindow.appendChild(wrap);
  scrollToBottom();
}

function showTypingIndicator() {
  const id = `typing-${Date.now()}`;
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'message assistant typing-indicator';
  wrap.innerHTML = `
    <div class="message-meta">
      <span class="role">${escapeHtml(PROVIDERS[state.provider]?.label ?? 'Assistant')}</span>
      <span class="provider-tag ${state.provider}">${escapeHtml(PROVIDERS[state.provider]?.label ?? '')}</span>
    </div>
    <div class="message-body">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  els.chatWindow.appendChild(wrap);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function showError(msg) {
  els.userInput.style.borderColor = '#ff6b6b';
  setTimeout(() => (els.userInput.style.borderColor = ''), 1200);
  addMessage('error', msg);
}

function clearChat() {
  state.messages = [];
  els.chatWindow.innerHTML = '';
  const empty = document.createElement('div');
  empty.id = 'chat-empty';
  empty.className = 'chat-empty';
  empty.innerHTML = `
    <div class="empty-icon">⬡</div>
    <p>Configure your provider and key,<br/>then send a message to begin.</p>
  `;
  els.chatWindow.appendChild(empty);
  els.chatEmpty = document.getElementById('chat-empty');
}

function formatError(err) {
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return 'Network error: Could not reach the API. Check your connection or CORS settings.';
  }
  return err.message || String(err);
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    els.chatWindow.scrollTop = els.chatWindow.scrollHeight;
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
/* =============================================
   LLM PLAYGROUND — BYOK
   app.js — Vanilla JS, no dependencies
   ============================================= */

'use strict';

// ── CONFIG ──────────────────────────────────────────────────────────────────

// ① Conversation history limits
// Only the last MAX_CONTEXT_MESSAGES are sent to the API.
// When older messages are dropped, a compact local summary is prepended
// so the model retains context — no extra API call needed.
const MAX_CONTEXT_MESSAGES = 20;   // 10 user/assistant pairs
const WARN_AT_MESSAGES     = 16;   // show a soft notice before trimming kicks in

const PROVIDERS = {
  claude: {
    label:    'Claude',
    keyHint:  'console.anthropic.com',
    placeholder: 'sk-ant-••••••••••••••••••',
    models: [
      { id: 'claude-opus-4-6',           label: 'Claude Opus 4.6'   },
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5'  },
    ],
    endpoint: 'https://api.anthropic.com/v1/messages',
  },
  openai: {
    label:    'ChatGPT',
    keyHint:  'platform.openai.com',
    placeholder: 'sk-••••••••••••••••••••••',
    models: [
      { id: 'gpt-4o',        label: 'GPT-4o'        },
      { id: 'gpt-4o-mini',   label: 'GPT-4o mini'   },
      { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo'   },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
  gemini: {
    label:    'Gemini',
    keyHint:  'aistudio.google.com',
    placeholder: 'AIza••••••••••••••••••••',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro'   },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
    // Endpoint is built dynamically for Gemini (model + key in URL)
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
};

// ── STATE ────────────────────────────────────────────────────────────────────

let state = {
  theme:        'dark',
  provider:     'claude',
  model:        PROVIDERS.claude.models[0].id,
  apiKey:       '',
  saveKey:      true,    // ② whether to persist key in localStorage
  systemPrompt: 'You are a helpful, concise assistant. Answer clearly and directly.',
  temperature:  0.7,
  messages:     [],      // full display history { role, content }
  loading:      false,
  maxTokens:    1024,
};

// ── DOM REFS ─────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const els = {
  providerBtns:       document.querySelectorAll('.seg-btn'),
  providerInput:      $('provider'),
  modelSelect:        $('model'),
  apiKeyInput:        $('api-key'),
  toggleKey:          $('toggle-key'),
  keyHint:            $('key-hint'),
  saveKeyCheckbox:    $('save-key-checkbox'),   // ②
  btnForgetKey:       $('btn-forget-key'),       // ②
  systemPromptTA:     $('system-prompt'),
  systemPromptPrev:   $('system-prompt-preview'),
  toggleSystemPrompt: $('toggle-system-prompt'),
  temperature:        $('temperature'),
  tempValue:          $('temp-value'),
  chatWindow:         $('chat-window'),
  chatEmpty:          $('chat-empty'),
  userInput:          $('user-input'),
  charCount:          $('char-count'),
  btnSend:            $('btn-send'),
  btnText:            $('btn-text'),
  btnIcon:            $('btn-icon'),
  spinner:            $('spinner'),
  btnClear:           $('btn-clear'),
  themeToggleBtn:     $('theme-toggle-btn'),     // ④
  tokensSlider:       $('tokens-slider'),
  maxTokensValue:     $('tokens-value'),
};

// ── INIT ──────────────────────────────────────────────────────────────────────

(function init() {
  populateModels(state.provider);
  bindEvents();

  const body = document.body;

  // Theme: localStorage wins, then system preference, default = dark
  const savedTheme = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
    body.className = 'light-mode';
    state.theme = 'light';
  }

  // Restore last provider
  const lastProvider = localStorage.getItem('provider');
  if (lastProvider && PROVIDERS[lastProvider]) {
    setProvider(lastProvider);
  }

  // ② Restore save-key preference
  const savedSaveKey = localStorage.getItem('save_key');
  state.saveKey = savedSaveKey !== 'false';   // default: true
  els.saveKeyCheckbox.checked = state.saveKey;

  // ② Restore API key only if saveKey is on
  if (state.saveKey) {
    const lastKey = localStorage.getItem('api_key');
    if (lastKey) {
      state.apiKey = lastKey;
      els.apiKeyInput.value = lastKey;
    }
  }
})();

// ── EVENTS ────────────────────────────────────────────────────────────────────

function bindEvents() {

  // Provider segmented control
  els.providerBtns.forEach(btn => {
    btn.addEventListener('click', () => setProvider(btn.dataset.provider));
  });

  // Model select
  els.modelSelect.addEventListener('change', () => {
    state.model = els.modelSelect.value;
  });

  // API Key input
  els.apiKeyInput.addEventListener('input', () => {
    state.apiKey = els.apiKeyInput.value.trim();
    if (state.saveKey) {
      localStorage.setItem('api_key', state.apiKey);
      localStorage.setItem('provider', state.provider);
    }
  });

  // Toggle API key visibility
  els.toggleKey.addEventListener('click', () => {
    const isPassword = els.apiKeyInput.type === 'password';
    els.apiKeyInput.type = isPassword ? 'text' : 'password';
    els.toggleKey.title = isPassword ? 'Hide key' : 'Show key';
    els.toggleKey.querySelector('svg').style.opacity = isPassword ? '0.4' : '1';
  });

  // ② Save-key checkbox
  els.saveKeyCheckbox.addEventListener('change', () => {
    state.saveKey = els.saveKeyCheckbox.checked;
    localStorage.setItem('save_key', String(state.saveKey));
    if (!state.saveKey) {
      // User unchecked — wipe the stored key immediately
      localStorage.removeItem('api_key');
    } else if (state.apiKey) {
      // User re-checked and a key is already in the field — save it now
      localStorage.setItem('api_key', state.apiKey);
      localStorage.setItem('provider', state.provider);
    }
  });

  // ② Forget-key button
  els.btnForgetKey.addEventListener('click', () => {
    localStorage.removeItem('api_key');
    localStorage.removeItem('provider');
    state.apiKey = '';
    els.apiKeyInput.value = '';
    // Also uncheck "remember" so it doesn't get re-saved on next input
    state.saveKey = false;
    els.saveKeyCheckbox.checked = false;
    localStorage.setItem('save_key', 'false');
    // Visual feedback
    els.apiKeyInput.style.borderColor = 'var(--accent)';
    setTimeout(() => (els.apiKeyInput.style.borderColor = ''), 1400);
  });

  // System prompt toggle
  els.toggleSystemPrompt.addEventListener('click', toggleSystemPromptEdit);
  els.systemPromptPrev.addEventListener('click', toggleSystemPromptEdit);

  els.systemPromptTA.addEventListener('input', () => {
    state.systemPrompt = els.systemPromptTA.value;
    els.systemPromptPrev.textContent = state.systemPrompt || '(empty)';
  });

  // Temperature slider
  els.temperature.addEventListener('input', () => {
    state.temperature = parseFloat(els.temperature.value);
    els.tempValue.textContent = state.temperature.toFixed(1);
  });

  // Tokens slider
  els.tokensSlider.addEventListener('input', () => {
    state.maxTokens = parseInt(els.tokensSlider.value);
    els.maxTokensValue.textContent = state.maxTokens;
  });

  // ④ Theme toggle button in header
  els.themeToggleBtn.addEventListener('click', () => {
    const body = document.body;
    if (state.theme === 'dark') {
      state.theme = 'light';
      body.className = 'light-mode';
    } else {
      state.theme = 'dark';
      body.className = '';
    }
    localStorage.setItem('theme', state.theme);
  });

  // User input char counter
  els.userInput.addEventListener('input', () => {
    const len = els.userInput.value.length;
    els.charCount.textContent = len;
    els.charCount.style.color = len > 1800 ? '#ff9b9b' : '';
  });

  // Enter to send (Shift+Enter = newline)
  els.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Send button
  els.btnSend.addEventListener('click', handleSend);

  // Clear chat
  els.btnClear.addEventListener('click', clearChat);
}

// ── PROVIDER ─────────────────────────────────────────────────────────────────

function setProvider(p) {
  if (!PROVIDERS[p]) return;
  state.provider = p;
  state.model    = PROVIDERS[p].models[0].id;

  els.providerBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === p);
  });

  els.keyHint.textContent     = PROVIDERS[p].keyHint;
  els.apiKeyInput.placeholder = PROVIDERS[p].placeholder;
  if (els.apiKeyInput.value === '') state.apiKey = '';

  populateModels(p);
}

function populateModels(p) {
  const models = PROVIDERS[p].models;
  els.modelSelect.innerHTML = models
    .map(m => `<option value="${m.id}">${m.label}</option>`)
    .join('');
  state.model = models[0].id;
}

// ── SYSTEM PROMPT TOGGLE ──────────────────────────────────────────────────────

function toggleSystemPromptEdit() {
  const isEditing = !els.systemPromptTA.classList.contains('hidden');
  if (isEditing) {
    els.systemPromptTA.classList.add('hidden');
    els.systemPromptPrev.classList.remove('hidden');
    els.toggleSystemPrompt.textContent = 'edit';
    els.systemPromptPrev.textContent   = state.systemPrompt || '(empty)';
  } else {
    els.systemPromptTA.classList.remove('hidden');
    els.systemPromptPrev.classList.add('hidden');
    els.toggleSystemPrompt.textContent = 'done';
    els.systemPromptTA.value           = state.systemPrompt;
    els.systemPromptTA.focus();
  }
}

// ── SEND ─────────────────────────────────────────────────────────────────────

async function handleSend() {
  const text = els.userInput.value.trim();

  if (!text)         return showError('Please enter a message.');
  if (!state.apiKey) return showError('Please enter your API key.');
  if (state.loading) return;

  addMessage('user', text);
  state.messages.push({ role: 'user', content: text });
  els.userInput.value = '';
  els.charCount.textContent = '0';

  // ① Warn the user once, just before the window starts trimming
  if (state.messages.length === WARN_AT_MESSAGES) {
    addNotice(`ℹ️ Conversation is getting long. Oldest messages will be summarised for context to stay within token limits.`);
  }

  setLoading(true);
  const typingId = showTypingIndicator();

  try {
    let responseText;
    switch (state.provider) {
      case 'claude':  responseText = await callClaude();  break;
      case 'openai':  responseText = await callOpenAI();  break;
      case 'gemini':  responseText = await callGemini();  break;
      default: throw new Error(`Unknown provider: ${state.provider}`);
    }

    removeTypingIndicator(typingId);
    addMessage('assistant', responseText, state.provider);
    state.messages.push({ role: 'assistant', content: responseText });

    // ① Notify whenever a trim just happened (first time and every time after)
    if (state.messages.length > MAX_CONTEXT_MESSAGES) {
      const dropped = state.messages.length - MAX_CONTEXT_MESSAGES;
      addNotice(`↩ ${dropped} older message${dropped > 1 ? 's' : ''} condensed into context summary sent to the model.`);
    }

  } catch (err) {
    removeTypingIndicator(typingId);
    addMessage('error', formatError(err));
    state.messages.pop();   // revert the user message from state
  }

  setLoading(false);
}

// ── HISTORY WINDOWING ────────────────────────────────────────────────────────
//
// ① state.messages keeps the FULL chat history (for display).
//    getWindowedMessages() returns only what's sent to the API.
//
//    When the history exceeds MAX_CONTEXT_MESSAGES, the oldest messages are
//    dropped and replaced with a compact plain-text summary injected as the
//    opening user/assistant pair — no extra API call required.

function getWindowedMessages() {
  const msgs = state.messages;
  if (msgs.length <= MAX_CONTEXT_MESSAGES) return msgs;

  const dropped = msgs.slice(0, msgs.length - MAX_CONTEXT_MESSAGES);
  const kept    = msgs.slice(msgs.length - MAX_CONTEXT_MESSAGES);

  // Build a compact summary of the dropped messages (≤120 chars per turn)
  const summaryLines = dropped.map(m => {
    const who     = m.role === 'user' ? 'User' : 'Assistant';
    const preview = m.content.length > 120
      ? m.content.slice(0, 120) + '…'
      : m.content;
    return `${who}: ${preview}`;
  }).join('\n');

  const contextMsg = {
    role: 'user',
    content: `[Summary of ${dropped.length} earlier message${dropped.length > 1 ? 's' : ''}:\n${summaryLines}]`,
  };
  const ackMsg = {
    role: 'assistant',
    content: '[Understood. Continuing from the above context.]',
  };

  return [contextMsg, ackMsg, ...kept];
}

// ── API CALLS ─────────────────────────────────────────────────────────────────

async function callClaude() {
  const body = {
    model:       state.model,
    max_tokens:  state.maxTokens,
    temperature: state.temperature,
    system:      state.systemPrompt,
    messages:    getWindowedMessages().map(m => ({ role: m.role, content: m.content })),
  };

  const res = await fetch(PROVIDERS.claude.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':                              'application/json',
      'x-api-key':                                 state.apiKey,
      'anthropic-version':                         '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude API error ${res.status}`);
  }

  return data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
}

async function callOpenAI() {
  const messages = [
    { role: 'system', content: state.systemPrompt },
    ...getWindowedMessages().map(m => ({ role: m.role, content: m.content })),
  ];

  const body = {
    model:       state.model,
    messages,
    max_tokens:  state.maxTokens,
    temperature: Math.min(state.temperature, 2),
  };

  const res = await fetch(PROVIDERS.openai.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `OpenAI API error ${res.status}`);
  }

  return data.choices?.[0]?.message?.content?.trim() ?? '(empty response)';
}

async function callGemini() {
  const contents = getWindowedMessages().map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Gemini 1.x caps at 1.0; Gemini 2.x supports up to 2.0
  const tempToSet = state.model.startsWith('gemini-1')
    ? Math.min(state.temperature, 1)
    : Math.min(state.temperature, 2);

  const body = {
    contents,
    systemInstruction: state.systemPrompt
      ? { parts: [{ text: state.systemPrompt }] }
      : undefined,
    generationConfig: {
      temperature:     tempToSet,
      maxOutputTokens: state.maxTokens,
    },
  };

  const url = `${PROVIDERS.gemini.endpoint}/${state.model}:generateContent?key=${state.apiKey}`;

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini API error ${res.status}`);
  }

  const candidate = data.candidates?.[0];
  const parts     = candidate?.content?.parts ?? [];
  const text      = parts.map(p => p.text ?? '').join('').trim();

  if (!text) {
    const reason = candidate?.finishReason;
    throw new Error(`No content returned. Finish reason: ${reason || 'unknown'}`);
  }

  return text;
}

// ── UI HELPERS ───────────────────────────────────────────────────────────────

function setLoading(loading) {
  state.loading = loading;
  els.btnSend.disabled = loading;
  els.btnText.classList.toggle('hidden', loading);
  els.btnIcon.classList.toggle('hidden', loading);
  els.spinner.classList.toggle('hidden', !loading);
}

function addMessage(role, content, provider = null) {
  if (els.chatEmpty) els.chatEmpty.classList.add('hidden');

  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const roleLabel = role === 'user'
    ? 'You'
    : role === 'error'
    ? 'Error'
    : PROVIDERS[provider]?.label ?? 'Assistant';

  const providerTag = (role === 'assistant' && provider)
    ? `<span class="provider-tag ${provider}">${escapeHtml(PROVIDERS[provider].label)}</span>`
    : '';

  wrap.innerHTML = `
    <div class="message-meta">
      <span class="role">${escapeHtml(roleLabel)}</span>
      ${providerTag}
      <span class="message-time">${timestamp()}</span>
    </div>
    <div class="message-body">${escapeHtml(content)}</div>
  `;

  els.chatWindow.appendChild(wrap);
  scrollToBottom();
}

// ① Lightweight notice bar — display only, not stored in state
function addNotice(text) {
  const wrap = document.createElement('div');
  wrap.className = 'message notice';
  wrap.innerHTML = `<div class="message-body">${escapeHtml(text)}</div>`;
  els.chatWindow.appendChild(wrap);
  scrollToBottom();
}

function showTypingIndicator() {
  const id = `typing-${Date.now()}`;
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'message assistant typing-indicator';
  wrap.innerHTML = `
    <div class="message-meta">
      <span class="role">${escapeHtml(PROVIDERS[state.provider]?.label ?? 'Assistant')}</span>
      <span class="provider-tag ${state.provider}">${escapeHtml(PROVIDERS[state.provider]?.label ?? '')}</span>
    </div>
    <div class="message-body">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  els.chatWindow.appendChild(wrap);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function showError(msg) {
  els.userInput.style.borderColor = '#ff6b6b';
  setTimeout(() => (els.userInput.style.borderColor = ''), 1200);
  addMessage('error', msg);
}

function clearChat() {
  state.messages = [];
  els.chatWindow.innerHTML = '';
  const empty = document.createElement('div');
  empty.id = 'chat-empty';
  empty.className = 'chat-empty';
  empty.innerHTML = `
    <div class="empty-icon">⬡</div>
    <p>Configure your provider and key,<br/>then send a message to begin.</p>
  `;
  els.chatWindow.appendChild(empty);
  els.chatEmpty = document.getElementById('chat-empty');
}

function formatError(err) {
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return 'Network error: Could not reach the API. Check your connection or CORS settings.';
  }
  return err.message || String(err);
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    els.chatWindow.scrollTop = els.chatWindow.scrollHeight;
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
