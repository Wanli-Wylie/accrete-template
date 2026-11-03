# Maintaining accrete-template

Maintain the five Skills, project guidance, and release description in this
repository. Keep persistence and initialization mechanics in `accrete-cli`.
The template's design basis is documented in [DESIGN-NOTES.md](DESIGN-NOTES.md).

## Edit the canonical source

| Intended change | Source to edit |
|---|---|
| Object meaning, situations of use, native work, or domain-independent advice | Relevant `skills/accrete-*/SKILL.md` or reference |
| Project entry text or operating guidance | `template/AGENTS.md`, `template/CLAUDE.md`, or `template/.accrete/docs/` |
| Initial owner context | `template/.accrete/PROJECT.md`; existing projects preserve their copy |
| Shared logical defaults | `config/defaults.toml` |
| Profiles, file ownership, initialization recipe, or upgrade locations | `template.json` |
| Command spelling, expected inputs, or receipts | `contract/cli-v1.json` and the authored CLI semantics manual |
| Bundle representation | `schemas/` and `scripts/build.mjs`, with corresponding format documentation |

Keep each Skill's frontmatter name equal to its directory name. Use only `name`
and `description` in the foundational frontmatter, and keep descriptions useful
for discovery. Put detailed material in references linked from `SKILL.md`.
Do not add a `scripts/` persistence implementation to a foundational Skill.

Use relative links inside each Skill so the same source works under both host
directories. For cross-project manuals, give the explicit project-root path in
prose unless the link remains valid in every selected host profile. The build
checks local Markdown links for no-host, Codex-only, Claude-only, and combined
layouts.

Preserve managed section markers when editing root fragments. Changes to owner
guidance belong outside those markers or in the create-once project context.
The bundle inventory covers only installed assets; it never inventories all
scientific working files.

## Build a change

Node.js 22 or newer is sufficient; no npm dependencies are installed.

```sh
npm run check
npm run build
```

The check performs the same asset assembly in memory and reports its counts and
digest without writing `dist/`. A build replaces its versioned bundle directory
and preview, then writes the archive, checksum, and `build-report.json`.
Keep unrelated work outside those generated locations.

Inspect the changed Skills or manuals in `dist/preview/` when destination context
helps. The preview deliberately omits project identity and active configuration.
Use the integrated native CLI for real initialization; do not turn the build
script into an alternate installer.

Checks are confined to release properties: parsable JSON, valid foundational
frontmatter, references, managed sections, portable unique paths, profile-aware
links, and consistent bundle digests. They do not evaluate scientific quality,
run an Agent, execute object mutations, or demonstrate cross-platform native
filesystem behavior.

## Version and bind a release

Update `package.json` and `CHANGELOG.md` for a template release. The package
version identifies this source release and determines the bundle/archive name.
Keep three separate meanings explicit:

| Version | Meaning |
|---|---|
| Template version | Version of these maintained assets |
| Distribution version and CLI range | Integrating release's declaration of which binary carries and supports them |
| Project format range | Managed document formats for which the guidance is written |

An independent build leaves distribution compatibility unbound. For an integrated
release, supply both options:

```sh
npm run build -- --release "$ACCRETE_DISTRIBUTION_VERSION" \
  --cli-range "$ACCRETE_CLI_VERSION_RANGE"
```

The values must come from the integrating release. The build requires a semantic
distribution version and a one-line range string, but it cannot establish that
the selected binary implements every command. The CLI release pipeline owns that
integration. Update the command contract and manuals together when supported
behavior changes.

Fixed archive metadata and sorted paths make equivalent build inputs produce
stable release content. `SHA256SUMS` describes bundle members other than itself;
the adjacent `.tar.gz.sha256` describes the archive. Pin the source Git revision
and preserve the produced bundle when incorporating it into a CLI release.

## Maintain upgrade behavior

The manifest distinguishes whole managed files, managed blocks, and create-once
seeds. Native initialization stores the installed base and its digest. A later
native upgrade compares that base with the current content and the requested
asset. It preserves owner edits and gives a concrete candidate when direct
replacement would lose them.

When retiring an asset, document its successor if one is needed. The native
updater can remove unchanged managed content; edited files remain for deliberate
resolution. Never classify a domain Tool source as a foundational asset merely
because it happens to live under a host's Skill directory.

Keep package upgrades, guidance upgrades, and persisted-format migration
separate in the manuals. The template release must not assert that installing
a binary updates all projects or that a changed command revises past Results.

See [CLI-INTEGRATION.md](CLI-INTEGRATION.md) for the installer/updater contract
and [TEMPLATE-FORMAT.md](TEMPLATE-FORMAT.md) for concrete manifest fields and
conflict resolution behavior.

## Keep the repository independent

Do not copy Kernel code or native operation logic into this repository to make
an unimplemented command appear available. Describe the required behavior and
retain a useful draft or input example. Small release assembly code is part of
this repository; runtime object writes remain the companion CLI's responsibility.

Do not install personal or user-global Skills as part of maintenance. These are
project assets installed through the selected native initialization profile.
The repository is private build metadata by default, has no automatic public
publication, and makes no choice of owner licensing beyond `UNLICENSED`.
