# Result command manual

## Contents

- Interface and input drafts
- Record an activity
- Amend structured information
- Append an independent observation
- Capture selected source
- Interpret outcomes and retry

## Interface and input drafts

This manual covers the Result commands. `.accrete/docs/cli-contract.md` has the
shared conventions and `accrete result COMMAND --help` prints the flags. Do not
write persistent Result JSON or SQLite with a replacement script.

Global options are `--project DIRECTORY` and `--json`; `ACCRETE_PROJECT` selects
the project when no explicit path is supplied. Otherwise discovery starts
from the current directory. Select the ACCRETE root explicitly when using an
external Model checkout. Native scientific commands retain their ordinary
working directory and execution interface.

Draft structured inputs with an editor or domain Tool. The Kernel owns the
durable envelope, default UUID allocation, publication, revision comparison, and index
projection. Default Result paths are under `results/`; configuration and
mutation receipts identify the actual path.

## Record an activity

```sh
accrete --json result record --from scratch/result.json \
  > scratch/result-receipt.json
```

The following draft illustrates an analysis for which implementation revisions
were not retained. It deliberately leaves them unknown. Replace the example
object IDs and domain content with the actual associations before use.

```json
{
  "name": "first-year-comparison",
  "activity": "Compare selected first-year diagnostics",
  "models": [
    {
      "model_id": "model-main",
      "role": "target",
      "commit": null,
      "dirty": null
    }
  ],
  "tools": [
    {
      "tool_id": "tool-residual",
      "revision": null
    }
  ],
  "inputs": [
    {
      "data_id": "year-1-diagnostics",
      "role": "diagnostics"
    }
  ],
  "outputs": [],
  "execution": {
    "reported_outcome": "completed",
    "description": "Retrospective description; execution revisions were unavailable."
  },
  "observations": [
    {
      "text": "The analysis completed; detailed conclusions are in the linked project notes."
    }
  ],
  "related_results": []
}
```

Omit unused association arrays or unknown fields. Supply known Git revisions and observed dirty state instead of
nulls when execution information exists. Never fill a historical revision from
today's checkout just to remove a null.

| Draft field | Meaning |
| --- | --- |
| `name` | Optional short label. The index `name` column falls back to `activity`. |
| `activity` | Optional human description of the retained activity. |
| `models[]` | `{model_id, role?, commit: null|string, dirty: null|boolean}`. |
| `tools[]` | `{tool_id, revision: null|string}` for actual implementation knowledge. |
| `inputs[]`, `outputs[]` | `{data_id, role?}` associations. |
| `execution` | Domain-supplied execution description; distinguish execution time from later observation time. |
| `observations[]` | Array of free-form objects, conventionally with `text`: measurements, prose, and useful domain context. |
| `related_results[]` | `{result_id, role?}` links to legs, attempts, comparisons, or continuations. |

A supplied stable `id` or `--id` can support retries when creating the same Result.
The same ID with the same submitted content is idempotent; different content
requires an amendment or produces a conflict. IDs are 1-180 ASCII letters, digits,
dots, underscores or hyphens, and not `.` or `..`. Keep unknown project extension
fields when constructing any replacement or merge input.

`--name` and `--description` override the draft's fields. `--observe-checkout PATH`
adds the checkout's current state as a separately labelled `recording_observation`;
it does not fill any execution revision.

The receipt supplies `object_id`, `path`, and `revision`. Use those values for
subsequent associations; the filename is not the semantic identity. For a `models[]`
member with a `commit` and a local checkout, the receipt also names the ref that
keeps that commit, or a warning saying why it could not.

## Amend structured information

```sh
accrete --json result amend "$RESULT_ID" \
  --from scratch/change.json --expect "$REVISION"
```

The patch is a JSON Merge Patch of editable Result fields. Objects
merge recursively; arrays are replaced as complete arrays; `null` removes a
key in a patch. Identity, kind, and format fields are not editable through an
ordinary amendment. Do not use a null patch value to mean unknown without
considering its removal semantics.

For example, a draft adding completion description can contain:

```json
{
  "execution": {
    "reported_outcome": "completed",
    "description": "The final closed output was retained and associated."
  }
}
```

When changing an association array, read the current Result and include all
members that should remain. Do not replace the array with only the new member.
Use the expected revision corresponding to that read. A successful earlier
receipt is usable only while the document still has that revision. A revision is
the SHA-256 of the document's exact bytes, so any SHA-256 tool can compute it.

A revision conflict leaves current content and your draft intact. Read the
current document, incorporate independent contributions, and submit the intended
patch with its current revision. Do not weaken the expected-revision condition
to force a stale draft through.

## Append an independent observation

```sh
accrete --json result observe "$RESULT_ID" \
  --text-file scratch/observation.md
```

Use this for a new independent observation whose meaning does not require
replacing the whole description. The Kernel appends a member to the `observations`
array, serialized locally. When a launcher needs retry protection, supply
`--operation-id ID`. The same operation ID and text append once; reusing it with
changed text is a conflict.

Use an amendment for structured corrections or associations. Use later linked
Memory for a changed scientific interpretation. An observation of a process at
a particular time does not establish its present state indefinitely.

## Capture selected source

```sh
accrete --json result capture --checkout ../numerical-model \
  --path src --path pyproject.toml --to scratch/source-capture
```

Use this when dirty working source should survive beyond the checkout. It writes a
binary Git diff against `HEAD` and the selected nonignored untracked regular files to
a new directory, with a manifest stating the captured scope. Repeat `--path`.
Ignored products, external dependencies and runtime state stay outside it, so it is
not a complete executable environment. Capture publishes no object; register the
directory as Data if it should be retained, and link it from the Result.

## Interpret outcomes and retry

A successful publication returns `committed: true`. If `index_pending: true`,
the Result still exists and the operation is successful; run:

```sh
accrete index refresh
```

Do not call `result record` with a new ID to repair that projection. After an
uncertain acknowledgment, use a supplied stable ID or operation ID to reconcile
the same operation. If publication is visible but durability is uncertain (exit 8),
keep the published path and run `accrete recover`. Inspect before interpreting a
nonzero exit as “nothing changed.”

Recovery repairs metadata or associated native side effects. It never launches
the scientific calculation again. A new execution is an explicit domain action
with its own meaning and normally a new Result identity.
