# Integrating accrete-template into accrete-cli

## Purpose and boundary

This repository is the independently maintained asset source for the ACCRETE
native distribution. The shared design is `ACCRETE-Architecture-Design`, edition
3 November 2026, particularly documents 04, 06, 07 and 08. The template is complete
as an asset package. Runtime installation, project initialization, migration,
managed object writes and upgrades belong to the native CLI.

The only executable code here is the release assembler. It reads this repository
and writes its own `dist/` output. It does not accept an installation destination,
allocate project IDs, write object descriptors, open SQLite, invoke Git, perform
data transfers, expose project Tools, or change an existing research project.

The archive is a build input for the CLI repository, not a third user-facing npm
runtime package. `package.json` is private and supplies a dependency-free build
entry. Scientific projects require neither this build program nor Node.js for
native ACCRETE operations.

## Consume the release assets

Pin a commit/tag of this repository in the CLI build, either as a Git dependency,
submodule or downloaded release asset with its digest. A source checkout builds
offline with Node.js 22 or later:

```sh
npm run check
npm run build
```

`dist/accrete-template-0.1.0/manifest.json` describes every installed destination,
its source bytes, host profile, digest and ownership. The directory also contains
canonical assets, configuration defaults, the CLI expectation catalog, schemas
and `SHA256SUMS`. The adjacent tar.gz is the same content in a deterministic
regular-file archive. Its `.sha256` identifies the archive bytes. No symlinks or
executable installation hooks are required.

An independent template build sets `distribution_version` and `cli_version_range`
to null and marks compatibility `unbound-template`. It does not claim compatibility
with a binary that was never supplied. When building a concrete CLI distribution,
declare the release binding:

```sh
node scripts/build.mjs --release 0.1.0 --cli-range '>=0.1.0 <0.2.0'
```

Those are illustrative release values. Use the native release's actual version
and supported command range. The assembler records the declaration; it cannot
establish that the separately developed CLI implements it. Match
`contract/cli-v1.json`, input drafts and the semantic manuals before selecting a
public binding. `template_version` continues to identify the source assets even
if the integrating distribution uses another version.

Embed the manifest and referenced bytes in the Rust executable at compile time.
The choice of `include_bytes!`, an existing embedding crate or equivalent static
asset module stays with the CLI repository. Runtime `init` and `project upgrade`
read those embedded bytes without fetching an independent latest template. The
binary's release version must equal the manifest's bound `distribution_version`.

The initializer, launcher and platform payload packages then carry exact matched
native release versions as specified in design document 07. The same executable
and assets can be delivered as a native archive for remote compute hosts. Their
packaging and npm publication live in `accrete-cli`.

## What native initialization does

1. Resolve the explicit target and selected host profiles. The default profiles
   are `codex` and `claude`; `--agents none` is supported for shared manuals only.
2. Determine which exact paths the manifest would affect. An existing project
   marker is not a request to replace its identity. Repeated initialization must
   preserve the existing ID and configuration; use explicit upgrade/migration
   operations for change.
3. Read `config/defaults.toml`. The Kernel allocates a UUID, selects the explicit
   project timezone or the UTC default, and serializes `.accrete/project.toml`
   using its supported schema. Local overrides and configured physical roots
   remain separate. No active credential, interpreter, host or absolute path is
   hard-coded in the asset defaults.
4. Install selected files according to ownership. Materialize each foundational
   Skill as a real directory under the host's discovery root. Common assets are
   independent of the host selection. Preserve any preexisting owner content.
5. Publish `.accrete/template-install.json` and the small retained asset bases
   after the corresponding files are written. Each path's completed outcome is
   recoverable; a file set is not advertised as an atomic filesystem transaction.
6. Use configured paths for stores, creating empty directories lazily. Resolve
   host-local state through the Kernel; it must not accidentally place a shared
   SQLite index on a network-mounted project root.

The CLI may write a commented local configuration starter while preserving any
existing `.accrete/local.toml`; the examples shipped here remain examples. A
named Data destination becomes usable once its physical binding is configured.
The project does not need to choose a GPU, scientific environment or Model before
it can retain Memory or Results.

`--git` may initialize Git if no repository exists. Initialization neither commits
owner content nor selects a remote. No Model is automatically registered from
the outer repository. No default Results, Memory entries or dummy Data are created.

## Ownership and upgrades

Read [the bundle format](TEMPLATE-FORMAT.md) for the exact manifest and inventory
semantics. The installer applies three ownership policies:

| Policy | Use | Update |
| --- | --- | --- |
| `managed-file` | Manuals, examples, foundational Skill files and generated release metadata | Replace only when unchanged from its installed base; otherwise leave current content and write a candidate. |
| `managed-block` | `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `.gitattributes` | Treat the delimited section as the managed unit; preserve all bytes outside it. |
| `seed-once` | `.accrete/PROJECT.md` | Create when absent at initial setup; future owner edits and deletion are retained. |

Keep enough old base content to compare local edits after the old executable is
gone. `.accrete/template-bases/<sha256>` contains the small installed source bases
and is shared alongside the inventory. Store no machine paths or operation
receipts there. Two identical host copies may share one base blob.

On a clean managed file, upgrade installs incoming bytes and advances that path's
base. On a modified file, it preserves the file and writes an incoming candidate
below `.accrete/template-upgrades/<distribution-version>/`. The receipt names the
current path, old base, incoming candidate and next action. It must not update
the installed base to the new release while that candidate is unresolved.

After an Agent or owner resolves a candidate in the current file,
`project upgrade --accept PATH` associates that deliberate resolution with the
incoming base. The resulting file can retain local modifications. The CLI checks
that the acknowledged candidate belongs to the current upgrade and has not been
silently replaced. It does not make acceptance a force-overwrite operation.

Per-path inventory matters when some updates succeed and others remain pending.
Expose the target release and pending paths without claiming that the entire
project already uses the new snapshot. Repeating the operation continues the
remaining asset changes. Do not rerun Model operations or touch scientific Data
to finish a template update.

Files withdrawn by a release can be removed when still equal to their installed
base. Preserve edited withdrawn files and report them as detached from future
management. Removing a managed block preserves the rest of its file. An explicit
profile selection can add or retire host-specific assets with these same rules;
omitting `--agents` keeps the existing selection during upgrade. Domain Tool
exposures and owner Skills are outside the foundational inventory.

## Command and input agreement

The interface catalog enumerates 24 invocation shapes. The two `data register`
forms share one operation. The installed generated map is produced from that
catalog, avoiding a second maintained command list in every root instruction file.
Object Skills carry the semantic manuals and situation-specific examples.

The native CLI's actual command declarations should eventually generate the
command map or consume the aligned catalog at release build time. Until the two
repositories are integrated, the catalog expresses required support; it is not
a claim that a native command has been executed here.

`contract/input-drafts.schema.json` describes caller input drafts when a schema
is useful to the integration. It does not specify the native persisted envelope
or database tables. `contract/example-inputs.json` maps shipped examples to those
definitions. It imposes no scientific adequacy or experiment-order conditions.

Choices made here where the architecture leaves spelling open include:

- `ACCRETE_PROJECT`, global `--project` and `--json`.
- `config resolve --json` as the bounded path-resolution diagnostic.
- Structured `--from` inputs for Model, iteration and Tool actions.
- JSON Merge Patch semantics for `result amend` and `tool update`.
- Repeatable Memory relationship flags and optional stable retry IDs.
- Exact host selection/exposure flags and `project upgrade --accept PATH`.

The architecture already requires byte-bound revision checks, explicit incomplete
publication outcomes, successful primary writes despite a pending index, real
host discovery directories, explicit migrations, and no Kernel-replacing Skill
scripts. If a counterpart chooses another exact spelling, reconcile the catalog,
manuals and example inputs in one integration change while preserving that
behavior. No compatibility shim or alternate Kernel is implemented here.

## Scope of completed implementation

The supplied source and build outputs contain the full template content and a
working deterministic packager. `dist/preview/` shows the default two-host guidance
layout, including concrete Skill directories and manuals. It intentionally has
no `.accrete/project.toml`, durable objects or local index and is not an initialized
research project. It exists to inspect the packaged assets without implementing
another initialization route.

The supplied build report records artifact construction and content checks.
Live Claude Code/Codex discovery and native `accrete init`, mutation and upgrade
execution require the separately supplied binaries. No claim of such execution
is made by this repository's build output.
