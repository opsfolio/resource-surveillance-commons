# `surveilr` Digital Health Patterns

- `stateless-fhir.surveilr.sql` script focuses on creating views that define how
  to extract and present specific FHIR data from the `uniform_resource.content`
  JSONB column. It does not modify or store any persistent data; it only sets up
  views for querying.
- `orchestrate-stateful-fhir.surveilr.sql` script is responsible for creating
  tables that cache data extracted by views. These tables serve as "materialized
  views", allowing for faster access to the data but are static. When new data
  is ingested, the tables need to be dropped and recreated manually, and any
  changes in the source data will not be reflected until the tables are
  refreshed.

## Try it out on any device without this repo (if you're just using the SQL scripts)

Prepare the directory with sample files, download Synthea samples, download
`surveilr`, and create `resource-surveillance.sqlite.db` RSSD file that will
contain queryable FHIR data.

```bash
# prepare a working directory with files
$ mkdir -p /tmp/fhir-query
$ cd /tmp/fhir-query

# download and unzip sample Synthea FHIR JSON files
$ wget https://synthetichealth.github.io/synthea-sample-data/downloads/latest/synthea_sample_data_fhir_latest.zip
$ mkdir ingest && cd ingest && unzip ../synthea_sample_data_fhir_latest.zip && cd ..

# download surveilr using instructions at https://docs.opsfolio.com/surveilr/how-to/installation-guide
# then run the ingestion of files downloaded above
$ ./surveilr ingest files -r ingest/

# apply the FHIR views and create cached tables directly from GitHub
$ curl -L https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/pattern/digital-health/stateless-fhir.surveilr.sql | sqlite3 resource-surveillance.sqlite.db
$ curl -L https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/pattern/digital-health/orchestrate-stateful-fhir.surveilr.sql | sqlite3 resource-surveillance.sqlite.db

# use SQLPage to preview content (be sure `deno` v1.40 or above is installed)
$ deno run https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/pattern/digital-health/ux.sql.ts | sqlite3 resource-surveillance.sqlite.db
$ surveilr sqlpage --port 9000
# launch a browser and go to http://localhost:9000/fhir/index.sql
```

Once you ingest all the JSON using `surveilr`, apply
`orchestrate-stateful-fhir.surveilr.sql` and `stateless-fhir.surveilr.sql` all
content will be accessed through views or `*.cached` tables in
`resource-surveillance.sqlite.db`.

At this point you can rename the SQLite database file, archive it, use in
reporting tools, DBeaver, DataGrip, or any other SQLite data access tools.

## Try it out in this repo (if you're developing SQL scripts)

First prepare the directory with sample files:

```bash
$ cd pattern/digital-health
$ wget https://synthetichealth.github.io/synthea-sample-data/downloads/latest/synthea_sample_data_fhir_latest.zip
$ mkdir ingest && cd ingest && unzip ../synthea_sample_data_fhir_latest.zip && cd ..
```

The directory should look like this now:

```
.
├── ingest
│   ├── Abe604_Runolfsdottir785_3718b84e-cbe9-1950-6c6c-e6f4fdc907be.json
│   ├── ...(many more files)
│   └── Yon80_Kiehn525_54fe5c50-37cc-930b-8e3a-2c4e91bb6eec.json
├── orchestrate-stateful-fhir.surveilr.sql
├── stateless-fhir.surveilr.sql
└── synthea_sample_data_fhir_latest.zip
```

Now
[Download `surveilr` binary](https://docs.opsfolio.com/surveilr/how-to/installation-guide/)
into this directory, then ingest and query the data:

```bash
# ingest the files in the "ingest/" directory, creating resource-surveillance.sqlite.db
$ ./surveilr ingest files -r ingest/
```

After ingestion, you will only work with these files:

```
├── orchestrate-stateful-fhir.surveilr.sql
├── stateless-fhir.surveilr.sql 
└── resource-surveillance.sqlite.db            # SQLite database
```

Post-ingestion, `surveilr` is no longer required, the `ingest` directory can be
ignored, only `sqlite3` is required because all content is in the
`resource-surveillance.sqlite.db` SQLite database which does not require any
other dependencies.

```bash
# see how many files were ingested into `uniform_resource` table
$ echo "select count(*) from uniform_resource" | sqlite3 resource-surveillance.sqlite.db

# apply the "stateless" FHIR utility views and do some exploring
$ cat stateless-fhir.surveilr.sql | sqlite3 resource-surveillance.sqlite.db
$ echo "select * from uniform_resource_summary" | sqlite3 resource-surveillance.sqlite.db -table
$ echo "select * from fhir_v4_bundle_resource_summary" | sqlite3 resource-surveillance.sqlite.db -table

# work with Patient resources
$ echo "SELECT resource_content FROM fhir_v4_bundle_resource WHERE resource_type = 'Patient' LIMIT 1" | sqlite3 resource-surveillance.sqlite.db -table
$ echo "select patient_id, first_name, last_name, birth_date from fhir_v4_bundle_resource_patient" | sqlite3 resource-surveillance.sqlite.db -table
$ echo "select * from fhir_v4_patient_age_avg" | sqlite3 resource-surveillance.sqlite.db -table

# work with Observation resources
$ echo "SELECT resource_content FROM fhir_v4_bundle_resource WHERE resource_type = 'Observation' LIMIT 1" | sqlite3 resource-surveillance.sqlite.db -table
$ echo "select * from fhir_v4_bundle_resource_observation" | sqlite3 resource-surveillance.sqlite.db -table

# now try with `*_cached` tables ("materialized views") to notice that performance is better
$ cat orchestrate-stateful-fhir.surveilr.sql | sqlite3 resource-surveillance.sqlite.db
$ echo "select patient_id, first_name, last_name, birth_date from fhir_v4_bundle_resource_patient_cached" | sqlite3 resource-surveillance.sqlite.db -table
$ echo "select * from fhir_v4_patient_age_avg_cached" | sqlite3 resource-surveillance.sqlite.db -table

$ echo "SELECT id, lastUpdated, type_code, type_system, type_display, class_code, class_system, class_display, period_start, period_end, status, subject_display, subject_reference, location, diagnosis_reference FROM fhir_v4_bundle_resource_encounter_cached" | sqlite3 resource-surveillance.sqlite.db -table

$ echo "SELECT observation_id, status, category_system, category_code, category_display, code_system, code, code_display, subject_reference FROM fhir_v4_bundle_resource_observation_cached" | sqlite3 resource-surveillance.sqlite.db -table

$ echo "SELECT id, code, code_system, code_display, lastUpdated, subject_display, subject_reference, encounter_display FROM fhir_v4_bundle_resource_condition_cached" | sqlite3 resource-surveillance.sqlite.db -table

$ echo "SELECT id, lastUpdated, code, code_system, code_display, category_code, category_code_system, category_code_display, intent FROM fhir_v4_bundle_resource_ServiceRequest_cached" | sqlite3 resource-surveillance.sqlite.db -table

$ echo "SELECT id, code, lastUpdated, subject_display, subject_reference, bodySite, encounter_display, encounter_reference FROM fhir_v4_bundle_resource_procedure_cached" | sqlite3 resource-surveillance.sqlite.db -table

$ echo "SELECT id, lastUpdated, lineage_meta_data_url_0, lineage_meta_data_value_0, lineage_meta_data_url_1 FROM fhir_v4_bundle_resource_practitioner_cached" | sqlite3 resource-surveillance.sqlite.db -table

# use SQLPage to preview content (be sure `deno` v1.40 or above is installed)
$ deno run ./ux.sql.ts | sqlite3 resource-surveillance.sqlite.db
$ surveilr sqlpage --port 9000
# launch a browser and go to http://localhost:9000/fhir/index.sql

# in a separate shell you can use watch-and-reload-sql.sh
$ ../../support/bin/watch-and-reload-sql.sh
```

Once you apply `orchestrate-stateful-fhir.surveilr.sql` and
`stateless-fhir.surveilr.sql` you can ignore those files and all content will be
accessed through views or `*.cached` tables in
`resource-surveillance.sqlite.db`. At this point you can rename the SQLite
database file, archive it, use in reporting tools, DBeaver, DataGrip, or any
other SQLite data access tools.

## Automatically reloading SQL when it changes

On sandboxes during development and editing of `.sql` or `.sql.ts` you may want
to automatically re-load the contents into SQLite regularly. Since it can be
time-consuming to re-run the same command in the CLI manually each time a file
changes, you can use _watch mode_ instead.

See: [Using `watch-and-reload-sql.sh`](../../support/bin/sandbox-watch.md).

## TODO

- [ ] Review and consider language-agnostic
      [SQL-on-FHIR](https://build.fhir.org/ig/FHIR/sql-on-fhir-v2) _View
      Definitions_ as an approach to auto-generate _SQL views_. In GitHub see
      [SQL-on-FHIR Repo](https://github.com/FHIR/sql-on-fhir-v2)
      [Reference implementation of the SQL on FHIR spec in JavaScript](https://github.com/FHIR/sql-on-fhir-v2/tree/master/sof-js)
      for a technique to parse the _SQL-on-FHIR View Definitions_.
