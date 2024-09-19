# Infra Assurance

The Infra Assurance project focuses on managing and overseeing assets and
portfolios within an organization. This project provides tools and processes to
ensure the integrity, availability, and effectiveness of assets and portfolios,
supporting comprehensive assurance and compliance efforts.

### Key Features

1. Assurance Data: Assurance data provided by
   netspective-infrastructure/assurance.
2. Assurance Display: The project provides a user-friendly interface to view the
   assurance data.
3. Uniform Resource Storage: Assurance data are saved and managed within the
   uniform_resource table for efficient retrieval and display.

# `surveilr` Infra Assurance Service Patterns

- `stateless-ia.surveilr.sql` script focuses on creating views that define how
  to extract and present specific assurance data from the
  `uniform_resource.content` JSONB column. It does not modify or store any
  persistent data; it only sets up views for querying.
- `orchestrate-stateful-ia.surveilr.sql` script is responsible for creating
  tables that cache data extracted by views. These tables serve as "materialized
  views", allowing for faster access to the data but are static. When new data
  is ingested, the tables need to be dropped and recreated manually, and any
  changes in the source data will not be reflected until the tables are
  refreshed.

After adding database, you will only work with these files:

```
├── orchestrate-stateful-ia.surveilr.sql
├── stateless-ia.surveilr.sql
└── resource-surveillance.sqlite.db            # SQLite database
```

```bash
# load the "Console" and other menu/routing utilities
$ deno run -A ./ux.sql.ts | sqlite3 resource-surveillance.sqlite.db

# if you want to start surveilr embedded SQLPage in "watch" mode to re-load files automatically
$ ../../support/bin/sqlpagectl.ts dev --watch . --watch ../../prime
# browse http://localhost:9000/ to see web UI

# if you want to start a standalone SQLPage in "watch" mode to re-load files automatically
$ ../../support/bin/sqlpagectl.ts dev --watch . --watch ../../prime --standalone
# browse http://localhost:9000/ to see web UI

# browse http://localhost:9000/dms/info-schema.sql to see DMS-specific
```

Once you apply `orchestrate-stateful-ia.surveilr.sql` and
`stateless-ia.surveilr.sql` you can ignore those files and all content will be
accessed through views or `*.cached` tables in
`resource-surveillance.sqlite.db`. At this point you can rename the SQLite
database file, archive it, use in reporting tools, DBeaver, DataGrip, or any
other SQLite data access tools.

## Automatically reloading SQL when it changes

On sandboxes during development and editing of `.sql` or `.sql.ts` you may want
to automatically re-load the contents into SQLite regularly. Since it can be
time-consuming to re-run the same command in the CLI manually each time a file
changes, you can use _watch mode_ instead.

See: [`sqlpagectl.ts`](../../support/bin/sqlpagectl.ts).

## Running Tests

To run the test cases for this project, use the following command:

```bash
deno test -A ./info_assurance_controls_test.ts
```
