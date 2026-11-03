# Maintaining accrete-template

This repository is the npm package `accrete-kit`: the generator and upgrader for
ACCRETE Workspaces, with the Skills, manuals, examples and command catalog they install.
Read `README.md` and `docs/CLI-INTEGRATION.md` before changing the packaging contract.

Author each foundation once in `skills/`. Author project-facing guidance in `template/`.
The build assembles both into `dist/scaffold/`; edit the canonical sources, then rebuild.

Workspace creation, template upgrades and their conflict handling live in `lib/`, by the
rules in `docs/TEMPLATE-FORMAT.md`. Persistent object operations belong to the Kernel in
`accrete-cli`; the two meet at the marker and at the release binaries this package embeds,
named by `accrete.cli` and `accrete.cliRepo` in `package.json`. Preserve native Git, file,
SQL, scientific and host-agent work.

Keep exact Kernel commands in `contract/cli-v1.json` and their semantics in
`template/.accrete/docs/cli-contract.md`. When an interface changes, update the affected
Skill references, the examples and `accrete-cli` together.
`scripts/check-cli-contract.mjs --binary PATH` checks each catalog entry and flag against
`--help`. Changes to the architecture's object semantics require the owner's direction.

Use `npm run check` for source and package consistency, `npm run build` for the scaffold,
and `npm test` for the generator. `scripts/fetch-kernel.mjs` places the Kernel binaries.
There are no npm dependencies.
Do not install these project Skills into a maintainer's personal Skill directory.
