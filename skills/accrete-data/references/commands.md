# Data command manual

## Contents

- Interface and project selection
- Register a product in place
- Draft structured Data input
- Associate another location
- Materialize a managed replica
- Evict an exact managed replica
- Understand operation outcomes

## Interface and project selection

This manual defines the template v1 interface expected from `accrete-cli`.
The shared architecture establishes the commands and their effects; the
template contract settles the input vocabulary used here. It is an integration
contract, not a claim that this repository contains the native executable.
Read the installed `accrete data COMMAND --help` when working with a binary.
If its interface differs, retain the draft and use the compatible release or
documented command; do not substitute a persistence script.

Global options are `--project PATH` and `--json`. `ACCRETE_PROJECT` can select
the project when no explicit `--project` is present. Otherwise the Kernel finds
the nearest project marker from the current directory. Invocation selection
takes precedence over the environment. Relative shared and local configured
paths resolve against the selected project root.

The full contract is installed at project-root path
`.accrete/docs/cli-contract.md`; generated command inventory is at
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
project root.

Registration is metadata-proportional by default. Full hashing, recursive
inventory, archiving, and upload are separate explicit choices. Do not request
them merely to make a descriptor look complete.

## Draft structured Data input

Use a structured draft for richer content and locations:

```sh
accrete --json data register --from scratch/data.json
```

The following is a complete example of the template's expected input fields.
Replace its example path and host with actual configured context before use.
The Kernel assigns the object envelope and stable ID.

```json
{
  "name": "year-1-diagnostics",
  "description": "Selected diagnostics from the completed first simulation year.",
  "content": {
    "kind": "directory",
    "state": "closed",
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
| `content.kind` | `file`, `directory`, `collection`, or `external`. |
| `content.state` | `closed` for an intended fixed edition; `live` for changing content. |
| `content.format` | Optional native format description. |
| `content.version`, `content.digest` | Optional known edition or scoped digest; follow the full contract's representation. |
| `origin.description` | How the material arose. |
| `origin.result_id`, `origin.uri` | Optional producing activity or provider location. |
| `locations` | Independently named access locations. |
| `locations[].kind` | Supported `filesystem` or configured `rclone` binding. |
| `locations[].host` | Optional host context for a physical path. |
| `locations[].path` | Filesystem path or backend-relative path. |
| `locations[].managed` | `false` for borrowed registration; the Kernel sets managed ownership for replicas it creates. |

Location names are unique within a descriptor. A location is a usable locator;
an origin explanation alone is insufficient for materialization. An external
version can be registered without downloading it. Do not add a digest whose
bytes have not been hashed or whose producer supplied a different scope.

## Associate another location

When a known copy already exists at a configured location:

```sh
accrete --json data location add "$DATA_ID" \
  --location archive --path retained/year-1
```

This command records a location association. It does not perform the transfer,
rewrite content identity, or turn a borrowed path into a Kernel-owned replica.
Use a distinct location name if one is already occupied by another copy.
Keep backend credentials in native configuration.

## Materialize a managed replica

```sh
accrete --json data materialize "$DATA_ID" --to working
```

`working` names a configured destination with a resolved host-local root or
supported transfer binding. The command selects an explicitly usable source,
stages the transfer, publishes the usable destination, then records its
location. The receipt supplies the path to read with ordinary scientific tools.
If source selection is ambiguous or a required binding is absent, provide the
selection using the installed command's documented interface.

An existing different destination is a conflict. Do not convert it into an
overwrite or merge of scientific products. Partial transfer bytes remain
separate from published usable material. For a project already using DVC or
DataLad, materialization through those native tools can be followed by
`data location add` for the obtained copy.

## Evict an exact managed replica

```sh
accrete --json data evict "$DATA_ID" --location working
```

Choose the exact recorded managed location after deciding that removing this
copy serves the task. The Kernel removes that managed replica and updates its
availability while preserving the Data identity and Result associations.
Borrowed paths are not eligible merely because they were registered.
The other recorded locations can inform retention decisions; their availability
may be dated, and local metadata does not describe all external uses.

## Understand operation outcomes

| Outcome | Meaning and next action |
| --- | --- |
| `committed: true`, `index_pending: false` | The document was published and the local projection updated. Use its ID/path. |
| `committed: true`, `index_pending: true` | The document exists. Run `accrete index refresh` to repair the projection. |
| `published: true`, uncertain durability | The destination is visible; preserve the receipt and reconcile that publication. Do not allocate a replacement identity. |
| Conflict before publication | Retain the current descriptor and input draft; resolve the specific differing content or binding. |
| Transfer side effect with descriptor pending | Preserve returned staging/destination paths and operation ID; use supported recovery. |

The full contract supplies exact outcome fields and retry options. A retry of
the same persistent operation must not change into a new Data object or a
second scientific execution. Data registration and a subsequent Result update
can complete separately; finish the missing association without undoing the
already-retained product.
