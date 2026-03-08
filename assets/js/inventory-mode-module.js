(function () {
  function createInventoryModeModule(deps) {
    const getState = deps.getState;
    const byId = deps.byId;
    const loadCSV = deps.loadCSV;
    const csvToObjects = deps.csvToObjects;
    const setStatus = deps.setStatus;
    const t = deps.t;
    const constants = deps.constants || {};

    const STORAGE_PREFIX = constants.storagePrefix || 'wg_inventory_pastry_';
    const UNITS = Array.isArray(constants.units) ? constants.units : ['g', 'kg', 'pcs', 'portions'];
    const REASONS = Array.isArray(constants.reasons) ? constants.reasons : ['Human error', 'Guest return', 'Damaged', 'Expired', 'Other'];

    let mounted = false;

    const state = () => getState();

    function todayIsoDate() {
      return new Date().toISOString().slice(0, 10);
    }

    function normalizeDateValue(value) {
      const raw = String(value || '').trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayIsoDate();
    }

    function formatUsDate(isoDate) {
      const [y, m, d] = normalizeDateValue(isoDate).split('-');
      return `${m}/${d}/${y}`;
    }

    function parseNumber(value) {
      const parsed = Number(String(value || '').replace(',', '.').trim());
      return isFinite(parsed) ? parsed : null;
    }

    const i18n = typeof window.createInventoryI18n === 'function'
      ? window.createInventoryI18n({ getStrings: deps.getStrings })
      : {
          strings: () => (typeof deps.getStrings === 'function' ? (deps.getStrings() || {}) : {}),
          formatLabel: (template, values) => String(template || '').replace(/\{(\w+)\}/g, (_, key) => values?.[key] ?? '')
        };

    const strings = () => i18n.strings();
    const formatLabel = (template, values) => i18n.formatLabel(template, values);

    const inventoryFeature = state()?.config?.features?.inventory || {};
    const dataProviderMode = inventoryFeature?.dataProvider?.mode || inventoryFeature?.providerMode || 'local';
    const dataNamespace = inventoryFeature?.apiNamespace || 'pastry';

    const dataProvider = typeof window.createInventoryDataProvider === 'function'
      ? window.createInventoryDataProvider({
          getState,
          storagePrefix: STORAGE_PREFIX,
          mode: dataProviderMode,
          namespace: dataNamespace,
          sendOperation: deps.sendInventoryOperation
        })
      : null;

    const storage = typeof window.createInventoryStorage === 'function'
      ? window.createInventoryStorage({
          getState,
          storagePrefix: STORAGE_PREFIX,
          normalizeDateValue,
          provider: dataProvider
        })
      : null;

    const sortEntries = (entries) => storage ? storage.sortEntries(entries) : (entries || []).slice().sort((a, b) => Number(a.seq || 0) - Number(b.seq || 0));
    const getDay = (dateKey) => storage ? storage.getDay(dateKey) : ({ shiftSurname: '', entries: [], confirmedBy: '', confirmedAt: '' });
    const rowsForDay = (dateKey) => storage ? storage.rowsForDay(dateKey) : sortEntries(getDay(dateKey).entries || []);
    const readStorage = () => storage ? storage.readStorage() : {};
    const writeStorage = () => storage ? storage.writeStorage() : null;
    const nextSequence = (dateKey) => storage ? storage.nextSequence(dateKey) : 1;
    const rowsInRange = (from, to) => storage ? storage.rowsInRange(from, to) : [];
    const isDayConfirmed = (dateKey) => storage ? storage.isDayConfirmed(dateKey) : false;
    const enqueueSyncOperation = (op) => storage?.enqueueSyncOperation ? storage.enqueueSyncOperation(op) : null;
    const drainSyncQueue = () => storage?.drainSyncQueue ? storage.drainSyncQueue() : Promise.resolve({ processed: 0, pending: 0, mode: 'local' });

    let render = null;
    const setError = (text) => {
      if (render?.setError) {
        render.setError(text);
        return;
      }
      const node = byId('inventoryError');
      if (node) node.textContent = text || '';
    };

    const actions = typeof window.createInventoryActions === 'function'
      ? window.createInventoryActions({
          getState,
          byId,
          strings,
          parseNumber,
          setError,
          getDay,
          rowsForDay,
          nextSequence,
          sortEntries,
          writeStorage,
          enqueueSyncOperation,
          rowsInRange,
          formatUsDate,
          normalizeDateValue
        })
      : null;

    function rowModel(raw = {}) {
      const appState = state();
      return {
        id: raw.id || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        seq: raw.seq || null,
        date: normalizeDateValue(raw.date || appState.inventory.selectedDate),
        product: String(raw.product || ''),
        quantity: raw.quantity ?? '',
        unit: String(raw.unit || UNITS[0]),
        reason: String(raw.reason || ''),
        staff: String(raw.staff || ''),
        createdAt: raw.createdAt || '',
        updatedAt: raw.updatedAt || '',
        isDraft: !!raw.isDraft,
        isEditing: !!raw.isEditing,
      };
    }

    function collectRowValues(tr) {
      if (actions?.collectRowValues) return actions.collectRowValues(tr);
      return {
        date: normalizeDateValue(tr.querySelector('[data-field="date"]').value),
        product: String(tr.querySelector('[data-field="product"]').value || '').trim(),
        quantity: String(tr.querySelector('[data-field="quantity"]').value || '').trim(),
        unit: String(tr.querySelector('[data-field="unit"]').value || '').trim(),
        reason: String(tr.querySelector('[data-field="reason"]').value || '').trim(),
        staff: String(tr.querySelector('[data-field="staff"]').value || '').trim(),
      };
    }

    function persistRow(baseRow, values) {
      if (!actions?.persistRow) return false;
      return actions.persistRow(baseRow, values, {
        onPersisted: () => {
          if (render?.renderProductDatalist) render.renderProductDatalist();
        }
      });
    }

    function exportXlsx() {
      if (!actions?.exportXlsx) return false;
      return actions.exportXlsx();
    }

    function confirmDay() {
      if (!actions?.confirmDay) return false;
      return actions.confirmDay();
    }

    function deleteRow(rowDate, rowId) {
      if (!actions?.deleteRow) return false;
      return actions.deleteRow(rowDate, rowId);
    }

    render = typeof window.createInventoryRender === 'function'
      ? window.createInventoryRender({
          getState,
          byId,
          strings,
          formatLabel,
          formatUsDate,
          reasons: REASONS,
          units: UNITS,
          getDay,
          rowsForDay,
          rowsInRange,
          isDayConfirmed,
          normalizeDateValue,
          writeStorage,
          rowModel,
          collectRowValues,
          persistRow,
          exportXlsx,
          confirmDay,
          deleteRow
        })
      : null;

    async function loadPastryProducts() {
      const appState = state();
      const pastryMenu = (appState.menus || []).find(m => String(m?.key || '').toLowerCase() === 'pastry');
      if (!pastryMenu) {
        appState.inventory.pastryProducts = [];
        return;
      }

      const csvUrl = pastryMenu?.csvUrl?.[appState.lang] || pastryMenu?.csvUrl?.en;
      if (!csvUrl) {
        appState.inventory.pastryProducts = [];
        return;
      }

      try {
        const csvText = await loadCSV(csvUrl);
        const rows = csvToObjects(csvText);
        const products = new Set();
        for (const row of rows) {
          const value = row.name || row.title || row.product || row.item || row.dish || '';
          const product = String(value || '').trim();
          if (product) products.add(product);
        }
        appState.inventory.pastryProducts = Array.from(products);
      } catch (error) {
        console.warn('[Inventory] Pastry products load failed:', error);
        appState.inventory.pastryProducts = [];
      }
    }

    async function mount() {
      const appState = state();
      mounted = true;

      if (render?.ensureMarkup) render.ensureMarkup();

      appState.inventory.byDate = readStorage();
      try {
        await drainSyncQueue();
      } catch (error) {
        console.warn('[Inventory] sync queue drain failed:', error);
      }
      if (!appState.inventory.selectedDate) appState.inventory.selectedDate = todayIsoDate();
      if (!appState.inventory.rangeFrom) appState.inventory.rangeFrom = appState.inventory.selectedDate;
      if (!appState.inventory.rangeTo) appState.inventory.rangeTo = appState.inventory.selectedDate;
      appState.inventory.draftRows = [];

      await loadPastryProducts();
      if (render?.renderReasonDatalist) render.renderReasonDatalist();
      if (render?.renderProductDatalist) render.renderProductDatalist();
      if (render?.ensureDateControls) render.ensureDateControls(todayIsoDate);

      const day = getDay(appState.inventory.selectedDate);
      byId('inventoryShiftSurname').value = day.shiftSurname || '';
      byId('inventoryConfirmSurname').value = day.shiftSurname || '';

      if (render?.bindEvents) render.bindEvents();
      if (render?.renderRows) render.renderRows();
      if (render?.renderRangeRows) render.renderRangeRows();
      if (render?.renderSummary) render.renderSummary();
      if (render?.renderConfirmStatus) render.renderConfirmStatus();
      setError('');
      setStatus(t('ready'), 'good');
    }

    function unmount() {
      mounted = false;
      setError('');
    }

    return {
      mount,
      unmount,
      isMounted: () => mounted
    };
  }

  window.createInventoryModeModule = createInventoryModeModule;
})();
