# Tool meaning and relationships

## Capability, Tool, and Skill

| Term | Meaning | Useful consequence |
| --- | --- | --- |
| Capability | An ability to understand or do something | Can combine executable methods and explanatory knowledge |
| Tool | The retained project object through which the capability is named and maintained | Has a stable ID, source association, evolving description, and lifecycle |
| Skill | A host interface that lets an Agent discover and load the capability | Can expose an existing Tool without becoming its identity |

A numerical diagnostic can combine scripts, data conventions, plots, and interpretation notes. A guide to diagnosing model output can be entirely cognitive. A compiled program can remain directly callable while a small Skill explains its role. The project chooses the material that makes the ability reusable.

An experimental file does not need immediate admission. It becomes a Tool when preserving its identity and use is helpful. Source can remain in the project Git repository, an independently versioned repository, or an external directory. One repository per Tool is unnecessary.

The Tool ID remains stable when a capability changes its name, location, source revision, or host exposure. Several exposures can refer to the same Tool. A host-generated path is a locator; it must not become the identity used in Results.

## Source history and use

The Tool's source can include code, documentation, configuration, and reference material. Use ordinary editing and Git for that content. A descriptor identifies its purpose and source. Updating that descriptor is separate from editing source; refreshing discovery is separate again.

A Result can identify the Tool even when it was used directly by a program or read by path. Record its observed implementation when available. For a Tool embedded in a larger repository, a commit gives a historical address and an optional scoped tree identity can explain whether the Tool's own content changed.

A source commit alone may not identify a compiled binary or an interpreter's imported code. Supply the actual artifact, entry point, and runtime information when the launcher knows them. Unknown information can remain absent. Reconstructing an activity later from the latest Tool descriptor can incorrectly assign an implementation that was never used.

## Live and retained bindings

| Binding | Meaning | What makes the exposure usable |
| --- | --- | --- |
| Live | Follow the named editable source | The source exists and its current operating instructions can be read |
| Retained | Use material corresponding to a deliberately selected revision | A caller-supplied checkout or artifact actually matches that selection |

A live binding can improve during a project. Its admission-time commit remains historical context. The next activity must describe the implementation it actually uses. A changed source description may require refreshing the host wrapper; a direct source link can make edits visible immediately, subject to the host's loading behavior.

A retained selection needs concrete material. Prepare a dedicated checkout or exported artifact through native tools and associate that location. The Kernel must not change the user's active branch to make an exposure resemble a selected historical commit. If matching material is absent, retain the descriptor and report the pending binding.

Do not treat these source modes as the exposure mechanism. `wrapper` and `symlink` describe how a host discovers a Tool; `live` and `retained` describe what implementation that discovery refers to.

## Host exposure

The portable exposure is an ordinary directory with a valid `SKILL.md`. A generated wrapper describes the capability and names the complete source Skill and source directory. The Agent reads those source instructions before using it. Relative references and program paths belong to the source directory.

An explicit symlink can expose the source where supported. A Tool that relies on host-specific substitutions may need a matching adapter or direct link. Keep such host behavior in the adapter or source instructions that explain it; the Tool's meaning can remain independent of a particular Agent host.

Expose project capabilities only at the selected project destination unless the user explicitly chooses another destination. A name collision must be reported or resolved by an explicit different name or replacement choice. Existing unrelated Skills and home-directory configuration are not part of Tool admission.

Machine-specific absolute source bindings normally stay out of shared Git content. A clone retains the Tool descriptor and resolves its own local source before exposure. Unavailable source on one machine does not retire a capability useful elsewhere.

## Export and retirement

Export produces selected material at an explicit destination. It can be transferred through Git, npm, a host plugin, or ordinary file transport when the user chooses. Export is a local packaging action and does not imply public publication or installation in another user's environment.

Retirement changes the shared descriptor's current availability and removes or disables exposures managed on the invoking host. It preserves source files and earlier Result references. Other hosts reconcile local exposure after receiving the descriptor and explicitly refreshing it. Retirement cannot erase instructions already loaded in a running conversation or stop an executing program.

If a capability has been replaced, explain the relationship in its description or later Memory. Earlier activities remain associated with the implementation they used. A new capability can deserve a new identity; an improved implementation of the same purpose can evolve under the existing identity. Make that judgment from project meaning.

## Relationships and independent evolution

| Association | Meaning |
| --- | --- |
| Tool source and revision | The maintained implementation and knowledge |
| Tool host exposure | A discovery interface on a specific host |
| Result uses Tool | A capability participated in the retained activity |
| Tool operates on Model or Data | Domain instructions explain applicable objects and material |
| Memory explains Tool experience | Lessons, interpretation, and directions for later improvement |

Foundational ACCRETE Skills are installed from the distribution and refreshed explicitly with compatible template assets. Domain Tools evolve according to the project's needs. A Tool declares a Kernel requirement when it invokes Kernel operations; an ordinary plotting capability does not need a new version whenever ACCRETE receives a patch release.
