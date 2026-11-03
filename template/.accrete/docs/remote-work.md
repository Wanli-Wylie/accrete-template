# Working across machines

Use ordinary SSH, transfer tools, domain launchers, and site schedulers for remote
computation. Install the native Kernel on the host where managed metadata writes
occur. It can run directly without Node.js once the matching native binary is
available. ACCRETE does not need a remote coordinator service.

## Establish the working context

Share the project's small configuration and documents through its normal Git or
explicit transfer arrangement. A remote clone has the same project identity and
its own ignored `.accrete/local.toml`, local metadata-view index, and operation
state. Native Model repositories may be obtained separately and bound to the
appropriate aliases on that host.

Name the actual Model revisions, input locations, execution directory, domain
Tool, and current resource constraints in the assignment. Supply the relevant
project guidance explicitly when a worker starts from an external Model checkout.
An environment and its import paths remain the concern of the Tool launching the
program.

## Compute and retain at the useful boundaries

Scientific execution writes ordinary files in its working directory. A useful
activity can be recorded before, during, or after execution; that choice does not
authorize or schedule the computation. A Result may describe a failed launch,
one completed leg, a partial chain, or a full activity.

Register closed products when the producer has completed the relevant writes.
For a continuing campaign, a completed year's restart and diagnostics can be
retained while later years are still running. A preallocated history file or a
directory's presence does not establish that its scientific product is finished.
If a live source is intentionally registered, describe it as mutable.

Reduce large arrays near the computation when the question benefits from smaller
products. Retain raw outputs or restart states at the location chosen for them,
and give reduced products their own Data descriptions and origin associations.
Transfer only the material needed for the current analysis. Data registration
does not compel copying or hashing every member of a large remote tree.

## Bring back portable descriptions

Exchange Result JSON, Data/Model/Tool descriptors, and selected Memory through
ordinary Git or the Kernel's supported import path. Preserve supplied IDs and
historical revisions. Do not copy the remote live SQLite database as the durable
project description; refresh a local projection from the received documents.

An unresolved relation is acceptable when the referenced repository or Data is
still remote. A Memory filename collision between independent hosts does not
mean the entries are the same; the stable IDs distinguish them and the native
import operation allocates the receiving path. Divergent content under one
identity requires a deliberate merge, rather than last-writer-wins replacement.

Use the CLI contract for supported import syntax. Keep drafts intact if that
binary does not yet support a required import. Do not build a second importer in
a foundational Skill.

## Materialize what analysis needs

Read already available bytes with native readers. To create a managed replica,
use `data materialize` with a configured source and destination. The Kernel
handles the location association while a native adapter performs the transfer.
A project already using DVC, DataLad, or site transfer software can use that tool
and add the completed location through the CLI.

Publication of transferred bytes and publication of the location description are
separate completion points. Keep the command's receipt if one completes without
the other. Continue or reconcile that operation using the named surviving paths;
do not restart the simulation to repair metadata or transfer state.

A local analysis can then produce its own Result and Memory linked to the
original remote products. This retains the relationship between production,
reduction, and interpretation without demanding one universal campaign layout.

## Current state comes from the system that owns it

A copied Result describes what its author observed. It does not establish that
a remote process is still running or that a path remains available now. Use the
scheduler, process table, logs, or domain launcher for current execution state.
Use native storage access for present availability when the task needs it.

Keep metadata writers on one host for a shared writable metadata view. Separate
host-local locks do not coordinate simultaneous writers to the same NFS tree.
Payload files can remain on shared storage under the scientific program's own
I/O conditions, while metadata travels through the chosen explicit arrangement.

## Hand over enough to continue

Name the activities actually completed, relevant code revisions and runtime
context, Result and Data IDs, concrete retained paths, and outstanding work.
State what remains only on the remote host and which products are already
available for analysis. Preserve useful source or selected outputs before
removing their temporary worktree or execution directory. Let the owner's task
determine the format and extent of the handover.
