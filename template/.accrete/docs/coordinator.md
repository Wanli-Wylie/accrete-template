# Coordinator guidance

The Coordinator is the primary Agent holding the owner's objective and the
relationship between ongoing actions. Use the host's normal reasoning,
terminal, and delegation mechanisms. ACCRETE supplies durable objects through
the CLI; it does not supply a second agent runtime or task system.

## Maintain direction

Understand what the owner is trying to obtain and how the next action advances
it. Read the relevant Model history, Tool instructions, Results, and Memory.
Prior work is trusted in the circumstances and revisions it describes. A changed
question or changed implementation may justify further work; the mere arrival
of a new Agent does not.

Distinguish intended work, work that has started, and observations actually
returned. A plan is useful context. A source commit describes code. A Result
can describe a failed, partial, or completed activity. Explain each in its own
scope when reporting progress.

Keep current constraints close to the work that depends on them. A chosen
baseline, a shared GPU allocation, a sequential restart chain, or an integration
branch can remain under the Coordinator's control while independent preparation
or analysis proceeds elsewhere. Do not assume that a project configuration file
enforces reservations on other users or projects.

## Delegate when it helps

Separate independent actions that can proceed with a useful question and a
concrete working context. Keep short dependent work in the main session when
that is more natural. The owner may specify another arrangement. Worker count,
model choice, and host features belong to that arrangement rather than the
ACCRETE object model.

A useful brief carries the following information in plain prose, only as needed:

- The purpose and the object or material to work on.
- The owning ACCRETE project, actual repository/checkout, base revision, and
  assigned editable path.
- Relevant inputs, a Tool Skill when useful, and any machine or resource limits.
- Dependencies on other work and the concrete material the Coordinator needs
  back.

Give workers enough context to act intelligently. A worker may discover that a
path is missing or the proposed explanation does not fit; its brief should
permit investigation within the delegated scope. Avoid copying the whole
conversation or all project Memory into every assignment.

## Keep editable work independent

When source changes can overlap, use separate Model worktrees or disjoint paths.
Name the actual Model repository and its base revision. An isolated worktree of
the outer project does not allocate independent worktrees for every nested or
external Model.

Shared read-only input data and documentation can remain shared. Coordinate
changes to the integration branch and branch switches in a metadata checkout
with workers writing that same checkout. Kernel locks handle concurrent managed
mutations in one supported local view; they cannot serialize native Git switches
or writes made from another host to the same shared files.

## Integrate outcomes

Read returned locations, revisions, observations, and unresolved questions in
the context of the task. Use native Git for merging or cherry-picking source
changes. Preserve a useful unmerged line of work with an appropriate Git ref or
bundle when needed. Closing an ACCRETE iteration describes its outcome and
retained revisions; it does not choose an integration strategy or remove the
worktree. `accrete model iteration remove-worktree` is the separate explicit step
for an iteration's worktree, and it keeps Git's refusal to remove changed work.

Decide whether the combined work should enter Results or Memory. Independent
workers can publish their delegated Results or Memory through the Kernel. The
Coordinator can instead combine several drafts when the interpretation benefits
from their relationship. Neither route requires a universal approval token.

Retain selected code, notes, or outputs before removing a worker's temporary
location. A Result naming a deleted pathname cannot restore its bytes. Keep the
material that future work will use, while ordinary Scratch remains freely
organized.

## Respond to partial managed operations

Read the CLI's outcome before retrying. If a Result or Memory entry committed
but the local index is pending, refresh the index and use the returned object ID.
If a native side effect survived but descriptor publication did not, or durability
was reported uncertain, run `accrete recover` on the host that performed it. It
reconciles from the receipts and never relaunches work. Do not repeat a scientific
computation to repair object organization.

For a revision conflict, read the current document and preserve the incoming
draft. Combine the intended changes, then submit the appropriate narrow update.
Do not resolve a semantic disagreement by selecting whichever file has the
latest timestamp.

## Close a useful unit of work

Return the result the owner requested, with the locations needed to continue it.
State consequential remaining uncertainty and distinguish a completed product
from an intended continuation. When useful, retain an explanation of why a
choice was made, which observations matter, and what the next action could
resolve. There is no compulsory end-of-session report or store traversal.
