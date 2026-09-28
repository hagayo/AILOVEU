(function () {
  'use strict';

  var store = CaseFileStore.create();
  var lastBuiltRevision = -1;
  var allEntries = [];
  var excludedEntryIds = new Set();
  var selectedEntryIds = new Set();
  var entriesById = new Map();
  var builtFileItems = [];
  var relatedDocuments = RelatedDocumentMatcher.buildIndex([], []);
  var fileUrls = new Map();
  var isProcessing = false;
  var buildIncomplete = false;

  var els = {};

  function q(id) { return document.getElementById(id); }

  function cacheElements() {
    [
      'file-input', 'drop-zone', 'clear-files', 'file-summary', 'file-count', 'file-size',
      'file-list', 'files-area', 'files-toggle', 'add-more', 'parser-status', 'parser-status-text',
      'build-timeline', 'progress-wrap', 'progress-bar', 'progress-text', 'stale-banner',
      'results-section', 'timeline', 'empty-results', 'metric-entries', 'metric-dates',
      'metric-files', 'document-filter', 'category-filter', 'filter-level', 'processing-summary', 'processing-warning', 'processing-warning-text',
      'selected-events-count', 'select-visible-events', 'clear-event-selection', 'export-format', 'export-selected-events'
    ].forEach(function (id) { els[id] = q(id); });
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function statusText(item) {
    if (item.status === 'processing') return 'מעבד...';
    if (item.status === 'done') return item.blocks.length + ' קטעים חולצו';
    if (item.status === 'error') return 'שגיאה בחילוץ';
    return 'ממתין לעיבוד';
  }

  function statusClass(item) {
    return 'file-status ' + item.status;
  }

  function markDirty() {
    var dirty = lastBuiltRevision >= 0 && store.getRevision() !== lastBuiltRevision;
    els['stale-banner'].hidden = !dirty;
    var label = els['build-timeline'].querySelector('.button-label');
    label.textContent = dirty ? 'עדכן ציר זמן' : (buildIncomplete ? 'נסה שוב' : (lastBuiltRevision >= 0 ? 'בנה מחדש' : 'בנה ציר זמן'));
  }

  function setFilesExpanded(expanded) {
    els['file-list'].hidden = !expanded;
    els['files-toggle'].setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function renderFiles() {
    var items = store.list();
    els['file-list'].replaceChildren();
    els['files-toggle'].hidden = items.length === 0;
    els['files-area'].hidden = items.length === 0;
    els['clear-files'].hidden = items.length === 0;
    els['build-timeline'].disabled = items.length === 0 || isProcessing;
    els['file-input'].disabled = isProcessing;
    els['add-more'].disabled = isProcessing;
    els['drop-zone'].classList.toggle('disabled', isProcessing);

    els['file-count'].textContent = String(items.length);
    els['file-size'].textContent = formatBytes(items.reduce(function (sum, item) { return sum + item.size; }, 0));

    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'file-row';

      var icon = document.createElement('div');
      icon.className = 'file-icon ' + (item.extension === 'txt' ? 'txt' : 'docx');
      icon.textContent = item.extension.toUpperCase();

      var main = document.createElement('div');
      main.className = 'file-main';

      var name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = item.name;
      name.title = item.name;

      var meta = document.createElement('div');
      meta.className = 'file-meta';
      var size = document.createElement('span');
      size.textContent = formatBytes(item.size);
      var status = document.createElement('span');
      status.className = statusClass(item);
      status.textContent = statusText(item);
      meta.append(size, status);

      if (item.probableDuplicate) {
        var duplicate = document.createElement('span');
        duplicate.className = 'duplicate-note';
        duplicate.textContent = 'ייתכן שנוסף כבר';
        duplicate.title = 'לא הוסר אוטומטית - המערכת אינה מעלימה מידע';
        meta.appendChild(duplicate);
      }

      if (item.error) {
        var error = document.createElement('span');
        error.className = 'file-status error';
        error.textContent = item.error;
        error.title = item.error;
        meta.appendChild(error);
      }

      main.append(name, meta);

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-file';
      remove.setAttribute('aria-label', 'הסר ' + item.name);
      remove.textContent = '×';
      remove.disabled = isProcessing;
      remove.addEventListener('click', function () {
        store.remove(item.id);
        renderFiles();
        renderDocumentFilter();
        markDirty();
      });

      row.append(icon, main, remove);
      els['file-list'].appendChild(row);
    });

    markDirty();
  }

  function setParserStatus(status, message) {
    var box = els['parser-status'];
    box.hidden = status !== 'error';
    box.className = 'parser-status ' + status;
    els['parser-status-text'].textContent = message;
  }

  function handleParserStatus(event) {
    var detail = event.detail || {};
    if (detail.status === 'loading') setParserStatus('loading', 'מנוע DOCX נטען ברקע - אפשר להמשיך להוסיף מסמכים');
    if (detail.status === 'ready') setParserStatus('ready', 'מנוע DOCX מוכן לעיבוד');
    if (detail.status === 'error') setParserStatus('error', 'טעינת מנוע DOCX נכשלה. ננסה שוב בזמן הבנייה.');
  }

  function addFiles(files) {
    if (isProcessing) return;
    var result = store.add(files);
    if (result.rejected.length) {
      var names = result.rejected.map(function (item) { return item.file.name; }).join(', ');
      alert('הקבצים הבאים לא נתמכים ב-V1: ' + names);
    }

    if (result.accepted.length) {
      setFilesExpanded(true);
      OfficeParserLoader.preloadForFiles(result.accepted.map(function (item) { return item.file; })).catch(function () {
        // Status is displayed by the loader event. Build will retry.
      });
      renderFiles();
      renderDocumentFilter();
      markDirty();
    }
  }

  async function processOne(item) {
    if (item.blocks && item.extractedWith === AppConfig.EXTRACTOR_VERSION && item.status === 'done') {
      return item.blocks;
    }

    if (item.status === 'error') store.resetError(item.id);
    store.setProcessing(item.id);
    renderFiles();
    await new Promise(function (resolve) { requestAnimationFrame(resolve); });

    try {
      var blocks = await DocumentExtractor.extract(item);
      store.setDone(item.id, blocks);
      return blocks;
    } catch (error) {
      store.setError(item.id, error);
      return null;
    } finally {
      renderFiles();
    }
  }

  function revokeFileUrls() {
    fileUrls.forEach(function (url) { URL.revokeObjectURL(url); });
    fileUrls.clear();
  }

  function fileUrl(item) {
    if (!item || !item.file || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return '';
    if (!fileUrls.has(item.id)) fileUrls.set(item.id, URL.createObjectURL(item.file));
    return fileUrls.get(item.id);
  }

  function renderProcessingSummary(items, failedItems) {
    var files = Array.isArray(items) ? items : [];
    var failures = Array.isArray(failedItems) ? failedItems : [];
    var successfulCount = Math.max(0, files.length - failures.length);
    var parts = [
      'מסמכים שעובדו בהצלחה: ' + successfulCount,
      'אירועים: ' + allEntries.length
    ];
    if (failures.length) parts.push('מסמכים שנכשלו: ' + failures.length);
    els['processing-summary'].textContent = parts.join(' · ');
    els['processing-summary'].hidden = false;
  }

  function renderProcessingWarning(failedItems) {
    var failures = Array.isArray(failedItems) ? failedItems : [];
    els['processing-warning'].hidden = failures.length === 0;
    if (!failures.length) {
      els['processing-warning-text'].textContent = '';
      return;
    }
    var names = failures.map(function (item) { return item.name; }).join(' · ');
    els['processing-warning-text'].textContent =
      failures.length + ' מסמכים לא עובדו ולכן אינם נכללים בציר הזמן: ' + names;
  }

  function updateEntries(items) {
    allEntries = TimelineBuilder.build(items, els['filter-level'].value).filter(function (entry) {
      return !excludedEntryIds.has(entry.id);
    });
    entriesById = new Map(allEntries.map(function (entry) { return [entry.id, entry]; }));
    selectedEntryIds.forEach(function (id) {
      if (!entriesById.has(id)) selectedEntryIds.delete(id);
    });
    relatedDocuments = RelatedDocumentMatcher.buildIndex(items, allEntries);
  }

  function visibleEntries() {
    var selectedDocument = els['document-filter'].value;
    var documentEntries = selectedDocument === 'all' ? allEntries : allEntries.filter(function (entry) {
      return entry.fileId === selectedDocument;
    });
    return TimelineBuilder.filterByCategory(documentEntries, els['category-filter'].value);
  }

  function updateExportControls() {
    var selectedCount = 0;
    selectedEntryIds.forEach(function (id) { if (entriesById.has(id)) selectedCount += 1; });
    els['selected-events-count'].textContent = selectedCount
      ? selectedCount + (selectedCount === 1 ? ' אירוע נבחר' : ' אירועים נבחרו')
      : 'לא נבחרו אירועים';
    els['export-selected-events'].disabled = selectedCount === 0;
  }

  function downloadFile(blob, extension) {
    var href = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = href;
    link.download = 'legal-timeline-' + new Date().toISOString().slice(0, 10) + '.' + extension;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(href); }, 1000);
  }

  function exportSelectedEvents() {
    var selected = [];
    selectedEntryIds.forEach(function (id) {
      var entry = entriesById.get(id);
      if (entry) selected.push(Object.assign({}, entry, { sourceLocation: locationLabel(entry) }));
    });
    if (!selected.length) return;

    var format = els['export-format'].value;
    if (format === 'md') {
      downloadFile(new Blob([TimelineExporter.markdown(selected)], { type: 'text/markdown;charset=utf-8' }), 'md');
      return;
    }
    if (format === 'docx') {
      downloadFile(new Blob([TimelineExporter.docx(selected)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }), 'docx');
      return;
    }

    var printWindow = globalThis.open('', '_blank');
    if (!printWindow) {
      alert('הדפדפן חסם את חלון הייצוא. אפשר לאפשר חלונות קופצים ולנסות שוב.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(TimelineExporter.printHtml(selected));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function () { printWindow.print(); }, 300);
  }

  async function buildTimeline() {
    if (isProcessing || store.list().length === 0) return;

    var buildRevision = store.getRevision();
    var items = store.list();
    isProcessing = true;
    renderFiles();
    els['progress-wrap'].hidden = false;
    els['progress-bar'].style.width = '0%';

    try {
      for (var i = 0; i < items.length; i += 1) {
        els['progress-text'].textContent = 'מעבד ' + (i + 1) + ' מתוך ' + items.length + ': ' + items[i].name;
        await processOne(items[i]);
        els['progress-bar'].style.width = (((i + 1) / items.length) * 100).toFixed(0) + '%';
        await new Promise(function (resolve) { setTimeout(resolve, 0); });
      }

      var failedItems = items.filter(function (item) { return item.status === 'error'; });
      builtFileItems = items.slice();
      updateEntries(builtFileItems);
      revokeFileUrls();
      lastBuiltRevision = buildRevision;
      buildIncomplete = failedItems.length > 0;
      renderProcessingSummary(items, failedItems);
      renderProcessingWarning(failedItems);
      els['progress-text'].textContent = buildIncomplete
        ? 'העיבוד הסתיים עם ' + failedItems.length + ' שגיאות'
        : 'העיבוד הסתיים';
      renderDocumentFilter();
      renderTimeline();
      els['results-section'].hidden = false;
      setFilesExpanded(false);
      els['results-section'].scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
      isProcessing = false;
      renderFiles();
      markDirty();
    }
  }

  function formatDateHe(normalizedDate) {
    var parts = normalizedDate.split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
    }).format(date);
  }

  function annotationLabel(type) {
    if (type === 'comment') return 'הערת צד';
    if (type === 'footnote') return 'הערת שוליים';
    if (type === 'endnote') return 'הערת סיום';
    return 'הערה';
  }

  function locationLabel(entry) {
    var location = entry.location || {};
    if (location.annotationType) {
      var annotation = annotationLabel(location.annotationType);
      if (location.annotationId !== null && location.annotationId !== undefined && location.annotationId !== '') {
        annotation += ' ' + location.annotationId;
      }
      if (location.annotationParagraph) annotation += ' · פסקה ' + location.annotationParagraph + ' בהערה';
      if (location.table) {
        return annotation + ' · טבלה ' + location.table + ' · שורה ' + location.row + ' · תא ' + location.cell;
      }
      if (location.bodyParagraph) return annotation + ' · ליד פסקת גוף ' + location.bodyParagraph;
      if (location.parentBlockIndex) return annotation + ' · ליד קטע מקור ' + location.parentBlockIndex;
      return annotation;
    }
    if (location.table) {
      var tableLabel = 'טבלה ' + location.table + ' · שורה ' + location.row + ' · תא ' + location.cell;
      if (location.cellParagraph) tableLabel += ' · פסקה ' + location.cellParagraph + ' בתא';
      return tableLabel;
    }
    if (location.bodyParagraph) return 'פסקת גוף ' + location.bodyParagraph;
    if (entry.blockKind === 'text-block') return 'קטע ' + entry.blockIndex;
    return 'קטע מקור ' + entry.blockIndex;
  }

  function appendHighlighted(container, entry) {
    var text = entry.paragraphText;
    var start = entry.matchIndex;
    var end = start + entry.matchLength;
    container.appendChild(document.createTextNode(text.slice(0, start)));
    var mark = document.createElement('mark');
    mark.textContent = text.slice(start, end);
    container.appendChild(mark);
    container.appendChild(document.createTextNode(text.slice(end)));
  }

  function showSource(entry) {
    var item = builtFileItems.find(function (fileItem) { return fileItem.id === entry.fileId; });
    if (!item) return;
    var blocks = Array.isArray(item.blocks) ? item.blocks : [];
    var blockIndex = blocks.findIndex(function (block) { return block.index === entry.blockIndex; });
    var dialog = q('source-dialog');
    var content = q('source-dialog-content');
    content.replaceChildren();
    q('source-dialog-title').textContent = item.name;
    q('source-dialog-meta').textContent = locationLabel(entry);

    function appendContextBlock(label, block, highlighted) {
      if (!block) return;
      var section = document.createElement('section');
      section.className = highlighted ? 'source-excerpt current' : 'source-excerpt';
      if (label) {
        var heading = document.createElement('span');
        heading.className = 'source-excerpt-label';
        heading.textContent = label;
        section.appendChild(heading);
      }
      var text = document.createElement('p');
      if (highlighted && block.text.slice(entry.matchIndex, entry.matchIndex + entry.matchLength)) {
        text.appendChild(document.createTextNode(block.text.slice(0, entry.matchIndex)));
        var mark = document.createElement('mark');
        mark.textContent = block.text.slice(entry.matchIndex, entry.matchIndex + entry.matchLength);
        text.appendChild(mark);
        text.appendChild(document.createTextNode(block.text.slice(entry.matchIndex + entry.matchLength)));
      } else {
        text.textContent = block.text;
      }
      section.appendChild(text);
      content.appendChild(section);
    }

    appendContextBlock('הקטע הקודם', blocks[blockIndex - 1], false);
    appendContextBlock('הקטע שבו נמצא האירוע · ' + locationLabel(entry), blocks[blockIndex], true);
    appendContextBlock('הקטע הבא', blocks[blockIndex + 1], false);

    var original = q('source-dialog-file');
    original.href = fileUrl(item);
    original.textContent = 'פתח את הקובץ המקורי';
    if (!dialog.open) dialog.showModal();
  }

  function filterItems() {
    if (lastBuiltRevision >= 0 && builtFileItems.length) return builtFileItems;
    return store.list();
  }

  function renderDocumentFilter() {
    var selected = els['document-filter'].value || 'all';
    var items = filterItems();
    els['document-filter'].replaceChildren();
    var all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'כל המסמכים';
    els['document-filter'].appendChild(all);
    items.forEach(function (item) {
      var option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      els['document-filter'].appendChild(option);
    });
    els['document-filter'].value = items.some(function (item) { return item.id === selected; }) ? selected : 'all';
  }

  function appendRelatedDocuments(card, entry) {
    var matches = relatedDocuments.forEntry(entry);
    if (!matches.length) return;

    var section = document.createElement('div');
    section.className = 'related-documents';
    var title = document.createElement('span');
    title.className = 'related-documents-title';
    title.textContent = 'מסמכים קשורים';
    var links = document.createElement('div');
    links.className = 'related-document-links';

    matches.forEach(function (match) {
      var href = fileUrl(match.file);
      if (!href) return;
      var link = document.createElement('a');
      link.className = 'related-document-link' + (match.isSource ? ' source' : '');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.title = 'פתח את המסמך המקורי: ' + match.file.name;

      var name = document.createElement('span');
      name.textContent = match.file.name;
      link.appendChild(name);

      if (match.isSource) {
        var badge = document.createElement('b');
        badge.textContent = 'מקור';
        link.appendChild(badge);
      }

      links.appendChild(link);
    });

    if (!links.childElementCount) return;
    section.append(title, links);
    card.appendChild(section);
  }

  function renderTimeline() {
    var entries = visibleEntries();
    var groups = TimelineBuilder.group(entries);
    var successfulFiles = new Set(entries.map(function (entry) { return entry.fileId; }));

    els['timeline'].replaceChildren();
    els['metric-entries'].textContent = String(entries.length);
    els['metric-dates'].textContent = String(groups.length);
    els['metric-files'].textContent = String(successfulFiles.size);
    els['empty-results'].hidden = entries.length !== 0;

    groups.forEach(function (group) {
      var wrapper = document.createElement('section');
      wrapper.className = 'timeline-group';

      var dateBadge = document.createElement('div');
      dateBadge.className = 'date-badge';
      var strong = document.createElement('strong');
      strong.textContent = group.date.split('-').reverse().join('.');
      var human = document.createElement('span');
      human.textContent = formatDateHe(group.date);
      dateBadge.append(strong, human);

      var cards = document.createElement('div');
      cards.className = 'timeline-cards';

      group.entries.forEach(function (entry) {
        var card = document.createElement('article');
        card.className = 'timeline-card';

        var top = document.createElement('div');
        top.className = 'card-top';
        var source = document.createElement('span');
        source.className = 'source-chip' + (/\.txt$/i.test(entry.fileName) ? ' txt' : '');
        var sourceName = document.createElement('span');
        sourceName.textContent = entry.fileName;
        source.appendChild(sourceName);
        var category = document.createElement('span');
        category.className = 'event-category' + (entry.category === 'אזכור לבדיקה' ? ' review' : '');
        category.textContent = entry.category;
        var location = document.createElement('button');
        location.type = 'button';
        location.className = 'location-chip';
        location.textContent = locationLabel(entry);
        location.title = 'פתח את קטע המקור';
        location.addEventListener('click', function () { showSource(entry); });
        var selection = document.createElement('label');
        selection.className = 'event-export-selection';
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selectedEntryIds.has(entry.id);
        checkbox.setAttribute('aria-label', 'בחר אירוע לייצוא: ' + entry.rawDate + ' מתוך ' + entry.fileName);
        checkbox.addEventListener('change', function () {
          if (checkbox.checked) selectedEntryIds.add(entry.id);
          else selectedEntryIds.delete(entry.id);
          updateExportControls();
        });
        selection.append(checkbox, document.createTextNode('לייצוא'));
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-event';
        remove.setAttribute('aria-label', 'הסר אירוע מתאריך ' + entry.rawDate + ' מתוך ' + entry.fileName);
        remove.title = 'הסר אירוע מציר הזמן';
        remove.textContent = '×';
        remove.addEventListener('click', function () {
          excludedEntryIds.add(entry.id);
          selectedEntryIds.delete(entry.id);
          entriesById.delete(entry.id);
          allEntries = allEntries.filter(function (candidate) { return candidate.id !== entry.id; });
          renderTimeline();
          renderProcessingSummary(builtFileItems, builtFileItems.filter(function (item) { return item.status === 'error'; }));
        });
        top.append(category, source, location, selection, remove);

        var paragraph = document.createElement('p');
        paragraph.className = 'paragraph';
        appendHighlighted(paragraph, entry);

        card.append(top, paragraph);
        appendRelatedDocuments(card, entry);
        cards.appendChild(card);
      });

      wrapper.append(dateBadge, cards);
      els['timeline'].appendChild(wrapper);
    });
    updateExportControls();
  }

  function bindEvents() {
    els['file-input'].addEventListener('change', function (event) {
      addFiles(event.target.files);
      event.target.value = '';
    });

    els['add-more'].addEventListener('click', function () { els['file-input'].click(); });
    els['files-toggle'].addEventListener('click', function () {
      setFilesExpanded(els['file-list'].hidden);
    });
    els['clear-files'].addEventListener('click', function () {
      if (isProcessing) return;
      store.clear();
      allEntries = [];
      excludedEntryIds.clear();
      selectedEntryIds.clear();
      entriesById.clear();
      builtFileItems = [];
      relatedDocuments = RelatedDocumentMatcher.buildIndex([], []);
      revokeFileUrls();
      lastBuiltRevision = -1;
      buildIncomplete = false;
      renderProcessingWarning([]);
      els['processing-summary'].hidden = true;
      els['processing-summary'].textContent = '';
      els['results-section'].hidden = true;
      els['stale-banner'].hidden = true;
      setFilesExpanded(true);
      renderFiles();
      renderDocumentFilter();
    });

    els['build-timeline'].addEventListener('click', buildTimeline);
    els['export-selected-events'].addEventListener('click', exportSelectedEvents);
    els['select-visible-events'].addEventListener('click', function () {
      visibleEntries().forEach(function (entry) { selectedEntryIds.add(entry.id); });
      renderTimeline();
    });
    els['clear-event-selection'].addEventListener('click', function () {
      selectedEntryIds.clear();
      renderTimeline();
    });
    q('source-dialog-close').addEventListener('click', function () { q('source-dialog').close(); });
    els['document-filter'].addEventListener('change', renderTimeline);
    els['category-filter'].addEventListener('change', renderTimeline);
    els['filter-level'].addEventListener('change', function () {
      if (lastBuiltRevision < 0) return;
      updateEntries(builtFileItems);
      renderTimeline();
      renderProcessingSummary(builtFileItems, builtFileItems.filter(function (item) { return item.status === 'error'; }));
    });

    ['dragenter', 'dragover'].forEach(function (name) {
      els['drop-zone'].addEventListener(name, function (event) {
        event.preventDefault();
        if (!isProcessing) els['drop-zone'].classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(function (name) {
      els['drop-zone'].addEventListener(name, function (event) {
        event.preventDefault();
        els['drop-zone'].classList.remove('drag-over');
      });
    });
    els['drop-zone'].addEventListener('drop', function (event) { addFiles(event.dataTransfer.files); });

    globalThis.addEventListener('office-parser-status', handleParserStatus);
    globalThis.addEventListener('beforeunload', revokeFileUrls, { once: true });
  }

  function init() {
    cacheElements();
    TimelineBuilder.filterLevels.forEach(function (level) {
      var option = document.createElement('option');
      option.value = level.value;
      option.textContent = level.label;
      els['filter-level'].appendChild(option);
    });
    TimelineBuilder.categories.forEach(function (category) {
      var option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      els['category-filter'].appendChild(option);
    });
    els['filter-level'].value = TimelineBuilder.defaultFilterLevel;
    bindEvents();
    renderFiles();
    renderDocumentFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
