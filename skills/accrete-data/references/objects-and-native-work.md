# Data objects and native work

## Contents

- Identity and content
- Choosing what to retain
- Collections and scientific representations
- Relations to other objects
- Reading and changing material

## Identity and content

Keep these descriptions distinct when interpreting a Data descriptor:

| Description | Meaning |
| --- | --- |
| Stable ID | The project object meant by later links. |
| Name or alias | A readable label that may change. |
| Content description | The intended file, collection, provider edition, or live source. |
| Origin | How the material arose: provider, extraction, generating Result, or explanation. |
| Location | A concrete filesystem or backend locator through which bytes may be accessed. |
| Availability observation | What was known about a location at a particular time. |
| `content.sha256` or manifest | Optional identification of a file's bytes or of explicitly scoped content. |
| Descriptor revision | The current metadata bytes used to detect conflicting edits. |

Two Data IDs may intentionally denote different products with identical bytes.
Storage deduplication does not merge their identities. Conversely, a path may
keep its spelling while its contents change. Naming a live path alone does
not identify what a historical activity consumed.

A closed object describes one intended content edition. Add locations and
correct metadata without changing that edition. If a numerical fix produces
different output, register a new object and relate it to the previous one.
A provider-native immutable version can identify an edition, described in
`content.edition`. Keep opaque backend tokens as supplied; an mtime or ETag is not a
SHA-256 content digest, and a backend version selector is not something generic
materialization will fetch.

The revision returned after a descriptor amendment serves optimistic editing.
It is separate from the content identity: adding an archive copy changes the
descriptor while leaving the scientific product unchanged.

## Choosing what to retain

Retain material that gives subsequent work something useful to reuse, inspect,
compare, or cite. A small diagnostic table may deserve a stable identity while
large regenerable intermediates remain Scratch. Existing provider data may
need an identity before any download. Compiler caches can remain ordinary
performance aids without becoming scientific Data.

No fixed size threshold, retention duration, or sequence of registration steps
applies to every project. Choose the smallest useful description. Examples of
reasonable choices include:

- Register an existing restart directory in place after the producer closes it.
- Register a provider's immutable dataset version and its remote locator.
- Preserve selected variables from a large simulation through a domain Tool,
  then register the selected product as new Data linked to its generating Result.
- Leave an exploratory plot in Scratch until it is useful to retain.
- Describe a mutable observational feed explicitly as live, with the version
  or extraction used by a particular Result when available.

Neither registration nor an archive locator proves that restoration will be
possible indefinitely. Availability descriptions are dated observations.

## Collections and scientific representations

A directory, a manifest-defined set, and a provider dataset version are useful
forms of Data. Preserve their native reading behavior. A Zarr collection need
not be converted into a tarball, and its chunks need not each become ACCRETE
objects. A domain reader understands array metadata and calendars; the Kernel
understands identity and location.

For output produced in stages, retain completed products independently when
useful. A multiyear simulation might produce one retained restart and one
diagnostic collection per completed year. A parent collection may link them;
the project need not adopt a universal Year/Run/Experiment hierarchy.

An open collection can acquire membership observations. A Result requiring
a fixed membership must identify the edition or manifest it used. Merely
adding a later partition to a changing directory does not retrospectively
change the set consumed by an earlier analysis.

The producer remains responsible for safe concurrent reading and completion
of its format. Registering a partly written HDF5 file cannot make it a usable
snapshot. Follow the scientific program's closure, flush, or snapshot behavior.

## Relations to other objects

Use Result input and output links to preserve how Data participated in an
activity. Data origin can name a generating Result where useful. A Model
describes the program; a Result describes a particular use of that program;
Data describes retained material. A Tool may perform extraction, comparison,
transfer preparation, or format conversion. Memory explains what the material
means for later decisions.

Keep supplied roles such as `initial_state`, `forcing`, `restart`, or
`diagnostics` as domain descriptions. They are not globally fixed Data classes.
Cross-host relations may be unresolved locally until their documents arrive.
Do not download a dataset merely to make its ID locally resolvable.

## Reading and changing material

Read small descriptors with ordinary file tools, and read content with the
appropriate scientific software. For default roots, useful starting points are:

```sh
rg 'restart|forcing|diagnostic' .accrete/objects
jq '.' /path/from/a/data-receipt.json
```

Replace the example path with the actual descriptor path. Use `sqlite3
-readonly` on the host-local index, at the path in `.local_state.index` from `accrete
config resolve --json`, for relational questions, after checking that its projection
covers the documents needed. Use native SQL schema discovery (`.schema`) instead of
assuming a column. A brief "database is locked" during a concurrent refresh means retry. `accrete index refresh` rebuilds a stale projection from small
documents; it does not reprocess scientific payloads.

Edit scientific source or working content with ordinary tools. Publish Data
registration and location changes with the Kernel. If directly editing managed
metadata is explicitly required, coordinate with other writers and run `accrete index
refresh` afterward. A direct file edit does not participate in the Kernel's local
concurrency protection.
