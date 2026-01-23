# Sprint 2 — Sections Management, Deep-links, Performance

## Description
This sprint focuses on making the Wine Gallery predictable, controllable, and shareable.

The main goals are:
- Deterministic control of sections order (independent from CSV row order).
- URL-based deep-links for sections and individual wines, so managers and sommeliers can share exact views.
- Improved performance and UX by reducing unnecessary network requests and UI re-renders.

This sprint introduces configuration-driven behavior as the source of truth
and prepares the system for more advanced UX in future sprints.

## Goal
Control sections order and provide convenient deep-links for manager / sommelier usage.

---

## Task 2.1 — Sections order driven only by data (config / sections table)

### Description / DoD
- Sections order must be stable and predictable.
- Rendering must NOT depend on CSV row order.

### Subtask 2.1.1 — Add `sectionsOrder` to configs (both restaurants)
**Description / DoD:**
- Add `sectionsOrder` field to:
  - `configs/peopletalk.json`
  - `configs/novikov_bh.json`
- Define the desired section order explicitly in config.

### Subtask 2.1.2 — Use `sectionsOrder` as the source of truth
**Description / DoD:**
- If `sectionsOrder` is present:
  - Render ONLY sections listed in `sectionsOrder`.
  - Follow the exact order from config.
- If `sectionsOrder` is missing:
  - Fallback to data-derived order (temporary behavior).

---

## Task 2.2 — Deep-links and URL behavior

### Description / DoD
- URLs must open the correct restaurant, language, section, and wine.
- URL must reflect the current UI state.

### Subtask 2.2.1 — Support `?section=<key>`
**Description / DoD:**
- On initial load:
  - Read `section` from URL and activate it.
- On section click:
  - Update URL with the active section key.
  **Status:** ✅ Done

- Applies active section from URL on initial load
- Updates URL when section is changed via UI
- Removes `section` param when "All" is selected


### Subtask 2.2.2 — Support `?w=<wine_id>` (modal behavior)
**Description / DoD:**
- If `w` is present in URL on load:
  - Open the wine modal for the given `wine_id`.
- On wine card click:
  - Open modal and update URL with `w=<wine_id>`.
- On modal close:
  - Remove `w` from the URL.

---

## Task 2.3 — Performance and UX improvements

### Description / DoD
- Reduce unnecessary network requests.
- Improve perceived responsiveness, especially on mobile devices.

### Subtask 2.3.1 — Cache config and CSV for session lifetime
**Description / DoD:**
- Cache loaded config and CSV data in memory.
- Do NOT refetch data on section changes if restaurant/language did not change.

### Subtask 2.3.2 — Debounce search input (200–300 ms)
**Description / DoD:**
- Apply debounce to search input.
- Reduce unnecessary re-renders while keeping UI responsive.
