# Tool Kernel operations

This manual covers the Tool commands. `.accrete/docs/cli-contract.md` has the shared conventions and `accrete tool COMMAND --help` prints the flags.

Contents: [lifecycle](#operations), [source drafts](#prepare-source-and-input-drafts), [exposure](#expose-and-refresh), [retirement and export](#retire-or-export), [responses](#use-the-response).

## Operations

| Command | Durable effect | Work the Agent does with ordinary tools |
| --- | --- | --- |
| `tool admit` | Allocate a Tool ID and associate existing capability source | Develop the source and decide that it is useful to retain |
| `tool bind` | Set this host's source location for a known Tool | Obtain the source on this host |
| `tool update` | Amend descriptor metadata or select a source form or revision | Edit and commit implementation and knowledge |
| `tool expose` | Add a selected agent discovery interface | Choose whether automatic discovery helps |
| `tool refresh` | Reconcile existing managed discovery with the selected source and descriptor | Supply usable material and communicate consequential changes |
| `tool retire` | Mark current use retired and reconcile local managed exposures | Decide how the capability should evolve |
| `tool export` | Produce an explicit local export | Choose subsequent transport or publication |

All commands accept explicit project context through global `--project`; `ACCRETE_PROJECT` is the environment fallback. Use global `--json` when a caller needs structured mutation receipts. No operation requires a separate `tool create` stage or an admission evaluation.

## Prepare source and input drafts

Admit source that already exists, with flags or a draft written with an ordinary editor in Scratch:

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

The example path is relative to the owning project. Replace it with the real source location; do not create a fake program merely to satisfy the draft. Source may be executable or cognitive. The Kernel allocates the Tool's document envelope, and an ID unless you supply `--id`.

```text
accrete --project PROJECT_ROOT tool admit --from INPUT_FILE
accrete --project PROJECT_ROOT tool admit --name NAME --description TEXT --source SOURCE_DIRECTORY
accrete --project PROJECT_ROOT tool bind TOOL_ID --source SOURCE_DIRECTORY
accrete --project PROJECT_ROOT tool update TOOL_ID --from PATCH_FILE --expect REVISION
```

A source outside the project becomes a host-local binding rather than a portable path. On another host, obtain the source natively and run `tool bind`; an absent source is a binding to repair, not a reason to retire the Tool.

`tool update` accepts a JSON Merge Patch of the editable descriptor fields. Supply the current descriptor revision as `--expect`. Preserve unfamiliar fields by changing only the intended fields. An update can amend description or choose a new source; it does not edit, commit, or switch the actual source repository.

For a retained source, use `source.mode: "retained"`, a source commit in `source.revision`, and `source.path` naming usable material at that revision, or `--source-mode retained --revision COMMIT`. Prepare the corresponding checkout or export before attempting exposure; exposure requires a clean checkout at that commit, and `tool bind` can point this host at one. A live source can also carry a revision observation; that historical observation does not freeze subsequent edits.

## Expose and refresh

```text
accrete --project PROJECT_ROOT tool expose TOOL_ID --agent codex
accrete --project PROJECT_ROOT tool expose TOOL_ID --agent claude
accrete --project PROJECT_ROOT tool refresh TOOL_ID
accrete --project PROJECT_ROOT tool refresh TOOL_ID --agent codex
```

`--agent` chooses the discovery interface. The global `--host` is a different thing: it labels the machine. Exposure defaults to a portable wrapper. Use `--name NAME` when a distinct discovery name is needed (lowercase letters, digits and single hyphens, up to 64 characters) and `--mode symlink` only when deliberately selecting a direct link, which needs Unix and a source `SKILL.md` whose frontmatter `name` matches the exposure and whose `description` is nonempty. `--mode wrapper` requests the default explicitly. The exposure mechanism is independent of `source.mode`.

The Codex discovery destination is under `.agents/skills/`; Claude's is under `.claude/skills/`. `--destination DIRECTORY` selects another location, and the operation receipt names the exact path. `tool expose` excludes a generated exposure from Git through the repository-local `.git/info/exclude`, because a wrapper can hold this host's absolute source path. A generated wrapper is a valid Skill with a useful name, description, and a pointer to the complete source instructions. It says that references and executable paths resolve from the source directory.

Edit the source rather than a generated wrapper. After changing discovery-relevant content or a local source binding, refresh the affected managed interfaces. If there is no source Skill or equivalent usable guidance, continue using the Tool directly or develop that guidance before asking for discovery. An executable can remain a valid Tool without an exposure.

If the destination is occupied by unrelated or edited content, it is preserved and reported as a conflict. Choose another `--name` or `--destination`, or clear the destination yourself if the owner wants it replaced. Source absence or unavailable retained material leaves that exposure pending. Read the receipt to distinguish a retained Tool from an installed agent interface.

## Retire or export

```text
accrete --project PROJECT_ROOT tool retire TOOL_ID --expect REVISION [--from INPUT_FILE]
accrete --project PROJECT_ROOT tool export TOOL_ID --to DESTINATION
```

`--from` is optional. A document such as `{"reason":"Superseded by the project's current transport diagnostic."}` stores its `reason` on the descriptor. Submit the latest descriptor revision.

Retirement preserves the source and earlier associations. It removes managed discovery on the invoking host; other hosts run `tool refresh` after receiving the shared change. A running activity can finish using its already selected implementation. Do not remove source files or process state merely because the descriptor is retired.

Export writes a new local directory containing `tool.json` and `source/`. It omits Git internals and refuses symlinks whose transfer meaning needs an explicit choice, and an existing destination is a conflict. It does not publish a registry package or push a repository. Use the user's chosen native publishing method for any later distribution.

## Use the response

Read `object_id`, `path`, `revision`, and `committed` from the shared mutation receipt, plus each reported exposure or export effect. `index_pending` signals a delayed local projection, not loss of the primary descriptor. Admission and exposure have separate completion points: a Tool can exist while one agent interface remains pending.

For revision conflicts, read the latest descriptor and integrate the requested change before retrying. For lost acknowledgments on creation, supply a stable `--id` before the first attempt and repeat with the same ID; do not admit duplicate identities by guessing whether the previous write completed. If durability is reported uncertain, run `accrete recover`.

Read Tool source and descriptors with native file tools and Git. Use the actual implementation's executable directly. If a domain script also retains a Result or Data object, it calls the CLI and consumes receipts. Foundational Skill references never replace these operations with their own persistence scripts.
