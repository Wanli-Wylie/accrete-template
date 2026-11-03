# Result command manual

## Contents

- Interface and input drafts
- Record an activity
- Amend structured information
- Append an independent observation
- Interpret outcomes and retry

## Interface and input drafts

This manual defines the template v1 interface expected from `accrete-cli`.
The shared architecture establishes the command families; the template's
`.accrete/docs/cli-contract.md` defines their integration vocabulary. The
native executable is supplied separately. Consult its command `--help` for
accepted arguments and preserve drafts when a different release requires an
explicit compatibility adjustment. Do not write persistent Result JSON or
SQLite with a replacement script.

Global options are `--project PATH` and `--json`; `ACCRETE_PROJECT` selects
the project when no explicit path is supplied. Otherwise discovery starts
from the current directory. Select the ACCRETE root explicitly when using an
external Model checkout. Native scientific commands retain their ordinary
working directory and execution interface.

Draft structured inputs with an editor or domain Tool. The Kernel owns the
durable envelope, ID allocation, publication, revision comparison, and index
projection. Default Result paths are under `results/`; configuration and
mutation receipts identify the actual path.

## Record an activity

```sh
accrete --json result record --from scratch/result.json \
  > scratch/result-receipt.json
```

The following draft illustrates an analysis for which implementation revisions
were not retained. It deliberately leaves them unknown. Replace the example
object UUIDs and domain content with the actual associations before use.

```json
{
  "activity": "Compare selected first-year diagnostics",
  "models": [
    {
      "model_id": "a0d2c740-7636-4a6c-85b8-244db7e41c21",
      "role": "target",
      "commit": null,
      "dirty": null
    }
  ],
  "tools": [
    {
      "tool_id": "bc1d65ba-e284-4827-a9bc-37ad045c5d11",
      "revision": null
    }
  ],
  "inputs": [
    {
      "data_id": "57af1e04-2826-485e-9bc9-703c60284d11",
      "role": "diagnostics"
    }
  ],
  "outputs": [],
  "execution": {
    "reported_outcome": "completed",
    "description": "Retrospective description; execution revisions were unavailable."
  },
  "observations": {
    "description": "The analysis completed; detailed conclusions are in the linked project notes."
  },
  "related_results": []
}
```

Omit unused association arrays or unknown fields when the installed schema
allows. Supply known full Git revisions and observed dirty state instead of
nulls when execution information exists. Never fill a historical revision from
today's checkout just to remove a null.

| Draft field | Meaning |
| --- | --- |
| `activity` | A human description of the retained activity. |
| `models[]` | `{model_id, role?, commit: null|string, dirty: null|boolean}`. |
| `tools[]` | `{tool_id, revision: null|string}` for actual implementation knowledge. |
| `inputs[]`, `outputs[]` | `{data_id, role?}` associations. |
| `execution` | Domain-supplied execution description; distinguish execution time from later observation time. |
| `observations` | Structured measurements, prose, and useful domain context. |
| `related_results[]` | `{result_id, role?}` links to legs, attempts, comparisons, or continuations. |

A supplied stable `id` can support retries when creating the same Result.
The same ID with the same submitted content is idempotent; different content
requires an amendment or produces a conflict. Use the full contract's exact
envelope conventions. Keep unknown project extension fields when constructing
any replacement or merge input.

The receipt supplies `object_id`, `path`, and `revision`. Use those values for
subsequent associations; the filename is not the semantic identity.

## Amend structured information

```sh
accrete --json result amend "$RESULT_ID" \
  --from scratch/change.json --expect "$REVISION"
```

Template v1 specifies JSON Merge Patch for editable Result fields. Objects
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
receipt is usable only while the document still has that revision; native
digest computation follows the full contract's revision convention.

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
replacing the whole description. The Kernel serializes the append locally.
When a launcher needs retry protection, use the optional `--operation-id`
supported by the template contract. The same operation ID and payload append
once; reusing it with changed content is an error.

Use an amendment for structured corrections or associations. Use later linked
Memory for a changed scientific interpretation. An observation of a process at
a particular time does not establish its present state indefinitely.

## Interpret outcomes and retry

A successful publication returns `committed: true`. If `index_pending: true`,
the Result still exists and the operation is successful; run:

```sh
accrete index refresh
```

Do not call `result record` with a new ID to repair that projection. After an
uncertain acknowledgment, use a supplied stable ID or operation ID to reconcile
the same operation. If publication is visible but durability is uncertain,
retain its published path and receipt and use the supported recovery route.
Inspect before interpreting a nonzero exit as “nothing changed.”

Recovery repairs metadata or associated native side effects. It never launches
the scientific calculation again. A new execution is an explicit domain action
with its own meaning and normally a new Result identity.
