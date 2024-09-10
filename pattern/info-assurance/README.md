# Infra Controls

The Infra Controls project is designed to manage and implement controls specific
to various audit requirements, such as CC1001, CC1002, and others. This project
provides a platform for defining, applying, and tracking the effectiveness of
these controls, ensuring that your organization meets the necessary standards
for audit compliance.

### Key Features

1. Controls Ingestion: Controls are automatically ingested from csv files
   provided by Opsfolio tenants.
2. Controls Display: The project provides a user-friendly interface to view the
   ingested controls.
3. Uniform Resource Storage: All ingested controls are saved and managed within
   the uniform_resource table for efficient retrieval and display.

# `surveilr` Infra Policy Service Patterns

- `stateless-ic.surveilr.sql` script focuses on creating views that define how
  to extract and present specific policy data from the
  `uniform_resource.content` JSONB column. It does not modify or store any
  persistent data; it only sets up views for querying.
- `orchestrate-stateful-ic.surveilr.sql` script is responsible for creating
  tables that cache data extracted by views. These tables serve as "materialized
  views", allowing for faster access to the data but are static. When new data
  is ingested, the tables need to be dropped and recreated manually, and any
  changes in the source data will not be reflected until the tables are
  refreshed.

After adding database, you will only work with these files:

```
├── orchestrate-stateful-ic.surveilr.sql
├── stateless-ic.surveilr.sql
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

Once you apply `orchestrate-stateful-ic.surveilr.sql` and
`stateless-ic.surveilr.sql` you can ignore those files and all content will be
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
