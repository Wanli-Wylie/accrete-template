# Design basis and template decisions

This repository implements the Agent-facing side of the supplied
**ACCRETE Architecture Design**, dated 3 November 2026. The source package remains
the shared interface specification for the independently developed CLI. This
document identifies the template's decisions so its contents can be maintained
without importing the historical scientific projects' local conventions.

The archive and individual design document digests are listed in
[design-input.json](design-input.json) so the exact supplied edition can be
identified independently of later changes to either implementation repository.

## Direct architectural commitments

| Template decision | Design basis |
|---|---|
| Five focused object Skills and a short overview | 08 §§2–3; user's explicit five-Skill requirement |
| Native Kernel owns managed writes; no persistence scripts in foundational Skills | 01 “The write boundary”; 04 §§1–4; 08 §10 |
| Short managed root guidance, separate owner-editable project context | 07 §§5–7; 08 §5 |
| Real per-host foundational Skill directories | 07 §9; 08 §§4,8 |
| Claude entry point imports `AGENTS.md` | 08 §4 |
| Native host delegation, plain-language briefs, no fixed model or worker count | 08 §§5,12–13 |
| Model identity supports embedded, external, submodule, and worktree arrangements | 02 §§2–3; 08 §6; 10 §2 |
| Shared configuration plus ignored local host bindings | 06 §§1–2 |
| Host-local, per-metadata-view query state | 05 §§2–4; 06 §2.1 |
| Selective retrospective admission and trust in prior work in context | 02 §§6–10; 08 §11 |
| Retained capabilities combine implementation and knowledge | 02 §7; 08 §§2,7–9 |
| Explicit project guidance upgrades separate from format migration | 07 §§5–7; 09 §§4,8–9 |

## Practical lessons carried into the guidance

Document 02 describes projects with distinct repository arrangements. The
template therefore does not require a `models/target` directory or submodules.
It explains that a host-created project worktree may leave external Model
checkouts shared, and asks briefs to name the actual editable source location.

The same dossier distinguishes model evolution, harness behavior, execution
outcome, and interpretation. The guidance keeps their revision references
separate and permits incomplete historical context. It never fills an earlier
execution revision from present HEAD or treats a plan as a completed run.

Large remote products and compact local reductions are both useful. Data
registration is described as an organizational act that may leave bytes in place.
The template gives no automatic retention duration, compression requirement, or
whole-tree digest rule. Domain programs decide what a completed scientific
product means, and the Kernel publishes its chosen description.

Documents 02 and 08 also explain how one-off analysis programs and mechanism
knowledge became retained capabilities. The template preserves this gradual
transition: work may remain ordinary source or Scratch until its continuing
purpose becomes clear. A Tool's source remains editable; host exposure is a
separate interface.

## Scope of the delivered scaffold

The scaffold installs project instructions, manuals, Skills, and illustrative
configuration files. Native initialization allocates project identity, writes
the supported active configuration, and establishes managed roots and its file
inventory. The source templates contain no fabricated registered Model, Tool,
Data, Result, or Memory object.

`.accrete/PROJECT.md` is a create-once seed for owner context. Files under
`.accrete/docs/` and the foundational Skills are release assets. Root instruction
and ignore/attribute fragments have explicit managed boundaries. Installing into
an existing project must preserve unrelated content and expose concrete conflicts
through the native upgrade mechanism described by the integration contract.

Host-specific worker definitions remain optional: the shared Coordinator and
Subagent guidance is usable without fixing a host's changing agent configuration
schema. No package is installed globally by these assets; no model family,
concurrency setting, permission mode, or scientific environment is imposed.

The template's source assets are implemented and distributable independently.
Execution of object commands and installation/upgrade semantics depend on the
matching `accrete-cli` implementation. The repository's CLI contract makes that
boundary explicit without providing a competing native-operation implementation.
