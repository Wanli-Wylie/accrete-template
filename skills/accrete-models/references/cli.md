# Model Kernel operations

This manual covers the Model commands. `.accrete/docs/cli-contract.md` has the shared conventions and `accrete model COMMAND --help` prints the flags. Keep structured inputs in ordinary files under the configured Scratch root.

Contents: [operations](#operations-and-supplied-information), [inputs](#prepare-a-change), [receipts](#use-the-mutation-response), [native work](#native-reading-and-development).

## Operations and supplied information

| Operation | Purpose | Information to prepare | Completion |
| --- | --- | --- | --- |
| `model register` | Establish the project's Model identity | Name, purpose, existing checkout or repository locator, optional source scope | Model ID, descriptor path and revision; local binding details |
| `model bind` | Locate an existing Model on this host | Model ID and concrete checkout path | Updated host-local binding; existing identity preserved |
| `model update` | Amend the descriptor | Merge patch and current revision | Updated descriptor and revision |
| `model retire` | End current use | Current revision, optional reason | Status changed; identity and earlier associations preserved |
| `model iteration open` | Retain a line of development | Model ID, purpose, starting revision, and the worktree to create or attach, if any | Iteration ID and descriptor; actual branch/worktree if created or attached |
| `model iteration close` | Retain the development outcome | Iteration ID, expected descriptor revision, outcome, relevant commits and explanation | Updated descriptor and revision; retained refs for each commit |
| `model iteration remove-worktree` | Remove the iteration's worktree | Iteration ID | The worktree is gone; the iteration descriptor is unchanged |

Registration describes an existing repository. Use ordinary Git for cloning, fetching, and inspecting it. Keep machine-specific checkout paths in local bindings. The portable description may carry a repository locator, but it must remain meaningful when a host has no checkout.

An iteration can attach an existing worktree. If the command creates Git resources, its receipt distinguishes resource creation from descriptor publication. A surviving worktree is useful material even when the metadata write needs recovery.

## Prepare a change

Resolve the intended project, Model, and repository before drafting the input. Read a current descriptor with ordinary tools when its metadata or revision is needed. Use returned IDs rather than relying on names remaining unique after later renames or imports.

```text
accrete --project PROJECT_ROOT model register --checkout CHECKOUT_PATH --name NAME [--source-scope PATH]
accrete --project PROJECT_ROOT model register --from INPUT_FILE
accrete --project PROJECT_ROOT model bind MODEL_ID --checkout CHECKOUT_PATH
accrete --project PROJECT_ROOT model update MODEL_ID --from PATCH_FILE --expect REVISION
accrete --project PROJECT_ROOT model retire MODEL_ID --expect REVISION [--from INPUT_FILE]
accrete --project PROJECT_ROOT model iteration open MODEL_ID --name NAME --purpose TEXT
accrete --project PROJECT_ROOT model iteration open MODEL_ID --from INPUT_FILE
accrete --project PROJECT_ROOT model iteration close ITERATION_ID --expect REVISION --from INPUT_FILE
accrete --project PROJECT_ROOT model iteration close ITERATION_ID --expect REVISION --outcome TEXT --commit COMMIT
accrete --project PROJECT_ROOT model iteration remove-worktree ITERATION_ID
```

The capitalized terms are values to supply, not literal paths or IDs. `--project` selects the owning project; `ACCRETE_PROJECT` supplies the same context when no explicit selector is passed. Add global `--json` for machine-readable receipts. The Kernel allocates each managed document's envelope, and an ID unless you supply `--id`; the input files below are drafts for the operation.

A registration draft can describe an existing checkout and optional scope:

```json
{
  "name": "atmosphere",
  "description": "Atmospheric model developed in this project.",
  "repository": {
    "checkout": "/work/climate/atmosphere"
  },
  "source_scope": ["src", "CMakeLists.txt"]
}
```

Replace the example checkout and scope with real values. Omit `source_scope` when it has no useful defined meaning. `repository.checkout` means the same as `--checkout`, and `--checkout` wins if both are given: the Kernel stores it as a host-local binding and leaves it out of the portable descriptor, so the path is not the Model identity. To register without a local checkout, supply `repository.locator` instead and bind later. The Kernel never clones or fetches. Optional `aliases` provides additional project names. `--source-scope` can be repeated.

An iteration-open draft uses the same names as the flags, and flags override: `name`, `purpose`, `branch`, `worktree`, `start`, `existing`, `id`. The Model needs a checkout binding on this host.

```json
{
  "name": "transport-order",
  "purpose": "Investigate the effect of evaluation order in transport.",
  "branch": "transport-order",
  "worktree": "/work/climate/iterations/transport-order",
  "start": "HEAD"
}
```

`worktree` creates that worktree from `start` (default `HEAD`). `branch` names a new branch; without it Git creates a detached worktree. `existing: true` attaches a worktree already there, which must belong to the same repository and supplies its own `HEAD`. Without `worktree`, no storage is allocated and the iteration only records the effort.

A close draft has `outcome`, `summary`, and `commits` containing the relevant commit IDs:

```json
{
  "outcome": "integrated",
  "summary": "Merged after the comparison showed the expected reduction in drift.",
  "commits": ["REPLACE_WITH_COMMIT"]
}
```

`outcome` is a free authored string: `integrated`, `retained_separately`, and `abandoned` are illustrative values, not a fixed enumeration. It is required from the file or `--outcome`, and `--commit` can be repeated. Each commit is kept under a local retained ref. Submit the current descriptor `revision` with `--expect`; this token is not a commit ID.

For registration, explain what program the Model denotes and which repository already carries it. If it uses a source scope, say what that scope includes. For a host binding, use the actual checkout path. For an iteration, identify the intended start before allocating work; do not silently treat whichever branch happens to be checked out as the requested start.

For closing, describe what happened and include the relevant end or integration commits when known. Merge or otherwise integrate with Git before reporting that outcome. If the work is retained separately, name its usable branch or commit. If abandoned, preserve the reason when it will help subsequent work.

`remove-worktree` is separate from closing, so a closed iteration can keep its worktree. It removes the path bound to this iteration on this host through Git and keeps Git's refusal to remove changed work; `--force` explicitly asks for Git's destructive removal. Branches stay; delete those with Git.

`model update` takes a JSON Merge Patch. `model retire` takes an optional JSON document whose `reason` is stored on the descriptor. Retirement leaves the repository, checkouts and earlier Results alone.

## Use the mutation response

The shared receipt contract includes `object_id`, `path`, `revision`, `committed`, and `index_pending`, with additional effects where a command changes Git resources or host bindings. Use the returned concrete paths for subsequent native work. The descriptor revision is an optimistic replacement token, distinct from a Git commit.

- A committed descriptor with `index_pending: true` is retained. Continue from its ID; refresh the disposable index when queries need it.
- A revision conflict means another change intervened. Read the latest descriptor and integrate the intended edit before resubmitting with its revision.
- A created worktree with incomplete descriptor publication calls for `accrete recover`, which attaches the surviving worktree without repeating development. Preserve the worktree and any edits; do not rerun creation against a different destination.
- A missing checkout is a binding problem. It does not erase the Model or make a remotely supplied reference meaningless. Repair it with `model bind`.
- A missing Git executable prevents the Git-dependent operation and exits 5. Restore that dependency or retain the draft for later; a Skill must not implement a replacement lifecycle script.

Read JSON output when automation needs stable fields and keep diagnostics separate from stdout. For retries of creates, supply a stable `--id` or `id` before the first attempt. A retry of object publication does not mean repeating the underlying scientific activity.

## Native reading and development

Use concrete paths supplied by the task, configuration, or receipts:

```sh
git -C "$model_checkout" status --short
git -C "$model_checkout" rev-parse HEAD
git -C "$model_checkout" log -5 --oneline
git -C "$model_checkout" diff
git -C "$model_checkout" worktree list
```

`$model_checkout` is a shell variable set to the actual checkout. Quote it because a valid path may contain spaces. Use `git show`, `git diff`, and native file readers for implementation questions. Query the index with `sqlite3 -readonly` when an object join is useful, at the path in `.local_state.index` from `accrete config resolve --json`. A brief "database is locked" during a concurrent refresh means retry. The index describes retained documents and does not describe a current process or live checkout.

Read a descriptor rather than changing it with `jq` or an editor. Model code, project configuration, instructions, and drafts remain ordinary editable files. Use the Kernel when the intended effect changes Model or iteration organization.
