-- ---------------------------------------------------------------------------------
-- Script to extract, denormalize, and cache FHIR data from JSONB in surveilr RSSDs.
-- ---------------------------------------------------------------------------------
-- This "stateful" pattern assumes that "stateless" views have been created which 
-- capture logic that might be slow to query so tables are created which act like
-- materialized views.
-- ---------------------------------------------------------------------------------

-- Cache for the fhir_v4_bundle_resource_patient view.
-- Caches detailed information about Patient resources extracted from FHIR bundles.
DROP TABLE IF EXISTS fhir_v4_bundle_resource_patient_cached;
CREATE TABLE fhir_v4_bundle_resource_patient_cached AS 
  SELECT * FROM fhir_v4_bundle_resource_patient;

-- Calculates the average age of patients
-- Uses the birth date from the cached FHIR Patient resources to compute the average age with better performance.
DROP VIEW IF EXISTS fhir_v4_patient_age_avg_cached;
CREATE VIEW fhir_v4_patient_age_avg_cached AS
WITH patient_birth_dates AS (
    SELECT
        birth_date
    FROM
        fhir_v4_bundle_resource_patient_cached
    WHERE
        birth_date IS NOT NULL
)
SELECT
    AVG((julianday('now') - julianday(birth_date)) / 365.25) AS average_age
FROM
    patient_birth_dates;


-- TODO: add indexes to help improve performance
