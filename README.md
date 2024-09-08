# Resource Surveillance Commons (`RSC`)

`RSC`, also known as `surveilr-commons`, houses reusable and common
[Resource Surveillance](https://www.opsfolio.com/surveilr) (`surveilr`)
patterns.

- [`prime`](./prime) contains assets that `surveilr` uses for "Console", general
  navigation, and other "universal helpers" (content and pages that work across
  `surveilr`-based applications)
- `pattern` shares common and reusable content for different industries,
  disciplines, and use cases
  - [`digital-health`](./pattern/digital-health) shares patterns for HL7 FHIR
    and other typical healthcare use cases
  - [`privacy`](./pattern/privacy) shares patterns for anonymization and
    de-identification
- [`service`](./service) contains assets that bespoke `surveilr`-based apps and
  services depend on
- [`assurance`](./assurance) contains assets that `surveilr` uses for end-to-end
  (`e2e`) tests

## Watching and reloading `.sql`, `.sql.ts`, etc. for idempotent files

Because SQL files must be re-loaded regularly into SQLite (or PostgreSQL) you
will want to use something like [`watchexec`](https://github.com/watchexec/watchexec)
to automate that process.

You'll want to ensure that all your `.sql` and `.sql.ts` output is idempotent and 
then set up `watchexec-cli` to monitor three types of files:
- `.sql`: Loads SQL files into an SQLite database or runs SQLPage.
- `.psql`: Loads SQL files into a PostgreSQL database.
- `.sql.ts`: Executes TypeScript files via Deno and pipes their output into PostgreSQL.

```bash
watchexec --shell bash -w . \
    -e sql -r -- "sqlite3 database.sqlite.db < {}" \
    -e sql.ts -r -- "deno run -A {} | sqlite3 database.sqlite.db" \
    -e psql -r -- "psql -f {}" \
    -e psql.ts -r -- "deno run -A {} | psql"
```

### Specific Workflow: SQL, TypeScript, SQLite, and SQLPage

To watch for changes in `.sql` and `.sql.ts` files, automatically load them into an SQLite database, and then rerun the `sqlpage` command:

```bash
watchexec --shell bash -w . \
    -e sql -r -- "sqlite3 database.sqlite.db < {} && sqlpage database.sqlite.db" \
    -e sql.ts -r -- "deno run -A {} | sqlite3 database.sqlite.db && sqlpage database.sqlite.db"
```

- **For `.sql` files**: 
  - Loads the `.sql` file into SQLite using `sqlite3`.
  - After loading, runs `sqlpage` to regenerate the SQLPage output.

- **For `.sql.ts` files**:
  - Runs the TypeScript file with `deno run`.
  - Pipes the output into the SQLite database.
  - After loading, runs `sqlpage` to regenerate the SQLPage output.

