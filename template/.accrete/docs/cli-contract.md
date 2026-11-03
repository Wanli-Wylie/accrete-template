# CLI contract and publication semantics

## Contents

- [Which interface this manual describes](#which-interface-this-manual-describes)
- [Project selection and inputs](#project-selection-and-inputs)
- [Caller input shapes](#caller-input-shapes)
- [Mutation receipts and incomplete outcomes](#mutation-receipts-and-incomplete-outcomes)
- [Revisions, amendments and retries](#revisions-amendments-and-retries)
- [Project initialization and guidance updates](#project-initialization-and-guidance-updates)
- [Native reading and remote work](#native-reading-and-remote-work)

## Which interface this manual describes

This is **accrete-template-cli/v1**, the template-side integration contract for
the separately developed native `accrete-cli`. The architecture edition of
3 November 2026 establishes the command families and behavior. This template
selects concrete argument spellings, structured draft fields and asset ownership
rules where that edition left engineering choices open.

Read [the generated command map](cli-commands.md) for every expected command.
The installed `.accrete/contracts/cli-v1.json` contains the same machine-readable
catalog. `.accrete/release.json` states the template version, distribution binding
and supported project formats. An `unbound-template` snapshot has no declared
binary compatibility; its content can be read, but it does not establish that an
independently supplied CLI accepts these exact inputs.

The executable's `--help` describes the binary actually invoked. If it differs
from this snapshot, use a compatible template/binary pair or adjust the input
using its documented interface. Preserve prepared drafts. Do not emulate a
missing command by writing a descriptor or SQLite row from a Skill script.
Native coding, computation and analysis can continue independently.

The contract deliberately has no general query language, Model-content editor,
Agent scheduler, experiment launcher, or replacement for Git. Foundation Skills
explain the meaning and consequences of the operations.

## Project selection and inputs

Select the owning project in this order: `--project PATH`, `ACCRETE_PROJECT`,
then the nearest `.accrete/project.toml` in the current directory's ancestors.
An external Model checkout is a valid command working directory; explicitly
select its owning project. Never infer that the current Git repository is the
intended ACCRETE project merely because Git is available there.

```sh
accrete --project "/work/research project" --json result record \
  --from "/work/run area/result-draft.json"
```

Global `--json` keeps a single structured receipt on stdout. Progress and
diagnostics use stderr. Native subprocesses receive argument arrays; paths with
spaces remain single arguments. JSON is UTF-8 and plain prose is UTF-8 Markdown.
`--from -` reads stdin. `--from FILE` and `--text-file FILE` name files relative
to the invoking directory unless absolute. Paths *inside* structured drafts
resolve relative to the selected project unless explicitly absolute. Shared and
local configuration paths follow the same project-relative rule. Configuration
never runs shell expressions.

Use [the input drafts](../examples/README.md) as editable starting material.
Create commands accept an optional caller-supplied UUID `id` when stable retries
are useful. Otherwise the Kernel allocates identity. The Kernel supplies the
persisted envelope, timestamps, document format, publication path and receipt.
Drafts are not replacement persisted descriptors. Resolve aliases to actual
object IDs when constructing relationships; unresolved *locations* or locally
absent referenced objects do not invalidate a meaningful association.

## Caller input shapes

These fields specify the template's inputs; the native Kernel owns its stored
document representation and SQL schema. Free domain descriptions and
`extensions` can carry additional project content. A paired implementation
must preserve supported unknown extensions and document any required
translation at the input boundary.

### Models and iterations

| Operation | Input fields and meaning |
| --- | --- |
| `model register --from FILE` | `name`, `description`, `repository: {checkout, scope?}`, optional `aliases`. The checkout is an existing Git repository; `scope` is an optional array of repository-relative program paths. Absolute checkout placement belongs to host-local binding. |
| `model bind MODEL_ID --checkout PATH` | Bind this host to a known Model's checkout; do not clone, change branches or create a second Model identity. |
| `model iteration open MODEL_ID --from FILE` | `name`, `purpose`, `base_commit`, `checkout`, optional `branch` and `create_worktree`. With `create_worktree: true`, create the explicitly named Model worktree from the supplied base. Otherwise attach existing material. |
| `model iteration close ITERATION_ID --from FILE --expect REVISION` | `outcome`, `summary`, and optional `commits` of retained full Git IDs. `outcome` is authored prose/string; `integrated`, `retained_separately`, and `abandoned` are examples. |

The Model Skill explains repository arrangements, dirty content and retained
refs. Closing an iteration does not merge code or delete its worktree. If a Git
operation succeeds before a descriptor can be published, the receipt identifies
the surviving checkout for recovery. An outer project worktree is not a separate
checkout of every embedded or external Model.

### Tools

`tool admit` accepts `name`, `description` and
`source: {path, mode, revision?}`. `mode` is `live` or `retained`. A retained
selection requires corresponding actual source material; its selection cannot
freeze a mutable source by relabeling it. A Git-backed retained revision uses the
full commit ID. Other versioned exported material can use its documented opaque
revision. Project-relative source associations can travel with the project;
absolute host placement stays in local bindings.

`tool update` accepts a JSON Merge Patch of editable fields and `--expect`.
Native tools edit and version the implementation. `tool expose` selects `codex`
or `claude`, an optional discovery `--name`, and exposure `--mode wrapper` or
`symlink`. The default wrapper names the actual source `SKILL.md` and explains
that all its relative references resolve from the source directory. This is a
discovery binding to one Tool, not a second retained implementation.

`tool refresh` regenerates existing managed exposures for one host or all
already selected hosts on this machine. An unavailable source remains pending.
`tool retire --from FILE --expect REVISION` accepts `{reason: "..."}` and
preserves source content, earlier Results and running work. Other machines
reconcile exposures when they receive the descriptor and refresh. `tool export
--to PATH` creates an explicitly requested local export; registry publication is
a separate owner-directed action.

### Data

| Field | Meaning |
| --- | --- |
| `name`, `description` | Human purpose of this retained input or product. |
| `content` | `{kind, state, format?, version?, digest?}`; kind is `file`, `directory`, `collection` or `external`; state is `closed` or `live`. Additional domain details stay explicit. |
| `origin` | `{description, result_id?, uri?}` describing how the content arose. A generating Result is an origin, not a download locator. |
| `locations[]` | `{name, kind, host?, path, managed?}`; kind is `filesystem` or `rclone`. A new registration is borrowed (`managed: false` or omitted). Names distinguish locations within this Data object. |

A digest, when supplied, identifies its algorithm and value; backend ETags
remain opaque backend tokens. Registration does not require hashing, walking,
archiving or transferring payload bytes. A structured input can describe an
external product without any local replica. The convenience `--path` form records
the available path without claiming that it created or owns those bytes.

`data location add` adds a locator for the same content. A location name in the
shared/local configuration resolves a filesystem root or native transfer binding.
Caller drafts cannot grant deletion authority by setting `managed: true`.
The Kernel can mark a replica managed only after its own materialization or a
separate explicitly documented ownership action.

`data materialize DATA_ID --to LOCATION` selects an explicitly usable source and
publishes a completed managed replica. Use `--source SOURCE_LOCATION` to resolve
an ambiguity; unavailable bindings produce an actionable outcome. The first
adapter scope is local files/directories plus configured rclone. A backend
version selector must be supported by that adapter; an ignored selector cannot
silently become a transfer of the latest bytes.

`data evict DATA_ID --location LOCATION_NAME` names exactly one managed replica.
It preserves identity, relationships and other locations. Registered borrowed
directories remain under their existing owner's control. Content revised after
an earlier closed product normally receives another Data ID; an added replica
does not retroactively change earlier Results.

### Results

`result record` accepts `activity` as a useful human description and optional
`models`, `tools`, `inputs`, `outputs`, `execution`, `observations`,
`related_results`, and `extensions`:

| Field | Shape |
| --- | --- |
| `models[]` | `{model_id, role?, commit: null|string, dirty: null|boolean}`; omit unavailable observations or leave them null. |
| `tools[]` | `{tool_id, revision: null|string}`, describing the material actually used. |
| `inputs[]`, `outputs[]` | `{data_id, role?}`. |
| `execution` | A domain-supplied object with useful execution conditions and optional start/end/outcome descriptions. |
| `observations` | Structured measurements, descriptions or other supplied observations. |
| `related_results[]` | `{result_id, role?}` for attempts, legs, comparisons or continuations. |

Empty association arrays are legitimate. A Result can be useful even when some
details or locally referenced objects are unavailable. Today's checkout commit
does not fill a retrospective execution revision. If current checkout metadata
is observed while recording, keep its observation time and purpose separate from
the earlier execution description.

`result amend` applies an explicit JSON Merge Patch with `--expect REVISION`.
`result observe --text-file FILE` appends independent authored content without a
caller revision requirement; optional `--operation-id UUID` makes an uncertain
append retry identifiable. An amended description or observation does not launch
any computation. Later interpretation can also become linked Memory.

### Memory

`memory append --from FILE` consumes a complete Markdown draft. Do not reserve a
permanent empty entry or invent its ID/date filename. Repeat `--model`, `--tool`,
`--data`, `--result` and `--memory` for each associated object ID. Optional `--id`
selects the stable entry UUID; optional `--operation-id` identifies a repeatable
submission. Ordinary prose authoring requires neither option.

The Kernel inserts its managed frontmatter, publishes the complete entry, and
returns the allocated path. The shared project timezone determines the default
`memory/yyyy/mm/dd/NNN.md` organization. Stable identity survives imported filename
collisions and renumbering. A later correction links the earlier entry and
explains the changed interpretation. Retain the useful history of reasoning.

## Mutation receipts and incomplete outcomes

A successful single-object mutation returns at least:

```json
{
  "object_id": "79c3a895-6c75-4ecd-bbd5-7f6c452ec8db",
  "path": "/resolved/project/results/79c3a895-6c75-4ecd-bbd5-7f6c452ec8db.json",
  "revision": "opaque-byte-bound-revision",
  "committed": true,
  "index_pending": false
}
```

These are illustrative values. Consume the actual returned values. Paths must
be absolute, or explicitly accompanied by their resolution base. Multi-effect
operations enumerate written paths, native side effects and pending exposures.
Commands without an object, such as `index refresh`, return their affected view
and paths instead of a fabricated object UUID.

| Outcome | Meaning | Continuation |
| --- | --- | --- |
| `committed: true`, `index_pending: false` | Primary document and local projection completed | Continue from the returned identity and paths. |
| `committed: true`, `index_pending: true`, exit 0 | Primary publication succeeded | Run `accrete index refresh` when needed. Keep the existing object and computation. |
| `published: true`, `durability: uncertain` | Destination became visible; synchronization did not establish the normal durability guarantee | Retain the ID/path and recovery information; inspect and reconcile that publication. |
| External side effect complete, descriptor pending | A worktree or completed replica may already exist | Use the concrete surviving paths and supported native recovery route. |
| Rejected before publication | No primary object change | Correct the stated input/configuration/revision issue and retry as appropriate. |

The native CLI chooses stable nonzero numeric codes for invalid invocation,
configuration, revision conflict, missing dependencies, pre-publication storage
failure and incomplete external operations. The uncertainty-after-publication
outcome must be distinguishable. Inspect structured state before interpreting
any nonzero exit as “nothing happened.” This template does not invent an
undocumented recovery command; the paired CLI must name its supported recovery
action and exact surviving paths in the receipt.

## Revisions, amendments and retries

A revision represents actual current document bytes, including external edits.
It is not a small counter that can coincide on divergent hosts. Use a returned
revision while current, or compute the byte digest according to the installed
CLI's documented encoding. Preserve the expected revision from the version you
read; on conflict, read the current document and combine the intended changes.

For `result amend` and `tool update`, JSON Merge Patch means object members merge,
arrays replace in full, and `null` removes a member. Identity, kind and document
format are not editable fields. Keep existing association array members that
should survive. On create, a null revision can represent unknown information;
in a patch, removing that member leaves it unspecified. Neither means the newest
revision should be inferred. This follows the standard [JSON Merge Patch
semantics](https://www.rfc-editor.org/rfc/rfc7396).

A supplied ID with identical submitted content is an idempotent create. The
Kernel compares the caller content independently of fields it allocated. An
existing ID with differing content requires amendment or produces a conflict.
An append operation ID with the same payload appends once; changed content under
the same operation ID is an error. Retain the original submitted draft when
retrying; regenerating timestamps or observations makes a different payload.

A lost terminal acknowledgment is not a reason to create another identity or
rerun the scientific calculation. Inspect the known object path or retry the
same stable operation using the paired implementation's supported behavior.

## Project initialization and guidance updates

`accrete init` selects the embedded release's host profiles, creates the project
identity/configuration through the Kernel, and installs ordinary files at the
manifest's destinations. The default profiles are `codex,claude`; `none` leaves
the shared manuals usable without a host discovery interface. Git initialization
is explicit (`--git`); committing and selecting a remote remain ordinary Git work.

`accrete project upgrade` refreshes the embedded guidance independently of a
project-format migration. It compares current content with the installed base.
Unchanged managed content can update; edited content gets a candidate while the
current file remains. Owner content outside managed blocks and the seeded
`.accrete/PROJECT.md` remains owned by the project. `--dry-run` reports a proposed
change without writing files or receipts. `--accept PATH` acknowledges the
owner/Agent's resolved content for an existing pending candidate; it advances the
base to that incoming release while preserving the resolution. It never copies
the candidate over the current file as an implicit side effect.

The inventory and retained small asset bases make later updates possible even
when the old binary is no longer installed. Newly selected host profiles install
their own real Skill directories. Dropping a profile is an explicit selection
change; edited or unmanaged content is preserved. Installing a newer binary
alone changes no project guidance. `accrete migrate` explicitly changes supported
project formats when required, preserving object identities and associations.

## Native reading and remote work

Read portable descriptors with file tools and `jq`, code/history with Git,
scientific bytes with their format readers, Memory with `rg`, and the projection
with `sqlite3 -readonly`. Ask SQLite for `.schema` before assuming columns. A
configuration diagnostic should describe resolved roots, selected host, metadata
view, local index path and state directory; it should redact credentials rather
than dump the native environment.

Each independent metadata view has a host-local lock/index/recovery binding.
Different branches can carry different documents despite sharing a project ID.
Quiet managed writers before structural Git operations on that metadata worktree.
Exchange durable JSON/Markdown through ordinary Git or a supported explicit
import. Do not exchange a live SQLite projection as the durable project state.

An unavailable remote payload can still have a valid description. Live job
state comes from its scheduler, process, log or domain launcher. Recovery handles
the described metadata/native side effect; scientific execution remains an
explicit domain action. Read [remote work](remote-work.md) for practical context.
