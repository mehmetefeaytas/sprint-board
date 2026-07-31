# Sprint Board MCP server

Lets you drive the board from inside **Claude Code, Codex, OpenCode** and any other
tool that speaks MCP. Without switching to the browser you can say "what's left for me
today", "mark this task done", "ask @Dana".

Every change an agent makes lands in the **activity log under your name**, exactly as
if it came from the board. The audit trail stays intact.

## Install

```bash
cd mcp
npm install
```

The server needs two environment variables:

| Variable | What for |
|---|---|
| `DATABASE_URL` | The board's database. You can get the Vercel value with `vercel env pull`. |
| `SPRINT_BOARD_ACTOR` | Your email. Writes are recorded under this person, who has to be registered on the board. |

To check that it works, run it directly — the server should print
`sprint-board MCP ready` and then wait (Ctrl+C to quit):

```bash
DATABASE_URL='postgres://...' SPRINT_BOARD_ACTOR='you@example.com' node mcp/server.js
```

## Connecting a tool

In the examples below, replace `/absolute/path/sprint-board` with your own checkout.
Use an absolute path: tools may start the server from a different working directory.

### Claude Code

```bash
claude mcp add --env DATABASE_URL='postgres://...' \
  --env SPRINT_BOARD_ACTOR='you@example.com' \
  --transport stdio sprint-board \
  -- node /absolute/path/sprint-board/mcp/server.js
```

The `--` is required: everything before it belongs to Claude, everything after it is
the command that runs the server. Also don't put the server name straight after
`--env` — the CLI will read it as another `KEY=value` pair.

To share the setup with your team, copy `.mcp.json.example` from the repo root to
`.mcp.json` and fix the paths. To keep secrets out of the repo you can leave the
values as shell variables like `${DATABASE_URL}`.

### Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.sprint-board]
command = "node"
args = ["/absolute/path/sprint-board/mcp/server.js"]

[mcp_servers.sprint-board.env]
DATABASE_URL = "postgres://..."
SPRINT_BOARD_ACTOR = "you@example.com"
```

Or via the CLI:

```bash
codex mcp add sprint-board --env DATABASE_URL='postgres://...' \
  --env SPRINT_BOARD_ACTOR='you@example.com' \
  -- node /absolute/path/sprint-board/mcp/server.js
```

### OpenCode

`opencode.json` (project) or `~/.config/opencode/opencode.json` (global):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "sprint-board": {
      "type": "local",
      "command": ["node", "/absolute/path/sprint-board/mcp/server.js"],
      "enabled": true,
      "environment": {
        "DATABASE_URL": "postgres://...",
        "SPRINT_BOARD_ACTOR": "you@example.com"
      }
    }
  }
}
```

### Other tools

The server speaks plain stdio MCP. The command to run it is the same everywhere:
`node <path>/mcp/server.js`, plus the two environment variables. Only the shape of
the configuration file differs from tool to tool; use these three as templates.

## Tools

### Reading

| Tool | What it does |
|---|---|
| `list_tasks` | Lists tasks with optional filters: `day_no`, `track`, `status`, `assignee`, `label`, `unassigned`, `blockers_only` |
| `get_task` | Every field of a task plus its labels and comments (`code` is case-insensitive) |
| `sprint_summary` | Progress day by day, completion per person, open blockers |
| `list_activity` | Who did what, newest first; filter by `actor` or `task_code`, `limit` defaults to 30 |
| `list_people` | Registered people, their tracks, whether they are an admin |

### Writing

| Tool | What it does |
|---|---|
| `set_task_status` | Changes the status. Picking `done` also records who completed it and when |
| `assign_task` | Assigns a task. With no `email` you take it on yourself; that counts as a `claim` only when the task is up for grabs, otherwise it is an `assign` like any other. `unassign: true` clears the assignee |
| `create_task` | Opens a new task; without a code one is generated as `G{day}-{TRACK}-{n}` |
| `add_comment` | Leaves a comment; `@Name` in the body resolves to a mention |
| `set_task_labels` | Adds or removes labels |

**There is deliberately no delete tool.** We don't want an agent deleting a task on a
misunderstanding; deleting happens on the board, by hand.

## How it works

The server does not go through the web app's HTTP API — it connects **straight to the
database** (the `pg` driver). That way there is no new authentication surface to open
— no service account, no API key; whoever sets up the MCP server already has
`DATABASE_URL`.

Two consequences:

- **Permissions are not identical to the board's.** On the web, deleting is an admin
  job; here deleting doesn't exist at all. Beyond that, the MCP server can do
  anything the person you set as `SPRINT_BOARD_ACTOR` could do.
- **`DATABASE_URL` is full access.** Sharing it means sharing the whole board.

Writes go into the `activity_log` table in the same shape as the web app's
`lib/audit.ts`. Moves that came from MCP show up on the board's Activity screen too —
they don't go somewhere separate.
