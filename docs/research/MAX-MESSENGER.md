# Анализ миграции на MAX Messenger

> Дата исследования: 2025-12-23
> Статус: ✅ Анализ завершен

## Содержание

- [Обзор](#обзор)
- [Сравнительный анализ SDK](#сравнительный-анализ-sdk)
- [Ключевые объекты MAX WebApp](#ключевые-объекты-max-webapp)
- [Доступные пакеты и библиотеки](#доступные-пакеты-и-библиотеки)
- [Оценка сложности миграции](#оценка-сложности-миграции)
- [Выводы и рекомендации](#выводы-и-рекомендации)
- [Полезные ссылки](#полезные-ссылки)

---

## Обзор

MAX - российский мессенджер от VK, предоставляющий платформу для мини-приложений, аналогичную Telegram Mini Apps. Платформа поддерживает разработку веб-приложений на стандартных технологиях (HTML, CSS, JavaScript) с React/TypeScript SDK.

### Основные возможности MAX

- ✅ Мини-приложения (аналог Telegram Mini Apps)
- ✅ Чат-боты с Rich API
- ✅ Интеграция с Системой Быстрых Платежей (СБП)
- ✅ UI компоненты для React
- ✅ Биометрическая аутентификация
- ✅ QR-сканер
- ✅ Secure Storage

### Требования к разработке

- Хостинг с HTTPS (обязательно)
- URL до 1024 символов
- Модерация перед публикацией
- Соответствие законодательству РФ

---

## Сравнительный анализ SDK

### Таблица соответствия API

| Функция | Telegram Mini Apps | MAX Mini Apps | Совместимость |
|---------|-------------------|---------------|---------------|
| **Глобальный объект** | `window.Telegram.WebApp` | `window.WebApp` | ✅ Отлично |
| **Init Data (аутентификация)** | `initDataRaw`, `initData` | `initData`, `initDataUnsafe` | ✅ Полная |
| **Данные пользователя** | `initData.user` | `initDataUnsafe.user` | ✅ Идентичная структура |
| **Валидация данных** | `initData.hash` | `hash` | ✅ Полная |
| **Back Button** | `BackButton.show()/hide()` | `BackButton.show()/hide()` | ✅ Идентичный API |
| **Haptic Feedback** | `hapticFeedback.impactOccurred()` | `HapticFeedback.impactOccurred()` | ✅ Идентичный API |
| **Theme** | `themeParams`, `isDark` | CSS переменные + detection | 🟡 Требует адаптации |
| **Viewport** | `viewport.expand()` | `expand()` в WebApp | ✅ Полная |
| **Платежи** | `invoice.open()` | СБП API | 🔴 Требует переработки |
| **Открытие ссылок** | `openLink()` | `openLink()`, `openMaxLink()` | ✅ Расширенная |
| **События** | Разные события | `onEvent(eventName, callback)` | 🟡 Требует адаптации |
| **Cloud Storage** | `CloudStorage` | `DeviceStorage` | 🟡 Локальное хранилище |
| **Secure Storage** | ❌ Нет | `SecureStorage` | 🟢 Бонус! |
| **Biometrics** | ❌ Нет | `BiometricManager` | 🟢 Бонус! |
| **QR Scanner** | ❌ Нет | `openCodeReader()` | 🟢 Бонус! |
| **Share** | ❌ Ограничено | `shareContent()`, `shareMaxContent()` | 🟢 Бонус! |
| **Contact Request** | ❌ Нет | `requestContact()` | 🟢 Бонус! |
| **UI Components** | DaisyUI + Tailwind CSS | DaisyUI + Tailwind CSS | ✅ Одинаковые |
| **React Integration** | SDK хуки | `<MaxUI>` wrapper (опционально) | 🟡 Разные подходы |

### Легенда
- ✅ Полная совместимость - миграция тривиальна
- 🟡 Требует адаптации - небольшие изменения
- 🔴 Требует переработки - значительные изменения
- 🟢 Бонус - дополнительные возможности в MAX

---

## Ключевые объекты MAX WebApp

### 1. Подключение MAX Bridge

```html
<!-- Подключение библиотеки -->
<script src="https://max.ru/js/max-web-app.js"></script>
```

После подключения доступен глобальный объект `window.WebApp`.

### 2. Аутентификация и данные пользователя

```typescript
// Основные данные для аутентификации (аналог initDataRaw)
const authKey = window.WebApp.initData; // строка с параметрами запуска

// Небезопасные данные для отображения (аналог initDataUnsafe)
const userData = window.WebApp.initDataUnsafe.user;
/*
{
  id: number,
  first_name: string,
  last_name?: string,
  username?: string,
  photo_url?: string,
  language_code?: string
}
*/

// Хеш для валидации данных на backend
const validationHash = window.WebApp.hash;

// Параметры запуска (аналог startParam)
const startParam = window.WebApp.initDataUnsafe.start_param;

// Информация о чате (если запущено из чата)
const chatInfo = window.WebApp.initDataUnsafe.chat;
```

**Маппинг на текущую структуру:**

```typescript
// Было (Telegram):
const lp = useLaunchParams();
const authKey = lp.initDataRaw || "";
const user = lp.initData?.user;

// Станет (MAX):
const authKey = window.WebApp.initData || "";
const user = window.WebApp.initDataUnsafe.user;
```

### 3. Back Button (идентичный API!)

```typescript
// Показать кнопку "Назад"
window.WebApp.BackButton.show();

// Скрыть кнопку
window.WebApp.BackButton.hide();

// Обработка нажатия
window.WebApp.onEvent('WebAppBackButtonPressed', () => {
  // Логика возврата
  navigate(-1);
});

// Отписка от события
window.WebApp.offEvent('WebAppBackButtonPressed', handler);
```

**Миграция с Telegram:**

```typescript
// Было:
import { backButton } from '@telegram-apps/sdk-react';

backButton.show();
backButton.onClick(handler);

// Станет:
window.WebApp.BackButton.show();
window.WebApp.onEvent('WebAppBackButtonPressed', handler);
```

### 4. Haptic Feedback (идентичный API!)

```typescript
// Тактильная обратная связь при нажатии
window.WebApp.HapticFeedback.impactOccurred('soft');
// Варианты: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid'

// Обратная связь при изменении выбора
window.WebApp.HapticFeedback.selectionChanged();

// Обратная связь при уведомлении
window.WebApp.HapticFeedback.notificationOccurred('success');
// Варианты: 'success' | 'warning' | 'error'
```

**Миграция с Telegram:**

```typescript
// Было:
import { hapticFeedback } from '@telegram-apps/sdk-react';

hapticFeedback.impactOccurred('soft');

// Станет:
window.WebApp.HapticFeedback.impactOccurred('soft');
```

### 5. Viewport и UI

```typescript
// Развернуть приложение на весь экран
window.WebApp.expand();

// Проверка состояния
if (window.WebApp.isExpanded) {
  console.log('Приложение развернуто');
}

// Высота viewport (аналог viewport.height)
const viewportHeight = window.WebApp.viewportHeight;
const viewportStableHeight = window.WebApp.viewportStableHeight;

// Подтверждение перед закрытием
window.WebApp.enableClosingConfirmation();
window.WebApp.disableClosingConfirmation();

// Управление яркостью экрана
await window.WebApp.requestScreenMaxBrightness();
await window.WebApp.restoreScreenBrightness();
```

### 6. Открытие ссылок

```typescript
// Открыть внешнюю ссылку в браузере
window.WebApp.openLink('https://example.com');

// Открыть ссылку внутри MAX
window.WebApp.openMaxLink('https://max.ru/some-bot');
```

### 7. Storage (улучшенный вариант!)

```typescript
// Device Storage - локальное хранилище, привязанное к пользователю
await window.WebApp.DeviceStorage.setItem('key', 'value');
const value = await window.WebApp.DeviceStorage.getItem('key');
await window.WebApp.DeviceStorage.removeItem('key');
await window.WebApp.DeviceStorage.clear();

// Secure Storage - зашифрованное хранилище
await window.WebApp.SecureStorage.setItem('secret', 'sensitive-data');
const secret = await window.WebApp.SecureStorage.getItem('secret');

// Хранилище с биометрией
await window.WebApp.SecureStorage.setItem('token', 'auth-token', {
  biometric: true
});
```

### 8. Биометрическая аутентификация (бонус!)

```typescript
// Инициализация биометрии
await window.WebApp.BiometricManager.init();

// Проверка доступности
if (window.WebApp.BiometricManager.isInited) {
  const available = window.WebApp.BiometricManager.isBiometricAvailable;
  const type = window.WebApp.BiometricManager.biometricType; // 'finger' | 'face' | 'unknown'
}

// Аутентификация пользователя
const result = await window.WebApp.BiometricManager.authenticate({
  reason: 'Подтвердите вход в приложение'
});

if (result.success) {
  // Биометрия успешно пройдена
  const token = result.token;
}

// Сохранение токена в защищенное хранилище
await window.WebApp.BiometricManager.updateBiometricToken('new-token');
```

### 9. QR-сканер (бонус!)

```typescript
// Открыть сканер QR-кодов
const qrData = await window.WebApp.openCodeReader({
  fileSelect: true // разрешить выбор файла из галереи
});

if (qrData) {
  console.log('Отсканированные данные:', qrData);
}
```

### 10. Запрос контакта и шаринг (бонус!)

```typescript
// Запрос номера телефона пользователя (нативный диалог)
const contact = await window.WebApp.requestContact();
if (contact) {
  console.log('Телефон:', contact.phone_number);
}

// Поделиться контентом
window.WebApp.shareContent({
  text: 'Текст для шаринга',
  url: 'https://example.com'
});

// Поделиться внутри MAX
window.WebApp.shareMaxContent({
  text: 'Приглашаю в наш сервис!',
  botId: 'bot-username'
});
```

### 11. События

```typescript
// Доступные события
window.WebApp.onEvent('WebAppReady', () => {
  console.log('Приложение готово');
});

window.WebApp.onEvent('WebAppClose', () => {
  console.log('Приложение закрывается');
});

window.WebApp.onEvent('WebAppBackButtonPressed', () => {
  console.log('Нажата кнопка назад');
});

window.WebApp.onEvent('WebAppMainButtonClicked', () => {
  console.log('Нажата главная кнопка');
});

// Отписка от события
window.WebApp.offEvent('WebAppBackButtonPressed', handler);
```

### 12. Theme и внешний вид

```typescript
// Получение параметров темы
const colorScheme = window.WebApp.colorScheme; // 'light' | 'dark'

// CSS переменные автоматически доступны
// var(--tg-theme-bg-color)
// var(--tg-theme-text-color)
// var(--tg-theme-button-color)
// и т.д.

// Платформа пользователя
const platform = window.WebApp.platform; // 'android' | 'ios' | 'web'
const version = window.WebApp.version; // версия приложения MAX
```

---

## Доступные пакеты и библиотеки

### 1. MAX Bridge (Core)

```html
<!-- Подключение через CDN -->
<script src="https://max.ru/js/max-web-app.js"></script>
```

**Возможности:**
- Глобальный объект `window.WebApp`
- Все API методы
- События и обработчики
- Не требует npm установки

### 2. MAX UI для React

```bash
npm install @maxhub/max-ui
# или
yarn add @maxhub/max-ui
# или
pnpm add @maxhub/max-ui
```

**Пример использования:**

```typescript
import { createRoot } from 'react-dom/client';
import { MaxUI, Panel, Button } from '@maxhub/max-ui';
import '@maxhub/max-ui/dist/styles.css';

const App = () => (
  <MaxUI platform="android" colorScheme="dark">
    <Panel centeredX centeredY>
      <Button onClick={() => console.log('Click!')}>
        Нажми меня
      </Button>
    </Panel>
  </MaxUI>
);

createRoot(document.getElementById('root')!).render(<App />);
```

**Доступные компоненты:**
- `MaxUI` - корневой wrapper (аналог AppRoot из Telegram UI)
- `Panel` - контейнер с поддержкой центрирования
- `Button` - кнопка
- Polymorphic components
- TypeScript support из коробки
- React 18+ совместимость

**Документация:** [max-messenger.github.io/max-ui](https://max-messenger.github.io/max-ui)

### 3. MAX Bot API Client (TypeScript)

```bash
npm install @maxhub/max-bot-api
```

**Использование:**

```typescript
import { Bot } from '@maxhub/max-bot-api';

const bot = new Bot('YOUR_BOT_TOKEN');

// Обработка команд
bot.command('/start', (ctx) => {
  ctx.reply('Привет! Я бот на MAX.');
});

// Обработка событий
bot.on('message_created', (ctx) => {
  console.log('Новое сообщение:', ctx.message);
});

// Слушатели текста
bot.hears(/привет/i, (ctx) => {
  ctx.reply('И тебе привет!');
});

bot.catch((err) => {
  console.error('Ошибка:', err);
});
```

**Возможности:**
- Полный Bot API для MAX
- Command handling
- Event listeners
- Pattern matching
- Error handling
- TypeScript типизация

---

## Оценка сложности миграции

### Сложность по компонентам

| Компонент | Файлов затронуто | Сложность | Время (дни) |
|-----------|-----------------|-----------|-------------|
| **Аутентификация** | 32 файла | 🟡 Средняя | 3-5 |
| **Back Button** | 1 файл + хук | ✅ Низкая | 0.5 |
| **Haptic Feedback** | 1 компонент | ✅ Низкая | 0.5 |
| **Theme Management** | 1 файл | 🟡 Средняя | 1-2 |
| **Viewport** | 1 хук | ✅ Низкая | 0.5 |
| **Платежная система** | 1 модуль + backend | 🔴 Высокая | 3-4 |
| **UI компоненты** | 15+ компонентов | 🟡 Средняя | 2-3 |
| **Storage** | API интеграция | 🟡 Средняя | 1-2 |
| **Platform features** | SDK хуки | SDK методы | ✅ Низкая |
| **Редиректы и навигация** | 2 хука | ✅ Низкая | 1 |
| **Тестирование** | - | 🟡 Средняя | 3-5 |

### Общая оценка трудозатрат

**Оптимистичный сценарий:** 10-14 рабочих дней
**Реалистичный сценарий:** 14-21 рабочий день
**Пессимистичный сценарий:** 21-28 рабочих дней

### Факторы, влияющие на сроки

**Ускоряющие:**
- ✅ MAX SDK практически идентичен Telegram SDK
- ✅ Большинство методов имеют 1:1 маппинг
- ✅ Структура данных очень похожа
- ✅ React компоненты доступны из коробки
- ✅ Хорошая документация на русском языке

**Замедляющие:**
- ⚠️ Платежная система требует интеграции с СБП
- ⚠️ Backend должен поддерживать валидацию MAX initData
- ⚠️ Требуется тестирование на реальных устройствах
- ⚠️ Модерация приложения в MAX

---

## Выводы и рекомендации

### Основные выводы

1. **Миграция технически осуществима** - MAX SDK предоставляет все необходимые аналоги Telegram API
2. **Высокая степень совместимости** - большинство методов имеют практически идентичный API
3. **Бонусные возможности** - биометрия, QR-сканер, secure storage, шаринг
4. **Основная сложность** - платежная система и backend интеграция

### Рекомендуемый подход: Мультиплатформенность

Вместо полной замены Telegram на MAX, рекомендуется создать **абстракционный слой** для поддержки обеих платформ:

**Преимущества:**
- ✅ Сохранение текущей аудитории Telegram
- ✅ Постепенная миграция пользователей
- ✅ A/B тестирование платформ
- ✅ Снижение рисков
- ✅ Возможность вернуться к Telegram при необходимости

**Недостатки:**
- ⚠️ Усложнение кодовой базы
- ⚠️ Необходимость поддержки двух SDK
- ⚠️ Дополнительное время на разработку абстракции

### Следующие шаги

1. **Создать proof-of-concept** на MAX (2-3 дня)
2. **Разработать абстракционный слой** для мультиплатформенности (3-5 дней)
3. **Протестировать критичные функции** (аутентификация, платежи) (2-3 дня)
4. **Принять решение** о стратегии миграции
5. **Разработать детальный план** миграции

### Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| MAX API изменится | Средняя | Высокое | Версионирование, абстракция |
| Проблемы с платежами СБП | Средняя | Критическое | Раннее тестирование, fallback |
| Низкое качество документации | Низкая | Среднее | Использование примеров из GitHub |
| Backend не поддерживает MAX | Низкая | Критическое | Координация с backend командой |
| Проблемы с модерацией | Средняя | Высокое | Следование гайдлайнам MAX |

---

## Полезные ссылки

### Официальная документация MAX

- [MAX для разработчиков](https://dev.max.ru/) - главная страница
- [MAX Bridge API](https://dev.max.ru/docs/webapps/bridge) - документация WebApp объекта
- [Подключение мини-приложений](https://dev.max.ru/docs/webapps/introduction) - гайд по интеграции
- [MAX API Reference](https://dev.max.ru/docs-api) - справка по Bot API
- [MAX UI Components](https://max-messenger.github.io/max-ui) - Storybook с компонентами

### GitHub репозитории

- [max-bot-api-client-ts](https://github.com/max-messenger/max-bot-api-client-ts) - TypeScript Bot API
- [max-ui](https://github.com/max-messenger/max-ui) - React UI компоненты
- [max-bot-api-client-go](https://github.com/max-messenger/max-bot-api-client-go) - Go Bot API
- [max-bot-api-client-java](https://github.com/max-messenger/max-bot-api-client-java) - Java Bot API
- [Max Messenger Organization](https://github.com/max-messenger) - все репозитории

### Статьи и обзоры

- [MAX Messenger: The Russian Super App](https://umnico.com/blog/max-messenger/)
- [Мессенджер MAX для бизнеса](https://umnico.com/ru/blog/max-messenger-dly-businessa/)
- [Технический разбор Max (Хабр)](https://habr.com/ru/articles/938518/)

### Для сравнения

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Migrating from VK to Telegram](https://docs.telegram-mini-apps.com/platform/migrating-from-vk)

---

**Дата последнего обновления:** 2025-12-23
**Автор:** Claude Code
**Статус документа:** ✅ Актуально
