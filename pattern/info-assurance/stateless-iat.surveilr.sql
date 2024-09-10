DROP VIEW IF EXISTS threat_model;

CREATE VIEW IF NOT EXISTS threat_model AS
WITH json_data AS (
    SELECT
        json_extract(threats.value, '$."a:Value"."b:Id"') AS "id",
        json_extract(threats.value, '$."a:Value"."b:ChangedBy"') AS "changed_by",
        json_extract(threats.value, '$."a:Value"."b:ModifiedAt"') AS "last_modified",
        json_extract(threats.value, '$."a:Value"."b:State"') AS "state",
        json_each.value AS kv_value
    FROM 
        uniform_resource_transform,
        json_each(json_extract(content, '$.ThreatModel.ThreatInstances."a:KeyValueOfstringThreatpc_P0_PhOB"')) AS threats,
        json_each(json_extract(threats.value, '$."a:Value"."b:Properties"."a:KeyValueOfstringstring"'))
)
SELECT
    id,
    MAX(CASE WHEN json_extract(kv_value, '$."a:Key"') = 'Title' THEN json_extract(kv_value, '$."a:Value"') END) AS "title",
    MAX(CASE WHEN json_extract(kv_value, '$."a:Key"') = 'UserThreatCategory' THEN json_extract(kv_value, '$."a:Value"') END) AS "category",
    MAX(CASE WHEN json_extract(kv_value, '$."a:Key"') = 'UserThreatShortDescription' THEN json_extract(kv_value, '$."a:Value"') END) AS "short_description",
    MAX(CASE WHEN json_extract(kv_value, '$."a:Key"') = 'UserThreatDescription' THEN json_extract(kv_value, '$."a:Value"') END) AS "description",
    MAX(CASE WHEN json_extract(kv_value, '$."a:Key"') = 'InteractionString' THEN json_extract(kv_value, '$."a:Value"') END) AS "interaction",
    MAX(CASE WHEN json_extract(kv_value, '$."a:Key"') = 'Priority' THEN json_extract(kv_value, '$."a:Value"') END) AS "priority",
    state,
    MAX(CASE WHEN json_extract(kv_value, '$."a:Key"') = 'StateInformation' THEN json_extract(kv_value, '$."a:Value"') END) AS "justification",
    "changed_by",
    "last_modified"
FROM
    json_data
GROUP BY
    id, "changed_by", "last_modified", state;

DROP VIEW IF EXISTS web_application;

CREATE VIEW IF NOT EXISTS web_application AS
SELECT DISTINCT
    json_extract(value, '$."a:Value".Properties."a:anyType"[1]."b:Value"."#text"') AS Title
FROM 
    uniform_resource_transform,
    json_each(json_extract(content, '$.ThreatModel.DrawingSurfaceList.DrawingSurfaceModel.Borders."a:KeyValueOfguidanyType"'))
WHERE  json_extract(value, '$."a:Value"."@i:type"') = 'StencilEllipse'
    AND json_extract(value, '$."a:Value".Properties."a:anyType"[0]."b:DisplayName"') = 'Web Application';

DROP VIEW IF EXISTS managed_application;

CREATE VIEW IF NOT EXISTS managed_application AS
SELECT DISTINCT
    json_extract(value, '$."a:Value".Properties."a:anyType"[1]."b:Value"."#text"') AS Title
FROM 
    uniform_resource_transform,
    json_each(json_extract(content, '$.ThreatModel.DrawingSurfaceList.DrawingSurfaceModel.Borders."a:KeyValueOfguidanyType"'))
WHERE  json_extract(value, '$."a:Value"."@i:type"') = 'StencilEllipse' 
    AND json_extract(value, '$."a:Value".Properties."a:anyType"[0]."b:DisplayName"') = 'Managed Application';
    
CREATE VIEW IF NOT EXISTS sql_database AS
SELECT DISTINCT
    json_extract(value, '$."a:Value".Properties."a:anyType"[1]."b:Value"."#text"') AS Title
FROM 
    uniform_resource_transform,
    json_each(json_extract(content, '$.ThreatModel.DrawingSurfaceList.DrawingSurfaceModel.Borders."a:KeyValueOfguidanyType"'))
WHERE  json_extract(value, '$."a:Value"."@i:type"') = 'StencilParallelLines'
    AND json_extract(value, '$."a:Value".Properties."a:anyType"[0]."b:DisplayName"') = 'SQL Database';

CREATE VIEW IF NOT EXISTS boundaries AS
SELECT 
    json_extract(value, '$."a:Value".Properties."a:anyType"[1]."b:Value"."#text"') AS boundary
FROM 
    uniform_resource_transform,
    json_each(json_extract(content, '$.ThreatModel.DrawingSurfaceList.DrawingSurfaceModel.Borders."a:KeyValueOfguidanyType"'))
WHERE json_extract(value, '$."a:Value"."@i:type"') = 'BorderBoundary'
    AND (json_extract(value, '$."a:Value".Properties."a:anyType"[0]."b:DisplayName"') = 'Other Browsers Boundaries' 
         OR json_extract(value, '$."a:Value".Properties."a:anyType"[0]."b:DisplayName"') = 'CorpNet Trust Boundary')
    AND json_extract(value, '$."a:Value".Properties."a:anyType"[1]."b:Value"."#text"') NOT LIKE '%.%.%.%';