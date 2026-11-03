# Developing useful project capabilities

## Retain the part that helps future work

A capability often begins during a concrete task: a diagnostic script, a useful interpretation method, a data conversion, or knowledge of a remote environment. Keep exploration flexible. Admit the source when its purpose, implementation, and usage knowledge are valuable to preserve under a project identity.

Choose source organization for the work. A small script and its instructions can share a directory in the project. An independently developed numerical utility can remain in its own repository. A cognitive Tool can consist entirely of Markdown. The Kernel needs enough source association to retain and expose the capability; it does not choose the implementation language or development method.

Use Scratch for incomplete work. Once admitted, the source remains ordinarily editable. A local improvement need not generate a new Tool ID, a new host exposure, and a new Result automatically. Retain the organizational changes that the project's continuation actually needs.

## Write instructions an Agent can use

Explain the capability's object and purpose in concrete terms. State which Model, Data, file format, or interpretation problem it applies to. Describe the useful action and the meaning of its outputs. Include the environment and source-relative paths that another worker needs, and identify known limits of the method at their relevant scope.

For a Skill interface, put its main trigger in frontmatter `description` and the essential action in `SKILL.md`. Keep detailed command use, input conventions, or scientific interpretation in clearly linked references. Load those references only when the current task needs them. A program's own `--help` can document argument syntax while the Skill explains when the program is useful and what its result means.

Domain scripts may perform substantial computation and may call the native ACCRETE CLI to retain their outputs. Keep all object creation, amendment, host exposure, and Memory publication in that CLI boundary. Writing NetCDF, preparing a temporary report, or editing a program remains ordinary work.

Avoid converting research into one mandatory sequence. A Tool may help one part of an investigation and leave the next step to the Agent. State assumptions that matter; do not add a required assessment or approval state merely to admit or use the capability.

## Preserve source-relative meaning

A wrapper might be installed at `.agents/skills/transport-diagnostics/SKILL.md` while source lives at `tools/transport-diagnostics/`. When its source Skill refers to `references/interpretation.md` or `scripts/diagnose.py`, resolve those paths from `tools/transport-diagnostics/`.

Read the complete source Skill before following its supporting references. Edit that source. Refresh the generated wrapper when its discovery description or binding changes. The wrapper is a discovery interface, so keeping independent editable copies of its implementation there would make future changes ambiguous.

Foundational ACCRETE Skills follow a different packaging arrangement: their small release snapshots are copied as real directories into each enabled host discovery path. Their references travel with each copy. Domain Tools retain their own source and use a wrapper or explicitly chosen direct link.

## Describe live changes and retained versions

With a live binding, ordinary source edits become the next usable implementation. Record the actual source used by an activity when known. If another worker is already running an earlier implementation, name the change in a handover and let that activity remain associated with its earlier source.

With a retained binding, prepare material at the selected revision. A dedicated detached worktree or exported artifact can carry it without disrupting active development. A descriptor that names an old commit does not itself produce that material. Pending exposure is the honest result when it is unavailable.

For a compiled Tool, keep its source revision and actual artifact identity distinct when those matter. For an interpreted Tool, capture the entry point and environment the launcher actually selected. Retrospective registration should use available execution information and retain unknowns, rather than borrow the latest descriptor revision.

## Use results and experience to evolve the capability

A Result retains a meaningful activity and the Tool implementation that participated. Data retains selected outputs or source artifacts. Memory explains the interpretation, a discarded approach, or a lesson for subsequent work. Put stable operating knowledge back into the Tool when it will help future users.

For example, a long-running analysis may reveal that one diagnostic is sensitive to a dataset's calendar convention. A later Memory entry can explain that finding in the scope of its observations. Improving the Tool's instructions or implementation helps future use. Earlier Results remain associated with the method and conditions used at the time.

Trust earlier retained work within its described scope. A new question, changed input semantics, or a changed implementation can motivate new work. A Kernel update or a host wrapper refresh alone does not require repeating the scientific activity.

## Work across hosts and share deliberately

Carry shared source and descriptor changes through ordinary version control. Resolve concrete machine bindings locally and refresh discovery on each host that needs it. If a source directory is temporarily absent on one machine, the Tool remains part of the project. Use it where the material is available or restore the binding when needed.

The CLI reports which interfaces it refreshed. A running Agent can still have earlier instructions in context; subsequent work can read the new source explicitly or use the host's documented refresh behavior. Discovery changes do not replace a running program or retrospectively change an activity.

Export selected material to a named local destination when another project should reuse it. Review the intended contents as ordinary packaging work, include its usable instructions and needed source, and keep host-specific absolute paths out of portable guidance. Public distribution remains the user's chosen Git, npm, or plugin action. Preserve origin information so the receiving project can understand how its capability relates to the original.
