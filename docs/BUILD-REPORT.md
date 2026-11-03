# Build and delivery notes — 0.1.0

Executed on 3 November 2026 using Node.js v24.22.1 on Linux.
The release assembler has no external package dependencies.

## Completed construction and checks

- `npm run check` completed; the final source also completed `node scripts/build.mjs`.
- Five canonical Skills contain fifteen linked reference manuals.
- All none/Codex/Claude/both host layouts passed the build's local-link checks.
- The combined default layout contains 72 installed file destinations.
- The embedding archive contains 57 regular files and no symlinks.
- All manifest sizes/digests and all `SHA256SUMS` entries matched archive bytes.
- Every preview destination matched its manifest's canonical source bytes.
- Shared defaults and three illustrative configuration files parsed as TOML.
- Nine JSON input examples parsed and resolved to the named caller-input definitions.
- The command map was generated from the 24-entry CLI requirement catalog.
- Two consecutive builds of the final asset content produced identical archive bytes.
- `node --check scripts/build.mjs` completed successfully.

Archive: `accrete-template-0.1.0.tar.gz`

SHA-256: `a6b25ccddd95b7fb5d91396de8bc9768f38b3c822b894546c780e75137c68758`

The machine-readable build report is `dist/build-report.json`. The build checks
JSON parsing, example mapping and required top-level draft fields; it is not a
complete JSON Schema validation engine or a native command implementation.

## Integration boundary

This is an `unbound-template` asset release. No companion `accrete-cli` binary
was supplied or exercised in this session. Native initialization, migration,
object mutation and ownership-aware upgrades remain in that repository. No live
Claude Code/Codex discovery session or non-Linux host runtime was exercised.
Current primary host documentation informs the file layout; see
[host integration](HOST-INTEGRATION.md).

The supplied Git repository and generated artifacts are ready for owner
integration. Declare the actual native distribution binding with `--release`
and `--cli-range` when building the paired release. These flags record the
integrating release's declaration, not a result of automatic CLI probing.
