(function () {
  function createInventoryRender(deps) {
    const getState = deps.getState;
    const byId = deps.byId;
    const strings = deps.strings;
    const formatLabel = deps.formatLabel;
    const formatUsDate = deps.formatUsDate;
    const reasons = deps.reasons || [];
    const units = deps.units || [];
    const getDay = deps.getDay;
    const rowsForDay = deps.rowsForDay;
    const rowsInRange = deps.rowsInRange;
    const isDayConfirmed = deps.isDayConfirmed;
    const normalizeDateValue = deps.normalizeDateValue;
    const writeStorage = deps.writeStorage;
    const rowModel = deps.rowModel;
    const collectRowValues = deps.collectRowValues;
    const persistRow = deps.persistRow;
    const exportXlsx = deps.exportXlsx;
    const confirmDay = deps.confirmDay;
    const deleteRow = deps.deleteRow;

    let eventsBound = false;

    function state() {
      return getState();
    }

    function setError(text) {
      const node = byId('inventoryError');
      if (node) node.textContent = text || '';
    }

    function ensureMarkup() {
      if (byId('inventoryView')) return;
      const appWrap = byId('appWrap');
      if (!appWrap) throw new Error('Inventory mount failed: app container not found');
      const L = strings();

      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <div class="inventoryView hidden" id="inventoryView">
          <div class="inventoryTop">
            <div class="inventoryTitle">${L.title}</div>
            <div class="inventoryControls">
              <label for="inventoryDate">${L.date}</label>
              <input id="inventoryDate" type="date" />
              <button id="inventoryAddRowBtn" class="btn" type="button">${L.addRow}</button>
              <button id="inventoryExportBtn" class="btn" type="button">${L.downloadXlsx}</button>
            </div>
          </div>

          <div class="inventoryMeta">
            <label for="inventoryShiftSurname">${L.shiftSurname}</label>
            <input id="inventoryShiftSurname" type="text" placeholder="${L.surnamePlaceholder}" />
            <span class="inventoryHint">${L.enterToSave}</span>
          </div>

          <div class="inventorySummary" id="inventorySummary"></div>
          <div class="inventoryError" id="inventoryError"></div>

          <div class="inventoryTableWrap">
            <table class="inventoryTable">
              <thead>
                <tr>
                  <th>${L.rowNumber}</th>
                  <th>${L.date}</th>
                  <th>${L.product}</th>
                  <th>${L.quantity}</th>
                  <th>${L.unit}</th>
                  <th>${L.reason}</th>
                  <th>${L.staff}</th>
                  <th>${L.actions}</th>
                </tr>
              </thead>
              <tbody id="inventoryRows"></tbody>
            </table>
          </div>

          <div class="inventoryConfirm">
            <div class="inventoryControls">
              <label for="inventoryConfirmSurname">${L.confirmSurname}</label>
              <input id="inventoryConfirmSurname" type="text" placeholder="${L.surnamePlaceholder}" />
              <button id="inventoryConfirmBtn" class="btn" type="button">${L.confirmDay}</button>
              <span id="inventoryConfirmStatus" class="inventoryHint"></span>
            </div>
          </div>

          <div class="inventoryRange">
            <div class="inventoryRangeHead">
              <strong>${L.history}</strong>
              <div class="inventoryControls">
                <label for="inventoryRangeFrom">${L.from}</label>
                <input id="inventoryRangeFrom" type="date" />
                <label for="inventoryRangeTo">${L.to}</label>
                <input id="inventoryRangeTo" type="date" />
              </div>
            </div>
            <div class="inventoryRangeTableWrap">
              <table class="inventoryRangeTable">
                <thead>
                  <tr>
                    <th>${L.date}</th>
                    <th>${L.rowNumber}</th>
                    <th>${L.product}</th>
                    <th>${L.quantity}</th>
                    <th>${L.unit}</th>
                    <th>${L.reason}</th>
                    <th>${L.staff}</th>
                    <th>${L.confirmedByHeader}</th>
                  </tr>
                </thead>
                <tbody id="inventoryRangeRows"></tbody>
              </table>
            </div>
          </div>

          <datalist id="inventoryProductList"></datalist>
          <datalist id="inventoryReasonList"></datalist>
        </div>
      `;

      appWrap.appendChild(wrapper.firstElementChild);
    }

    function ensureDateControls(todayIsoDate) {
      const appState = state();
      if (!appState.inventory.selectedDate) appState.inventory.selectedDate = todayIsoDate();
      if (!appState.inventory.rangeFrom) appState.inventory.rangeFrom = appState.inventory.selectedDate;
      if (!appState.inventory.rangeTo) appState.inventory.rangeTo = appState.inventory.selectedDate;

      byId('inventoryDate').value = appState.inventory.selectedDate;
      byId('inventoryRangeFrom').value = appState.inventory.rangeFrom;
      byId('inventoryRangeTo').value = appState.inventory.rangeTo;
    }

    function renderSummary() {
      const summary = byId('inventorySummary');
      if (!summary) return;
      const L = strings();

      const appState = state();
      const day = getDay(appState.inventory.selectedDate);
      const entries = rowsForDay(appState.inventory.selectedDate);

      const byUnit = new Map();
      const byProduct = new Map();
      for (const row of entries) {
        const qty = Number(row.quantity) || 0;
        const unit = String(row.unit || '').trim();
        const product = String(row.product || '').trim();
        if (unit) byUnit.set(unit, (byUnit.get(unit) || 0) + qty);
        if (product) byProduct.set(product, (byProduct.get(product) || 0) + qty);
      }

      const unitText = Array.from(byUnit.entries()).map(([u, q]) => `${q} ${u}`).join(' · ') || '—';
      const productText = Array.from(byProduct.entries()).slice(0, 3).map(([p, q]) => `${p}: ${q}`).join(' · ') || '—';

      summary.innerHTML = '';
      const parts = [
        `${L.date}: ${formatUsDate(appState.inventory.selectedDate)}`,
        `${L.entries}: ${entries.length}`,
        `${L.totalsByUnit}: ${unitText}`,
        `${L.topProducts}: ${productText}`,
        day.confirmedBy ? `${L.confirmedBy}: ${day.confirmedBy}` : L.notConfirmed
      ];

      for (const part of parts) {
        const item = document.createElement('span');
        item.textContent = part;
        summary.appendChild(item);
      }
    }

    function renderConfirmStatus() {
      const appState = state();
      const day = getDay(appState.inventory.selectedDate);
      const L = strings();
      const status = byId('inventoryConfirmStatus');
      const addRowBtn = byId('inventoryAddRowBtn');
      const confirmBtn = byId('inventoryConfirmBtn');

      if (status) {
        if (day.confirmedBy && day.confirmedAt) {
          status.textContent = formatLabel(L.confirmedByAt, { name: day.confirmedBy, time: new Date(day.confirmedAt).toLocaleString() });
          status.className = 'inventoryLocked';
        } else {
          status.textContent = L.dayNotConfirmed;
          status.className = 'inventoryHint';
        }
      }

      if (addRowBtn) addRowBtn.disabled = isDayConfirmed(appState.inventory.selectedDate);
      if (confirmBtn) confirmBtn.disabled = isDayConfirmed(appState.inventory.selectedDate);
    }

    function renderReasonDatalist() {
      const list = byId('inventoryReasonList');
      if (!list) return;
      list.innerHTML = '';
      for (const reason of reasons) {
        const option = document.createElement('option');
        option.value = reason;
        list.appendChild(option);
      }
    }

    function renderProductDatalist() {
      const appState = state();
      const list = byId('inventoryProductList');
      if (!list) return;
      list.innerHTML = '';

      const names = new Set();
      for (const product of appState.inventory.pastryProducts || []) {
        const name = String(product || '').trim();
        if (name) names.add(name);
      }
      for (const day of Object.values(appState.inventory.byDate || {})) {
        for (const row of day.entries || []) {
          const name = String(row.product || '').trim();
          if (name) names.add(name);
        }
      }

      for (const name of names) {
        const option = document.createElement('option');
        option.value = name;
        list.appendChild(option);
      }
    }

    function createCellInput(type, value, field, locked, datalistId) {
      const input = document.createElement('input');
      input.type = type;
      input.value = value ?? '';
      input.setAttribute('data-field', field);
      if (datalistId) input.setAttribute('list', datalistId);
      input.disabled = !!locked;
      return input;
    }

    function createUnitSelect(value, locked) {
      const select = document.createElement('select');
      select.setAttribute('data-field', 'unit');
      select.disabled = !!locked;
      for (const unit of units) {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        if (String(value || '').toLowerCase() === unit.toLowerCase()) option.selected = true;
        select.appendChild(option);
      }
      return select;
    }

    function createReasonInput(value, locked) {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('data-field', 'reason');
      input.setAttribute('list', 'inventoryReasonList');
      input.value = value || '';
      input.placeholder = strings().reason;
      input.disabled = !!locked;
      return input;
    }

    function renderRangeRows() {
      const appState = state();
      const tbody = byId('inventoryRangeRows');
      if (!tbody) return;
      const rows = rowsInRange(appState.inventory.rangeFrom, appState.inventory.rangeTo);
      tbody.innerHTML = '';

      if (!rows.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 8;
        td.textContent = strings().noRangeRows;
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }

      for (const row of rows) {
        const tr = document.createElement('tr');
        const cells = [formatUsDate(row.date), row.seq, row.product, String(row.quantity), row.unit, row.reason, row.staff, row.confirmedBy || '—'];
        for (const cell of cells) {
          const td = document.createElement('td');
          td.textContent = String(cell ?? '');
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
    }

    function renderRows() {
      const appState = state();
      const tbody = byId('inventoryRows');
      if (!tbody) return;

      const selectedDate = appState.inventory.selectedDate;
      const day = getDay(selectedDate);
      const lockedDay = !!(day.confirmedBy && day.confirmedAt);
      const saved = rowsForDay(selectedDate);
      const rowMap = new Map();

      for (const row of saved) rowMap.set(row.id, rowModel(row));
      for (const row of appState.inventory.draftRows) rowMap.set(row.id, rowModel(row));

      const rows = Array.from(rowMap.values()).sort((a, b) => Number(a.seq || 999999) - Number(b.seq || 999999));
      tbody.innerHTML = '';

      if (!rows.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 8;
        td.textContent = strings().noRowsYet;
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }

      for (const row of rows) {
        const isSaved = !row.isDraft;
        const locked = lockedDay || (isSaved && !row.isEditing);
        const tr = document.createElement('tr');
        tr.dataset.rowId = row.id;

        const seqTd = document.createElement('td');
        seqTd.textContent = row.seq ? String(row.seq) : '—';

        const dateTd = document.createElement('td');
        dateTd.appendChild(createCellInput('date', row.date, 'date', locked));

        const productTd = document.createElement('td');
        productTd.appendChild(createCellInput('text', row.product, 'product', locked, 'inventoryProductList'));

        const qtyTd = document.createElement('td');
        const qtyInput = createCellInput('number', row.quantity, 'quantity', locked);
        qtyInput.step = '0.01';
        qtyInput.min = '0';
        qtyTd.appendChild(qtyInput);

        const unitTd = document.createElement('td');
        unitTd.appendChild(createUnitSelect(row.unit, locked));

        const reasonTd = document.createElement('td');
        reasonTd.appendChild(createReasonInput(row.reason, locked));

        const staffTd = document.createElement('td');
        staffTd.appendChild(createCellInput('text', row.staff || day.shiftSurname || '', 'staff', locked));

        const actionsTd = document.createElement('td');
        const actionsWrap = document.createElement('div');
        actionsWrap.className = 'inventoryActions';

        const save = () => {
          const values = collectRowValues(tr);
          const ok = persistRow({ ...row, ...values }, values);
          if (!ok) return;
          if (row.isDraft || row.isEditing) {
            appState.inventory.draftRows = appState.inventory.draftRows.filter(x => x.id !== row.id);
          }
          renderRows();
          renderRangeRows();
          renderSummary();
          renderConfirmStatus();
        };

        tr.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          save();
        });

        if (row.isDraft) {
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'inventoryMiniBtn';
          removeBtn.textContent = strings().remove;
          removeBtn.disabled = lockedDay;
          removeBtn.onclick = () => {
            appState.inventory.draftRows = appState.inventory.draftRows.filter(x => x.id !== row.id);
            renderRows();
          };
          actionsWrap.appendChild(removeBtn);
        } else if (row.isEditing) {
          const saveBtn = document.createElement('button');
          saveBtn.type = 'button';
          saveBtn.className = 'inventoryMiniBtn';
          saveBtn.textContent = strings().save;
          saveBtn.disabled = lockedDay;
          saveBtn.onclick = save;

          const cancelBtn = document.createElement('button');
          cancelBtn.type = 'button';
          cancelBtn.className = 'inventoryMiniBtn';
          cancelBtn.textContent = strings().cancel;
          cancelBtn.disabled = lockedDay;
          cancelBtn.onclick = () => {
            appState.inventory.draftRows = appState.inventory.draftRows.filter(x => x.id !== row.id);
            renderRows();
          };

          actionsWrap.appendChild(saveBtn);
          actionsWrap.appendChild(cancelBtn);
        } else {
          const editBtn = document.createElement('button');
          editBtn.type = 'button';
          editBtn.className = 'inventoryMiniBtn';
          editBtn.textContent = strings().edit;
          editBtn.disabled = lockedDay;
          editBtn.onclick = () => {
            appState.inventory.draftRows = appState.inventory.draftRows.filter(x => x.id !== row.id);
            appState.inventory.draftRows.push({ ...row, isDraft: false, isEditing: true });
            renderRows();
          };

          const deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'inventoryMiniBtn';
          deleteBtn.textContent = strings().del;
          deleteBtn.disabled = lockedDay;
          deleteBtn.onclick = () => {
            if (typeof deleteRow === 'function') {
              deleteRow(row.date, row.id);
            } else {
              const currentDay = getDay(row.date);
              currentDay.entries = (currentDay.entries || []).filter(x => x.id !== row.id);
              writeStorage();
            }
            renderRows();
            renderRangeRows();
            renderSummary();
          };

          actionsWrap.appendChild(editBtn);
          actionsWrap.appendChild(deleteBtn);
        }

        actionsTd.appendChild(actionsWrap);
        tr.appendChild(seqTd);
        tr.appendChild(dateTd);
        tr.appendChild(productTd);
        tr.appendChild(qtyTd);
        tr.appendChild(unitTd);
        tr.appendChild(reasonTd);
        tr.appendChild(staffTd);
        tr.appendChild(actionsTd);
        tbody.appendChild(tr);
      }
    }

    function bindEvents() {
      if (eventsBound) return;

      const dateInput = byId('inventoryDate');
      const addBtn = byId('inventoryAddRowBtn');
      const exportBtn = byId('inventoryExportBtn');
      const shiftInput = byId('inventoryShiftSurname');
      const confirmBtn = byId('inventoryConfirmBtn');
      const fromInput = byId('inventoryRangeFrom');
      const toInput = byId('inventoryRangeTo');

      if (!dateInput || !addBtn || !exportBtn || !shiftInput || !confirmBtn || !fromInput || !toInput) {
        return;
      }

      dateInput.addEventListener('change', () => {
        const appState = state();
        appState.inventory.selectedDate = normalizeDateValue(dateInput.value);
        appState.inventory.draftRows = [];

        const day = getDay(appState.inventory.selectedDate);
        shiftInput.value = day.shiftSurname || '';
        byId('inventoryConfirmSurname').value = day.shiftSurname || '';

        renderRows();
        renderRangeRows();
        renderSummary();
        renderConfirmStatus();
        setError('');
      });

      addBtn.addEventListener('click', () => {
        const appState = state();
        if (isDayConfirmed(appState.inventory.selectedDate)) return;

        appState.inventory.draftRows.push(rowModel({
          isDraft: true,
          date: appState.inventory.selectedDate,
          staff: getDay(appState.inventory.selectedDate).shiftSurname || ''
        }));
        renderRows();
      });

      exportBtn.addEventListener('click', exportXlsx);
      confirmBtn.addEventListener('click', () => {
        const ok = confirmDay();
        if (!ok) return;
        renderRows();
        renderRangeRows();
        renderSummary();
        renderConfirmStatus();
      });

      shiftInput.addEventListener('change', () => {
        const day = getDay(state().inventory.selectedDate);
        day.shiftSurname = String(shiftInput.value || '').trim();
        writeStorage();
        renderSummary();
        setError('');
      });

      fromInput.addEventListener('change', () => {
        state().inventory.rangeFrom = normalizeDateValue(fromInput.value);
        renderRangeRows();
      });

      toInput.addEventListener('change', () => {
        state().inventory.rangeTo = normalizeDateValue(toInput.value);
        renderRangeRows();
      });

      eventsBound = true;
    }

    return {
      setError,
      ensureMarkup,
      ensureDateControls,
      renderSummary,
      renderConfirmStatus,
      renderReasonDatalist,
      renderProductDatalist,
      renderRangeRows,
      renderRows,
      bindEvents
    };
  }

  window.createInventoryRender = createInventoryRender;
})();
