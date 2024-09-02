# Infra Audit

The Infra Audit project is designed to manage and streamline audits across
various frameworks, including HIPAA, HITRUST, AICPA, and others. This project
provides a comprehensive platform for conducting, tracking, and reporting on
compliance audits, ensuring that your organization meets the necessary
regulatory requirements.


### Key Features

1. Tenant-Specific Audit Data: The audits section retrieves and displays audit data specific to each  tenant. This ensures that each tenant sees only their relevant information, providing a secure and tailored experience.
2. Comprehensive Audit Controls: The audits section includes a comprehensive set of controls, allowing tenants to manage their audit data efficiently.
3. Efficient Data Retrieval: The system is optimized for efficient data retrieval, ensuring that audit information is loaded quickly and accurately for each tenant.


# `surveilr` Infra Audits Service Patterns

- `stateless-ia.surveilr.sql` script focuses on creating views that define how
  to extract and present specific audit data from the db. It does not modify or store any
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
