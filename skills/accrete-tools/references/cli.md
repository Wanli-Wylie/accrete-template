# Tool Kernel operations

This manual describes the template v1 CLI expectation. The architecture fixes the operations; `.accrete/docs/cli-contract.md` defines the remaining option and payload choices for integration. The paired native binary supplies runtime behavior. Read its `--help` when an option differs, and retain the input draft if the required support is unavailable.

Contents: [lifecycle](#operations), [source drafts](#prepare-source-and-input-drafts), [exposure](#expose-and-refresh), [retirement and export](#retire-or-export), [responses](#use-the-response).

## Operations

| Command | Durable effect | Work the Agent does with ordinary tools |
| --- | --- | --- |
| `tool admit` | Allocate a Tool ID and associate existing capability source | Develop the source and decide that it is useful to retain |
| `tool update` | Amend descriptor metadata or select a source form or revision | Edit and commit implementation and knowledge |
| `tool expose` | Add a selected host discovery interface | Choose whether automatic discovery helps |
| `tool refresh` | Reconcile existing managed discovery with the selected source and descriptor | Supply usable material and communicate consequential changes |
| `tool retire` | Mark current use retired and reconcile local managed exposures | Decide how the capability should evolve |
| `tool export` | Produce an explicit local export | Choose subsequent transport or publication |

All commands accept explicit project context through global `--project`; `ACCRETE_PROJECT` is the environment fallback. Use global `--json` when a caller needs structured mutation receipts. No operation requires a separate `tool create` stage or an admission evaluation.

## Prepare source and input drafts

Admit source that already exists. A source draft can be written with an ordinary editor in Scratch:

```json
{
  "name": "transport-diagnostics",
  "description": "Compute and interpret transport diagnostics for the project's atmospheric model.",
  "source": {
    "path": "tools/transport-diagnostics",
    "mode": "live"
  }
}
```

The example path is relative to the owning project. Replace it with the real source location; do not create a fake program merely to satisfy the draft. Source may be executable or cognitive. The Kernel allocates the Tool's document ID and envelope.

```text
accrete --project PROJECT_ROOT tool admit --from INPUT_FILE
accrete --project PROJECT_ROOT tool update TOOL_ID --from PATCH_FILE --expect REVISION
```

`tool update` accepts a JSON Merge Patch of the editable descriptor fields. Supply the current descriptor revision as `--expect`. Preserve unfamiliar fields by changing only the intended fields. An update can amend description or choose a new source; it does not edit, commit, or switch the actual source repository.

For a retained source, use `source.mode: "retained"`, a full source commit in `source.revision`, and `source.path` naming usable material at that revision. Prepare the corresponding checkout or export before attempting exposure. A live source can also carry a revision observation; that historical observation does not freeze subsequent edits.

## Expose and refresh

```text
accrete --project PROJECT_ROOT tool expose TOOL_ID --host codex
accrete --project PROJECT_ROOT tool expose TOOL_ID --host claude
accrete --project PROJECT_ROOT tool refresh TOOL_ID
accrete --project PROJECT_ROOT tool refresh TOOL_ID --host codex
```

Exposure defaults to a portable wrapper. Use `--name NAME` when a distinct discovery name is needed and `--mode symlink` only when deliberately selecting a supported direct-link arrangement. `--mode wrapper` requests the default explicitly. The exposure mechanism is independent of `source.mode`.

The Codex discovery destination is under `.agents/skills/`; Claude's is under `.claude/skills/`. Exact paths come from the operation receipt and the host adapter. A generated wrapper must be a valid Skill with a useful name, description, and a pointer to the complete source instructions. It must say that references and executable paths resolve from the source directory.

Edit the source rather than a generated wrapper. After changing discovery-relevant content or a local source binding, refresh the affected managed interfaces. If there is no source Skill or equivalent usable guidance, continue using the Tool directly or develop that guidance before asking for discovery. An executable can remain a valid Tool without an exposure.

If the destination is occupied by unrelated content, choose another name or make an explicit replacement decision through the command's supported interface. Source absence, unavailable retained material, or an unsupported link mechanism leaves that exposure pending. Read the receipt to distinguish a retained Tool from an installed host interface.

## Retire or export

Prepare a retirement draft such as `{"reason":"Superseded by the project’s current transport diagnostic."}` and submit it with the latest descriptor revision:

```text
accrete --project PROJECT_ROOT tool retire TOOL_ID --from INPUT_FILE --expect REVISION
accrete --project PROJECT_ROOT tool export TOOL_ID --to DESTINATION
```

Retirement preserves the source and earlier associations. It removes or disables only managed discovery on the invoking host; other hosts refresh after receiving the shared change. A running activity can finish using its already selected implementation. Do not remove source files or process state merely because the descriptor is retired.

Export writes selected material to the explicit local destination and reports what it produced, including retained origin information. It does not publish a registry package or push a repository. Resolve conflicting destination content through the command's explicit response; preserve unrelated files. Use the user's chosen native publishing method for any later distribution.

## Use the response

Read `object_id`, `path`, `revision`, and `committed` from the shared mutation receipt, plus each reported exposure or export effect. `index_pending` signals a delayed local projection, not loss of the primary descriptor. Admission and exposure have separate completion points: a Tool can exist while one host interface remains pending.

For revision conflicts, read the latest descriptor and integrate the requested change before retrying. For lost acknowledgments on creation, use the supported stable caller ID retry contract; do not admit duplicate identities by guessing whether the previous write completed. For external or filesystem operations, preserve the exact paths named in recovery information.

Read Tool source and descriptors with native file tools and Git. Use the actual implementation's executable directly. If a domain script also retains a Result or Data object, it calls the documented CLI and consumes receipts. Foundational Skill references never replace these operations with their own persistence scripts.
