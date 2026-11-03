# Data command manual

## Contents

- Interface and project selection
- Register a product in place
- Draft structured Data input
- Amend or retire a description
- Associate another location
- Materialize a managed replica
- Evict an exact managed replica
- Understand operation outcomes

## Interface and project selection

This manual covers the Data commands. `accrete data COMMAND --help` prints the flags.

Global options are `--project DIRECTORY` and `--json`. `ACCRETE_PROJECT` can select
the project when no explicit `--project` is present. Otherwise the Kernel finds
the nearest project marker from the current directory. Invocation selection
takes precedence over the environment. Relative shared and local configured
paths resolve against the selected project root.

The full contract is installed at project-root path
`.accrete/docs/cli-contract.md`; the generated command map is at
`.accrete/docs/cli-commands.md`. JSON output goes to stdout and diagnostics to
stderr. Use returned paths and IDs instead of deriving filenames yourself.

## Register a product in place

After a producer has closed a directory selected for retention:

```sh
accrete --json data register --name year-1-output \
  --path /scratch/project-a/run/year-1/output \
  --kind directory --result "$RESULT_ID"
```

`RESULT_ID` denotes the actual producing Result when known. Omit `--result`
when no Result exists or the relationship is unknown. The command establishes
a Data identity and a borrowed location. Registration does not copy the
directory or imply permission to delete it. A local path may be outside the
project root. A relative `--path` resolves from the project root, and a symlink
is refused.

Registration is metadata-proportional by default. `--hash` computes SHA-256 for
one regular file; directories can refer to a producer-owned manifest. Recursive
inventory, archiving, and upload are separate explicit choices. Do not request
them merely to make a descriptor look complete. `--live` describes mutable
material, and `--id` gives a stable ID for retries.

## Draft structured Data input

Use a structured draft for richer content and locations:

```sh
accrete --json data register --from scratch/data.json
```

The following is a complete example of the input fields. Replace its example
path and host with actual configured context before use. The Kernel assigns the
object envelope, and a UUID unless you supply `id`.

```json
{
  "name": "year-1-diagnostics",
  "description": "Selected diagnostics from the completed first simulation year.",
  "content": {
    "kind": "directory",
    "mode": "closed",
    "format": "NetCDF collection"
  },
  "origin": {
    "description": "Produced by the first-year simulation; selection preserved by the domain launcher."
  },
  "locations": [
    {
      "name": "compute-output",
      "kind": "filesystem",
      "host": "gpu-a",
      "path": "/scratch/project-a/year-1/diagnostics",
      "managed": false
    }
  ]
}
```

Draft fields:

| Field | Meaning |
| --- | --- |
| `name`, `description` | Human organization and intended material. |
| `content.kind` | `file`, `directory`, `collection`, or `external`. Without `--path` it defaults to `external`. |
| `content.mode` | `closed` (the default) for an intended fixed edition; `live` for changing content. |
| `content.format` | Optional native format description. |
| `content.edition` | Optional words describing the intended edition, such as a provider's release name. |
| `content.size_bytes` | Optional known size. Materialization checks it for a file. |
| `content.sha256` | Optional SHA-256 of a regular file's bytes. Materialization checks it. |
| `origin.description` | How the material arose. |
| `origin.result_id`, `origin.uri` | Optional producing activity or provider location. |
| `replaces` | Optional earlier Data ID that this corrected edition replaces. |
| `locations` | Access locations, each with its own generated ID. |
| `locations[].name` | Optional. A configured location name supplies its kind and root or remote. |
| `locations[].kind` | `filesystem`, configured `rclone`, or `external` for a locator the Kernel records and never transfers. |
| `locations[].host` | Host context for a physical path; filesystem locations default to the current host. |
| `locations[].path` | Filesystem path, backend-relative path, or external locator. |
| `locations[].managed` | `false` or omitted; `true` is refused. The Kernel sets managed ownership for replicas it creates. |

A location is a usable locator; an origin explanation alone is insufficient for
materialization. An external version can be registered without downloading it.
Do not add a `sha256` whose bytes have not been hashed. A backend `version`,
`version_id` or `s3_version_at` on a location is kept as an opaque token, and
`data materialize` refuses a source that carries one rather than silently
fetching current bytes. Use a version-specific exported locator, or retrieve
that version with the provider's tool and register the local copy.

## Amend or retire a description

```sh
accrete --json data amend "$DATA_ID" --from scratch/change.json --expect "$REVISION"
accrete --json data retire "$DATA_ID" --expect "$REVISION"
```

`data amend` takes a JSON Merge Patch of descriptive fields. It refuses to change
closed `content` or replace `locations`; those need a new Data ID or the location
commands below. `data retire` changes status and removes no bytes. Its optional
`--from FILE` document can carry a `reason`, stored on the descriptor.

## Associate another location

When a known copy already exists at a configured location:

```sh
accrete --json data location add "$DATA_ID" \
  --location archive --path retained/year-1
```

`--location` names the location, `--kind filesystem|rclone|external` overrides its
kind, and `--from FILE` accepts the same fields as JSON. `--expect REVISION` is
optional. A path relative to a configured filesystem root resolves there. A
repeated matching location is a no-op. The command records an association. It does
not perform the transfer, rewrite content identity, or turn a borrowed path into a
Kernel-owned replica. Keep backend credentials in native configuration.

## Materialize a managed replica

```sh
accrete --json data materialize "$DATA_ID" --to working
```

`--to` is a configured filesystem location name, by default `working`. The command
selects a usable source, stages the transfer, publishes the completed replica at
`ROOT/DATA_ID/REPLICA_UUID/payload`, then records its location. The receipt supplies
the path to read with ordinary scientific tools and names the content checks actually
performed. If the source is ambiguous, select it with `--source LOCATION_ID` or an
unambiguous name. `--expect REVISION` ensures the descriptor has not changed first.

A repeat can return an existing present replica at the same root. Partial transfer
bytes remain separate from published usable material. Symlinks and special files are
refused; package them first. For a project already using DVC or DataLad,
materialization through those native tools can be followed by `data location add`
for the obtained copy.

## Evict an exact managed replica

```sh
accrete --json data evict "$DATA_ID" --location "$LOCATION_ID"
```

`--location` takes the location's ID or name; an ambiguous name is a conflict. Choose
the exact recorded managed location after deciding that removing this copy serves the
task. The Kernel removes that managed replica and updates its availability while
preserving the Data identity and Result associations. Borrowed paths are not eligible
merely because they were registered. The other recorded locations can inform retention
decisions; their availability may be dated, and local metadata does not describe all
external uses.

## Understand operation outcomes

| Outcome | Meaning and next action |
| --- | --- |
| `committed: true`, `index_pending: false` | The document was published and the local projection updated. Use its ID/path. |
| `committed: true`, `index_pending: true` | The document exists. Run `accrete index refresh` to repair the projection. |
| `published: true`, uncertain durability (exit 8) | The destination is visible; run `accrete recover`. Do not allocate a replacement identity. |
| Conflict before publication (exit 4) | Retain the current descriptor and input draft; resolve the specific differing content or binding. |
| Transfer side effect with descriptor pending (exit 7) | Run `accrete recover`, or `accrete recover --operation OPERATION_ID` for one operation. |

`accrete recover` finishes publishing a completed transfer or eviction from its
receipt. A receipt for an incomplete transfer is reported with its paths and left for
explicit retry or cleanup; recovery does not start the transfer again. A retry of the
same persistent operation must not change into a new Data object or a second scientific
execution. Data registration and a subsequent Result update can complete separately;
finish the missing association without undoing the already-retained product.
