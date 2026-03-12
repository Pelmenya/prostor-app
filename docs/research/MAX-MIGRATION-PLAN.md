# План миграции на MAX Messenger

> Дата создания: 2025-12-23
> Статус: 📋 Планирование

## Содержание

- [Обзор](#обзор)
- [Стратегия миграции](#стратегия-миграции)
- [Фазы разработки](#фазы-разработки)
- [Детальные задачи](#детальные-задачи)
- [Риски и митигация](#риски-и-митигация)
- [Чеклист миграции](#чеклист-миграции)

---

## Обзор

### Цели миграции

- 🎯 Обеспечить работу приложения в MAX Messenger
- 🎯 Минимизировать изменения в бизнес-логике
- 🎯 Сохранить возможность работы в Telegram (мультиплатформенность)
- 🎯 Использовать новые возможности MAX (биометрия, QR-сканер)

### Метрики успеха

- ✅ Все ключевые функции работают в MAX
- ✅ Аутентификация и платежи функционируют корректно
- ✅ UI соответствует гайдлайнам MAX
- ✅ Performance не хуже, чем в Telegram
- ✅ Покрытие тестами критичных путей

### Ограничения

- ⏱️ **Срок:** 14-21 рабочий день
- 👥 **Команда:** определяется
- 💰 **Бюджет:** определяется
- 🔧 **Backend:** требуется координация с backend командой

---

## Стратегия миграции

### Выбранная стратегия: Мультиплатформенность

Создание **адаптационного слоя** для поддержки обеих платформ одновременно.

**Обоснование:**
- ✅ Не теряем текущую аудиторию Telegram
- ✅ Можем постепенно мигрировать пользователей
- ✅ Возможность A/B тестирования
- ✅ Снижение рисков полной миграции
- ✅ Путь назад в случае проблем

### Архитектурный подход

```
┌─────────────────────────────────────────────┐
│          React Application                  │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────▼──────────────┐
      │   Messenger Adapter      │  ← Новый слой абстракции
      │   (Platform Detection)   │
      └───────────┬──────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼───────┐
│ Telegram SDK   │  │   MAX SDK    │
│ Implementation │  │ Implementation│
└────────────────┘  └──────────────┘
```

### Принципы разработки

1. **Single Responsibility** - каждый адаптер отвечает только за свою платформу
2. **Open/Closed** - легко добавить новую платформу (VK, web)
3. **Dependency Inversion** - бизнес-логика не зависит от конкретной платформы
4. **Don't Repeat Yourself** - общий код вынесен в базовые классы

---

## Фазы разработки

### Фаза 1: Подготовка и исследование (2-3 дня)

**Цели:**
- Настроить окружение для разработки под MAX
- Создать тестовый бот в MAX
- Проверить работоспособность базовых функций

**Задачи:**
- [ ] Зарегистрировать бота в MAX через партнерскую платформу
- [ ] Подключить MAX Bridge в проекте
- [ ] Установить `@maxhub/max-ui`
- [ ] Создать простое proof-of-concept приложение
- [ ] Протестировать аутентификацию через MAX
- [ ] Проверить работу на реальных устройствах (Android, iOS)

**Deliverables:**
- ✅ Работающий тестовый бот в MAX
- ✅ PoC приложение с базовой функциональностью
- ✅ Документация по настройке окружения

---

### Фаза 2: Создание адаптационного слоя (3-5 дней)

**Цели:**
- Создать абстракцию над Telegram и MAX SDK
- Обеспечить единый API для бизнес-логики

**Задачи:**
- [ ] Создать интерфейсы для messenger SDK
- [ ] Реализовать Telegram adapter
- [ ] Реализовать MAX adapter
- [ ] Создать platform detection утилиту
- [ ] Написать unit-тесты для адаптеров
- [ ] Создать mock адаптер для тестирования

**Структура файлов:**
```
src/shared/lib/messenger/
├── types/
│   ├── messenger.types.ts          # Общие интерфейсы
│   ├── user.types.ts               # Типы пользователя
│   └── platform.types.ts           # Типы платформ
├── adapters/
│   ├── telegram-adapter.ts         # Telegram реализация
│   ├── max-adapter.ts              # MAX реализация
│   └── base-adapter.ts             # Базовый класс
├── hooks/
│   ├── use-messenger.ts            # Основной хук
│   ├── use-auth.ts                 # Хук аутентификации
│   ├── use-back-button.ts          # Хук back button
│   └── use-haptic.ts               # Хук haptic feedback
├── utils/
│   ├── detect-platform.ts          # Определение платформы
│   └── validate-init-data.ts       # Валидация данных
└── index.ts                        # Экспорты
```

**Deliverables:**
- ✅ Полностью функциональный адаптационный слой
- ✅ Тесты с покрытием >80%
- ✅ Документация API

---

### Фаза 3: Миграция компонентов (5-7 дней)

**Цели:**
- Заменить прямые вызовы Telegram SDK на адаптер
- Обновить UI компоненты

#### 3.1. Аутентификация (2-3 дня)

**Файлы для обновления:**
- `src/shared/lib/hooks/use-app-initialization.ts`
- Все 32 файла, использующие `lp.initDataRaw`
- Backend API endpoints (координация)

**Задачи:**
- [ ] Обновить `use-app-initialization` для работы с адаптером
- [ ] Заменить все `useLaunchParams()` на `useMessenger()`
- [ ] Обновить Redux slices для универсальных данных
- [ ] Протестировать аутентификацию в обеих платформах
- [ ] Координация с backend для поддержки MAX initData

#### 3.2. UI и навигация (1-2 дня)

**Файлы для обновления:**
- `src/shared/lib/hooks/use-telegram-back-button.ts` → `use-back-button.ts`
- `src/shared/lib/hooks/use-telegram-fullscreen.ts` → `use-fullscreen.ts`
- `src/shared/ui/components/tg-glass-btn/` → универсальный компонент
- `src/components/App.tsx` - theme management

**Задачи:**
- [ ] Обновить хук back button для работы с адаптером
- [ ] Обновить хук fullscreen
- [ ] Заменить haptic feedback на универсальный
- [ ] Обновить theme detection и применение

#### 3.3. UI адаптация (1-2 дня)

**Подход:** Используем существующий DaisyUI + Tailwind CSS для обеих платформ

**Задачи:**
- [ ] Создать `<PlatformProvider>` wrapper для platform-specific логики
- [ ] Обновить корневой компонент `App.tsx`
- [ ] Убрать зависимость от `@telegram-apps/telegram-ui` (если есть)
- [ ] Протестировать UI в обеих платформах
- [ ] Адаптировать theme variables под MAX (опционально)

---

### Фаза 4: Платежная система (3-4 дня)

**Цели:**
- Интегрировать СБП для MAX
- Сохранить Telegram Payments

**Задачи:**
- [ ] Изучить MAX Payment API
- [ ] Создать payment adapter
- [ ] Обновить `use-payment.ts` hook
- [ ] Интеграция с backend для СБП
- [ ] Тестирование платежей (sandbox)
- [ ] Обработка ошибок и edge cases

**Риски:**
- 🔴 Высокая сложность интеграции СБП
- 🔴 Требуется тестовый счет для СБП
- 🔴 Разные flow для Telegram и MAX

---

### Фаза 5: Дополнительные функции (2-3 дня)

#### 5.1. Storage (1 день)

**Задачи:**
- [ ] Создать unified storage adapter
- [ ] Маппинг CloudStorage (Telegram) → DeviceStorage (MAX)
- [ ] Опционально: использовать SecureStorage для чувствительных данных

#### 5.2. Редиректы и deep links (1 день)

**Файлы:**
- `src/shared/lib/hooks/use-telegram-redirect.ts`
- `src/shared/lib/hooks/use-redirect-path.ts`

**Задачи:**
- [ ] Обновить парсинг startParam для MAX
- [ ] Протестировать deep links в обеих платформах
- [ ] Обновить генерацию ссылок приглашения

#### 5.3. Опциональные возможности (1 день)

**Стратегия:** Feature flags для platform-specific функций

**Задачи:**
- [ ] Создать систему feature flags
- [ ] Отключить platform-specific функции где не поддерживается
- [ ] Обработка ошибок для недоступных фич
- [ ] Документация для разработчиков

---

### Фаза 6: Тестирование и отладка (3-5 дней)

**Цели:**
- Обеспечить стабильную работу на обеих платформах
- Выявить и исправить критичные баги

#### 6.1. Unit тесты (1-2 дня)

**Задачи:**
- [ ] Тесты для всех адаптеров
- [ ] Тесты для хуков
- [ ] Тесты для platform detection
- [ ] Покрытие >80%

#### 6.2. Integration тесты (1-2 дня)

**Задачи:**
- [ ] E2E тесты критичных путей
- [ ] Тесты аутентификации
- [ ] Тесты платежей (sandbox)
- [ ] Тесты навигации

#### 6.3. Ручное тестирование (1-2 дня)

**Устройства:**
- Android (MAX app)
- iOS (MAX app)
- Android (Telegram)
- iOS (Telegram)
- Desktop (Telegram)

**Сценарии:**
- [ ] Регистрация нового пользователя
- [ ] Авторизация существующего пользователя
- [ ] Создание заказа
- [ ] Оплата заказа
- [ ] Добавление недвижимости
- [ ] Работа с картой
- [ ] Консультации
- [ ] Переходы по deep links

---

### Фаза 7: Деплой и мониторинг (1-2 дня)

**Цели:**
- Безопасный релиз в продакшен
- Мониторинг метрик

**Задачи:**
- [ ] Создать feature flag для MAX платформы
- [ ] Деплой на staging
- [ ] Smoke testing на staging
- [ ] Постепенный rollout (10% → 50% → 100%)
- [ ] Настроить мониторинг ошибок
- [ ] Отслеживание метрик использования
- [ ] Подготовить rollback план

---

## Детальные задачи

### Создание Messenger Adapter

#### Интерфейс адаптера

```typescript
// src/shared/lib/messenger/types/messenger.types.ts

export type Platform = 'telegram' | 'max' | 'web';

export interface MessengerUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  languageCode?: string;
}

export interface MessengerInitData {
  authKey: string;      // Для отправки на backend
  user?: MessengerUser;
  hash: string;         // Для валидации
  startParam?: string;  // Параметры запуска
}

export interface BackButtonController {
  show(): void;
  hide(): void;
  isVisible: boolean;
  onClick(handler: () => void): void;
  offClick(handler: () => void): void;
}

export interface HapticFeedback {
  impactOccurred(style: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid'): void;
  selectionChanged(): void;
  notificationOccurred(type: 'success' | 'warning' | 'error'): void;
}

export interface ThemeParams {
  isDark: boolean;
  colorScheme: 'light' | 'dark';
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
}

export interface ViewportController {
  expand(): Promise<void>;
  isExpanded: boolean;
  height: number;
  stableHeight: number;
}

export interface StorageController {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface MessengerAdapter {
  readonly platform: Platform;
  readonly isAvailable: boolean;

  // Инициализация
  init(): Promise<void>;
  ready(): void;

  // Данные
  getInitData(): MessengerInitData;
  getUser(): MessengerUser | undefined;

  // UI контроллеры
  backButton: BackButtonController;
  haptic: HapticFeedback;
  theme: ThemeParams;
  viewport: ViewportController;
  storage: StorageController;

  // Утилиты
  openLink(url: string): void;
  close(): void;

  // Платежи
  openInvoice?(invoiceUrl: string): Promise<'paid' | 'cancelled' | 'failed'>;

  // События
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
}
```

#### Реализация Telegram Adapter

```typescript
// src/shared/lib/messenger/adapters/telegram-adapter.ts

import {
  backButton,
  miniApp,
  themeParams,
  viewport,
  initData,
  hapticFeedback,
  cloudStorage,
  openLink,
  invoice,
  useLaunchParams,
} from '@telegram-apps/sdk-react';

export class TelegramAdapter implements MessengerAdapter {
  readonly platform: Platform = 'telegram';

  get isAvailable(): boolean {
    return typeof window !== 'undefined' &&
           window.Telegram?.WebApp !== undefined;
  }

  async init(): Promise<void> {
    // Уже инициализировано в src/init.ts
  }

  ready(): void {
    miniApp.ready();
  }

  getInitData(): MessengerInitData {
    const lp = useLaunchParams();

    return {
      authKey: lp.initDataRaw || '',
      user: lp.initData?.user ? {
        id: lp.initData.user.id,
        firstName: lp.initData.user.firstName,
        lastName: lp.initData.user.lastName,
        username: lp.initData.user.username,
        photoUrl: lp.initData.user.photoUrl,
        languageCode: lp.initData.user.languageCode,
      } : undefined,
      hash: lp.initData?.hash || '',
      startParam: lp.startParam,
    };
  }

  getUser(): MessengerUser | undefined {
    return this.getInitData().user;
  }

  get backButton(): BackButtonController {
    return {
      show: () => backButton.show(),
      hide: () => backButton.hide(),
      isVisible: backButton.isVisible(),
      onClick: (handler) => backButton.onClick(handler),
      offClick: (handler) => backButton.offClick(handler),
    };
  }

  get haptic(): HapticFeedback {
    return {
      impactOccurred: (style) => {
        hapticFeedback.impactOccurred(style);
      },
      selectionChanged: () => {
        hapticFeedback.selectionChanged();
      },
      notificationOccurred: (type) => {
        hapticFeedback.notificationOccurred(type);
      },
    };
  }

  // ... остальные методы
}
```

#### Реализация MAX Adapter

```typescript
// src/shared/lib/messenger/adapters/max-adapter.ts

export class MaxAdapter implements MessengerAdapter {
  readonly platform: Platform = 'max';

  private get webApp() {
    return window.WebApp;
  }

  get isAvailable(): boolean {
    return typeof window !== 'undefined' &&
           window.WebApp !== undefined;
  }

  async init(): Promise<void> {
    // MAX Bridge загружается через <script> тег
    if (!this.isAvailable) {
      throw new Error('MAX WebApp is not available');
    }
  }

  ready(): void {
    // MAX автоматически готов
  }

  getInitData(): MessengerInitData {
    return {
      authKey: this.webApp.initData || '',
      user: this.webApp.initDataUnsafe?.user ? {
        id: this.webApp.initDataUnsafe.user.id,
        firstName: this.webApp.initDataUnsafe.user.first_name,
        lastName: this.webApp.initDataUnsafe.user.last_name,
        username: this.webApp.initDataUnsafe.user.username,
        photoUrl: this.webApp.initDataUnsafe.user.photo_url,
        languageCode: this.webApp.initDataUnsafe.user.language_code,
      } : undefined,
      hash: this.webApp.hash || '',
      startParam: this.webApp.initDataUnsafe?.start_param,
    };
  }

  getUser(): MessengerUser | undefined {
    return this.getInitData().user;
  }

  get backButton(): BackButtonController {
    return {
      show: () => this.webApp.BackButton.show(),
      hide: () => this.webApp.BackButton.hide(),
      isVisible: this.webApp.BackButton.isVisible || false,
      onClick: (handler) => {
        this.webApp.onEvent('WebAppBackButtonPressed', handler);
      },
      offClick: (handler) => {
        this.webApp.offEvent('WebAppBackButtonPressed', handler);
      },
    };
  }

  get haptic(): HapticFeedback {
    return {
      impactOccurred: (style) => {
        this.webApp.HapticFeedback.impactOccurred(style);
      },
      selectionChanged: () => {
        this.webApp.HapticFeedback.selectionChanged();
      },
      notificationOccurred: (type) => {
        this.webApp.HapticFeedback.notificationOccurred(type);
      },
    };
  }

  // ... остальные методы
}
```

#### Platform Detection

```typescript
// src/shared/lib/messenger/utils/detect-platform.ts

export function detectPlatform(): Platform {
  if (typeof window === 'undefined') {
    return 'web';
  }

  // Проверка MAX (приоритет, т.к. может эмулировать Telegram)
  if (window.WebApp && !window.Telegram) {
    return 'max';
  }

  // Проверка Telegram
  if (window.Telegram?.WebApp) {
    return 'telegram';
  }

  // Fallback на web
  return 'web';
}

export function createMessengerAdapter(): MessengerAdapter {
  const platform = detectPlatform();

  switch (platform) {
    case 'telegram':
      return new TelegramAdapter();
    case 'max':
      return new MaxAdapter();
    case 'web':
      return new WebAdapter(); // Для standalone версии
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
```

#### React Hook

```typescript
// src/shared/lib/messenger/hooks/use-messenger.ts

import { createContext, useContext } from 'react';

const MessengerContext = createContext<MessengerAdapter | null>(null);

export function MessengerProvider({ children }: { children: React.ReactNode }) {
  const [adapter] = useState(() => createMessengerAdapter());

  useEffect(() => {
    adapter.init().then(() => {
      adapter.ready();
    });
  }, [adapter]);

  return (
    <MessengerContext.Provider value={adapter}>
      {children}
    </MessengerContext.Provider>
  );
}

export function useMessenger(): MessengerAdapter {
  const adapter = useContext(MessengerContext);

  if (!adapter) {
    throw new Error('useMessenger must be used within MessengerProvider');
  }

  return adapter;
}

// Специализированные хуки
export function useAuth() {
  const messenger = useMessenger();
  return messenger.getInitData();
}

export function useBackButton(handler?: () => void) {
  const messenger = useMessenger();

  useEffect(() => {
    if (handler) {
      messenger.backButton.show();
      messenger.backButton.onClick(handler);

      return () => {
        messenger.backButton.offClick(handler);
        messenger.backButton.hide();
      };
    }
  }, [handler, messenger]);

  return messenger.backButton;
}

export function useHaptic() {
  const messenger = useMessenger();
  return messenger.haptic;
}
```

---

## Риски и митигация

### Технические риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| MAX API нестабильна | Средняя | Высокое | Версионирование SDK, абстракция, fallback |
| Проблемы с СБП интеграцией | Средняя | Критическое | Ранее тестирование, sandbox, альтернативы |
| Backend не готов для MAX | Низкая | Критическое | Ранняя координация, параллельная разработка |
| UI библиотеки несовместимы | Низкая | Среднее | Wrapper компоненты, постепенная миграция |
| Performance проблемы | Низкая | Среднее | Профилирование, оптимизация, lazy loading |

### Бизнес риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Пользователи не примут MAX | Средняя | Высокое | Поддержка Telegram, постепенная миграция |
| Недостаток функций в MAX | Средняя | Среднее | Feature parity analysis, workarounds |
| Изменение правил MAX | Низкая | Высокое | Мониторинг новостей, гибкая архитектура |
| Конкуренты быстрее | Средняя | Среднее | Agile подход, MVP сначала |

---

## Чеклист миграции

### Перед началом

- [ ] Утвержден план миграции
- [ ] Выделены ресурсы (команда, время, бюджет)
- [ ] Создан тестовый бот в MAX
- [ ] Настроено окружение разработки
- [ ] Координация с backend командой
- [ ] Подготовлен rollback план

### Разработка

#### Адаптационный слой
- [ ] Интерфейсы MessengerAdapter определены
- [ ] TelegramAdapter реализован
- [ ] MaxAdapter реализован
- [ ] Platform detection работает
- [ ] Unit тесты написаны (>80% покрытие)

#### Компоненты
- [ ] Аутентификация обновлена
- [ ] Back button обновлен
- [ ] Haptic feedback обновлен
- [ ] Theme management обновлен
- [ ] Viewport обновлен
- [ ] Storage обновлен
- [ ] Deep links обновлены

#### UI библиотека
- [ ] PlatformProvider создан
- [ ] Корневой App.tsx обновлен
- [ ] UI компоненты адаптированы
- [ ] Стили соответствуют MAX guidelines

#### Платежи
- [ ] Payment adapter создан
- [ ] СБП интеграция реализована
- [ ] Backend обновлен
- [ ] Тестирование в sandbox

#### Дополнительно
- [ ] Platform-specific функции с feature flags
- [ ] Error handling обновлен
- [ ] Логирование настроено

### Тестирование

- [ ] Unit тесты прошли
- [ ] Integration тесты прошли
- [ ] E2E тесты прошли
- [ ] Ручное тестирование на Android (MAX)
- [ ] Ручное тестирование на iOS (MAX)
- [ ] Ручное тестирование на Android (Telegram)
- [ ] Ручное тестирование на iOS (Telegram)
- [ ] Performance тестирование
- [ ] Security audit

### Деплой

- [ ] Code review пройден
- [ ] Staging деплой выполнен
- [ ] Smoke tests на staging
- [ ] Production деплой (10%)
- [ ] Мониторинг метрик
- [ ] Production деплой (50%)
- [ ] Production деплой (100%)
- [ ] Post-release мониторинг

### Документация

- [ ] API документация обновлена
- [ ] Руководство разработчика обновлено
- [ ] Changelog обновлен
- [ ] README обновлен
- [ ] CLAUDE.md обновлен

---

**Дата последнего обновления:** 2025-12-23
**Автор:** Claude Code
**Статус:** 📋 Готов к утверждению
