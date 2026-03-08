(function () {
  function createInventoryDataProvider(options = {}) {
    const getState = options.getState;
    const storagePrefix = options.storagePrefix || 'wg_inventory_pastry_';
    const namespace = options.namespace || 'pastry';
    const mode = options.mode || 'local';
    const maxAttempts = Number(options.maxAttempts || 5);
    const baseBackoffMs = Number(options.baseBackoffMs || 1500);
    const maxBackoffMs = Number(options.maxBackoffMs || 30000);
    const sendOperation = typeof options.sendOperation === 'function' ? options.sendOperation : null;

    function state() {
      return getState();
    }

    function keyBase() {
      return `${storagePrefix}${state().restaurantId || 'default'}`;
    }

    function queueKey() {
      return `${keyBase()}::sync_queue::${namespace}`;
    }

    function readQueue() {
      try {
        const raw = localStorage.getItem(queueKey());
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('[Inventory] read sync queue failed:', error);
        return [];
      }
    }

    function writeQueue(queue) {
      try {
        localStorage.setItem(queueKey(), JSON.stringify(Array.isArray(queue) ? queue : []));
      } catch (error) {
        console.error('[Inventory] write sync queue failed:', error);
      }
    }

    function readByDate() {
      try {
        const raw = localStorage.getItem(keyBase());
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object' && parsed.byDate) ? parsed.byDate : {};
      } catch (error) {
        console.error('[Inventory] read storage failed:', error);
        return {};
      }
    }

    function writeByDate(byDate) {
      try {
        localStorage.setItem(keyBase(), JSON.stringify({ byDate: byDate || {} }));
      } catch (error) {
        console.error('[Inventory] write storage failed:', error);
      }
    }

    function enqueue(op) {
      const queue = readQueue();
      queue.push({
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        namespace,
        attempts: 0,
        nextAttemptAt: Date.now(),
        lastError: '',
        ...op,
      });
      writeQueue(queue);
    }

    function nextBackoffMs(attempts) {
      const exp = Math.max(0, Number(attempts || 0));
      const ms = baseBackoffMs * Math.pow(2, exp);
      return Math.min(ms, maxBackoffMs);
    }

    async function drainQueue() {
      const queue = readQueue();
      if (!queue.length) return { processed: 0, pending: 0, mode };

      if (mode !== 'api') {
        return { processed: 0, pending: queue.length, mode };
      }

      if (!sendOperation) {
        return { processed: 0, pending: queue.length, mode, warning: 'No sendOperation handler configured' };
      }

      const now = Date.now();
      const rest = [];
      let processed = 0;

      for (const op of queue) {
        const attempts = Number(op.attempts || 0);
        const nextAttemptAt = Number(op.nextAttemptAt || 0);

        if (nextAttemptAt > now) {
          rest.push(op);
          continue;
        }

        try {
          await sendOperation(op);
          processed += 1;
        } catch (error) {
          const updatedAttempts = attempts + 1;
          if (updatedAttempts >= maxAttempts) {
            console.warn('[Inventory] sync op dropped after max attempts:', {
              id: op.id,
              type: op.type,
              attempts: updatedAttempts,
            });
            continue;
          }

          const backoff = nextBackoffMs(updatedAttempts - 1);
          rest.push({
            ...op,
            attempts: updatedAttempts,
            lastError: String(error?.message || error || 'Unknown sync error'),
            nextAttemptAt: Date.now() + backoff,
          });
        }
      }

      writeQueue(rest);

      return {
        processed,
        pending: rest.length,
        mode,
      };
    }

    function getSyncState() {
      const queue = readQueue();
      return { mode, pending: queue.length, namespace };
    }

    return {
      mode,
      namespace,
      readByDate,
      writeByDate,
      enqueue,
      drainQueue,
      getSyncState,
    };
  }

  window.createInventoryDataProvider = createInventoryDataProvider;
})();
