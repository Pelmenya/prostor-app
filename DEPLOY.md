# Prostor App deploy runbook

Next.js frontend работает как единственный публичный вход:

```text
https://ak-prostore.ru
  /api/*          -> crm-back
  /smart-search/* -> slovo-api
  everything else -> Next.js app
```

Контейнер `prostor_app` публикуется только на `127.0.0.1:3010`, наружу его отдает Caddy.

## Env

```bash
cd ~/prostor-app
docker network create crm_network_prod 2>/dev/null || true
docker network connect crm_network_prod crm-back 2>/dev/null || true

SLOVO_GATEWAY="$(docker network inspect crm_network_prod -f '{{(index .IPAM.Config 0).Gateway}}')"
```

Минимальный `.env`:

```env
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://crm-back:3000
BUILD_API_URL=

NEXT_PUBLIC_SLOVO_API_URL=/smart-search
INTERNAL_SLOVO_API_URL=http://<SLOVO_GATEWAY>:3101
BUILD_SLOVO_API_URL=

NEXT_PUBLIC_S3_PUBLIC_URL=https://s3.twcstorage.ru/<bucket>

NEXT_PUBLIC_SALE_PRICES=Приложение
NEXT_PUBLIC_COMMISSION_PERCENTS=35
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
NEXT_PUBLIC_SMART_SEARCH_MOCK=0

NODE_IMAGE=dockerhub.timeweb.cloud/library/node:22.16-slim
PORT_APP=3010

NEXT_PUBLIC_WEB_APP_URL=https://ak-prostore.ru
NEXT_PUBLIC_ALLOWED_DEV_ORIGINS=
NEXT_PUBLIC_DEV_USER_ID=
NEXT_PUBLIC_ADMIN_IDS=
```

Если `slovo-api` будет контейнером в `crm_network_prod`, можно использовать `INTERNAL_SLOVO_API_URL=http://slovo-api:3101`. Если он systemd-процесс на host, нужен gateway, как выше.

## Build и запуск

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=120 prostor_app
```

Smoke:

```bash
curl -I http://127.0.0.1:3010
curl -I http://127.0.0.1:3010/api/docs
curl -i http://127.0.0.1:3010/smart-search/health/ready
```

Если Docker Hub тормозит или rate-limit, используйте mirror в `.env`:

```env
NODE_IMAGE=dockerhub.timeweb.cloud/library/node:22.16-slim
```

## Caddy и TLS

Установка:

```bash
apt-get update
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list

apt-get update
apt-get install -y caddy
```

`/etc/caddy/Caddyfile`:

```caddy
ak-prostore.ru {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3010
}

www.ak-prostore.ru {
    redir https://ak-prostore.ru{uri} permanent
}
```

```bash
caddy fmt --overwrite /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy
```

## DNS checklist

Обе A-записи должны смотреть на основной сервер:

```bash
dig +short ak-prostore.ru A
dig +short www.ak-prostore.ru A
```

Ожидается один и тот же IP.

Если `www` уже указывает на новый сервер, а root еще на старый, Caddy будет отвечать на `www`, но redirect уведет браузер на старый root. Временно можно отключить redirect:

```caddy
ak-prostore.ru, www.ak-prostore.ru {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3010
}
```

После обновления root DNS можно вернуть канонический redirect `www -> root`.

## Финальные проверки

```bash
curl -I https://ak-prostore.ru
curl -i https://ak-prostore.ru/smart-search/health/ready
curl -I https://ak-prostore.ru/api/docs

docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
systemctl status caddy --no-pager
```

Проверить сертификат:

```bash
echo | openssl s_client -connect ak-prostore.ru:443 -servername ak-prostore.ru 2>/dev/null \
  | openssl x509 -noout -subject -issuer -ext subjectAltName
```

Если `curl` пишет `SSL: no alternative certificate subject name matches target host name`, почти всегда домен еще резолвится на старый IP или запрос попал не в Caddy.

## Что проверить в браузере

- главная страница;
- регистрация и вход по email/password;
- каталог, карточка товара, корзина;
- оформление заказа;
- профиль и адреса;
- умный поиск;
- карта воды;
- отсутствие Telegram Login в пользовательском сценарии.
