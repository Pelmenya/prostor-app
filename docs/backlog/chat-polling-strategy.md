# Chat Polling Strategy

## Проблема

`useInfiniteQuery` с `refetchInterval` в TanStack Query v5 рефетчит **все загруженные страницы** при каждом тике, а не только newest-batch. Флаг `refetchPages` был убран в v5.

Сценарий: пользователь проскроллил 5 страниц истории (150 сообщений) → каждые 5 секунд polling тянет 5 запросов последовательно вместо одного.

Текущее поведение **приемлемо** пока чаты короткие (≤30 сообщений = 1 страница). На продакшне с активными чатами (100+ сообщений) станет заметной нагрузкой.

**Затронутый файл:** `src/entities/chat/lib/hooks/use-chat-messages.ts`

## Решение при необходимости

Разделить на два независимых хука:

```
useInfiniteQuery (пагинация, без refetchInterval)
  + отдельный useQuery (newest-batch, с refetchInterval: 5000)
```

Логика в UI-слое: результаты обоих хуков мержатся, дедупликация по `id`.

```ts
// newest-batch запрос — только первая страница
useQuery({
    queryKey: [...chatKeys.messages(chatId), 'latest'],
    queryFn: () => api(`/chat/${chatId}/messages?limit=30`),
    refetchInterval: 5000,
    select: (data) => data.messages,
});
```

## Триггер для реализации

- Чаты с 100+ сообщениями становятся нормой (мониторинг по db)
- Жалобы на нагрузку сети / slow 3G у пользователей
- Переход на SSE/WebSocket (тогда polling вообще не нужен)
