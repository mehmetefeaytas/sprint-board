# Sprint Board

[![CI](https://github.com/mehmetefeaytas/sprint-board/actions/workflows/ci.yml/badge.svg)](https://github.com/mehmetefeaytas/sprint-board/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-00e599.svg)](https://neon.tech)
[![MCP](https://img.shields.io/badge/MCP-server%20included-6f42c1.svg)](mcp/README.md)

[Türkçe](README.md) · **English**

A lightweight sprint tracker for small teams. For the kind of work where standing up
and configuring Jira isn't worth it — a one-week sprint for a team of three or four,
a bootcamp project, an internship program — where you want to start working quickly
without losing the answer to "who did what".

It focuses on two things:

- **An audit trail.** Every status change, assignment, comment and label is written
  to the `activity_log` table from a single place (`lib/audit.ts`). The activity
  screen shows that log, filterable by person and action type.
- **Fast adoption.** Signing in takes an email address and nothing else. No
  registration, no invitation emails, no passwords. A password is only asked of admin
  accounts. An email that isn't on the team list can't get in.

The interface is entirely in Turkish, works on mobile, and follows the light/dark
theme.

> Sign-in is a convenience mechanism, not a hard security boundary. Don't put
> genuinely confidential information on the board.

![Calendar view](docs/screenshots/takvim.png)

---

## Screenshots

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/pano.png"><img src="docs/screenshots/pano.png" alt="Kanban board view"></a><br><sub><b>Board view</b> — Yapılacak / Devam ediyor / Bloke / Tamamlandı (To do / In progress / Blocked / Done)</sub></td>
    <td width="50%"><a href="docs/screenshots/gorev-detay.png"><img src="docs/screenshots/gorev-detay.png" alt="Task detail"></a><br><sub><b>Task detail</b> — status, assignment, labels, comments, task history</sub></td>
  </tr>
  <tr>
    <td width="50%"><a href="docs/screenshots/aktivite.png"><img src="docs/screenshots/aktivite.png" alt="Activity log"></a><br><sub><b>Activity</b> — who did what, filtered by person and action</sub></td>
    <td width="50%"><a href="docs/screenshots/ekip.png"><img src="docs/screenshots/ekip.png" alt="Team screen"></a><br><sub><b>Team</b> — per-person progress; adding and removing is admin-only</sub></td>
  </tr>
  <tr>
    <td width="50%"><a href="docs/screenshots/giris.png"><img src="docs/screenshots/giris.png" alt="Sign-in screen"></a><br><sub><b>Sign-in</b> — the password field only appears for admin accounts</sub></td>
    <td width="50%" align="center"><a href="docs/screenshots/mobil.png"><img src="docs/screenshots/mobil.png" alt="Mobile view" width="300"></a><br><sub><b>Mobile</b> — for ticking things off from your phone</sub></td>
  </tr>
</table>

> The data in the screenshots is exactly the `sprint.config.ts` example that ships
> with the repo — clone it, seed it, and you get these screens verbatim.

---

## What's inside

**Two views, one keystroke apart.** The calendar view splits the sprint into day
tabs, with track blocks inside each day. The Kanban view lays the same tasks out in
**Yapılacak / Devam ediyor / Bloke / Tamamlandı** (To do / In progress / Blocked /
Done) columns. Your choice is kept in `localStorage`, so you land on the same view
next time.

**One-click completion.** Ticking the checkbox on a task card is enough; you don't
have to open the detail screen.

**Assigning and claiming are recorded separately.** Taking a claimable piece of work
— that is, a task carrying an `origin_track` — for yourself lands in the activity log
as *claim*; handing it to someone else lands as *assign*. "Who volunteered" and "who
was given it" don't get mixed up.

**Comments and `@name` mentions.** While writing a comment, typing `@` autocompletes
team member names; matching names are recorded in the `mentions` table. Matching
ignores case and handles Turkish characters, and captures names up to three words
long (`@Ayşe`, `@Ayşe Yılmaz`).

**Free-form labels.** There's no fixed list; you add the label you need on the spot
and `lib/labels.ts` normalizes it to lowercase — "ACİL" and "acil" count as the same
label.

**Highlights on the board.** Tasks flagged with `is_blocker` are called out as
blockers. Tasks carrying an `origin_track` are shown separately as claimable work —
when a track runs out of capacity, the work opens up to another track.

**A plain permission model.** Anyone can create tasks, change status, assign, and
comment. Deletion and people management are admin-only. (Full table below.)

**It works from the terminal too.** The repo contains an MCP server: Claude Code,
Codex and OpenCode can read and update the board directly. Changes an agent makes
land in the same activity log. See [`mcp/README.md`](mcp/README.md).

---

## Up and running in 5 minutes

The shortest path, via Vercel + Neon. No local database needed.

### 1. Get the repo and link it to Vercel

```bash
git clone <repo-url> sprint-board
cd sprint-board
npm install
npx vercel link
```

### 2. Attach the Neon database

In the Vercel dashboard, create a database under **Storage → Marketplace → Neon** and
attach it to the project. The integration injects `DATABASE_URL` as an environment
variable automatically; you don't need to add it by hand.

### 3. Add the remaining three variables

```bash
npx vercel env add SESSION_SECRET production --value "$(openssl rand -base64 32)"
npx vercel env add ADMIN_PASSWORD  production --value "$YOUR_ADMIN_PASSWORD"
npx vercel env add SEED_TOKEN      production --value "$(openssl rand -hex 24)"
```

> ⚠️ **Do not skip the `--value` flag.** Piping the value into
> `vercel env add NAME production` (`echo "$VALUE" | vercel env add ...`) can store
> the variable **empty**. The CLI doesn't always read stdin the way you'd expect, and
> it doesn't error either — the result is a silently empty `SESSION_SECRET` in
> production. Always pass the value with `--value "$VALUE"`.

> ⚠️ **Sensitive variables cannot be verified with `vercel env pull`.** Values Vercel
> stores as sensitive can't be read back; they land in the `.env` file empty or
> masked. Before you rewrite something because it "looks empty", verify it **with a
> live request** — for example, trying to sign in exercises `SESSION_SECRET`, and the
> seed call below exercises `SEED_TOKEN`.

### 4. Define your sprint

Edit `sprint.config.ts` to match your own team, days and tasks. (Guide in the section
below.)

### 5. Deploy and seed

```bash
npx vercel deploy --prod
curl -X POST https://<your-project>.vercel.app/api/seed \
  -H "x-seed-token: $SEED_TOKEN"
```

A successful response returns the number of rows inserted:

```json
{ "ok": true, "inserted": { "users": 3, "days": 3, "tasks": 8, "labels": 3 } }
```

Now open the URL, type your email, and start using the board.

---

## `sprint.config.ts` configuration guide

**`sprint.config.ts` in the root is the only file you need to edit.** The type
contract lives in `lib/config-types.ts`, runtime validation in `lib/config.ts`.

Validation runs **at module load**. A broken configuration doesn't turn into a
quietly strange board — it turns into a clear error message on the first request:

```
sprint.config.ts geçersiz:
  • Track kısaltması "DEV" iki kez kullanılmış — görev kodları çakışır.
  • "ali@ornek.com" tanımsız bir track'e bağlı: "MOBILE".
```

Validation messages are emitted in Turkish; the strings live in `lib/config.ts`.

### Top-level fields

| Field | Required | What it does |
|---|---|---|
| `projectName` | ✅ | The name shown in the tab title and top navigation. Cannot be empty. |
| `description` | ❌ | Short description. |
| `timezone` | ❌ | IANA time zone. Defaults to `Europe/Istanbul`. |
| `tracks` | ✅ | Workstreams. At least one. |
| `users` | ✅ | Sign-in whitelist. At least one must have `is_admin: true`. |
| `days` | ✅ | Sprint days. At least one. |
| `tasks` | ✅ | Tasks (an empty array is fine; you can fill the board from inside the app). |

### `tracks` — workstreams

| Field | Required | Rule |
|---|---|---|
| `key` | ✅ | The key written to the database. `A-Z`, `0-9` and underscore only. Unique. |
| `label` | ✅ | The name shown in the interface. |
| `abbr` | ✅ | The abbreviation used in task codes (`G1-DEV-01`). Unique across tracks — if it collides, the codes collide. |
| `color` | ✅ | A value from the fixed palette. |

Color is **not free text** — it's a fixed palette of eight options:
`indigo`, `teal`, `sky`, `rose`, `amber`, `violet`, `emerald`, `slate`.

The reason is Tailwind: class names are generated at build time by scanning the source
files, so assembling a string like `bg-${color}-100` at runtime produces no style at
all. The palette mappings are written out literally in `lib/config.ts`.

### `users` — the sign-in whitelist

| Field | Required | Rule |
|---|---|---|
| `email` | ✅ | Lowercased. Sign-in is governed by this list: not on it, not in. |
| `name` | ✅ | `@name` mentions look up this name. Make sure first words differ: if two people both start with "Ali", `@Ali` can't tell which one you mean. |
| `track` | ✅ | A `key` from `tracks`. |
| `is_admin` | ❌ | If `true`, sign-in asks for `ADMIN_PASSWORD` and unlocks deletion and people management. At least one person must have `true`. |

### `days` — sprint days

| Field | Required | Rule |
|---|---|---|
| `day_no` | ✅ | Positive integer, unique. Day tabs are ordered by it. |
| `date` | ✅ | `YYYY-MM-DD`. |
| `weekday` | ✅ | Day name (`Pazartesi`). |
| `theme` | ✅ | The theme of the day — shown under the tab title. Cannot be empty. |
| `milestone` | ❌ | If filled in, that day is marked as a milestone. |

### `tasks` — tasks

| Field | Required | Rule |
|---|---|---|
| `code` | ✅ | The task's permanent identity and URL (`/task/G1-DEV-01`). Unique. **Don't change it after seeding.** |
| `day_no` | ✅ | A `day_no` from `days`. |
| `track` | ✅ | A `key` from `tracks` — the task's current owner. |
| `title` | ✅ | Cannot be empty. |
| `origin_track` | ❌ | For handed-over work, the track the work came from. Shown as claimable on the board. |
| `detail` | ❌ | Long description. |
| `output` | ❌ | The task's concrete deliverable — it sharpens the definition of done. |
| `status` | ❌ | `todo` \| `in_progress` \| `blocked` \| `done`. Defaults to `todo`. |
| `assignee` | ❌ | An email from `users`. Left empty, the task starts unassigned. |
| `is_blocker` | ❌ | If `true`, the task is highlighted as a blocker on the board. |
| `labels` | ❌ | Free-form labels; lowercased. |

### A small example

```ts
import type { SprintConfig } from './lib/config-types';

const config: SprintConfig = {
  projectName: 'Sprint Panosu',
  description: 'Ekibin sprint takip panosu — kim ne yapıyor, ne kaldı.',

  tracks: [
    { key: 'DEV', label: 'Geliştirme', abbr: 'DEV', color: 'indigo' },
    { key: 'DESIGN', label: 'Tasarım', abbr: 'DSG', color: 'teal' },
  ],

  users: [
    { email: 'deniz@ornek.com', name: 'Deniz Kaya', track: 'DEV', is_admin: true },
    { email: 'ege@ornek.com', name: 'Ege Demir', track: 'DEV' },
  ],

  days: [
    { day_no: 1, date: '2026-07-30', weekday: 'Perşembe', theme: 'Kickoff ve kurulum' },
    {
      day_no: 2,
      date: '2026-07-31',
      weekday: 'Cuma',
      theme: 'Demo ve kapanış',
      milestone: 'Sprint bitişi — demo canlı',
    },
  ],

  tasks: [
    {
      code: 'G1-DEV-01',
      day_no: 1,
      track: 'DEV',
      title: 'Veri şemasını oluştur',
      output: 'Uygulanmış şema',
      is_blocker: true,
      assignee: 'ege@ornek.com',
      labels: ['bloker'],
    },
    {
      code: 'G2-DSG-01',
      day_no: 2,
      track: 'DESIGN',
      origin_track: 'DEV',
      title: 'Boş durum ekranlarını tasarla',
      status: 'in_progress',
    },
  ],
};

export default config;
```

The shipped example is in Turkish, as are the UI strings, which live in the
components — write your own config in whatever language your team uses.

---

## Environment variables

| Variable | Required | What for |
|---|---|---|
| `DATABASE_URL` | ✅ | The Neon Postgres connection. Vercel's Neon integration injects it automatically. |
| `SESSION_SECRET` | ✅ | JWT signing key. Generate with `openssl rand -base64 32`. |
| `ADMIN_PASSWORD` | ✅ | The sign-in password for admin accounts. |
| `SEED_TOKEN` | ✅ | Protects the `POST /api/seed` call. |
| `NEON_LOCAL_PROXY` | ❌ | Local development only. Don't define it in production. |

See `.env.example` for a template.

---

## Seeding

`POST /api/seed` does two things:

1. Sets up the schema. Every `CREATE` statement is `IF NOT EXISTS` — it won't touch
   existing tables. The single source of the schema is `SCHEMA_SQL` in
   `lib/schema.ts`.
2. Writes the contents of `sprint.config.ts` into the `users`, `sprint_days`, `tasks`
   and `task_labels` tables with `ON CONFLICT DO NOTHING`.

The endpoint compares the `x-seed-token` header against `SEED_TOKEN` and returns
`403` on a mismatch. It doesn't require a session (`proxy.ts` keeps it on the list of
open endpoints), so don't leave `SEED_TOKEN` guessable.

```bash
# Production
curl -X POST https://<your-project>.vercel.app/api/seed \
  -H "x-seed-token: $SEED_TOKEN"

# Local
curl -X POST http://localhost:3000/api/seed \
  -H "x-seed-token: $SEED_TOKEN"
```

> ⚠️ **Calling it again is safe, but it does NOT UPDATE existing rows.**
> `ON CONFLICT DO NOTHING` only inserts new rows. If you change a task's title in
> `sprint.config.ts` after seeding, that change will **not** show up on the live
> board — newly added rows get inserted, existing ones stay as they are. To fix an
> existing record, edit it through the board's own interface or update the database by
> hand.

---

## Local development

There's one trap: **Neon's HTTP driver can't connect to a plain Postgres.** It speaks
SQL over HTTP, and the protocols don't match. Locally you need a proxy in between
that speaks Neon's HTTP protocol — so, two containers.

### 1. Run Postgres and the Neon HTTP proxy

```bash
docker run -d --name sb-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sprintboard \
  -p 5432:5432 postgres:16-alpine

docker run -d --name sb-neon-proxy \
  -p 4444:4444 \
  -e PG_CONNECTION_STRING=postgres://postgres:postgres@host.docker.internal:5432/sprintboard \
  ghcr.io/timowilhelm/local-neon-http-proxy:main
```

### 2. Create `.env.local`

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sprintboard
NEON_LOCAL_PROXY=http://localhost:4444/sql
SESSION_SECRET=<output of openssl rand -base64 32>
ADMIN_PASSWORD=<your own local password>
SEED_TOKEN=<output of openssl rand -hex 24>
```

When `NEON_LOCAL_PROXY` is set, `lib/db.ts` points the driver's `fetchEndpoint` at
that address and turns off the secure WebSocket. In production the variable isn't
there, so behavior doesn't change at all.

### 3. Run the server and seed

```bash
npm install
npm run dev
curl -X POST http://localhost:3000/api/seed -H "x-seed-token: $SEED_TOKEN"
```

Available scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

Cleanup:

```bash
docker rm -f sb-pg sb-neon-proxy
```

---

## MCP: drive the board from your terminal

The repo contains a **stdio MCP server** (`mcp/`). Claude Code, Codex and OpenCode can
read and update the board directly — no need to switch to the browser:

```
> what's left for me today?
> mark G2-DEV-01 as done
> mention @Deniz in a comment about the schema
```

There are five read tools (`list_tasks`, `get_task`, `sprint_summary`,
`list_activity`, `list_people`) and five write tools (`set_task_status`,
`assign_task`, `create_task`, `add_comment`, `set_task_labels`). **There is
deliberately no delete tool** — we don't want an agent deleting data on a
misunderstanding.

Every change an agent makes lands in the same activity log as if it came from the
board, attributed to the person you set as `SPRINT_BOARD_ACTOR`.

Setup and ready-made configuration for three tools: [`mcp/README.md`](mcp/README.md).

---

## Permission model

| Action | Everyone | Admin |
|---|---|---|
| Sign in (email only) | ✅ | — |
| Sign in (email + `ADMIN_PASSWORD`) | — | ✅ |
| View the board and task details | ✅ | ✅ |
| Create tasks | ✅ | ✅ |
| Change status / one-click completion | ✅ | ✅ |
| Assign tasks and claim them | ✅ | ✅ |
| Write comments and mention with `@name` | ✅ | ✅ |
| Add / remove labels | ✅ | ✅ |
| View the activity log | ✅ | ✅ |
| **Delete tasks** | ❌ | ✅ |
| **Add / remove team members** | ❌ | ✅ |

Permission checks happen in two layers: `proxy.ts` cuts off session-less requests up
front, and route handlers separately check admin-only operations — that is, the proxy
isn't trusted. Accounts with `is_admin: true` in the configuration can't be removed
from the board.

---

## Project structure

```
sprint.config.ts          ← the only file you'll edit
proxy.ts                  Route protection (what middleware is called in Next.js 16)

lib/
  config-types.ts         The type contract for sprint.config.ts
  config.ts               Runtime validation + derived constants, color palette
  schema.ts               SCHEMA_SQL — the single source of the database schema
  db.ts                   Neon HTTP connection (lazily initialized)
  session.ts              JWT signing/verification + cookie handling
  audit.ts                logActivity — the single audit write point
  labels.ts               Label normalization (including the Turkish "İ")
  types.ts                Database row and API contract types

app/
  page.tsx                Board (calendar ↔ kanban)
  giris/page.tsx          Sign-in screen
  task/[code]/page.tsx    Task detail
  aktivite/page.tsx       Activity log (filtered by person + action)
  ekip/page.tsx           Team list and management
  board-data.ts           Server-side read layer — SELECT only
  format.ts               Turkish date/text formatting (fixed time zone)
  components/             UI components (card, detail, kanban, comment box…)
  api/
    auth/login            GET: is a password needed? · POST: sign in
    auth/logout           POST: sign out
    board                 GET: board data
    tasks                 GET, POST: list and create
    tasks/[id]            PATCH: status/assignment · DELETE: delete (admin)
    tasks/[id]/comments   GET, POST: comment + mentions
    tasks/[id]/labels     POST, DELETE: labels
    users                 GET · POST/DELETE: people management (admin)
    seed                  POST: schema + seeding (x-seed-token)

mcp/
  server.js               stdio MCP server (Claude Code · Codex · OpenCode)
  README.md               Setup, tool list, permission notes
.mcp.json.example         Ready-made configuration for Claude Code
```

Two rules of the architecture:

- **Reads from the server, writes through the API.** Pages `SELECT` straight from Neon
  via `app/board-data.ts` (rather than fetching their own origin and carrying cookies
  around). Every mutation goes from the client to an `/api/*` endpoint.
- **A single audit point.** Every mutating route calls the `logActivity` function in
  `lib/audit.ts`. That way no action goes unlogged.

---

## Data model

Seven tables. The single source of the schema is `lib/schema.ts`; because every
`CREATE` is `IF NOT EXISTS`, seeding can be called again.

| Table | What it holds | Notes |
|---|---|---|
| `users` | Email (PK), name, track, `is_admin` | The sign-in whitelist. If a person is deleted their tasks become unassigned (`ON DELETE SET NULL`). |
| `sprint_days` | `day_no` (PK), date, day name, theme, milestone | Day tabs. |
| `tasks` | `code` (UNIQUE), day, track, `origin_track`, title, description, output, status, assignee, `is_blocker`, order, completion info | `code` is the permanent identity and the URL. |
| `task_labels` | (`task_id`, `label`) | Composite PK; the same label can't be added twice. Goes away with the task. |
| `comments` | Task, author, body, timestamp | |
| `mentions` | Comment, task, mentioned person, `seen` | Produced by resolving `@name` in the comment body. |
| `activity_log` | Actor, action, task, old/new value, note, timestamp | The single write point is `lib/audit.ts`. Records survive task deletion — hence no FK. |

Action types: `login`, `status`, `assign`, `claim`, `comment`, `label`, `create`,
`delete`, `user_add`, `user_remove`.

---

## API endpoints

All of them require a session; `proxy.ts` cuts off session-less requests up front.
Endpoints that require admin are separately checked inside the route handler.

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/api/auth/login?email=` | anyone | Does this email need a password? |
| `POST` | `/api/auth/login` | anyone | Sign in; `password` required for admins |
| `POST` | `/api/auth/logout` | session | Clears the cookie |
| `GET` | `/api/board` | session | Everything the board needs in a single response |
| `POST` | `/api/tasks` | session | Creates a task; the code is generated automatically |
| `PATCH` | `/api/tasks/[id]` | session | `title`, `detail`, `output`, `day_no`, `status`, `assignee` — only the fields you send change |
| `DELETE` | `/api/tasks/[id]` | **admin** | Deletes the task |
| `GET` `POST` | `/api/tasks/[id]/comments` | session | Comments; `@name` is turned into a mention |
| `POST` `DELETE` | `/api/tasks/[id]/labels` | session | Adds/removes labels |
| `GET` | `/api/activity` | session | The activity log |
| `GET` | `/api/users` | session | The team list |
| `POST` `DELETE` | `/api/users` | **admin** | Adds/removes people |
| `POST` | `/api/seed` | `x-seed-token` | Schema + seeding (no session required) |

---

## Troubleshooting

**`/api/seed` returns 403.** `SEED_TOKEN` is either undefined on the server or
doesn't match the value in the header. If you added it on Vercel through a pipe it may
have been stored empty — add it again with the `--value` flag. After changing a
variable you have to redeploy.

**I get a 500 on sign-in.** Usually `SESSION_SECRET` is empty. See the `--value` trap
above; don't try to verify with `vercel env pull`, sensitive values come back empty.

**`fetch failed` / connection error, locally.** The Neon HTTP driver can't connect to
a plain Postgres. Make sure both containers are up and that `NEON_LOCAL_PROXY` is set
in `.env.local`.

**A `sprint.config.ts geçersiz: …` error.** Validation runs at module load and lists
every problem at once. Fix the items in the message; the app won't start until they're
all fixed. This is deliberate: we don't want a board that quietly behaves strangely on
a half-finished configuration.

**I seeded but my change isn't on the board.** `ON CONFLICT DO NOTHING` doesn't update
existing rows. To fix an existing task, use the board or the database.

**The track color on a task card comes out gray.** The track in the database has been
removed from the configuration. `trackStyle` doesn't crash on unknown values, it
returns a neutral gray. Add the removed track back, or move those tasks to another
track.

**MCP: `"…" panoda kayıtlı değil`.** `SPRINT_BOARD_ACTOR` has to be an email from the
configuration. It's required because write operations are recorded on that person's
behalf.

---

## Deliberately absent

These aren't missing, they're out of scope — complexity that doesn't pay for itself on
a small team:

- **Drag and drop.** Changing status is one click; there's no dragging between kanban
  columns.
- **Notifications.** No email, no push. Mentions sit in the `mentions` table; anyone
  who wants notifications can build on top of that.
- **Sprint history.** One sprint is kept. A new sprint means a new configuration and a
  clean database.
- **A role/permission system.** There are two levels: everyone and admin. Nothing
  fine-grained in between.
- **Multiple languages.** The interface is Turkish. The strings sit inside the
  components; no translation infrastructure was added.
- **Real authentication.** Emails aren't verified. The goal is an audit trail, not
  access control.

---

## Adapting it to your own project

- **Don't change `code` fields after seeding.** A task code is a permanent identity
  and it appears in the URL (`/task/G1-DEV-01`). Change it and old links break, and
  seeding will add a new row rather than deleting the old one.
- **Edits to `sprint.config.ts` don't reach live data.** Seeding only inserts. Make
  post-kickoff changes from the board.
- **Track color can't leave the palette.** If you want a new color, write the class
  names **by hand** into the `PALETTE` constant in `lib/config.ts` and add it to the
  `TrackColor` union in `lib/config-types.ts`. Assembling Tailwind classes at runtime
  doesn't work.
- **Keep `abbr` values unique.** If two tracks use the same abbreviation the
  auto-generated task codes collide — validation already rejects this.
- **Leave at least one `is_admin: true` account.** Otherwise nobody can delete a task
  or add someone to the team, and validation will error out.
- **Changing `SESSION_SECRET` signs everyone out.** Existing cookies become
  unverifiable.
- **Sign-in is not a security boundary.** Emails aren't verified; anyone who knows an
  address on the list can sign in as that person. The goal is an audit trail, not
  access control.
- **The time zone comes from the configuration, not the machine.** The default is
  `Europe/Istanbul`; to change it, put `timezone: 'Europe/Berlin'` in
  `sprint.config.ts`. Its being fixed is deliberate: if server and client don't
  produce the same date, you get a React hydration mismatch.
- **MCP runs on `DATABASE_URL`, so it has full access.** Sharing the connection string
  means sharing the whole board; details in `mcp/README.md`.

---

## Technical notes

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **Neon Postgres**, via the `@neondatabase/serverless` HTTP driver. `lib/db.ts` sets
  the connection up lazily — `DATABASE_URL` may be undefined at build time, so the
  connection isn't opened until the first query.
- **Session: an HS256-signed JWT via `jose`**, in an httpOnly cookie named
  `sb_session`, with a 30-day lifetime. NextAuth is **not** used; there's no external
  identity provider.
- **`proxy.ts`, not `middleware.ts`.** In Next.js 16 the middleware file has to be
  named `proxy.ts` and the exported function has to be named `proxy`. Copy over the
  old `middleware.ts` / `export function middleware` pair and route protection
  silently never runs. This proxy only runs on the `nodejs` runtime (`jose` requires
  it) and **doesn't touch the database** — it only verifies the JWT; the real
  permission checks are in the route handlers.
- **Tailwind v4** takes its configuration through PostCSS
  (`@tailwindcss/postcss`); there is no `tailwind.config.js` file.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). CI runs `npm run lint` and `npm run build` on
every push; it also separately checks the MCP server's syntax and its behavior when
environment variables are missing.

## License

MIT — see [LICENSE](LICENSE).
