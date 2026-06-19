# Hostera — Обзор проекта

## 1. Что это

Hostera — это **B2B2C SaaS-платформа** для премиум-ресторанов, которая превращает меню (вино, кофе, выпечка, бар) в премиальный digital-experience для гостей.

Ресторан управляет контентом через Google Sheets — без вёрстки и типографии — а гость видит app-grade меню с фото, описанием, ценами, аллергенами и поддержкой мультиязычности.

Технически — single-page web app, работает с любого устройства через ссылку или QR-код, доступен по логину.

## 2. Для кого

**B2B-аудитория (платит):** премиум-рестораны и hospitality-группы (US/EU, target — Novikov-tier, средний чек $80+).

**B2C-аудитория (использует):** гости этих ресторанов — взрослые, привычные к iPhone, ожидающие apple-grade UX в любом digital touch-point бренда.

**Не подходит:** fast-casual, fast-food, столовые. Их меню — операционный инструмент, наше — brand experience.

## 3. Какие проблемы решает

### Для ресторана (B2B)
- **Экономия на печати меню** — обновление через Google Sheets вместо переверстки и перепечатывания (часто $200-500/мес в премиум-сегменте).
- **Премиум-восприятие бренда** — гость видит app-grade интерфейс, а не PDF или Google Doc.
- **Real-time контент** — изменения в Google Sheets отражаются мгновенно, без релизов и согласований с дизайнером.
- **Мультиязычность** — снимает барьер для туристов.
- **Compliance (allergens)** — аллергены отображаются по стандарту FDA/EU.
- **Брендинг** — каждый ресторан с собственным лого, темой, набором меню.
- **Inventory mode** — учёт остатков продукта силами персонала (опционально, per restaurant).

### Для гостя (B2C)
- Красивое и быстрое меню без скачивания приложения.
- Фото каждого блюда / напитка.
- Поиск, секции, фильтрация.
- Информация об аллергенах и диете (V / VE / GF).
- Светлая и тёмная тема (auto + manual switch).

## 4. Текущее состояние продукта

### Запущенные клиенты
- **Novikov Beverly Hills** — полный набор меню (Bar, Coffee, Pastry, Wine), inventory mode enabled.
- **PeopleTalk** — Wine menu only.

### Типы меню
| Тип | Layout | Где используется |
|---|---|---|
| **Wine** | Photo-left + info-right, секции с табами, multi-price (Glass / Bottle) | Винные карты всех ресторанов |
| **Photo-card** (Pastry / Coffee / Bar) | Vertical: фото сверху, заголовок + цена-пилюля, описание, бейджи аллергенов | Любые меню кроме wine |

### Источник данных
- **Google Sheets** — единый spreadsheet на ресторан, каждое меню = отдельный лист (gid). CSV публикуется и читается на фронте.
- **Картинки** — Google Drive hosted URLs (Pastry / Coffee / Bar) или локальная папка `assets/` (Wine).

### Дизайн-система (Apple-aligned)
- **Единый язык**: hairline outlines (rgba 0.15 light / 0.20 dark) на всех floating chrome-поверхностях.
- **Photo-card**: квадратное фото, авто-сжатие длинных названий в одну строку, пилюля цены справа от заголовка.
- **Топбар Telegram-style**: три pill-блока (brand / central nav / search+settings) с blur-фоном.
- **Settings panel iOS-grade**: иконки, destructive Logout, theme toggle с inline-state, smooth scale-fade анимация.
- **Анимации**: cubic-bezier(0.2, 0, 0, 1), 120-220ms (iOS ease-out).

### Технический стек
- Single-file SPA — `index.html` (~5000 строк, CSS + JS inline).
- Vanilla JS, без фреймворков.
- Google Sheets API (CSV publishing).
- Хостинг — статический (любой CDN).

## 5. Бизнес-модель (B2B2C SaaS)

### Позиционирование
Premium digital menu для US/EU премиум-ресторанов. Apple-grade design + restaurateur-friendly content management. Не дешёвка, не template — value-priced premium SaaS.

### Тарифы (per location)

| Tier | Месяц | Год (~15% off) | Что входит |
|---|---|---|---|
| **Essentials** | **$99** | $999 | 1 ресторан, 1 тип меню, photo-card layout, 2 темы, базовая аналитика |
| **Professional** ⭐ | **$199** | $1990 | + Все типы меню (Wine + Coffee + Pastry + Bar), мультиязычность, кастомное брендирование, inventory mode, приоритетная поддержка |
| **Enterprise** | **$349** | custom | + Multi-location (white-label, API, dedicated CSM, SLA) |

**Дополнительно:**
- **Setup fee:** $499 one-time (onboarding, миграция меню, обучение персонала).
- **Free 14-day trial** без карты.
- **Multi-location discounts:** 20% off 2-5 локаций, 35% off 6+.

### Модель продаж
**Sales-assisted (1-to-1)** — каждый клиент через personal demo и onboarding. Высокая цена + premium позиция = малый объём, высокая маржа, low churn.

### Метрики успеха
- **MRR per location:** $99-349.
- **Целевой LTV:** $5000+ на ресторан (3+ года).
- **Targeting Y1:** 50 ресторанов → ~$120K ARR.
- **Targeting Y2-3:** 500 ресторанов → ~$1.2M ARR.
- **Churn:** <5%/год (премиум-сегмент держится).

## 6. Vision (high-level)

Стать **«Apple»-style decisional partner для premium hospitality-брендов** в категории digital menu / guest experience.

Долгосрочно:
- Расширение в смежные категории — digital wine list, sommelier tools, in-restaurant guest engagement.
- Партнёрства с POS-системами (Toast, Square) и booking-платформами.
- AI-инсайты для рестораторов (поведение гостей, популярность позиций, оптимизация цен).

## 7. Ограничения и риски

- **Client-side auth** — пароли в `configs/auth.json` видны в исходниках. Допустимо для guest-роли и MVP, но **обязателен переход на server-side** для Enterprise tier.
- **Single-file index.html** — масштабируется до ~100 ресторанов без изменений; дальше потребуется модульная архитектура (см. `docs/inventory/INVENTORY_ARCHITECTURE_BLUEPRINT.md` как референс на будущее).
- **Google Sheets как backend** — превосходно для ресторатора (он уже знает инструмент), но имеет лимиты (квоты публикации, скорость загрузки больших листов).
- **Premium-позиционирование** — high CAC; стратегия sales-assisted требует личного времени основателя на каждом клиенте до scale-point.
