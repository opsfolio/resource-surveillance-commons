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
            uri,
            substr(uri, instr(uri, 'src/') + 4, instr(substr(uri, instr(uri, 'src/') + 4), '/') - 1) AS segment,
            substr(substr(uri, instr(uri, 'src/') + 4), instr(substr(uri, instr(uri, 'src/') + 4), '/') + 1) AS rest,
            1 AS level
        FROM uniform_resource
        WHERE instr(uri, 'src/') > 0 AND  instr(substring(uri,instr(uri, 'src/')),'_')=0 
        UNION ALL
        SELECT
            uniform_resource_id,
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
            segment,
            substr(uri, instr(uri, 'src/')) AS url,
            CASE WHEN instr(rest, '/') = 0 THEN 0 ELSE 1 END AS is_folder
        FROM split_uri
        WHERE level = 4 AND instr(rest, '/') = 0
    )
    SELECT
        uniform_resource_id,
        REPLACE(segment,"-"," ")title,
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

DROP VIEW IF EXISTS vigetallviews ;
CREATE VIEW vigetallviews as
Select 'Up time' title,'viup_time' as viewname,'opsfolio/info/policy/viup_time.sql' as path,0 as used_path 
UNION ALL
Select 'Log' title,'viLog'as viewname,'opsfolio/info/policy/viLog.sql' as path,0 as used_path
UNION ALL
Select 'Encrypted passwords' title,'viencrypted_passwords'as viewname,'opsfolio/info/policy/viencrypted_passwords.sql' as path,0 as used_path
UNION ALL
Select 'Network Log' title,'vinetwork_log'as viewname,'opsfolio/info/policy/vinetwork_log.sql' as path,0 as used_path
UNION ALL
Select 'SSL Certificate' title,'vissl_certificate'as viewname,'opsfolio/info/policy/vissl_certificate.sql' as path,0 as used_path
UNION ALL
Select 'Available Storage' title,'vistorage_available'as viewname,'opsfolio/info/policy/vistorage_available.sql' as path,0 as used_path
UNION ALL
Select 'Ram Utilization' title,'viram_utilization'as viewname,'opsfolio/info/policy/viram_utilization.sql' as path,0 as used_path
UNION ALL
Select 'Cpu Information' title,'vicpu_infomation'as viewname,'opsfolio/info/policy/vicpu_infomation.sql' as path,0 as used_path
UNION ALL
Select 'Removed Accounts' title,'viaccounts_removed'as viewname,'opsfolio/info/policy/viaccounts_removed.sql' as path,0 as used_path
UNION ALL
Select 'SSH Settings' title,'vissh_settings'as viewname,'opsfolio/info/policy/vissh_settings.sql' as path,0 as used_path
UNION ALL
Select 'Unsuccessful Attempts' title,'viunsuccessful_attempts_log'as viewname,'opsfolio/info/policy/viunsuccessful_attempts_log.sql' as path,0 as used_path
UNION ALL
Select 'Authentication' title,'viauthentication'as viewname,'opsfolio/info/policy/viauthentication.sql' as path,0 as used_path
;

DELETE FROM sqlpage_files
WHERE path IN (
    SELECT a.path
    FROM sqlpage_files a
    INNER JOIN vigetallviews b ON a.path = b.path
);

WITH get_allviewname AS (
    -- Select all table names
    SELECT viewname,title
    FROM vigetallviews
)
INSERT OR IGNORE INTO sqlpage_files (path, contents)
SELECT 
     'opsfolio/info/policy/' || viewname||'.sql' AS path,
    '
    SELECT ''dynamic'' AS component, sqlpage.run_sql(''shell/shell.sql'') AS properties;

    SELECT ''breadcrumb'' as component;
    WITH RECURSIVE breadcrumbs AS (
        SELECT
            COALESCE(abbreviated_caption, caption) AS title,
            COALESCE(url, path) AS link,
            parent_path, 0 AS level,
            namespace
        FROM sqlpage_aide_navigation
        WHERE namespace = ''prime'' AND path = ''/drh/cgm-data''
        UNION ALL
        SELECT
            COALESCE(nav.abbreviated_caption, nav.caption) AS title,
            COALESCE(nav.url, nav.path) AS link,
            nav.parent_path, b.level + 1, nav.namespace
        FROM sqlpage_aide_navigation nav
        INNER JOIN breadcrumbs b ON nav.namespace = b.namespace AND nav.path = b.parent_path
    )
    SELECT title, link FROM breadcrumbs ORDER BY level DESC;
    SELECT ''' || title || ''' || '' Table'' AS title, ''#'' AS link;
    select ''title'' as component,'''||title||''' as contents ;
    
    SELECT ''table'' AS component ;
    SELECT  * from  ''' || viewname || ''''
   
FROM get_allviewname;

DROP VIEW IF EXISTS viup_time;
CREATE VIEW viup_time as
SELECT
    json_extract(value, '$.days') AS Days,
    json_extract(value, '$.hours') AS Hours,
    json_extract(value, '$.minutes') AS Minutes,
    json_extract(value, '$.seconds') AS Seconds
    FROM
    uniform_resource,
    json_each(content)
    WHERE
     uri ="osqueryUpTime";
DROP VIEW IF EXISTS viLog;
CREATE VIEW viLog as
SELECT
    json_extract(value, '$.date') AS date,
    json_extract(value, '$.message') AS message
    FROM
    uniform_resource,
    json_each(content)
    WHERE
    content like '%session%' and
    uri='authLogInfo' order by created_at desc limit 100;

DROP VIEW IF EXISTS viencrypted_passwords;
CREATE VIEW viencrypted_passwords AS 
SELECT
      json_extract(value, '$.md5') AS md5,
      json_extract(value, '$.sha1') AS sha1,
      json_extract(value, '$.sha256') AS sha256
      FROM
      uniform_resource,
      json_each(content)
      where uri ='osqueryEncryptedPasswords';

DROP VIEW IF EXISTS vinetwork_log;
 CREATE VIEW vinetwork_log AS       
 select  
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.atime') AS atime,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.category') AS category,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.ctime') AS ctime,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.gid') AS gid,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.hashed') AS hashed,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.inode') AS inode,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.md5') AS md5,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.mode') AS mode,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.mtime') AS mtime,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.sha1') AS sha1,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.sha256') AS sha256,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.size') AS size,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.target_path') AS target_path,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.time') AS time,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.transaction_id') AS transaction_id,
 json_extract(json(IIF(datas <> '', datas, NULL)),'$.uid') AS uid
 from
(SELECT
     json_extract(value,'$.columns') AS  datas
    FROM
   (select  content from uniform_resource ur 
  where uri ='osquerydFileEvents' and json_valid(content) limit 1 ) ,
  json_each(content)
 limit 100),
 json_each(datas) where json_valid(datas)=1 limit 100 ;


DROP VIEW IF EXISTS vissl_certificate;
CREATE VIEW vissl_certificate AS
SELECT distinct
      json_extract(value, '$.hostname') Hostname ,
       json_extract(value, '$.valid_to') Valid_to
      FROM
      uniform_resource,
      json_each(content)
      where uri ='osqueryWebsiteSslCertificate';

DROP VIEW IF EXISTS vistorage_available;
CREATE VIEW vistorage_available AS       
SELECT
   json_extract(value, '$.%_available') AS available,
   json_extract(value, '$.%_used') AS used,
   json_extract(value, '$.space_left_gb') AS space_left_gb,
   json_extract(value, '$.total_space_gb') AS total_space_gb,
   json_extract(value, '$.used_space_gb') AS used_space_gb
    FROM
    uniform_resource,
    json_each(content)
    WHERE
    uri='osqueryDiskUtilization' order by 
    last_modified_at desc
    limit 1;

DROP VIEW IF EXISTS viram_utilization;
CREATE VIEW viram_utilization AS        
SELECT
   json_extract(value, '$.memory_free_gb') AS memory_free_gb,
   json_extract(value, '$.memory_percentage_free') AS memory_percentage_free,
   json_extract(value, '$.memory_percentage_used') AS memory_percentage_used,
   json_extract(value, '$.memory_total_gb') AS memory_total_gb
    FROM
    uniform_resource,
    json_each(content)
    WHERE
    uri='osqueryMemoryUtilization' order by 
    last_modified_at desc
    limit 1;

DROP VIEW IF EXISTS vicpu_infomation;
CREATE VIEW vicpu_infomation AS     
SELECT 
    json_extract(value, '$.cpu_brand') AS cpu_brand,
    json_extract(value, '$.cpu_physical_cores') AS cpu_physical_cores,
    json_extract(value, '$.cpu_logical_cores') AS cpu_logical_cores,
    json_extract(value, '$.computer_name') AS computer_name,
    json_extract(value, '$.local_hostname') AS local_hostname
    from uniform_resource,
    json_each(content) where
     uri='osquerySystemInfo';    

DROP VIEW IF EXISTS viaccounts_removed;
CREATE VIEW viaccounts_removed   AS    
SELECT
    json_extract(value,'$.description') AS description,
    json_extract(value,'$.directory') AS directory,
    json_extract(value,'$.gid') AS gid,
    json_extract(value,'$.gid_signed') AS gid_signed,
    json_extract(value,'$.shell') AS shell,
    json_extract(value,'$.uid') AS uid,
    json_extract(value,'$.uid_signed') AS uid_signed,
    json_extract(value,'$.username') AS username,
    json_extract(value,'$.uuid') AS uuid
    FROM
   uniform_resource,
    json_each(content)
    where uri ='osqueryRemovedUserAccounts';


DROP VIEW IF EXISTS vissh_settings;
CREATE VIEW vissh_settings  AS     
select
   json_extract(value, '$.name') AS Name ,
   json_extract(value, '$.cmdline') AS cmdline,
   json_extract(value, '$.path') AS path
   from
   uniform_resource,
   json_each(content)
   where uri='osquerySshdProcess'; 

DROP VIEW IF EXISTS viunsuccessful_attempts_log;
CREATE VIEW viunsuccessful_attempts_log AS 
SELECT
    json_extract(value, '$.date') AS date,
    json_extract(value, '$.message') AS message
    FROM
    uniform_resource,
    json_each(content)
    WHERE
    uri='authLogInfo' order by created_at desc limit 100;

DROP VIEW IF EXISTS viauthentication;
CREATE VIEW viauthentication AS      
select
  json_extract(value, '$.node') AS node ,
  json_extract(value, '$.value') AS value,
  json_extract(value, '$.label') AS label ,
  json_extract(value, '$.path') AS path
  from
  uniform_resource,
  json_each(content)
  where uri='osqueryMfaEnabled';
  DROP VIEW IF EXISTS viram_utilization;
CREATE VIEW viram_utilization AS        
SELECT
   json_extract(value, '$.memory_free_gb') AS memory_free_gb,
   json_extract(value, '$.memory_percentage_free') AS memory_percentage_free,
   json_extract(value, '$.memory_percentage_used') AS memory_percentage_used,
   json_extract(value, '$.memory_total_gb') AS memory_total_gb
    FROM
    uniform_resource,
    json_each(content)
    WHERE
    uri='osqueryMemoryUtilization' order by 
    last_modified_at desc
    limit 1;

DROP VIEW IF EXISTS vicpu_infomation;
CREATE VIEW vicpu_infomation AS     
SELECT 
    json_extract(value, '$.cpu_brand') AS cpu_brand,
    json_extract(value, '$.cpu_physical_cores') AS cpu_physical_cores,
    json_extract(value, '$.cpu_logical_cores') AS cpu_logical_cores,
    json_extract(value, '$.computer_name') AS computer_name,
    json_extract(value, '$.local_hostname') AS local_hostname
    from uniform_resource,
    json_each(content) where
     uri='osquerySystemInfo';    

DROP VIEW IF EXISTS viaccounts_removed;
CREATE VIEW viaccounts_removed   AS    
SELECT
    json_extract(value,'$.description') AS description,
    json_extract(value,'$.directory') AS directory,
    json_extract(value,'$.gid') AS gid,
    json_extract(value,'$.gid_signed') AS gid_signed,
    json_extract(value,'$.shell') AS shell,
    json_extract(value,'$.uid') AS uid,
    json_extract(value,'$.uid_signed') AS uid_signed,
    json_extract(value,'$.username') AS username,
    json_extract(value,'$.uuid') AS uuid
    FROM
   uniform_resource,
    json_each(content)
    where uri ='osqueryRemovedUserAccounts';


DROP VIEW IF EXISTS vissh_settings;
CREATE VIEW vissh_settings  AS     
select
   json_extract(value, '$.name') AS Name ,
   json_extract(value, '$.cmdline') AS cmdline,
   json_extract(value, '$.path') AS path
   from
   uniform_resource,
   json_each(content)
   where uri='osquerySshdProcess'; 

DROP VIEW IF EXISTS viunsuccessful_attempts_log;
CREATE VIEW viunsuccessful_attempts_log AS 
SELECT
    json_extract(value, '$.date') AS date,
    json_extract(value, '$.message') AS message
    FROM
    uniform_resource,
    json_each(content)
    WHERE
    uri='authLogInfo' order by created_at desc limit 100;

DROP VIEW IF EXISTS viauthentication;
CREATE VIEW viauthentication AS      
select
  json_extract(value, '$.node') AS node ,
  json_extract(value, '$.value') AS value,
  json_extract(value, '$.label') AS label ,
  json_extract(value, '$.path') AS path
  from
  uniform_resource,
  json_each(content)
  where uri='osqueryMfaEnabled';



  