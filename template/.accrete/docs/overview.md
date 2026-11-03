# Working in an ACCRETE project

ACCRETE gives enduring identities and relationships to the products of ongoing
computational work. The Agent chooses the question, develops and runs programs,
interprets what happened, and decides what to retain. The native `accrete` Kernel
publishes the corresponding managed object changes.

## Start with the current work

Read the owner's request and `.accrete/PROJECT.md`. Search the relevant existing
code, Results, and Memory with ordinary tools. Load the object Skill that helps
the next action. There is no required sequence through the five stores and no
requirement to register an activity before starting it.

Launch the main Claude Code or Codex session from the project root so its
instructions and Skills are discoverable. Model checkouts, Tool sources, data,
environments, and run directories may be elsewhere. Pass the owning project
explicitly to the CLI when operating there; a nested Git root does not establish
the intended ACCRETE project.

## The object system

| Object | Why it is retained | What changes through the Kernel | Natural working interface |
|---|---|---|---|
| Model | A computational program that continues to evolve | Registration, host binding, opening and closing an iteration | Git, editor, compiler, model runtime |
| Tool | An ability worth using again, including knowledge and executable work | Admission, metadata/revision selection, exposure, refresh, retirement, export | Its source directory, native language tools, Skill instructions |
| Data | An input or product selected for continued use | Registration, locations, managed materialization | Filesystem, storage tools, scientific format readers |
| Result | A retained account of an activity and its observations | Creation, amendment, appended observations | JSON readers and the local SQLite projection |
| Memory | Understanding, decisions, experience, and future direction | Publication of complete authored prose and associations | Markdown, file search, ordinary reading |

Scratch is ordinary ongoing work. It can contain scripts, drafts, logs, partial
outputs, or an entire investigation. Its contents become managed only through a
chosen object operation. A useful script may become a Tool; a finished output
may become Data; a completed or failed attempt may become a Result; its lesson
may become Memory. Each decision can be made independently and retrospectively.

## Relationships that support continuation

A Result can name several Model revisions in different roles, the Tools used,
input and output Data, and execution conditions. Memory explains how to interpret
those observations and what they suggest next. A Tool can combine the programs
and understanding that have repeatedly proved useful in those activities.

Object identity is independent of physical location. A registered Data object
can exist while its bytes remain remote. A Model can use several worktrees of
one Git repository. A Tool can have two host discovery interfaces while remaining
one capability. A Memory filename can change during import while its stable ID
continues to identify the same entry.

Keep the revision actually used by an activity separate from the current revision
of its Model or Tool. Today's checkout is useful evidence about today's files;
it does not fill a missing historical execution revision. Preserve unknown
information as unknown and retain supplied context without fabricating it.

## Where to work

The initialized defaults place small object descriptors in `.accrete/objects/`,
Results in `results/`, dated Memory in `memory/`, Tool sources in `tools/`, and
ongoing work in `scratch/`. Empty stores may be created lazily. Shared
`.accrete/project.toml` defines logical roots; ignored `.accrete/local.toml`
binds this host's paths. Configuration can place all of these elsewhere.

Foundational Skills are ordinary directories under `.agents/skills/` for Codex
and `.claude/skills/` for Claude Code. Each contains concise instructions and
references to load when needed. Read only the guidance relevant to the action:

| Need | Skill |
|---|---|
| Associate or develop a computational implementation | `accrete-models` |
| Retain, expose, or evolve a reusable capability | `accrete-tools` |
| Describe, locate, or materialize retained inputs/outputs | `accrete-data` |
| Preserve an activity, its operands, and observations | `accrete-results` |
| Carry understanding and decisions into later work | `accrete-memory` |

## The write boundary in practice

Use ordinary tools to clone repositories, edit source, commit changes, run
simulations, inspect arrays, transfer unregistered working files, and draft
prose. Use the Kernel when the action establishes or changes ACCRETE identity,
associations, lifecycle, or a managed location. Scientific programs write their
own outputs directly. Source and configuration are edited normally; managed
descriptors, Result publication, and Memory allocation use the CLI.

Use `git`, `rg`, `jq`, `sqlite3 -readonly`, or domain readers for questions those
tools already answer. `accrete index refresh` repairs or updates the local query
projection. It does not rerun the activity. A mutation receipt with
`committed: true` and `index_pending: true` means the object already exists and
only indexing remains.

Query the schema supplied by the installed Kernel. Inspect it with SQLite's
native `.schema` before assuming table or column names. The projection describes
its last successful refresh of this metadata view, and does not establish live
process state or current remote availability.

The installed binary's `--help` describes its available arguments. Read
[the CLI contract](cli-contract.md) and [command reference](cli-commands.md) for
the template's expected interface and compatibility boundary before a new kind
of managed write. When the binary is unavailable,
continue native work and preserve drafts for later submission. Do not recreate
the Kernel with ad hoc descriptor-writing scripts.

## Further guidance

- [Coordinator responsibilities](coordinator.md): maintain direction, delegate,
  integrate, and decide what to retain.
- [Subagent work](subagents.md): concrete briefs, independent working locations,
  and useful handovers.
- [Long-term work](long-term-work.md): relationships, reuse, capability growth,
  and changing interpretations.
- [Configuration](configuration.md): project context, path bindings, and local
  state.
- [Remote work](remote-work.md): computation and metadata exchange across hosts.

The project's selected template release, compatible CLI range, and project format
range are supplied with the installed assets. Installing a different binary
does not rewrite this guidance or migrate project documents. Explicit project
upgrade and migration operations handle those distinct changes.
