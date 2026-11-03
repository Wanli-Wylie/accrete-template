---
name: accrete-models
description: Develop and organize ACCRETE computational Models using native Git and the ACCRETE CLI. Use when registering or binding a model repository, opening or completing a retained development iteration, working across embedded programs, submodules or external checkouts, or associating scientific work with the implementation actually used.
---

# ACCRETE Models

Treat a Model as the project's durable identity for a computational program. Use Git for its implementation, history, branches, worktrees, and integration. Use the Kernel to register, update or retire the identity, bind a checkout, retain the purpose and outcome of an iteration, or remove an iteration's worktree.

## Orient to the program

Establish the owning ACCRETE project and the actual Model repository. Start from the task's supplied paths and object IDs; use ordinary file search and Git when they are incomplete. A Model can be embedded in the project, scoped to part of a larger repository, a submodule, or an external repository. A checkout is one place to work on that Model.

Keep these addresses distinct:

- The ACCRETE project root selects the objects and configuration to change.
- The Model ID identifies the program across hosts and checkouts.
- The repository commit identifies a historical implementation address.
- The source scope identifies relevant paths when several programs share one repository.
- The current checkout or worktree is a physical editing or execution location.

Use the project's explicit `--project` selector for Kernel calls made from external checkouts. Resolve shared relative paths from the project root. Follow machine-specific bindings for actual checkout and execution paths.

## Develop through ordinary tools

Read and edit source, build, investigate, and commit using the existing language tools and Git. Choose the amount of retained organization that the work needs. An iteration is useful for a named line of development that later work should understand; it is optional for an ordinary edit.

Open an iteration around its actual Model repository and intended starting revision. An existing worktree can be attached after work has begun. Allocate independent editing locations when workers' changes can overlap. A host-created worktree of the outer project does not automatically isolate a Model in a different repository.

Integrate using the project's ordinary Git strategy. Close an iteration when its outcome is meaningful to retain. Author the outcome in the project's own terms; integrated, retained separately, and abandoned are useful examples. Closing records that outcome and relevant commits. Merging code is separate native Git work, and removing the worktree is the separate `model iteration remove-worktree` step.

## Preserve the implementation used

Associate a Result with the revision actually used by its activity. A current checkout observation is useful only for the time it was observed. For earlier work, use the launcher's captured identity or an explicit historical revision; leave unknown execution identity unknown.

Allow uncommitted work. Describe its dirty state and any captured material without claiming a patch contains every dependency, untracked file, generated input, or runtime condition. `accrete result capture` writes a selected diff and untracked files; retain that as Data when the task needs it. A changed project commit can reflect only new Memory or documentation; source-scope identities can help explain that distinction without deciding scientific equivalence.

Keep earlier Results associated with their original revisions. Consult relevant Memory before repeating a settled investigation. Add a later interpretation when understanding changes; rerun work when the current scientific or engineering question calls for it.

## Read only what the action needs

- [Object meaning and relationships](references/objects.md): choose repository arrangements, understand IDs, roles, iterations, source scope, and retained history.
- [Kernel operations](references/cli.md): register, bind, update, retire, open, close, and remove a worktree; prepare structured input and handle receipts.
- [Working across sessions and machines](references/working-practice.md): parallel development, dirty source, execution identity, Git transport, and continuity.

Read the installed `.accrete/docs/cli-contract.md` from the project root for the shared command contract and payload conventions. `accrete model COMMAND --help` prints the flags. On a host without the binary, keep draft input in Scratch and continue useful native work without fabricating an ACCRETE descriptor.
