-- --------------------------------------------------------------------------------
-- Script to prepare convenience views to access uniform_resource.content column
-- as CCDA content, ensuring only valid JSON is processed.
-- --------------------------------------------------------------------------------

-- TODO: will this help performance?
-- CREATE INDEX IF NOT EXISTS idx_resource_type ON uniform_resource ((content ->> '$.resourceType'));
-- CREATE INDEX IF NOT EXISTS idx_bundle_entry ON uniform_resource ((json_type(content -> '$.entry')));

-- CCDA Discovery and Enumeration Views
-- --------------------------------------------------------------------------------

-- Summary of the uniform_resource table
-- Provides a count of total rows, valid JSON rows, invalid JSON rows,
-- and potential CCDA v4 candidates and bundles based on JSON structure.
DROP VIEW IF EXISTS uniform_resource_summary;
CREATE VIEW uniform_resource_summary AS
SELECT
    COUNT(*) AS total_rows,
    SUM(CASE WHEN json_valid(content) THEN 1 ELSE 0 END) AS valid_json_rows,
    SUM(CASE WHEN json_valid(content) THEN 0 ELSE 1 END) AS invalid_json_rows,
    SUM(CASE WHEN json_valid(content) AND content ->> '$.resourceType' IS NOT NULL THEN 1 ELSE 0 END) AS ccda_v4_candidates,
    SUM(CASE WHEN json_valid(content) AND json_type(content -> '$.entry') = 'array' THEN 1 ELSE 0 END) AS ccda_v4_bundle_candidates
FROM
    uniform_resource;


DROP VIEW IF EXISTS phimail_delivery_detail;
CREATE  VIEW phimail_delivery_detail AS
WITH json_data AS (
  SELECT
    uniform_resource_id,   
    json(content) AS content
  FROM
    uniform_resource
  WHERE
    nature = 'json'
    AND uri LIKE '%messageDeliveryStatus.json'
)
SELECT  
  substr(
    REPLACE(REPLACE(json_extract(value, '$.messageId'), '<', ''), '>', ''),
    instr(REPLACE(REPLACE(json_extract(value, '$.messageId'), '<', ''), '>', ''), '.') + 1
  ) AS direct_address,
  json_extract(value, '$.messageId') AS message_id,
  json_extract(value, '$.messageUId') AS message_uid,
  json_extract(value, '$.statusCode') AS status,
  json_extract(value, '$.recipient') AS recipient,
  value AS json_content
FROM
  json_data,
  json_each(json_data.content);

DROP VIEW IF EXISTS mail_content_detail;
CREATE  VIEW mail_content_detail AS
SELECT  
  json_extract(value, '$.recipient') AS recipient,
  json_extract(value, '$.sender') AS sender,
  -- Remove angle brackets from messageId
  REPLACE(REPLACE(json_extract(value, '$.messageId'), '<', ''), '>', '') AS message_id,
  json_extract(value, '$.messageUId') AS message_uid,  
  json_extract(value, '$.content.mimeType') AS content_mime_type,
  json_extract(value, '$.content.length') AS content_length,
  json_extract(value, '$.content.headers.date') AS content_date,
  json_extract(value, '$.content.headers.subject') AS content_subject,
  json_extract(value, '$.content.headers.from') AS content_from,
  json_extract(value, '$.content.headers.to') AS content_to,
  json_extract(value, '$.content.body') AS content_body,
  -- Extract first attachment details
  json_extract(value, '$.attachments[0].filename') AS attachment1_filename,
  json_extract(value, '$.attachments[0].mimeType') AS attachment1_mime_type,
  json_extract(value, '$.attachments[0].length') AS attachment1_length,
  json_extract(value, '$.attachments[0].desc') AS attachment1_desc,
  json_extract(value, '$.attachments[0].filePath') AS attachment1_file_path,
  json_extract(value, '$.status') AS status,
  -- Count the number of attachments
  json_array_length(json_extract(value, '$.attachments')) AS attachment_count
FROM
  uniform_resource,
  json_each(uniform_resource.content)
WHERE
  nature = 'json'
  AND uri LIKE '%_content.json';  


DROP VIEW IF EXISTS inbox;
CREATE VIEW inbox AS
SELECT 
  mcd.message_uid as id,
  mcd.content_from AS "from",
  mcd.recipient AS "to",
  mcd.content_subject AS subject,
  mcd.content_body AS content,
  mcd.content_date AS date,
  attachment_count as attachment_count
  
FROM 
  mail_content_detail mcd;



DROP VIEW IF EXISTS patient_detail;
CREATE VIEW patient_detail AS
SELECT
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.id.@extension') AS id,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.patient.name.given') AS first_name,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.patient.name.family') AS last_name,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.patient.administrativeGenderCode.@code') AS gender_code,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.patient.birthTime.@value') AS birthTime,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.addr.streetAddressLine') AS address,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.addr.city') AS city,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.addr.state') AS state,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.addr.postalCode') AS postalCode,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.addr.@use') AS addr_use, 
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.patient.raceCode.@displayName') AS race_displayName,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.patient.ethnicGroupCode.@displayName') AS ethnic_displayName,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.patient.languageCommunication.languageCode.@code') AS language_code
FROM
   uniform_resource_transform ;


DROP VIEW IF EXISTS patient_clinical_observation;
CREATE VIEW patient_clinical_observation AS
  with clinical_document as(
   SELECT
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.id.@extension') AS patient_id,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.patient.name.given') AS patient_first_name,
    json_extract(content, '$.ClinicalDocument.recordTarget.patientRole.patient.name.family') AS patient_last_name,
    json_extract(content, '$.ClinicalDocument.component.structuredBody.component[2].section.entry') AS json_data   
FROM
    uniform_resource_transform
 )   
 SELECT
    patient_id,    
    json_extract(json_data, '$.organizer.code.@displayName') AS observatin_name,    
    json_extract(value, '$.observation.code.@code') AS observation_code,
    json_extract(value, '$.observation.code.@displayName') AS observation_display_name,
    json_extract(value, '$.observation.value.@value') AS observation_value,
    json_extract(value, '$.observation.value.@unit') AS observation_unit,
    json_extract(json_data, '$.organizer.statusCode.@code') AS status_code,
    json_extract(json_data, '$.organizer.effectiveTime.low.@value') AS effective_time_low,
    json_extract(json_data, '$.organizer.effectiveTime.high.@value') AS effective_time_high,
    json_extract(value, '$.observation.effectiveTime.@value') AS observation_effective_time
FROM
    clinical_document,
    json_each(json_extract(json_data, '$.organizer.component'))
WHERE
    json_valid(json_data);
 