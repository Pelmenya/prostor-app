# YouGile — управление задачами

Задачи на канбан-доске YouGile создаются через API. Токен и ID хранятся в памяти (`memory/yougile-kanban.md`).

## Исполнители

- **Фронтенд-задачи:** Дмитрий Ляпин или Пётр (уточнить у пользователя)
- **Остальное:** Дмитрий Ляпин

## Жизненный цикл задачи

1. **Начало работы** → создать задачу в колонке «В процессе», стикер по типу, исполнитель
2. **Активная разработка** → переместить в «Текущая задача»
3. **Код написан** → переместить в «Тестирование»
4. **По команде пользователя** → переместить в «Архив»

## Формат задачи

- **title:** краткое описание (как коммит: `feat: ...`, `fix: ...`, `refactor: ...`)
- **description:** детали реализации
- **stickers:** по типу задачи (FRONTEND, BACKEND, и т.д.)

## ⚠️ Кириллица в YouGile API (Windows)

Передача кириллицы через `-d '...'` в curl на Windows **ломает кодировку**. Всегда использовать файл:

```bash
cat > /tmp/yg-task.json << 'JSONEOF'
{"title":"feat: название задачи","columnId":"...","description":"Описание"}
JSONEOF
curl -s -X POST "https://yougile.com/api-v2/tasks" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary @/tmp/yg-task.json
```

**Правило:** JSON тело → heredoc в файл (`<< 'JSONEOF'`), curl → `--data-binary @file`.
