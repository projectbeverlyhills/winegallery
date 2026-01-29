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
**Status:** ✅ Done

### Subtask 2.1.2 — Use `sectionsOrder` as the source of truth
**Description / DoD:**
- If `sectionsOrder` is present:
  - Render ONLY sections listed in `sectionsOrder`.
  - Follow the exact order from config.
- If `sectionsOrder` is missing:
  - Fallback to data-derived order (temporary behavior).
**Status:** ✅ Done

### Subtask 2.1.3 — Language-specific sections order (`sectionsOrderByLang`)
**Description / DoD:**
- Support `sectionsOrderByLang[lang]` in config for restaurants where section labels differ per language.
- Fallback chain:
  1) `sectionsOrderByLang[lang]` (if present and non-empty)
  2) `sectionsOrder`
  3) data-derived sections (only if config produced no matches)
**Status:** ✅ Done

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
**Status:** ✅ Done

- Opens wine modal when `?w=<wine_id>` is present on load
- Updates URL with `w` when a wine card is opened
- Removes `w` from URL on modal close

---

## Task 2.3 — Performance and UX improvements

### Description / DoD
- Reduce unnecessary network requests.
- Improve perceived responsiveness, especially on mobile devices.

### Subtask 2.3.1 — Cache config and CSV for session lifetime
**Description / DoD:**
- Cache loaded config and CSV data in memory.
- Do NOT refetch data on section changes if restaurant/language did not change.
**Status:** ✅ Done

- Config and CSV are cached in memory for the session
- Section changes do not trigger re-fetch if r/lang are unchanged

### Subtask 2.3.2 — Debounce search input (200–300 ms)
**Description / DoD:**
- Apply debounce to search input.
- Reduce unnecessary re-renders while keeping UI responsive.
**Status:** ✅ Done

- Search input is debounced (250ms)
- Reduces unnecessary re-renders while staying responsive on mobile

---

## Task 2.4 — Data mapping correctness (CSV → UI fields)
### Description / DoD
- All UI fields must be mapped from CSV headers explicitly.
- Prevent silent “empty UI” bugs caused by mismatched column names.

### Subtask 2.4.1 — Fix bottle image mapping
**Description / DoD:**
- Map CSV column `bottle_img` → internal field `imageUrl`.
- Bottle images must render in cards and modal.
**Status:** ✅ Done

### Subtask 2.4.2 — Normalize booleans and avoid “no wines after filters”
**Description / DoD:**
- `visible` / `is_available` must be normalized to real booleans.
- Must accept "yes/no", "true/false", "1/0", and handle non-breaking spaces.
**Status:** ✅ Done

### Subtask 2.4.3 — QA sanity checks (console)
**Description / DoD:**
- Confirm in console that:
  - `state.wines.length > 0`
  - first wine has mapped keys: `id,title,section,sectionKey,imageUrl,priceGlass,priceBottle,visible,available`
  - `state.sectionsEffective` matches expected tabs for current `lang`
**Status:** ✅ Done
---

# Sprint 3 — Product Features & UX

## Description
This sprint focuses on turning the Wine Gallery from a “nice-looking menu”
into a real, sellable product with strong UX and operational features.

The sprint improves:
- search quality and speed,
- availability (86) management,
- language switching without page reload,
- deep-links to specific wines,
- visual consistency, mobile UX, and accessibility.

The functionality must work identically for both restaurants.

## Goal
Make the Wine Gallery fast, controllable, shareable, and comfortable to use
for guests, managers, and sommeliers.

---

## Definition of Done (DoD)

A user can:
- quickly find a wine using search,
- hide or mark wines as unavailable (86),
- switch language without a full page reload,
- open a wine via a direct link,
- comfortably use the menu on mobile devices,
- navigate the UI with keyboard and screen readers.

---

## Task 3.1 — Search by key wine fields

### Description / DoD
- Search must work without noticeable lag.
- Search must include at least:
  - wine name,
  - producer,
  - region,
  - grape.
- Behavior must be identical for both restaurants.
- Search operates only within the currently selected language.

---

### Subtask 3.1.1 — Build search index (haystack)

**Description / DoD:**
- Build a single searchable string (haystack) per wine.
- Combine relevant fields (name, producer, region, grape).
- Normalize values (case-insensitive, trimmed).
- Search implementation uses `includes()`.

**Implementation order:** Phase 1
**Status:** ✅ Done

---

### Subtask 3.1.2 — Search debounce and clear behavior

**Description / DoD:**
- Debounce search input (200–300 ms).
- Provide clear/reset behavior.
- Ensure correct UX on mobile devices.

**Implementation order:** Phase 2
**Status:** ✅ Done

---

## Task 3.2 — Availability (is_available) and “86” mode

### Description / DoD
- Availability of wines is controlled via `is_available`.
- Behavior is configurable:
  - hide unavailable wines, or
  - show them with an “86” badge.

---

### Subtask 3.2.1 — `hide86` config option and badge

**Description / DoD:**
- Add `hide86: true | false` to restaurant config.
- If `hide86 = true`:
  - wines with `is_available = false` are hidden.
- If `hide86 = false`:
  - wines remain visible and show an “86” badge.
- Option is global per restaurant.

**Implementation order:** Phase 3
**Status:** ✅ Done

---

## Task 3.3 — Language switch without full page reload

### Description / DoD
- Language switching must not trigger `window.location.reload()`.
- UI updates dynamically.
- URL is updated accordingly.

---

### Subtask 3.3.1 — Sync language with URL and UI

**Description / DoD:**
- Update `?lang=` in URL when language changes.
- Reload CSV data for the selected language only.
- Recompute sections and wine cards.
- Fallback correctly to `defaultLanguage`.

**Implementation order:** Phase 4
**Status:** ✅ Done

---

## Task 3.4 — Deep-link to a specific wine

### Description / DoD
- Support URLs like `?r=restaurant&lang=en&w=wine_id`.
- Opening the link opens the correct wine.

---

### Subtask 3.4.1 — Modal-based MVP solution

**Description / DoD:**
- Use modal as the MVP solution.
- If `w` is present in URL:
  - open the wine modal on load.
- When modal opens:
  - update URL with `w`.
- When modal closes:
  - remove `w` from URL.

**Implementation order:** Phase 5
**Status:** ✅ Done

---

## Task 3.5 — Card layout and typography unification

### Description / DoD
- Wine cards follow a single visual standard.
- Clear hierarchy:
  - title,
  - producer,
  - region,
  - prices.
- Consistent spacing and alignment.

---

### Subtask 3.5.1 — Compact cards and notes as chips

**Description / DoD:**
- Reduce card height.
- Make “story” more compact.
- Render wine tasting notes (`notes` field) as up to 3 visual chips.

**Implementation order:** Phase 6
**Status:** ✅ Done

---

### Subtask 3.5.2 — Mobile layout improvements

**Description / DoD:**
- Single-column layout on mobile.
- Larger tap targets.
- Comfortable scrolling and interaction.

**Implementation order:** Phase 7
**Status:** ✅ Done

---

## Task 3.6 — Accessibility and keyboard support

### Description / DoD
- Improve accessibility for keyboard and screen readers.

---

### Subtask 3.6.1 — Focus and tab navigation

**Description / DoD:**
- `Esc` closes the modal.
- Correct focus handling.
- Logical tab order for buttons and selects.
- Visible and clear focus outline.
- Proper `aria-label`s where needed.

**Implementation order:** Phase 8
**Status:** ✅ Done

Subtask 3.6.2 — Section tabs semantics (buttons)
Description / DoD:
 • Section tabs are rendered as <button> elements (not <div>).
 • Active state uses aria-pressed="true".
Status: ✅ Done

Subtask 3.6.3 — Live status for screen readers
Description / DoD:
 • Status pill uses role="status" and aria-live="polite" so SR announces loading/ready/error states.
Status: ✅ Done

---

## Task 3.7 — Images and placeholders

### Description / DoD
- Wine cards must not break if bottle image is missing or broken.

---

### Subtask 3.7.1 — Placeholder image

**Description / DoD:**
- Add local placeholder image:
  - `assets/placeholder-bottle.png` or `.svg`.
- Use placeholder when `bottle_img` is missing or invalid.

**Implementation order:** Phase 9
**Status:** ✅ Done

---

### Subtask 3.7.2 — Lazy-loading images

**Description / DoD:**
- Use `loading="lazy"` for bottle images.
- Ensure graceful fallback behavior.

**Implementation order:** Phase 10
**Status:** ✅ Done
