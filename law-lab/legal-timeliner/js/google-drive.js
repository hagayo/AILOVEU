(function (global) {
  'use strict';

  var API_LOADER_URL = 'https://apis.google.com/js/api.js';
  var IDENTITY_LOADER_URL = 'https://accounts.google.com/gsi/client';
  var DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files/';
  var DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
  var MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  var MIME_TEXT = 'text/plain';
  var MIME_GOOGLE_DOC = 'application/vnd.google-apps.document';
  var PICKER_MIME_TYPES = [MIME_DOCX, MIME_TEXT, MIME_GOOGLE_DOC].join(',');

  var apiScriptPromise = null;
  var identityScriptPromise = null;
  var pickerPromise = null;
  var tokenClient = null;
  var accessToken = null;

  function configured() {
    return Boolean(
      AppConfig.GOOGLE_DRIVE_CLIENT_ID &&
      AppConfig.GOOGLE_DRIVE_API_KEY &&
      AppConfig.GOOGLE_DRIVE_APP_ID
    );
  }

  function loadExternalScript(url, readyCheck) {
    if (readyCheck()) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      var settled = false;
      var timer = global.setTimeout(function () {
        if (settled) return;
        settled = true;
        if (script.parentNode) script.parentNode.removeChild(script);
        reject(new Error('טעינת Google Drive ארכה יותר מדי זמן'));
      }, AppConfig.GOOGLE_DRIVE_TIMEOUT_MS);

      script.src = url;
      script.async = true;
      script.defer = true;
      script.onload = function () {
        if (settled) return;
        global.clearTimeout(timer);
        settled = true;
        if (!readyCheck()) {
          if (script.parentNode) script.parentNode.removeChild(script);
          reject(new Error('ספריית Google נטענה אך ה-API הצפוי לא נמצא'));
          return;
        }
        resolve();
      };
      script.onerror = function () {
        if (settled) return;
        global.clearTimeout(timer);
        settled = true;
        if (script.parentNode) script.parentNode.removeChild(script);
        reject(new Error('לא ניתן היה לטעון את Google Drive'));
      };
      document.head.appendChild(script);
    });
  }

  function ensureLibraries() {
    if (!apiScriptPromise) {
      apiScriptPromise = loadExternalScript(API_LOADER_URL, function () {
        return Boolean(global.gapi && typeof global.gapi.load === 'function');
      }).catch(function (error) {
        apiScriptPromise = null;
        throw error;
      });
    }
    if (!identityScriptPromise) {
      identityScriptPromise = loadExternalScript(IDENTITY_LOADER_URL, function () {
        return Boolean(global.google && global.google.accounts && global.google.accounts.oauth2);
      }).catch(function (error) {
        identityScriptPromise = null;
        throw error;
      });
    }

    return Promise.all([apiScriptPromise, identityScriptPromise]).then(function () {
      if (global.google && global.google.picker) return;
      if (!pickerPromise) {
        pickerPromise = new Promise(function (resolve, reject) {
          var timer = global.setTimeout(function () {
            pickerPromise = null;
            reject(new Error('טעינת Google Picker ארכה יותר מדי זמן'));
          }, AppConfig.GOOGLE_DRIVE_TIMEOUT_MS);
          global.gapi.load('picker', {
            callback: function () {
              global.clearTimeout(timer);
              resolve();
            },
            onerror: function () {
              global.clearTimeout(timer);
              pickerPromise = null;
              reject(new Error('לא ניתן היה לטעון את Google Picker'));
            }
          });
        });
      }
      return pickerPromise;
    });
  }

  function requestToken() {
    return new Promise(function (resolve, reject) {
      if (!tokenClient) {
        tokenClient = global.google.accounts.oauth2.initTokenClient({
          client_id: AppConfig.GOOGLE_DRIVE_CLIENT_ID,
          scope: DRIVE_SCOPE,
          callback: function () {}
        });
      }

      tokenClient.callback = function (response) {
        if (!response || response.error || !response.access_token) {
          reject(new Error('ההרשאה ל-Google Drive לא הושלמה'));
          return;
        }
        accessToken = response.access_token;
        resolve(accessToken);
      };
      tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
    });
  }

  function pickerDocumentValue(doc, enumKey, fallbackKey) {
    if (!doc) return '';
    var picker = global.google && global.google.picker;
    var enumValue = picker && picker.Document && picker.Document[enumKey];
    return (enumValue && doc[enumValue]) || doc[fallbackKey] || '';
  }

  function openPicker(token) {
    return new Promise(function (resolve, reject) {
      var picker = global.google.picker;
      var view = new picker.DocsView()
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false)
        .setMimeTypes(PICKER_MIME_TYPES);
      if (picker.DocsViewMode && picker.DocsViewMode.LIST) view.setMode(picker.DocsViewMode.LIST);

      var builder = new picker.PickerBuilder()
        .addView(view)
        .enableFeature(picker.Feature.MULTISELECT_ENABLED)
        .setOAuthToken(token)
        .setDeveloperKey(AppConfig.GOOGLE_DRIVE_API_KEY)
        .setAppId(AppConfig.GOOGLE_DRIVE_APP_ID)
        .setCallback(function (data) {
          if (!data) return;
          if (data.action === picker.Action.CANCEL) {
            resolve([]);
            return;
          }
          if (data.action !== picker.Action.PICKED) return;
          var docs = Array.isArray(data.docs) ? data.docs : [];
          resolve(docs.map(function (doc) {
            return {
              id: pickerDocumentValue(doc, 'ID', 'id'),
              name: pickerDocumentValue(doc, 'NAME', 'name'),
              mimeType: pickerDocumentValue(doc, 'MIME_TYPE', 'mimeType')
            };
          }).filter(function (doc) { return doc.id; }));
        });

      try {
        builder.build().setVisible(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  function fileNameFor(doc) {
    var name = String(doc.name || 'google-drive-document').trim() || 'google-drive-document';
    if (doc.mimeType === MIME_GOOGLE_DOC) {
      return /\.docx$/i.test(name) ? name : name + '.docx';
    }
    return name;
  }

  function downloadUrl(doc) {
    var encodedId = encodeURIComponent(doc.id);
    if (doc.mimeType === MIME_GOOGLE_DOC) {
      return DRIVE_API_BASE + encodedId + '/export?mimeType=' + encodeURIComponent(MIME_DOCX);
    }
    return DRIVE_API_BASE + encodedId + '?alt=media';
  }

  function downloadOne(doc, token, fetchImpl) {
    var request = fetchImpl || global.fetch;
    if (typeof request !== 'function') return Promise.reject(new Error('הדפדפן אינו תומך בהורדת קבצי Drive'));
    if ([MIME_DOCX, MIME_TEXT, MIME_GOOGLE_DOC].indexOf(doc.mimeType) === -1) {
      return Promise.reject(new Error('סוג הקובץ אינו נתמך: ' + (doc.name || doc.id)));
    }

    return request(downloadUrl(doc), {
      headers: { Authorization: 'Bearer ' + token }
    }).then(function (response) {
      if (!response.ok) {
        if (response.status === 403) throw new Error('אין הרשאת הורדה לקובץ: ' + fileNameFor(doc));
        throw new Error('הורדת הקובץ מ-Google Drive נכשלה: ' + fileNameFor(doc));
      }
      return response.blob();
    }).then(function (blob) {
      var fileType = doc.mimeType === MIME_GOOGLE_DOC ? MIME_DOCX : doc.mimeType;
      var file = new File([blob], fileNameFor(doc), {
        type: fileType,
        lastModified: Date.now()
      });
      try {
        Object.defineProperty(file, 'sourceUrl', {
          value: 'https://drive.google.com/open?id=' + encodeURIComponent(doc.id),
          enumerable: false
        });
      } catch (_) {
        // The downloaded File still works even if the browser prevents custom metadata.
      }
      return file;
    });
  }

  async function pickFiles() {
    if (!configured()) {
      throw new Error('Google Drive עדיין לא הוגדר. יש למלא Client ID, API Key ו-App ID ב-js/config.js');
    }
    await ensureLibraries();
    var token = await requestToken();
    var docs = await openPicker(token);
    if (!docs.length) return [];

    var files = [];
    var errors = [];
    for (var i = 0; i < docs.length; i += 1) {
      try {
        files.push(await downloadOne(docs[i], token));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    return { files: files, errors: errors };
  }

  global.GoogleDriveSource = Object.freeze({
    pickFiles: pickFiles,
    configured: configured,
    downloadOne: downloadOne,
    downloadUrl: downloadUrl,
    fileNameFor: fileNameFor,
    MIME_DOCX: MIME_DOCX,
    MIME_TEXT: MIME_TEXT,
    MIME_GOOGLE_DOC: MIME_GOOGLE_DOC
  });
})(globalThis);
