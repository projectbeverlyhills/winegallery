# Phase 4 Smoke-Check Scenarios (Inventory)

Дата: 2026-03-08

## Цель
Быстро проверить, что provider-абстракция и очередь sync не ломают текущий UX и корректно ведут себя в local/api режимах.

## Предусловия
- Ресторан `novikov_bh` (inventory enabled).
- Ресторан `peopletalk` (inventory disabled) для negative-check.
- В `features.inventory` можно переключить `dataProvider.mode` между `local` и `api`.

## Сценарии

### S1 — Feature-flag guard
1. Открыть `novikov_bh` → inventory доступен.
2. Открыть `peopletalk` → inventory недоступен.
Ожидаемо: guards не изменились после Phase 4.

### S2 — Local provider baseline
1. Установить `dataProvider.mode=local`.
2. Добавить/сохранить строку, подтвердить день, удалить строку.
Ожидаемо: все операции выполняются как раньше; queue может накапливаться, но UX не блокируется.

### S3 — Queue contract coverage
1. Выполнить `row_upsert`, `day_confirm`, `row_delete`.
2. Проверить queue в localStorage (`::sync_queue::pastry`).
Ожидаемо: в queue появляются операции всех 3 типов.

### S4 — API mode without sender
1. Установить `dataProvider.mode=api` без `sendInventoryOperation`.
2. Перезапустить inventory (mount).
Ожидаемо: `drainQueue()` не падает, возвращает warning, queue сохраняется.

### S5 — API mode with failing sender
1. Подключить `sendInventoryOperation`, который возвращает reject.
2. Запустить `drainQueue()` несколько раз.
Ожидаемо: увеличиваются `attempts`, выставляется `nextAttemptAt` по backoff, после `maxAttempts` оп падает в drop с warning.

### S6 — API mode with successful sender
1. Подключить `sendInventoryOperation`, который resolve.
2. Запустить `drainQueue()`.
Ожидаемо: `processed > 0`, операции удаляются из queue.

### S7 — Regression UX
1. Проверить CRUD, Enter-save, range/history, export, back button.
Ожидаемо: визуальное поведение идентично до Phase 4.

## Критерии PASS
- Нет новых ошибок в diagnostics.
- Нет критичных regressions в inventory UX.
- Queue lifecycle предсказуем в local/api режимах.
