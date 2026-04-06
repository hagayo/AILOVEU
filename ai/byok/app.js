/* =============================================
   LLM PLAYGROUND — BYOK
   app.js — Vanilla JS, no dependencies
   ============================================= */

'use strict';

// const CLOUD_CONFIG = { PROXY_URL: 'https://your-cloud-run-url.a.run.app/v1/chat', };
// ── CONFIG ──────────────────────────────────────────────────────────────────
const PROVIDERS = {
  claude: {
    label:    'Claude',
    keyHint:  'console.anthropic.com',
    placeholder: 'sk-ant-••••••••••••••••••',
    models: [
      { id: 'claude-opus-4-6',          label: 'Claude Opus 4.6'     },
      { id: 'claude-sonnet-4-6',        label: 'Claude Sonnet 4.6'   },
      { id: 'claude-haiku-4-5-20251001',label: 'Claude Haiku 4.5'    },
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
      { id: 'gemini-2.5-flash',        label: 'Gemini 2.5 Flash'        },
      { id: 'gemini-2.0-flash',        label: 'Gemini 2.0 Flash'        },
      { id: 'gemini-1.5-pro',          label: 'Gemini 1.5 Pro'          },
      { id: 'gemini-1.5-flash',        label: 'Gemini 1.5 Flash'        },
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
  systemPrompt: 'You are a helpful, concise assistant. Answer clearly and directly.',
  temperature:  0.7,
  messages:     [],   // { role, content, ts, provider }
  loading:      false,
  maxTokens:   1024,
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
  theme:              $('theme'),
  themeValue:         $('theme-value'),
  tokensSlider:       $('tokens-slider'),
  maxTokensValue:     $('tokens-value'),
};

// ── INIT ──────────────────────────────────────────────────────────────────────

(function init() {
  populateModels(state.provider);
  bindEvents();
  const body = document.body;
  const currentTheme = localStorage.getItem('theme');
  const prefersLightScheme = window.matchMedia("(prefers-color-scheme: light)");
  if (currentTheme === "light" || (!currentTheme && prefersLightScheme.matches)) {
    body.className = 'light-mode';
    state.theme = 'light';
  }
  els.themeValue.textContent = state.theme
  
  let lastProvider = localStorage.getItem('provider');
  if (lastProvider != null) {
    setProvider(lastProvider);
    // state.provider = lastProvider;
  }
  let lastKey = localStorage.getItem('api_key');
  if (lastKey != null) {
    state.apiKey = lastKey;
    els.apiKeyInput.value = lastKey;
  }
})();

// ── EVENTS ────────────────────────────────────────────────────────────────────

function bindEvents() {

  // Provider segmented control
  els.providerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.provider;
      setProvider(p);
    });
  });

  // Model select
  els.modelSelect.addEventListener('change', () => {
    state.model = els.modelSelect.value;
  });

  // API Key input
  els.apiKeyInput.addEventListener('input', () => {
    state.apiKey = els.apiKeyInput.value.trim();
    localStorage.setItem('api_key', state.apiKey);
    localStorage.setItem('provider', state.provider);
  });

  // Toggle API key visibility
  els.toggleKey.addEventListener('click', () => {
    const isPassword = els.apiKeyInput.type === 'password';
    els.apiKeyInput.type = isPassword ? 'text' : 'password';
    els.toggleKey.title = isPassword ? 'Hide key' : 'Show key';
    els.toggleKey.querySelector('svg').style.opacity = isPassword ? '0.4' : '1';
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

  // Theme slider (light/dark mode)
  els.theme.addEventListener('input', () => {
    const body = document.body;
    let themeIntVal = parseInt(els.theme.value);
    if (themeIntVal === 0) {
      state.theme = 'light';
      body.className = 'light-mode';
    } else {
      state.theme = 'dark';
      body.className = '';
    }
    els.themeValue.textContent = state.theme;
    // Save preference to localStorage
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
  state.provider = p;
  state.model    = PROVIDERS[p].models[0].id;

  // Update segmented buttons
  els.providerBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === p);
  });

  // Update key hint + placeholder
  els.keyHint.textContent        = PROVIDERS[p].keyHint;
  els.apiKeyInput.placeholder    = PROVIDERS[p].placeholder;
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
    // Save & collapse
    els.systemPromptTA.classList.add('hidden');
    els.systemPromptPrev.classList.remove('hidden');
    els.toggleSystemPrompt.textContent = 'edit';
    els.systemPromptPrev.textContent   = state.systemPrompt || '(empty)';
  } else {
    // Expand
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

  if (!text)          return showError('Please enter a message.');
  if (!state.apiKey)  return showError('Please enter your API key.');
  if (state.loading)  return;

  // Add user message to UI & state
  addMessage('user', text);
  state.messages.push({ role: 'user', content: text });
  els.userInput.value  = '';
  els.charCount.textContent = '0';

  setLoading(true);
  const typingId = showTypingIndicator();

  try {
    let responseText;

    // responseText = await callLLMProxy();
    switch (state.provider) {
      case 'claude':  responseText = await callClaude();  break;
      case 'openai':  responseText = await callOpenAI();  break;
      case 'gemini':  responseText = await callGemini();  break;
      default: throw new Error(`Unknown provider: ${state.provider}`);
    }

    removeTypingIndicator(typingId);
    addMessage('assistant', responseText, state.provider);
    state.messages.push({ role: 'assistant', content: responseText });

  } catch (err) {
    removeTypingIndicator(typingId);
    addMessage('error', formatError(err));
    // Remove last user message from state so conversation stays consistent
    state.messages.pop();
  }

  setLoading(false);
}

// ── API CALLS ─────────────────────────────────────────────────────────────────

async function callClaude() {
  const body = {
    model:       state.model,
    max_tokens:  state.maxTokens,
    temperature: state.temperature,
    system:      state.systemPrompt,
    messages:    state.messages.map(m => ({ role: m.role, content: m.content })),
  };

  const res = await fetch(PROVIDERS.claude.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':                          'application/json',
      'x-api-key':                             state.apiKey,
      'anthropic-version':                     '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude API error ${res.status}`);
  }

  // Parse Claude response: content array → text blocks
  return data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
}

async function callOpenAI() {
  // Build messages with system prompt
  const messages = [
    { role: 'system', content: state.systemPrompt },
    ...state.messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const body = {
    model:       state.model,
    messages,
    max_tokens:  state.maxTokens,
    temperature: Math.min(state.temperature, 2),  // OpenAI max is 2
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

  // Parse OpenAI response
  return data.choices?.[0]?.message?.content?.trim() ?? '(empty response)';
}

async function callGemini() {
  // Gemini uses a different message structure (parts) and doesn't have a system-role message
  // System prompt is injected as the first user turn when history is empty,
  // or prepended to each request via systemInstruction

  const contents = state.messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  let tempToSet = Math.min(state.temperature, 2);  // Gemini 2.x max is 2
  if ( state.model.startsWith('gemini-1', 0) ) {
    tempToSet = Math.min(state.temperature, 1);  // Gemini 1.x max is 1
  }

  const body = {
    contents,
    systemInstruction: state.systemPrompt
      ? { parts: [{ text: state.systemPrompt }] }
      : undefined,
    generationConfig: {
      temperature: tempToSet,
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
    throw new Error(
      data?.error?.message || `Gemini API error ${res.status}`
    );
  }

  // Parse Gemini response
  const candidate = data.candidates?.[0];
  const parts     = candidate?.content?.parts ?? [];
  const text      = parts.map(p => p.text ?? '').join('').trim();

  if (!text) {
    const reason = candidate?.finishReason;
    throw new Error(`No content returned. Finish reason: ${reason || 'unknown'}`);
  }

  return text;
}

// i replaced the individual API call functions with this call
// async function callLLMProxy() {
  // const backendUrl = 'https://YOUR_CLOUD_RUN_URL/api/generate'; // Update this after deployment
  
  // const payload = {
    // provider:    state.provider,
    // model:       state.model,
    // api_key:     state.apiKey,
    // temperature: state.temperature,
    // max_tokens:  state.maxTokens,
    // messages:    state.messages.map(m => ({ role: m.role, content: m.content }))
  // };

  // const res = await fetch(backendUrl, {
    // method: 'POST',
    // headers: { 'Content-Type': 'application/json' },
    // body: JSON.stringify(payload)
  // });

  // const data = await res.json();

  // if (!res.ok) {
    // throw new Error(data.detail || `Server error ${res.status}`);
  // }

  // return data.text;
// }

// new function by Gemini, needs checkup
// async function callServerProxy(messages) {
    // const PROXY_URL = "https://your-cloud-run-hash.a.run.app/v1/chat";
    
    // const response = await fetch(PROXY_URL, {
        // method: "POST",
        // headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({
            // provider: state.provider,
            // model: state.model,
            // apiKey: state.apiKey,
            // temperature: state.temperature,
            // max_tokens:  state.maxTokens,
            // messages: messages  // User & Assistant history only
        // })
    // });

    // if (!response.ok) throw new Error("Proxy error");
    // const data = await response.json();
    // return data.choices[0].message.content;
    // // return data.content;
// }


// ── UI HELPERS ───────────────────────────────────────────────────────────────

function setLoading(loading) {
  state.loading = loading;
  els.btnSend.disabled        = loading;
  els.btnText.classList.toggle('hidden', loading);
  els.btnIcon.classList.toggle('hidden', loading);
  els.spinner.classList.toggle('hidden', !loading);
}

function addMessage(role, content, provider = null) {
  // Hide empty state
  if (els.chatEmpty) els.chatEmpty.classList.add('hidden');

  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const roleLabel = role === 'user'
    ? 'You'
    : role === 'error'
    ? 'Error'
    : PROVIDERS[provider]?.label ?? 'Assistant';

  const providerTag = (role === 'assistant' && provider)
    ? `<span class="provider-tag ${provider}">${PROVIDERS[provider].label}</span>`
    : '';

  wrap.innerHTML = `
    <div class="message-meta">
      <span class="role">${roleLabel}</span>
      ${providerTag}
      <span class="message-time">${timestamp()}</span>
    </div>
    <div class="message-body">${escapeHtml(content)}</div>
  `;

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
      <span class="role">${PROVIDERS[state.provider]?.label ?? 'Assistant'}</span>
      <span class="provider-tag ${state.provider}">${PROVIDERS[state.provider]?.label}</span>
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
  // Briefly flash the input border
  els.userInput.style.borderColor = '#ff6b6b';
  setTimeout(() => (els.userInput.style.borderColor = ''), 1200);
  // Show a toast-style message in chat
  addMessage('error', msg);
}

function clearChat() {
  state.messages = [];
  els.chatWindow.innerHTML = '';
  // Restore empty state
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
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
