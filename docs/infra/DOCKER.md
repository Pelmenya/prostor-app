# Docker (продакшн)

Инфраструктура для сборки и запуска prostor-app в проде.

## Архитектура

Next.js с `output: 'standalone'` — при билде собирает автономный сервер (`server.js` + минимальные node_modules через Output File Tracing). Образ ~150MB вместо ~800MB.

```
Dockerfile          — multi-stage: deps → build → runner (node:22-alpine)
docker-compose.yml  — сервис prostor_app в сети crm_network_prod
.dockerignore       — исключения для Docker контекста
.env.example        — шаблон переменных окружения
```

## Как устроен Dockerfile

| Стадия      | Образ          | Что делает                                                        |
| ----------- | -------------- | ----------------------------------------------------------------- |
| **deps**    | node:22-alpine | `npm ci` — устанавливает зависимости                              |
| **builder** | node:22-alpine | Копирует deps + исходники, `npm run build`                        |
| **runner**  | node:22-alpine | Копирует standalone + static + public, запускает `node server.js` |

## NEXT*PUBLIC*\* переменные

`NEXT_PUBLIC_*` инлайнятся в JS-бандл **на этапе билда** (не в рантайме). Передаются через цепочку: `.env` на сервере → docker-compose `build.args` → Dockerfile `ARG` → Next.js инлайнит при `npm run build`.

- **Никакие `.env` файлы не попадают в Docker-образ** (`.env.local` в `.dockerignore`)
- На сервере создаётся `.env` рядом с `docker-compose.yml` — docker-compose автоматически его читает
- При добавлении новой `NEXT_PUBLIC_*` переменной — добавить `ARG` в Dockerfile + `args` в docker-compose

**При изменении `NEXT_PUBLIC_*` нужен пересбор образа** (`docker compose build`).

## Запуск

```bash
# Создать сеть (если ещё нет — бэкенд уже создал)
docker network create crm_network_prod 2>/dev/null || true

# Собрать и запустить
docker compose up -d --build

# Логи
docker compose logs -f prostor_app
```

## Связь с бэкендом

Фронт и бэк в одной Docker-сети `crm_network_prod` (external). Фронт может обращаться к бэку по внутреннему DNS: `http://crm_aqua_kinetics_back_prod:PORT`.

На проде `NEXT_PUBLIC_API_URL` — публичный URL бэка (запросы идут из браузера клиента, не из контейнера).
