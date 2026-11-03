---
name: accrete-tools
description: Retain and evolve ACCRETE project capabilities as Tools. Use when a useful script, program, knowledge guide, diagnostic, or Skill should acquire a project identity; when updating its selected source, exposing it to Codex or Claude Code, refreshing discovery, exporting a local package, or retiring current use while preserving earlier associations.
---

# ACCRETE Tools

Treat a Capability as something the project can understand or do. Treat its Tool as the durable project identity for the implementation and knowledge that makes that ability reusable. Treat a Skill as one host's discovery interface for it. A Tool can contain prose alone, a program alone, or both.

## Develop the capability naturally

Write source, instructions, examples, or configuration with ordinary tools. A one-off script can stay in Scratch while it develops. Admit it when retaining its purpose and usable source would help subsequent work. Admission creates an identity; the Agent and owner judge usefulness through their work.

Choose a source location that the project can maintain: a normal project directory, an independent repository, or an explicitly associated external location. Use native Git when version history is useful. Preserve the language, environment, and native programs appropriate to the capability.

Keep code and knowledge together where that helps another Agent use the Tool. Explain its purpose, applicable inputs, practical action, meaningful outputs, and limits of interpretation. Make a Skill concise and put detailed operational knowledge in its source-relative references. A cognitive guide needs no invented executable entry point.

## Use the right organizational operation

- Admit existing source with `tool admit` when it should become a retained project capability.
- Use `tool update` for descriptor changes or a deliberately selected source revision.
- Use `tool expose` to add a project-local host discovery interface; use `tool refresh` to update existing managed discovery after source or description changes.
- Use `tool export` for an explicit local destination when material should be reused elsewhere.
- Use `tool retire` when ordinary discovery should stop; preserve the source and earlier Result associations.

Use the Kernel for these operations. Editing source, invoking its program, committing improvements, and publishing through a chosen external distribution channel remain ordinary work.

## Distinguish source from exposure

Edit the Tool's source, including its source `SKILL.md`. A generated host wrapper points to that source and explains where relative references and executable paths resolve. Read the complete source instructions before using the capability. Keep `scripts/run.py` relative to the source directory, never to a wrapper directory.

The portable exposure is a real host Skill directory containing a wrapper. A supported symlink is an explicit alternative. One Tool can be available through both hosts without becoming two Tools. Foundational ACCRETE Skills are distribution snapshots; domain Tool sources evolve with project practice.

A **live** source binding follows the editable source. A **retained** binding refers to material that actually corresponds to the selected revision, such as a dedicated checkout or export. Prepare that material with native tools. Refreshing discovery never checks out a selected historical revision into an unrelated active working tree.

If the source is unavailable or the retained material has not been supplied, preserve the Tool and report pending exposure. Read the receipt for the interfaces actually installed. A running Agent may still hold earlier instructions; name consequential changes in the handover and have subsequent work load the changed source explicitly.

## Associate actual use and accumulated experience

Record the Tool ID in a Result when the capability helped produce a retained activity. Supply the implementation actually used when known: source commit, entry point, artifact identity, and useful execution conditions. A live Tool's admission-time commit does not establish the version used later.

Retain interpretation and reusable lessons in Memory, and improve the Tool when those lessons belong in its operating knowledge. Do not rewrite earlier Results to match the Tool's latest behavior. Export only the intended material and use the project's ordinary publishing mechanism for any later external distribution.

## References

- [Object meaning and relationships](references/objects.md): Capability, Tool, Skill, live and retained binding, identities, and retirement.
- [Kernel operations](references/cli.md): input drafts, expected command forms, exposure destinations, receipts, and incomplete operations.
- [Developing useful capabilities](references/working-practice.md): agent-oriented instructions, source-relative resources, long-term improvement, and use from different hosts.

Read the installed `.accrete/docs/cli-contract.md` from the project root for the shared contract and release compatibility. Use the invoked binary's `--help` for available options. If required CLI support is missing, retain its input draft in Scratch and report the missing operation while continuing useful source development.
