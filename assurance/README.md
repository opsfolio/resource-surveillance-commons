# `surveilr` End-to-End Quality Assurance Patterns

These are SQL scripts executed against `surveilr` after ingesting or orchestrating real world data to test the whole `surbeilr` flow as user/customer would. These are done by creating views on top of the existing data and then executing the scripts. The results are confirmed by using the TAP protocol to print out the expected results against the actual results in the DB.

1. File Ingestions
   - Run `surveilr ingest files --stats` and to confirm, check [this](./ingest-files.sql)
   - Multitenancy with `parties` and `orgs`, execute `surveilr ingest files --tenant-name "timur" --tenant-id "tenant_2"` but this [file](./ingest-files-multitenancy.sql).