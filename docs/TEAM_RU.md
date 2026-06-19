# Hostera — Команда от naming до первой продажи

Оценка состава команды для запуска Wine Gallery как нового продуктового SaaS в Apple-стиле — от naming/branding до первой платящей продажи ресторану. Для продуктового контекста см. `PROJECT_OVERVIEW_RU.md`, для технического — `SPEC.md`.

## TL;DR

**6 core (full-time) + 3 fractional/part-time = 9 человек.**

Apple-style: малая команда с высокой talent density, каждый — senior/lead уровень, DRI-модель (один человек = одна функция).

Срок от naming до первой платящей продажи ресторану — **~9 месяцев**.

## Фазы запуска

| Месяц | Что происходит | Кто работает |
|---|---|---|
| 0-2 | Naming, brand identity, vision, дизайн-система, MVP scope | Founder, Designer, Engineer |
| 2-5 | Build MVP, marketing site, validation pricing с 5-10 «дружескими» рестораторами | + Sales/BD |
| 5-7 | Beta с 1-2 не-платящими ресторанами (Novikov BH-tier) | + Marketing, CS |
| 7-9 | Закрытие первой платящей продажи + onboarding | Все 6 |

---

## Core team (6 человек, full-time)

### 1. Founder / Product Owner (CEO)
**Apple-эквивалент:** Steve Jobs / Tim Cook.

**Что делает для Wine Gallery:**
- Финальное решение по naming, позиционированию, pricing tier-структуре.
- Vision и roadmap (что строить, что отбрасывать).
- **Первые 5 продаж лично** — это критично: только founder может закрывать первых premium-клиентов, потому что они покупают «человека», а не продукт.
- Привлечение seed-капитала (если поднимается раунд).
- Партнёрства верхнего уровня (Toast, Square, hospitality-консорциумы).

**Профиль:** 10+ лет в hospitality/SaaS, опыт founder/exec-уровня, сеть в premium-ресторанной индустрии. Доказанный navigator высокоценовых B2B продаж.

---

### 2. Head of Design / Creative Lead
**Apple-эквивалент:** Jony Ive.

**Что делает для Wine Gallery:**
- **Brand identity** — naming consult, лого, шрифты, цветовая палитра, brand voice.
- **Product UX/UI** — весь interaction design (hairline-система, photo-card layout, settings panel, анимации, и т.д.).
- **Marketing materials** — website, sales deck, demos, case study layout.
- **Design system** — обеспечивает, что все touch-points бренда (app, web, email, договоры) выглядят одинаково premium.
- Полная ответственность за то, что продукт **«ощущается как Apple»**.

**Профиль:** Senior product designer с brand-background, 8-12 лет опыта. Работал в premium-сегменте (luxury fashion, hospitality, или Apple/Airbnb-tier tech). Сам делает финальные mockups и спорит за каждый pixel.

---

### 3. Lead Engineer / CTO
**Apple-эквивалент:** Craig Federighi (но на более ранней стадии).

**Что делает для Wine Gallery:**
- **Архитектура** — single-file SPA → как масштабируется до 100+ ресторанов, когда переходить на модули, когда вводить server-side auth.
- **Full-stack build** — frontend (что мы видим), backend (когда понадобится — сейчас Google Sheets спасает), hosting, security.
- **Vendor management** — Google APIs, CDN (Vercel/Cloudflare), payment processor (Stripe), analytics.
- **Code quality + speed** — баланс: не over-engineer, но не накопить debt, который убьёт на 50-м клиенте.
- **Single-handedly строит MVP** в первые 5 месяцев.

**Профиль:** Senior/staff engineer с full-stack background (TypeScript/React + Node/Go + cloud). 8+ лет опыта. **Обязательно с опытом запуска 0→1 SaaS-продуктов.**

---

### 4. Head of GTM / Sales Lead
**Apple-эквивалент:** Phil Schiller в early-Apple дни.

**Что делает для Wine Gallery:**
- **ICP definition** — кто именно наш ресторан (cuisine, ценник, локация, размер группы).
- **Sales playbook** — discovery questions, demo script, objection handling, contract template.
- **Outbound в первые ~50 целевых ресторанов** — direct outreach к F&B директорам и owner-operators.
- **Pricing validation** — общается с рестораторами, выясняет willingness to pay, refines tier-структуру.
- **Партнёрства** — restaurant designers, F&B консультанты, hospitality consortiums, POS-ресселлеры (партнёр приводит клиента, мы платим revshare).
- Закрывает первую платящую продажу вместе с founder.

**Профиль:** Senior BD/sales lead с background в hospitality SaaS (Toast, Resy, SevenRooms, OpenTable). Сеть в премиум-ресторанной индустрии. Comfortable с $5-10K ACV сделками 1:1.

---

### 5. Marketing / Brand Manager
**Apple-эквивалент:** Apple Marketing Communications.

**Что делает для Wine Gallery:**
- **Website + landing pages** — copy, layout (с Designer), SEO для restaurant-related queries.
- **Content marketing** — blog/case studies про premium restaurants, дизайн ресторанного UX, тренды цифрового меню.
- **PR** — pitch в industry press (Eater, Restaurant Business, F&B Forbes section, Michelin Guide blog).
- **Email sequences** — nurture для leads, onboarding для новых клиентов, retention.
- **Brand voice** — гарантирует, что Wine Gallery звучит одинаково premium везде (в продукте, на сайте, в emails, на встречах).
- **Demand generation** — генерит inbound leads, чтобы Sales не работал только outbound.

**Профиль:** Senior product/brand marketer, 6-10 лет опыта. B2B SaaS background + понимание hospitality/luxury. Сам пишет (не зависит от агентств).

---

### 6. Customer Success / Onboarding Lead
**Apple-эквивалент:** AppleCare leadership + Apple Retail Trainer гибрид.

**Что делает для Wine Gallery:**
- **White-glove onboarding** — premium-клиенты ожидают, что **за них всё сделают**. CS лично переносит первое меню ресторана в Google Sheets, договаривается о фотосессии (или координирует с фотографом), настраивает брендинг, тренирует персонал.
- **Photo coordination** — premium restaurants хотят profession photos их блюд; CS либо организует, либо помогает выбрать локального fotographer.
- **Training** — обучает менеджеров пользоваться Google Sheets для обновления меню (часто это барьер: они «не айтишники»).
- **Quarterly business review (QBR)** — раз в квартал session с клиентом: что улучшить, какие метрики, что добавить.
- **First-year retention** — самый критичный год. Если ресторан остался — он надолго.

**Профиль:** Senior CS manager с премиум-клиентским опытом. Любит F&B, понимает культуру ресторанов. Умеет работать руками (правит Google Sheets, объясняет нетехническим людям).

---

## Fractional / part-time (3 человека, по запросу)

### 7. Legal Counsel (fractional)
Контракты SaaS (master service agreement, DPA, terms of service), IP-протекция, GDPR / CCPA compliance, immigration (если international hires). **~10-15 часов/месяц.** $200-500/час, специализация на B2B SaaS.

### 8. Финансист / Accountant (fractional)
Подписочный billing (Stripe setup, MRR/ARR tracking, churn metrics), налоги (sales tax в каждом штате — premium SaaS pain point), revenue recognition, cap table maintenance. **~5-10 часов/месяц.** Лучше через ScaleFactor / Pilot или local CFO-as-a-service.

### 9. Industry Advisor (equity-based)
**Бывший** F&B директор или GM премиум-ресторана топового уровня. Открывает двери на ранних встречах, валидирует продуктовые решения insider-perspective, представляется как «у нас в команде [Имя]» — credibility booster. **0.25-0.5% equity** за серьёзный совет.

---

## Apple-philosophy notes

**1. Talent density > headcount.** Один senior лучше трёх mid. Apple намеренно держит маленькие команды (например, изначальная iPod команда — менее 20 человек).

**2. DRI-модель.** Один человек = одна функция, без размытой ответственности. Если что-то идёт не так — ясно, кого спросить.

**3. Founder делает первые продажи.** Apple Vintage Steve Jobs делал personal demos для журналистов в первые годы Mac. Без этого не валидируется product-market fit.

**4. Design и Engineering должны жить рядом.** Apple-органично разделение — Design и Engineering работают в одном open-space с момента концепции. Не «дизайн отдаёт макет инженеру». Они вместе строят.

**5. Нет «Customer Support» — есть «Customer Success».** Премиум-клиенты не звонят с проблемами; они **ожидают**, что проблемы предвосхищаются. CS — proactive, не reactive.

**6. Sales — не отдельный департамент.** До 50 клиентов Sales работает локоть-к-локтю с Product, чтобы каждая sales-call возвращалась в product backlog.

---

## Если бюджет ограничен (lean version)

Можно стартануть с **4 человек**, совмещающих роли:
- **Founder/CEO** — берёт Sales + Marketing strategy.
- **Designer** — берёт Brand + всё креативное.
- **Engineer** — full-stack solo.
- **Customer Success** — берёт onboarding + первый support.

Это grindy, медленнее, выше риск burnout. Но возможно для bootstrapped старт.

**Apple-recommended (как я бы делал):** 6 full-time. Это инвестиция, но скорость и качество окупаются на первом же Enterprise-клиенте ($349/мес × 12 мес = $4188 ARR от одного location; нужно ~30-40 ресторанов в Y1, чтобы покрыть payroll команды и иметь margin).

---

## Org структура

```
                  Founder / CEO (DRI: product vision, fundraising)
                          │
        ┌──────────────┬──┴──┬──────────────┬──────────────┐
        │              │     │              │              │
     Design          Eng    Sales        Marketing        CS
     (Lead)         (CTO)   (GTM Lead)   (Brand Mgr)    (Onboarding)
        │              │     │              │              │
   Brand+Product    Stack  Outbound     Site+Content   White-glove
   Identity                            +Press          onboarding
                                                       +QBR

Fractional support (cross-functional):
- Legal (contracts, IP, compliance)
- Finance (billing, tax, metrics)
- Industry Advisor (door-opener, validator)
```

Плоская структура, founder-led. Никаких middle managers до 30+ человек.
