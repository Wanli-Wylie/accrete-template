# Changelog

## 0.1.1 — 2026-11-03

First release published from GitHub Actions with npm trusted publishing and provenance.
The embedded Kernel is still 0.1.0, and there is no functional change.

## 0.1.0 — 2026-11-03

First release of `accrete-kit`, based on the architecture edition dated 3 November 2026.
An earlier pass compiled the template into the Rust binary, with `accrete init` and
`accrete project upgrade` installing it, through `--release`, `--cli-range`, an
`unbound-template` status and `accrete-cli`'s `template-bundle/` and `sync-template` script.
The owner corrected that before anything was published.

- Added the generator and upgrader in plain Node, `npx accrete-kit@latest create` and
  `upgrade`: ownership rules, candidates, `--accept`, `--dry-run`, agent selection and `--json`
  receipts, with tests in `node:test`. A rerun finishes from the rules, with no recovery
  receipt.
- `accrete-kit` embeds the `accrete-cli` GitHub Release binaries, placed by
  `scripts/fetch-kernel.mjs`, and installs this host's at `.accrete/bin/accrete`, ignored by Git.
  `install` restores it after a clone. An intermediate design pinned the Kernel as
  `@accrete/cli` in `devDependencies` with `npm install` and `node_modules/.bin/accrete`; it
  was replaced before anything was published.
- MIT licensed.
- Added `scripts/check-cli-contract.mjs`, the check of the catalog against a Kernel's
  `--help`, and GitHub Actions for CI and a tag-triggered release with trusted publishing.
- Added five foundational Skills: Models, Tools, Data, Results, and Memory, with
  progressive references explaining semantics, native work, managed writes,
  relationships, and continuation.
- Added concise Codex/Claude entry points, owner-editable project context,
  Coordinator and Subagent guidance, and manuals for long-term and remote work.
- Added shared defaults and illustrative workstation/compute-host configurations
  without allocating project identities or object instances.
- Added the CLI command catalog and a generated command map, covering every command
  form including `recover`, `export`, `import`, `interface`, `result capture`,
  `tool bind`, `model update`, `model retire`, `data amend`, `data retire`, and
  `model iteration remove-worktree`.
- Added manifest profiles, per-asset ownership and digests, and JSON Schemas for the
  scaffold representation.
- Added dependency-free assembly of the scaffold, with source checks.
- Aligned inputs with the CLI: `content.mode`, `content.sha256`, location kind
  `external`, top-level `source_scope`, an `observations` array, optional `activity`,
  safe-string IDs, iteration fields named like the flags, and an optional retirement
  `reason`.
- Reduced the `.gitignore` block to `/.accrete/local.toml`, `/.accrete/data/`,
  `/.accrete/bin/` and `/scratch/`, the only source of rules in that shared file. Tool exposures are
  excluded separately through the repository-local `.git/info/exclude`.
