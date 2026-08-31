(() => {
  'use strict';

  const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const THEME_KEY = 'docx-to-markdown-theme';

  const elements = {
    fileInput: document.getElementById('fileInput'),
    openButton: document.getElementById('openButton'),
    resetButton: document.getElementById('resetButton'),
    // dropZone: document.getElementById('dropZone'),
    workspace: document.getElementById('workspace'),
    fileName: document.getElementById('fileName'),
    wordPreview: document.getElementById('wordPreview'),
    markdownEditor: document.getElementById('markdownEditor'),
    copyButton: document.getElementById('copyButton'),
    downloadButton: document.getElementById('downloadButton'),
    themeSelect: document.getElementById('themeSelect'),
    wordCount: document.getElementById('wordCount'),
    charCount: document.getElementById('charCount'),
    modifiedStatus: document.getElementById('modifiedStatus'),
    warningsPanel: document.getElementById('warningsPanel'),
    warningsToggle: document.getElementById('warningsToggle'),
    warningsSummary: document.getElementById('warningsSummary'),
    warningsList: document.getElementById('warningsList'),
    message: document.getElementById('message'),
  };

  const state = {
    sourceFileName: '',
    outputFileName: 'document.md',
    convertedMarkdown: '',
  };

  const allowedUrl = (value, { image = false } = {}) => {
    if (!value) return true;
    const normalized = value.trim().toLowerCase();
    if (normalized.startsWith('#')) return true;
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) return true;
    if (!image && (normalized.startsWith('mailto:') || normalized.startsWith('tel:'))) return true;
    return image && normalized.startsWith('data:image/');
  };

  function sanitizeHtml(unsafeHtml) {
    const parser = new DOMParser();
    const documentFragment = parser.parseFromString(`<div id="root">${unsafeHtml}</div>`, 'text/html');
    const root = documentFragment.getElementById('root');

    root.querySelectorAll('script, style, iframe, object, embed, form, meta, link, base').forEach((node) => node.remove());

    root.querySelectorAll('*').forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (name.startsWith('on') || name === 'srcdoc') {
          node.removeAttribute(attribute.name);
        }
      });

      if (node.hasAttribute('href') && !allowedUrl(node.getAttribute('href'))) {
        node.removeAttribute('href');
      }
      if (node.hasAttribute('src') && !allowedUrl(node.getAttribute('src'), { image: true })) {
        node.removeAttribute('src');
      }

      if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return root.innerHTML;
  }

  function createTurndownService() {
    const service = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
    });

    // Core Turndown does not provide a rich table conversion. Preserving tables
    // as HTML is valid Markdown and avoids silently destroying table structure.
    service.keep(['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td']);

    return service;
  }

  function assertDependencies() {
    if (typeof window.mammoth === 'undefined') {
      throw new Error('Mammoth לא נטען. ודא שהקובץ vendor/mammoth.browser.min.js קיים.');
    }
    if (typeof window.TurndownService === 'undefined') {
      throw new Error('Turndown לא נטען. ודא שהקובץ vendor/turndown.js קיים.');
    }
  }

  function validateFile(file) {
    const hasDocxExtension = file.name.toLowerCase().endsWith('.docx');
    const hasExpectedMime = !file.type || file.type === DOCX_MIME;
    if (!hasDocxExtension || !hasExpectedMime) {
      throw new Error('יש לבחור קובץ DOCX תקין.');
    }
  }

  async function convertFile(file) {
    validateFile(file);
    assertDependencies();
    setMessage('ממיר את המסמך...');

    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer }, {
      includeDefaultStyleMap: true,
    });

    const safeHtml = sanitizeHtml(result.value);
    const turndown = createTurndownService();
    const markdown = turndown.turndown(safeHtml);

    state.sourceFileName = file.name;
    state.outputFileName = `${file.name.replace(/\.docx$/i, '')}.md`;
    state.convertedMarkdown = markdown;

    elements.wordPreview.innerHTML = safeHtml;
    elements.markdownEditor.value = markdown;
    elements.fileName.textContent = file.name;
    // elements.dropZone.hidden = true;
    elements.workspace.hidden = false;
    elements.resetButton.disabled = false;

    renderWarnings(result.messages || []);
    updateCounts();
    updateModifiedStatus();
    setMessage('המסמך הומר בהצלחה.');
  }

  function renderWarnings(messages) {
    elements.warningsList.replaceChildren();
    if (!messages.length) {
      elements.warningsPanel.hidden = true;
      return;
    }

    messages.forEach((message) => {
      const item = document.createElement('li');
      item.textContent = `${message.type || 'warning'}: ${message.message}`;
      elements.warningsList.append(item);
    });

    elements.warningsSummary.textContent = `Conversion warnings (${messages.length})`;
    elements.warningsPanel.hidden = false;
    elements.warningsList.hidden = true;
    elements.warningsToggle.setAttribute('aria-expanded', 'false');
  }

  function updateCounts() {
    const text = elements.markdownEditor.value;
    const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
    elements.wordCount.textContent = `${words} words`;
    elements.charCount.textContent = `${text.length} characters`;
  }

  function updateModifiedStatus() {
    const modified = elements.markdownEditor.value !== state.convertedMarkdown;
    elements.modifiedStatus.textContent = modified ? 'Modified' : 'Converted';
  }

  function markdownBlob() {
    return new Blob([elements.markdownEditor.value], { type: 'text/markdown;charset=utf-8' });
  }

  function downloadMarkdown() {
    if (elements.workspace.hidden) return;
    const url = URL.createObjectURL(markdownBlob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = state.outputFileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage(`נשמר ${state.outputFileName}`);
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(elements.markdownEditor.value);
      setMessage('ה-Markdown הועתק ללוח.');
    } catch (error) {
      elements.markdownEditor.focus();
      elements.markdownEditor.select();
      const copied = document.execCommand('copy');
      setMessage(copied ? 'ה-Markdown הועתק ללוח.' : 'לא ניתן להעתיק אוטומטית.', !copied);
    }
  }

  function resetApplication() {
    state.sourceFileName = '';
    state.outputFileName = 'document.md';
    state.convertedMarkdown = '';
    elements.fileInput.value = '';
    elements.wordPreview.replaceChildren();
    elements.markdownEditor.value = '';
    elements.fileName.textContent = 'לא נבחר מסמך';
    elements.workspace.hidden = true;
    // elements.dropZone.hidden = false;
    elements.resetButton.disabled = true;
    elements.warningsPanel.hidden = true;
    elements.warningsList.replaceChildren();
    updateCounts();
    setMessage('');
  }

  function setDirection(targetId, direction, clickedButton) {
    const target = document.getElementById(targetId);
    target.dir = direction;
    const group = clickedButton.closest('.pane-tools');
    group.querySelectorAll(`.direction-button[data-target="${targetId}"]`).forEach((button) => {
      button.classList.toggle('active', button === clickedButton);
    });
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    elements.themeSelect.value = theme;
    localStorage.setItem(THEME_KEY, theme);
  }

  function setMessage(text, error = false) {
    elements.message.textContent = text;
    elements.message.classList.toggle('error', error);
  }

  async function handleFiles(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    try {
      await convertFile(file);
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : 'ההמרה נכשלה.', true);
    }
  }

  elements.openButton.addEventListener('click', () => elements.fileInput.click());
  // elements.dropZone.addEventListener('click', () => elements.fileInput.click());
  // elements.dropZone.addEventListener('keydown', (event) => {
    // if (event.key === 'Enter' || event.key === ' ') {
      // event.preventDefault();
      // elements.fileInput.click();
    // }
  // });
  elements.fileInput.addEventListener('change', (event) => handleFiles(event.target.files));

  // ['dragenter', 'dragover'].forEach((eventName) => {
    // elements.dropZone.addEventListener(eventName, (event) => {
      // event.preventDefault();
      // elements.dropZone.classList.add('dragover');
    // });
  // });
  // ['dragleave', 'drop'].forEach((eventName) => {
    // elements.dropZone.addEventListener(eventName, (event) => {
      // event.preventDefault();
      // elements.dropZone.classList.remove('dragover');
    // });
  // });
  // elements.dropZone.addEventListener('drop', (event) => handleFiles(event.dataTransfer.files));

  elements.markdownEditor.addEventListener('input', () => {
    updateCounts();
    updateModifiedStatus();
  });
  elements.copyButton.addEventListener('click', copyMarkdown);
  elements.downloadButton.addEventListener('click', downloadMarkdown);
  elements.resetButton.addEventListener('click', resetApplication);
  elements.themeSelect.addEventListener('change', (event) => setTheme(event.target.value));

  document.querySelectorAll('.direction-button').forEach((button) => {
    button.addEventListener('click', () => setDirection(button.dataset.target, button.dataset.direction, button));
  });

  elements.warningsToggle.addEventListener('click', () => {
    const expanded = elements.warningsToggle.getAttribute('aria-expanded') === 'true';
    elements.warningsToggle.setAttribute('aria-expanded', String(!expanded));
    elements.warningsList.hidden = expanded;
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && !elements.workspace.hidden) {
      event.preventDefault();
      downloadMarkdown();
    }
  });

  const savedTheme = localStorage.getItem(THEME_KEY);
  setTheme(['light', 'dark', 'sepia'].includes(savedTheme) ? savedTheme : 'light');
  updateCounts();
})();
