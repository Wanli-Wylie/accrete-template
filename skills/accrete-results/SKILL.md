---
name: accrete-results
description: Preserve meaningful activities and observations as ACCRETE Results. Use for simulations, comparisons, analyses, benchmarks, transformations, failed attempts, retrospective execution descriptions, completion updates, or links between Model revisions, Tools, input Data, and retained outputs. Execute work with native tools and use the Kernel for durable Result writes.
---

# ACCRETE Results

Retain what an activity involved and what was observed when that description
will help continuing work. A Result can describe a simulation, failed build,
numerical comparison, performance measurement, data transformation, or analysis.
Create it before, during, or after the activity as useful. The research process
does not depend on a mandatory registration sequence or run wrapper.

## Select the change that matches the activity

| Situation | Action |
| --- | --- |
| Retain a newly described activity | Draft structured input and call `accrete result record`. |
| Add one observation to a known activity | Call `accrete result observe`. |
| Correct associations or add structured completion information | Call `accrete result amend` using the current revision. |
| Keep dirty working source beyond its checkout | Call `accrete result capture` and register the directory as Data if useful. |
| Execute a new attempt | Run it natively and normally give it a new Result ID if retained. |
| Reinterpret an earlier result | Write linked Memory; retain a new analysis Result if useful. |
| Find present process state | Use the scheduler, process tools, logs, or domain launcher. |

Describe only what is known. A historical Model revision comes from the
execution's own information, not today's checkout HEAD. Missing environment
details or absent outputs remain missing. A trace failure before simulation
steps is a useful failure description; it is not a completed simulation with
empty output. Dirty working content is allowed and should be described within
what was captured.

## Connect the useful objects

Associate relevant Model revisions and their roles, Tool implementations,
input Data, output Data, and related Results. Keep roles and domain measurements
in ordinary structured values. A pair of run legs and their comparison can be
linked without introducing a universal Experiment/Run/Trial hierarchy.

Use Data for retained products and locations. Use Memory for interpretations,
why a direction was chosen, and what later work can build on. Result publication
preserves an activity description; its content can still describe an ongoing,
incomplete, or failed activity. A draft in Scratch has not yet been published.

## Preserve completed work through partial failures

Publish managed Result changes through the native Kernel. A successful document
publication with `index_pending` means the Result exists: refresh the SQL
projection instead of creating it again. For an interrupted acknowledgment,
reuse the supplied stable ID or operation ID and inspect the reported receipt. For
uncertain durability, run `accrete recover`. Resolve revision conflicts by reading the current document
and retaining independent contributions. Never rerun scientific computation to
repair a Result or its index.

Read existing JSON, Git history, logs, and the host-local SQLite projection
with native tools; `accrete config resolve --json` gives the index path at
`.local_state.index`, for `sqlite3 -readonly`. Use the configured project roots and explicit `--project`
selection when outside the ACCRETE root.

## Read when needed

- [Activities and relationships](references/activities-and-relations.md):
  execution identity, unknowns, content, roles, and related activities.
- [Command manual](references/commands.md): input drafts, writes,
  amendments, independent observations, source capture, and operation receipts.
- [Scientific practice](references/scientific-practice.md): long runs,
  comparisons, failures, remote work, and evolving interpretation.

`accrete result COMMAND --help` prints the flags.
