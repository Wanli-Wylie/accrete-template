# Input drafts

These files are reusable caller-input drafts for the `accrete` commands. They are
reference assets installed with the project guidance. **They are not existing
ACCRETE objects, initial store contents, or instructions to execute a research
workflow.** `npx accrete-kit@latest create` copies them as examples; it does not submit them.

Copy a useful draft into the configured Scratch directory, adapt it to the
actual work, and submit it only when the corresponding organizational action
is intended. Replace example descriptions and every `REPLACE_WITH_...` value.
Use IDs returned by earlier Kernel writes and actual Git revisions. Empty
association arrays mean no associations have been supplied; populate them only
with objects relevant to the activity. Omit fields that are unknown.

The installed [CLI contract](../docs/cli-contract.md) describes the fields, and the
[command map](../docs/cli-commands.md) lists every operation. Read the matching
Skill reference for the object's meaning.

## Available drafts

| Draft | Submit with | Adapt before submission |
| --- | --- | --- |
| [model-register.json](model-register.json) | `model register --from FILE` | Choose the program name and existing checkout. `repository.checkout` is the same as `--checkout`. Add top-level `source_scope` only when it describes the program meaningfully. |
| [iteration-open.json](iteration-open.json) | `model iteration open MODEL_ID --from FILE` | Supply the question, starting revision, and intended worktree. `existing: false` creates that worktree; `true` attaches one already there; omitting `worktree` allocates no storage. Flags of the same names override these fields. |
| [iteration-close.json](iteration-close.json) | `model iteration close ITERATION_ID --from FILE --expect REVISION` | Describe the actual outcome and include relevant commits when known. Closing does not integrate or remove worktrees. |
| [tool-admit.json](tool-admit.json) | `tool admit --from FILE` | Name the useful capability and its existing editable source. |
| [tool-update.json](tool-update.json) | `tool update TOOL_ID --from FILE --expect REVISION` | Supply only the intended JSON Merge Patch fields. |
| [tool-retire.json](tool-retire.json) | `tool retire TOOL_ID --from FILE --expect REVISION` | Explain why the Tool should leave normal discovery. The same optional document works for `model retire` and `data retire`. |
| [data-register.json](data-register.json) | `data register --from FILE` | Describe the intended content and replace the borrowed location. Registration does not copy or hash its payload. |
| [result-record.json](result-record.json) | `result record --from FILE` | Describe the actual activity and supplied execution information; populate known associations. |
| [result-amend.json](result-amend.json) | `result amend RESULT_ID --from FILE --expect REVISION` | Express the actual correction against the current descriptor revision. |
| [observation.md](observation.md) | `result observe RESULT_ID --text-file FILE` | Write the independent observation and useful context. |
| [memory-entry.md](memory-entry.md) | `memory append --from FILE` | Write complete understanding in ordinary prose and supply relevant relation flags. |

The uppercase command terms represent values to supply. Prepend global
`--project DIRECTORY` when outside the intended project and `--json` when consuming
a mutation receipt. `ACCRETE_PROJECT` provides the project-selection fallback.

## Association shapes

Result inputs accept these association shapes, populated with actual stable
IDs rather than aliases or paths:

| Field | Member shape |
| --- | --- |
| `models` | `{ "model_id": ID, "role": ROLE, "commit": COMMIT_OR_NULL, "dirty": BOOLEAN_OR_NULL }` |
| `tools` | `{ "tool_id": ID, "revision": REVISION_OR_NULL }` |
| `inputs`, `outputs` | `{ "data_id": ID, "role": ROLE }` |
| `related_results` | `{ "result_id": ID, "role": ROLE }` |
| `observations` | `{ "text": TEXT }`, with any further domain fields |

Roles are optional authored descriptions. Unknown execution revisions can be
omitted or null. A retrospective activity does not inherit the current checkout
HEAD. A Data origin can carry a known `result_id`, and `memory append` takes
repeatable `--model`, `--tool`, `--data`, `--result`, and `--supersedes` flags.
Objects referenced from another host can remain unresolved locally.

## Drafts and managed publications

The Kernel supplies the persistent envelope, publication path, stable identity,
revision handling, and projection update. A caller-supplied `id` on a create draft
is an optional retry aid, not an instruction to fabricate earlier objects: 1-180
ASCII letters, digits, dots, underscores or hyphens, and not `.` or `..`. Memory
input is a Markdown body with no Kernel-owned frontmatter. The Kernel adds its ID,
authored metadata, and associations on publication.

`tool-update.json` and `result-amend.json` use JSON Merge Patch. Objects merge
recursively, arrays replace entire arrays, and null removes a key. Identity,
kind, and format fields cannot be changed through these ordinary patches.
Read current content before constructing a patch that replaces an array. Keep
the expected revision corresponding to that read.

`.accrete/contracts/input-drafts.schema.json` documents caller payload shapes, and
`.accrete/contracts/example-inputs.json` maps these files to its definitions. They
are not required at runtime. They do not describe the persisted document envelope,
allocate identities, prove that a checkout exists, establish scientific completeness,
or grade the research. Unknown project extension fields remain allowed. The CLI
supplies mechanical validation and actual publication behavior.
