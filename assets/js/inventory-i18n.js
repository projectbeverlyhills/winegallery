(function () {
  const DEFAULT_INVENTORY_STRINGS = {
    title: 'Pastry Inventory',
    date: 'Date',
    rowNumber: '#',
    product: 'Product',
    quantity: 'Quantity',
    unit: 'Unit',
    reason: 'Reason',
    staff: 'Staff',
    actions: 'Actions',
    addRow: '+ Add row',
    downloadXlsx: 'Download XLSX',
    shiftSurname: 'On-duty surname',
    surnamePlaceholder: 'Surname',
    enterToSave: 'Press Enter in row fields to save',
    confirmSurname: 'Confirm surname',
    confirmDay: 'Confirm day',
    history: 'History',
    from: 'From',
    to: 'To',
    confirmedByHeader: 'Confirmed by',
    notConfirmed: 'Not confirmed',
    dayNotConfirmed: 'Day is not confirmed',
    confirmedBy: 'Confirmed',
    confirmedByAt: 'Confirmed by {name} at {time}',
    entries: 'Entries',
    totalsByUnit: 'Totals by unit',
    topProducts: 'Top products',
    noRowsYet: 'No rows yet. Click + Add row.',
    noRangeRows: 'No records in selected range.',
    remove: 'Remove',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    del: 'Delete',
    exportSheet: 'Pastry Inventory',
    xlsxDate: 'Date',
    xlsxRecord: 'Record',
    xlsxProduct: 'Product',
    xlsxQuantity: 'Quantity',
    xlsxUnit: 'Unit',
    xlsxReason: 'Reason',
    xlsxStaff: 'Staff',
    xlsxConfirmedBy: 'Confirmed by',
    errFillRequired: 'Fill all required fields: date, product, quantity, unit, reason, staff.',
    errQty: 'Quantity must be a valid number.',
    errShiftSurname: 'On-duty surname is required before saving rows.',
    errDayLocked: 'Day is confirmed and locked for edits.',
    errNoExportRows: 'No rows available for export in selected range.',
    errNoXlsx: 'XLSX library is not loaded. Check internet connection and retry.',
    errConfirmSurname: 'Enter surname to confirm day.',
    errConfirmNoRows: 'Add at least one row before confirmation.'
  };

  function createInventoryI18n(options = {}) {
    const getStrings = typeof options.getStrings === 'function' ? options.getStrings : null;
    const baseStrings = options.baseStrings && typeof options.baseStrings === 'object'
      ? options.baseStrings
      : DEFAULT_INVENTORY_STRINGS;

    function strings() {
      const custom = getStrings ? getStrings() : null;
      return { ...baseStrings, ...(custom || {}) };
    }

    function formatLabel(template, values) {
      return String(template || '').replace(/\{(\w+)\}/g, (_, key) => values?.[key] ?? '');
    }

    return {
      strings,
      formatLabel
    };
  }

  window.createInventoryI18n = createInventoryI18n;
})();
