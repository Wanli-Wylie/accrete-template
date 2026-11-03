# Writing understanding that remains useful

## Contents

- What to carry forward
- Relating Memory to other objects
- Corrections and uncertainty
- Reading and topic summaries
- Optional writing patterns

## What to carry forward

Retain understanding whose value outlives the current exchange. Useful entries
explain a mechanism, an implementation decision, a diagnostic interpretation,
an unsuccessful direction, a practical constraint, or a promising continuation.
An entry can be brief when a short explanation preserves the essential point.

Write enough context for another agent to understand the claim without having
seen the conversation. Name relevant revisions, Result IDs, Data editions, or
Tool implementations when they materially delimit the lesson. Distinguish what
was observed from what is inferred, and describe the conditions under which
the understanding is useful.

Do not convert every transient terminal line into project Memory. Raw outputs,
long logs, arrays, and code already have suitable locations. Link them through
Results and Data when retained. Host transcripts and private agent context can
continue to exist separately; Memory is the authored project synthesis.

## Relating Memory to other objects

| Subject of an entry | Useful relation |
| --- | --- |
| An observation from an experiment | Relevant Result and Model revision. |
| Why a numerical fix changed behavior | Result comparison, changed implementation, and any relevant Tool. |
| A useful analysis method | The retained Tool and Results demonstrating its use. |
| Data limitations or selection | Data ID/edition and the activity that exposed the limitation. |
| Revised explanation | Earlier Memory ID and the newer observations motivating the revision. |
| A next direction | Current question, relevant objects, and the reason for pursuing it. |

Use stable IDs for machine-readable links. Human Markdown links to paths can
make browsing convenient, but imported date-based filenames can change. Keep
both identity and an accessible path when useful; do not treat the filename as
the entry's durable identity.

The body remains prose. Associations help later discovery without requiring
a formal claim language or replacing the author's explanation. A single entry
can connect multiple objects and several rounds of experience.

## Corrections and uncertainty

Write a later entry when a new observation changes an earlier interpretation.
Name the earlier entry, state the revised understanding, explain what changed,
and describe what still holds. Preserve the previous entry so the sequence of
reasoning remains intelligible.

A correction to execution metadata belongs in a Result amendment. A newly
observed outcome can be added as an observation. A changed explanation of
those outcomes belongs in Memory. An additional analysis can produce its own
Result and then a Memory interpretation. These actions can be taken in the
order useful to the work.

Preserve uncertainty with ordinary language. A hypothesis can be retained
without being promoted to an established conclusion. A failed explanation
can be valuable if the entry says why it was set aside and within what scope.
Avoid implying that every possibility was ruled out when only one mechanism
was investigated.

Present machine state can change without invalidating historical reasoning.
A note saying a particular environment or branch was selected describes its
authored context. Read current configuration and native state before using
that information for a new action. Scientific simulation time is a domain
coordinate; the date used to organize Memory is a publication convention.

## Reading and topic summaries

Search by the current scientific question, a distinctive mechanism, a Result
ID, or a program component. Read relevant entries and their immediate context.
Follow links when needed instead of rereading every project entry.

Trust inherited work within the scope it documents. Additional checks belong
to the current task when a changed implementation, new observation, or owner
request gives them a purpose. Memory should help work continue rather than
require routine reenactment of earlier activities.

A topic summary can consolidate a growing line of work and link its detailed
entries. Treat it as an authored aid that can become outdated. Preserve the
details needed to understand changes of interpretation. A summary does not
override the owner's current instruction or determine present runtime state.

## Optional writing patterns

Choose a form suited to the content. A mechanism note can explain the observed
behavior, the reason it occurs, and its implications. A decision note can state
the choice, rationale, practical consequences, and circumstances for revisiting
it. A correction can name the earlier interpretation and explain its revision.
A short handover synthesis can preserve completed understanding and next
directions while leaving operational details in the normal task handover.

These are writing options, not required headings. Use the project's ordinary
academic or engineering prose and retain only the context needed to make the
entry useful later.
