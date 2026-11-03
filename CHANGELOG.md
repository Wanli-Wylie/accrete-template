# Changelog

## 0.1.0 — 2026-11-03

Initial independent implementation of the ACCRETE foundational template, based
on the supplied architecture edition dated 3 November 2026.

- Added five foundational Skills: Models, Tools, Data, Results, and Memory, with
  progressive references explaining semantics, native work, managed writes,
  relationships, and continuation.
- Added concise Codex/Claude entry points, owner-editable project context,
  Coordinator and Subagent guidance, and manuals for long-term and remote work.
- Added shared defaults and illustrative workstation/compute-host configurations
  without allocating project identities or object instances.
- Added an explicit template-side CLI contract and generated command map.
- Added manifest profiles, per-asset ownership and digests, initialization and
  upgrade descriptions, and JSON Schemas for the release representation.
- Added dependency-free Node.js release assembly, checks, an archive and
  checksums, a both-host preview, and a machine-readable build report.
- Kept the standalone template's CLI compatibility unbound until an integrating
  release supplies its distribution version and supported range.

This release contains no Kernel implementation, project installer, Agent runtime,
or public publication mechanism. Native initialization, upgrade, and object
operations are defined as requirements for `accrete-cli`.
