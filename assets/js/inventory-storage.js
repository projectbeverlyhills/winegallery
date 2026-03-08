(function () {
  function createInventoryStorage(options = {}) {
    const getState = options.getState;
    const storagePrefix = options.storagePrefix || 'wg_inventory_pastry_';
    const normalizeDateValue = options.normalizeDateValue || ((value) => value);
    const provider = options.provider || null;

    function state() {
      return getState();
    }

    function storageKey() {
      return `${storagePrefix}${state().restaurantId || 'default'}`;
    }

    function sortEntries(entries) {
      return (entries || []).slice().sort((a, b) => Number(a.seq || 0) - Number(b.seq || 0));
    }

    function getDay(dateKey) {
      const appState = state();
      const key = normalizeDateValue(dateKey || appState.inventory.selectedDate);
      if (!appState.inventory.byDate[key]) {
        appState.inventory.byDate[key] = { shiftSurname: '', entries: [], confirmedBy: '', confirmedAt: '' };
      }
      return appState.inventory.byDate[key];
    }

    function rowsForDay(dateKey) {
      return sortEntries(getDay(dateKey).entries);
    }

    function readStorage() {
      if (provider && typeof provider.readByDate === 'function') {
        return provider.readByDate() || {};
      }
      try {
        const raw = localStorage.getItem(storageKey());
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object' && parsed.byDate) ? parsed.byDate : {};
      } catch (error) {
        console.error('[Inventory] read storage failed:', error);
        return {};
      }
    }

    function writeStorage() {
      if (provider && typeof provider.writeByDate === 'function') {
        provider.writeByDate(state().inventory.byDate);
        return;
      }
      try {
        localStorage.setItem(storageKey(), JSON.stringify({ byDate: state().inventory.byDate }));
      } catch (error) {
        console.error('[Inventory] write storage failed:', error);
      }
    }

    function enqueueSyncOperation(op) {
      if (!provider || typeof provider.enqueue !== 'function') return;
      provider.enqueue(op);
    }

    async function drainSyncQueue() {
      if (!provider || typeof provider.drainQueue !== 'function') {
        return { processed: 0, pending: 0, mode: 'local' };
      }
      return provider.drainQueue();
    }

    function getSyncState() {
      if (!provider || typeof provider.getSyncState !== 'function') {
        return { mode: 'local', pending: 0, namespace: 'pastry' };
      }
      return provider.getSyncState();
    }

    function nextSequence(dateKey) {
      const max = rowsForDay(dateKey).reduce((acc, row) => Math.max(acc, Number(row.seq) || 0), 0);
      return max + 1;
    }

    function rowsInRange(from, to) {
      const appState = state();
      const fromKey = normalizeDateValue(from || appState.inventory.selectedDate);
      const toKey = normalizeDateValue(to || appState.inventory.selectedDate);
      const [start, end] = fromKey <= toKey ? [fromKey, toKey] : [toKey, fromKey];
      const rows = [];

      for (const [dateKey, day] of Object.entries(appState.inventory.byDate || {})) {
        if (dateKey < start || dateKey > end) continue;
        for (const row of day.entries || []) {
          rows.push({
            date: dateKey,
            seq: row.seq,
            product: row.product,
            quantity: row.quantity,
            unit: row.unit,
            reason: row.reason,
            staff: row.staff || day.shiftSurname || '',
            confirmedBy: day.confirmedBy || ''
          });
        }
      }

      return rows.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return Number(a.seq || 0) - Number(b.seq || 0);
      });
    }

    function isDayConfirmed(dateKey) {
      const day = getDay(dateKey);
      return !!(day.confirmedBy && day.confirmedAt);
    }

    return {
      sortEntries,
      getDay,
      rowsForDay,
      readStorage,
      writeStorage,
      nextSequence,
      rowsInRange,
      isDayConfirmed,
      enqueueSyncOperation,
      drainSyncQueue,
      getSyncState
    };
  }

  window.createInventoryStorage = createInventoryStorage;
})();
