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

Для единого origin браузер использует относительные адреса `NEXT_PUBLIC_API_URL=/api` и `NEXT_PUBLIC_SLOVO_API_URL=/smart-search`. Next.js rewrites проксируют их во внутреннюю Docker-сеть. Runtime SSR/ISR-запросы выполняются через `INTERNAL_API_URL` и `INTERNAL_SLOVO_API_URL`. Если prerender во время Docker build требует backend, используется доступный сборщику `BUILD_API_URL`.

- **Никакие `.env` файлы не попадают в Docker-образ** (`.env.local` в `.dockerignore`)
- На сервере создаётся `.env` рядом с `docker-compose.yml` — docker-compose автоматически его читает
- При добавлении новой `NEXT_PUBLIC_*` переменной — добавить `ARG` в Dockerfile + `args` в docker-compose

Если Docker Hub недоступен с сервера Timeweb, укажите в `.env` зеркало:

```env
NODE_IMAGE=dockerhub.timeweb.cloud/library/node:22.16-slim
```

**При изменении `NEXT_PUBLIC_*` нужен пересбор образа** (`docker compose build`).

## Запуск

```bash
# Создать общую внешнюю сеть
docker network create crm_network_prod 2>/dev/null || true

# Временно подключить уже работающий backend к общей сети.
# После объединения compose это подключение будет декларативным.
docker network connect crm_network_prod crm-back 2>/dev/null || true

# Собрать обычным builder с доступом в npm registry и запустить
docker compose build --builder default prostor_app
docker compose up -d --no-build

# Логи
docker compose logs -f prostor_app
```

## Связь с бэкендом

Фронт и бэк находятся в одной Docker-сети `crm_network_prod` (external). Next.js обращается к бэку по внутреннему DNS `http://crm-back:3000`.

Браузер обращается к тому же origin через `/api`; Next.js удаляет префикс `/api` и проксирует запрос в `crm-back:3000`. Для Swagger путь `/api/docs` передаётся без удаления префикса. Аналогично `/smart-search` проксируется в `slovo-api:3101`.

Cloudflare Tunnel должен вести на `http://prostor_app:3000`. Порт фронта публикуется только на `127.0.0.1` для локальной диагностики и не доступен напрямую из интернета.

```bash
docker rm -f cloudflared-quick 2>/dev/null || true
docker run -d \
  --name cloudflared-quick \
  --restart unless-stopped \
  --network crm_network_prod \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate --url http://prostor_app:3000

docker logs -f cloudflared-quick
```

Quick Tunnel выдаст новый адрес `https://*.trycloudflare.com`. После этого `/` открывает фронт, `/api/*` — основной backend, `/smart-search/*` — slovo-api.
