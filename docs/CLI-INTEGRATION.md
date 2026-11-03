# The generator and the Kernel

## The seam

A Workspace is an independent Git project owned by the user, not a fork kept in sync
with the template. `accrete-kit` creates and maintains it, general-purpose coding agents work in
it, and the Kernel provides the native persistent infrastructure. Each repository
maintains and publishes its own releases.

| Package | Repository | Contains |
| --- | --- | --- |
| `accrete-kit` on npm | `accrete-template` (this one) | The generator and upgrader, the assembled scaffold, Skills and manuals, and the embedded release binaries |
| GitHub Release archives | `accrete-cli` | The native Kernel for each platform, with its notices |

The Kernel works inside an existing Workspace and knows nothing about this repository:
it requires only the marker, as `accrete-cli/docs/workspace.md` states. It has no
initialization and no template logic. Creating a Workspace, upgrading template-derived
files and handling their conflicts all belong here.

The repositories meet at two points: the marker, and the Kernel release this package embeds,
named by `accrete.cli` and `accrete.cliRepo` in its `package.json`.

## Commands

```sh
npx accrete-kit@latest create my-project
npx accrete-kit@latest create my-project --timezone Asia/Shanghai --agents claude --no-git --no-install
npx accrete-kit@latest create .
npx accrete-kit@latest upgrade
npx accrete-kit@latest upgrade --dry-run --agents codex --project PATH --no-install
npx accrete-kit@latest upgrade --accept PATH
npx accrete-kit@<version> install
npx accrete-kit@<version> install --project PATH
```

`create`, `upgrade` and `install` are subcommands, and a missing or unknown one prints usage
and exits nonzero. All take `--json`. `--no-install` skips installing the Kernel binary. `accrete-kit` does not forward commands to the Kernel. `--name` and `--id` set identity when creating; see
[the format](TEMPLATE-FORMAT.md#creating-a-workspace).

## What creation does

1. Validate the arguments, then the target. Nothing is written for a bad value.
2. Write `.accrete/project.toml` unless one exists, in which case its identity stays.
3. Install the selected files by ownership, preserving existing content, then write
   `.accrete/template-install.json`. The default agents are `codex,claude`; `--agents none`
   installs the shared manuals only.
4. Run `git init` unless `--no-git` is given or the target is already inside a repository.
   No first commit and no remote.
5. Install this host's Kernel at `.accrete/bin/accrete`, unless `--no-install` is given.

Store directories appear on first use, created by the Kernel. No Model is registered from
the outer repository, and no default Results, Memory entries or Data are created. Host
configuration such as `.claude/settings.json` and `.codex/config.toml` stays with the
owner.

## The Kernel in a Workspace

The Kernel is a plain native executable at `.accrete/bin/accrete`, mode 0755, published by a
temp sibling and rename. `/.accrete/bin/` is in the `.gitignore` block, so a clone restores
its own. Workspaces on different versions coexist. A Workspace gets no root `package.json` and
no `node_modules/`, and an existing project's `package.json` is untouched.

- **`create` and `upgrade`** copy this host's binary from the package. `upgrade` moves the
  binary and the inventory's `kernel_version` to the version this package carries.
- **A binary that already runs as that version stays,** whatever its bytes. One that fails to
  run, or reports another version, is replaced.
- **`install`** restores the binary in an existing Workspace. It must match the recorded
  `kernel_version`; otherwise it changes nothing, exits 4, and prints the matching
  `npx accrete-kit@<version> install`, where the version is the inventory's `template_version`.
- **A host with no embedded binary** gets an error naming the supported platforms. `create`
  and `upgrade` still finish the Workspace, report it in `failed` with the retry command, and
  exit 7; `install` exits 5. A symbolic link at or above `.accrete/bin/accrete` is not followed.
- **Before installing,** the binary's digest and version are checked against
  `dist/kernel/kernel.json`.

Agents run the Kernel as `.accrete/bin/accrete` from the Workspace root, and as
`<workspace>/.accrete/bin/accrete --project <workspace>` from anywhere else. This is stated
once, in the `AGENTS.md` managed block and `cli-contract.md`; manuals write `accrete` as
shorthand. `.accrete/docs/remote-work.md` gives the clone and no-Node routes.

## The embedded binaries

`scripts/fetch-kernel.mjs` places the declared release in `dist/kernel/<os>-<cpu>/`, each
platform with its binary, `LICENSE`, `THIRD-PARTY-NOTICES` and `licenses/`, and records digests
in `dist/kernel/kernel.json`. It downloads
`accrete-<version>-<target>.tar.gz` and `SHA256SUMS` from the `v<version>` GitHub Release of
`accrete.cliRepo`, or reads them from `--from DIR`, and verifies each archive against the sums.
All four platforms are required unless `--allow-partial` is given, which is for local
development only. `--check` verifies what is in place, and `npm publish` runs it, so a package
without all four cannot be published.

## Receipts

`--json` prints one document on stdout.

| Field | Meaning |
| --- | --- |
| `ok` | Whether every path and the Kernel install succeeded. Pending candidates are still `ok`. |
| `action` | `create`, `upgrade`, `accept` or `install`. |
| `project_root`, `project_id` | The Workspace. |
| `written`, `removed` | Every path this run changed, bookkeeping included. |
| `pending` | Paths with an unresolved candidate. |
| `detached`, `locally_deleted` | Paths preserved and reported. |
| `failed` | Per-path failures, with `error`, and `retry` for the Kernel. |
| `files` | The decision for each path; a candidate names `candidate` and `next`. |
| `kernel` | `version`, `platform`, `path` and `action`: `installed`, `unchanged`, `would-install`, `skipped` or `failed`. |
| `next_steps` | What the person runs next. |

`create` adds `created`, `name`, `timezone`, `format`, `marker` and `git_initialized`, and
`skipped` with `message` when the Workspace is on another template version. Errors are one
JSON document on stderr, in the Kernel's shape, and use its exit codes: 2 invalid, 3 not
found or configuration, 4 conflict, 5 missing dependency, 6 storage, 7 a run that finished
with failures. Warnings go to stderr in both modes.

## Command and input agreement

`contract/cli-v1.json` lists every command form an agent learns: the Kernel's, 34
invocation shapes. Generator commands are not in it; they are in
`template/.accrete/docs/cli-contract.md`. The installed `.accrete/docs/cli-commands.md` is
generated from the catalog.

`scripts/check-cli-contract.mjs --binary PATH` checks every catalog entry and long flag
against that binary's `--help`. The binary comes from the other repository, so this is a
maintainer and release check rather than part of `npm test`. The release workflow runs it
against the embedded binary for its runner before publishing.

`contract/input-drafts.schema.json` describes caller input drafts. It does not specify the
persisted envelope or database tables. `contract/example-inputs.json` maps shipped examples
to those definitions. `template/.accrete/docs/cli-contract.md` holds the semantics.

The architecture requires byte-bound revision checks, explicit incomplete publication
outcomes, successful primary writes despite a pending index, real host discovery
directories, explicit migrations, and no Kernel-replacing Skill scripts. Spellings change
in the catalog, manuals, examples and CLI together, with no compatibility aliases.
