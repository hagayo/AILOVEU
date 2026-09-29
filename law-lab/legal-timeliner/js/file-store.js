(function (global) {
  'use strict';

  function extensionOf(name) {
    var match = /\.([^.]+)$/.exec(name || '');
    return match ? match[1].toLowerCase() : '';
  }

  function createStore() {
    var items = [];
    var nextId = 1;
    var revision = 0;

    function touch() {
      revision += 1;
    }

    function sameFileSignature(a, b) {
      return a.file.name === b.file.name &&
        a.file.size === b.file.size &&
        a.file.lastModified === b.file.lastModified;
    }

    function refreshDuplicateFlags() {
      items.forEach(function (item) {
        item.probableDuplicate = items.some(function (other) {
          return other !== item && sameFileSignature(item, other);
        });
      });
    }

    function add(files) {
      var accepted = [];
      var rejected = [];
      var totalSize = items.reduce(function (sum, item) { return sum + item.size; }, 0);

      Array.from(files || []).forEach(function (file) {
        var ext = extensionOf(file.name);
        var fileSize = Number(file.size) || 0;
        if (AppConfig.SUPPORTED_EXTENSIONS.indexOf(ext) === -1) {
          rejected.push({ file: file, reason: 'unsupported' });
          return;
        }
        if (fileSize > AppConfig.MAX_FILE_SIZE_BYTES) {
          rejected.push({ file: file, reason: 'file-too-large' });
          return;
        }
        if (items.length >= AppConfig.MAX_FILES) {
          rejected.push({ file: file, reason: 'too-many-files' });
          return;
        }
        if (totalSize + fileSize > AppConfig.MAX_TOTAL_SIZE_BYTES) {
          rejected.push({ file: file, reason: 'total-too-large' });
          return;
        }

        var item = {
          id: 'file-' + nextId++,
          file: file,
          name: file.name,
          extension: ext,
          size: fileSize,
          sourceUrl: typeof file.sourceUrl === 'string' ? file.sourceUrl : '',
          status: 'pending',
          error: null,
          blocks: null,
          extractedWith: null,
          probableDuplicate: false
        };
        items.push(item);
        accepted.push(item);
        totalSize += fileSize;
      });

      if (accepted.length) {
        refreshDuplicateFlags();
        touch();
      }
      return { accepted: accepted, rejected: rejected };
    }

    function remove(id) {
      var before = items.length;
      items = items.filter(function (item) { return item.id !== id; });
      if (items.length !== before) {
        refreshDuplicateFlags();
        touch();
      }
    }

    function clear() {
      if (!items.length) return;
      items = [];
      touch();
    }

    function find(id) {
      return items.find(function (item) { return item.id === id; }) || null;
    }

    function setProcessing(id) {
      var item = find(id);
      if (!item) return;
      item.status = 'processing';
      item.error = null;
    }

    function setDone(id, blocks) {
      var item = find(id);
      if (!item) return;
      item.status = 'done';
      item.error = null;
      item.blocks = blocks;
      item.extractedWith = AppConfig.EXTRACTOR_VERSION;
    }

    function setError(id, error) {
      var item = find(id);
      if (!item) return;
      item.status = 'error';
      item.error = error instanceof Error ? error.message : String(error || 'שגיאה לא ידועה');
      item.blocks = null;
      item.extractedWith = null;
    }

    function resetError(id) {
      var item = find(id);
      if (!item) return;
      item.status = 'pending';
      item.error = null;
    }

    return Object.freeze({
      add: add,
      remove: remove,
      clear: clear,
      setProcessing: setProcessing,
      setDone: setDone,
      setError: setError,
      resetError: resetError,
      list: function () { return items.slice(); },
      getRevision: function () { return revision; }
    });
  }

  global.CaseFileStore = Object.freeze({
    create: createStore,
    extensionOf: extensionOf
  });
})(globalThis);
