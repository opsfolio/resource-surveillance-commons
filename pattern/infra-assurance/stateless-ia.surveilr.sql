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

DROP VIEW IF EXISTS border_boundary;
CREATE VIEW border_boundary AS
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

DROP VIEW IF EXISTS asset_service_view;
CREATE VIEW asset_service_view AS
SELECT
  asser.name,ast.name as server,ast.organization_id,astyp.value as asset_type,astyp.asset_service_type_id,bnt.name as boundary,asser.description,asser.port,asser.experimental_version,asser.production_version,asser.latest_vendor_version,asser.resource_utilization,asser.log_file,asser.url,
  asser.vendor_link,asser.installation_date,asser.criticality,o.name AS owner,sta.value as tag, ast.criticality as asset_criticality,ast.asymmetric_keys_encryption_enabled as asymmetric_keys,
  ast.cryptographic_key_encryption_enabled as cryptographic_key,ast.symmetric_keys_encryption_enabled as symmetric_keys
  FROM asset_service asser
  INNER JOIN asset_service_type astyp ON astyp.asset_service_type_id = asser.asset_service_type_id
  INNER JOIN asset ast ON ast.asset_id = asser.asset_id
  INNER JOIN organization o ON o.organization_id=ast.organization_id
  INNER JOIN asset_status sta ON sta.asset_status_id=ast.asset_status_id
  INNER JOIN boundary bnt ON bnt.boundary_id=ast.boundary_id;

DROP VIEW IF EXISTS server_data;
CREATE VIEW server_data AS
WITH base_query AS (
    SELECT 
        ur.device_id,  
        d.name AS device_name,
        CASE 
            WHEN json_extract(outer.value, '$.name') LIKE '/%' 
            THEN substr(json_extract(outer.value, '$.name'), 2) 
            ELSE json_extract(outer.value, '$.name') 
        END AS displayName,
        json_extract(outer.value, '$.status') as status
    FROM 
        uniform_resource AS ur
        JOIN device AS d ON ur.device_id = d.device_id,
        json_each(ur.content) AS outer
    WHERE 
        ur.nature = 'json' 
        AND ur.uri = 'listContainers'
)
SELECT 
    av.*,bq.status
FROM 
    base_query bq
JOIN 
    asset_service_view av 
ON 
    av.name = bq.displayName 
    AND av.server LIKE '%' || bq.device_name || '%';
