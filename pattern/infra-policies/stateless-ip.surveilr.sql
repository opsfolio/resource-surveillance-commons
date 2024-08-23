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

DROP VIEW IF EXISTS policy_dashboard;
CREATE VIEW policy_dashboard AS
    WITH RECURSIVE split_uri AS (
        SELECT
            uniform_resource_id,
            frontmatter->>'title' AS title,
            uri,
            substr(uri, instr(uri, 'src/') + 4, instr(substr(uri, instr(uri, 'src/') + 4), '/') - 1) AS segment,
            substr(substr(uri, instr(uri, 'src/') + 4), instr(substr(uri, instr(uri, 'src/') + 4), '/') + 1) AS rest,
            1 AS level
        FROM uniform_resource
        WHERE instr(uri, 'src/') > 0 AND  instr(substring(uri,instr(uri, 'src/')),'_')=0 
        UNION ALL
        SELECT
            uniform_resource_id,
            title,
            uri,
            substr(rest, 1, instr(rest, '/') - 1) AS segment,
            substr(rest, instr(rest, '/') + 1) AS rest,
            level + 1
        FROM split_uri
        WHERE instr(rest, '/') > 0 AND instr(substring(uri,instr(uri, 'src/')),'_')=0
    ),
    final_segment AS (
        SELECT DISTINCT
            uniform_resource_id,
            title,
            segment,
            substr(uri, instr(uri, 'src/')) AS url,
            CASE WHEN instr(rest, '/') = 0 THEN 0 ELSE 1 END AS is_folder
        FROM split_uri
        WHERE level = 4 AND instr(rest, '/') = 0
    )
    SELECT
        uniform_resource_id,
        title,
        segment,
        url
    FROM final_segment
    WHERE url LIKE '%.md' OR url LIKE '%.mdx'
    GROUP BY segment
    ORDER BY is_folder ASC, segment ASC;

DROP VIEW IF EXISTS policy_detail;
CREATE VIEW policy_detail AS
    SELECT uniform_resource_id,uri,content_fm_body_attrs, content, nature FROM uniform_resource;

DROP VIEW IF EXISTS policy_list;
CREATE VIEW policy_list AS
    WITH RECURSIVE split_uri AS (
    -- Initial split to get the first segment after 'src/'
    SELECT
        uniform_resource_id,
        frontmatter->>'title' AS title,
        uri,
        last_modified_at,
        null as parentfolder,
        substr(uri, instr(uri, 'src/') + 4, instr(substr(uri, instr(uri, 'src/') + 4), '/') - 1) AS segment1,
        substr(substr(uri, instr(uri, 'src/') + 4), instr(substr(uri, instr(uri, 'src/') + 4), '/') + 1) AS rest,
        1 AS level
    FROM uniform_resource
    WHERE instr(uri, 'src/') > 0 AND instr(substr(uri, instr(uri, 'src/')), '_') = 0 and  content not LIKE  '%Draft: true%'
    UNION ALL
    SELECT
    uniform_resource_id,
    title,
        uri,
        last_modified_at,
         CASE
	        WHEN level = 4 THEN segment1
	        WHEN level = 5 THEN segment1
	        WHEN level = 6 THEN segment1
	        WHEN level = 7 THEN segment1
        END AS parentfolder,
        CASE
	        WHEN level = 1 THEN substr(rest, 1, instr(rest, '/') - 1)
	        WHEN level = 2 THEN substr(rest, 1, instr(rest, '/') - 1)
	        WHEN level = 3 THEN substr(rest, 1, instr(rest, '/') - 1)
	        WHEN level = 4 THEN substr(rest, 1, instr(rest, '/') - 1)
	        WHEN level = 5 THEN substr(rest, 1, instr(rest, '/') - 1)
	        WHEN level = 6 THEN substr(rest, 1, instr(rest, '/') - 1)
	        WHEN level = 7 THEN substr(rest, 1, instr(rest, '/') - 1)
	        WHEN level = 8 THEN substr(rest, 1, instr(rest, '/') - 1)
            ELSE segment1
        END AS segment1,
        CASE 
            WHEN instr(rest, '/') > 0 THEN substr(rest, instr(rest, '/') + 1)
            ELSE ''
        END AS rest,
        level + 1
    FROM split_uri
    WHERE rest != '' AND instr(substr(uri, instr(uri, 'src/')), '_') = 0
),
latest_entries AS (
            SELECT
              uri,
              MAX(last_modified_at) AS latest_last_modified_at
            FROM
              uniform_resource
            GROUP BY
              uri
        )
Select  distinct substr(ss.uri, instr(ss.uri, 'src/')) AS url,ss.title,ss.parentfolder,ss.segment1,ss.rest,ss.last_modified_at,ss.uniform_resource_id
from split_uri ss
JOIN 
 latest_entries le
        ON
          ss.uri = le.uri AND last_modified_at = le.latest_last_modified_at
where level >4 and level <6
and  instr(rest,'/')=0 
order by ss.parentfolder,ss.segment1,url;

  