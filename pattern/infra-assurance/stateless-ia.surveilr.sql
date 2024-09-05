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

DROP VIEW IF EXISTS boundary;
CREATE VIEW boundary AS
   SELECT 
    json_extract(outer.value, '$.a:Value.Properties.a:anyType[0].b:DisplayName') AS displayName,
    json_extract(inner.value, '$.b:Value.#text') AS name,
    json_extract(outer.value, '$.a:Value.@i:type') as type
FROM 
  uniform_resource_transform,
  json_each(json_extract(content, '$.ThreatModel.DrawingSurfaceList.DrawingSurfaceModel.Borders.a:KeyValueOfguidanyType')) AS outer,
  json_each(json_extract(outer.value, '$.a:Value.Properties.a:anyType')) AS inner
WHERE 
  json_array_length(json_extract(outer.value, '$.a:Value.Properties.a:anyType')) >= 2 AND json_extract(inner.value, '$.b:Value.#text')!="" 
  AND json_extract(outer.value, '$.a:Value.@i:type') = 'BorderBoundary' AND json_extract(inner.value, '$.b:Value.#text') LIKE '%Boundary';