# CLI contract and publication semantics

## Contents

- [This release](#this-release)
- [Project selection and inputs](#project-selection-and-inputs)
- [Caller input shapes](#caller-input-shapes)
- [Mutation receipts and incomplete outcomes](#mutation-receipts-and-incomplete-outcomes)
- [Revisions, amendments and retries](#revisions-amendments-and-retries)
- [Workspace creation and template upgrades](#workspace-creation-and-template-upgrades)
- [Native reading and remote work](#native-reading-and-remote-work)

## This release

`accrete` is the native Kernel. It works inside an existing Workspace. The npm generator
`accrete-kit` creates that Workspace and installs these Skills and manuals; see
[below](#workspace-creation-and-template-upgrades).

Each Workspace holds this host's Kernel as a plain native executable. Run
`.accrete/bin/accrete` from the Workspace root, and
`<workspace>/.accrete/bin/accrete --project <workspace>` from anywhere else, such as an
external Model checkout or a run directory. It is ignored by Git, so a clone or another
machine restores its own; see [remote work](remote-work.md). Every manual writes `accrete`
as shorthand for whichever of these applies.

Read [the generated command map](cli-commands.md) for every command form. The
installed `.accrete/contracts/cli-v1.json` is the same catalog in JSON, and
`accrete COMMAND --help` prints the same flags at the terminal. `.accrete/release.json`
states which template installed these files and which Kernel it declares. `accrete
interface --json` states the running Kernel's versions and exit codes.

Do not emulate a command by writing a descriptor or SQLite row from a script.
Where the binary is absent on a host, native coding, computation and analysis
continue, and drafts wait for a host that has it.

The CLI deliberately has no general query language, Model-content editor, Agent
scheduler, experiment launcher, or replacement for Git. Foundation Skills explain
the meaning and consequences of the operations.

## Project selection and inputs

The owning project is chosen in this order: `--project DIRECTORY`,
`ACCRETE_PROJECT`, then the nearest `.accrete/project.toml` in the current
directory's ancestors. An external Model checkout is a valid command working
directory; explicitly select its owning project. Never infer that the current Git
repository is the intended ACCRETE project merely because Git is available there.

```sh
accrete --project "/work/research project" --json result record \
  --from "/work/run area/result-draft.json"
```

Global options can appear before or after the subcommand:

| Option | Meaning |
| --- | --- |
| `--project DIRECTORY` | Project root. |
| `--state-dir DIRECTORY` | Host-local state base for this invocation. |
| `--host LABEL` | Label for this machine in local bindings and location observations. It does not select an agent; `--agent` does. |
| `--json` | One JSON response on stdout; progress, diagnostics and errors on stderr. |

Paths are passed as single arguments, so spaces are ordinary characters. JSON is
UTF-8 and prose is UTF-8 Markdown. `--from -` reads stdin for object creation,
amendments, Data locations and Memory. `import` and `migrate` need real
paths. Configuration never runs shell expressions.

| Path | Relative to |
| --- | --- |
| `--from`, `--text-file`, `--links-from`, `export --to`, `import --from` | The invoking directory |
| Model checkout or worktree, Tool source, export or exposure destination, Data `--path`, `result capture --to`, and paths inside drafts | The selected project root |
| Data location path naming a configured filesystem root | That root |
| `data materialize --to` | Not a path: a configured location name |

Use [the input drafts](../examples/README.md) as editable starting material.
Object arguments accept a stable ID, a name or an alias. IDs take priority and an
ambiguous alias is a conflict. Create commands accept an optional `id` when stable
retries are useful: 1-180 ASCII letters, digits, dots, underscores or hyphens, and
not `.` or `..`. Otherwise the Kernel generates a UUID. Creation commands also
accept `--name` and `--description`, which override matching fields in `--from`.
The Kernel supplies the persisted envelope, timestamps, document format,
publication path and receipt. Drafts are not replacement persisted descriptors.
Use stable IDs when constructing relationships; unresolved locations or locally
absent referenced objects do not invalidate a meaningful association.

## Caller input shapes

These fields are what the commands accept. Free domain descriptions and
`extensions` can carry additional project content, and unknown fields are preserved.

### Models and iterations

| Operation | Input fields and meaning |
| --- | --- |
| `model register` | `name`, `description`, optional `aliases`, optional top-level `source_scope` (repository-relative program paths), and `repository`. `repository.checkout` is the same as `--checkout`: it creates the host-local binding and is not stored in the portable descriptor; `--checkout` wins if both are given. `repository.locator` and `arrangement` are portable hints. Supply a checkout or a `repository`. Registration never clones or fetches. |
| `model bind MODEL_ID --checkout PATH` | Bind this host to a known Model's checkout; do not clone, change branches or create a second identity. |
| `model update MODEL_ID --from FILE --expect REVISION` | JSON Merge Patch of descriptor fields. Source history stays in Git. |
| `model retire MODEL_ID --expect REVISION [--from FILE]` | Ends current use; identity and earlier associations remain. The optional JSON may carry `reason`. |
| `model iteration open MODEL_ID` | `name`, `purpose`, `branch`, `worktree`, `start`, `existing`, `id`, as flags or the same fields in `--from FILE`; flags override. `--worktree` creates a worktree of the Model's repository, unless `--existing` attaches one already there. Without `--worktree` no storage is allocated. `--branch` names a new branch; without it Git creates a detached worktree. `--start` defaults to `HEAD`. The Model needs a checkout binding on this host. |
| `model iteration close ITERATION_ID --expect REVISION` | `outcome`, optional `summary`, optional `commits`, in `--from FILE` or through `--outcome` and repeatable `--commit`. Outcome is required from one or the other and is authored text; `integrated`, `retained_separately`, and `abandoned` are examples. |
| `model iteration remove-worktree ITERATION_ID [--force]` | Removes the iteration's bound worktree through Git. Git's refusal to remove changed work stands unless `--force` is given. |

The Model Skill explains repository arrangements, dirty content and retained
refs. Closing an iteration does not merge code or remove its worktree; every
closing commit is kept under `refs/accrete/retained/`. If a Git operation succeeds
before a descriptor can be published, the receipt identifies the surviving
checkout and `accrete recover` attaches it. An outer project worktree is not a
separate checkout of every embedded or external Model.

### Tools

`tool admit` accepts `name`, `description` and
`source: {path, mode, revision?}`, or `--source`, `--source-mode` and `--revision`.
`mode` is `live` (the default) or `retained`. A retained selection requires
corresponding actual source material; its selection cannot freeze a mutable source
by relabeling it. A Git-backed retained revision uses the commit ID.
Project-relative source associations can travel with the project; a source outside
the project stays in local bindings. `tool bind TOOL_ID --source PATH` sets this
host's binding.

`tool update` accepts a JSON Merge Patch of editable fields and `--expect`.
Native tools edit and version the implementation. `tool expose` selects
`--agent codex` or `--agent claude`, an optional discovery `--name`, an optional
`--destination`, and `--mode wrapper` or `symlink`. The default wrapper names the
actual source `SKILL.md` and explains that all its relative references resolve from
the source directory. This is a discovery binding to one Tool, not a second retained
implementation. `tool expose` excludes it from Git through the repository-local
`.git/info/exclude`, because a wrapper can hold this host's absolute source path.

`tool refresh` regenerates existing managed exposures for one `--agent`, or for
all of them on this machine. An unavailable source remains pending.
`tool retire --expect REVISION` preserves source content, earlier Results and
running work; an optional `--from FILE` may carry `{reason: "..."}`. Other machines
reconcile exposures when they receive the descriptor and refresh. `tool export
--to PATH` creates a new local directory containing `tool.json` and `source/`;
registry publication is a separate owner-directed action.

### Data

| Field | Meaning |
| --- | --- |
| `name`, `description` | Human purpose of this retained input or product. |
| `content` | `{kind, mode, format?, edition?, size_bytes?, sha256?}`. `kind` is `file`, `directory`, `collection` or `external`. `mode` is `closed` (the default) or `live`. Additional domain details stay explicit. |
| `origin` | `{description, result_id?, uri?}` describing how the content arose. A generating Result is an origin, not a download locator. `--result` sets `origin.result_id`. |
| `replaces` | Earlier Data ID that a corrected edition replaces. |
| `locations[]` | `{name?, kind?, host?, path, ...}`; `kind` is `filesystem`, `rclone` or `external`. All are borrowed; `managed: true` is refused. A location gets its own ID. |

`content.sha256` identifies a regular file's bytes. `content.edition` describes the
intended edition in words. Backend ETags and version selectors stay opaque: a
location may carry `version`, `version_id` or `s3_version_at`, but `data materialize`
refuses a source that has one rather than silently fetching current bytes. Use a
version-specific exported locator, or retrieve that version with the provider's tool
and register the local copy.

Registration does not require hashing, walking, archiving or transferring payload
bytes. A structured input can describe an external product without any local
replica. The convenience `--path` form records the available path without claiming
that it created or owns those bytes, and `--hash` computes SHA-256 for one regular
file. `--live` sets `content.mode` to `live`. A symlink cannot be registered through
`--path`.

`data location add` adds a locator for the same content. A location name in the
shared/local configuration resolves a filesystem root or rclone remote. An `external`
location is a locator the Kernel records and never transfers. A repeated matching
location is a no-op. Only `data materialize` makes a replica managed.

`data amend DATA_ID --from FILE --expect REVISION` changes descriptive metadata. It
cannot redefine closed content or replace the locations array. `data retire DATA_ID
--expect REVISION [--from FILE]` changes status, may carry `reason`, and removes no
bytes.

`data materialize DATA_ID [--to LOCATION]` selects a usable source and publishes a
completed managed replica at a configured filesystem location, by default `working`.
Use `--source SOURCE_LOCATION` to resolve an ambiguity. The adapters copy local files
and directories or download through configured rclone. Uploading is a native rclone
operation followed by `data location add`.

`data evict DATA_ID --location LOCATION` names exactly one managed replica by location
ID or name; an ambiguous name is a conflict. It preserves identity, relationships and
other locations. Registered borrowed directories remain under their existing owner's
control. Content revised after an earlier closed product normally receives another
Data ID; an added replica does not retroactively change earlier Results.

### Results

`result record` accepts optional `name` and `activity` (a useful human description;
the index shows `name`, falling back to `activity`), and optional `models`, `tools`,
`inputs`, `outputs`, `execution`, `observations`, `related_results`, and `extensions`:

| Field | Shape |
| --- | --- |
| `models[]` | `{model_id, role?, commit: null\|string, dirty: null\|boolean}`; omit unavailable observations or leave them null. |
| `tools[]` | `{tool_id, revision: null\|string}`, describing the material actually used. |
| `inputs[]`, `outputs[]` | `{data_id, role?}`. |
| `execution` | Free-form domain object with useful execution conditions and optional start/end/outcome descriptions. |
| `observations[]` | Array of observations, each a free-form object, conventionally with `text`. |
| `related_results[]` | `{result_id, role?}` for attempts, legs, comparisons or continuations. |

Empty association arrays are legitimate. A Result can be useful even when some
details or locally referenced objects are unavailable. Today's checkout commit does
not fill a retrospective execution revision. `--observe-checkout PATH` records the
current checkout as a separately labelled recording-time observation, apart from the
execution description. A `commit` given for a Model with a local checkout is kept
under `refs/accrete/retained/`; the receipt names the ref or says why it could not.

`result amend` applies an explicit JSON Merge Patch with `--expect REVISION`.
`result observe --text-file FILE` appends independent authored content to
`observations` without a caller revision requirement; `--operation-id ID` makes an
uncertain append retryable. An amended description or observation does not launch
any computation. Later interpretation can also become linked Memory.

`result capture --checkout PATH --path SOURCE_PATH --to DIRECTORY` writes a selected
binary Git diff and selected nonignored untracked files to a new directory, with a
manifest of the captured scope. Repeat `--path`. Ignored products, external
dependencies and runtime state stay outside it, so it is not a complete executable
environment. Register the directory as Data if it should be retained.

### Memory

`memory append --from FILE` consumes a complete Markdown draft. Do not reserve a
permanent empty entry or invent its ID/date filename. Repeat `--model`, `--tool`,
`--data`, `--result` and `--supersedes` for each associated object ID. `--links-from
FILE` adds a JSON array of further links, each `{kind, id, relation?}`. `--title` and
`--authored-at` (an RFC 3339 instant) are optional. `--id` selects a stable entry ID;
repeating the same ID and body returns the same entry, which is how to retry. Ordinary
prose authoring requires none of these.

The Kernel inserts its managed frontmatter, publishes the complete entry, and
returns the allocated path. The shared project timezone determines the default
`memory/yyyy/mm/dd/NNN.md` organization. Stable identity survives imported filename
collisions and renumbering. A later correction uses `--supersedes` and explains the
changed interpretation. Retain the useful history of reasoning.

### Metadata exchange

`accrete export --to PATH [--id ID]` writes a JSON bundle of the selected or all
managed documents. Repeat `--id` for a subset. It omits scientific payloads, Git
objects, Tool source and machine bindings. `accrete import --from PATH` reads such a
bundle object by object and reports each outcome. A bundle from another project needs
`--allow-foreign`. The remote guide says how to use them.

## Mutation receipts and incomplete outcomes

A successful single-object mutation returns:

```json
{
  "object_id": "79c3a895-6c75-4ecd-bbd5-7f6c452ec8db",
  "path": "/resolved/project/results/79c3a895-6c75-4ecd-bbd5-7f6c452ec8db.json",
  "revision": "sha256-of-the-actual-file-bytes",
  "committed": true,
  "published": true,
  "durability": "durable",
  "index_pending": false,
  "unchanged": false
}
```

These are illustrative values. Consume the actual returned values. Multi-effect
operations add written paths, native side effects and pending exposures. Commands
without an object, such as `index refresh`, return their affected view and paths
instead.

| Outcome | Meaning | Continuation |
| --- | --- | --- |
| `committed: true`, `index_pending: false` | Primary document and local projection completed | Continue from the returned identity and paths. |
| `committed: true`, `index_pending: true`, exit 0 | Primary publication succeeded | Run `accrete index refresh` when needed. Keep the existing object and computation. |
| `published: true`, `durability: "uncertain"`, exit 8 | Destination became visible; synchronization did not establish the normal durability guarantee | Keep the ID and path, and run `accrete recover`. |
| External side effect complete, descriptor pending, exit 7 | A worktree or completed replica may already exist | Run `accrete recover`, which finishes from the receipt. An incomplete transfer is reported with its paths for explicit retry. |
| Rejected before publication | No primary object change | Correct the stated input/configuration/revision issue and retry as appropriate. |

| Exit code | Meaning |
| --- | --- |
| `0` | Success, including a committed document whose index refresh is pending. |
| `2` | Invalid invocation, input, or unsupported format. |
| `3` | Unresolved configuration or project, or absent object. |
| `4` | Revision, identity, ownership, or destination conflict. |
| `5` | Native dependency unavailable. |
| `6` | Storage failure before the requested publication completes. |
| `7` | Incomplete external operation or partially failed import. |
| `8` | Publication is visible but durability is uncertain. |

Inspect structured state before interpreting any nonzero exit as "nothing happened."
`accrete recover` reconciles Data transfers and evictions, worktree creation and
uncertain publications from their receipts; `--operation OPERATION_ID` limits it to
one Data operation. It never relaunches scientific computation.

## Revisions, amendments and retries

A revision is the lowercase SHA-256 of the document's actual current bytes, including
external edits. It is not a small counter that can coincide on divergent hosts. Use a
returned revision while current, or compute it with any SHA-256 tool. Preserve the expected
revision from the version you read; on conflict, read the current document and combine
the intended changes.

For `result amend`, `tool update`, `model update` and `data amend`, JSON Merge Patch
means object members merge, arrays replace in full, and `null` removes a member. The
fields `format`, `kind`, `id`, `project_id`, `created_at` and `updated_at` are not
editable. Keep existing association array members that should survive. On create, a
null revision can represent unknown information; in a patch, removing that member
leaves it unspecified. Neither means the newest revision should be inferred. This
follows the standard [JSON Merge Patch semantics](https://www.rfc-editor.org/rfc/rfc7396).

A supplied ID with identical submitted content is an idempotent create. The Kernel
compares the caller content independently of fields it allocated. An existing ID with
differing content requires amendment or produces a conflict. A `result observe`
operation ID with the same text appends once; changed text under the same operation
ID is a conflict. Retain the original submitted draft when retrying; regenerating
timestamps or observations makes a different payload.

A lost terminal acknowledgment is not a reason to create another identity or rerun the
scientific calculation. Inspect the known object path, or retry with the same ID.

## Workspace creation and template upgrades

These are npm commands, not `accrete` commands:

```sh
npx accrete-kit@latest create my-project
npx accrete-kit@latest create my-project --timezone Asia/Shanghai --agents claude --no-git --no-install
npx accrete-kit@latest create .
npx accrete-kit@latest upgrade
npx accrete-kit@latest upgrade --dry-run --project PATH
npx accrete-kit@latest upgrade --accept PATH
npx accrete-kit@<version> install
```

Creating writes `.accrete/project.toml` with a new identity, installs the guidance, and
installs this host's Kernel at `.accrete/bin/accrete` unless `--no-install` is given. No root
`package.json` or `node_modules/` is added, and an existing `package.json` is untouched. `.` adds to an existing
directory or repository, preserving what is there. `--agents` selects `codex,claude` (the
default), `codex`, `claude` or `none`; `none` leaves the shared manuals usable without a
host discovery interface. `--name`, `--id` and `--timezone` set the marker's fields. Git is
initialized unless `--no-git` is given or the directory is already in a repository;
committing and selecting a remote remain ordinary Git work. Store directories appear on
first use. Repeating creation preserves the existing identity.

`upgrade` refreshes this guidance independently of a project-format migration. Without
`--project` it uses the nearest ancestor Workspace. It compares current content with the
installed base. Unchanged managed content updates. An edited file stays as it is, a
candidate holding the incoming content is written under
`.accrete/template-upgrades/<version>/`, and the rest of the upgrade continues; the run
still exits 0, lists the path as `pending` and warns. A locally deleted file stays deleted,
and removing the markers from a block file counts as deleting it. Owner content outside
managed blocks and the seeded `.accrete/PROJECT.md` remains owned by the project.
`--dry-run` reports the decisions without writing. `--accept PATH` acknowledges the
owner/Agent's resolved content for a pending candidate; it advances the base to that
incoming version while preserving the resolution, and never copies the candidate over the
current file.

The inventory and retained small bases make later updates possible when the old generator
is gone. `--agents` on upgrade changes the selection and is otherwise kept. Newly selected
agents install their own real Skill directories; a dropped agent's unchanged files are
removed and edited ones preserved.

`upgrade` also moves the Kernel binary and the recorded `kernel_version` to the version that
`accrete-kit` carries; a binary that already runs as that version is left alone. `upgrade`
refuses, changing nothing, when the Workspace's template is newer than that `accrete-kit`.
A Kernel binary that cannot be installed leaves the Workspace in place, names the command to
retry, and exits nonzero. Replacing a Kernel alone changes no project guidance.

`install` restores this host's Kernel in an existing Workspace, for a fresh clone or another
machine. It takes `--project` as `upgrade` does. It must match the Workspace's recorded
`kernel_version`; otherwise it changes nothing and prints the exact
`npx accrete-kit@<version> install` that matches.

`accrete migrate [--dry-run]` handles persisted format changes while preserving object
identities and associations. Format 1 is the only one so far, so it reports the
project is current and changes nothing. `accrete migrate --from LEGACY [--dry-run]`
converts the old scaffold's metadata and keeps its originals.

## Native reading and remote work

Read portable descriptors with file tools and `jq`, code/history with Git, scientific
bytes with their format readers, and Memory with `rg`. `accrete config resolve --json`
reports resolved roots, host, metadata view, index path and state directory, without
credentials. Read the projection with `sqlite3 -readonly` at the path in
`.local_state.index`, and ask SQLite for `.schema` before assuming columns. A brief "database is locked" during a concurrent refresh means retry.

```sh
sqlite3 -readonly "$(accrete config resolve --json | jq -r .local_state.index)" .schema
```

Each independent metadata view has a host-local lock/index/recovery binding.
Different branches can carry different documents despite sharing a project ID.
Quiet managed writers before structural Git operations on that metadata worktree,
then run `accrete index refresh`. Exchange durable JSON/Markdown through ordinary Git
or `export` and `import`. Do not exchange a live SQLite projection as the durable
project state.

An unavailable remote payload can still have a valid description. Live job state
comes from its scheduler, process, log or domain launcher. Recovery handles the
described metadata/native side effect; scientific execution remains an explicit
domain action. Read [remote work](remote-work.md) for practical context.
