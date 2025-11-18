## Purpose

Web application to be used for CTF session. It provides a participant access to check the flags found, and an admin access to follow the leaderboard.

## Running it locally

You can run it locally with [Docker Compose](https://docs.docker.com/compose/). The following command use [compose.yaml](./compose.yaml) file.

```bash
docker compose up -d
```

## User access

By default, the following configuration is used, which defines:
- dummy challenges
- test participants
- administrator access

```yaml
challenges:
  - name: "Challenge 1"
    description: "Find the hidden flag in the logs"
    flag: "flag_1"
    points: 100
    hint: "Check the application logs carefully"
  - name: "Challenge 2"
    description: "Decode the secret message"
    flag: "flag_2"
    points: 150
    hint: "Base64 might be involved"
  - name: "Challenge 3"
    description: "Resource checker challenge"
    flag: "flag_3"
    points: 200
    hint: "Did you annotate something ?"

participants:
  - token: "p1"
    name: "Sample Player01"
  - token: "p2"
    name: "Sample Player02"
  - token: "p3"
    name: "Sample Player03"

organizers:
  - token: "Admin"
    name: "Sample Administrator"
```

### Access as a participant

Access this URL: [http://localhost:9999](http://localhost:9999)

![Participant access](./images/access-player-1.png)

Login with `p1`, `p2`or `p3` tokens.

![Participant access](./images/access-player-2.png)

### Access as an administrator

Access this URL: [http://localhost:9999/organizer](http://localhost:9999/organizer)

![Admin access](./images/access-admin-1.png)

Login as an administrator (using `Admin` password by default) allows you to manage the users, challenges, ...

![Admin access](./images/access-admin-2.png)

## Developer

If you want to enhance this application, run it with Docker Compose in the "watch" mode as follows. It allows the changes done in your IDE to be automatically taken into account.

```bash
docker compose up --watch
```