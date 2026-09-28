(function (global) {
  'use strict';

  var DOCX_CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>';
  var DOCX_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>';

  function xmlEscape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char];
    });
  }

  function formatDate(value) {
    return String(value || '').split('-').reverse().join('.');
  }

  function normalizeEntries(entries) {
    return (Array.isArray(entries) ? entries : []).slice().sort(function (a, b) {
      return String(a.normalizedDate).localeCompare(String(b.normalizedDate)) ||
        String(a.fileName).localeCompare(String(b.fileName), 'he');
    });
  }

  function markdown(entries, title) {
    var sorted = normalizeEntries(entries);
    var lines = ['# ' + (title || 'ציר זמן משפטי'), ''];
    sorted.forEach(function (entry) {
      lines.push('## ' + formatDate(entry.normalizedDate));
      lines.push('');
      lines.push('- **קטגוריה:** ' + (entry.category || ''));
      lines.push('- **אירוע:** ' + String(entry.paragraphText || '').replace(/\n/g, ' '));
      lines.push('- **מקור:** ' + (entry.fileName || '') + ' · ' + (entry.sourceLocation || ''));
      lines.push('');
    });
    return lines.join('\n');
  }

  function xmlParagraph(text, style) {
    var pStyle = style ? '<w:pStyle w:val="' + style + '"/>' : '';
    return '<w:p><w:pPr><w:bidi/>' + pStyle + '</w:pPr><w:r><w:rPr><w:rtl/><w:lang w:val="he-IL"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>';
  }

  function documentXml(entries, title) {
    var body = xmlParagraph(title || 'ציר זמן משפטי', 'Title');
    normalizeEntries(entries).forEach(function (entry) {
      body += xmlParagraph(formatDate(entry.normalizedDate), 'Heading1');
      body += xmlParagraph('קטגוריה: ' + (entry.category || ''));
      body += xmlParagraph('אירוע: ' + String(entry.paragraphText || '').replace(/\n/g, ' '));
      body += xmlParagraph('מקור: ' + (entry.fileName || '') + ' · ' + (entry.sourceLocation || ''));
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>';
  }

  function crc32(bytes) {
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i += 1) {
      crc ^= bytes[i];
      for (var bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function write16(view, offset, value) { view.setUint16(offset, value, true); }
  function write32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

  function makeZip(files) {
    var encoder = new TextEncoder();
    var localParts = [];
    var centralParts = [];
    var localOffset = 0;

    files.forEach(function (file) {
      var name = encoder.encode(file.name);
      var data = encoder.encode(file.content);
      var crc = crc32(data);
      var local = new Uint8Array(30 + name.length + data.length);
      var localView = new DataView(local.buffer);
      write32(localView, 0, 0x04034b50);
      write16(localView, 4, 20);
      write16(localView, 6, 0x0800);
      write16(localView, 8, 0);
      write16(localView, 10, 0);
      write16(localView, 12, 33);
      write32(localView, 14, crc);
      write32(localView, 18, data.length);
      write32(localView, 22, data.length);
      write16(localView, 26, name.length);
      write16(localView, 28, 0);
      local.set(name, 30);
      local.set(data, 30 + name.length);
      localParts.push(local);

      var central = new Uint8Array(46 + name.length);
      var centralView = new DataView(central.buffer);
      write32(centralView, 0, 0x02014b50);
      write16(centralView, 4, 20);
      write16(centralView, 6, 20);
      write16(centralView, 8, 0x0800);
      write16(centralView, 10, 0);
      write16(centralView, 12, 0);
      write16(centralView, 14, 33);
      write32(centralView, 16, crc);
      write32(centralView, 20, data.length);
      write32(centralView, 24, data.length);
      write16(centralView, 28, name.length);
      write16(centralView, 30, 0);
      write16(centralView, 32, 0);
      write16(centralView, 34, 0);
      write16(centralView, 36, 0);
      write32(centralView, 38, 0);
      write32(centralView, 42, localOffset);
      central.set(name, 46);
      centralParts.push(central);
      localOffset += local.length;
    });

    var centralSize = centralParts.reduce(function (size, part) { return size + part.length; }, 0);
    var end = new Uint8Array(22);
    var endView = new DataView(end.buffer);
    write32(endView, 0, 0x06054b50);
    write16(endView, 4, 0);
    write16(endView, 6, 0);
    write16(endView, 8, files.length);
    write16(endView, 10, files.length);
    write32(endView, 12, centralSize);
    write32(endView, 16, localOffset);
    write16(endView, 20, 0);

    var total = localOffset + centralSize + end.length;
    var output = new Uint8Array(total);
    var cursor = 0;
    localParts.concat(centralParts, [end]).forEach(function (part) {
      output.set(part, cursor);
      cursor += part.length;
    });
    return output;
  }

  function docx(entries, title) {
    return makeZip([
      { name: '[Content_Types].xml', content: DOCX_CONTENT_TYPES },
      { name: '_rels/.rels', content: DOCX_RELS },
      { name: 'word/document.xml', content: documentXml(entries, title) }
    ]);
  }

  function printHtml(entries, title) {
    var htmlEntries = normalizeEntries(entries).map(function (entry) {
      return '<article><time>' + xmlEscape(formatDate(entry.normalizedDate)) + '</time>' +
        '<strong>' + xmlEscape(entry.category || '') + '</strong>' +
        '<p>' + xmlEscape(entry.paragraphText || '') + '</p>' +
        '<small>' + xmlEscape((entry.fileName || '') + ' · ' + (entry.sourceLocation || '')) + '</small></article>';
    }).join('');
    return '<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>' + xmlEscape(title || 'ציר זמן משפטי') +
      '</title><style>body{font-family:Arial,sans-serif;color:#172b43;max-width:900px;margin:40px auto;line-height:1.7}h1{font-size:25px;border-bottom:2px solid #172b43;padding-bottom:12px}article{padding:14px 0;border-bottom:1px solid #ccd4dc;break-inside:avoid}time{font-weight:bold;margin-left:18px}strong{color:#365a84}p{margin:7px 0}small{color:#65758a}@page{margin:18mm}</style><h1>' +
      xmlEscape(title || 'ציר זמן משפטי') + '</h1>' + htmlEntries + '</html>';
  }

  global.TimelineExporter = Object.freeze({
    markdown: markdown,
    docx: docx,
    printHtml: printHtml
  });
})(globalThis);
