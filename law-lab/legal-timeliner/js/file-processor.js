(function (global) {
  'use strict';

  async function process(item, store, extract) {
    if (item.blocks && item.extractedWith === AppConfig.EXTRACTOR_VERSION && item.status === 'done') {
      return { blocks: item.blocks, reused: true, error: null };
    }

    if (item.status === 'error') store.resetError(item.id);
    store.setProcessing(item.id);

    try {
      var blocks = await extract(item);
      store.setDone(item.id, blocks);
      return { blocks: blocks, reused: false, error: null };
    } catch (error) {
      store.setError(item.id, error);
      return { blocks: null, reused: false, error: error };
    }
  }

  global.CaseFileProcessor = Object.freeze({
    process: process
  });
})(globalThis);
