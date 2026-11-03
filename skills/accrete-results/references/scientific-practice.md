# Results in continuing scientific work

## Comparisons

Retain the programs and data that actually participated in each leg. The role
`reference` belongs to the comparison; it does not make a Model permanently
immutable or place it in a separate Kernel class. Describe each leg's execution
revision, initial state, forcing, runtime conditions, and known differences
when useful to the interpretation.

Store compact measurements in observations and large histories or diagnostics
as Data. A comparison Result can link the leg Results, the analysis Tool used,
and the selected output products. Explain metric definitions in its description
or associated domain Tool. The Coordinator decides what constitutes an adequate
comparison and which further work is warranted.

Historical Results describe their named implementations. Advancing a Model
branch or changing a comparator does not retroactively change those Results.
A new analysis of old products can have a new Result and linked Memory.

## Long-running computation

A Result can be introduced before launch, after a useful milestone, or after
completion. Choose according to what helps the work. No ACCRETE wrapper is
required around `python`, `mpirun`, `sbatch`, `nohup`, or a domain launcher.

Retain activity times and publication times separately when they differ.
An observation may describe a completed interval or partial output. Keep the
scientific time coordinate in domain fields; a metadata timestamp does not
replace the simulation calendar.

Register completed output products independently when useful. Later stages
can produce new Data and append observations to an existing activity, or create
related continuation Results. Let the program's actual continuity determine
that choice rather than a fixed template workflow.

Use the owning scheduler, launcher, logs, or process table to determine present
execution state. The last durable observation can guide where to look but
does not keep itself current.

## Failed and incomplete attempts

A failed attempt can be worth retaining because its cause, surviving output,
or execution conditions help future work. State where it stopped and what
actually happened. For example, a failure during tracing before compilation
or time stepping has no simulated history; a run interrupted after several
days may have valid closed products for those days.

Keep the failed attempt's identity when recording a diagnosis. If a corrected
implementation is launched again, retain a new Result linked to the earlier
attempt. A repeated CLI write after an uncertain acknowledgment is different:
it attempts to persist the same activity description and should reuse its
stable ID when supported.

Do not rerun an expensive experiment merely because its JSON index is stale,
its output location association is incomplete, or its Result needs correction.
Repair the specific persistence step using the existing activity material.

## Remote work

Record the execution information available where the work runs. Small Result
documents and Memory can travel by the project's Git or import mechanism while
large products remain on the compute host. Materialize selected Data when local
analysis requires it. Receiving a Result does not imply that its inputs, outputs,
or cited Git commits were transported with it.

Use host-local Kernel state and a separate metadata view or a selected writing
host. Local locks and SQLite do not establish coordinated multi-host writes to
a shared network directory. Where imports meet divergent content under one
stable ID, preserve both drafts and resolve the difference; do not choose the
latest timestamp automatically.

## Interpretation and accumulated experience

Use Result amendments for corrected activity descriptions or associations.
Use independent observations for additional measurements or contextual notes.
Use Memory for a changed explanation, a useful lesson, or a next direction.
Link the relevant Result IDs and state the limits of the interpretation.

Trust prior work within its documented scope. Repeat it when the current task
or a concrete changed condition calls for repetition. A template should not
force every session to reconfirm inherited experiments before useful new work.

A useful handover names the completed activity, Result and Data IDs, concrete
paths, execution revisions when known, and any unfinished publication or
transfer step. It also says what the observations suggest. That gives the next
agent enough context without turning the return into a rigid task schema.
