# Maintaining accrete-template

Maintain the five Skills, project guidance, and the `accrete-kit` generator in this
repository. Keep object persistence in `accrete-cli`.
The template's design basis is documented in [DESIGN-NOTES.md](DESIGN-NOTES.md).

## Edit the canonical source

| Intended change | Source to edit |
|---|---|
| Object meaning, situations of use, native work, or domain-independent advice | Relevant `skills/accrete-*/SKILL.md` or reference |
| Project entry text or operating guidance | `template/AGENTS.md`, `template/CLAUDE.md`, or `template/.accrete/docs/` |
| Initial owner context | `template/.accrete/PROJECT.md`; existing projects preserve their copy |
| Shared logical defaults | `config/defaults.toml` |
| Profiles and file ownership | `template.json` |
| Creation, upgrade and conflict behavior | `lib/`, `test/` and [the format](TEMPLATE-FORMAT.md), together |
| The embedded Kernel and where it is released | `accrete.cli` and `accrete.cliRepo` in `package.json`, the one place the repository is named |
| Command spelling, inputs, or receipts | `contract/cli-v1.json`, the authored CLI semantics manual, the Skill references, and `accrete-cli`, in one change |
| Scaffold representation | `schemas/`, `scripts/build.mjs` and `lib/scaffold.mjs`, with corresponding format documentation |

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
The Workspace inventory covers only installed assets; it never inventories all
scientific working files.

## Build a change

Node.js 20 or newer is sufficient; there are no npm dependencies.

```sh
npm run check
npm run build
npm test
```

The check performs the same assembly in memory and reports its counts without writing
`dist/`. A build replaces `dist/`. `npm test` builds first.

To see a change in place, run the bin on a scratch directory:

```sh
node bin/accrete-kit.mjs /tmp/trial --no-install
node bin/accrete-kit.mjs upgrade --project /tmp/trial --dry-run --no-install
```

Checks are confined to package properties: parsable JSON, valid foundational frontmatter,
references, managed sections, portable unique paths and profile-aware links. They do not
evaluate scientific quality, run an Agent, or execute object mutations.

## Release

Update `package.json` and `CHANGELOG.md`, then tag `vX.Y.Z`. Keep the meanings separate:

| Version | Meaning |
|---|---|
| Package version | These assets and this generator, also called the template version |
| `accrete.cli` | The exact Kernel release this version embeds and was written for |
| Project format range | Workspace formats for which the guidance is written |

The tag runs `.github/workflows/release.yml`: it runs the checks, fetches the declared Kernel
for all four platforms from the `accrete-cli` GitHub Release, runs the tests, runs
`scripts/check-cli-contract.mjs` against the embedded binary for its runner, and publishes with
npm trusted publishing. So the `accrete-cli` release comes first; a missing or drifted Kernel
stops the release before anything is published. Register the workflow as this package's
trusted publisher on npm once.

For local work, fetch what you have, then pack:

```sh
node scripts/fetch-kernel.mjs --from DIR --allow-partial
npm pack
node scripts/check-cli-contract.mjs --binary dist/kernel/darwin-arm64/accrete
```

`--allow-partial` is for local development only. `npm publish` runs `fetch-kernel.mjs --check`
and fails unless all four platforms are in place at the declared version.

## Maintain upgrade behavior

The manifest distinguishes whole managed files, managed blocks, and create-once seeds.
Creation stores the installed base and its digest. A later upgrade compares that base with
the current content and the incoming asset. It preserves owner edits and gives a concrete
candidate when direct replacement would lose them.

When retiring an asset, document its successor if one is needed. The upgrader removes
unchanged managed content; edited files remain for deliberate resolution. A locally deleted
file stays deleted. Never classify a domain Tool source as a foundational asset merely
because it happens to live under a host's Skill directory.

Keep Kernel upgrades, guidance upgrades, and persisted-format migration separate in the
manuals. The template must not assert that installing a Kernel updates all projects or that
a changed command revises past Results.

See [the generator](CLI-INTEGRATION.md) for commands and receipts and
[the format](TEMPLATE-FORMAT.md) for concrete manifest fields and conflict behavior.

## Keep the boundary

Do not copy Kernel code or native operation logic into this repository. The generator
writes template-derived files, the marker and the Kernel binary; runtime object writes belong
to `accrete-cli`, and a command the catalog lists has to exist there. The only time the
generator runs a Kernel is `--version`, to decide whether one already there still works.

Do not install personal or user-global Skills as part of maintenance. These are
project assets installed by the generator for the selected agents. The package is MIT
licensed, and each embedded Kernel keeps its own notices beside it.
