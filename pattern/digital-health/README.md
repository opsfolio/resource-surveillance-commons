# `surveilr` Digital Health Patterns

- `stateless-fhir.surveilr.sql` creates "stateless" views that allow querying of
  `uniform_resource.content` as FHIR JSON
- `orchestrate-stateful-fhir.surveilr.sql` uses "stateless" views from
  `stateless-fhir.surveilr.sql` to create `*_cached` tables which creates a
  denormalized "static" table from the views to improve performance for larger
  datasets

## TODO

- [ ] Review and consider language-agnostic
      [SQL-on-FHIR](https://build.fhir.org/ig/FHIR/sql-on-fhir-v2) _View
      Definitions_ as an approach to auto-generate _SQL views_. In GitHub see
      [SQL-on-FHIR Repo](https://github.com/FHIR/sql-on-fhir-v2)
      [Reference implementation of the SQL on FHIR spec in JavaScript](https://github.com/FHIR/sql-on-fhir-v2/tree/master/sof-js)
      for a technique to parse the _SQL-on-FHIR View Definitions_.
