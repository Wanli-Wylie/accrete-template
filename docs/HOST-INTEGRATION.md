# Host integration

ACCRETE supplies project instructions and five discoverable Skills for terminal-based Codex and Claude Code use. The host continues to manage reasoning, terminal access, permissions, context loading, and its native subagents. The native ACCRETE CLI performs object writes and installs the project's guidance snapshot.

The paths and invocation forms below were checked against the primary documentation on 3 November 2026. No live Codex or Claude Code binary was installed or exercised for this delivery. This repository makes no minimum-version claim. Its paired CLI release can declare supported host versions when that integration has been established.

## Installed entry points

| Host | Project instructions | Foundational Skill path | Explicit prompt example |
| --- | --- | --- | --- |
| Codex CLI | Root `AGENTS.md` | `.agents/skills/<name>/SKILL.md` | `$accrete-models` |
| Claude Code terminal | Root `CLAUDE.md`, importing `AGENTS.md` | `.claude/skills/<name>/SKILL.md` | `/accrete-models` |

Codex documents repository Skill discovery from the working directory toward the repository root, and explicit invocation through `$` or `/skills`. It combines project instructions along the root-to-working-directory path. [Codex Skills][codex-skills] · [Codex instructions][codex-instructions]

Claude Code documents `.claude/skills` for project Skills and `/skill-name` invocation. This adapter retains a small `CLAUDE.md` containing `@AGENTS.md`; the documented import lets the project share its main instructions without depending on direct `AGENTS.md` discovery in a particular host version or session configuration. [Claude Skills][claude-skills] · [Claude instructions][claude-memory]

Each enabled host receives these five directories:

- `accrete-models`
- `accrete-tools`
- `accrete-data`
- `accrete-results`
- `accrete-memory`

Each contains its own `SKILL.md` and supporting references. The format uses YAML `name` and `description`, followed by Markdown instructions; the directory name matches the Skill name. Supporting references are loaded when useful. [Agent Skills specification][skill-spec]

## Canonical sources and release copies

Maintainers author each foundation once under this repository's `skills/`. The build assembles ordinary copies for the Codex and Claude destinations. Foundational directories and their references are real files, so their essential operation does not depend on symlink privileges or archive link preservation.

These installed copies are release assets. The native CLI inventories their installed base, preserves local modifications during upgrades, and supplies replacement candidates when needed. A project owner can customize guidance; maintainers change canonical sources and rebuild subsequent releases. One host's edited copy does not automatically modify the other host's copy.

Project-developed Tools use a different arrangement. Their editable source remains in its chosen project or external location. The native CLI's `tool expose` and `tool refresh` operations create source-reading wrappers, or an explicitly chosen supported symlink. Those wrappers are not foundational files in this template. A wrapper must identify the complete source Skill and make source-relative reference and executable paths explicit. Both hosts can expose the same Tool identity.

## Start in the owning project

Launch the main host session from the initialized ACCRETE project root. This makes the project's root instructions and selected foundational discovery directories available through each host's normal local mechanisms. Let terminal commands use explicit paths to the actual Model checkout, scientific environment, and execution directory.

An external Model repository or its worktree can have a different instruction context. The owning ACCRETE project remains explicit in Kernel invocations:

```sh
accrete --project /work/climate-project --help
```

Use the real absolute project path. The template contract also defines `ACCRETE_PROJECT` as an environment fallback. These values select Kernel project context; they do not cause an Agent host to discover that project's instructions from an unrelated directory.

When a worker starts its own host session in an external Model checkout, supply the relevant project guidance and concrete paths in its brief, or use the host's documented additional-directory mechanism where appropriate. Keep the Model's repository and the outer project repository distinct. A host worktree of the outer project does not automatically provide separate editable checkouts for external Models.

## Install through the native CLI

The template-side interface uses:

```text
accrete init PROJECT_PATH --agents codex,claude
accrete --project PROJECT_PATH project upgrade --dry-run
accrete --project PROJECT_PATH project upgrade
```

`--agents` can select `codex`, `claude`, `codex,claude`, or `none`. These are the repository's integration expectations in `contract/cli-v1.json`; the separate CLI implementation provides the operations. Until the repositories are integrated, its available `--help` determines what can execute. This repository's build assembles release assets and a guidance preview; it does not initialize a managed project or implement upgrades.

The root `AGENTS.md` carries a short ACCRETE section pointing to `.accrete/PROJECT.md`, the installed manuals, and the five Skills. The Claude profile adds the import section to `CLAUDE.md`. Native installation preserves existing owner text, unrelated host configuration, and project Skills. It reports conflicts at proposed destinations instead of silently replacing them.

## Keep host choices with the owner

The default payload contains no `.codex/config.toml`, selected model, fixed concurrency setting, permission override, Claude hook, or automatically installed custom-agent definition. The host's existing personal and organization settings continue to apply. Initialization does not modify the user's home directories or personal Skill installation.

Coordinator and worker guidance is ordinary project prose. A worker receives the objective, paths, relevant revisions, current constraints, and a useful return. A project may later choose native agent presets using its installed host's documented format. Such a choice can reference the same prose without making a particular model family or orchestration setting an ACCRETE requirement.

No additional host settings are needed for the baseline file integration. Environment, storage, and Model bindings belong in ACCRETE's shared or ignored local configuration as appropriate. Scientific execution still uses the project's actual language tools, SSH, scheduler, and domain capabilities.

## Continue through updates and discovery differences

Read the actual installed Skill source when a changed interface is relevant to ongoing work. A successful native refresh reports the paths it changed; it cannot promise that every running host session has replaced previously loaded instructions. Host discovery and context-loading behavior remain governed by the installed host. The primary documentation describes its current refresh behavior. [Codex Skills][codex-skills] · [Claude Skills][claude-skills]

For a Skill that does not appear, first establish the session's project root and the presence of its real discovery directory and valid `SKILL.md`. Use the host's Skill selector or explicit invocation. If a same-named personal or organizational capability is also available, use its displayed source information to identify the intended project Skill. Existing owner configuration remains intact.

The instructions can always be read as ordinary files. If the Kernel is unavailable, Models, Tool source, Results, and Memory remain readable with native tools. Retain intended object-write drafts in Scratch and resume those writes with a compatible binary. A discovery problem does not justify implementing a parallel persistence script.

[codex-skills]: https://learn.chatgpt.com/docs/build-skills
[codex-instructions]: https://learn.chatgpt.com/docs/agent-configuration/agents-md
[claude-skills]: https://code.claude.com/docs/en/skills
[claude-memory]: https://code.claude.com/docs/en/memory
[skill-spec]: https://agentskills.io/specification
