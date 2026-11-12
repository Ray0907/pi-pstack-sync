# pi-pstack-sync

Runs [pstack](https://github.com/cursor/plugins/tree/main/pstack) (Cursor's engineering skills, including `/skill:poteto-mode`) in [pi](https://pi.dev), and keeps it in sync with upstream.

pstack is not bundled. On start the extension clones `cursor/plugins` to `~/.pi/agent/pstack-src` and refreshes it (`git fetch --depth 1` + `git reset --hard`, so never edit it) at most every 6 hours. When upstream changes it tells you to run `/reload`.

## Install

Requires [`pi-subagents`](https://www.npmjs.com/package/pi-subagents) (`pi install npm:pi-subagents`).

```bash
pi install npm:pi-pstack-sync
```

## Use

```text
/skill:poteto-mode investigate why the retry test is flaky, then fix and verify
/skill:poteto-help which skill should I use to review this branch?
```

## What it does

- Loads pstack's skills into pi.
- When a prompt mentions pstack or poteto, or uses a pstack `/skill:`, it adds a Cursor-to-pi name map to the system prompt: `Task` becomes `subagent`, `poteto-agent` becomes `worker`, read-only work becomes `scout`, background runs become `async`.
- Subagents inherit your session model. Cursor model slugs are ignored.
- A step that needs a skill pstack does not ship (`deslop`, `control-ui`, `control-cli`, `create-skill`, from Cursor's team kit) is reported as `Skipped in pi: <skill>. Not installed.`
- Bugbot and Cursor Automations steps are skipped with a note.

## Limits

- No `AskQuestion` equivalent: the agent asks in plain text.
- Multi-model steps (`interrogate`, `arena`) run on one model.
- `resume` is not tested.
- `pi -p` buffers output until the run ends; for long runs use `pi --mode json`.

## License

MIT. pstack itself is MIT-licensed by its authors and is fetched at runtime, not redistributed here.
