
# pstack in pi

pstack skills use Cursor names. Read this once per session, then map each Cursor name with the tables below. `<pstack>` is the folder that holds pstack's `skills/`: the directory two levels above any pstack `SKILL.md` path pi gave you. If a Cursor field has no row, drop it and say so. Never pass a field the tool schema rejects.

## Tools

| Cursor | pi |
| --- | --- |
| `Task` | `subagent` (pi-subagents). If only `subagents_enable` is listed, call it first. |
| `AskQuestion` | Ask in plain text and wait for the reply. |
| Open a todolist | Keep the list in your reply, update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | `read` `<pstack>/skills/<name>/SKILL.md` and follow it. Tell the user to type `/skill:<name>`. |
| `Grep`, `Glob` | `bash` with `rg` / `fd`. |

## Subagent fields

| Cursor | pi |
| --- | --- |
| `generalPurpose`, `poteto-agent` | agent `worker`. The brief must start with: "Read `<pstack>/skills/poteto-mode/SKILL.md` in full first (absolute path), then do the task." Use `context: "fresh"`. |
| `comment-sicko` | agent `worker`, brief says to read `<pstack>/agents/comment-sicko.md` and follow it. |
| `readonly: true` | agent `scout` (or `reviewer` for review). Brief also says "do not edit files". |
| `environment: "cloud"` | `worktree` option on `subagent`. Name the branch or commit to check out. |
| `environment: "local"` | omit. |
| `run_in_background: true` | `async: true`. |
| `resume` | `subagent` resume with the earlier `runId` (see `subagent({action:"guide"})`). If it rejects, spawn a new agent and paste the earlier result into the brief. |
| `file_attachments` | list the paths in the brief. |

## Models

The user's default model is the only model. Omit `model` on every `subagent` call so children inherit the session model and thinking level. This applies to every Cursor slug (`claude-*`, `grok-*`, `gpt-*`, `auto`, `inherit-parent`) and every role value in a model rule. Say once, in one line, that the slug was ignored. Pass `model` only when the user names one, as an exact `provider/id[:thinking]`.

## setup-pstack

Skip it. Say: "Skipped in pi: setup-pstack. All roles use the session model."

## Paths

| Cursor | pi |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.agents/skills/`, `~/.pi/agent/skills/` |
| `~/.cursor/plugins/` search for `poteto-mode/SKILL.md` | never search; use the absolute path the parent gave you, else `<pstack>`. |
| Always-applied rules (`.cursor/rules/*.mdc`) | `AGENTS.md` in the project. |
| Transcripts `~/.cursor/projects/<slug>/agent-transcripts/` | `~/.pi/agent/sessions/`. Newest file for the cwd is the current session. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>`. Read local, never fetch. |

## Cursor-only features

When a step needs one, write one line `Skipped in pi: <step>. <reason>.`, then continue. Do not stop, ask, or retry. Leave a named placeholder for anything a later step needs from it.

| Cursor | pi |
| --- | --- |
| Automations, `update_state`, routine wakes, `SendToUser` | Skip with the line. |
| Bugbot | Bugbot comments on a PR are ordinary review threads; triage with `gh`. Skip steps that start, wait for, or configure Bugbot when the PR has none. |
| Cursor cloud agents | Use `worktree`. Skip steps that need the cloud agent's own dashboard or machine. |
| Built-in PR tool | `gh pr create`. Not a skip. |

## Missing skills

Some steps name skills that pstack does not ship (they live in Cursor's `cursor-team-kit`): `deslop`, `control-cli`, `control-ui`, `create-skill`. If the skill is not in your skill list, write one line `Skipped in pi: <skill>. Not installed.` and continue. Never skip silently. For `control-ui` use `agent-browser` if it is listed.
