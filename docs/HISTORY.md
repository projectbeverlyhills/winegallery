# Project History

## Sprint 1
- Repository cloned from GitHub and opened in VS Code.
- Created `docs/` folder.
- Added project workflow documentation:
  - `SPEC.md`
  - `SPRINT.md`

## Sprint 2

### Core functionality
- Introduced `sectionsOrder` and `sectionsOrderByLang` in configs
  as a single source of truth for section ordering (language-aware).
- Implemented robust section resolution logic with strict fallback chain:
  1) `sectionsOrderByLang[lang]`
  2) `sectionsOrder`
  3) data-derived sections (only if config produces no matches)
- Normalized section keys to ensure consistency across languages and CSV data.

### Navigation & UX
- Added URL-based deep-link support:
  - `?section=` for section filtering
  - `?w=` for wine modal
- Modal open / close state is fully synced with URL.
- Added debounced search input to reduce unnecessary re-renders.
- Implemented in-memory caching for CSV and config data
  (no refetch on section change).

### Data mapping & robustness
- Fixed image rendering issue:
  - CSV column `bottle_img` correctly mapped to internal `imageUrl`.
- Added normalization for CSV boolean fields:
  - `visible`
  - `is_available`
- Implemented defensive CSV mapping:
  - validation of required fields
  - protection against empty UI due to mismatched column names

### QA & stability checks
- Added runtime sanity checks in console:
  - verification that wines are loaded after mapping & filters
  - validation of required mapped keys
  - validation of `sectionsEffective` against data and config
- Manually verified behavior via DevTools for:
  - EN / ES language switching
  - Novikov / PeopleTalk configs
  - section ordering consistency
  - image rendering
  - URL state synchronization

### Result
- Sprint 2 completed successfully.
- Section rendering is deterministic and language-safe.
- Deep-links are reliable and shareable.
- CSV → UI mapping is explicit and protected against silent failures.
- Project is ready for Sprint 3 without technical debt from Sprint 2.

## 2026-01-28 — Sprint 3 (completed)

### Product features & UX
- Implemented fast, language-aware search:
  - unified search haystack (name / producer / region / grape),
  - debounced input (250 ms),
  - clear/reset behavior with proper mobile UX.
- Added availability (86) management:
  - global hide86 config option per restaurant,
  - unavailable wines either hidden or shown as “86” directly in price area,
  - visual dimming for unavailable items.

### Language & navigation
- Implemented language switch without full page reload:
  - reloads CSV per selected language only,
  - recomputes sections and active state,
  - keeps URL in sync (?lang=) including popstate handling.
- Completed deep-link MVP for wines:
  - ?w=<wine_id> opens modal on load,
  - modal open/close updates URL state,
  - section auto-adjusts when opening a wine.

### UI & mobile experience
- Unified wine card layout and typography:
  - compact card design,
  - clear hierarchy (title / sub / prices),
  - tasting notes rendered as up to 3 visual chips from notes field.
- Improved mobile UX:
  - single-column layout,
  - larger tap targets,
  - better wrapping and spacing for chips and text.

### Accessibility
- Added keyboard and accessibility support:
  - Esc closes modal only when open,
  - focus trap inside modal (Tab / Shift+Tab),
  - logical tab order for controls,
  - visible focus outline,
  - proper aria-labels for interactive elements,
  - section tabs use semantic buttons + pressed state,
  - status pill announces loading/ready via aria-live.

### Images & robustness
- Added bottle image placeholder:
  - UI remains stable if bottle_img is missing or broken.
- Enabled native lazy-loading (loading="lazy") for bottle images to improve performance on large menus.

### Result
- Sprint 3 completed successfully.
- Wine Gallery is now a production-ready, fast, accessible, and shareable product.
- UX is consistent across restaurants, languages, desktop, and mobile.