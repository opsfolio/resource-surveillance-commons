-- --------------------------------------------------------------------------------
-- Script to prepare convenience views to access uniform_resource.content column
-- as FHIR content.
-- --------------------------------------------------------------------------------

-- Create the fhir_v4_patient view
-- This view extracts common patient-related data from the JSONB `content` column
-- in the `uniform_resource` table. The FHIR Patient resource typically includes
-- fields such as id, name, gender, birthDate, and address.
--
-- JSON paths used in the view:
-- - `$.id`             : Extracts the patient ID
-- - `$.name[0].given[0]`: Extracts the first given name
-- - `$.name[0].family`  : Extracts the family name (last name)
-- - `$.gender`         : Extracts the gender of the patient
-- - `$.birthDate`      : Extracts the birth date
-- - `$.address[0].line[0]`: Extracts the first line of the address
-- - `$.address[0].city`    : Extracts the city
-- - `$.address[0].state`   : Extracts the state
-- - `$.address[0].postalCode`: Extracts the postal code
-- - `$.address[0].country`  : Extracts the country
DROP VIEW IF EXISTS fhir_v4_patient;
CREATE VIEW fhir_v4_patient AS
SELECT
    json_extract(value, '$.id') AS patient_id,
    json_extract(value, '$.name[0].given[0]') AS first_name,
    json_extract(value, '$.name[0].family') AS last_name,
    json_extract(value, '$.gender') AS gender,
    json_extract(value, '$.birthDate') AS birth_date,
    json_extract(value, '$.address[0].line[0]') AS address_line,
    json_extract(value, '$.address[0].city') AS city,
    json_extract(value, '$.address[0].state') AS state,
    json_extract(value, '$.address[0].postalCode') AS postal_code,
    json_extract(value, '$.address[0].country') AS country
FROM
    uniform_resource,
    json_each(json_extract(content, '$.entry')) AS entries(value)
WHERE
    json_extract(value, '$.resourceType') = 'Patient';

-- This view calculates the average age of patients found in the JSONB `content` column.
-- * The average age is computed using the birth date from the FHIR Patient resources.
-- * This view is not super useful but it does demonstrate how to create business-logic-specific
--   views that can handle particular business rules.
DROP VIEW IF EXISTS fhir_v4_patient_age_avg;
CREATE VIEW fhir_v4_patient_age_avg AS
WITH patient_birth_dates AS (
    SELECT
        json_extract(value, '$.birthDate') AS birth_date
    FROM
        uniform_resource,
        json_each(json_extract(content, '$.entry')) AS entries(value)
    WHERE
        json_extract(value, '$.resourceType') = 'Patient'
)
SELECT
    AVG((julianday('now') - julianday(birth_date)) / 365.25) AS average_age
FROM
    patient_birth_dates
WHERE
    birth_date IS NOT NULL;
