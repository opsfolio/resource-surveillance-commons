-- ---------------------------------------------------------------------------------
-- Script to extract, denormalize, and cache FHIR data from JSONB in surveilr RSSDs.
-- ---------------------------------------------------------------------------------
-- This "stateful" pattern assumes that "stateless" views have been created which 
-- capture logic that might be slow to query so tables are created which act like
-- materialized views.
-- ---------------------------------------------------------------------------------

-- This table caches the denormalized patient data extracted from the fhir_v4_patient view.
-- The data is stored in a static form, meaning updates to the original JSON data
-- will not reflect here unless the data is refreshed manually.
-- The table structure and data are directly taken from the fhir_v4_patient view.
DROP TABLE IF EXISTS fhir_v4_patient_cached;
CREATE TABLE fhir_v4_patient_cached AS SELECT * ROM fhir_v4_patient;

-- This table caches the average age of patients as calculated from the fhir_v4_patient_age_avg view.
-- The data is stored in a static form, meaning updates to the original JSON data
-- will not reflect here unless the data is refreshed manually.
DROP TABLE IF EXISTS fhir_v4_patient_age_avg_cached;
CREATE TABLE fhir_v4_patient_age_avg_cached AS SELECT * FROM fhir_v4_patient_age_avg;
