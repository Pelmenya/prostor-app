# Мультиплатформенная архитектура

> Дата создания: 2025-12-23
> Статус: 📐 Архитектурное решение

## Содержание

- [Обзор](#обзор)
- [Принципы архитектуры](#принципы-архитектуры)
- [Adapter Pattern](#adapter-pattern)
- [Структура проекта](#структура-проекта)
- [Примеры использования](#примеры-использования)
- [Best Practices](#best-practices)
- [Roadmap](#roadmap)

---

## Обзор

Мультиплатформенная архитектура позволяет одному кодовому базе работать на разных платформах (Telegram, MAX, Web) с минимальными изменениями в бизнес-логике.

### Цели

- 🎯 **Единая кодовая база** для всех платформ
- 🎯 **Изолированные адаптеры** - изменения в одной платформе не влияют на другие
- 🎯 **Легкое добавление** новых платформ (VK, WhatsApp, standalone app)
- 🎯 **Переиспользование** бизнес-логики, компонентов, стилей
- 🎯 **Type-safe** работа с TypeScript

### Поддерживаемые платформы

| Платформа              | Статус           | Приоритет | Дата релиза |
| ---------------------- | ---------------- | --------- | ----------- |
| **Telegram Mini Apps** | ✅ Текущая       | Высокий   | 2024-XX-XX  |
| **MAX Messenger**      | 📋 Запланировано | Высокий   | 2025-Q1     |
| **Standalone Web**     | 🔄 Исследование  | Средний   | 2025-Q2     |
| **VK Mini Apps**       | ⏳ Будущее       | Низкий    | TBD         |

---

## Принципы архитектуры

### 1. SOLID принципы

#### Single Responsibility Principle

Каждый адаптер отвечает только за свою платформу:

- `TelegramAdapter` - только Telegram API
- `MaxAdapter` - только MAX API
- `WebAdapter` - только Web API

#### Open/Closed Principle

Система открыта для расширения (новые адаптеры), закрыта для модификации (интерфейс не меняется):

```typescript
// Добавление новой платформы не требует изменения существующего кода
export function createPlatformAdapter(): PlatformAdapter {
    const platform = detectPlatform();

    switch (platform) {
        case 'telegram':
            return new TelegramAdapter();
        case 'max':
            return new MaxAdapter();
        case 'web':
            return new WebAdapter();
        case 'vk':
            return new VKAdapter(); // ← Новый адаптер
        default:
            throw new Error(`Unknown platform: ${platform}`);
    }
}
```

#### Liskov Substitution Principle

Все адаптеры взаимозаменяемы благодаря единому интерфейсу:

```typescript
// Бизнес-логика работает с любым адаптером
function processPayment(adapter: PlatformAdapter, amount: number) {
    const initData = adapter.getInitData();
    // ... логика одинакова для всех платформ
}
```

#### Interface Segregation Principle

Интерфейсы разделены по функциональности:

```typescript
interface PlatformAdapter {
    // Основные интерфейсы
    backButton: BackButtonController;
    haptic: HapticFeedback;
    theme: ThemeParams;
    viewport: ViewportController;
    storage: StorageController;
}

// Каждый интерфейс независим
interface BackButtonController {
    show(): void;
    hide(): void;
    isVisible: boolean;
    onClick(handler: () => void): void;
    offClick(handler: () => void): void;
}
```

#### Dependency Inversion Principle

Бизнес-логика зависит от абстракций, а не от конкретных реализаций:

```typescript
// ✅ Правильно - зависимость от интерфейса
function useAuth() {
    const adapter = usePlatform(); // PlatformAdapter
    return adapter.getInitData();
}

// ❌ Неправильно - прямая зависимость от Telegram
function useAuth() {
    const lp = useLaunchParams(); // Telegram-specific
    return lp.initDataRaw;
}
```

### 2. Separation of Concerns

```
┌──────────────────────────────────────────┐
│         Business Logic Layer             │
│  (Orders, Users, Cart, Real Estate)      │
│  - Не знает о платформе                  │
│  - Использует PlatformAdapter interface  │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│       Platform Adapter Layer             │
│  - Определяет платформу                  │
│  - Предоставляет единый API              │
│  - Изолирует платформенные различия      │
└────────────────┬─────────────────────────┘
                 │
     ┌───────────┼───────────┬─────────┐
     │           │           │         │
┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌──▼───┐
│Telegram │ │  MAX   │ │  Web   │ │  VK  │
│ Adapter │ │ Adapter│ │ Adapter│ │Adapter│
└─────────┘ └────────┘ └────────┘ └──────┘
```

### 3. Progressive Enhancement

Платформы могут иметь уникальные возможности:

```typescript
interface PlatformAdapter {
    // Базовый функционал (обязательный)
    readonly platform: Platform;
    getInitData(): PlatformInitData;
    backButton: BackButtonController;

    // Опциональные возможности
    biometric?: BiometricManager; // Только MAX
    qrScanner?: QRScannerController; // Только MAX
    openInvoice?(url: string): Promise<PaymentStatus>; // Telegram, MAX
}

// Использование
const adapter = usePlatform();

if (adapter.biometric) {
    // MAX поддерживает биометрию
    await adapter.biometric.authenticate();
}
```

---

## Adapter Pattern

### Интерфейс PlatformAdapter

Полный интерфейс описан в [MAX-MIGRATION-PLAN.md](./MAX-MIGRATION-PLAN.md#интерфейс-адаптера).

Ключевые компоненты:

```typescript
export interface PlatformAdapter {
    // Метаданные
    readonly platform: Platform;
    readonly isAvailable: boolean;

    // Жизненный цикл
    init(): Promise<void>;
    ready(): void;

    // Данные
    getInitData(): PlatformInitData;
    getUser(): TPlatformUser | undefined;

    // UI контроллеры
    backButton: BackButtonController;
    haptic: HapticFeedback;
    theme: ThemeParams;
    viewport: ViewportController;
    storage: StorageController;

    // Утилиты
    openLink(url: string): void;
    close(): void;

    // Опциональные возможности
    openInvoice?(invoiceUrl: string): Promise<PaymentStatus>;
    biometric?: BiometricManager;
    qrScanner?: QRScannerController;

    // События
    on(event: string, handler: EventHandler): void;
    off(event: string, handler: EventHandler): void;
}
```

### Platform Detection

```typescript
// src/shared/lib/platform/utils/detect-platform.ts

export function detectPlatform(): Platform {
    if (typeof window === 'undefined') {
        return 'web'; // SSR
    }

    // Проверка MAX (первым, т.к. может эмулировать другие)
    if (isMaxPlatform()) {
        return 'max';
    }

    // Проверка Telegram
    if (isTelegramPlatform()) {
        return 'telegram';
    }

    // Проверка VK
    if (isVKPlatform()) {
        return 'vk';
    }

    // Fallback на standalone web
    return 'web';
}

function isMaxPlatform(): boolean {
    return (
        typeof window !== 'undefined' && typeof window.WebApp !== 'undefined' && !window.Telegram
    );
}

function isTelegramPlatform(): boolean {
    return typeof window !== 'undefined' && typeof window.Telegram?.WebApp !== 'undefined';
}

function isVKPlatform(): boolean {
    return typeof window !== 'undefined' && typeof window.vkBridge !== 'undefined';
}
```

### Adapter Factory

```typescript
// src/shared/lib/platform/factory.ts

import { TelegramAdapter } from './adapters/telegram-adapter';
import { MaxAdapter } from './adapters/max-adapter';
import { WebAdapter } from './adapters/web-adapter';
import { VKAdapter } from './adapters/vk-adapter';

export function createPlatformAdapter(): PlatformAdapter {
    const platform = detectPlatform();

    const adapters: Record<Platform, () => PlatformAdapter> = {
        telegram: () => new TelegramAdapter(),
        max: () => new MaxAdapter(),
        web: () => new WebAdapter(),
        vk: () => new VKAdapter(),
    };

    const createAdapter = adapters[platform];

    if (!createAdapter) {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    return createAdapter();
}
```

---

## Структура проекта

```
src/
├── shared/
│   └── lib/
│       └── platform/                     # ← Новая директория
│           ├── types/
│           │   ├── types.ts              # Интерфейсы
│           │   ├── user.types.ts
│           │   ├── platform.types.ts
│           │   ├── ui.types.ts
│           │   └── index.ts
│           │
│           ├── adapters/
│           │   ├── base-adapter.ts       # Базовый класс
│           │   ├── telegram-adapter.ts   # Telegram реализация
│           │   ├── max-adapter.ts        # MAX реализация
│           │   ├── web-adapter.ts        # Web реализация
│           │   ├── vk-adapter.ts         # VK реализация
│           │   └── index.ts
│           │
│           ├── controllers/              # UI контроллеры
│           │   ├── back-button/
│           │   │   ├── telegram-back-button.ts
│           │   │   ├── max-back-button.ts
│           │   │   └── web-back-button.ts
│           │   ├── haptic/
│           │   │   ├── telegram-haptic.ts
│           │   │   ├── max-haptic.ts
│           │   │   └── web-haptic.ts
│           │   └── ...
│           │
│           ├── hooks/
│           │   ├── use-platform.ts       # Основной хук
│           │   ├── use-auth.ts           # Аутентификация
│           │   ├── use-back-button.ts    # Back button
│           │   ├── use-haptic.ts         # Haptic feedback
│           │   ├── use-theme.ts          # Theme
│           │   └── index.ts
│           │
│           ├── providers/
│           │   └── platform-provider.tsx  # React Context
│           │
│           ├── utils/
│           │   ├── detect-platform.ts    # Определение платформы
│           │   ├── validate-init-data.ts # Валидация данных
│           │   └── index.ts
│           │
│           ├── factory.ts                # Фабрика адаптеров
│           └── index.ts                  # Главный экспорт
│
├── app/
│   └── providers/
│       └── app-providers.tsx             # ← Обновить
│
└── components/
    └── App.tsx                           # ← Обновить
```

---

## Примеры использования

### 1. Настройка провайдера

```typescript
// src/app/providers/app-providers.tsx

import { PlatformProvider } from '@/shared/lib/platform';

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <PlatformProvider>
      {children}
    </PlatformProvider>
  );
};
```

### 2. Использование в компонентах

```typescript
// src/views/order-page.tsx

import { usePlatform, useAuth, useHaptic } from '@/shared/lib/platform';

export const OrderPage = () => {
  const adapter = usePlatform();
  const { authKey, user } = useAuth();
  const haptic = useHaptic();

  const handleOrderCreate = async () => {
    // Haptic feedback
    haptic.impactOccurred('medium');

    // API запрос с authKey (работает для всех платформ)
    await createOrder({
      authKey,
      userId: user?.id,
      // ...
    });

    // Успех
    haptic.notificationOccurred('success');
  };

  return (
    <div>
      <h1>Создание заказа</h1>
      <p>Платформа: {adapter.platform}</p>
      <button onClick={handleOrderCreate}>Создать</button>
    </div>
  );
};
```

### 3. Платформо-специфичный код

```typescript
// src/features/biometric-auth/ui/biometric-login.tsx

import { usePlatform } from '@/shared/lib/platform';

export const BiometricLogin = () => {
  const adapter = usePlatform();

  // Биометрия доступна только на MAX
  if (!adapter.biometric) {
    return null;
  }

  const handleBiometricAuth = async () => {
    const result = await adapter.biometric.authenticate({
      reason: 'Подтвердите вход',
    });

    if (result.success) {
      // Успешная аутентификация
    }
  };

  return (
    <button onClick={handleBiometricAuth}>
      Войти по отпечатку пальца
    </button>
  );
};
```

### 4. Условный рендеринг UI

```typescript
// src/components/platform-specific-features.tsx

import { usePlatform } from '@/shared/lib/platform';

export const PlatformSpecificFeatures = () => {
  const adapter = usePlatform();

  return (
    <div>
      {/* Показываем только на Telegram */}
      {adapter.platform === 'telegram' && (
        <TelegramPremiumFeature />
      )}

      {/* Показываем только на MAX */}
      {adapter.platform === 'max' && (
        <MaxSBPPayment />
      )}

      {/* Показываем только на Web */}
      {adapter.platform === 'web' && (
        <WebEmailNotifications />
      )}

      {/* Показываем везде кроме Web */}
      {adapter.platform !== 'web' && (
        <PlatformDeepLinks />
      )}
    </div>
  );
};
```

### 5. Адаптивная навигация

```typescript
// src/widgets/navigation/ui/navigation.tsx

import { usePlatform, useBackButton } from '@/shared/lib/platform';

export const Navigation = () => {
  const adapter = usePlatform();
  const navigate = useNavigate();

  // На мессенджерах используем нативный back button
  useBackButton(() => {
    navigate(-1);
  });

  // На Web показываем свою кнопку
  const showWebBackButton = adapter.platform === 'web';

  return (
    <nav>
      {showWebBackButton && (
        <button onClick={() => navigate(-1)}>
          ← Назад
        </button>
      )}

      <NavLinks />
    </nav>
  );
};
```

---

## Best Practices

### 1. Всегда используйте адаптер

❌ **Неправильно:**

```typescript
import { useLaunchParams } from '@telegram-apps/sdk-react';

const MyComponent = () => {
    const lp = useLaunchParams();
    const authKey = lp.initDataRaw;
    // ...
};
```

✅ **Правильно:**

```typescript
import { useAuth } from '@/shared/lib/platform';

const MyComponent = () => {
    const { authKey } = useAuth();
    // ...
};
```

### 2. Проверяйте доступность функций

❌ **Неправильно:**

```typescript
// Упадет на платформах без биометрии
await adapter.biometric.authenticate();
```

✅ **Правильно:**

```typescript
if (adapter.biometric?.isAvailable) {
    await adapter.biometric.authenticate();
}
```

### 3. Используйте feature flags для платформ

```typescript
// src/shared/config/features.ts

export const FEATURES = {
    biometricAuth: ['max'],
    qrScanner: ['max'],
    emailNotifications: ['web'],
    shareContent: ['max'],
} as const;

export function isFeatureAvailable(feature: keyof typeof FEATURES, platform: Platform): boolean {
    return FEATURES[feature].includes(platform);
}

// Использование
const adapter = usePlatform();
const canUseBiometric = isFeatureAvailable('biometricAuth', adapter.platform);
```

### 4. Типизируйте платформо-специфичный код

```typescript
// src/shared/lib/platform/types/platform-specific.types.ts

export type TelegramOnlyFeature = {
    platform: 'telegram';
    // ...
};

export type MaxOnlyFeature = {
    platform: 'max';
    // ...
};

// Использование в компонентах
type BiometricAuthProps = MaxOnlyFeature & {
    onSuccess: () => void;
};
```

### 5. Централизуйте platform detection

```typescript
// src/shared/lib/platform/hooks/use-platform-info.ts

export function usePlatformInfo() {
    const adapter = usePlatform();

    return {
        platform: adapter.platform,
        isTelegram: adapter.platform === 'telegram',
        isMax: adapter.platform === 'max',
        isWeb: adapter.platform === 'web',
        isVK: adapter.platform === 'vk',
        isMobile: adapter.platform !== 'web',
        hasBackButton: adapter.platform !== 'web',
        hasBiometric: !!adapter.biometric,
    };
}

// Использование
const { isTelegram, hasBiometric } = usePlatform();
```

### 6. Логируйте платформу для отладки

```typescript
// src/shared/lib/platform/utils/logger.ts

export function logPlatformInfo(adapter: PlatformAdapter) {
    console.group('🚀 Platform Info');
    console.log('Platform:', adapter.platform);
    console.log('Available:', adapter.isAvailable);
    console.log('User:', adapter.getUser());
    console.log('Features:', {
        biometric: !!adapter.biometric,
        qrScanner: !!adapter.qrScanner,
        invoice: !!adapter.openInvoice,
    });
    console.groupEnd();
}

// Вызов при инициализации
useEffect(() => {
    logPlatformInfo(adapter);
}, [adapter]);
```

---

## Roadmap

### Phase 1: MAX Integration (Q1 2025)

- [x] Исследование MAX SDK
- [x] Создание документации
- [ ] Разработка MAX Adapter
- [ ] Тестирование на MAX
- [ ] Релиз в продакшн

### Phase 2: Multi-platform Architecture (Q1 2025)

- [ ] Рефакторинг на Adapter Pattern
- [ ] Миграция всех компонентов
- [ ] Unit тесты для адаптеров
- [ ] E2E тесты для обеих платформ

### Phase 3: Web Platform (Q2 2025)

- [ ] Исследование требований
- [ ] Разработка Web Adapter
- [ ] Аутентификация для Web
- [ ] Платежи для Web
- [ ] Beta релиз

### Phase 4: VK Integration (Q3 2025)

- [ ] Исследование VK Mini Apps
- [ ] Разработка VK Adapter
- [ ] Тестирование
- [ ] Релиз

---

## Заключение

Мультиплатформенная архитектура на основе Adapter Pattern позволяет:

✅ **Гибкость** - легко добавлять новые платформы
✅ **Надежность** - изоляция платформенного кода
✅ **Поддерживаемость** - единая бизнес-логика
✅ **Масштабируемость** - готовность к росту
✅ **Type Safety** - полная типизация TypeScript

**Следующий шаг:** Начать разработку MAX Adapter согласно [плану миграции](./MAX-MIGRATION-PLAN.md).

---

**Дата последнего обновления:** 2025-12-23
**Автор:** Claude Code
**Статус:** ✅ Утверждено
