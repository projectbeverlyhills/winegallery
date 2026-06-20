# Hostera — Wine Gallery

Premium B2B2C digital-menu SaaS для luxury-ресторанов. Меню (Wine / Coffee / Pastry / Bar) превращается в app-grade experience для гостя; ресторан управляет контентом через Google Sheets.

> Onboarding-памятка на 5 минут. Глубокие материалы — в [`docs/`](docs/).

## Стек в одну строку

Vanilla JS, без фреймворков и сборки. Весь UI + логика в одном файле [`index.html`](index.html) (CSS в `<style>`, JS в `<script>`, ~5000 строк). Данные — Google Sheets (CSV publishing). Хостинг — статика (любой CDN).

## Запуск локально

Сборки нет — нужен любой статический сервер (не открывать `file://`, иначе не загрузятся `fetch` конфигов):

```sh
cd winegallery
python3 -m http.server 8000
# открыть http://localhost:8000
```

Логины для входа — в [`configs/auth.json`](configs/auth.json) (client-side MVP).

## Структура

```
winegallery/
├── index.html          ← единственный entry point (HTML + CSS + JS inline)
├── configs/
│   ├── index.json      ← реестр ресторанов (defaultRestaurant + список)
│   ├── auth.json       ← логины/пароли (client-side MVP)
│   ├── novikov_bh.json ← конфиг ресторана (branding, theme, menus[])
│   └── peopletalk.json
├── assets/             ← логотипы, fallback-картинки, css/, js/ (inventory)
├── data/               ← локальные CSV (legacy/fallback; основной источник — Google Sheets)
└── docs/               ← документация (см. ниже)
```

## Как это работает (mental model)

1. `index.html` читает [`configs/index.json`](configs/index.json) → конфиг ресторана → массив `menus[]`.
2. Каждое меню тянет CSV по `csvUrl` (Google Sheets, опубликованный per gid).
3. Рендер идёт по полю `type`:
   - **`wine`** → wine-card (фото слева, info справа, секции с табами, multi-price).
   - **`pastry` / `coffee` / `bar`** → photo-card (фото сверху, заголовок + пилюля цены, бейджи аллергенов).
4. Тема (light/dark) и брендинг берутся из `theme` + `branding` в конфиге ресторана.

## Что прочитать дальше (по приоритету)

| Документ | О чём |
|---|---|
| [`docs/PROJECT_OVERVIEW_RU.md`](docs/PROJECT_OVERVIEW_RU.md) | Что за продукт, для кого, бизнес-модель, тарифы, текущие клиенты |
| [`docs/SPEC.md`](docs/SPEC.md) | **Читать перед любыми изменениями кода** — архитектура, naming-конвенции, структура данных, правила коммитов |
| [`docs/TZ_PLATFORM_V1.md`](docs/TZ_PLATFORM_V1.md) | ТЗ платформы v1 |
| [`docs/TEAM_RU.md`](docs/TEAM_RU.md) | Состав команды, роли (DRI-модель), фазы запуска |
| [`docs/ECOSYSTEM_CONCEPT_RU.md`](docs/ECOSYSTEM_CONCEPT_RU.md) | Долгосрочное видение экосистемы |
| [`../CLAUDE.md`](../CLAUDE.md) | Философия проекта (Apple-mindset) и правила работы |

## Конвенции, о которые легко споткнуться

- **Single-file** — `index.html` это и есть приложение. Новые файлы добавлять только при необходимости.
- **`isPastryMode` / `isPastryMenu`** — означают «flat photo-card» (pastry + coffee, **без** bar). Имя историческое, не переименовывать.
- **Bar** — рендерится как photo-card, но идёт через wine-путь ради секционной фильтрации (`section_key`).
- **CSS для photo-card** — namespace `.photoCard*`.
- **Hairline outlines** — единый визуальный язык floating-поверхностей: `1px solid rgba(0,0,0,0.15)` (light) / `rgba(255,255,255,0.20)` (dark).
- **Не переименовывать колонки в Google Sheets** — они под контролем ресторатора; несоответствия решаются маппером (`mapPhotoCardRow`).
- **Коммиты — только по явной просьбе.** Это git submodule — коммитить здесь, в `winegallery/`, не в outer-репозитории.

## Проверка перед сдачей задачи

`node --check` на инлайн-скрипт:

```sh
START=$(grep -n "^<script>" index.html | head -1 | cut -d: -f1)
END=$(grep -n "^</script>" index.html | head -1 | cut -d: -f1)
sed -n "$((START+1)),$((END-1))p" index.html > /tmp/wg.js && node --check /tmp/wg.js
```

При изменениях рендера/CSS — проверить **обе** темы (light + dark).
```
