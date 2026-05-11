# Codebase navigation for {{projectName}}

This skill is your orientation guide. Load it at SessionStart, after a
`/clear` or compact, whenever you have lost context about where things live,
or when the user asks "where is X" or "how is this project organized".

Primary language: **{{primaryLanguage}}**.
Tech stack: **{{techStack}}**.

## Top-level layout

The repository follows the conventional layout for its stack. The most
important directories — the ones you will touch in 90% of tasks — are:

- **`src/`** — application source code. Most edits land here.
- **`tests/`** or **`__tests__/`** — test suites mirroring `src/`.
- **`templates/`** or **`public/`** — static assets, templates, or
  pre-rendered content (only present in some projects).
- **`scripts/`** — one-off and operational scripts. Read before running.
- **`.claude/`** — Claude Code configuration: skills, agents, commands,
  hooks, and `settings.json`. Treat this as load-bearing config.
- **`docs/`** — human-facing documentation. Project conventions and
  decisions sometimes live here in addition to the README.

Generated, vendored, or otherwise off-limits directories:

- `node_modules/`, `dist/`, `build/`, `.next/`, `.nuxt/`, `coverage/` — never
  edit. These are outputs.
- `vendor/`, `third_party/` — vendored copies of upstream code; only touch
  with an explicit reason.

## Where things live

Use these rules of thumb before grepping blindly:

| You are looking for...                | Start in...                                  |
|---------------------------------------|----------------------------------------------|
| HTTP route handlers / API endpoints   | `src/routes/`, `src/api/`, `src/server/`, `app/api/` |
| Database schema or models             | `src/models/`, `prisma/schema.prisma`, `src/db/`     |
| Business logic / domain services      | `src/services/`, `src/domain/`, `src/lib/`           |
| UI components                         | `src/components/`, `components/`, `app/`             |
| Shared utilities and helpers          | `src/utils/`, `src/lib/`                             |
| Configuration                         | repo root (`*.config.*`, `.env*`)                    |
| Type definitions                      | `src/types/`, colocated `*.types.ts` files           |
| Tests                                 | colocated `*.test.*` / `*.spec.*`, or `tests/`       |

## Entry points

Before making changes, locate the actual entry point. Common ones:

- **Node CLI**: `bin/<name>.js`, `src/cli/index.ts`, or the `"bin"` field in
  `package.json`.
- **Web server**: `src/server.ts`, `src/index.ts`, or the framework's
  conventional entry (`app/page.tsx` for Next.js App Router, `app.vue` for
  Nuxt, etc.).
- **Background workers / jobs**: `src/jobs/`, `src/workers/`,
  `scripts/<worker>.ts`.
- **Build / package config**: `package.json` `"scripts"` block tells you what
  the project actually runs day to day.

When in doubt: read `package.json` → `"scripts"`, then `README.md` →
"Getting Started", then trace from there.

## Important files to read first

For any non-trivial change, read these before editing:

1. **`README.md`** — the human-facing overview. Often lists conventions.
2. **`CLAUDE.md`** (root and any nested `.claude/CLAUDE.md`) — project-
   specific rules for AI assistants. These override your defaults.
3. **`package.json`** or equivalent — declared dependencies and scripts. If
   a script exists for what you are about to do manually, use the script.
4. **`.claude/settings.json`** — hooks, permissions, model defaults. Tells
   you what the harness will and won't allow.
5. **The file's immediate neighbors** — before editing `src/foo/bar.ts`,
   open the rest of `src/foo/`. Patterns are local; the surrounding files
   show you the project's house style for this layer.

## Anti-patterns to avoid

- **Don't grep the entire repo when you can read one directory.** Locality
  beats global search for most "how does X work" questions.
- **Don't introduce a new top-level directory** without checking whether
  existing ones already cover the concern.
- **Don't trust naming alone.** A file called `utils.ts` in one project may
  hold pure helpers; in another it may be the dumping ground. Open it
  before referencing what it "should" contain.
- **Don't edit generated files.** Find the generator and change that, or
  the next build will undo you.
