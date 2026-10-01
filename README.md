# CS2-RetakeV4-Panel

[Version française](README.fr.md)

## What it is

A web panel for the [RetakeV4](https://github.com/NeuTroNBZh) CS2 plugin. Players sign in with Steam and choose their weapons per team and round type; the choices are stored in the plugin database and applied from the next round, without leaving the browser.

## Requirements

- RetakeV4 4.1.0 or later with `Database.Type = MySql`.
- Docker with the Compose plugin.
- A domain name pointing to the server (HTTPS is handled by Caddy).
- A reachable MySQL 8 server (the one the plugin already uses is fine).

## Install in 5 steps

1. Run `docker/mysql-user.sql` as a MySQL administrator. Replace the password, and `retakev4` with the database name used by the plugin.
2. Copy `.env.example` to `.env` and fill in `APP_KEY` (`docker run --rm ghcr.io/neutronbzh/cs2-retakev4-panel node ace generate:key --show`), `APP_URL`, `PANEL_DOMAIN` and the MySQL settings.
3. Put `docker-compose.yml` and `Caddyfile` next to `.env`.
4. Run `docker compose up -d`.
5. In the plugin `allocation.json`, check that `Database.ServerKey` equals `PANEL_RETAKE_SERVER` (default `default`), restart the CS2 server, then open `https://<your domain>`.

Start the panel after MySQL is reachable. The panel checks its database connections once at boot; if MySQL was down at that moment, the `loadouts` module stays disabled until the panel is restarted (`docker compose restart panel`). The compose file does not include MySQL, so there is no `depends_on` for it.

### MySQL location

- MySQL elsewhere: set `PANEL_DB_HOST` and `RETAKE_DB_HOST` to its host name or IP.
- MySQL on the same machine as Docker: inside a container `localhost` is the container itself, so use `host.docker.internal` and uncomment the `extra_hosts: ["host.docker.internal:host-gateway"]` lines of the `panel` service in `docker-compose.yml` (the name is not defined on Linux otherwise). MySQL `bind-address` must accept the Docker bridge (for example `0.0.0.0` or the bridge IP), not only `127.0.0.1`, and the MySQL user host (`'retake_panel'@'%'` in `mysql-user.sql`) must cover the Docker network.

## Configuration

| Variable | Required | Role |
|----------|----------|------|
| `APP_URL` | yes | Public URL, `https://` in production |
| `APP_KEY` | yes | Cookie encryption key |
| `PANEL_DOMAIN` | yes (compose) | Domain served by Caddy |
| `PANEL_DB_*` | yes | `panel` connection (HOST, PORT, USER, PASSWORD, DATABASE) |
| `RETAKE_DB_*` | yes for `loadouts` | `retake` connection (the plugin database) |
| `PANEL_RETAKE_SERVER` | no | Server key read in `retake_catalog` (default `default`) |
| `PANEL_MODULES` | no | Enabled modules, comma separated (default `loadouts`) |
| `PANEL_ADMINS` | no | Admin SteamID64 list, comma separated |
| `STEAM_API_KEY` | no | Player names and avatars |
| `PANEL_LOCALE` | no | Default language (`en`, `fr`) |

## Modules

`PANEL_MODULES` lists the modules to enable. A module whose database connection is missing or unreachable at boot is disabled and a warning is logged; the rest of the panel keeps working. Today the only module is `loadouts` (needs the `retake` connection). `GET /health` answers `{"status":"ok"}` and is used by the Docker healthcheck.

## Security

- HTTPS is mandatory: the panel refuses to start in production with an `APP_URL` that is not `https://`.
- Use the limited MySQL user from `docker/mysql-user.sql`: it can only read the catalog and read/write `player_loadout` in the plugin database.
- `PANEL_ADMINS` grants admin rights to the listed SteamID64 only.
- The panel trusts `X-Forwarded-For` only from private or loopback peers (the Caddy container); do not publish port 3333 directly: a published port can make a client appear as a trusted private proxy and spoof `X-Forwarded-For`, which bypasses the login rate limit.

## Development

```bash
docker compose -f compose.test.yml up -d --wait   # optional, see below
npm ci
npm run dev
node ace test
```

Tests start their own ephemeral MySQL (`mysql-memory-server`); `compose.test.yml` is only needed with `PANEL_TEST_DB=external`. Other checks: `npm run lint`, `npm run typecheck`, `npm run coverage` (at least 80 % of lines on `app/`).

## License

MIT, see [LICENSE](LICENSE).
