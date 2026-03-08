# Inventory Mode — архитектурный blueprint (100+ ресторанов)

## 1. Цель
Построить Inventory Mode как масштабируемую продуктовую возможность, а не как page-specific реализацию внутри `index.html`.

Цели:
- строгая изоляция режимов Menu Mode и Inventory Mode;
- конфигурируемость по ресторанам без форков кода;
- надежная целостность данных с ролевым контролем;
- production-grade эксплуатация для сети 100+ ресторанов.

---

## 2. Продуктовые и инженерные принципы
1. **Сначала изоляция режимов**
   - Menu и Inventory — отдельные режимы приложения (UI, маршруты, состояние, потоки данных).
   - Никакой смешанной верхней навигации.

2. **Конфигурация вместо ветвления**
   - Один общий inventory engine.
   - Поведение ресторана определяется inventory-профилем в конфиге.

3. **Стабильные контракты**
   - Версионируемая схема (`schemaVersion`) для конфигов и API payload.
   - Только обратно-совместимые миграции.

4. **Операционная безопасность**
   - После подтверждения дня (`confirm day`) данные становятся неизменяемыми.
   - Полный аудит действий edit/delete/confirm/export.

5. **Устойчивость офлайн**
   - Локальная очередь с детерминированным sync/retry.
   - Явно определенная conflict-policy.

---

## 3. Целевая архитектура

## 3.1 Высокоуровневые слои
- **App Core**
  - Auth/session, routing, branding, theme, глобальные настройки, shell layout.
- **Feature Registry**
  - Динамически включает/выключает функции на основе restaurant config.
- **Inventory Engine (общий модуль)**
  - Универсальная логика формы/таблицы, validation, save/confirm/export, history/range view.
- **Inventory Profiles (конфиг)**
  - Определение полей, единиц, причин, прав, меток, сортировки.
- **Data Layer**
  - API client + offline queue + sync manager + local cache.

## 3.2 Разделение режимов во время выполнения
- `/<restaurant>/<menu>` => Menu Mode
- `/<restaurant>/inventory` => Inventory Mode

У каждого режима свои:
- top bar controls;
- видимые компоненты;
- namespace состояния;
- правила синхронизации URL.

---

## 4. Декомпозиция по файлам/модулям (предложение)

- `src/core/app-shell.ts`
- `src/core/router.ts`
- `src/core/feature-registry.ts`
- `src/core/session.ts`

- `src/features/inventory/inventory-engine.ts`
- `src/features/inventory/inventory-store.ts`
- `src/features/inventory/inventory-api.ts`
- `src/features/inventory/inventory-sync.ts`
- `src/features/inventory/inventory-export.ts`
- `src/features/inventory/inventory-ui.ts`

- `src/features/menu/menu-engine.ts`

- `src/config/restaurant-config.ts`
- `src/config/schema/inventory-profile.schema.json`

- `src/shared/http.ts`
- `src/shared/validators.ts`
- `src/shared/date.ts`
- `src/shared/number.ts`

---

## 5. Контракт restaurant config

Добавляем feature flag и профиль на уровне ресторана.

Пример:

```json
{
  "restaurantId": "novikov_bh",
  "schemaVersion": "1.0",
  "features": {
    "inventory": {
      "enabled": true,
      "route": "inventory",
      "profile": "pastry-default",
      "apiNamespace": "pastry",
      "offline": {
        "enabled": true,
        "maxQueueSize": 1000,
        "retryPolicy": "exp-backoff"
      }
    }
  },
  "inventoryProfiles": {
    "pastry-default": {
      "title": "Pastry Inventory",
      "fields": {
        "date": { "type": "date", "required": true, "default": "today" },
        "product": { "type": "string", "required": true, "source": "menu+manual" },
        "quantity": { "type": "number", "required": true, "allowDecimal": true, "min": 0 },
        "unit": { "type": "enum", "required": true, "values": ["g", "kg", "pcs", "portions"] },
        "reason": { "type": "enum+custom", "required": true, "values": ["Human error", "Guest return", "Damaged", "Expired", "Other"] },
        "staffSurname": { "type": "string", "required": true }
      },
      "confirmDay": {
        "required": true,
        "field": "confirmSurname",
        "locksDay": true
      },
      "permissions": {
        "create": ["manager", "staff"],
        "edit": ["manager", "staff"],
        "delete": ["manager", "staff"],
        "confirm": ["manager", "staff"],
        "export": ["manager", "staff"]
      }
    }
  }
}
```

Примечания:
- Для ресторанов без inventory: `features.inventory.enabled = false`.
- Разные рестораны могут использовать разные профили без форков кодовой базы.

---

## 6. API-контракт (versioned)

Базовый namespace:
- `/api/v1/restaurants/:restaurantId/inventory/:namespace`

Эндпоинты:
1. `POST /entries:batch`
   - Batch create/update строк (обязателен idempotency key).
2. `GET /entries?from=YYYY-MM-DD&to=YYYY-MM-DD`
   - Чтение истории за диапазон.
3. `POST /days/:date/confirm`
   - Подтверждение дня по фамилии + user identity.
4. `GET /days/:date`
   - Чтение дня + lock status.
5. `GET /products:suggest`
   - Подсказки продуктов из меню + исторический словарь.
6. `POST /exports`
   - Генерация signed XLSX URL (опционально server-side export).

Обязательная мета-информация при записи:
- `schemaVersion`
- `clientRequestId`
- `actor.userId`
- `actor.role`
- `deviceId`
- `timestamp`

---

## 7. Офлайн и синхронизация

## 7.1 Локальная очередь
- Каждая мутация ставится в очередь (`create`, `update`, `delete`, `confirm`).
- Хранение в IndexedDB (не localStorage) для надежности.
- Состояния очереди: `pending`, `syncing`, `failed`, `applied`.

## 7.2 Алгоритм синхронизации
1. Положить мутацию в локальную очередь.
2. Применить optimistic UI update.
3. Выполнять background sync по порядку.
4. Retry с exponential backoff.
5. На ответе 2xx пометить как `applied`.

## 7.3 Политика конфликтов
- По умолчанию: **server timestamp wins** при конфликте одной версии записи.
- Для подтвержденных дней: отклонять редактирование с ошибкой (`DAY_LOCKED`).
- UI обязан показывать conflict-banner с действиями retry/reload.

---

## 8. Безопасность и роли

- Role matrix проверяется и на клиенте, и на сервере.
- Клиент — только UX-gate; сервер — единственный источник истины.
- Операция подтверждения фиксирует:
  - фамилию подтверждающего;
  - id аутентифицированного пользователя;
  - UTC timestamp;
  - immutable lock flag.
- Аудит-события:
  - `inventory.row.created`
  - `inventory.row.updated`
  - `inventory.row.deleted`
  - `inventory.day.confirmed`
  - `inventory.export.requested`

---

## 9. План миграции из текущего index.html

## Phase 0 — Стабилизация (текущее состояние)
- Сохраняем работоспособность текущего поведения.
- Замораживаем добавление новой inventory-логики в `index.html`.

## Phase 1 — Выделение core-слоя
- Выносим route/mode toggling в отдельные helper-модули.
- Добавляем feature flag в restaurant configs.
- Сохраняем старый UI, но за feature boundary.

## Phase 2 — Выделение inventory-модуля
- Переносим inventory state и rendering в `inventory-engine`.
- Оставляем `index.html` только как shell.
- Заменяем прямую DOM-связку на контракт `mount/unmount`.

## Phase 3 — Интеграция API
- Заменяем локальную персистентность на API client.
- Добавляем offline queue и sync manager.
- Добавляем bridge-миграцию локальных данных в API.

## Phase 4 — Hardening
- Добавляем schema validation для config/payload.
- Добавляем telemetry и SLO dashboards.
- Добавляем integration/e2e test matrix по профилям.

## Phase 5 — Масштабный rollout
- Pilot: 1 ресторан.
- Canary: 5 ресторанов.
- Постепенный rollout: 20 -> 50 -> 100+.
- Rollback через feature flag на уровне ресторана.

---

## 10. Совместимость и миграция данных

Рекомендуемая стратегия:
- При первом запуске API-версии выполнить одноразовую миграцию:
  - прочитать локальный snapshot inventory;
  - преобразовать в каноническую API-схему;
  - загрузить батчами с idempotency keys;
  - сохранить локальный migration checkpoint.
- На переходный период оставить read-only fallback для старых локальных данных.

---

## 11. План поставки (MVP за 1–2 спринта)

Sprint A:
- feature flags + profile schema;
- mode-isolated shell;
- выделенный inventory module (пока с локальной персистентностью).

Sprint B:
- API integration + role matrix + confirm-day lock;
- XLSX export service endpoint;
- offline queue + conflict handling;
- migration bridge local -> API.

---

## 12. Non-goals

- Отдельная кодовая база на каждый ресторан.
- Хардкод restaurant-specific ветвлений в core app.
- Неверсионируемые payload/config контракты.

---

## 13. Метрики успеха

- Функциональные:
  - 100% изоляция режимов (без смешивания навигации/компонентов).
  - 0 потерь данных при offline/online переходах.

- Операционные:
  - sync success rate >= 99.9%
  - confirm-day lock violations = 0
  - export generation p95 < 3s

- Масштабирование:
  - onboarding нового ресторана с inventory profile < 1 дня
  - отсутствие необходимости форка кода для profile-level кастомизации

---

## 14. Ближайшие следующие шаги

1. Утвердить config schema (`features.inventory`, `inventoryProfiles`).
2. Утвердить список API endpoints и error model.
3. Запустить Phase 1 extraction в кодовой базе.
4. Добавить pilot-rollback checklist для запуска.
