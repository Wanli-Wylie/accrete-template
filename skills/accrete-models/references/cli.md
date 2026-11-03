# Model Kernel operations

This manual describes the template v1 CLI expectation. The architecture fixes the command families and effects; the installed `.accrete/docs/cli-contract.md` defines the remaining field and option choices for integration. The paired binary owns runtime behavior. Until integration is complete, use its `--help` when an option differs and retain the draft rather than creating a descriptor manually. Keep structured inputs in ordinary files under the configured Scratch root.

Contents: [operations](#operations-and-supplied-information), [inputs](#prepare-a-change), [receipts](#use-the-mutation-response), [native work](#native-reading-and-development).

## Operations and supplied information

| Operation | Purpose | Information to prepare | Expected completion |
| --- | --- | --- | --- |
| `model register` | Establish the project's Model identity | Name, purpose, existing repository or checkout, optional repository hints and source scope | Model ID, descriptor path and revision; local binding details |
| `model bind` | Locate an existing Model on this host | Model ID and concrete checkout path | Updated host-local binding; existing identity preserved |
| `model iteration open` | Retain a line of development | Model ID, purpose, base revision, and either requested or existing Git resources | Iteration ID and descriptor; actual branch/worktree if created or attached |
| `model iteration close` | Retain the development outcome | Iteration ID, expected descriptor revision, outcome, relevant commits and explanation | Updated descriptor and revision; retained-commit information where applicable |

Registration describes an existing repository. Use ordinary Git for cloning, fetching, and inspecting it. Keep machine-specific checkout paths in local bindings. The portable description may carry repository hints, but it must remain meaningful when a host has no checkout.

An iteration can attach an existing branch or worktree. If the command creates Git resources, its receipt must distinguish resource creation from descriptor publication. A surviving worktree is useful material even when the metadata write needs recovery.

## Prepare a change

Resolve the intended project, Model, and repository before drafting the input. Read a current descriptor with ordinary tools when its metadata or revision is needed. Use returned IDs rather than relying on names remaining unique after later renames or imports.

```sh
accrete --version
accrete model register --help
accrete model iteration open --help
```

Use the contract's structured-file form for relationships and longer prose. The expected forms are:

```text
accrete --project PROJECT_ROOT model register --from INPUT_FILE
accrete --project PROJECT_ROOT model bind MODEL_ID --checkout CHECKOUT_PATH
accrete --project PROJECT_ROOT model iteration open MODEL_ID --from INPUT_FILE
accrete --project PROJECT_ROOT model iteration close ITERATION_ID --from INPUT_FILE --expect REVISION
```

The capitalized terms are values to supply, not literal paths or IDs. `--project` selects the owning project; `ACCRETE_PROJECT` supplies the same context when no explicit selector is passed. Add global `--json` for machine-readable receipts. The Kernel allocates each managed document's ID and envelope; the input files below are drafts for the operation.

A registration draft can describe an existing checkout and optional scope:

```json
{
  "name": "atmosphere",
  "description": "Atmospheric model developed in this project.",
  "repository": {
    "checkout": "/work/climate/atmosphere",
    "scope": ["src", "CMakeLists.txt"]
  }
}
```

Replace the example checkout and scope with real values. Omit `scope` when it has no useful defined meaning. The Kernel stores the checkout as a host-local binding; the path is not the Model identity. Optional `aliases` provides additional project names.

An iteration-open draft supplies `name`, `purpose`, `base_commit`, and `checkout`, with optional `branch` and `create_worktree`. Set `create_worktree` to `true` only when that checkout should be created; omitted or `false` attaches existing Git resources. Use a full commit ID resolved from the intended base.

```json
{
  "name": "transport-order",
  "purpose": "Investigate the effect of evaluation order in transport.",
  "base_commit": "REPLACE_WITH_FULL_BASE_COMMIT",
  "checkout": "/work/climate/iterations/transport-order",
  "branch": "transport-order",
  "create_worktree": true
}
```

Replace the commit marker before submitting. A close draft has `outcome`, `summary`, and `commits` containing the full relevant commit IDs. `outcome` is a free authored string: `integrated`, `retained_separately`, and `abandoned` are illustrative values, not a fixed enumeration. Submit its current descriptor `revision` with `--expect`; this token is not a commit ID.

For registration, explain what program the Model denotes and which repository already carries it. If it uses a source scope, say what that scope includes. For a host binding, use the actual checkout path. For an iteration, identify the intended base before allocating work; do not silently treat whichever branch happens to be checked out as the requested base.

For closing, describe what happened and include the relevant end or integration commits when known. Merge or otherwise integrate with Git before reporting that outcome. If the work is retained separately, name its usable branch or commit. If abandoned, preserve the reason when it will help subsequent work.

## Use the mutation response

The shared receipt contract includes `object_id`, `path`, `revision`, `committed`, and `index_pending`, with additional effects where a command changes Git resources or host bindings. Use the returned concrete paths for subsequent native work. The descriptor revision is an optimistic replacement token, distinct from a Git commit.

- A committed descriptor with `index_pending: true` is retained. Continue from its ID; refresh the disposable index when queries need it.
- A revision conflict means another change intervened. Read the latest descriptor and integrate the intended edit before resubmitting with its revision.
- A created worktree with incomplete descriptor publication calls for the CLI's documented recovery route. Preserve the worktree and any edits; do not rerun creation against a different destination.
- A missing checkout is a binding problem. It does not erase the Model or make a remotely supplied reference meaningless.
- A missing native Git executable prevents the Git-dependent operation. Restore that dependency or retain the draft for later; a Skill must not implement a replacement lifecycle script.

Read JSON output when automation needs stable fields and keep diagnostics separate from stdout. For retries of creates, use a caller-supplied stable ID only through the shared contract's supported payload. A retry of object publication does not mean repeating the underlying scientific activity.

## Native reading and development

Use concrete paths supplied by the task, configuration, or receipts:

```sh
git -C "$model_checkout" status --short
git -C "$model_checkout" rev-parse HEAD
git -C "$model_checkout" log -5 --oneline
git -C "$model_checkout" diff
git -C "$model_checkout" worktree list
```

`$model_checkout` is a shell variable set to the actual checkout. Quote it because a valid path may contain spaces. Use `git show`, `git diff`, and native file readers for implementation questions. Query conventional SQLite directly when an object join is useful; the index describes retained documents and does not describe a current process or live checkout.

Read a descriptor rather than changing it with `jq` or an editor. Model code, project configuration, instructions, and drafts remain ordinary editable files. Use the Kernel when the intended effect changes Model or iteration organization.
