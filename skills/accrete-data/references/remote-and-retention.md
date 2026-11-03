# Remote Data and retention

## Separate meaning from placement

Shared project configuration names logical roots, locations, and useful
environment labels. `.accrete/local.toml` supplies the current host's physical
paths and native transfer bindings. Relative configured paths resolve against
the ACCRETE project root. A remote Model checkout, large payload, and Scratch
directory can all live outside that root.

Use the CLI's explicit `--project` selector from external working directories.
Do not infer the project from whichever Model repository happens to be the
current directory. Returned mutation paths identify the affected descriptor
and usable destination.

Credentials remain in native SSH, rclone, storage, or environment configuration.
Describe an endpoint by its configured alias and path. Avoid retaining tokens,
full credential-bearing URLs, or indiscriminate environment dumps in Results,
Memory, input drafts intended for Git, or shared TOML.

## Remote production and local analysis

Use ordinary SSH, schedulers, domain launchers, and scientific programs for
remote execution. Register completed products where they exist and describe
the actual activity with Results. Exchange small descriptors and useful Memory
through the project's selected Git, or with `accrete export` and `accrete import`,
whose bundles carry descriptors and leave payloads where they are. Transfer only
the products required for the next analysis.

A locally received descriptor can correctly name a remote output that is not
downloaded. It can also retain an old availability observation when the remote
host is currently unavailable. For current process and storage state, consult
the owning host's tools. A copied Result saying `running` is historical prose,
not a current process observation.

Independent clones have separate local state. A host-local Kernel lock and
SQLite index do not coordinate simultaneous writers across compute nodes on
a network filesystem. Use one selected metadata-writing host or separate
metadata views and exchange documents afterward. Read-only payload sharing
can continue through the scientific storage system.

## Materialization and large products

Prefer registering in place when bytes are already where they are needed.
Materialize when another managed usable copy has a purpose. The Kernel copies
locally or downloads through configured rclone, stages incomplete content separately,
then publishes the completed replica and its location association. The metadata lock
is held only for publication, not for the transfer duration.

Content identification should match the actual knowledge and cost:

| Existing information | Appropriate description |
| --- | --- |
| Producer SHA-256 for a selected file | Supply it as `content.sha256`. |
| Producer collection manifest | Retain the manifest and what it describes. |
| Immutable provider version | Describe it in `content.edition` and keep the selector on the location as an opaque token. `data materialize` refuses such a source, so use a version-specific exported locator or retrieve it with the provider's tool. |
| Closed directory with known provenance | Retain the producer's content description; omit an uncomputed digest. |
| Mutable external path | Identify it as live and describe the observation time. |

Hashing and archive creation are explicit choices. Avoid scanning terabytes
merely to assign an identity. Do not label backend completion as stronger
content checking than the transfer actually performed.

If a transfer stops, run `accrete recover` on that host. A lost acknowledgment can
leave a completed replica whose descriptor update remains pending, and recovery
finishes that from the receipt. An incomplete transfer is reported with its staging
path and left for explicit retry or cleanup. Inspect that specific outcome before
beginning another transfer; never rerun the producing simulation as metadata recovery.

Uploading to a remote is a native rclone operation followed by `data location add`.
Object storage can publish individual objects without atomically publishing an entire
directory collection, so upload to a fresh prefix and add the location only when the
upload finishes. Do not make an already-used complete prefix temporarily stand for a
different partially uploaded edition.

## Evict a replica deliberately

Distinguish these changes:

- Evicting one managed replica removes that copy and updates its availability.
- Retiring current use with `accrete data retire` keeps the identity and earlier
  Result associations, and removes no bytes.
- Deleting a borrowed source is an explicit action by its owner.

Registration does not grant the Kernel authority to delete a borrowed
scientific directory. A managed materialization can be evicted with `accrete data
evict` for that exact location. Other recorded locations help a
decision, but their availability may be stale; the project index cannot know
every external use or unpublished computation.

Keep symlink and hard-link behavior visible. A link to mutable producer bytes
does not make an independent closed copy. Materialization copies and never hard-links
a source, and it refuses symlinks, so package links deliberately when they matter.

Describe useful retention choices in Memory: why an edition matters, which
products were selected, what remains remote, and what the host may purge.
The word Scratch alone specifies no expiry duration. Site storage policies
govern the actual bytes; ACCRETE preserves the project's descriptions of them.
