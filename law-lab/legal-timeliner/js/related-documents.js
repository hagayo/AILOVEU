(function (global) {
  'use strict';

  function addDate(index, date, fileId) {
    if (!index.has(date)) index.set(date, new Set());
    index.get(date).add(fileId);
  }

  function buildIndex(fileItems, timelineEntries) {
    var files = Array.isArray(fileItems) ? fileItems.slice() : [];
    var byId = new Map();
    var dateToFileIds = new Map();

    files.forEach(function (item, order) {
      byId.set(item.id, { item: item, order: order });
      DateEngine.findDates(item.name).forEach(function (match) {
        addDate(dateToFileIds, match.normalizedDate, item.id);
      });
    });

    (timelineEntries || []).forEach(function (entry) {
      addDate(dateToFileIds, entry.normalizedDate, entry.fileId);
    });

    function forEntry(entry) {
      if (!entry) return [];
      var ids = dateToFileIds.get(entry.normalizedDate) || new Set();
      var result = [];

      if (byId.has(entry.fileId)) {
        result.push({
          file: byId.get(entry.fileId).item,
          isSource: true
        });
      }

      Array.from(ids)
        .filter(function (id) { return id !== entry.fileId && byId.has(id); })
        .sort(function (a, b) { return byId.get(a).order - byId.get(b).order; })
        .forEach(function (id) {
          result.push({
            file: byId.get(id).item,
            isSource: false
          });
        });

      return result;
    }

    return Object.freeze({ forEntry: forEntry });
  }

  global.RelatedDocumentMatcher = Object.freeze({
    buildIndex: buildIndex
  });
})(globalThis);
