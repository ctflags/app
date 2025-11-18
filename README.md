## Purpose

Web application to be used for CTF session. It provides a participant access to check the flags found, and an admin access to follow the leaderboard.

## Running it locally

```bash
docker compose up -d
```

## Participant access

Access this URL: [http://localhost:9999](http://localhost:9999)

![Participant access](./images/access-player-1.png)

Login with `p1`, `p2`or `p3` tokens.

![Participant access](./images/access-player-2.png)

## Administrator access

Access this URL: [http://localhost:9999/organizer](http://localhost:9999/organizer)

![Admin access](./images/access-admin-1.png)

Login with `Admin`.

![Admin access](./images/access-admin-2.png)

## Developer

```bash
docker compose up --watch
```