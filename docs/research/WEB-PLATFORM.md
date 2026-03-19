# Миграция на независимую Web платформу

> Дата исследования: 2025-12-23
> Статус: 🔄 В процессе исследования

## Содержание

- [Обзор](#обзор)
- [Анализ текущей зависимости от Telegram](#анализ-текущей-зависимости-от-telegram)
- [Что нужно изменить для Web](#что-нужно-изменить-для-web)
- [Архитектура Web адаптера](#архитектура-web-адаптера)
- [Аутентификация в Web](#аутентификация-в-web)
- [UI/UX изменения](#uiux-изменения)
- [Оценка сложности](#оценка-сложности)
- [Выводы](#выводы)

---

## Обзор

Standalone веб-версия позволит пользователям работать с CRM Aqua Kinetics через обычный браузер без привязки к мессенджерам.

### Цели Web платформы

- 🌐 Независимый доступ через браузер
- 📱 Responsive дизайн для всех устройств
- 🔐 Собственная система аутентификации
- 💼 Расширенные возможности для desktop
- 📊 Полноценный функционал без ограничений мессенджеров

### Преимущества Web версии

**Для пользователей:**

- ✅ Доступ без установки мессенджера
- ✅ Полноэкранный режим на desktop
- ✅ Работа в любом браузере
- ✅ Больше места для интерфейса
- ✅ Клавиатурные shortcuts
- ✅ Работа на слабых устройствах

**Для бизнеса:**

- ✅ Не зависим от политик мессенджеров
- ✅ Полный контроль над платформой
- ✅ SEO оптимизация возможна
- ✅ Больше аналитики
- ✅ Легче интеграции с другими системами

### Недостатки и ограничения

**Технические:**

- ❌ Нет нативных уведомлений (нужны Push API)
- ❌ Нет встроенной аутентификации (нужна своя система)
- ❌ Нет haptic feedback на desktop
- ❌ Сложнее распространение (нет установки из мессенджера)

**Бизнес:**

- ❌ Требуется продвижение отдельно
- ❌ Пользователи должны помнить URL
- ❌ Сложнее вернуть пользователей
- ❌ Конкуренция с другими SaaS

---

## Анализ текущей зависимости от Telegram

### Критические зависимости

1. **Аутентификация** - полностью завязана на `initDataRaw`
2. **Идентификация пользователя** - использует Telegram user ID
3. **Платежи** - Telegram Payments API
4. **Deep links** - формат Telegram startParam
5. **UI компоненты** - `@telegram-apps/telegram-ui`

### Некритические зависимости

1. **Back button** - можно заменить на browser history
2. **Haptic feedback** - можно убрать или эмулировать через Vibration API
3. **Theme** - можно определять через system preferences
4. **Viewport** - стандартный viewport браузера

### Функции, требующие полной переработки

| Функция            | Текущая реализация   | Web альтернатива                  |
| ------------------ | -------------------- | --------------------------------- |
| **Аутентификация** | Telegram initDataRaw | Email/Phone + OTP, OAuth          |
| **User ID**        | Telegram user.id     | Собственная БД пользователей      |
| **Платежи**        | Telegram invoice     | Stripe, PayPal, Яндекс.Касса      |
| **Deep links**     | t.me/bot?start=...   | example.com/orders/123            |
| **Уведомления**    | Telegram чат         | Push API, Email, SMS              |
| **Шаринг**         | Telegram share       | Web Share API, копирование ссылки |

---

## Что нужно изменить для Web

### 1. Система аутентификации

**Текущая (Telegram):**

```typescript
const lp = useLaunchParams();
const authKey = lp.initDataRaw; // Автоматическая аутентификация
```

**Web варианты:**

#### Вариант A: Email + Пароль

```typescript
// Классическая регистрация
const { register } = useAuth();
await register({
    email: 'user@example.com',
    password: 'secure-password',
    firstName: 'Иван',
    lastName: 'Иванов',
});

// Вход
const { login } = useAuth();
await login({
    email: 'user@example.com',
    password: 'secure-password',
});
```

#### Вариант B: Phone + OTP (рекомендуется)

```typescript
// Запрос кода
const { requestOTP } = useAuth();
await requestOTP({
    phone: '+79001234567',
});

// Подтверждение
const { verifyOTP } = useAuth();
await verifyOTP({
    phone: '+79001234567',
    code: '123456',
});
```

#### Вариант C: OAuth (Google, Yandex, VK)

```typescript
const { loginWithOAuth } = useAuth();
await loginWithOAuth({
    provider: 'google',
});
```

**Рекомендация:** Phone + OTP (аналогично Telegram, привычно для России)

### 2. Управление сессией

**Требуется:**

- JWT токены (access + refresh)
- Secure httpOnly cookies
- Refresh token rotation
- Remember me функция
- Multi-device support

```typescript
// Web Adapter
export class WebAdapter implements PlatformAdapter {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    async init(): Promise<void> {
        // Проверка существующей сессии
        this.refreshToken = localStorage.getItem('refreshToken');

        if (this.refreshToken) {
            await this.refreshAccessToken();
        }
    }

    getInitData(): PlatformInitData {
        return {
            authKey: this.accessToken || '',
            user: this.getCurrentUser(),
            hash: '', // Не требуется для JWT
            startParam: this.getRouteParam(),
        };
    }

    private async refreshAccessToken(): Promise<void> {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refreshToken: this.refreshToken,
            }),
        });

        const { accessToken, refreshToken } = await response.json();

        this.accessToken = accessToken;
        this.refreshToken = refreshToken;

        localStorage.setItem('refreshToken', refreshToken);
    }
}
```

### 3. Navigation и Back Button

**Текущая (Telegram):**

```typescript
window.Telegram.WebApp.BackButton.show();
window.Telegram.WebApp.onEvent('WebAppBackButtonPressed', () => {
    navigate(-1);
});
```

**Web:**

```typescript
// Просто используем React Router
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Кнопка "Назад" в UI
<button onClick={() => navigate(-1)}>
  ← Назад
</button>

// Или используем browser API
<button onClick={() => window.history.back()}>
  ← Назад
</button>
```

### 4. Haptic Feedback

**Текущая (Telegram/MAX):**

```typescript
window.Telegram.WebApp.HapticFeedback.impactOccurred('soft');
```

**Web:**

```typescript
// Vibration API (только мобильные браузеры)
export class WebHaptic implements HapticFeedback {
    impactOccurred(style: HapticStyle): void {
        if (!navigator.vibrate) return;

        const durations = {
            soft: 10,
            light: 15,
            medium: 20,
            heavy: 30,
            rigid: 25,
        };

        navigator.vibrate(durations[style]);
    }

    selectionChanged(): void {
        if (navigator.vibrate) {
            navigator.vibrate(5);
        }
    }

    notificationOccurred(type: NotificationType): void {
        if (!navigator.vibrate) return;

        const patterns = {
            success: [10, 50, 10],
            warning: [20, 100, 20],
            error: [30, 100, 30, 100, 30],
        };

        navigator.vibrate(patterns[type]);
    }
}
```

### 5. Theme Management

**Текущая (Telegram):**

```typescript
const isDark = useSignal(miniApp.isDark);
```

**Web:**

```typescript
// System preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// С сохранением выбора пользователя
const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    return (localStorage.getItem('theme') as any) || 'auto';
});

const resolvedTheme = theme === 'auto' ? (prefersDark ? 'dark' : 'light') : theme;

// Слушатель изменений system preference
useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
        if (theme === 'auto') {
            setResolvedTheme(e.matches ? 'dark' : 'light');
        }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
}, [theme]);
```

### 6. Storage

**Текущая (Telegram):**

```typescript
await cloudStorage.setItem('key', 'value');
```

**Web:**

```typescript
// LocalStorage (синхронный)
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');

// IndexedDB (асинхронный, больше возможностей)
const db = await openDB('aqua-kinetics', 1);
await db.put('settings', value, 'key');
const value = await db.get('settings', 'key');

// Wrapper для совместимости
export class WebStorage implements StorageController {
    async getItem(key: string): Promise<string | null> {
        return localStorage.getItem(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        localStorage.setItem(key, value);
    }

    async removeItem(key: string): Promise<void> {
        localStorage.removeItem(key);
    }

    async clear(): Promise<void> {
        localStorage.clear();
    }
}
```

### 7. Платежная система

**Текущая (Telegram):**

```typescript
const status = await invoice.open(invoiceLink, 'url');
```

**Web варианты:**

#### Stripe

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
        return_url: 'https://example.com/order/success',
    },
});
```

#### Яндекс.Касса (ЮKassa)

```typescript
const checkout = new window.YooMoneyCheckout({
    shopId: 'your-shop-id',
    paymentToken: 'payment-token',
});

checkout.render('payment-form');

checkout.on('success', () => {
    // Оплата успешна
});
```

#### СБП (для России)

```typescript
// Через backend API
const { paymentUrl } = await createSBPPayment({
    amount: 1000,
    orderId: order.id,
});

// Редирект на страницу оплаты
window.location.href = paymentUrl;
```

### 8. Deep Links и маршрутизация

**Текущая (Telegram):**

```typescript
// t.me/bot?start=order__123__details
const startParam = lp.startParam; // "order__123__details"
const path = '/order/123/details';
```

**Web:**

```typescript
// https://aqua-kinetics.com/order/123/details
const path = window.location.pathname; // "/order/123/details"

// React Router
<Routes>
  <Route path="/order/:id/details" element={<OrderDetails />} />
</Routes>
```

### 9. Push уведомления

**Web Push API:**

```typescript
// Запрос разрешения
const permission = await Notification.requestPermission();

if (permission === 'granted') {
    // Подписка на push
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'your-public-key',
    });

    // Отправка подписки на сервер
    await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
    });
}

// Service Worker (/sw.js)
self.addEventListener('push', (event) => {
    const data = event.data.json();

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon.png',
            badge: '/badge.png',
        }),
    );
});
```

### 10. Шаринг

**Web Share API:**

```typescript
// Современные браузеры
if (navigator.share) {
    await navigator.share({
        title: 'Aqua Kinetics',
        text: 'Проверьте этот заказ',
        url: 'https://aqua-kinetics.com/order/123',
    });
} else {
    // Fallback - копирование в буфер
    await navigator.clipboard.writeText(url);
    showNotification('Ссылка скопирована');
}
```

---

## Архитектура Web адаптера

### Структура WebAdapter

```typescript
// src/shared/lib/platform/adapters/web-adapter.ts

export class WebAdapter implements PlatformAdapter {
    readonly platform: Platform = 'web';

    private currentUser: TPlatformUser | null = null;
    private accessToken: string | null = null;
    private _backButton: WebBackButton;
    private _haptic: WebHaptic;
    private _theme: WebTheme;
    private _viewport: WebViewport;
    private _storage: WebStorage;

    constructor() {
        this._backButton = new WebBackButton();
        this._haptic = new WebHaptic();
        this._theme = new WebTheme();
        this._viewport = new WebViewport();
        this._storage = new WebStorage();
    }

    get isAvailable(): boolean {
        return typeof window !== 'undefined';
    }

    async init(): Promise<void> {
        // Попытка восстановить сессию
        await this.restoreSession();
    }

    ready(): void {
        // Emit ready event
        window.dispatchEvent(new CustomEvent('webappready'));
    }

    getInitData(): PlatformInitData {
        return {
            authKey: this.accessToken || '',
            user: this.currentUser || undefined,
            hash: '', // JWT не требует hash
            startParam: this.getStartParam(),
        };
    }

    getUser(): TPlatformUser | undefined {
        return this.currentUser || undefined;
    }

    private async restoreSession(): Promise<void> {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
            try {
                const response = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (response.ok) {
                    const { accessToken, user } = await response.json();
                    this.accessToken = accessToken;
                    this.currentUser = user;
                } else {
                    // Невалидный refresh token
                    localStorage.removeItem('refreshToken');
                }
            } catch (error) {
                console.error('Failed to restore session:', error);
            }
        }
    }

    private getStartParam(): string | undefined {
        // Извлечение из URL query params
        const params = new URLSearchParams(window.location.search);
        return params.get('start') || undefined;
    }

    // Методы аутентификации
    async loginWithPhone(phone: string, code: string): Promise<void> {
        const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code }),
        });

        const { accessToken, refreshToken, user } = await response.json();

        this.accessToken = accessToken;
        this.currentUser = user;

        localStorage.setItem('refreshToken', refreshToken);
    }

    async logout(): Promise<void> {
        this.accessToken = null;
        this.currentUser = null;
        localStorage.removeItem('refreshToken');

        // Редирект на login
        window.location.href = '/login';
    }

    // UI контроллеры
    get backButton(): BackButtonController {
        return this._backButton;
    }

    get haptic(): HapticFeedback {
        return this._haptic;
    }

    get theme(): ThemeParams {
        return this._theme.params;
    }

    get viewport(): ViewportController {
        return this._viewport;
    }

    get storage(): StorageController {
        return this._storage;
    }

    // Утилиты
    openLink(url: string): void {
        window.open(url, '_blank');
    }

    close(): void {
        window.close();
    }

    // События
    on(event: string, handler: (...args: any[]) => void): void {
        window.addEventListener(event, handler as EventListener);
    }

    off(event: string, handler: (...args: any[]) => void): void {
        window.removeEventListener(event, handler as EventListener);
    }
}
```

### Web-специфичные компоненты

```typescript
// WebBackButton
class WebBackButton implements BackButtonController {
    private visible = false;
    private handlers: Set<() => void> = new Set();

    show(): void {
        this.visible = true;
        // Можно показать UI кнопку
        document.body.classList.add('show-back-button');
    }

    hide(): void {
        this.visible = false;
        document.body.classList.remove('show-back-button');
    }

    get isVisible(): boolean {
        return this.visible;
    }

    onClick(handler: () => void): void {
        this.handlers.add(handler);
    }

    offClick(handler: () => void): void {
        this.handlers.delete(handler);
    }

    // Вызывается UI кнопкой или browser back
    trigger(): void {
        this.handlers.forEach((handler) => handler());
    }
}

// WebTheme
class WebTheme {
    private _isDark: boolean;
    private listeners: Set<() => void> = new Set();

    constructor() {
        this._isDark = this.getSystemTheme();
        this.watchSystemTheme();
    }

    private getSystemTheme(): boolean {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'light') {
            return stored === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    private watchSystemTheme(): void {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            this._isDark = e.matches;
            this.notifyListeners();
        });
    }

    get params(): ThemeParams {
        return {
            isDark: this._isDark,
            colorScheme: this._isDark ? 'dark' : 'light',
            backgroundColor: this._isDark ? '#1a1a1a' : '#ffffff',
            textColor: this._isDark ? '#ffffff' : '#000000',
            buttonColor: this._isDark ? '#3390ec' : '#007aff',
            buttonTextColor: '#ffffff',
        };
    }

    onChange(handler: () => void): void {
        this.listeners.add(handler);
    }

    private notifyListeners(): void {
        this.listeners.forEach((handler) => handler());
    }
}
```

---

## Аутентификация в Web

### Рекомендуемый flow: Phone + OTP

```
┌─────────────┐
│ Landing     │
│ Page        │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Ввод номера │  ← /login
│ телефона    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Backend:    │
│ Отправка SMS│
│ с кодом     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Ввод кода   │  ← /verify
│ из SMS      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Backend:    │
│ Проверка    │
│ кода        │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Выдача JWT  │
│ токенов     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Главная     │
│ страница    │
└─────────────┘
```

### Компоненты аутентификации

```typescript
// LoginPage.tsx
const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [requestOTP] = useRequestOTPMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await requestOTP({ phone }).unwrap();

    // Переход на страницу ввода кода
    navigate('/verify', { state: { phone } });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="tel"
        placeholder="+7 (900) 123-45-67"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button type="submit">Получить код</button>
    </form>
  );
};

// VerifyPage.tsx
const VerifyPage = () => {
  const location = useLocation();
  const phone = location.state?.phone;
  const [code, setCode] = useState('');
  const [verifyOTP] = useVerifyOTPMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { accessToken, refreshToken, user } = await verifyOTP({
      phone,
      code,
    }).unwrap();

    // Сохранение токенов
    localStorage.setItem('refreshToken', refreshToken);

    // Редирект на главную
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit}>
      <p>Код отправлен на {phone}</p>
      <input
        type="text"
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
      />
      <button type="submit">Войти</button>
    </form>
  );
};
```

---

## UI/UX изменения

### Desktop адаптация

**Проблема:** Текущий UI оптимизирован для мобильных устройств в Telegram.

**Решение:** Адаптивный дизайн с breakpoints.

```typescript
// Responsive layout
const Layout = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {!isMobile && <Sidebar />}
      <Main />
    </div>
  );
};
```

### Header и Navigation

**Текущая (Telegram):** Минималистичный header, навигация через Telegram back button

**Web:** Полноценный header с навигацией

```typescript
const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="logo">
        <img src="/logo.svg" alt="Aqua Kinetics" />
      </div>

      <nav className="main-nav">
        <Link to="/orders">Заказы</Link>
        <Link to="/properties">Недвижимость</Link>
        <Link to="/consultations">Консультации</Link>
        <Link to="/account">Аккаунт</Link>
      </nav>

      <div className="user-menu">
        <span>{user?.firstName}</span>
        <button onClick={logout}>Выйти</button>
      </div>
    </header>
  );
};
```

### Footer

```typescript
const Footer = () => (
  <footer className="site-footer">
    <div className="footer-links">
      <Link to="/about">О компании</Link>
      <Link to="/privacy">Политика конфиденциальности</Link>
      <Link to="/terms">Условия использования</Link>
      <Link to="/support">Поддержка</Link>
    </div>

    <div className="footer-info">
      <p>© 2025 Aqua Kinetics. Все права защищены.</p>
    </div>
  </footer>
);
```

---

## Оценка сложности

### Компоненты для разработки

| Компонент                        | Сложность  | Время (дни) |
| -------------------------------- | ---------- | ----------- |
| **Web Adapter**                  | 🟡 Средняя | 2-3         |
| **Аутентификация (Phone + OTP)** | 🔴 Высокая | 5-7         |
| **Backend для аутентификации**   | 🔴 Высокая | 5-7         |
| **Платежная система**            | 🔴 Высокая | 5-7         |
| **Responsive UI**                | 🟡 Средняя | 3-5         |
| **Header/Footer/Navigation**     | 🟡 Средняя | 2-3         |
| **Landing page**                 | 🟡 Средняя | 2-3         |
| **Push уведомления**             | 🟡 Средняя | 3-4         |
| **SEO оптимизация**              | 🟡 Средняя | 1-2         |
| **Тестирование**                 | 🟡 Средняя | 5-7         |
| **DevOps (deployment, CDN)**     | 🟡 Средняя | 2-3         |

### Общая оценка

**Оптимистичный сценарий:** 30-40 дней
**Реалистичный сценарий:** 40-60 дней
**Пессимистичный сценарий:** 60-90 дней

### Риски

| Риск                             | Вероятность | Влияние     | Митигация                                         |
| -------------------------------- | ----------- | ----------- | ------------------------------------------------- |
| Сложность backend аутентификации | Высокая     | Критическое | Использовать готовые решения (Firebase, Supabase) |
| Платежная интеграция             | Средняя     | Критическое | Выбрать проверенного провайдера (Stripe, ЮКassa)  |
| UX хуже чем в Telegram           | Средняя     | Высокое     | UX исследование, тестирование с пользователями    |
| SEO и продвижение                | Высокая     | Среднее     | SEO специалист, маркетинг                         |
| Push уведомления не работают     | Средняя     | Среднее     | Fallback на Email/SMS                             |

---

## Выводы

### Преимущества мультиплатформенного подхода

С учетом разработки адаптационного слоя для MAX, добавление Web станет проще:

```
Platform Adapter (уже создан для MAX)
    ├── Telegram Adapter ✅
    ├── MAX Adapter ✅
    └── Web Adapter ← добавить
```

### Рекомендации

1. **Сначала MAX, потом Web** - используйте опыт создания адаптера
2. **MVP подход** - базовый функционал для Web, без всех фич сразу
3. **Готовые решения** - Firebase Auth, Stripe Payments, Vercel Hosting
4. **Постепенный rollout** - beta для ограниченной аудитории

### Следующие шаги

1. ✅ Завершить миграцию на MAX
2. ✅ Протестировать адаптационный слой
3. 🔄 Создать Web Adapter на базе опыта
4. 🔄 Разработать Landing page
5. 🔄 Интегрировать аутентификацию
6. 🔄 Запустить beta версию

---

**Дата последнего обновления:** 2025-12-23
**Автор:** Claude Code
**Статус:** 🔄 Требуется дополнительное исследование
