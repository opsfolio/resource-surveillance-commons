# `surveilr` Digital Health Patterns

- `stateless-fhir.surveilr.sql` script focuses on creating views that define how to extract and present specific FHIR data from the uniform_resource.content JSONB column. It does not modify or store any persistent data; it only sets up views for querying.
  `uniform_resource.content` as FHIR JSON
- `orchestrate-stateful-fhir.surveilr.sql` script is responsible for creating tables that cache the data extracted by the views. These tables serve as materialized views, allowing for faster access to the data. The tables are updated manually, and any changes in the source data will not be reflected until the tables are refreshed.

## Try it out

- Prepare a new directory (e.g. `/tmp/fhir-100`)
- [Download 100 Sample Synthetic Patient Records, FHIR R4 (Synthea)](https://synthetichealth.github.io/synthea-sample-data/downloads/latest/synthea_sample_data_fhir_latest.zip) and unzip into subdirectory of new directory `/tmp/fhir-100/ingest`
- [Download `surveilr`](https://docs.opsfolio.com/surveilr/how-to/installation-guide/) into new directory (`/tmp/fhir-100/surveilr`)

```bash
# prepare a destination
$ mkdir -p /tmp/fhir-100
$ cd /tmp/fhir-100
$ wget https://synthetichealth.github.io/synthea-sample-data/downloads/latest/synthea_sample_data_fhir_latest.zip
$ mkdir ingest && cd ingest && unzip ../synthea_sample_data_fhir_latest.zip && cd ..
$ ls -al

# ingest the files in the "ingest/" directory, creating resource-surveillance.sqlite.db
$ ./surveilr ingest files -r ingest/

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

# now try with `*_cached` tables ("materialized views") to notice that performance is better
$ cat orchestrate-stateful-fhir.surveilr.sql | sqlite3 resource-surveillance.sqlite.db
$ echo "select patient_id, first_name, last_name, birth_date from fhir_v4_bundle_resource_patient_cached" | sqlite3 resource-surveillance.sqlite.db -table
$ echo "select * from fhir_v4_patient_age_avg_cached" | sqlite3 resource-surveillance.sqlite.db -table
```

- Run `./surveilr ingest files -r ingest` to take all the JSON files and prepare an RSSD. Note new `resource-surveillance.sqlite.db` created file in the same directory

## TODO

- [ ] Review and consider language-agnostic
      [SQL-on-FHIR](https://build.fhir.org/ig/FHIR/sql-on-fhir-v2) _View
      Definitions_ as an approach to auto-generate _SQL views_. In GitHub see
      [SQL-on-FHIR Repo](https://github.com/FHIR/sql-on-fhir-v2)
      [Reference implementation of the SQL on FHIR spec in JavaScript](https://github.com/FHIR/sql-on-fhir-v2/tree/master/sof-js)
      for a technique to parse the _SQL-on-FHIR View Definitions_.
