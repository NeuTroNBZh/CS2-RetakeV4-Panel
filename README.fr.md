# CS2-RetakeV4-Panel

[English version](README.md)

## Présentation

Panel web du plugin CS2 [RetakeV4](https://github.com/NeuTroNBZh). Les joueurs se connectent avec Steam et choisissent leurs armes par équipe et par type de round ; les choix sont enregistrés dans la base du plugin et appliqués dès le round suivant, sans quitter le navigateur.

## Prérequis

- RetakeV4 4.1.0 ou plus récent avec `Database.Type = MySql`.
- Docker avec le plugin Compose.
- Un nom de domaine pointant vers le serveur (le HTTPS est géré par Caddy).
- Un serveur MySQL 8 joignable (celui du plugin convient).

## Installation en 5 étapes

1. Exécuter `docker/mysql-user.sql` avec un administrateur MySQL. Remplacer le mot de passe, et `retakev4` par le nom de la base du plugin.
2. Copier `.env.example` en `.env` et renseigner `APP_KEY` (`docker run --rm ghcr.io/neutronbzh/cs2-retakev4-panel node ace generate:key --show`), `APP_URL`, `PANEL_DOMAIN` et les accès MySQL.
3. Placer `docker-compose.yml` et `Caddyfile` à côté de `.env`.
4. Lancer `docker compose up -d`.
5. Dans le `allocation.json` du plugin, vérifier que `Database.ServerKey` vaut `PANEL_RETAKE_SERVER` (défaut `default`), redémarrer le serveur CS2, puis ouvrir `https://<votre domaine>`.

Démarrer le panel une fois MySQL joignable. Le panel teste ses connexions aux bases une seule fois au démarrage ; si MySQL était arrêté à ce moment, le module `loadouts` reste désactivé jusqu'au redémarrage du panel (`docker compose restart panel`). Le fichier compose n'inclut pas MySQL, il n'y a donc pas de `depends_on` dessus.

### Emplacement de MySQL

- MySQL ailleurs : renseigner `PANEL_DB_HOST` et `RETAKE_DB_HOST` avec son nom d'hôte ou son IP.
- MySQL sur la même machine que Docker : dans un conteneur `localhost` désigne le conteneur lui-même, il faut donc utiliser `host.docker.internal` et décommenter les lignes `extra_hosts: ["host.docker.internal:host-gateway"]` du service `panel` dans `docker-compose.yml` (ce nom n'est pas défini sous Linux sinon). Le `bind-address` de MySQL doit accepter le bridge Docker (par exemple `0.0.0.0` ou l'IP du bridge), pas seulement `127.0.0.1`, et l'hôte de l'utilisateur MySQL (`'retake_panel'@'%'` dans `mysql-user.sql`) doit couvrir le réseau Docker.

## Configuration

| Variable | Obligatoire | Rôle |
|----------|-------------|------|
| `APP_URL` | oui | URL publique, `https://` en production |
| `APP_KEY` | oui | Clé de chiffrement des cookies |
| `PANEL_DOMAIN` | oui (compose) | Domaine servi par Caddy |
| `PANEL_DB_*` | oui | Connexion `panel` (HOST, PORT, USER, PASSWORD, DATABASE) |
| `RETAKE_DB_*` | oui pour `loadouts` | Connexion `retake` (base du plugin) |
| `PANEL_RETAKE_SERVER` | non | Clé du serveur lue dans `retake_catalog` (défaut `default`) |
| `PANEL_MODULES` | non | Modules activés, séparés par des virgules (défaut `loadouts`) |
| `PANEL_ADMINS` | non | SteamID64 des admins, séparés par des virgules |
| `STEAM_API_KEY` | non | Pseudos et avatars |
| `PANEL_LOCALE` | non | Langue par défaut (`en`, `fr`) |

## Modules

`PANEL_MODULES` liste les modules à activer. Un module dont la connexion à la base manque ou est injoignable au démarrage est désactivé et un avertissement est journalisé ; le reste du panel continue de fonctionner. Il n'y a pour l'instant que le module `loadouts` (nécessite la connexion `retake`). `GET /health` répond `{"status":"ok"}` et sert au healthcheck Docker.

## Sécurité

- HTTPS obligatoire : en production le panel refuse de démarrer si `APP_URL` n'est pas en `https://`.
- Utiliser l'utilisateur MySQL limité de `docker/mysql-user.sql` : il lit uniquement le catalogue et lit/écrit `player_loadout` dans la base du plugin.
- `PANEL_ADMINS` donne les droits d'administration aux seuls SteamID64 listés.
- Le panel ne fait confiance à `X-Forwarded-For` que depuis un pair privé ou loopback (le conteneur Caddy) ; ne pas publier directement le port 3333 : un port publié peut faire apparaître un client comme un proxy privé de confiance et falsifier `X-Forwarded-For`, ce qui contourne la limite de tentatives de connexion.

## Développement

```bash
docker compose -f compose.test.yml up -d --wait   # optionnel, voir ci-dessous
npm ci
npm run dev
node ace test
```

Les tests démarrent leur propre MySQL éphémère (`mysql-memory-server`) ; `compose.test.yml` ne sert qu'avec `PANEL_TEST_DB=external`. Autres contrôles : `npm run lint`, `npm run typecheck`, `npm run coverage` (au moins 80 % des lignes de `app/`).

## Licence

MIT, voir [LICENSE](LICENSE).
