# Scaffold format and ownership rules, version 1

This is the specification `accrete-kit` implements in `lib/`. See
[the generator](CLI-INTEGRATION.md) for how the package relates to the Kernel.

## Contents

- [Source and scaffold](#source-and-scaffold)
- [Manifest](#manifest)
- [File entries](#file-entries)
- [Creating a Workspace](#creating-a-workspace)
- [Installed inventory and retained bases](#installed-inventory-and-retained-bases)
- [Update decisions](#update-decisions)
- [Interruption and failure](#interruption-and-failure)
- [Managed sections](#managed-sections)
- [Compatibility](#compatibility)
- [Build properties](#build-properties)

## Source and scaffold

`template.json` is the maintainer-facing definition. `scripts/build.mjs` combines
it with `template/`, the five canonical `skills/`, `config/defaults.toml`, and
`contract/` into `dist/scaffold/`, which ships in the package. Its JSON schemas are in
`schemas/`.

The scaffold holds `manifest.json`, `assets/` and `config/defaults.toml`. Assets are
ordinary text files. Nothing in them is executed during installation.

Host copies share source bytes. A single `assets/skills/accrete-models/SKILL.md`
supplies both `.agents/skills/accrete-models/SKILL.md` and
`.claude/skills/accrete-models/SKILL.md`; the destinations become real files, not
symlinks. npm drops a file named `.gitignore` from a tarball and applies it to its
siblings, so that asset is stored as `assets/template/_gitignore` and the manifest maps
it back.

## Manifest

| Field | Meaning |
| --- | --- |
| `schema_version` | Scaffold format; currently 1. Anything else is refused. |
| `template_id` | `accrete-foundation`, identifying this asset family. |
| `template_version` | The `accrete-kit` package version. |
| `kernel_version` | The exact Kernel version, from `accrete.cli` in `package.json`. |
| `cli_contract` | `accrete-template-cli/v1`, the matching command catalog and input set. |
| `project_formats` | Supported Workspace format range, currently `{min: 1, max: 1}`. |
| `architecture_edition` | Design input edition, `2026-11-03`. |
| `profiles` | Host names and their discovery destinations. |
| `default_profiles` | Initial selection, `codex` and `claude`. |
| `files` | Every asset destination in this version, before profile filtering. |

## File entries

```json
{
  "source": "assets/skills/accrete-models/SKILL.md",
  "destination": ".agents/skills/accrete-models/SKILL.md",
  "profile": "codex",
  "ownership": "managed-file",
  "sha256": "<64 lowercase hexadecimal characters>",
  "size": 1234
}
```

`source` is relative to the scaffold; `destination` is relative to the Workspace root.
`profile: null` is common to every selection, including `--agents none`. A file for an
unselected profile is not installed or inventoried.

Names are relative, normalized paths with no absolute prefix, `..`, empty component,
drive prefix, control character or backslash. Destinations are unique ignoring case and
never nest inside one another. They stay clear of `.git`, the Kernel's paths
(`.accrete/project.toml`, `local.toml`, `objects/`, `data/`, `migrations/`), the
Kernel binary's `.accrete/bin/`, the generator's state, and the Workspace's configured
`[paths]`. The generator checks all this, and each asset's size
and digest, when it loads the scaffold.

Ownership values are:

- **`managed-file`:** the whole installed file is the update unit.
- **`managed-block`:** a delimited section is the update unit, with an additional
  `block: {start, end, sha256}`. The source file also supplies initial content for a new
  destination. The block digest covers inclusive marker lines and their final LF.
- **`seed-once`:** created when absent during first install. Subsequent content and
  deletion belong to the project.

A symbolic link at or above a destination is never followed: that path is treated as a
conflict. A link at or above the marker, the inventory, or the base and candidate
directories stops the run.

## Creating a Workspace

The scaffold has no `.accrete/project.toml`. The generator reads `config/defaults.toml`,
generates a UUID unless `--id` supplies an identity, takes the name from `--name` or the
directory, applies `--timezone`, and writes the marker. An existing marker keeps its
identity: a conflicting `--id` or `--name` is an error, and its format must be in
`project_formats`. Store directories are the Kernel's and appear on first use. Config
examples under `.accrete/config-examples/` are instructional only.

A new destination gets the whole source file. An existing one follows these rules:

| Existing destination | First-install action |
| --- | --- |
| Absent | Write the source asset. |
| Identical whole managed file | Adopt it as installed without changing the bytes. |
| Different whole managed file | Keep it, write a candidate and add a pending entry. |
| Root block file with no markers | Append the short managed block in the file's newline convention. Do not append the template's owner prose. |
| Root block file with one identical block | Adopt that block. |
| Root block file with a different block or malformed/repeated markers | Keep it, write a candidate and add a pending entry. |
| Directory, symlink or special file | Keep it, write a candidate and add a pending entry. |
| Existing seed-once file | Keep it. |

A pending first-install entry has a null base and a null installed version, so the
inventory never claims a conflicted path was installed. `--accept` resolves it like any
other candidate. Repeating creation at the same version finishes the same work and keeps
deletions. At another version it changes nothing and points at `upgrade`.

## Installed inventory and retained bases

`.accrete/template-install.json` records what was installed:

```json
{
  "schema_version": 1,
  "template_id": "accrete-foundation",
  "template_version": "0.1.0",
  "kernel_version": "0.1.0",
  "selected_profiles": ["codex", "claude"],
  "files": [
    {
      "destination": "AGENTS.md",
      "profile": null,
      "ownership": "managed-block",
      "installed_version": "0.1.0",
      "base_sha256": "<digest of installed block bytes>",
      "block": {"start": "<!-- accrete:begin -->", "end": "<!-- accrete:end -->"},
      "pending": null
    }
  ]
}
```

`template_version` is what the Workspace was last brought to; `installed_version` is per
path and stays behind while a candidate is unresolved. A path the owner deleted carries
`locally_deleted: true`. The inventory is software asset metadata, not an ACCRETE
Model/Result registry.

`.accrete/template-bases/<base_sha256>` retains the installed base bytes: the managed
section of a block, or a whole file. Decisions compare digests; the bytes are there so an
owner or agent resolving a candidate can see what changed. Commit these and the inventory
so another checkout reasons about the same edits. The supplied Git attributes keep base
and candidate bytes unconverted. A base is removed once nothing references it.

A pending entry is:

```json
{
  "version": "0.1.0",
  "incoming_sha256": "<digest of the candidate>",
  "candidate_path": ".accrete/template-upgrades/0.1.0/AGENTS.md.incoming",
  "current_sha256": "<digest of the current unit, or null if it was unusable>"
}
```

A candidate holds the incoming unit only, meaning the block for block files, in canonical
LF. It is proposed text, not an executable operation. Resolve it in the live file; the
generator never copies it over.

## Update decisions

An upgrade compares each managed unit's **C** (current content), **B** (installed base)
and **N** (incoming asset). `--dry-run` reports the same decisions and writes nothing.

| Situation | Action | Result |
| --- | --- | --- |
| C equals N, base already N | `unchanged` | Nothing changes. |
| C equals N otherwise | `adopt` | Base becomes N; any pending entry clears. |
| C equals B | `update` | N is installed; base becomes N. |
| B equals N and C has local edits | `keep-edited` | C stays; no candidate is needed. |
| C differs from B and N | `candidate` | C stays; candidate written; B kept until resolved; other paths continue. |
| File missing, or markers removed from a tracked block file | `keep-deleted` | A local deletion: it stays deleted and the markers are not re-added. |
| New destination absent | `install` or `seed` | Written; a new base is recorded. |
| New destination collides with unmanaged content | `candidate` | Preserved as on first install. |
| Asset withdrawn or its agent dropped, C equals B | `remove` or `remove-block` | Removed with its entry; a file left blank by removing its block goes too. |
| Withdrawn or dropped, C edited | `detach` | C stays, reported, and is no longer managed. |
| Withdrawn or dropped, already gone; or a seed | `forget` | The entry goes; the file stays as it is. |
| Seed-once asset that exists or was deleted | `keep-seed` | Retained either way. |

After resolving a candidate in the live file, `upgrade --accept PATH` records that
resolution: the current bytes stay and the incoming unit becomes the base. It refuses a
path with no pending entry, a candidate that was changed or that belongs to another
version, and a file with no usable managed unit. It is not a force-overwrite.

`--agents` changes the selection through these same rules; omitting it keeps the recorded
selection. `upgrade` refuses outright, with exit 4 and nothing written, when the inventory's
`template_version` is newer than this package's. Equal versions run.

## Interruption and failure

Writes go to a temp sibling, are fsynced, renamed, and the directory fsynced where the
platform allows. Each path's decision is independent, so a killed run needs no recovery
record: what it published reads as C equals N on the rerun, and the inventory that records
it is written last. A leftover temp file has a fixed name, so the rerun's write replaces
it.

The one thing rules alone cannot recover is intent. A run that drops an agent and is
killed would leave files that read as owner deletions on a rerun without `--agents`, so a
selection change is written to the inventory before any file moves.

A candidate is not a failure: the run exits 0, lists `pending`, and warns on stderr. An
I/O failure on one path is reported in `failed` with that path, the others finish, the
path's entry is unchanged so a rerun retries it, and the exit is nonzero.

## Managed sections

The four root files use exact full-line markers:

| Files | Start | End |
| --- | --- | --- |
| `AGENTS.md`, `CLAUDE.md` | `<!-- accrete:begin -->` | `<!-- accrete:end -->` |
| `.gitignore`, `.gitattributes` | `# accrete:begin` | `# accrete:end` |

Exactly one ordered pair is recognized. Every byte outside it is preserved. A malformed or
repeated pair is a conflict. An appended block uses the file's newline convention and that
adapted form is its base. The scaffold always uses LF.

The `.gitignore` block is the only source of rules in that shared file; the build checks
that the source holds nothing else, and the Kernel adds none. It contains
`/.accrete/local.toml`, `/.accrete/data/`, `/.accrete/bin/` and `/scratch/`. Tool exposure uses the repository-local
`.git/info/exclude` instead, because a generated wrapper can hold this host's absolute
source path. Updating a foundational Skill never replaces an unrelated Skill, project Tool
source or personal configuration.

## Compatibility

Template version, Kernel version, Workspace format, and local index format have distinct
meanings. The package states the first three; the Kernel owns its projection version.
Object and Tool revisions are independent of all of them.

`accrete.cli` in `package.json` states the matching Kernel, whose release binaries this
package embeds; see [the generator](CLI-INTEGRATION.md#the-kernel-in-a-workspace). The
inventory and `.accrete/release.json` record it. The generator refuses to act on a
Workspace whose `format` is outside `project_formats`.

`migrate` handles persisted format changes and is the Kernel's. The generator does not
migrate a Workspace while refreshing its guidance.

## Build properties

`npm run check` parses JSON, checks five Skill frontmatters and linked references, rejects
foundational operation scripts and symlinks, checks managed sections and portable unique
destinations, and resolves Markdown links in each of the none/Codex/Claude/both layouts. It
writes nothing. `npm run build` does the same and writes `dist/scaffold/`; `npm pack` runs
it first. Neither needs a network or a runtime dependency. `dist/kernel/` belongs to
`scripts/fetch-kernel.mjs` and survives a build.
