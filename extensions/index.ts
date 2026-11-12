import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execFile } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const SRC = join(homedir(), ".pi/agent/pstack-src"); // clone of cursor/plugins
const PSTACK = join(SRC, "pstack");
const MIRROR = join(homedir(), ".pi/agent/pstack-mirror"); // skills copy with "[pstack]" in each description
const STAMP = join(homedir(), ".pi/agent/pstack-last-sync");
const ADAPTER = join(dirname(fileURLToPath(import.meta.url)), "adapter.md");
const EVERY_MS = 6 * 3600_000; // ponytail: fixed 6h throttle, make it a setting if needed

const git = (...a: string[]) => run("git", a, { timeout: 60_000 }).then((r) => r.stdout.trim());

async function sync(): Promise<string | null> {
  if (!existsSync(SRC)) {
    await git("clone", "--depth", "1", "https://github.com/cursor/plugins", SRC);
    writeFileSync(STAMP, "");
    return "installed";
  }
  if (existsSync(STAMP) && Date.now() - statSync(STAMP).mtimeMs < EVERY_MS) return null;
  const before = await git("-C", SRC, "rev-parse", "HEAD");
  // clone is a cache: a depth-1 fetch is never a fast-forward of the old HEAD, so reset instead of pull
  await git("-C", SRC, "fetch", "--depth", "1", "origin", "HEAD");
  await git("-C", SRC, "reset", "--hard", "FETCH_HEAD");
  writeFileSync(STAMP, "");
  return before === (await git("-C", SRC, "rev-parse", "HEAD")) ? null : "updated";
}


// Prefix each skill description with [pstack] so the `/` menu shows where it came from.
function tag(md: string): string {
  return md.replace(/^description:[ \t]*(.*)\n((?:[ \t]+.*\n)*)/m, (_m, first: string, rest: string) => {
    let text = first.trim();
    if (text.startsWith('"')) text = JSON.parse(text);
    else if (/^[>|]/.test(text)) text = rest.split("\n").map((l) => l.trim()).filter(Boolean).join(" ");
    return `description: ${JSON.stringify("[pstack] " + text)}\n`;
  });
}

async function mirror() {
  const head = await git("-C", SRC, "rev-parse", "HEAD");
  const mark = join(MIRROR, ".head");
  if (existsSync(mark) && readFileSync(mark, "utf8") === head) return;
  rmSync(MIRROR, { recursive: true, force: true });
  mkdirSync(MIRROR, { recursive: true });
  cpSync(join(PSTACK, "skills"), join(MIRROR, "skills"), { recursive: true });
  for (const n of readdirSync(PSTACK)) // siblings (docs/, agents/) stay reachable via ../
    if (n !== "skills") symlinkSync(join(PSTACK, n), join(MIRROR, n));
  for (const n of readdirSync(join(MIRROR, "skills"))) {
    const f = join(MIRROR, "skills", n, "SKILL.md");
    if (existsSync(f)) writeFileSync(f, tag(readFileSync(f, "utf8")));
  }
  writeFileSync(mark, head);
}

export default function (pi: ExtensionAPI) {
  let active = false; // set once a pstack skill is used; adapter then rides every turn

  const RELOAD = "pstack-reload";
  let pending = false; // update landed while the agent was busy

  pi.registerCommand(RELOAD, {
    description: "Reload pi after a pstack update",
    handler: async (_args, ctx) => {
      await ctx.reload();
    },
  });
  const reloadNow = () => pi.sendUserMessage("/" + RELOAD, { expandPromptTemplates: true });

  pi.on("agent_settled", () => {
    if (!pending) return;
    pending = false;
    reloadNow();
  });

  pi.on("session_start", async (_e, ctx) => {
    active = false;
    pending = false;
    sync()
      .then((r) => {
        if (!r) return;
        ctx.ui.notify(`pstack ${r}, reloading.`, "info");
        if (ctx.isIdle()) reloadNow();
        else pending = true; // reload when the current run settles, never mid-run
      })
      .catch((e) => ctx.ui.notify(`pstack sync failed, using cached copy: ${String(e.message).split("\n")[0]}`, "warning"));
  });

  pi.on("resources_discover", async () => {
    if (!existsSync(join(PSTACK, "skills"))) return { skillPaths: [] };
    try { await mirror(); } catch { return { skillPaths: [join(PSTACK, "skills")] }; } // untagged fallback
    return { skillPaths: [join(MIRROR, "skills")] };
  });

  pi.on("before_agent_start", (e) => {
    if (e.messageType !== "user" || !existsSync(ADAPTER)) return;
    const names = existsSync(join(PSTACK, "skills")) ? readdirSync(join(PSTACK, "skills")) : [];
    const m = /\/skill:([\w-]+)/.exec(e.prompt ?? "");
    if (/pstack|poteto/i.test(e.prompt ?? "") || (m && names.includes(m[1]))) active = true;
    if (!active) return;
    return {
      systemPrompt: e.systemPrompt + "\n\n" + readFileSync(ADAPTER, "utf8").replaceAll("<pstack>", PSTACK),
    };
  });
}
