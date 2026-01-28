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

## 2026-01-27 — Sprint 3 (partial)

### Done
- 3.1 Search: haystack (name/producer/region/grape) + debounce + clear button.
- 3.2 86-mode: `hide86` config support; when visible, unavailable wines show "86" in price area and card dimming.
- 3.3 Language switch without full reload: reload CSV per language, recompute sections, sync URL + popstate.
- 3.4 Deep-link MVP: `?w=` opens modal on load; modal open/close updates URL.

### Partial
- 3.5 UI unification: compact cards + notes rendered as up to 3 chips (from `notes` field).

### Not done yet
- 3.6 Accessibility & keyboard support.
- 3.7 Image placeholders + lazy loading.

