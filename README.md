# accrete-kit

Creates and upgrades ACCRETE Workspaces. This repository,
`accrete-template`, publishes the npm package `accrete-kit`: the generator, five complete
object Skills with their reference manuals, Coordinator and Subagent guidance,
configuration examples, the command catalog, and the Kernel's release binaries.

A Workspace is an independent Git project owned by the user, not a fork kept in sync with
this template. `accrete-kit` creates and maintains it, general-purpose coding agents work in it, and
the Kernel provides the native persistent infrastructure. The companion `accrete-cli`
repository publishes that Kernel as GitHub Release archives. It works inside an existing
Workspace, as a plain native executable there, and knows nothing about this repository.

```sh
npx accrete-kit@latest create my-project
npx accrete-kit@latest create my-project --timezone Asia/Shanghai --agents claude --no-git --no-install
npx accrete-kit@latest create .
npx accrete-kit@latest upgrade
npx accrete-kit@latest upgrade --dry-run
npx accrete-kit@<version> install
```

## What the Agent receives

| Skill | Practical scope |
|---|---|
| `accrete-models` | Model identity, Git repository arrangements, host bindings, iterations, revision context, and native integration |
| `accrete-tools` | Capability admission, editable source, live or retained revisions, Skill exposure, refresh, retirement, and explicit export |
| `accrete-data` | Logical Data identity, content descriptions, origins, locations, inexpensive registration, materialization, and retention |
| `accrete-results` | Activities and observations, Model/Tool/Data associations, historical context, partial outcomes, amendments, and native queries |
| `accrete-memory` | Complete authored entries, stable identity, relevant prior understanding, supersession, and continuity between sessions |

Each Skill has concise trigger metadata and instructions, with deeper references
loaded when useful. Skills contain no persistent-operation scripts. The Kernel
publishes managed object changes; the Agent develops code, uses native tools,
performs scientific work, and supplies its interpretation.

The project manuals cover object relationships, Coordinator judgment, Subagent
briefs and handovers, long-term capability growth, configuration, and remote
work. Research can begin before anything is registered. Retention can be selective
and retrospective. No fixed worker count, model family, experiment sequence, or
mandatory evaluation procedure is installed.

## What a Workspace contains

`--agents` selects `codex,claude` (the default), `codex`, `claude`, or `none`.
`--timezone`, `--name` and `--id` set project details. Git is initialized unless `--no-git`
is given or the directory is already in a repository; creation does not make a first commit
or configure a remote. It writes `.accrete/project.toml` and the installed assets, and
installs this host's Kernel unless `--no-install` is given. It adds no root `package.json` or
`node_modules/`. Store directories appear on first use.

| Project path | Purpose and ownership |
|---|---|
| `AGENTS.md` | Short managed entry section alongside owner instructions |
| `CLAUDE.md` | Import of `AGENTS.md` when the Claude profile is enabled |
| `.accrete/PROJECT.md` | Create-once project purpose, preferences, and machine context |
| `.accrete/docs/` | Managed overview, working guidance, CLI semantics, and generated command map |
| `.accrete/bin/accrete` | Ignored Kernel binary for this host; restored with `install` after a clone |
| `.accrete/project.toml` | Generated project identity, format, timezone, and shared roots |
| `.accrete/local.toml` | Ignored host-specific bindings, supplied for the actual machine |
| `.accrete/config-examples/` | Illustrative shared, workstation, and compute-host TOML |
| `.accrete/release.json` | Template and Kernel versions that installed these files |
| `.accrete/contracts/cli-v1.json` | Machine-readable command catalog |
| `.accrete/contracts/input-drafts.schema.json` | Caller-input shapes; the Kernel owns persisted envelopes |
| `.accrete/template-upgrades/` | Candidates awaiting resolution, when an upgrade met edited content |
| `.accrete/examples/` | Nine JSON drafts and two plain Markdown draft bodies |
| `.accrete/template-install.json`, `.accrete/template-bases/` | Installation inventory and retained small bases for later upgrades |
| `.agents/skills/accrete-*/` | Five foundational Skills when Codex is enabled |
| `.claude/skills/accrete-*/` | Five foundational Skills when Claude is enabled |
| `.accrete/objects/`, `results/`, `memory/` | Default managed document roots, created by the Kernel as needed |
| `.accrete/data/` | Ignored default root for managed Data replicas, created on first materialization |
| `tools/`, `scratch/` | Default editable capability sources and ongoing work; `scratch/` is ignored |

Configured paths can place Models, Tools, Data, Results, Memory, and Scratch
elsewhere. A Model may be the project repository, an external repository, an
optional submodule, or a worktree. The template creates no placeholder Models,
Tools, Data, Results, or Memory entries.

Start Claude Code or Codex at the Workspace root. Agents run the Kernel as
`.accrete/bin/accrete` there. From anywhere else they select the owning Workspace explicitly:

```sh
/path/to/my-project/.accrete/bin/accrete --project /path/to/my-project config resolve --json
```

The host discovers Skills through its normal project mechanisms. The Kernel performs
organizational writes. Git, scientific programs, domain readers, SQLite, SSH, and site
schedulers retain their normal roles.

After cloning, run `npx accrete-kit@<version> install`. On a host without Node, extract the
release archive into `.accrete/bin/`; `.accrete/docs/remote-work.md` gives both routes.

## Upgrading a Workspace

```sh
npx accrete-kit@latest upgrade --dry-run
npx accrete-kit@latest upgrade
npx accrete-kit@latest upgrade --accept PATH
```

The upgrader uses installed base content and digests. Unchanged managed content receives
the new asset. Edited content stays in place with a candidate for resolution: the run still
exits 0, lists `pending`, and warns. After resolving one in the live file, `--accept PATH`
records it. Owner text outside managed blocks and create-once project context survive. A
locally deleted file stays deleted. Domain Tools evolve separately.

`upgrade` also moves the Kernel binary to the version this package carries, and refuses when
the Workspace's template is newer than this package. A persisted format change uses explicit `accrete migrate`;
replacing a Kernel or refreshing guidance does not silently migrate scientific work.
`accrete migrate --from LEGACY` converts the old scaffold.

## Repository organization

| Source | Maintained content |
|---|---|
| `bin/`, `lib/` | The generator and upgrader, in plain Node with no dependencies |
| `test/` | `node:test` suite, run by `npm test` |
| `skills/` | One canonical source for each of the five Skills and its references |
| `template/` | Project instructions, owner context seed, manuals, examples, and root fragments |
| `config/defaults.toml` | Shared defaults for the marker the generator writes |
| `contract/cli-v1.json` | Kernel commands, exact invocation shapes, receipts, and excluded responsibilities |
| `contract/input-drafts.schema.json`, `contract/example-inputs.json` | Caller-input definitions and their example mapping |
| `template.json` | Profiles and ownership policy |
| `schemas/` | JSON Schemas for the source definition and scaffold manifest |
| `scripts/build.mjs` | Assembles `dist/scaffold/` and checks the sources |
| `scripts/fetch-kernel.mjs` | Places the declared Kernel release in `dist/kernel/`, verified against `SHA256SUMS` |
| `scripts/check-cli-contract.mjs` | Checks the catalog against a Kernel binary's `--help` |
| `.github/workflows/` | CI, and a tag-triggered release with trusted publishing |
| `docs/` | The generator, scaffold format, architecture rationale, and maintenance |

```sh
npm run check
npm run build
npm test
npm pack
```

Use Node.js 20 or newer. Edit canonical sources and rebuild; `dist/` is generated.

Read [the generator](docs/CLI-INTEGRATION.md) for commands, the Kernel and receipts,
[the format](docs/TEMPLATE-FORMAT.md) for ownership and upgrade rules,
[maintenance](docs/MAINTENANCE.md) for release work, and
[design notes](docs/DESIGN-NOTES.md) for the architectural basis.
[Host integration](docs/HOST-INTEGRATION.md) describes the native discovery interfaces.
[Build notes](docs/BUILD-REPORT.md) say what the build and tests cover.

MIT licensed; see `LICENSE`. Each embedded Kernel keeps its own `LICENSE`,
`THIRD-PARTY-NOTICES` and `licenses/` beside it in `dist/kernel/`.
