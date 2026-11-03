# Build notes

The package has no npm dependencies. `npm run build` assembles `dist/scaffold/`, and
`npm pack` does so first. `scripts/fetch-kernel.mjs` supplies `dist/kernel/`.

## What the build covers

- Five canonical Skills with fifteen linked reference manuals.
- Local-link checks in all none/Codex/Claude/both host layouts.
- 72 installed file destinations in the combined layout, from 52 stored assets.
- A command map generated from the 34-entry catalog.
- Nine JSON input examples, parsed and mapped to named caller-input definitions.

It checks JSON parsing, example mapping and required top-level draft fields. It is not a
complete JSON Schema validation engine.

## What the tests cover

`npm test` runs the generator against small scaffolds and the assembled one, including
killing an upgrade at every publication and rerunning it, a stand-in Kernel, `fetch-kernel.mjs`
against local archives, and the packed tarball reached through `npx`. With a real binary
fetched, the packed test also installs it and runs its `--version`.

`scripts/check-cli-contract.mjs --binary PATH` checks the catalog against a real Kernel;
the release workflow runs it. No live Claude Code or Codex discovery session was exercised;
current primary host documentation informs the file layout. See
[host integration](HOST-INTEGRATION.md).
