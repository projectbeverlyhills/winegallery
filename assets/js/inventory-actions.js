(function () {
  function createInventoryActions(deps) {
    const getState = deps.getState;
    const byId = deps.byId;
    const strings = deps.strings;
    const parseNumber = deps.parseNumber;
    const setError = deps.setError;
    const getDay = deps.getDay;
    const rowsForDay = deps.rowsForDay;
    const nextSequence = deps.nextSequence;
    const sortEntries = deps.sortEntries;
    const writeStorage = deps.writeStorage;
    const enqueueSyncOperation = deps.enqueueSyncOperation;
    const rowsInRange = deps.rowsInRange;
    const formatUsDate = deps.formatUsDate;
    const normalizeDateValue = deps.normalizeDateValue;

    function state() {
      return getState();
    }

    function collectRowValues(tr) {
      return {
        date: normalizeDateValue(tr.querySelector('[data-field="date"]').value),
        product: String(tr.querySelector('[data-field="product"]').value || '').trim(),
        quantity: String(tr.querySelector('[data-field="quantity"]').value || '').trim(),
        unit: String(tr.querySelector('[data-field="unit"]').value || '').trim(),
        reason: String(tr.querySelector('[data-field="reason"]').value || '').trim(),
        staff: String(tr.querySelector('[data-field="staff"]').value || '').trim(),
      };
    }

    function validateRow(values) {
      const qty = parseNumber(values.quantity);
      if (!values.date || !values.product || !values.quantity || !values.unit || !values.reason || !values.staff) {
        return { ok: false, message: strings().errFillRequired };
      }
      if (qty === null || qty < 0) {
        return { ok: false, message: strings().errQty };
      }
      return { ok: true, quantity: qty };
    }

    function persistRow(baseRow, values, options = {}) {
      const appState = state();
      const check = validateRow(values);
      if (!check.ok) {
        setError(check.message);
        return false;
      }

      const shiftSurname = String(byId('inventoryShiftSurname')?.value || '').trim();
      if (!shiftSurname) {
        setError(strings().errShiftSurname);
        return false;
      }

      const day = getDay(values.date);
      if (!day.shiftSurname) day.shiftSurname = shiftSurname;
      if (day.confirmedBy && day.confirmedAt) {
        setError(strings().errDayLocked);
        return false;
      }

      for (const dayData of Object.values(appState.inventory.byDate || {})) {
        dayData.entries = (dayData.entries || []).filter(x => x.id !== baseRow.id);
      }

      const now = new Date().toISOString();
      const targetRows = day.entries || [];
      const index = targetRows.findIndex(x => x.id === baseRow.id);
      const saved = {
        id: baseRow.id,
        seq: baseRow.seq || nextSequence(values.date),
        date: values.date,
        product: values.product,
        quantity: check.quantity,
        unit: values.unit,
        reason: values.reason,
        staff: values.staff,
        createdAt: baseRow.createdAt || now,
        updatedAt: now
      };

      if (index >= 0) targetRows[index] = saved;
      else targetRows.push(saved);

      day.entries = sortEntries(targetRows);
      writeStorage();
      if (typeof enqueueSyncOperation === 'function') {
        enqueueSyncOperation({
          type: 'row_upsert',
          payload: { date: values.date, id: baseRow.id }
        });
      }
      if (typeof options.onPersisted === 'function') options.onPersisted();
      setError('');
      return true;
    }

    function exportXlsx() {
      const appState = state();
      const L = strings();
      const rows = rowsInRange(appState.inventory.rangeFrom, appState.inventory.rangeTo);
      if (!rows.length) {
        setError(L.errNoExportRows);
        return false;
      }
      if (!window.XLSX) {
        setError(L.errNoXlsx);
        return false;
      }

      const payload = rows.map(r => ({
        [L.xlsxDate]: formatUsDate(r.date),
        [L.xlsxRecord]: r.seq,
        [L.xlsxProduct]: r.product,
        [L.xlsxQuantity]: r.quantity,
        [L.xlsxUnit]: r.unit,
        [L.xlsxReason]: r.reason,
        [L.xlsxStaff]: r.staff,
        [L.xlsxConfirmedBy]: r.confirmedBy || ''
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(payload);
      XLSX.utils.book_append_sheet(workbook, worksheet, L.exportSheet);

      const from = normalizeDateValue(appState.inventory.rangeFrom || appState.inventory.selectedDate);
      const to = normalizeDateValue(appState.inventory.rangeTo || appState.inventory.selectedDate);
      XLSX.writeFile(workbook, `pastry_inventory_${from}_${to}.xlsx`);
      setError('');
      return true;
    }

    function confirmDay() {
      const appState = state();
      const L = strings();
      const surname = String(byId('inventoryConfirmSurname')?.value || '').trim();
      const day = getDay(appState.inventory.selectedDate);

      if (!surname) {
        setError(L.errConfirmSurname);
        return false;
      }
      if (!day.entries.length) {
        setError(L.errConfirmNoRows);
        return false;
      }

      day.confirmedBy = surname;
      day.confirmedAt = new Date().toISOString();
      if (!day.shiftSurname) day.shiftSurname = surname;

      writeStorage();
      if (typeof enqueueSyncOperation === 'function') {
        enqueueSyncOperation({
          type: 'day_confirm',
          payload: { date: appState.inventory.selectedDate, confirmedBy: surname }
        });
      }
      setError('');
      return true;
    }

    function deleteRow(rowDate, rowId) {
      if (!rowId) return false;
      const day = getDay(rowDate);
      day.entries = (day.entries || []).filter(x => x.id !== rowId);
      writeStorage();
      if (typeof enqueueSyncOperation === 'function') {
        enqueueSyncOperation({
          type: 'row_delete',
          payload: { date: rowDate, id: rowId }
        });
      }
      setError('');
      return true;
    }

    return {
      collectRowValues,
      persistRow,
      exportXlsx,
      confirmDay,
      deleteRow
    };
  }

  window.createInventoryActions = createInventoryActions;
})();
