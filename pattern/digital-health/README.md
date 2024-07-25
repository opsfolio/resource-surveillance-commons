# `surveilr` Digital Health Patterns

- `stateless-fhir.surveilr.sql` creates "stateless" views that allow querying of
  `uniform_resource.content` as FHIR JSON
- `orchestrate-stateful-fhir.surveilr.sql` uses "stateless" views from
  `stateless-fhir.surveilr.sql` to create `*_cached` tables which creates a
  denormalized "static" table from the views to improve performance for larger
  datasets
