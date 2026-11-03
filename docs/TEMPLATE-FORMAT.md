# Embedded template format, version 1

## Contents

- [Source and bundle](#source-and-bundle)
- [Manifest](#manifest)
- [File entries](#file-entries)
- [Initialization](#initialization)
- [Installed inventory and retained bases](#installed-inventory-and-retained-bases)
- [Update decisions](#update-decisions)
- [Managed sections](#managed-sections)
- [Compatibility and release binding](#compatibility-and-release-binding)
- [Build properties](#build-properties)

## Source and bundle

`template.json` is the maintainer-facing definition. `scripts/build.mjs` combines
it with `template/`, the five canonical `skills/`, `config/defaults.toml`, and
`contract/` to create the embedded bundle. Its JSON schemas are in `schemas/`.

The bundle root contains `manifest.json`, `assets/`, `config/`, `contract/`,
`schemas/` and `SHA256SUMS`. Its tar.gz contains that root beneath one
`accrete-template-<template-version>/` prefix. Entries are ordinary files, use
POSIX relative paths in the package, and carry mode 0644. Convert path components
through native path APIs on the destination platform. Nothing in the bundle is
executed during installation.

Host copies share canonical source bytes in the bundle. A single
`assets/skills/accrete-models/SKILL.md` can supply both
`.agents/skills/accrete-models/SKILL.md` and
`.claude/skills/accrete-models/SKILL.md`. These destinations become real files;
canonical reuse inside the bundle does not mean installing a symlink.

## Manifest

| Field | Meaning |
| --- | --- |
| `schema_version` | Bundle format; currently 1. Reject unknown major representations before installation. |
| `template_id` | `accrete-foundation`, identifying this asset family. |
| `template_version` | The source repository's release version. |
| `distribution_version` | The exact binary release embedding this set, or null before integration. |
| `cli_version_range` | The integrating release's declared range, or null before integration. |
| `compatibility_status` | `unbound-template` or `declared-by-integrating-release`. This is a declaration, not a host or CLI execution result. |
| `cli_contract` | `accrete-template-cli/v1`, the matching command/input expectation set. |
| `project_formats` | Supported persisted format range, currently `{min: 1, max: 1}`. |
| `architecture_edition` | Design input edition, `2026-11-03`. |
| `profiles` | Host names and their discovery destinations. |
| `default_profiles` | Initial selection, `codex` and `claude`. |
| `initialization` | Project marker, config defaults source and Kernel-owned allocation requirements. |
| `upgrade` | Inventory/base/candidate locations and ownership policy summaries. |
| `files` | Complete asset destinations for this release, before profile filtering. |

The native CLI reads this known schema; it does not interpret arbitrary commands
from a manifest. The source strings under `initialization` and `upgrade` describe
requirements, not an executable policy language. Concrete native behavior is
specified below and in [CLI integration](CLI-INTEGRATION.md).

## File entries

Every `files[]` entry has:

```json
{
  "source": "assets/skills/accrete-models/SKILL.md",
  "destination": ".agents/skills/accrete-models/SKILL.md",
  "profile": "codex",
  "ownership": "managed-file",
  "sha256": "<64 lowercase hexadecimal characters>",
  "size": 1234,
  "mode": "0644"
}
```

The digest and size above are illustrative. The generated manifest contains
the exact values. `source` is relative to the bundle root; `destination` is
relative to the selected project root. `profile: null` is common to every
selection, including `--agents none`. A file for an unselected profile is not
installed or inventoried as installed.

Names must be relative, normalized component paths. They cannot contain an
absolute prefix, `..`, empty components, a drive prefix, a NUL or a backslash.
Destination names are unique even under case-insensitive comparison. A source
can be reused by several destinations. Every referenced source must be present,
have the declared size, and match its digest. The executable should consume
trusted embedded assets; if it additionally supports an externally supplied
bundle, it must retain these checks rather than trust an archive path blindly.

Ownership values are:

- **`managed-file`:** the whole installed file is the update unit.
- **`managed-block`:** a delimited section is the update unit, with an additional
  `block: {start, end, sha256}`. Its source file also supplies initial content for
  a new destination. The block digest covers inclusive marker lines and their
  final LF in the canonical release bytes.
- **`seed-once`:** create the initial file when absent during initialization.
  Subsequent content and deletion belong to the project.

The schema validates the bundle's structure. Path resolution, ownership,
newline handling and filesystem outcomes remain native implementation behavior.

## Initialization

The bundle deliberately contains no active `.accrete/project.toml`. The native
Kernel reads `config/defaults.toml`, allocates the project identity, applies
explicit choices, and writes its own supported configuration. Config examples
under `.accrete/config-examples/` are instructional assets only.

Installation into a new location uses the whole source file for both managed
files and block-bearing files. Into an existing location, it uses the following
rules before allocating an installed base:

| Existing destination | First-install action |
| --- | --- |
| Absent | Write the selected source asset. |
| Identical whole managed file | Adopt the matching asset as installed without changing the bytes. |
| Different whole managed file | Keep it; emit a candidate or report the exact conflict. |
| Root block file with no ACCRETE markers | Append the short managed block while preserving existing content. Do not append the template's owner prose. |
| Root block file with one identical managed block | Adopt that block while preserving surrounding content. |
| Root block file with a different block or malformed/repeated markers | Preserve it and report a candidate/conflict. |
| Existing seed-once file | Keep it. |

Initialization only touches the listed destinations and explicitly generated
configuration/asset state. It does not fingerprint or reorganize the whole
research project. No temporary experiment output is interpreted as a managed
object merely because the template has been installed.

## Installed inventory and retained bases

The native CLI creates `.accrete/template-install.json` as its compact installed
asset inventory. The shape below is the template-side expectation; it may be
adapted once during integration if the CLI already has an equivalent schema:

```json
{
  "schema_version": 1,
  "template_id": "accrete-foundation",
  "selected_profiles": ["codex", "claude"],
  "target_distribution_version": "0.1.0",
  "files": [
    {
      "destination": "AGENTS.md",
      "profile": null,
      "ownership": "managed-block",
      "installed_distribution_version": "0.1.0",
      "installed_template_version": "0.1.0",
      "base_sha256": "<digest of installed block bytes>",
      "base_path": ".accrete/template-bases/<digest>",
      "release_asset_sha256": "<digest of complete embedded source asset>",
      "block": {"start": "<!-- accrete:begin -->", "end": "<!-- accrete:end -->"},
      "pending": null
    }
  ]
}
```

Use actual digests, versions and paths. The inventory is software asset metadata,
not an ACCRETE Model/Result registry. Store only installed paths and pending
template changes. Keep original source asset digests distinct from the installed
base digest if the installer adapts line endings.

Retain the actual last installed base bytes under
`.accrete/template-bases/<base_sha256>`. For a block, retain only the managed
section; for a whole file, retain its complete base. Share these small files and
the inventory in Git so another checkout can reason about the same edits without
the old binary. The supplied Git attributes keep these base and candidate bytes
unconverted so newline normalization cannot invalidate their digests.
Identical bytes can share a base blob. Retain a base until no
installed entry or pending update references it; do not use an age-based cleaner.

Native local operation receipts stay in the host-local state directory. They
are distinct from the shared inventory. A partial installation records which
assets were actually published and can continue from that material. The
inventory must not claim an absent or conflicted destination was installed.

A pending update associates the target path with its old base, incoming asset
digest/version, candidate path and current-content digest at proposal time.
The exact representation may be native CLI detail, but this information must
survive an interrupted command. Candidates are under
`.accrete/template-upgrades/<distribution-version>/<destination>.incoming`,
preserving the destination's nested components. They contain proposed text,
not executable operations. They can be shared when resolving an upgrade across
worktrees; retain unresolved candidates and their bases.

## Update decisions

An upgrade is explicit and uses the binary's embedded release. Compare the
managed unit **C** (current content), **B** (installed base) and **N** (new asset).
The CLI can use established text-merge tooling to offer a merged proposal; a
conflict does not authorize overwriting owner text.

| Situation | Action and inventory consequence |
| --- | --- |
| C equals B | Install N; base becomes N after successful publication. |
| C equals N | Adopt the already installed incoming bytes; base becomes N. |
| B equals N and C has local edits | Keep C; the base is already current, so no new candidate is needed. |
| C differs from B and N | Keep C; write incoming/merge candidate; keep B as installed until resolved. |
| C is missing but had an installed entry | Preserve the local deletion and report it; do not silently recreate the removed file on upgrade. |
| New destination absent and never managed | Install N normally. |
| New destination collides with unmanaged content | Preserve it and report a candidate/conflict. |
| Old destination removed by release and C equals B | Remove that managed unit and its active inventory entry. |
| Old destination removed by release but C edited | Preserve C, report it as detached, and stop treating it as an automatically replaceable release asset. |
| Seed-once asset | Retain current content or deliberate deletion. |

After editing the live file to resolve a candidate, the explicit
`project upgrade --accept PATH` records that resolution against the candidate's
incoming base. It must identify the pending candidate and detect a changed or
wrong-release proposal. It preserves the chosen current bytes. A clean upgrade
can automatically recognize C equals N without this extra acknowledgment.

`--dry-run` is read-only: no installed files, candidates, bases, inventory or
recovery receipts are written. It returns the same proposed decisions and
conflicting paths so the intended update can be reviewed concretely.

Keep a receipt for partial completion and track installed versions per path.
The target release alone is not a claim that all assets were updated. Handle
profile removal through the same withdrawal rules only when the caller explicitly
changes its profile selection. An ordinary upgrade preserves the current selection.

## Managed sections

The four root files use exact full-line markers:

| Files | Start | End |
| --- | --- | --- |
| `AGENTS.md`, `CLAUDE.md` | `<!-- accrete:begin -->` | `<!-- accrete:end -->` |
| `.gitignore`, `.gitattributes` | `# accrete:begin` | `# accrete:end` |

Recognize exactly one ordered pair in the file being updated. Preserve every
byte before and after the section. A malformed or repeated pair is a conflict,
not a request to choose whichever block is easiest to replace. An initialization
append uses the existing file's newline convention; retain the actual generated
block bytes as its base. The canonical bundle always uses LF.

Separate generated project-Tool ignores, if needed, from the foundation's ignore
block. Tool exposure lifecycle owns its exact generated paths and its own local
ignore mechanism. Updating a foundational Skill never replaces an unrelated
Skill, project Tool source or personal configuration.

## Compatibility and release binding

Template source version, native distribution version, persisted project format,
and local index format have distinct meanings. The bundle only states the first
three; the Kernel owns its projection version. Object and Tool revisions are
independent of all of them.

The initial source release uses project format 1 and the v1 command expectations.
`unbound-template` is suitable for development and handoff. Before embedding it
in a coherent native release, the CLI pipeline supplies its distribution version
and supported command range to the assembler. The paired CLI must check project
format support before writing; it must not silently migrate an unsupported
project while refreshing guidance.

An updated binary changes no installed project assets until the explicit native
operation. `project upgrade` refreshes foundational content. `migrate` handles
persisted format changes. Native package managers handle binary upgrades. A Tool
source revision evolves through ordinary project work.

## Build properties

`npm run check` parses release JSON, checks five Skill frontmatters and linked
references, rejects foundational operation scripts and symlinks, checks managed
sections and portable unique destinations, and resolves Markdown links in each
of the none/Codex/Claude/both installed layouts. It builds the archive in memory
to calculate its digest and writes no `dist/` output.

`npm run build` performs those checks, writes the bundle, builds the tar.gz and
its digest file, and emits a guidance-only preview. File ordering, tar timestamps,
permissions and gzip metadata are deterministic. No network, npm install,
postinstall hook or runtime dependency is needed.

`SHA256SUMS` covers every bundle file except itself, including `manifest.json`.
The adjacent archive digest covers the complete compressed release. Digest
checking establishes which bytes are in the bundle; it does not claim that a
native CLI has installed it or that a scientific activity has run.
