(function (global) {
  'use strict';

  var BLOCK_TYPES = Object.freeze({
    paragraph: true,
    heading: true,
    list: true,
    definitionTerm: true,
    definitionDescription: true
  });

  function cleanText(value) {
    return String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, ' ')
      .trim();
  }

  function makeBlock(blocks, text, kind, location) {
    var cleaned = cleanText(text);
    if (!cleaned) return null;
    var block = {
      index: blocks.length + 1,
      kind: kind,
      text: cleaned,
      location: location || null
    };
    blocks.push(block);
    return block;
  }

  function annotationType(node, fallback) {
    var metadata = node && node.metadata ? node.metadata : {};
    if (fallback === 'comment') return 'comment';
    if (metadata.noteType === 'footnote') return 'footnote';
    if (metadata.noteType === 'endnote') return 'endnote';
    return fallback || 'note';
  }

  function annotationId(node, type) {
    var metadata = node && node.metadata ? node.metadata : {};
    if (type === 'comment') return metadata.commentId || metadata.id || null;
    return metadata.noteId || metadata.id || null;
  }

  function collectDocxBlocks(ast) {
    var blocks = [];
    var tableCounter = 0;
    var bodyParagraphCounter = 0;
    var seenAnnotations = new WeakSet();

    function annotationContext(baseContext, node, type, parentBlockIndex) {
      var context = Object.assign({}, baseContext || {});
      context.annotationType = type;
      context.annotationId = annotationId(node, type);
      context.parentBlockIndex = parentBlockIndex || null;
      return context;
    }

    function visitAnnotation(annotation, fallbackType, baseContext, parentBlockIndex) {
      if (!annotation || typeof annotation !== 'object') return;
      if (seenAnnotations.has(annotation)) return;
      seenAnnotations.add(annotation);

      var type = annotationType(annotation, fallbackType);
      var context = annotationContext(baseContext, annotation, type, parentBlockIndex);
      var children = Array.isArray(annotation.children) ? annotation.children : [];
      var before = blocks.length;

      var annotationParagraph = 0;
      children.forEach(function (child) {
        var childContext = context;
        if (BLOCK_TYPES[child && child.type]) {
          annotationParagraph += 1;
          childContext = Object.assign({}, context, { annotationParagraph: annotationParagraph });
        }
        visit(child, childContext);
      });

      if (blocks.length === before) {
        makeBlock(blocks, annotation.text, type, context);
      }
    }

    function collectAttachedAnnotations(node, context, parentBlockIndex) {
      if (!node || typeof node !== 'object') return;

      (Array.isArray(node.notes) ? node.notes : []).forEach(function (note) {
        visitAnnotation(note, 'note', context, parentBlockIndex);
      });
      (Array.isArray(node.comments) ? node.comments : []).forEach(function (comment) {
        visitAnnotation(comment, 'comment', context, parentBlockIndex);
      });

      (Array.isArray(node.children) ? node.children : []).forEach(function (child) {
        collectAttachedAnnotations(child, context, parentBlockIndex);
      });
    }

    function visit(node, context) {
      if (!node || typeof node !== 'object') return;
      var type = node.type || '';
      var children = Array.isArray(node.children) ? node.children : [];

      if (type === 'table') {
        var tableNumber = ++tableCounter;
        children.forEach(function (child, index) {
          visit(child, Object.assign({}, context, {
            table: tableNumber,
            row: index + 1
          }));
        });
        return;
      }

      if (type === 'row') {
        children.forEach(function (child, index) {
          visit(child, Object.assign({}, context, {
            row: Number(node.metadata && node.metadata.row) + 1 || context.row || 1,
            cell: index + 1
          }));
        });
        return;
      }

      if (type === 'cell') {
        var cellContext = Object.assign({}, context, {
          row: Number(node.metadata && node.metadata.row) + 1 || context.row || 1,
          cell: Number(node.metadata && node.metadata.col) + 1 || context.cell || 1
        });

        if (!children.length && node.text) {
          var cellBlock = makeBlock(blocks, node.text, 'table-cell', cellContext);
          collectAttachedAnnotations(node, cellContext, cellBlock && cellBlock.index);
          return;
        }

        var cellParagraph = 0;
        children.forEach(function (child) {
          var childContext = cellContext;
          if (BLOCK_TYPES[child && child.type]) {
            cellParagraph += 1;
            childContext = Object.assign({}, cellContext, { cellParagraph: cellParagraph });
          }
          visit(child, childContext);
        });
        return;
      }

      if (BLOCK_TYPES[type]) {
        var kind = context.annotationType || (context.table ? 'table-' + type : type);
        var blockLocation = Object.keys(context).length ? Object.assign({}, context) : {};
        if (!context.annotationType && !context.table) {
          bodyParagraphCounter += 1;
          blockLocation.bodyParagraph = bodyParagraphCounter;
        }
        var block = makeBlock(blocks, node.text, kind, Object.keys(blockLocation).length ? blockLocation : null);
        collectAttachedAnnotations(node, blockLocation, block && block.index);
        return;
      }

      children.forEach(function (child) { visit(child, context); });
    }

    (Array.isArray(ast && ast.content) ? ast.content : []).forEach(function (node) {
      visit(node, {});
    });

    return blocks;
  }

  function splitTxtIntoBlocks(text) {
    var normalized = String(text || '').replace(/\r\n?/g, '\n').trim();
    if (!normalized) return [];

    var chunks = normalized.split(/\n[\t ]*\n+/g).map(cleanText).filter(Boolean);

    return chunks.map(function (chunk, index) {
      return {
        index: index + 1,
        kind: 'text-block',
        text: chunk,
        location: null
      };
    });
  }

  async function extractTxt(file) {
    return splitTxtIntoBlocks(await file.text());
  }

  async function extractDocx(file) {
    var parser = await OfficeParserLoader.load();
    var ast = await parser.parseOffice(file, {
      fileType: 'docx',
      extractAttachments: false,
      ocr: false,
      ignoreHeadersAndFooters: true,
      ignoreComments: false,
      ignoreNotes: false,
      includeFormatting: false,
      includeRawContent: false
    });
    return collectDocxBlocks(ast);
  }

  async function extract(fileItem) {
    if (!fileItem || !fileItem.file) throw new Error('קובץ חסר');
    if (fileItem.extension === 'txt') return extractTxt(fileItem.file);
    if (fileItem.extension === 'docx') return extractDocx(fileItem.file);
    throw new Error('סוג קובץ לא נתמך: ' + fileItem.extension);
  }

  global.DocumentExtractor = Object.freeze({
    extract: extract,
    collectDocxBlocks: collectDocxBlocks,
    splitTxtIntoBlocks: splitTxtIntoBlocks
  });
})(globalThis);
