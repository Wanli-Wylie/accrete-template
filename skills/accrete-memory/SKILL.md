---
name: accrete-memory
description: Preserve and recover ACCRETE project understanding across sessions and agents. Use when retaining reasoning, lessons, interpretations, rejected explanations, useful decisions, corrections, or next directions linked to Models, Tools, Data, Results, and earlier Memory. Use native search to read relevant entries and the Kernel to publish complete authored Markdown.
---

# ACCRETE Memory

Preserve understanding that will help later work: what was learned, why a
choice was made, which explanation failed, what remains uncertain, and what
can be tried next. Write plain prose in the project's language. Memory belongs
to the project and remains useful beyond one host conversation.

## Recover relevant understanding

Search the configured Memory root with `rg` and read the entries relevant to
the current question. Follow their Result, Model revision, Data, or Tool links
as needed. Loading the entire history at the beginning of every action is
unnecessary. Trust prior work within its recorded scope; repeat it when the
present task or a concrete changed condition calls for it.

Keep historical understanding distinct from present machine state. A note
about a running job or checkout describes its authored context. Use Git,
the scheduler, process tools, and current configuration for today's state.
Project summaries help navigation; the user's current instruction governs
the current task.

## Publish a useful complete entry

Draft the complete Markdown text in Scratch or another ordinary working file.
Use `accrete memory append --from DRAFT_PATH` and supply known relations, such as
`--result RESULT_ID`. The Kernel allocates the stable entry ID, unless you supply
`--id` for retries, and publishes the complete entry at the next local date-based
path. Keep the returned ID and path in the handover where useful.

The default path is `memory/YYYY/MM/DD/NNN.md`; configuration can place Memory
elsewhere. The project timezone determines the publication day. The stable
frontmatter ID identifies the entry even if an import renumbers its filename.
Do not preallocate permanent empty entries or maintain numbering with a
separate script.

Write a later entry with `--supersedes EARLIER_ID` when an interpretation changes.
Explain what changed and which earlier understanding it supersedes, while retaining
the earlier prose. Use Results for activity descriptions and observations, and
Data for retained payloads. A Memory entry can synthesize several activities
without repeating all their detailed metadata.

## Keep the process open

Write when the understanding is worth carrying forward. A worker may publish
delegated Memory through the same Kernel operation; a Coordinator may instead
combine several findings. There is no required diary frequency, fixed section
form, grading step, or universal exclusive writer.

- [Writing and continuity](references/writing-and-continuity.md): useful
  content, corrections, topic summaries, and links between objects.
- [Command manual](references/commands.md): drafts, append operations,
  native search, concurrent numbering, and operation outcomes.
- [Handovers and remote work](references/handovers-and-remote-work.md):
  self-contained returns, imported entries, and durable project experience.

`accrete memory append --help` prints the flags.
