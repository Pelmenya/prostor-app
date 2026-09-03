# Субагенты (Code Review)

В `.claude/agents/` установлены субагенты из [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents).

**Краткая таблица агентов и триггеров — в [CLAUDE.md](../../CLAUDE.md).** Здесь — детали настройки и процесс.

## Автоматический code review (pre-commit)

В `.claude/settings.json` настроен хук `PreToolUse` на `git commit`. Перед каждым коммитом агент проверяет:

- FSD violations (прямые импорты вместо public API)
- Дублирование кода
- Cross-slice импорты между entities
- Бизнес-логика в `app/` слое
- Missing/лишний `'use client'`

Если найдены проблемы — коммит блокируется с описанием.

## Важно при ручном вызове

Агенты из `.claude/agents/` совпадают по имени со встроенными типами субагентов. При вызове Agent tool использовать `subagent_type` из таблицы в CLAUDE.md, **а не `general-purpose`**. Все агенты используют модель `opus`.

Рекомендуется запускать `code-reviewer` и `architect-reviewer` **перед каждым PR**.

## Добавить нового агента

1. Скачать `.md` из [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents/tree/main/categories)
2. Положить в `.claude/agents/`
3. Закоммитить — доступен всей команде

## Локальные настройки Claude Code

`.claude/settings.local.json` — gitignored, для персональных настроек (env, tunnel origins и т.д.)
