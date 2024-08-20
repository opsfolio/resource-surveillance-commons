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

DROP VIEW IF EXISTS policy;
CREATE VIEW IF NOT EXISTS policy AS
        WITH rankedpolicies AS
          (SELECT u.uniform_resource_id,
          u.device_id,
          u.uri,
          u.content_digest,
          u.nature,
          u.size_bytes,
          u.last_modified_at,
          Json_extract(u.frontmatter, '$.title') AS title,
          Json_extract(u.frontmatter, '$.description') AS description,
          Json_extract(u.frontmatter, '$.publishDate') AS publishDate,
          Json_extract(u.frontmatter, '$.publishBy') AS publishBy,
          Json_extract(u.frontmatter, '$.classification') AS classification,
          Json_extract(u.frontmatter, '$.documentVersion') AS documentVersion,
          Json_extract(u.frontmatter, '$.documentType') AS documentType,
          Json_extract(u.frontmatter, '$.approvedBy') AS approvedBy,
          json_each.value AS fii,
          u.created_at,
          u.updated_at,
          Row_number()
          OVER (partition BY u.uri, json_each.value ORDER BY u.last_modified_at DESC) AS rn
          FROM  uniform_resource u,
          Json_each(Json_extract(u.frontmatter, '$.satisfies'))
          WHERE  u.nature = 'md' OR u.nature = 'mdx')
        SELECT uniform_resource_id,
          device_id,
          uri,
          content_digest,
          nature,
          size_bytes,
          last_modified_at,
          title,
          description,
          publishdate,
          publishby,
          classification,
          documentversion,
          documenttype,
          approvedby,
          fii,
          created_at,
          updated_at
        FROM rankedpolicies
        WHERE rn = 1;