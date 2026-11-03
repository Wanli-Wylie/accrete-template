# Handovers, remote work, and continuing experience

## Give the next agent usable context

A handover tells the next participant what happened, where the material is,
what it suggests, and what remains open. Include the object IDs and concrete
paths needed for the next action. Name relevant revisions, the execution host,
and local bindings when they affect the work. Say which writes or transfers
remain incomplete instead of asking a new agent to reconstruct that state
from a large transcript.

Memory preserves the interpretation that will remain useful beyond that
handover. A returned task description need not automatically become a Memory
entry. A coordinator can synthesize several workers' findings into one entry,
or a worker can publish delegated understanding directly through the Kernel.

Neither arrangement needs a fixed permission token or universal exclusive
writer. Give workers a clear purpose, relevant objects, chosen working paths,
and the scope of their responsibility. Coordinate overlapping native edits
and scarce compute resources according to the actual task.

## Maintain project context outside the project root

A worker may operate in a separate Model worktree or on a remote host. Supply
the ACCRETE project root and relevant guidance explicitly. The Model's Git
root may be a different repository from the project containing Memory.
Use `--project` for Kernel operations outside that root.

Do not assume a new agent session inherited every conversation or discovered
project instructions from a different directory. A brief should identify the
current objective and useful context in normal prose. The agent remains free
to investigate beyond the supplied paths when the task calls for it.

## Exchange entries across hosts

Each host has its own local state and metadata view. Exchange durable Markdown
through the project's Git practice or the supported document-import route.
Host-local locks allocate filenames for local writes only. Two disconnected
hosts can both publish `memory/2026/11/03/001.md` with different stable IDs.

Preserve both entries when they meet. The importer can allocate a new display
number for one while retaining its ID and authored instant. If ordinary Git
reports a path collision, resolve the filenames with that same meaning. Do
not combine unrelated bodies merely because they selected the same number.

Machine-readable relations use stable IDs. The Kernel may maintain links it
generated or an import path map; it does not rewrite every arbitrary link in
authored prose. Update a human path link when necessary while preserving the
intended target identity.

A copied Memory entry can describe remote products that remain remote. Use
its Data and Result links to request the needed material. It does not imply
that the remote computation is still running or that an old locator remains
available. Present state comes from the owning host's native tools.

## Let experience change the working environment

An explanation that repeatedly guides useful work can be developed into a
Tool: a diagnostic method, a domain reading guide, a launcher, or a reusable
analysis. Author its source with ordinary tools and admit it through the Tool
Skill when useful. Memory can explain why it exists and where its limits were
learned.

Similarly, findings can motivate a Model iteration or a different Data
selection. Carry those relations forward without requiring every Memory entry
to create a task, every lesson to become a Skill, or every exploration to follow
a fixed research cycle. The owner and agents choose how experience informs
subsequent work.
