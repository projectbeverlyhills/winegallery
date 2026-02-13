# Sprint 2 — Управление секциями, deep-links, производительность

## Description
Этот спринт направлен на то, чтобы сделать Wine Gallery предсказуемым,
управляемым и удобным для шаринга.

Основные цели:
- детерминированный контроль порядка секций (независимо от порядка строк в CSV);
- URL-based deep-links для секций и отдельных вин, чтобы менеджеры и сомелье могли делиться точными представлениями;
- улучшение производительности и UX за счёт сокращения лишних сетевых запросов и перерисовок UI.

В этом спринте вводится поведение, управляемое конфигурацией,
как единый source of truth,
и закладывается основа для более сложного UX в следующих спринтах.

## Goal
Контроль порядка секций и удобные deep-links
для использования менеджерами и сомелье.

---

## Task 2.1 — Порядок секций, управляемый только данными (config / sections table)

### Description / DoD
- Порядок секций должен быть стабильным и предсказуемым.
- Рендеринг НЕ должен зависеть от порядка строк в CSV.

### Subtask 2.1.1 — Добавить `sectionsOrder` в конфиги (оба ресторана)
**Description / DoD:**
- Добавить поле `sectionsOrder` в:
  - `configs/peopletalk.json`
  - `configs/novikov_bh.json`
- Явно определить желаемый порядок секций в конфиге.
**Status:** ✅ Done

### Subtask 2.1.2 — Использовать `sectionsOrder` как source of truth
**Description / DoD:**
- Если `sectionsOrder` присутствует:
  - рендерить ТОЛЬКО секции, перечисленные в `sectionsOrder`;
  - строго соблюдать порядок из конфига.
- Если `sectionsOrder` отсутствует:
  - fallback на порядок, полученный из данных (временное поведение).
**Status:** ✅ Done

### Subtask 2.1.3 — Языко-зависимый порядок секций (`sectionsOrderByLang`)
**Description / DoD:**
- Поддержать `sectionsOrderByLang[lang]` в конфиге для ресторанов,
  где названия секций различаются по языкам.
- Цепочка fallback:
  1) `sectionsOrderByLang[lang]` (если есть и не пусто)
  2) `sectionsOrder`
  3) секции, полученные из данных (только если конфиг не дал совпадений)
**Status:** ✅ Done

---

## Task 2.2 — Deep-links и поведение URL

### Description / DoD
- URL должен открывать корректный ресторан, язык, секцию и вино.
- URL должен отражать текущее состояние UI.

### Subtask 2.2.1 — Поддержка `?section=<key>`
**Description / DoD:**
- При первичной загрузке:
  - считать `section` из URL и активировать её.
- При клике на секцию:
  - обновлять URL с ключом активной секции.
**Status:** ✅ Done

- Активная секция применяется из URL при загрузке
- URL обновляется при смене секции через UI
- Параметр `section` удаляется при выборе “All”

### Subtask 2.2.2 — Поддержка `?w=<wine_id>` (логика модалки)
**Description / DoD:**
- Если `w` присутствует в URL при загрузке:
  - открыть модалку соответствующего вина.
- При клике на карточку вина:
  - открыть модалку и обновить URL с `w=<wine_id>`.
- При закрытии модалки:
  - удалить `w` из URL.
**Status:** ✅ Done

- Модалка открывается при наличии `?w=<wine_id>` при загрузке
- URL обновляется при открытии модалки
- `w` удаляется из URL при закрытии

---

## Task 2.3 — Улучшения производительности и UX

### Description / DoD
- Сократить лишние сетевые запросы.
- Улучшить субъективную отзывчивость, особенно на мобильных устройствах.

### Subtask 2.3.1 — Кэширование config и CSV на время сессии
**Description / DoD:**
- Кэшировать загруженные config и CSV в памяти.
- НЕ делать повторный fetch при смене секции,
  если ресторан и язык не изменились.
**Status:** ✅ Done

- Config и CSV кэшируются в памяти на время сессии
- Смена секций не вызывает повторный fetch при неизменных r/lang

### Subtask 2.3.2 — Debounce поискового инпута (200–300 мс)
**Description / DoD:**
- Добавить debounce к поисковому инпуту.
- Снизить количество лишних перерисовок,
  сохраняя отзывчивость UI.
**Status:** ✅ Done

- Поиск задебаунсен (250 мс)
- Снижается количество лишних ререндеров, особенно на мобильных

---

## Task 2.4 — Корректность маппинга данных (CSV → UI)

### Description / DoD
- Все UI-поля должны явно маппиться из заголовков CSV.
- Исключить «тихие» баги пустого UI из-за несовпадения имён колонок.

### Subtask 2.4.1 — Исправить маппинг изображения бутылки
**Description / DoD:**
- Замаппить колонку CSV `bottle_img` → внутреннее поле `imageUrl`.
- Изображения бутылок должны отображаться в карточках и модалке.
**Status:** ✅ Done

### Subtask 2.4.2 — Нормализация boolean и предотвращение “нет вин после фильтров”
**Description / DoD:**
- `visible` / `is_available` должны нормализовываться в реальные boolean.
- Поддержка "yes/no", "true/false", "1/0" и non-breaking spaces.
**Status:** ✅ Done

### Subtask 2.4.3 — QA sanity-проверки (console)
**Description / DoD:**
- Проверить в консоли:
  - `state.wines.length > 0`
  - у первого вина есть ключи:
    `id, title, section, sectionKey, imageUrl, priceGlass, priceBottle, visible, available`
  - `state.sectionsEffective` соответствует ожидаемым табам для текущего `lang`
**Status:** ✅ Done

---

# Sprint 3 — Продуктовые функции и UX

## Description
Этот спринт направлен на превращение Wine Gallery
из «красивого меню»
в реальный, продаваемый продукт
с сильным UX и операционными возможностями.

Спринт улучшает:
- качество и скорость поиска;
- управление availability (86);
- переключение языка без перезагрузки страницы;
- deep-links на конкретные вина;
- визуальную консистентность, мобильный UX и доступность.

Функциональность должна работать идентично для обоих ресторанов.

## Goal
Сделать Wine Gallery быстрым, управляемым, удобным для шаринга
и комфортным в использовании
для гостей, менеджеров и сомелье.

---

## Definition of Done (DoD)

Пользователь может:
- быстро найти вино через поиск;
- скрыть или пометить unavailable-вина (86);
- переключить язык без полной перезагрузки страницы;
- открыть вино по прямой ссылке;
- комфортно пользоваться меню на мобильных устройствах;
- навигировать UI с клавиатуры и screen readers.

---

## Task 3.1 — Поиск по ключевым полям вина

### Description / DoD
- Поиск работает без заметных лагов.
- Поиск включает как минимум:
  - название вина,
  - производителя,
  - регион,
  - сорт винограда.
- Поведение идентично для обоих ресторанов.
- Поиск работает только в рамках выбранного языка.

### Subtask 3.1.1 — Построение поискового индекса (haystack)

**Description / DoD:**
- Сформировать одну поисковую строку (haystack) на каждое вино.
- Объединить ключевые поля (name, producer, region, grape).
- Нормализовать значения (без учёта регистра, trim).
- Реализация поиска через `includes()`.

**Implementation order:** Phase 1  
**Status:** ✅ Done

---

### Subtask 3.1.2 — Debounce поиска и очистка

**Description / DoD:**
- Debounce поискового инпута (200–300 мс).
- Реализовать clear / reset поведение.
- Обеспечить корректный UX на мобильных устройствах.

**Implementation order:** Phase 2  
**Status:** ✅ Done

---

## Task 3.2 — Availability (is_available) и режим “86”

### Description / DoD
- Доступность вин контролируется через `is_available`.
- Поведение конфигурируемо:
  - скрывать unavailable-вина,
  - либо показывать их с бейджем “86”.

### Subtask 3.2.1 — Опция `hide86` в конфиге и бейдж

**Description / DoD:**
- Добавить `hide86: true | false` в конфиг ресторана.
- Если `hide86 = true`:
  - вина с `is_available = false` скрываются.
- Если `hide86 = false`:
  - вина остаются видимыми и помечаются бейджем “86”.
- Опция глобальна для ресторана.

**Implementation order:** Phase 3  
**Status:** ✅ Done

---

## Task 3.3 — Переключение языка без полной перезагрузки

### Description / DoD
- Переключение языка не должно вызывать `window.location.reload()`.
- UI обновляется динамически.
- URL синхронизируется с состоянием.

### Subtask 3.3.1 — Синхронизация языка с URL и UI

**Description / DoD:**
- Обновлять `?lang=` в URL при смене языка.
- Перезагружать CSV данные только для выбранного языка.
- Пересчитывать секции и карточки вин.
- Корректно fallback-иться на `defaultLanguage`.

**Implementation order:** Phase 4  
**Status:** ✅ Done

---

## Task 3.4 — Deep-link на конкретное вино

### Description / DoD
- Поддержка URL вида `?r=restaurant&lang=en&w=wine_id`.
- Переход по ссылке открывает нужное вино.

### Subtask 3.4.1 — MVP-решение через модалку

**Description / DoD:**
- Использовать модалку как MVP-решение.
- Если `w` присутствует в URL:
  - открыть модалку при загрузке.
- При открытии модалки:
  - обновлять URL с `w`.
- При закрытии:
  - удалять `w` из URL.

**Implementation order:** Phase 5  
**Status:** ✅ Done

---

## Task 3.5 — Унификация карточек и типографики

### Description / DoD
- Карточки вин следуют единому визуальному стандарту.
- Чёткая иерархия:
  - title,
  - producer,
  - region,
  - prices.
- Консистентные отступы и выравнивание.

### Subtask 3.5.1 — Компактные карточки и заметки-чипы

**Description / DoD:**
- Уменьшить высоту карточек.
- Сделать “story” более компактным.
- Отображать tasting notes (`notes`) в виде до 3 визуальных чипов.

**Implementation order:** Phase 6  
**Status:** ✅ Done

---

### Subtask 3.5.2 — Улучшения мобильного лейаута

**Description / DoD:**
- Одноколоночный layout на мобильных.
- Увеличенные tap-таргеты.
- Комфортный скролл и взаимодействие.

**Implementation order:** Phase 7  
**Status:** ✅ Done

---

## Task 3.6 — Доступность и поддержка клавиатуры

### Description / DoD
- Улучшить доступность для клавиатуры и screen readers.

### Subtask 3.6.1 — Фокус и tab-навигация

**Description / DoD:**
- `Esc` закрывает модалку.
- Корректная работа фокуса.
- Логичный tab-порядок.
- Видимый focus outline.
- Корректные `aria-label`.

**Implementation order:** Phase 8  
**Status:** ✅ Done

### Subtask 3.6.2 — Семантика табов секций (buttons)
**Description / DoD:**
- Таб-секции рендерятся как `<button>`, а не `<div>`.
- Активное состояние использует `aria-pressed="true"`.
**Status:** ✅ Done

### Subtask 3.6.3 — Live-статус для screen readers
**Description / DoD:**
- Статус-индикатор использует `role="status"` и `aria-live="polite`,
  чтобы screen reader озвучивал состояния loading / ready / error.
**Status:** ✅ Done

---

## Task 3.7 — Изображения и плейсхолдеры

### Description / DoD
- Карточки вин не должны ломаться,
  если изображение бутылки отсутствует или не загружается.

### Subtask 3.7.1 — Placeholder-изображение

**Description / DoD:**
- Добавить локальный placeholder:
  - `assets/placeholder-bottle.png` или `.svg`.
- Использовать placeholder, если `bottle_img` отсутствует или невалиден.

**Implementation order:** Phase 9  
**Status:** ✅ Done

---

### Subtask 3.7.2 — Lazy-loading изображений

**Description / DoD:**
- Использовать `loading="lazy"` для изображений бутылок.
- Обеспечить graceful fallback-поведение.

**Implementation order:** Phase 10  
**Status:** ✅ Done

---

# Sprint 4 — Цены, валюта и availability (логика меню)

## Description
Этот спринт фокусируется на унификации логики цен, валюты
и статуса доступности (86),
чтобы поведение меню было корректным, предсказуемым и единообразным.

## Goal
Корректные цены и статус 86,
единые и управляемые правила отображения.

---

## Definition of Done (DoD)

- Все цены форматируются единым способом.
- Валюта задаётся на уровне конфига ресторана.
- Отображение BTG и Bottle следует явным правилам.
- Поведение unavailable-вин (86) управляется через конфиг.

---

## Task 4.1 — Валюта из config/restaurants и форматирование цен

### Description / DoD
- Валюта задаётся на уровне ресторана.
- Форматирование цен выполняется через `Intl.NumberFormat`.

### Subtask 4.1.1 — Добавить `currency` в конфиги

**Description / DoD:**
- Добавить `currency` в `peopletalk.json` и `novikov_bh.json`.
- Начальное значение: `USD`.
**Status:** ✅ Done

- Поле `currency: "USD"` добавлено в оба конфига ресторанов

### Subtask 4.1.2 — Единый формат BTG / Bottle

**Description / DoD:**
- Если `btg_price` отсутствует — `/glass` не показывается.
- Цена бутылки отображается независимо.
**Status:** ✅ Done

- Функция `money()` переписана с использованием `Intl.NumberFormat`
- Валюта берётся из конфига ресторана и форматируется корректно ($102, $30 / glass и т.д.)
- Цены отображаются в карточках вин и в модалке
- Если `btg_price` отсутствует, `/glass` не показывается

---

## Task 4.2 — `format_ml` как UI-дефолт

### Description / DoD
- Используется дефолтный объём (например, 750ml).
- Объём не отображается без UX-решения.

### Subtask 4.2.1 — Решение по отображению объёма

**Description / DoD:**
- Принять решение: показываем ли объём и где (карточка / модалка).
**Status:** ✅ Done

- Объём отображается только в модалке (не на карточках)
- Бутылка: 750 ml
- Бокал: 150 ml / 5 oz (для американского рынка)

---

## Task 4.3 — Availability и логика 86

### Description / DoD
- Поведение unavailable-вин определяется через конфиг.

### Subtask 4.3.1 — Тоггл поведения 86

**Description / DoD:**
- `hide86 = true` — скрывать unavailable-вина.
- `hide86 = false` — показывать с чипом “Out of stock”.**Status:** ✅ Done

- Поле `hide86` добавлено в оба конфига с начальным значением `false`
- Логика фильтрации и отображения "Out of stock" уже была реализована в Sprint 3

---

# Sprint 5 — PeopleTalk pairing + профиль notes (иконки/чипы)

## Description
Этот спринт фокусируется на функциях, которые «продают»:
food pairing и понятные tasting notes,
чтобы карточки и модалка вина
были интуитивными и визуально читаемыми.
Реализация ориентирована на PeopleTalk
и отличается от Novikov на уровне UI и логики.

## Goal
Функции, которые «продают»:
pairing и понятные notes.

---

## Definition of Done (DoD)

- Pairing отображается только для PeopleTalk.
- В Novikov pairing полностью скрыт.
- Notes отображаются как 3 визуальных токена.
- Токены имеют человекочитаемые названия (en/es).
- Используется MVP-реализация иконок.
- Модалка вина поддерживает deep-links.

---

## Task 5.1 — Pairing только для PeopleTalk

### Description / DoD
- Показывать блок pairing в карточке/модалке
  только при `r=peopletalk`.

### Subtask 5.1.1 — UI для pairing (место и стиль)

**Description / DoD:**
- Определить, где показывать pairing:
  карточка или модалка.
- В Novikov pairing скрыт полностью.

**Status:** ✅ Done

- Pairing отображается только в модалке для PeopleTalk
- В Novikov pairing полностью скрыт

---

## Task 5.2 — Notes profile: 3 ощущения (tokens)

### Description / DoD
- Парсить `notes_profile` вида
  `citrus|green_apple|stone_fruit`.
- Рендерить notes как 3 чипа / иконки.

### Subtask 5.2.1 — Словарь токенов → человекочитаемые названия (en/es)

**Description / DoD:**
- Маппинг токенов в человекочитаемые названия.
- Пример:
  `green_apple → Green apple / Manzana verde`.
- Язык зависит от текущего языка UI.

**Status:** ✅ Done

- Реализован словарь токенов TOKEN_DICTIONARY с 25+ токенами и их переводами
- Названия токенов отображаются в зависимости от языка UI (en/es)

---

### Subtask 5.2.2 — Иконки/эмодзи или мини-svg (MVP)

**Description / DoD:**
- MVP:
  эмодзи или простые svg из assets.
- Реализация допускает дальнейшее улучшение.

**Status:** ✅ Done

- Используются эмоджи для каждого токена (MVP)
- Архитектура позволяет заменить эмоджи на SVG без изменения логики

---

## Task 5.3 — Модалка (детали вина)

### Description / DoD
- Открытие карточки вина с подробной информацией.
- Deep-link интеграция из Sprint 2.

### Subtask 5.3.1 — Содержимое модалки (поля + layout)

**Description / DoD:**
- Producer, name, vintage, region, grape, story, notes, pairing.

**Status:** ✅ Done

- Модалка отображает все ею характеристики
- Pairing отображается только для PeopleTalk

# Sprint 6 — WineGallery UI refactor (List Card + Modal + Wine Profile)

## Description
Этот спринт приводит винное меню к стилю **Michelin × Apple** для **iPad**:
в списке — только то, что помогает выбрать за **5 секунд**,
в модалке — детали, которые дают **уверенность** (цены/размеры + профиль вина + краткое описание + pairing).
Аудитория: **wealthy casual** и гости, которые **не разбираются в вине**.

## Goal
Сделать интерфейс премиальным, минималистичным и “без страха выбора”:
- List Card = быстрое сканирование и решение
- Modal = уверенный выбор за счёт деталей

---

## Definition of Done (DoD)

- В List Card показываются **обе цены**: bottle + glass.
- В List Card **нет длинного описания** (никаких paragraph).
- В List Card есть **1 строка Style line** (3–6 слов).
- В List Card **максимум 2 chips**.
- В List Card **ровно 3 taste notes** (медальоны/иконки) и **без повторов**.
- Wine Profile **НЕ показывается** в List Card.
- В Modal есть блок Pricing с размерами (750 ml; 150 ml/5 oz).
- В Modal есть Wine Profile **ровно 4 шкалы** (по правилам ниже).
- Акцент Wine Profile **не ярко-красный**, используется Burgundy accent `#6F1D2B`.
- Применена единая палитра нейтралей и акцента (см. Task 6.3).
- Визуально нет “фитнес-апп” ощущений: **без градиентов, без тяжелых теней**.

---

## Task 6.1 — List Card: структура и “5 секунд на выбор”

### Description / DoD
- Привести List Card к фиксированной иерархии:
  Title + Price stack → Subtitle → Style line → Chips(2) → Notes(3).
- Убрать любой контент, который не помогает выбрать быстро.

### Subtask 6.1.1 — Контейнер и сетка

**Description / DoD:**
- Высота карточки: **170–190px**
- Радиус: **20–24px**
- Padding: **18–22px**
- Сетка: 2 колонки
  - Left: **26–30%** (бутылка)
  - Right: **70–74%** (контент)
- Никаких градиентов, тяжелых теней, декоративных рамок.

### Subtask 6.1.2 — Bottle визуал слева

**Description / DoD:**
- Бутылка стоит на мягком теплом фоне (нейтраль).
- Допускается **очень лёгкая** тень под бутылкой (subtle).
- Бутылка вертикально центрирована.
- Без “глянца”, без “постеров”, без ярких эффектов.

### Subtask 6.1.3 — Контент справа (фиксированный порядок)

**Description / DoD:**
- Row A:
  - Title (1 строка, ellipsis если длинно)
  - Price stack справа:
    - Bottle price — semibold
    - Glass price — lighter
  - **Обе цены обязательны**
- Row B:
  - Subtitle: `Страна · Регион · Сорт` (1 строка)
- Row C:
  - Style line (1 строка, 3–6 слов)
  - Не энциклопедия, а позиционирование (Apple-style)
- Row D:
  - Chips: **максимум 2**
- Row E:
  - Taste notes: **ровно 3** медальона + lowercase подписи
  - **Без повторов** (например, “floral, floral” запрещено)

### Subtask 6.1.4 — Запреты в List Card

**Description / DoD:**
- Длинные описания (paragraph) — запрещены.
- Wine Profile в List Card — запрещен.
- ml/oz в List Card — запрещены.
- >2 chips — запрещено.
- ≠3 notes — запрещено.

---

## Task 6.2 — Modal: детали для уверенного выбора

### Description / DoD
- Modal раскрывает информацию только после тапа по карточке.
- Вся информация в модалке структурирована блоками, без перегруза.

### Subtask 6.2.1 — Layout модалки (2 колонки)

**Description / DoD:**
- 2 колонки:
  - Left: bottle (крупнее) + те же 2 chips + те же 3 notes
  - Right: pricing + wine profile + description + pairing
- Кнопка закрытия сверху справа.

### Subtask 6.2.2 — Pricing block (обязательно)

**Description / DoD:**
- Отображать размеры вместе с ценами:
  - Bottle: `$X · 750 ml`
  - Glass: `$Y · 150 ml / 5 oz`
- Если есть несколько размеров бокала — отдельными строками.

### Subtask 6.2.3 — Wine Profile (ровно 4 шкалы)

**Description / DoD:**
- В модалке всегда **4 шкалы**:
  1) Body: light — full
  2) Acidity: soft — bright
  3) Sweetness: dry — sweet
  4) Texture:
     - для sparkling/white: crisp — creamy
     - для red: smooth — firm (tannin)
- Визуальный стиль:
  - трек шкалы нейтральный
  - маркер и акцент только Burgundy `#6F1D2B`
  - без градиентов, без яркого красного, без “фитнес” вида

### Subtask 6.2.4 — Description и Pairing (минимализм)

**Description / DoD:**
- Description: максимум **2–3 коротких предложения**
  - без “This wine is made from…”
  - без лишней энциклопедии
- Pairing: **2–4 пункта максимум** (иконки или слова)

---

## Task 6.3 — Палитра (Luxury + Tech)

### Description / DoD
- Применить единую палитру нейтралей и одного акцента.
- Убрать ярко-красные элементы.

### Subtask 6.3.1 — Neutrals (обязательные значения)

**Description / DoD:**
- Background (app): `#F7F4EE`
- Card surface: `#FFFFFF`
- Primary text: `#121212`
- Secondary text: `#6E6A63`
- Divider/hairline: `#E8E2D8`
- Chip background: `#F2EEE6`
- Chip border: `#E2DBCF`
- Slider track: `#EFE7DE`

### Subtask 6.3.2 — Accent (Burgundy Tech)

**Description / DoD:**
- Accent main: `#6F1D2B`
- Accent soft (опционально): `#B46A74`
- Правило: **одна акцентная семья**, никаких неонов/градиентов.

---

# Sprint 7 — Типографика и система размеров (Apple/Michelin hierarchy)

## Description
Этот спринт фиксирует типографику и отступы, чтобы интерфейс ощущался
дорогим, спокойным и предсказуемым. Меньше “прыгающих” размеров, больше системы.

## Goal
Единая типографика и spacing-система для List Card и Modal.

---

## Definition of Done (DoD)

- Выбран один шрифт (Inter / SF Pro / Helvetica Now) и применён глобально.
- Все размеры текста приведены к единой шкале.
- Нет ALL CAPS.
- Нет “случайных” font-weight по интерфейсу.
- На одном экране максимум **3 уровня визуальной важности** (weights/цвет).

---

## Task 7.1 — Типографическая шкала (List Card)

### Description / DoD
- Title (List): **20–22px**, semibold
- Subtitle: **14–15px**, regular, secondary
- Style line: **14px**, regular, secondary (чуть светлее subtitle)
- Bottle price: **18px**, semibold
- Glass price: **14px**, regular, secondary
- Chips: **12–13px**, medium
- Notes labels: **12–13px**, regular, lowercase

---

## Task 7.2 — Типографическая шкала (Modal)

### Description / DoD
- Modal Title: **26–28px**, semibold
- Modal pricing: **18–20px**, regular/medium (ценность высокая)
- Текст описания: **14–16px**, regular, secondary

---

## Task 7.3 — Spacing система

### Description / DoD
- Внутри карточки: **8–12px** между рядами
- Между логическими блоками: **16–20px**
- Увеличенные зоны тапа на iPad (не мелкие кликабельные элементы)

---

# Sprint 8 — Стандартизация Style Line (короткие фразы)

## Description
Этот спринт вводит единый стиль коротких “позиционирующих” фраз,
которые помогают новичку понять вино за секунду.
Style line — это не описание, а “перевод” на человеческий.

## Goal
Сделать Style line консистентным по длине, стилю и смыслу для всех вин.

---

## Definition of Done (DoD)

- У каждого вина в List Card есть Style line.
- Style line всегда **1 строка** (ellipsis при переполнении).
- Длина Style line: **3–6 слов**.
- Нет шаблонных “This wine…” формулировок.
- Нет повторов формулировок в одном разделе/категории (по возможности).
- Тон: премиальный, простой, уверенный.

---

## Task 8.1 — Правила Style Line

### Description / DoD
- 3–6 слов
- Без длинных предложений
- Без “This wine…”
- По умолчанию без точки в конце
- Слова простые: crisp / fresh / elegant / rich / smooth / balanced / food-friendly

---

## Task 8.2 — Библиотека шаблонов (MVP)

### Description / DoD
Champagne:
- Fresh, elegant, balanced
- Crisp, refined, celebratory
- Classic brut, food-friendly

Sauvignon Blanc:
- Crisp, zesty, mineral-driven
- Light, clean, refreshing

Chardonnay (oaked):
- Creamy, round, structured
- Rich texture, subtle oak

Pinot Noir:
- Silky, delicate, aromatic
- Elegant red fruit profile

Napa Cabernet:
- Bold, structured, powerful
- Dark fruit, firm tannins

Rosé:
- Fresh, dry, easy-drinking
- Light, vibrant, refreshing

---

## Task 8.3 — Проверка и нормализация контента

### Description / DoD
- Пройти по всем карточкам:
  - если Style line отсутствует — добавить
  - если слишком длинная — сократить
  - если не соответствует типу вина — заменить
  - исключить повторы в одном разделе (по возможности)

---

# Sprint 3 — UI/UX улучшения карточки вина

## Description
Спринт направлен на улучшение визуального представления карточек вин:
оптимизация типографики, компоновки элементов и размеров изображений
для повышения читаемости и эстетики интерфейса.

## Goal
Улучшить UX карточки вина через оптимизацию шрифтов, разделение информации
и подгонку размеров элементов.

---

## Task 3.1 — Оптимизация типографики

### Subtask 3.1.1 — Сокращение количества шрифтов
**Description / DoD:**
- Уменьшить font stack с 6 шрифтов до 3
- Оставить: 'Proxima Nova', 'Helvetica Neue', sans-serif
**Status:** ✅ Done

### Subtask 3.1.2 — Разделение производителя и названия вина
**Description / DoD:**
- Разделить producer и wine name на отдельные строки
- Producer отображается серым цветом над названием
- Синхронизировать размеры шрифтов (19px для обоих элементов)
- На мобильных устройствах: 17px
**Status:** ✅ Done

### Subtask 3.1.3 — Многострочный режим для названия
**Description / DoD:**
- Реализовать отображение до 2 строк с ellipsis
- Уменьшить font-size с 21px до 19px
- Установить line-height: 1.3 для улучшенной читаемости
**Status:** ✅ Done

---

## Task 3.2 — Оптимизация размеров изображений и контейнеров

### Subtask 3.2.1 — Увеличение размера бутылки
**Description / DoD:**
- Увеличить max-height бутылки с 138px до 165px (desktop)
- Для планшетов (930px): 145px
**Status:** ✅ Done

### Subtask 3.2.2 — Подгонка серого фона под размер бутылки
**Description / DoD:**
- Установить высоту .bottleWrap:
  - Desktop: 175px (под бутылку 165px)
  - Tablet (930px): 155px (под бутылку 145px)
  - Mobile (680px): 175px
- Уменьшить border-radius с 18px до 12px
**Status:** ✅ Done

---

## Task 3.3 — Синхронизация стилей

### Description / DoD
- Обеспечить единый font-weight: 600 для producer и name
- Подтвердить консистентность размеров на всех breakpoint'ах
**Status:** ✅ Done

