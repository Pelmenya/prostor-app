# Платежи — стратегия реализации

## Прогресс

| Шаг | Описание                                            | Платформа | Прогресс |
| --- | --------------------------------------------------- | --------- | -------- |
| 0   | Бэк: рефакторинг очереди — BullMQ вместо самописной | Бэк       | ⬜ 0%    |
| 1   | Бэк: `YookassaService.createPayment()` + webhook    | Бэк       | ⬜ 0%    |
| 2   | Бэк: `PaymentWebController` (web/create + webhook)  | Бэк       | ⬜ 0%    |
| 3   | Фронт: `WebAdapter.pay()` (redirect/iframe ЮKassa)  | Web       | ⬜ 0%    |
| 4   | Фронт: checkout-page интеграция с adapter.pay()     | Web       | ⬜ 0%    |
| 5   | Тесты                                               | Оба       | ⬜ 0%    |

## Текущее состояние

### Telegram Mini App (работает в проде)

```
Корзина
  → POST /checkout/session (cartState, email, deliveryType, realEstateId)
  → Бэк: Redis сессия + TelegramPaymentService.createInvoiceLink()
  → Фронт: window.Telegram.WebApp.openInvoice(link)
  → Telegram нативный UI → ЮKassa как провайдер
  → pre_checkout_query → бот одобряет
  → successful_payment → Order создаётся → очередь → МойСклад + уведомления
```

**Ключевое:** ЮKassa работает только как провайдер **внутри** Telegram Payments. Прямой интеграции с ЮKassa API для создания платежей нет.

### Web (нужно реализовать)

На вебе `openInvoice()` не существует — это Telegram SDK. ЮKassa на вебе работает через **виджет** (iframe) или **redirect** на страницу оплаты.

## Архитектура: Adapter Pattern

```
features/checkout → PlatformAdapter.pay(order)
                        ├── TelegramAdapter → openInvoice(invoiceLink)     ← работает
                        ├── WebAdapter      → redirect на confirmationUrl  ← нужно сделать
                        └── MaxAdapter      → MAX Payments API             ← TODO
```

Чекаут-страница **не знает** про конкретную платёжку. Вызывает `adapter.pay()` — адаптер решает как платить.

## Шаг 0: Бэкенд — рефакторинг очереди на BullMQ

### Проблема

Сейчас очередь платежей — **самописная**: Redis list + cron каждые 30 сек (`PaymentWebhookQueueService`). Для MVP это работало, но для реальных платежей это ненадёжно:

- **Нет retry с backoff** — если обработка упала, платёж потерян до следующего cron-цикла
- **Нет dead letter queue** — перманентно failed платежи крутятся в цикле
- **Нет concurrency control** — при нагрузке cron может запустить обработку дважды
- **Нет мониторинга** — нет dashboard, нет метрик, нет alerting
- **30 сек задержка** — пользователь ждёт полминуты между оплатой и подтверждением

### Решение: BullMQ

BullMQ уже в плане (CLAUDE.md, шаг 4 Strangle Fig Migration). NestJS имеет нативную интеграцию `@nestjs/bullmq`.

```
npm install @nestjs/bullmq bullmq
```

### Что заменяем

| Сейчас (самописное)                           | BullMQ                                                       |
| --------------------------------------------- | ------------------------------------------------------------ |
| `PaymentWebhookQueueService.enqueuePayment()` | `paymentQueue.add('process-payment', data)`                  |
| Cron каждые 30 сек                            | Event-driven: обработка мгновенно при добавлении в очередь   |
| Нет retry                                     | `attempts: 3, backoff: { type: 'exponential', delay: 5000 }` |
| Нет dead letter                               | `removeOnFail: false` → видно в dashboard                    |
| Нет мониторинга                               | Bull Board dashboard (`@bull-board/nestjs`)                  |

### Архитектура

```typescript
// payment-queue.module.ts
@Module({
    imports: [BullModule.registerQueue({ name: 'payment' })],
    providers: [PaymentQueueProcessor],
})
// payment-queue.processor.ts
@Processor('payment')
export class PaymentQueueProcessor {
    @Process('process-payment')
    async handle(job: Job<TPaymentJob>) {
        // Существующая логика из PaymentWebhookQueueService.processPayment()
        // Retry, backoff, dead letter — BullMQ делает автоматически
    }
}
```

### Очереди для других задач (заодно)

| Очередь         | Задача                                          |
| --------------- | ----------------------------------------------- |
| `payment`       | Обработка платежей (МойСклад sync, уведомления) |
| `email`         | Отправка email (welcome, verification, reset)   |
| `notification`  | Push-уведомления                                |
| `moysklad-sync` | Фоновая синхронизация с МойСклад                |

### Ветка

`feature/bullmq-queues` от `main`

---

## Шаг 1: Бэкенд — YookassaService.createPayment()

### Что есть

`YookassaService` уже существует в `src/modules/payment/yookassa/yookassa.service.ts`, но только для получения info о комиссии. Конфиги уже в `.env`:

```env
YOOKASSA_API_HOST=https://api.yookassa.ru/v3
YOOKASSA_SHOP_ID=...
YOOKASSA_API_KEY=...
YOOKASSA_TAX_SYSTEM_CODE=1
YOOKASSA_VAT_RATE=22
```

### Что добавить

```typescript
// yookassa.service.ts — расширить
async createPayment(params: {
    amount: number;          // в копейках
    description: string;
    email: string;
    orderId: number;
    returnUrl: string;       // куда вернуть после оплаты
}): Promise<{
    paymentId: string;
    confirmationUrl: string; // URL для redirect/iframe
    status: string;
}> {
    // POST https://api.yookassa.ru/v3/payments
    // Authorization: Basic (SHOP_ID:API_KEY)
    // Idempotency-Key: uuid
    // Body: {
    //   amount: { value: "100.00", currency: "RUB" },
    //   confirmation: { type: "redirect", return_url: returnUrl },
    //   capture: true,
    //   description,
    //   receipt: { ... фискальный чек ... },
    //   metadata: { orderId }
    // }
}
```

Фискальный чек — уже реализован в `build-provider-data-from-cart-state.ts`. Переиспользуем.

## Шаг 2: Бэкенд — PaymentWebController

```typescript
// src/modules/payment/payment-web.controller.ts

@Post('web/create')
@UseGuards(AuthGuard)
async createWebPayment(@Req() req, @Body() body: CreateWebPaymentDto) {
    // 1. Создать Order (или взять из checkout session)
    // 2. YookassaService.createPayment()
    // 3. Вернуть { paymentId, confirmationUrl, orderId }
}

@Post('webhook/yookassa')
async handleYookassaWebhook(@Body() body: YookassaWebhookDto) {
    // 1. Проверить подпись (IP whitelist или signature)
    // 2. Обновить Order.paymentStatus
    // 3. PaymentWebhookQueueService.enqueuePayment() ← уже есть!
    // Дальше: синхронизация МойСклад, уведомления — всё работает
}
```

### Webhook от ЮKassa

ЮKassa отправляет POST на наш URL при изменении статуса платежа:

```json
{
    "type": "notification",
    "event": "payment.succeeded",
    "object": {
        "id": "payment_id",
        "status": "succeeded",
        "amount": { "value": "100.00", "currency": "RUB" },
        "metadata": { "orderId": 123 }
    }
}
```

Безопасность:

- IP whitelist ЮKassa: `185.71.76.0/27`, `185.71.77.0/27`, `77.75.153.0/25`
- Или проверка через `GET /payments/{id}` после получения webhook

## Шаг 3: Фронт — WebAdapter.pay()

```typescript
// shared/lib/platform/adapters/web-adapter.ts

async pay(params: {
    orderId: number;
    amount: number;
    email: string;
}): Promise<{ success: boolean }> {
    // 1. POST /payment/web/create → { confirmationUrl }
    // 2. window.location.href = confirmationUrl
    //    (или открыть ЮKassa виджет в iframe)
    // 3. После оплаты ЮKassa redirect → /checkout/success?orderId=123
}
```

### Return URL flow

```
Пользователь → ЮKassa (оплата) → redirect → /checkout/success?orderId=123
                                               ↓
                                  Страница "Заказ оплачен"
                                  (проверяет статус через GET /order/:id)
```

### Альтернатива: ЮKassa виджет (iframe)

```html
<!-- Встраивается на checkout-page -->
<script src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js"></script>
<div id="payment-form"></div>

<script>
    const checkout = new window.YooMoneyCheckoutWidget({
        confirmation_token: 'токен_от_бэка',
        return_url: 'https://site.ru/checkout/success',
    });
    checkout.render('payment-form');
</script>
```

**Решение:** начать с redirect (проще), потом перейти на виджет (лучший UX).

## Шаг 4: Checkout-page интеграция

```typescript
// views/checkout/ui/checkout-page.tsx

const { pay } = useAuth(); // PlatformAdapter

const handlePay = async () => {
    // 1. Создать заказ (POST /order/create-from-cart)
    // 2. adapter.pay({ orderId, amount, email })
    // 3. Адаптер решает: redirect на ЮKassa / openInvoice / MAX API
};
```

Checkout-page **не импортирует** ЮKassa SDK, Telegram Payments, MAX Payments. Только `adapter.pay()`.

## Шаг 5: Тесты

### Бэкенд

- `YookassaService.createPayment()` — моки HTTP к ЮKassa API
- `PaymentWebController` — e2e тесты endpoint'ов
- Webhook — валидация, обновление статуса, идемпотентность

### Фронтенд

- `WebAdapter.pay()` — мок apiClient, проверка redirect
- Checkout-page — мок adapter.pay(), UI flow
- Proxy: `/checkout/success` в маршрутах

## Что уже готово на бэке (переиспользуем)

| Модуль                                     | Что делает                     | Готов? |
| ------------------------------------------ | ------------------------------ | ------ |
| `PaymentWebhookQueueService`               | Redis очередь + cron обработка | ✅     |
| `OrderService.createOrderFromSession()`    | Создание заказа из сессии      | ✅     |
| `OrderService.syncOrderToMoySklad()`       | Синхронизация с МойСклад       | ✅     |
| `OrderService.syncPaymentAfterOrderPaid()` | Резерв товаров, PaymentIn      | ✅     |
| `build-provider-data-from-cart-state.ts`   | Фискальный чек (receipt)       | ✅     |
| `map-ms-vat-to-yookassa.ts`                | Маппинг НДС                    | ✅     |
| `YookassaService.getPaymentInfo()`         | Получение info о платеже       | ✅     |
| Уведомления (клиент, куратор, мастер)      | Email + Telegram push          | ✅     |

**Нужно добавить:**

- `YookassaService.createPayment()` — ~50 строк
- `PaymentWebController` — ~80 строк
- Webhook handler — ~40 строк
- `WebAdapter.pay()` — ~20 строк
- Страница `/checkout/success` — ~30 строк

## Конфигурация

### .env (бэк) — уже есть

```env
YOOKASSA_SHOP_ID=...
YOOKASSA_API_KEY=...
YOOKASSA_TAX_SYSTEM_CODE=1
YOOKASSA_VAT_RATE=22
ENABLE_PAYMENTS=true
```

### .env (фронт) — добавить

```env
NEXT_PUBLIC_ENABLE_PAYMENTS=true   # показать/скрыть кнопку оплаты
```

## Ветки

- **Бэк:** `feature/web-payments` от `main`
- **Фронт:** `feature/web-payments` от `dev`
