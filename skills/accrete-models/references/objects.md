# Model meaning and relationships

## Identity and placement

A Model names a computational program that the project develops or uses. Its stable ID survives a rename, a moved checkout, another machine's path, and a new Git revision. A repository is the carrier of source history; a checkout exposes one working form of that history. Several checkouts can serve the same Model. A single repository can also carry several Models with different declared source scopes.

| Arrangement | Historical address | What the Agent supplies |
| --- | --- | --- |
| Independent repository | Commit in that repository | Existing repository and a local checkout binding |
| Submodule | Commit in the submodule repository | Model repository plus its owning project's relationship |
| Program embedded in the project | Project repository commit | Program purpose and source scope when useful |
| Program inside a monorepo | Repository commit plus relevant paths | Scope that includes meaningful build and generated-source inputs |
| Additional worktree | Commit in the underlying repository | Model identity, worktree path, and intended base revision |

Choose the arrangement that fits the project. There is no requirement to convert every Model into a submodule or independent repository. A local repository without a remote is sufficient for registration. Clone and fetch using Git before registration when needed.

An ACCRETE project clone retains its project identity. A Model attached to that project does not automatically become a second ACCRETE project. Opening a shell inside the Model therefore does not establish the owning ACCRETE project for subsequent object writes; use explicit project selection when it is outside the project's ancestry.

## Revisions and declared scope

A commit gives an address in Git history. It does not completely describe a calculation. The interpreter, build flags, installed libraries, runtime imports, input Data, launch arguments, and execution environment can all matter. Domain Tools or the launcher describe those conditions in the Result when known.

For a Model embedded in a research repository, a Memory change can advance `HEAD` while the numerical source remains unchanged. The Model may declare paths whose native Git tree or blob IDs help explain what changed. Include build configuration and relevant generated inputs in the scope when the project's meaning requires them. A scope named `src/` cannot by itself establish that all behavior is covered.

Record the commit actually used and optional scoped content identities. Let scientific reasoning determine whether an earlier activity is useful for the current question. A matching scope identity does not make two activities automatically interchangeable.

Allow dirty working trees. A commit plus a dirty observation says that the working material differed from the commit; it does not preserve those differences. An optional bounded capture says exactly which paths were captured and what was omitted. A selected source bundle can be retained as Data and linked in the Result when more material is needed.

## Iterations

An iteration retains a named development effort around a Model. It typically describes a purpose, starting revision, branch or worktree, and eventual outcome. It can begin before development or be attached to work already in progress. It has no required agent session, worker assignment, planning ceremony, or scientific approval state.

| Moment | Meaning retained by ACCRETE | Work performed through ordinary tools |
| --- | --- | --- |
| Open | Purpose, Model, base revision, and Git resources | Choose the question and prepare existing material |
| Develop | Further activity can be associated through Results and Memory | Edit, compile, run, inspect, commit |
| Integrate | Outcome may name the integrated commits | Merge, cherry-pick, rebase, or retain branches according to the project |
| Close | Authored outcome, such as integrated or retained separately; relevant revisions | Decide how later work should continue |
| Clean up | Separate explicit storage action | Remove a specific worktree or branch when appropriate |

The outcome is an authored string. Use the project's language to describe what happened; the examples are not a fixed state enumeration. Closing does not imply success, merge a branch, remove an editing location, or erase outputs. An abandoned implementation can still explain a useful observation. An iteration retained separately can remain the basis of later development.

Use worktrees on the actual Model repository for overlapping edits. An isolated outer project checkout can still refer to the same external Model checkout as another worker. Supply each worker with the Model path it should edit and the ACCRETE project root it should use for organizational writes.

## Roles and other objects

`reference`, `target`, and similar names describe the Model's role in a particular activity. A Model serving as a reference today can be developed tomorrow. The descriptor's aliases help people find it; they do not establish permanent subclasses or a universal rule against editing reference code.

| Relationship | What to retain |
| --- | --- |
| Result uses a Model | Model ID, activity role, and execution revision when known |
| Iteration develops a Model | Model ID, starting revision, purpose, Git resources, and outcome |
| Tool acts on a Model | The Tool explains applicable source, build, diagnostic, or execution conventions |
| Data captures selected source or output | Its own identity, material description, and origin; the Result links the relevant objects |
| Memory explains development | Interpretation scoped to the relevant revision, Result, or conditions |

An association may be meaningful even when the checkout is unavailable locally. Preserve a remotely supplied revision and path context without downloading a repository merely to make the metadata complete. Current availability can be resolved separately when the work needs the material.

## Retaining cited history

The Kernel can retain a locally available cited commit with a native Git ref such as `refs/accrete/retained/<object-id>`. This helps keep an unmerged or detached commit available after ordinary branch cleanup. Read the mutation receipt to learn whether retention succeeded; a read-only repository may remain only a citation.

Those refs are local. Normal clone, push, or bundle behavior must not be assumed to include arbitrary ref namespaces. Transport the specific retained refs when another host needs them, alongside the relevant repository and project metadata. This is native Git work, separate from the Model's identity or an iteration's close operation.

The Model ID, commit, worktree, and optional capture answer different practical questions. Keep each association at the scope that was actually observed so the next session can use it without reconstructing an invented certainty.
