# Memory command manual

## Contents

- Interface and native reading
- Publish authored understanding
- Link objects and earlier understanding
- Identity, dates, and concurrent work
- Publication outcomes

## Interface and native reading

This manual defines the template v1 interface expected from `accrete-cli`.
The shared architecture establishes `memory append`; the full template
contract at project-root path `.accrete/docs/cli-contract.md` specifies the
relation and retry flags. The native executable is supplied separately. Read
`accrete memory append --help` for the invoked release's accepted interface.

Search and read Memory with ordinary tools. For the default configured root:

```sh
rg -n 'routing|cold start|reuse' memory
rg -n 'RESULT_ID_OR_MEMORY_ID' memory
```

Replace the search terms with those relevant to the task. Follow actual paths
returned by search or publication; configure other Memory roots normally.
Reading Markdown does not require an ACCRETE read command. SQL can query
the configured host-local projection, whose freshness is independent of the
durable files.

Global `--project PATH` selects the owning project. `ACCRETE_PROJECT` is the
fallback selection before ancestor-directory discovery. Use the explicit
selector when a worker operates in an external Model checkout or run directory.
Global `--json` returns a machine-readable receipt on stdout; diagnostics go
to stderr.

## Publish authored understanding

Write a complete Markdown body in a normal working file. Choose its structure
according to the substance; no fixed headings are required. Submit it with:

```sh
accrete --json memory append --from scratch/understanding.md
```

The Kernel allocates the stable ID, date-based path, authored metadata, and
requested associations and publishes the complete entry. It returns the ID,
concrete path, and revision. The source draft remains ordinary working material.
Do not reserve an empty permanent entry by manually creating its target path.

Input can be prepared anywhere that the selected host can read. Keep shared
project content free of native credentials and arbitrary environment dumps.
A useful interpretation can refer to a Tool or Result instead of embedding
its entire raw log.

## Link objects and earlier understanding

The template v1 interface provides repeatable relation flags:

```sh
accrete --json memory append --from scratch/understanding.md \
  --result "$RESULT_ID" --data "$DATA_ID" --model "$MODEL_ID"
```

Use `--tool TOOL_ID` for relevant capabilities and `--memory MEMORY_ID` for
earlier entries. Repeating a flag links several objects of that kind. Relations
may remain unresolved locally when the target belongs to another working
copy. Supply actual stable IDs and keep readable context in the body.

For a correction, draft a later entry explaining the change and link the
earlier entry:

```sh
accrete --json memory append --from scratch/correction.md \
  --memory "$EARLIER_MEMORY_ID" --result "$NEW_RESULT_ID"
```

Omit a relation whose target does not exist. If there is no new Result, the
correction can still link earlier Memory and explain its basis in prose.
The relationship alone does not express the correction's meaning; write what
changed and why.

## Identity, dates, and concurrent work

The default published layout is `memory/YYYY/MM/DD/NNN.md`. The configured
project timezone determines the publication date. The entry's frontmatter ID
is stable across renaming; the authored instant remains distinct from the
date used for display. Simulation time belongs in the scientific description.

Local Kernel publication serializes sequence allocation so concurrent local
writers receive distinct paths. Each worker can submit a complete delegated
entry using the same operation. The Coordinator may synthesize entries when
that better preserves the understanding.

Independent hosts can choose the same date and display number. Import preserves
both IDs and authored instants and may renumber a filename. If Git produces a
path collision, preserve both complete entries and resolve the paths. Use IDs
for durable associations, and update human path links where necessary.

## Publication outcomes

When retryability matters, the template v1 interface accepts `--id UUID` and
`--operation-id UUID`. Retain supplied IDs before submission. Repeating the
same operation with unchanged content reconciles the same publication; it
does not allocate another numbered entry. Reusing an ID with different content
produces a conflict. Use a new entry for a new interpretation.

`committed: true` means the Markdown publication completed. When
`index_pending: true` accompanies it, run `accrete index refresh`; do not append
the entry a second time. If a destination is published but durability is
reported uncertain, preserve its path and receipt and use the native recovery
interface for that same publication.

Input rejection before publication leaves the draft available for correction.
Lost acknowledgments and partial publication require inspecting the specific
receipt or destination before retrying. Kernel recovery concerns publication
and projection; it never reruns an experiment or rewrites the interpretation
on the agent's behalf.
