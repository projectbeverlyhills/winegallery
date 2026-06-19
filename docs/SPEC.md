# Hostera — Технический Spec

Технические правила и архитектурные конвенции проекта. **Читается перед любыми изменениями кода.** Для продуктового и бизнес-контекста см. `PROJECT_OVERVIEW_RU.md`.

## 1. Архитектура

### Структура проекта
```
winegallery/
├── index.html              ← единый entry point (HTML + CSS + JS inline)
├── configs/
│   ├── index.json          ← список ресторанов
│   ├── auth.json           ← логины (client-side MVP)
│   ├── novikov_bh.json     ← конфиг Novikov Beverly Hills
│   └── peopletalk.json     ← конфиг PeopleTalk
├── assets/
│   ├── *.png/svg           ← логотипы, фолбэки
│   └── js/                 ← модули инвентаризации (отдельная подсистема)
├── data/                   ← локальные CSV (legacy; основной источник — Google Sheets)
└── docs/                   ← документация
    ├── PROJECT_OVERVIEW_RU.md
    ├── SPEC.md (этот файл)
    └── inventory/          ← документация по inventory-фиче
```

### Технический стек
- **Vanilla JS** — без фреймворков и сборки.
- **Single-file SPA** — весь UI/логика в `index.html` (CSS внутри `<style>`, JS внутри `<script>`).
- **Google Sheets** — основной источник данных (один spreadsheet на ресторан, каждое меню = отдельный gid, публикация → CSV).
- **Хостинг** — статический (CDN).

## 2. Типы меню и render path

Два режима рендеринга карточек:

| Режим | Меню | Layout | Helper |
|---|---|---|---|
| **Wine card** | Wine | Horizontal: фото слева, info справа, много полей | (default path, не photo-card) |
| **Photo card** | Pastry, Coffee, Bar (и future с тем же layout) | Vertical: фото сверху, body снизу | `isPhotoCardMenu(menu)` |

### Подразделение photo-card по поведению
- **`isPastryMenu(menu)`** (≡ `isPastryMode()`) — pastry/coffee. **Flat list** — без секций и табов.
- **`isPhotoCardMenu(menu)`** — pastry/coffee/bar. Все используют photo-card render.
- **Bar** — photo-card + секции (`section_key` колонка): `isPhotoCardMenu` = true, `isPastryMode` = false. Идёт через wine-путь для секционной фильтрации, но рендер — photo-card.

### Известное naming-ограничение
`isPastryMode` / `isPastryMenu` означают «flat photo-card» (pastry+coffee, без bar). Имя историческое — на момент введения функции `bar` ещё не было. Не переименовывать без необходимости — много call-sites.

## 3. CSS / JS naming-конвенции

### Photo-card namespace
Все CSS-классы для photo-card layouts префиксом `.photoCard*`:
- `.photoCard`, `.photoCardPhoto`, `.photoCardImg`, `.photoCardPlaceholder`
- `.photoCardBody`, `.photoCardHeader`, `.photoCardTitle`, `.photoCardDescription`
- `.photoCardFooter`, `.photoCardPrice`, `.photoCardGrid`

JS:
- `mapPhotoCardRow(x, idx)` — мапит CSV-строку в объект для рендера photo-card.
- `DIET_BADGE_LABELS` — карта V/VE/GF → Vegetarian/Vegan/Gluten-Free (бейджи аллергенов для других значений выводятся текстом as-is).

### Hairline outline system
**Единый визуальный язык** для всех floating chrome-поверхностей (топбар, settings panel, пилюля цены, и т.п.):
- Light: `border: 1px solid rgba(0,0,0,0.15)`
- Dark: `border-color: rgba(255,255,255,0.20)`

Применять только к независимым floating поверхностям. **НЕ применять** к active states внутри контейнеров (там визуальная иерархия делается через fill + color).

### Theme CSS variables
Определены в `configs/<restaurant>.json` (`theme.variables`):
- `--bg1`, `--bg2` — фон страницы
- `--card`, `--card2` — фон карточек
- `--stroke`, `--stroke2` — границы (warm-tone, для wine-карточек)
- `--text`, `--muted`, `--muted2` — текст
- `--chip`, `--chipActive` — фон chip-элементов
- `--accent`, `--accentSoft` — акцентный цвет (для пилюли цены, etc.)
- `--navAccent`, `--navActiveBg` — цвета активного состояния навигации

Тёмная тема — через `[data-theme="dark"]` overrides + JS-функция `applyTheme()`.

### Анимации
- iOS-style easing: `cubic-bezier(0.2, 0, 0, 1)` (ease-out с резким стартом и мягким приземлением).
- Длительности: 120-220ms для micro-interactions.
- Для смены состояния (theme toggle, menu switch) — обновление через class toggle, не через DOM rebuild (иначе CSS transition не сработает).

## 4. Структура данных (Google Sheets)

### Wine sheet — колонки
```
№, producer, name, vintage, country, region, sub-region, grape, style,
story, notes, btg_price, bottle_price, btg, section_key, subsection_key,
order, visible, is_available, bottle_img, primary_image_url
```

### Photo-card sheets (Pastry / Coffee / Bar) — колонки
```
№, section_key, name of dish, description, allergies, price,
primary_image_url, visible, is_available
```

### Поведение
- **`visible: yes/no`** — фильтр в `state.wines` при загрузке. `no` → строка не отображается.
- **`is_available: yes/no`** — `no` → класс `.is86` на карточке (визуально приглушает); полностью скрывается только при `config.hide86: true`.
- **`section_key`** — нормализуется через `normalizeSectionKey()` (lowercase, non-alphanumeric → `_`).
- **Порядок отображения:**
  - Photo-card меню — **порядок строк в Google Sheets (curated)**. Никакой сортировки.
  - Wine — сортировка по `sectionOrder` (config) + по цене ascending внутри секции.
- **`primary_image_url`** — полный URL (Google Drive published). Для wine может быть `bottle_img` как альтернатива.
- **`allergies`** — comma-separated, например `V, GF` или `Citrus, Mint`. `N/A` отбрасывается. Для photo-card — рендерится как pill-бейджи (text-only после задачи "убрать иконки").

## 5. Конфиги

### Restaurant config — `configs/<restaurantId>.json`
Поля:
- `restaurantId` — уникальный ID.
- `name` — display name.
- `branding` — `{ logo, subtitle }`.
- `theme` — `{ preset, variables, font }`.
- `defaultLanguage`, `enabledLanguages`.
- `features.inventory` — `{ enabled, route, profile, apiNamespace, title }`.
- `currency` — например `USD`.
- `hide86` — boolean (скрывать ли unavailable).
- `menus[]` — массив меню.
- `sectionsOrder` / `sectionsOrderByLang` — порядок секций для wine.

### Menu entry
```json
{
  "key": "bar",
  "title": "Bar",
  "type": "bar",
  "layout": "list",
  "csvUrl": {
    "en": "https://docs.google.com/.../pub?gid=...&single=true&output=csv"
  }
}
```

**`type`** — главное поле:
- `wine` → wine-path.
- `pastry` / `coffee` / `bar` → photo-card path.

**`layout`** — legacy поле, рендером не используется.

### Index config — `configs/index.json`
Реестр ресторанов:
```json
{
  "defaultRestaurant": "novikov_bh",
  "restaurants": [
    { "id": "...", "label": "...", "config": "configs/<file>.json" }
  ]
}
```

### Auth config — `configs/auth.json`
Список пользователей (client-side MVP):
```json
{ "login": "...", "password": "...", "role": "guest", "restaurantId": "..." }
```

## 6. Правила работы с кодом

### Изменения
- **Минимальные и точечные.** Не рефакторить ради рефакторинга.
- **Не переименовывать файлы и папки** без явного запроса.
- **CSS-классы и JS-функции можно переименовать** через `replace_all`, когда расширяется концепция (как было с `.pastryCard` → `.photoCard`, `DIETARY_ICON_SVGS` → `BADGE_ICON_SVGS`). После такого рефакторинга — обязательно grep'нуть старые имена.
- **Новые файлы добавлять только при необходимости.** index.html — главный entry.

### Коммиты и push
- **Только по явной просьбе пользователя.** Никогда не коммитить unprompted.
- Один commit = одна логическая задача.
- Если в working tree есть несвязанные изменения (например, изменения в `auth.json` пока работаем над UI) — спросить, как поступить, прежде чем добавлять в коммит.
- Подмодуль `winegallery/` (nested) — коммитить там, не в outer `winegallery1`.

### Risky actions
Подтверждать перед: удалением файлов, force push, изменением shared state (auth, configs ресторанов), очисткой ранее сохранённых данных.

### CSV / data
- Google Sheets — основной источник, локальные CSV в `data/` — legacy/fallback.
- Любые несоответствия между именами колонок CSV и полями в коде — решать через mapper (`mapPhotoCardRow` или inline wine-мапер), **не переименовывать колонки в Sheets** (они под контролем ресторатора).

## 7. Проверки перед сдачей задачи

- `node --check` на инлайн-скрипт (вырезать `<script>...</script>` и прогнать):
  ```sh
  START=$(grep -n "^<script>" index.html | head -1 | cut -d: -f1)
  END=$(grep -n "^</script>" index.html | head -1 | cut -d: -f1)
  sed -n "$((START+1)),$((END-1))p" index.html > /tmp/wg.js && node --check /tmp/wg.js
  ```
- Grep остатков старых имён при рефакторинге.
- При изменениях рендера или CSS — проверить обе темы (light + dark).

## 8. Известные технические ограничения

- **Client-side auth** — пароли в `configs/auth.json` видны в исходниках. Для guest-роли и MVP допустимо; для Enterprise обязателен server-side.
- **Single-file index.html (~5000 строк)** — масштабируется до ~100 ресторанов; дальше нужна модульная архитектура.
- **`MENU_ICON_SVGS.pastry`** — это топбар-иконка для меню Pastry. Не путать с photo-card.
- **`INVENTORY_MENU_KEY = 'inventory_pastry'`** — отдельная подсистема для инвентаризации (см. `docs/inventory/`), не связана с обычным меню Pastry.
- **`PASTRY_BADGE_LABELS` → `DIET_BADGE_LABELS`** — после рефакторинга. Если в старых ветках/обсуждениях встретится старое имя — это оно.
