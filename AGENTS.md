# Maintaining accrete-template

This repository contains release assets for the ACCRETE CLI. Read `README.md`
and `docs/CLI-INTEGRATION.md` before changing the packaging contract.

Author each foundation once in `skills/`. Author project-facing guidance in
`template/`. The build makes ordinary host discovery directories in a preview
under `dist/`; edit the canonical sources, then rebuild.

Keep persistent object operations, initialization, template installation and
upgrades in the native CLI. Build tooling here may assemble and check release
assets only. Preserve native Git, file, SQL, scientific and host-agent work.

Keep exact command expectations in `contract/cli-v1.json` and their semantics in
`template/.accrete/docs/cli-contract.md`. When an interface changes, update the
affected Skill references and the integration notes together. Changes to the
architecture's object semantics require the owner's direction.

Use `npm run check` for source/package consistency and `npm run build` to produce
the embedding bundle and guidance preview. There are no runtime npm dependencies.
Do not install these project Skills into a maintainer's personal Skill directory.
