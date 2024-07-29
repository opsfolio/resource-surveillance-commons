-- --------------------------------------------------------------------------------
-- Script to prepare convenience views to access uniform_resource.content column
-- as FHIR content, ensuring only valid JSON is processed.
-- --------------------------------------------------------------------------------

-- TODO: will this help performance?
-- CREATE INDEX IF NOT EXISTS idx_resource_type ON uniform_resource ((content ->> '$.resourceType'));
-- CREATE INDEX IF NOT EXISTS idx_bundle_entry ON uniform_resource ((json_type(content -> '$.entry')));

-- FHIR Discovery and Enumeration Views
-- --------------------------------------------------------------------------------

-- Summary of the uniform_resource table
-- Provides a count of total rows, valid JSON rows, invalid JSON rows,
-- and potential FHIR v4 candidates and bundles based on JSON structure.
DROP VIEW IF EXISTS uniform_resource_summary;
CREATE VIEW uniform_resource_summary AS
SELECT
    COUNT(*) AS total_rows,
    SUM(CASE WHEN json_valid(content) THEN 1 ELSE 0 END) AS valid_json_rows,
    SUM(CASE WHEN json_valid(content) THEN 0 ELSE 1 END) AS invalid_json_rows,
    SUM(CASE WHEN json_valid(content) AND content ->> '$.resourceType' IS NOT NULL THEN 1 ELSE 0 END) AS fhir_v4_candidates,
    SUM(CASE WHEN json_valid(content) AND json_type(content -> '$.entry') = 'array' THEN 1 ELSE 0 END) AS fhir_v4_bundle_candidates
FROM
    uniform_resource;

-- Identifies FHIR v4 candidates in the uniform_resource table
-- Extracts potential FHIR v4 resources and determines if they are bundles.
DROP VIEW IF EXISTS fhir_v4_candidate;
CREATE VIEW fhir_v4_candidate AS
SELECT
    *,
    content ->> '$.resourceType' AS resource_type,
    CASE WHEN json_type(content -> '$.entry') = 'array' THEN 1 ELSE 0 END AS is_bundle
FROM
    uniform_resource
WHERE
    json_valid(content)
    AND content ->> '$.resourceType' IS NOT NULL;

-- Extracts bundle information from FHIR v4 candidates
-- Lists each bundle ID and the resource type contained within the bundles.
DROP VIEW IF EXISTS fhir_v4_bundle_resource;
CREATE VIEW fhir_v4_bundle_resource AS
SELECT
    content ->> '$.id' AS bundle_id,
    entry.value ->> '$.resource.resourceType' AS resource_type,
    entry.value AS resource_content
FROM
    fhir_v4_candidate,
    json_each(content -> '$.entry') AS entry
WHERE
    is_bundle = 1;

-- Summarizes resource types found in FHIR bundles
-- Counts the total number of each resource type present in the bundles.
DROP VIEW IF EXISTS fhir_v4_bundle_resource_summary;
CREATE VIEW fhir_v4_bundle_resource_summary AS
SELECT
    resource_type,
    COUNT(*) AS total_resource_count
FROM
    fhir_v4_bundle_resource
GROUP BY
    resource_type
ORDER BY
    total_resource_count DESC;

-- FHIR Content Views
-- --------------------------------------------------------------------------------

-- Extracts Patient resources from FHIR bundles
-- Provides details about each patient, such as ID, name, gender, birth date, and address.
DROP VIEW IF EXISTS fhir_v4_bundle_resource_patient;
CREATE VIEW fhir_v4_bundle_resource_patient AS
WITH patient_resources AS (
    SELECT
        resource_content
    FROM
        fhir_v4_bundle_resource
    WHERE
        resource_type = 'Patient'
)
SELECT
    resource_content ->> '$.resource.id' AS patient_id,
    resource_content ->> '$.resource.name[0].given[0]' AS first_name,
    resource_content ->> '$.resource.name[0].family' AS last_name,
    resource_content ->> '$.resource.gender' AS gender,
    CASE 
        WHEN resource_content ->> '$.resource.birthDate' IS NOT NULL THEN DATE(resource_content ->> '$.resource.birthDate')
        ELSE NULL
    END AS birth_date,
    resource_content ->> '$.resource.address[0].line[0]' AS address_line,
    resource_content ->> '$.resource.address[0].city' AS city,
    resource_content ->> '$.resource.address[0].state' AS state,
    resource_content ->> '$.resource.address[0].postalCode' AS postal_code,
    resource_content ->> '$.resource.address[0].country' AS country
FROM
    patient_resources;

-- Calculates the average age of patients
-- Uses the birth date from the FHIR Patient resources to compute the average age.
DROP VIEW IF EXISTS fhir_v4_patient_age_avg;
CREATE VIEW fhir_v4_patient_age_avg AS
WITH patient_birth_dates AS (
    SELECT
        birth_date
    FROM
        fhir_v4_bundle_resource_patient
    WHERE
        birth_date IS NOT NULL
)
SELECT
    AVG((julianday('now') - julianday(birth_date)) / 365.25) AS average_age
FROM
    patient_birth_dates;



-- Extracts Encounter resources from FHIR bundles
-- Provides details about each Encounter resources.
DROP VIEW IF EXISTS fhir_v4_bundle_resource_encounter;
CREATE VIEW fhir_v4_bundle_resource_encounter AS
    WITH Encounter_resources AS (
    SELECT
        resource_content
    FROM
        fhir_v4_bundle_resource
    WHERE
        resource_type = 'Encounter'
)
SELECT
    resource_content ->> '$.resource.id' id,
resource_content ->> '$.resource.meta.lastUpdated' lastUpdated,
resource_content ->> '$.resource.type[0].coding.code' type_code,
resource_content ->> '$.resource.type[0].coding.system' type_system,
resource_content ->> '$.resource.type[0].coding.display' type_display,
resource_content ->> '$.resource.class.code' class_code,
resource_content ->> '$.resource.class.system' class_system,
resource_content ->> '$.resource.class.display' class_display,
resource_content ->> '$.resource.period.start' period_start,
resource_content ->> '$.resource.period.end' period_end,
resource_content ->> '$.resource.status' status,
resource_content ->> '$.resource.subject.display' subject_display,
resource_content ->> '$.resource.subject.reference' subject_reference,
resource_content ->> '$.resource.location[0].location' location,
resource_content ->> '$.resource.diagnosis[0].reference' diagnosis_reference,
resource_content ->> '$.resource.extension[0].lineage meta data[0].url' extension_url,
resource_content ->> '$.resource.extension[0].lineage meta data[0].valueString' extension_valueString,
resource_content ->> '$.resource.identifier[0].value' identifier_value,
resource_content ->> '$.resource.reasonCode[0].coding.code' reasonCode_code,
resource_content ->> '$.resource.reasonCode[0].coding.system' reasonCode_system,
resource_content ->> '$.resource.serviceType.coding[0].code' serviceType_code,
resource_content ->> '$.resource.serviceType.coding[0].system' serviceType_system,
resource_content ->> '$.resource.hospitalization.admitSource.coding.code' admitSource_code,
resource_content ->> '$.resource.hospitalization.dischargeDisposition.coding[0].code' dischargeDisposition_code,
resource_content ->> '$.reasonReference[0].reference' reasonReference_reference,
resource_content ->> '$.resourceType' resourceType
FROM
    Encounter_resources;
 
 
   
   
-- Extracts Condition resources from FHIR bundles
-- Provides details about each Condition resources.
   
   DROP VIEW IF EXISTS fhir_v4_bundle_resource_condition;
CREATE VIEW fhir_v4_bundle_resource_condition AS
  WITH condition_resources AS (
    SELECT
        resource_content
    FROM
        fhir_v4_bundle_resource
    WHERE
        resource_type = 'Condition'
)
  SELECT
  resource_content ->> '$.resource.id' id,
  resource_content ->> '$.resource.code.coding[0].code' code,
  resource_content ->> '$.resource.code.coding[0].system' code_system,
  resource_content ->> '$.resource.code.coding[0].display' code_display,
  resource_content ->> '$.resource.meta.lastUpdated' lastUpdated,
  resource_content ->> '$.resource.subject.display' subject_display,
  resource_content ->> '$.resource.subject.reference' subject_reference,
  resource_content ->> '$.resource.encounter.display' encounter_display,
  resource_content ->> '$.resource.encounter.reference' encounter_reference,
  resource_content ->> '$.resource.onsetDateTime' onsetDateTime,
  resource_content ->> '$.resource.Slices for category.category:us-core.coding[0].code' category_code,
  resource_content ->> '$.resource.Slices for category.category:us-core.coding[0].system' category_system
FROM
   condition_resources;
  
 DROP VIEW IF EXISTS fhir_v4_bundle_resource_ServiceRequest;
CREATE VIEW fhir_v4_bundle_resource_ServiceRequest AS
  WITH servicerequest_resources AS (
    SELECT
        resource_content
    FROM
        fhir_v4_bundle_resource
    WHERE
        resource_type = 'ServiceRequest'
)
 SELECT
  resource_content ->> '$.resource.id' id,
  resource_content ->> '$.resource.meta.lastUpdated' lastUpdated,
  resource_content ->> '$.resource.code.coding[0].code' code,
  resource_content ->> '$.resource.code.coding[0].system' code_system,
  resource_content ->> '$.resource.code.coding[0].display' code_display,
  resource_content ->> '$.resource.category.coding[0].code' category_code,
  resource_content ->> '$.resource.category.coding[0].system' category_code_system,
  resource_content ->> '$.resource.category.coding[0].display' category_code_display,    
  resource_content ->> '$.resource.intent' intent,
  resource_content ->> '$.resource.status' status,
  resource_content ->> '$.resource.subject.display' subject_display,
  resource_content ->> '$.resource.subject.reference' subject_reference,
  resource_content ->> '$.resource.encounter.display' encounter_display,
  resource_content ->> '$.resource.encounter.reference' encounter_reference,
  resource_content ->> '$.resource.occurrencePeriod.start' occurrencePeriod_start,
  resource_content ->> '$.resource.occurrencePeriod.end' occurrencePeriod_end,
  resource_content ->> '$.resource.occurrenceDateTime' occurrenceDateTime
FROM
     servicerequest_resources;


-- Extracts Procedure resources from FHIR bundles
-- Provides details about each Procedure resources.

CREATE VIEW fhir_v4_bundle_resource_procedure AS
WITH procedure_resources AS (
    SELECT
        resource_content
    FROM
        fhir_v4_bundle_resource
    WHERE
        resource_type = 'Procedure'
)
SELECT
    resource_content->>'$.resource.id' AS id,
    resource_content->>'$.resource.code.coding[0].code' AS code,
    resource_content->>'$.resource.meta.lastUpdated' AS lastUpdated,
    resource_content->>'$.resource.subject.display' AS subject_display,
    resource_content->>'$.resource.subject.reference' AS subject_reference,
    resource_content->>'$.resource.bodySite.coding[0].code' AS bodySite,
    resource_content->>'$.resource.encounter.display' AS encounter_display,
    resource_content->>'$.resource.encounter.reference' AS encounter_reference,
    resource_content->>'$.resource.extension[0].lineage_meta_data[0].url' AS lineage_meta_data_url,
    resource_content->>'$.resource.extension[0].lineage_meta_data[0].valueString' AS lineage_meta_data_value,
    resource_content->>'$.resource.performer[0].actor[0].reference' AS performer_reference,
    resource_content->>'$.resource.performer[0].actor[0].display' AS performer_display,
    resource_content->>'$.resource.identifier[0].value' AS identifier_value_0,
    resource_content->>'$.resource.identifier[1].value' AS identifier_value_1,
    resource_content->>'$.resource.identifier[2].value' AS identifier_value_2,
    resource_content->>'$.resource.identifier[3].value' AS identifier_value_3,
    resource_content->>'$.resource.identifier[4].value' AS identifier_value_4,
    resource_content->>'$.resource.performedDateTime' AS performedDateTime
FROM procedure_resources;