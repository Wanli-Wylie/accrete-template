---
name: accrete-data
description: Retain, locate, materialize, and manage scientific inputs and outputs as ACCRETE Data. Use when a dataset, restart, model output, analysis product, external dataset version, or collection needs a durable identity, a Result association, another replica, or explicit replica eviction. Read available data with native scientific tools.
---

# ACCRETE Data

Give useful material a continuing project identity when later work needs to
find it or understand its use. A Data object can describe a file, a directory,
a collection, or an external dataset version. Its ID denotes the intended
material; locations say where copies can be accessed. A checksum describes
bytes within its stated scope. Keep those three meanings separate.

## Choose the appropriate action

| Need | Action |
| --- | --- |
| Read an available array, table, or document | Use its normal reader and concrete path. |
| Produce intermediate outputs or explore a transformation | Work in Scratch or the producer's own directory. |
| Retain a useful product in place | Call `accrete data register`. |
| Describe an external dataset before downloading it | Register its locator and known content/version information. |
| Correct a description | Call `accrete data amend` using the current revision. |
| Associate an existing additional copy | Call `accrete data location add`. |
| Obtain a managed usable copy | Call `accrete data materialize`. |
| Remove one managed copy while preserving its meaning | Call `accrete data evict` for that exact replica. |
| End current use without removing bytes | Call `accrete data retire`. |

Registration need not copy, archive, upload, traverse, or fully hash a dataset.
Supply the information already available, and request additional byte work
only when it serves the task. A Data object may be valid while no copy is
accessible on the current machine.

## Preserve content meaning

Register a completed product when its relevant writes have finished. When
working with a live source or open collection, describe it that way. A stable
path to changing bytes does not identify a historical snapshot. Adding a
replica or correcting a description changes an existing descriptor; corrected
scientific content normally receives a new Data ID naming the previous one in
`replaces`. Keep earlier Results associated with the material they
actually used.

Use the Result Skill to describe the producing or consuming activity. Link
Data as an input or output when known; ordinary input/output participation
does not assert that every output derives from every input. Use Memory for
interpretation, retention decisions, and lessons that later work should use.
Keep NetCDF, HDF5, Zarr, Parquet, archives, and domain collections in their
normal representations. Domain Tools choose transformations and packaging.

## Work through the native boundary

Read shared `.accrete/project.toml` and host-local `.accrete/local.toml` to
resolve store and location bindings. Paths in examples are illustrative;
configured paths and mutation receipts identify the actual locations. When
working outside the ACCRETE root, select it explicitly with `--project`.

Draft registration inputs in ordinary files; publish managed descriptors
through `accrete`. Use its returned ID and concrete path. If metadata
was committed but indexing is pending, refresh the index without registering
another object. If a transfer or eviction stopped partway, run `accrete recover`;
it finishes from the receipt and reports an incomplete transfer with its paths.
Metadata repair never requires rerunning the producer.

## Read when needed

- [Objects and native work](references/objects-and-native-work.md): identity,
  content editions, collections, relationships, and reading existing material.
- [Command manual](references/commands.md): registration, amendment, retirement,
  location changes, materialization, eviction, input drafts, and operation outcomes.
- [Remote work and retention](references/remote-and-retention.md): host
  placement, scientific outputs, large transfers, and borrowed locations.

`accrete data COMMAND --help` prints the flags.
