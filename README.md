# accrete-template

Foundational project assets for ACCRETE: five complete object Skills, their
reference manuals, Coordinator and Subagent guidance, configuration examples,
and a release bundle that the native `accrete` CLI can embed.

This is the independently maintainable **template repository**. The companion
`accrete-cli` repository implements the native Kernel, initialization, template
upgrades, and managed object operations. The template provides those operations'
Agent-facing semantics and explicit integration requirements.

## Build and inspect

Use Node.js 22 or newer. The build has no package dependencies and needs no
dependency installation.

```sh
npm run check
npm run build
```

`check` reads and checks release sources without writing output. `build` assembles
the release bundle, an archive, checksums, a report, and a readable preview:

| Output | Purpose |
|---|---|
| `dist/accrete-template-0.1.0/` | Bundle directory for the CLI release pipeline |
| `dist/accrete-template-0.1.0.tar.gz` | Portable copy of that bundle |
| `dist/accrete-template-0.1.0.tar.gz.sha256` | Archive checksum |
| `dist/preview/` | Both host guidance layouts, with real Skill directories |
| `dist/build-report.json` | Version, asset and command counts, and build outcome |

The bundle contains `manifest.json`, `assets/`, `config/`, `contract/`, `schemas/`,
and `SHA256SUMS`. Its manifest describes destination paths, host profiles, file
ownership, and content digests. The preview has no project identity, active
configuration, object descriptors, or SQLite index. Read it to inspect the
working guidance; native `accrete init` creates an actual project.

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

## Expected initialized environment

With a compatible CLI release containing these assets, the expected initialization
interface is:

```sh
accrete init my-project --agents codex,claude
```

The CLI contract also supports `codex`, `claude`, or `none` for the host profile,
an explicit project timezone, and optional Git initialization. Initialization
does not make a first commit or configure a remote.

| Project path | Purpose and ownership |
|---|---|
| `AGENTS.md` | Short managed entry section alongside owner instructions |
| `CLAUDE.md` | Import of `AGENTS.md` when the Claude profile is enabled |
| `.accrete/PROJECT.md` | Create-once project purpose, preferences, and machine context |
| `.accrete/docs/` | Managed overview, working guidance, CLI semantics, and generated command map |
| `.accrete/project.toml` | Native-generated project identity, format, timezone, and shared roots |
| `.accrete/local.toml` | Ignored host-specific bindings, supplied for the actual machine |
| `.accrete/config-examples/` | Illustrative shared, workstation, and compute-host TOML |
| `.accrete/release.json` | Template version and declared integration compatibility |
| `.accrete/contracts/cli-v1.json` | Machine-readable template-side command requirements |
| `.accrete/contracts/input-drafts.schema.json` | Caller-input shapes; the Kernel owns persisted envelopes |
| `.accrete/examples/` | Nine JSON drafts and two plain Markdown draft bodies |
| `.accrete/template-install.json`, `.accrete/template-bases/` | Native-generated installation inventory and retained small bases for later upgrades |
| `.agents/skills/accrete-*/` | Five foundational Skills when Codex is enabled |
| `.claude/skills/accrete-*/` | Five foundational Skills when Claude is enabled |
| `.accrete/objects/`, `results/`, `memory/` | Default managed document roots, created by the Kernel as needed |
| `tools/`, `scratch/` | Default editable capability sources and ongoing work |

Configured paths can place Models, Tools, Data, Results, Memory, and Scratch
elsewhere. A Model may be the project repository, an external repository, an
optional submodule, or a worktree. The template creates no placeholder Models,
Tools, Data, Results, or Memory entries.

Start Claude Code or Codex at the initialized project root. For work in an
external checkout, select its owning project explicitly:

```sh
accrete --project /path/to/my-project config resolve --json
```

The host discovers Skills through its normal project mechanisms. The native
Kernel performs organizational writes. Git, scientific programs, domain readers,
SQLite, SSH, and site schedulers retain their normal roles. Node.js is only a
dependency of this repository's release assembly; initialized scientific projects
do not need a Node service or a root `package.json` for ACCRETE.

## Package, install, and update through the CLI

The intended release path is:

1. Pin a revision of this repository and build its bundle.
2. Bind the bundle to the integrating distribution version and supported CLI
   range using both build options below.
3. Embed the bundle in the native CLI during the CLI build.
4. Ship that native binary through the CLI's npm/native release packages.
5. Let native `init` or `project upgrade` install the selected embedded assets.

```sh
npm run build -- --release "$ACCRETE_DISTRIBUTION_VERSION" \
  --cli-range "$ACCRETE_CLI_VERSION_RANGE"
```

Set those variables to the integrating release's chosen semantic version and
declared compatible CLI range. The ordinary independent build is explicitly
`unbound-template`: its compatibility fields are null. Supplying the options
stamps the integrator's declaration; it does not establish compatibility by
running an independently developed binary.

This repository's `package.json` is private build metadata. Publishing a separate
template package or fetching mutable templates during user initialization is
unnecessary. The binary carries the selected assets and can initialize projects
without fetching this repository.

After installing a compatible newer CLI, the expected guidance update is:

```sh
accrete --project /path/to/my-project project upgrade --dry-run
accrete --project /path/to/my-project project upgrade
```

The native updater uses installed base content and digests. Unchanged managed
content receives the new asset; edited content stays in place with a proposed
candidate for resolution. Owner text outside managed blocks and create-once
project context survive. Domain Tools evolve separately. A persisted format
change uses explicit `accrete migrate`; replacing a binary or refreshing guidance
does not silently migrate scientific work.

## Repository organization

| Source | Maintained content |
|---|---|
| `skills/` | One canonical source for each of the five Skills and its references |
| `template/` | Project instructions, owner context seed, manuals, examples, and root fragments |
| `config/defaults.toml` | Shared defaults used by native initialization before identity allocation |
| `contract/cli-v1.json` | Command vocabulary, expected invocation shapes, receipts, and excluded responsibilities |
| `contract/input-drafts.schema.json`, `contract/example-inputs.json` | Caller-input definitions and their example mapping |
| `template.json` | Profiles, initialization recipe, ownership policy, and upgrade locations |
| `schemas/` | JSON Schemas for the source definition and assembled bundle |
| `scripts/build.mjs` | Dependency-free release assembly and source checks |
| `docs/` | Integration, bundle format, architecture rationale, and maintenance |

Edit canonical sources and rebuild. `dist/` is generated; changing a preview or
bundle directly does not change the next release.

Read [CLI integration](docs/CLI-INTEGRATION.md) for the native implementation
boundary, [template format](docs/TEMPLATE-FORMAT.md) for the bundle and ownership
rules, [maintenance](docs/MAINTENANCE.md) for release work, and
[design notes](docs/DESIGN-NOTES.md) for the architectural basis. The supplied
architecture and explicit template-side contract allow both repositories to
develop independently; final integration belongs to their owner.

[Host integration](docs/HOST-INTEGRATION.md) describes the native discovery
interfaces. [Build notes](docs/BUILD-REPORT.md) report the completed artifact
checks and the separate native-runtime integration boundary.

## Delivery scope

The repository supplies authored assets and an executable build pipeline. Its
command catalog contains 24 entries, including two forms of Data registration.
Installation, upgrades, document mutations, and running agent sessions depend on
the companion native CLI and the user's selected host. The build checks asset
structure, links, profiles, and package construction; it does not simulate a
Kernel or claim that an unavailable counterpart has passed integration.

The downloadable repository delivery includes Git history and generated build
artifacts. No remote or public npm publication is required to inspect, rebuild,
or integrate it. Licensing is left unassigned (`UNLICENSED`) for the owner to
choose before distribution.
