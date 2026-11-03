# Input drafts

These files are reusable caller-input drafts for the template v1 CLI interface.
They are reference assets installed with the project guidance. **They are not
existing ACCRETE objects, initial store contents, or instructions to execute a
research workflow.** The initializer copies them as examples; it does not
submit them to the Kernel.

Copy a useful draft into the configured Scratch directory, adapt it to the
actual work, and submit it only when the corresponding organizational action
is intended. Replace example descriptions and every `REPLACE_WITH_...` value.
Use IDs returned by earlier Kernel writes and actual Git revisions. Empty
association arrays mean no associations have been supplied; populate them only
with objects relevant to the activity. Omit fields that are unknown when the
interface allows omission.

The installed [CLI contract](../docs/cli-contract.md) describes the expected
interface, and [command inventory](../docs/cli-commands.md) lists the operations.
The native executable supplies the actual behavior. Read the matching Skill
reference for the object's meaning and the invoked command's `--help` for its
accepted options.

## Available drafts

| Draft | Submit with | Adapt before submission |
| --- | --- | --- |
| [model-register.json](model-register.json) | `model register --from FILE` | Choose the program name and existing checkout. Optional source scope should describe the program meaningfully. |
| [iteration-open.json](iteration-open.json) | `model iteration open MODEL_ID --from FILE` | Supply the question, actual base commit, and intended checkout. Default `create_worktree: false` attaches existing material. |
| [iteration-close.json](iteration-close.json) | `model iteration close ITERATION_ID --from FILE --expect REVISION` | Describe the actual outcome and include relevant commits when known. Closing does not integrate or remove worktrees. |
| [tool-admit.json](tool-admit.json) | `tool admit --from FILE` | Name the useful capability and its existing editable source. |
| [tool-update.json](tool-update.json) | `tool update TOOL_ID --from FILE --expect REVISION` | Supply only the intended JSON Merge Patch fields. |
| [tool-retire.json](tool-retire.json) | `tool retire TOOL_ID --from FILE --expect REVISION` | Explain why the Tool should leave normal discovery. |
| [data-register.json](data-register.json) | `data register --from FILE` | Describe the intended content edition and replace the borrowed location. Registration does not copy or hash its payload. |
| [result-record.json](result-record.json) | `result record --from FILE` | Describe the actual activity and supplied execution information; populate known associations. |
| [result-amend.json](result-amend.json) | `result amend RESULT_ID --from FILE --expect REVISION` | Express the actual correction against the current descriptor revision. |
| [observation.md](observation.md) | `result observe RESULT_ID --text-file FILE` | Write the independent observation and useful context. |
| [memory-entry.md](memory-entry.md) | `memory append --from FILE` | Write complete understanding in ordinary prose and supply relevant object relation flags. |

The uppercase command terms represent values to supply. Prepend global
`--project PATH` when outside the intended project and `--json` when consuming
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

Roles are optional authored descriptions. Unknown execution revisions can be
omitted or null. A retrospective activity does not inherit the current checkout
HEAD. A Data origin can carry a known `result_id`, and a Memory append can use
repeatable `--model`, `--tool`, `--data`, `--result`, and `--memory` flags.
Objects referenced from another host can remain unresolved locally.

## Drafts and managed publications

The Kernel supplies the persistent envelope, publication path, stable identity,
revision handling, and projection update. Caller-supplied `id` fields on create
drafts are optional retry aids, not instructions to fabricate earlier objects.
Memory input is a Markdown body with no Kernel-owned frontmatter. The Kernel
adds its ID, authored metadata, and associations on publication.

`tool-update.json` and `result-amend.json` use JSON Merge Patch. Objects merge
recursively, arrays replace entire arrays, and null removes a key. Identity,
kind, and format fields cannot be changed through these ordinary patches.
Read current content before constructing a patch that replaces an array. Keep
the expected revision corresponding to that read.

The repository's `contract/input-drafts.schema.json` documents caller payload
shapes, with a file-to-definition map in `contract/example-inputs.json`. It is
maintainer integration metadata and is not required at runtime. It does not
describe the persisted document envelope, allocate identities, prove that a
checkout exists, establish scientific completeness, or grade the research.
Unknown project extension fields remain allowed. The native CLI supplies
mechanical validation and actual publication behavior.
