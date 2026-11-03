# Activities and relationships

## Contents

- What a Result preserves
- Execution identity
- Publication, drafts, and activity completion
- Relations and attempts
- Native reading

## What a Result preserves

Preserve enough context for later work to understand an activity and use its
observations. Useful information includes:

| Information | Purpose |
| --- | --- |
| Activity label and description | Explain what was attempted or performed. |
| Relevant Model IDs and revisions | Name programs associated with execution. |
| Tool IDs and observed implementations | Identify capabilities used to obtain the observations. |
| Input and output Data with roles | Connect retained materials to their use. |
| Execution description | Preserve supplied host, environment, arguments, times, and runtime details. |
| Observations | Hold small measurements or prose; link larger products as Data. |
| Related Results | Connect comparisons, independent legs, attempts, and continuations. |

Only the supported small envelope is mechanically required by the Kernel.
Leave unavailable information absent or explicitly unknown according to the
installed schema. Keep domain fields supplied by the scientific Tool. The
Kernel need not understand a climate calendar, numerical diagnostic, or
performance metric to preserve it.

Describe units, averaging periods, domains, denominators, and comparison
definitions where they affect interpretation. These are domain choices that
make the observation usable; they are not a universal Result approval process.

## Execution identity

A Model commit identifies a repository snapshot. It may include changes to
notes unrelated to the program. Optional native source-tree identities can
describe a selected source scope, while dependencies and execution conditions
still matter. Preserve the scope's actual meaning instead of treating matching
tree identities as automatic scientific equivalence.

The associated implementation must describe what the activity used. For a
retrospective Result, the latest `git rev-parse HEAD` is only a present checkout
observation. Use execution-time metadata, a retained checkout, a launcher
description, or an explicit historical revision when available. Otherwise
leave the execution revision unknown. The same applies to a Tool, installed
binary, Python environment, and runtime arguments.

Exploratory dirty work is valid. State the observed commit and known changes.
A patch may omit untracked files, ignored files, binary content, or external
dependencies; name the capture scope without claiming complete recovery.
Register selected source bundles or environment artifacts as Data if the
project chooses to retain them.

## Publication, drafts, and activity completion

A draft JSON file under Scratch is working material. `result record` publishes
the durable activity description. Publication is an organizational operation;
it does not declare that the activity completed or that its interpretation is
accepted. The activity may still be running, partially complete, or failed.

An old `running` observation remains historical. Use native process state for
current status. A reported success from a launcher can be preserved as that
launcher's report; distinguish it from the observations that support a
scientific conclusion.

Failed, incomplete, unknown, and absent describe different situations. A
compilation failure, a job lost after several output intervals, and a completed
simulation whose outputs have not yet transferred should retain those distinct
descriptions. Avoid filling missing fields with success-shaped defaults.

## Relations and attempts

Give a genuinely new execution its own Result ID when retaining it. Similar
configuration does not make two runs the same activity. A continuation of the
same computation can append to its Result or become a linked continuation,
according to the domain Tool's meaning.

A multi-leg comparison can retain each leg and a separate comparison activity.
Use meaningful related-result roles to explain the relation. A project can
describe a larger experiment with an additional linked Result if useful;
there is no required hierarchy or fixed number of levels.

Input/output links describe participation. Add explicit derivation only when
the project knows that stronger relation. A Result containing several inputs
and outputs does not imply that each output derives from all inputs.

Related objects may be unresolved on the current host. A remote Result can
name Data left on a compute host or a Model commit absent from the local clone.
Preserve those links without inventing checkouts or downloading bytes.

Registering Data and associating it with a Result may be two completed writes.
If the second stops, keep the Data identity and finish the association later.
A metadata gap does not invalidate the completed scientific product.

## Native reading

Use ordinary tools to inspect the actual representation. For default roots:

```sh
rg 'routing|compilation|comparison' results
jq '.observations' /actual/result/document.json
```

Select actual paths from configuration or mutation receipts. Read Git history
with Git and output arrays with their scientific libraries. Inspect `.schema`
before writing SQL against an unfamiliar index release. The index is a
host-local projection; a Git pull can update documents before it is refreshed.
`accrete index refresh` repairs that projection without changing the activity.

Use Memory search to understand later interpretations. Preserve the execution
description when a later insight changes what the observations suggest.
