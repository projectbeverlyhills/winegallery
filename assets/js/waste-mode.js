(function () {
  'use strict';

  function createWasteModeModule(deps) {
    const getState = deps.getState;
    const byId = deps.byId;

    // ─── Storage keys ────────────────────────────────────────────────
    function rId() { return getState().restaurantId || 'default'; }
    function entriesKey()          { return `wg_waste_entries_${rId()}`; }
    function productsKey(dept)     { return `wg_waste_products_${dept}_${rId()}`; }
    function customReasonsKey()    { return `wg_waste_reasons_${rId()}`; }

    // ─── Storage helpers ──────────────────────────────────────────────
    function load(key, fb) {
      try { return JSON.parse(localStorage.getItem(key)) || fb; } catch { return fb; }
    }
    function save(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }

    // ─── UID ──────────────────────────────────────────────────────────
    function uid() {
      return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    // ─── Date helpers ─────────────────────────────────────────────────
    function todayISO() { return new Date().toISOString().slice(0, 10); }

    function fmtDate(iso) {
      const [y, m, d] = iso.split('-');
      const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${mo[+m - 1]} ${+d}, ${y}`;
    }

    function fmtMonth(y, m) {
      const mo = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
      return `${mo[m - 1]} ${y}`;
    }

    function shiftDay(iso, delta) {
      const d = new Date(iso + 'T00:00:00');
      d.setDate(d.getDate() + delta);
      return d.toISOString().slice(0, 10);
    }

    // ─── Data access ──────────────────────────────────────────────────
    const DEFAULT_REASONS = ['Spoilage', 'Overcooked', 'Tasting', 'Breakage', 'Expired'];

    function getEntries()          { return load(entriesKey(), []); }
    function saveEntries(arr)      { save(entriesKey(), arr); }
    function getProducts(dept)     { return load(productsKey(dept), []); }
    function saveProducts(d, arr)  { save(productsKey(d), arr); }
    function getCustomReasons()    { return load(customReasonsKey(), []); }
    function saveCustomReasons(r)  { save(customReasonsKey(), r); }
    function allReasons()          { return [...DEFAULT_REASONS, ...getCustomReasons()]; }

    function addEntry(entry) {
      const list = getEntries();
      list.push(entry);
      saveEntries(list);
      const prods = getProducts(entry.dept);
      if (!prods.includes(entry.product)) {
        prods.push(entry.product);
        prods.sort((a, b) => a.localeCompare(b));
        saveProducts(entry.dept, prods);
      }
    }

    function deleteEntry(id) {
      saveEntries(getEntries().filter(e => e.id !== id));
    }

    function getDayEntries(date, dept) {
      return getEntries().filter(e => e.date === date && e.dept === dept);
    }

    function getMonthEntries(y, m, dept) {
      const pfx = `${y}-${String(m).padStart(2,'0')}`;
      return getEntries().filter(e => e.date.startsWith(pfx) && e.dept === dept);
    }

    function addCustomReason(reason) {
      const r = getCustomReasons();
      if (!r.includes(reason)) { r.push(reason); saveCustomReasons(r); }
    }

    // ─── Month rollup ─────────────────────────────────────────────────
    function buildReport(y, m) {
      const result = {};
      for (const dept of ['kitchen', 'pastry']) {
        const entries = getMonthEntries(y, m, dept);
        const byProduct = {};
        for (const e of entries) {
          if (!byProduct[e.product]) byProduct[e.product] = { totals: {}, byReason: {} };
          byProduct[e.product].totals[e.unit] = (byProduct[e.product].totals[e.unit] || 0) + e.qty;
          if (!byProduct[e.product].byReason[e.reason]) byProduct[e.product].byReason[e.reason] = {};
          byProduct[e.product].byReason[e.reason][e.unit] =
            (byProduct[e.product].byReason[e.reason][e.unit] || 0) + e.qty;
        }
        result[dept] = byProduct;
      }
      return result;
    }

    // ─── Format helpers ───────────────────────────────────────────────
    function fmtQty(qty, unit) {
      return `${qty % 1 === 0 ? qty : parseFloat(qty.toFixed(2))} ${unit}`;
    }
    function fmtTotals(totals) {
      return Object.entries(totals).map(([u, v]) => fmtQty(v, u)).join(', ');
    }

    // ─── CSV Export ───────────────────────────────────────────────────
    function exportCSV(y, m) {
      const pfx = `${y}-${String(m).padStart(2,'0')}`;
      const entries = getEntries()
        .filter(e => e.date.startsWith(pfx))
        .sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);

      const rows = [['Date', 'Department', 'Product', 'Quantity', 'Unit', 'Reason']];
      for (const e of entries) rows.push([e.date, e.dept, e.product, e.qty, e.unit, e.reason]);

      const csv = rows.map(r =>
        r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      a.href = url;
      a.download = `waste_${mo[m - 1]}_${y}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    // ─── State ────────────────────────────────────────────────────────
    let _date = todayISO();
    let _dept = 'kitchen';
    let _view = 'daily';
    let _repY, _repM;
    let _container = null;
    let _modalOpen = false;

    // ─── Mount / Unmount ──────────────────────────────────────────────
    function mount() {
      let el = document.getElementById('wasteView');
      if (!el) {
        el = document.createElement('div');
        el.id = 'wasteView';
        const wrap = document.getElementById('appWrap') || document.body;
        wrap.appendChild(el);
      }
      _container = el;
      const now = new Date();
      _repY = now.getFullYear();
      _repM = now.getMonth() + 1;
      _date = todayISO();
      render();
    }

    function unmount() {
      if (_container) _container.innerHTML = '';
      closeModal(true);
    }

    // ─── Render dispatcher ────────────────────────────────────────────
    function render() {
      if (!_container) return;
      _view === 'daily' ? renderDaily() : renderReport();
    }

    // ─── Daily view ───────────────────────────────────────────────────
    function renderDaily() {
      const entries = getDayEntries(_date, _dept);
      const isToday = _date === todayISO();

      _container.innerHTML = `
        <div class="wm-wrap">
          <div class="wm-header">
            <div class="wm-date-nav">
              <button class="wm-nav-btn" id="wmPrev" aria-label="Previous day">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span class="wm-date-label">${isToday ? 'Today' : fmtDate(_date)}</span>
              <button class="wm-nav-btn" id="wmNext" aria-label="Next day"${isToday ? ' disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <button class="wm-pill-btn" id="wmReportBtn">Report</button>
          </div>

          <div class="wm-segment" role="group" aria-label="Department">
            <button class="wm-seg${_dept === 'kitchen' ? ' active' : ''}" data-d="kitchen">Kitchen</button>
            <button class="wm-seg${_dept === 'pastry' ? ' active' : ''}" data-d="pastry">Pastry</button>
          </div>

          <div class="wm-list" id="wmList">
            ${entries.length === 0
              ? `<p class="wm-empty">No entries for ${isToday ? 'today' : fmtDate(_date)}</p>`
              : entries.map(e => `
                <div class="wm-card">
                  <div class="wm-card-info">
                    <span class="wm-card-name">${esc(e.product)}</span>
                    <span class="wm-card-qty">${fmtQty(e.qty, e.unit)}</span>
                  </div>
                  <div class="wm-card-right">
                    <span class="wm-chip">${esc(e.reason)}</span>
                    <button class="wm-del-btn" data-id="${e.id}" aria-label="Delete entry">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>`).join('')
            }
          </div>

          <button class="wm-fab" id="wmFab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Waste
          </button>
        </div>
      `;

      _container.querySelector('#wmPrev').onclick = () => { _date = shiftDay(_date, -1); render(); };
      _container.querySelector('#wmNext').onclick = () => { if (!isToday) { _date = shiftDay(_date, 1); render(); } };
      _container.querySelector('#wmReportBtn').onclick = () => { _view = 'report'; render(); };
      _container.querySelector('#wmFab').onclick = openModal;
      _container.querySelectorAll('.wm-seg').forEach(b => b.onclick = () => { _dept = b.dataset.d; render(); });
      _container.querySelectorAll('.wm-del-btn').forEach(b => b.onclick = e => {
        e.stopPropagation();
        deleteEntry(b.dataset.id);
        render();
      });
    }

    // ─── Report view ──────────────────────────────────────────────────
    function renderReport() {
      const report = buildReport(_repY, _repM);
      const now = new Date();
      const isCurrent = _repY === now.getFullYear() && _repM === (now.getMonth() + 1);

      const deptBlock = (dept, label) => {
        const data = report[dept] || {};
        const keys = Object.keys(data).sort();
        if (!keys.length) return `
          <div class="wm-report-dept">
            <div class="wm-report-dept-title">${label}</div>
            <p class="wm-empty wm-report-empty">No waste recorded</p>
          </div>`;
        return `
          <div class="wm-report-dept">
            <div class="wm-report-dept-title">${label}</div>
            ${keys.map(p => {
              const d = data[p];
              const reasons = Object.entries(d.byReason)
                .map(([r, t]) => `<span class="wm-rep-reason"><b>${esc(r)}:</b> ${fmtTotals(t)}</span>`).join('');
              return `
                <div class="wm-rep-row">
                  <div class="wm-rep-top">
                    <span class="wm-rep-product">${esc(p)}</span>
                    <span class="wm-rep-total">${fmtTotals(d.totals)}</span>
                  </div>
                  <div class="wm-rep-reasons">${reasons}</div>
                </div>`;
            }).join('')}
          </div>`;
      };

      _container.innerHTML = `
        <div class="wm-wrap">
          <div class="wm-header">
            <div class="wm-date-nav">
              <button class="wm-nav-btn" id="wmRepPrev" aria-label="Previous month">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span class="wm-date-label">${fmtMonth(_repY, _repM)}</span>
              <button class="wm-nav-btn" id="wmRepNext" aria-label="Next month"${isCurrent ? ' disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div class="wm-header-actions">
              <button class="wm-pill-btn" id="wmExport">Export CSV</button>
              <button class="wm-pill-btn" id="wmBackBtn">← Daily</button>
            </div>
          </div>
          <div class="wm-report-body">
            ${deptBlock('kitchen', 'Kitchen')}
            ${deptBlock('pastry', 'Pastry')}
          </div>
        </div>
      `;

      _container.querySelector('#wmRepPrev').onclick = () => {
        _repM--; if (_repM < 1) { _repM = 12; _repY--; } render();
      };
      _container.querySelector('#wmRepNext').onclick = () => {
        if (!isCurrent) { _repM++; if (_repM > 12) { _repM = 1; _repY++; } render(); }
      };
      _container.querySelector('#wmExport').onclick = () => exportCSV(_repY, _repM);
      _container.querySelector('#wmBackBtn').onclick = () => { _view = 'daily'; render(); };
    }

    // ─── Add Waste modal ──────────────────────────────────────────────
    function openModal() {
      if (_modalOpen) return;
      _modalOpen = true;

      const reasons = allReasons();
      const bd = document.createElement('div');
      bd.className = 'wm-modal-back';
      bd.id = 'wmModalBack';
      bd.innerHTML = `
        <div class="wm-sheet" role="dialog" aria-modal="true" aria-label="New waste entry">
          <div class="wm-sheet-handle"></div>
          <div class="wm-sheet-header">
            <span class="wm-sheet-title">New Waste Entry</span>
            <button class="wm-sheet-cancel" id="wmCancel">Cancel</button>
          </div>
          <div class="wm-sheet-body">

            <div class="wm-field">
              <label class="wm-label">Item</label>
              <div class="wm-ac-wrap">
                <input class="wm-input" id="wmProduct" type="text" placeholder="Product name"
                  autocomplete="off" autocorrect="off" spellcheck="false" />
                <div class="wm-ac-list hidden" id="wmAcList"></div>
              </div>
            </div>

            <div class="wm-field">
              <label class="wm-label">Quantity</label>
              <div class="wm-qty-row">
                <input class="wm-input wm-qty-input" id="wmQty" type="number" min="0.01"
                  step="any" placeholder="0" inputmode="decimal" />
                <div class="wm-units" id="wmUnits">
                  ${['g','kg','pcs','l','ml'].map((u,i) =>
                    `<button type="button" class="wm-unit${i===0?' active':''}" data-u="${u}">${u}</button>`
                  ).join('')}
                </div>
              </div>
            </div>

            <div class="wm-field">
              <label class="wm-label">Reason</label>
              <div class="wm-reasons" id="wmReasons">
                ${reasons.map(r =>
                  `<button type="button" class="wm-reason-chip" data-r="${esc(r)}">${esc(r)}</button>`
                ).join('')}
                <button type="button" class="wm-reason-add" id="wmAddReason">+ Add</button>
              </div>
              <div class="wm-reason-new hidden" id="wmReasonNew">
                <input class="wm-input" id="wmReasonInput" type="text" placeholder="Custom reason…" />
                <button type="button" class="wm-reason-save" id="wmReasonSave">Save</button>
              </div>
            </div>

          </div>
          <div class="wm-sheet-footer">
            <button class="wm-done" id="wmDone" disabled>Done</button>
          </div>
        </div>
      `;

      document.body.appendChild(bd);
      requestAnimationFrame(() => bd.classList.add('open'));

      let _unit = 'g';
      let _reason = null;

      const productEl = bd.querySelector('#wmProduct');
      const qtyEl     = bd.querySelector('#wmQty');
      const acList    = bd.querySelector('#wmAcList');
      const doneBtn   = bd.querySelector('#wmDone');

      function validate() {
        const ok = productEl.value.trim() && parseFloat(qtyEl.value) > 0 && _reason;
        doneBtn.disabled = !ok;
      }

      function showAc(q) {
        const prods = getProducts(_dept);
        const matches = q ? prods.filter(p => p.toLowerCase().includes(q.toLowerCase())) : prods;
        if (matches.length) {
          acList.innerHTML = matches.map(p =>
            `<div class="wm-ac-item" data-v="${esc(p)}">${esc(p)}</div>`).join('');
          acList.classList.remove('hidden');
        } else {
          acList.classList.add('hidden');
        }
      }

      productEl.addEventListener('input', () => { showAc(productEl.value.trim()); validate(); });
      productEl.addEventListener('focus', () => showAc(''));
      document.addEventListener('click', hideAcOnOutside);

      function hideAcOnOutside(e) {
        if (!bd.querySelector('.wm-ac-wrap')?.contains(e.target)) acList.classList.add('hidden');
      }

      acList.addEventListener('mousedown', e => {
        const item = e.target.closest('.wm-ac-item');
        if (!item) return;
        productEl.value = item.dataset.v;
        acList.classList.add('hidden');
        qtyEl.focus();
        validate();
      });

      qtyEl.addEventListener('input', validate);

      bd.querySelectorAll('.wm-unit').forEach(btn => btn.addEventListener('click', () => {
        bd.querySelectorAll('.wm-unit').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _unit = btn.dataset.u;
      }));

      function addReasonChip(val, makeActive) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'wm-reason-chip';
        chip.dataset.r = val;
        chip.textContent = val;
        chip.addEventListener('click', () => {
          bd.querySelectorAll('.wm-reason-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          _reason = val;
          validate();
        });
        bd.querySelector('#wmReasons').insertBefore(chip, bd.querySelector('#wmAddReason'));
        if (makeActive) {
          bd.querySelectorAll('.wm-reason-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          _reason = val;
          validate();
        }
      }

      bd.querySelectorAll('.wm-reason-chip').forEach(chip => chip.addEventListener('click', () => {
        bd.querySelectorAll('.wm-reason-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        _reason = chip.dataset.r;
        validate();
      }));

      bd.querySelector('#wmAddReason').addEventListener('click', () => {
        bd.querySelector('#wmReasonNew').classList.remove('hidden');
        bd.querySelector('#wmReasonInput').focus();
      });

      bd.querySelector('#wmReasonSave').addEventListener('click', () => {
        const val = bd.querySelector('#wmReasonInput').value.trim();
        if (!val) return;
        addCustomReason(val);
        addReasonChip(val, true);
        bd.querySelector('#wmReasonNew').classList.add('hidden');
        bd.querySelector('#wmReasonInput').value = '';
      });

      bd.querySelector('#wmDone').addEventListener('click', () => {
        const product = productEl.value.trim();
        const qty = parseFloat(qtyEl.value);
        if (!product || !(qty > 0) || !_reason) return;
        addEntry({ id: uid(), date: _date, dept: _dept, product, qty, unit: _unit, reason: _reason, ts: Date.now() });
        document.removeEventListener('click', hideAcOnOutside);
        closeModal();
        render();
      });

      bd.querySelector('#wmCancel').addEventListener('click', () => {
        document.removeEventListener('click', hideAcOnOutside);
        closeModal();
      });
      bd.addEventListener('click', e => {
        if (e.target === bd) {
          document.removeEventListener('click', hideAcOnOutside);
          closeModal();
        }
      });

      setTimeout(() => productEl.focus(), 300);
    }

    function closeModal(immediate) {
      const bd = document.getElementById('wmModalBack');
      if (!bd) { _modalOpen = false; return; }
      if (immediate) { bd.remove(); _modalOpen = false; return; }
      bd.classList.remove('open');
      setTimeout(() => { bd.remove(); _modalOpen = false; }, 280);
    }

    // ─── Escape helper ────────────────────────────────────────────────
    function esc(s) {
      return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    return { mount, unmount };
  }

  window.createWasteModeModule = createWasteModeModule;
})();
