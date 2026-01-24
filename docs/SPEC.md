# Wine Gallery — Project Specification

## Purpose
This project is a web-based Wine Gallery.

## General Rules
- Do NOT rewrite existing code unless explicitly asked.
- Do NOT rename files or folders.
- Do NOT change project structure without permission.
- Changes must be minimal and targeted.

## Code Rules
- index.html is the main entry file.
- Existing folders (assets, configs, data) must remain intact.
- New files are added only when necessary.
- No refactoring unless requested.

## Data Rules (CSV → App mapping)
- CSV is the single source of truth for wine data.
- The app MUST map CSV columns into the internal wine object used by UI rendering.
- Any mismatch between CSV header names and code field names must be solved via mapping (not by renaming CSV columns).

### Required internal fields (used by UI)
Each mapped wine object should provide:
- id
- title
- sub
- section
- sectionKey
- style
- description
- notes
- imageUrl
- priceBottle
- priceGlass
- visible (boolean)
- available (boolean)

### Current CSV columns (Novikov / PeopleTalk baseline)
Expected CSV headers include (may be extended):
- id, section, order, producer, name, vintage, country, region, grape, style,
  btg_price, bottle_price, story, notes, bottle_img, visible, is_available

Mapping rules (baseline):
- bottle_img → imageUrl
- btg_price → priceGlass
- bottle_price → priceBottle
- story → description

Booleans:
- visible / is_available must be normalized (e.g. "yes"/"no", "true"/"false", "1"/"0", empty).

## Sections Rules (Source of truth)
- Sections are controlled by config, not by CSV order.
- `sectionsOrder` defines the canonical set and order of tabs.
- `sectionsOrderByLang[lang]` may override order/labels per language.
- Strict behavior: sections not present in config are hidden.
- Matching uses normalized keys (`sectionKey`) to avoid issues with accents/spaces/case.

Fallback chain:
1) sectionsOrderByLang[lang] (if exists and non-empty)
2) sectionsOrder (if exists and non-empty)
3) fallback to sections discovered from data (only if config produces no matches)

## Workflow Rules
- Work step by step.
- Follow SPEC.md and SPRINT.md strictly.
- If something is unclear — ask before changing.
