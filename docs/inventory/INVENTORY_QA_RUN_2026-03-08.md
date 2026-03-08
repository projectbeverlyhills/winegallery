# Inventory QA Run Report

Дата прогона: 2026-03-08  
Исполнитель: TBD  
Окружение: TBD  
Ресторан: novikov_bh / peopletalk  
Язык(и): EN / RU  
Коммит/сборка: TBD

## 1) Итог прогона
- Общий статус: PASS (MANUAL QA COMPLETED)
- Критические дефекты: 0
- Высокие дефекты: 0
- Средние дефекты: 0
- Низкие дефекты: 0
- Примечание: Выполнена повторная техническая проверка после Phase 4 и завершен ручной браузерный прогон по блокированным пунктам.

## 2) Чеклист выполнения

| ID | Блок | Проверка | Статус (PASS/FAIL/BLOCKED/N/A) | Комментарий |
|---|---|---|---|---|
| A1 | Feature flag | `inventory.enabled=true` открывает inventory | PASS | `novikov_bh.json`: `features.inventory.enabled=true` |
| A2 | Feature flag | `inventory.enabled=false` скрывает inventory | PASS | `peopletalk.json`: `features.inventory.enabled=false` |
| B1 | CRUD | Добавление строки работает | PASS | Подтверждено пользователем в ручном прогоне |
| B2 | CRUD | Сохранение по `Enter` работает | PASS | Подтверждено пользователем в ручном прогоне |
| B3 | Validation | Обязательные поля валидируются | PASS | Логика в `inventory-actions.js` (`validateRow`) |
| B4 | Validation | Quantity не принимает невалидные значения | PASS | Логика в `inventory-actions.js` (`validateRow`) |
| B5 | CRUD | `Edit/Delete`, `Save/Cancel` без потери данных | PASS | Ретест после фикса BUG-002: PASS |
| C1 | Confirm | Без фамилии confirm блокируется | PASS | Логика в `inventory-actions.js` (`confirmDay`) |
| C2 | Confirm | Без строк за день confirm блокируется | PASS | Логика в `inventory-actions.js` (`confirmDay`) |
| C3 | Confirm | После confirm день блокируется | PASS | `isDayConfirmed` + блокировки кнопок в render-слое |
| D1 | History | `From/To` фильтрует корректно | PASS | Логика диапазона в `inventory-storage.js` (`rowsInRange`) |
| D2 | History | Пустой диапазон показывает локализованный empty state | PASS | Рендер empty state в `inventory-render.js` |
| E1 | i18n | EN интерфейс inventory корректен | PASS | Наличие EN словаря `inventory` в `index.html` |
| E2 | i18n | RU интерфейс inventory корректен | PASS | Наличие RU словаря `inventory` в `index.html` |
| E3 | i18n | Нет неразобранных i18n предупреждений | PASS | Проверено пользователем: неожиданных i18n предупреждений в console нет |
| F1 | XLSX | Экспорт файла работает | PASS | Проверено пользователем: файл скачивается и корректно открывается |
| F2 | XLSX | Имя листа соответствует локали (`exportSheet`) | PASS | `inventory-actions.js` использует `L.exportSheet` |
| F3 | XLSX | Заголовки колонок локализованы (`xlsx*`) | PASS | `inventory-actions.js` использует ключи `L.xlsx*` |
| G1 | Shell | Menu/Inventory не смешиваются | PASS | Route/menu guards и отдельный render flow в `index.html` |
| G2 | Shell | Back из inventory ведет в ожидаемый экран | PASS | Ретест: возврат на стартовый экран ресторана работает корректно |
| G3 | Shell | Поиск не ломает inventory режим | PASS | Проверено пользователем: переходы wine/menu ↔ inventory корректны, inventory не ломается |

## 3) Найденные дефекты

| ID | Severity | Шаги воспроизведения | Ожидаемо | Фактически | Статус |
|---|---|---|---|---|---|
| BUG-001 | High | Шаг 0.2 quickcheck: войти в inventory-режим (`novikov_bh`) | Отображается inventory-экран с таблицей | Пустой экран (видна только верхняя панель) | Verified fixed |
| BUG-002 | Medium | B5: `Edit` → изменить `Unit` (например, `g` → `kg`) → `Save` | Значение обновляется и в основной таблице, и в History | В History значение обновляется, а в основной строке визуально откатывалось к старому | Verified fixed |
| BUG-003 | Medium | G2: нажать `Back` в inventory | Возврат на корректный стартовый экран ресторана (branding + menu buttons) | Наблюдался неконсистентный сценарий возврата; ожидание уточнено пользователем | Verified fixed |

## 3.1) Phase 4 technical re-check
- `inventory-data-provider` поддерживает queue metadata: `attempts`, `nextAttemptAt`, `lastError`.
- `drainQueue()` в `api`-режиме использует retry/backoff и `maxAttempts`.
- Операции синхронизации покрывают: `row_upsert`, `day_confirm`, `row_delete`.
- В orchestration добавлен hook `sendInventoryOperation` для API-интеграции.
- Подготовлен smoke-scenarios документ: `docs/inventory/INVENTORY_PHASE4_SMOKE_SCENARIOS_RU.md`.

## 3.2) Manual quickcheck feedback (user)
- Шаг 0.1: PASS.
- Шаг 0.2: PASS (после фикса BUG-001).
- Шаг 0.3: PASS (дата отображается корректно).
- Подтверждение: пользователь прислал скриншот с корректно отрисованным inventory-экраном.
- Блок 1 (B1/B2): PASS — добавление строки, заполнение обязательных полей и сохранение по `Enter` работают корректно.
- Блок 2 (B5): PASS после ретеста (BUG-002 закрыт).
- Блок 3 (E3): PASS — неожиданных предупреждений `[Inventory i18n] ...` не наблюдается.
- Блок 4 (F1): PASS — XLSX файл скачивается, лист существует, данные соответствуют inventory.
- Уточнение по G2: зафиксировано требование пользователя — Back должен возвращать на стартовый экран ресторана; фикс внесен, нужен ретест.
- Блок 5 (G2): PASS после ретеста — Back возвращает на стартовый экран ресторана.
- Блок 6 (G3): PASS — поиск в wine не ломает inventory после переключений.
- Уточнение по G3: подтверждено продуктовое поведение — при переходе из wine/menu в inventory строка поиска сбрасывается.

## 4) Артефакты
- Скриншоты: TBD
- Видео: TBD
- XLSX примеры: TBD
- Логи консоли: TBD

## 5) Решение по релизу
- Рекомендация: GO
- Условия GO (если есть): Выполнены — BLOCKED пункты закрыты, новых дефектов High/Critical не выявлено.

## 6) Статус ручного прогона
- Состояние: COMPLETED
- Следующий вход: не требуется для текущего релизного скоупа.
- Быстрый чеклист для прогона: `docs/inventory/INVENTORY_MANUAL_QA_QUICKCHECK_RU.md`
