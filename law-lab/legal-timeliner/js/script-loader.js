(function (global) {
  'use strict';

  var loadPromise = null;

  function emit(status, error) {
    if (typeof global.dispatchEvent === 'function' && typeof global.CustomEvent === 'function') {
      global.dispatchEvent(new CustomEvent('office-parser-status', {
        detail: { status: status, error: error || null }
      }));
    }
  }

  function isReady() {
    return Boolean(global.officeParser && typeof global.officeParser.parseOffice === 'function');
  }

  function load() {
    if (isReady()) {
      emit('ready');
      return Promise.resolve(global.officeParser);
    }

    if (loadPromise) return loadPromise;

    emit('loading');
    loadPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      var settled = false;
      var timer = null;

      function removeFailedScript() {
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      function fail(message) {
        if (settled) return;
        settled = true;
        if (timer !== null) global.clearTimeout(timer);
        removeFailedScript();
        loadPromise = null;
        var error = new Error(message);
        emit('error', error);
        reject(error);
      }

      timer = global.setTimeout(function () {
        fail('טעינת מנוע DOCX ארכה יותר מדי זמן');
      }, AppConfig.OFFICE_PARSER_TIMEOUT_MS);

      script.src = AppConfig.OFFICE_PARSER_URL;
      script.async = true;
      script.dataset.officeParserLoader = 'true';

      script.onload = function () {
        if (settled) return;
        if (timer !== null) global.clearTimeout(timer);
        settled = true;
        if (!isReady()) {
          removeFailedScript();
          loadPromise = null;
          var error = new Error('מנוע DOCX נטען, אך ה-API הצפוי לא נמצא');
          emit('error', error);
          reject(error);
          return;
        }
        emit('ready');
        resolve(global.officeParser);
      };

      script.onerror = function () {
        fail('לא ניתן היה לטעון את מנוע DOCX');
      };

      document.head.appendChild(script);
    });

    return loadPromise;
  }

  function preloadForFiles(files) {
    var hasDocx = Array.from(files || []).some(function (file) {
      return /\.docx$/i.test(file.name || '');
    });
    return hasDocx ? load() : Promise.resolve(null);
  }

  global.OfficeParserLoader = Object.freeze({
    load: load,
    preloadForFiles: preloadForFiles,
    isReady: isReady
  });
})(globalThis);
