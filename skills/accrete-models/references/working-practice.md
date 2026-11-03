# Model work across sessions and machines

## Continue from the material already available

Start with the owner's current question, the Model's relevant source and history, and Memory that helps that question. Read the specific earlier Results that the reasoning depends on. A past Result remains about the code and conditions it names. Trust retained work within that scope; repeating it is a scientific or engineering decision tied to the present task.

Ordinary exploration needs no preliminary object write. A short source investigation can remain Scratch. Open an iteration when a named development effort, a separate branch, or a useful retained outcome would make continuation easier. Record Results for activities whose observations merit future use and Memory for the interpretation that should accompany them.

## Embedded programs and changing project commits

When source and research notes share a repository, describe implementation changes at the relevant scope. For example, a new Memory entry can advance the repository commit while the solver subtree is unchanged. Use native Git to inspect those paths and build inputs. The historical commit remains useful; scoped content identities add an explanation rather than replace it.

Avoid inferring that an experiment must be repeated simply because root `HEAD` advanced. Equally, a matching solver subtree does not establish that the executable, environment, input data, or diagnostic were unchanged. Describe these conditions at their proper scope and use the task's scientific reasoning to decide the next action.

## Concurrent development

Give overlapping source work independent worktrees of the actual Model repository. Each worker needs the Model checkout, ACCRETE project root, intended base, useful constraints, and where to return its changes. Share read-only datasets and existing Results where appropriate. Use distinct Scratch and compilation-cache locations when the project's tooling requires them.

A worker editing an external Model can call the Kernel with an explicit owning project root. That does not require installing `AGENTS.md` into every Model repository. Pass the relevant project guidance with the brief or through a documented host mechanism when the host session starts outside the project.

Let the Coordinator choose ordinary Git integration: merge, cherry-pick, rebase, keep separate, or abandon. An iteration-close write follows the actual outcome. It supplies no implicit merge and no permission to remove the worker's checkout. If the project retains an unmerged commit, include the available retention information in the handover.

## Capture what the activity used

For a launch under your control, observe the checkout and relevant environment when preparing the actual execution. A Python invocation can load an installed package from somewhere other than the apparent working directory; a build can use artifacts from another source tree. Domain launchers should describe the implementation and runtime they actually selected.

For an activity that already happened, use its launch record, known historical revision, and retained execution material. Today's `HEAD` is not evidence of the previous execution revision. If only the current checkout is available, keep that as a separately timed observation and leave the historical execution identity unknown.

Uncommitted work is normal. If a source capture is useful, decide its scope explicitly. `git diff HEAD` excludes untracked files; text-only diffs may omit the content of binary changes. Neither form captures external dependencies or ignored build products. The Kernel's bounded capture must report its included and omitted scope. A project Tool can prepare a broader source bundle or environment artifact and register it as Data when the task requires that.

## Carry history to another host

The project metadata can travel through the project's normal Git arrangement while the Model repository travels independently. Source hints and Model IDs remain portable; local bindings resolve each host's concrete paths. A received Result can be read before its Model is downloaded.

When another machine needs an unmerged or detached commit, inspect the relevant repository's retained refs and deliberately transport those refs using native Git. A typical named ref can be sent with an explicit refspec or included in a Git bundle. Use the actual ref named in the receipt, and follow the project's chosen remote and transport arrangement.

```text
git -C MODEL_CHECKOUT show-ref refs/accrete/retained/OBJECT_ID
git -C MODEL_CHECKOUT bundle create DESTINATION.bundle refs/accrete/retained/OBJECT_ID
```

These are native Git forms with values to supply. They do not promise that every referenced commit has an ACCRETE retention ref. A read-only or unavailable repository may prevent local retention; the Result remains a citation with that limitation.

## Return enough for continuation

Use a plain-language handover. State the question addressed, what changed or was learned, the concrete checkout and commit, meaningful outputs, any Results or Memory written, and what remains unresolved. Name the actual state of long-running computations using their native runtime evidence when relevant.

Keep code outcome, observation, interpretation, and next direction distinguishable. A trace failure can explain a Model defect without producing a simulated trajectory. An implementation improvement can be ready for another experiment without establishing its scientific consequence. Retain each contribution at the scope it supports so subsequent work can proceed naturally.
