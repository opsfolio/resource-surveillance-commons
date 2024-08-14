WITH raw_cgm_table_name AS (
    -- Select all table names
    SELECT table_name
    FROM drh_raw_cgm_table_lst
)
INSERT INTO sqlpage_files (path, contents)
SELECT 
    'drh/cgm-data/raw-cgm/' || table_name||'.sql' AS path,
    '
    SELECT ''dynamic'' AS component, sqlpage.run_sql(''shell/shell.sql'') AS properties;
    -- not including breadcrumbs from sqlpage_aide_navigation
    -- not including page title from sqlpage_aide_navigation

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
    SELECT ''' || table_name || ''' || '' Table'' AS title, ''#'' AS link;
    
    SELECT ''title'' AS component, ''' || table_name || ''' AS contents;

    SELECT
        ''text'' as component;
    SELECT ''Note: Kindly ignore the elaboration column. It is only for tracking purpose.'' AS contents;

    -- Initialize pagination
    SET total_rows = (SELECT COUNT(*) FROM ''' || table_name || ''');
    SET limit = COALESCE($limit, 50);
    SET offset = COALESCE($offset, 0);
    SET total_pages = ($total_rows + $limit - 1) / $limit;
    SET current_page = ($offset / $limit) + 1;

    -- Display table with pagination
    SELECT ''table'' AS component,
        TRUE AS sort,
        TRUE AS search;
    SELECT * FROM ''' || table_name || '''
    LIMIT $limit
    OFFSET $offset;    

    SELECT ''text'' AS component,
        (SELECT CASE WHEN $current_page > 1 THEN ''[Previous](?limit='' || $limit || ''&offset='' || ($offset - $limit) || '')'' ELSE '''' END) || '' '' ||
        ''(Page '' || $current_page || '' of '' || $total_pages || '')'' || '' '' ||
        (SELECT CASE WHEN $current_page < $total_pages THEN ''[Next](?limit='' || $limit || ''&offset='' || ($offset + $limit) || '')'' ELSE '''' END)
        AS contents_md;
    '
FROM raw_cgm_table_name;
--ON CONFLICT (path) 
--DO UPDATE SET contents = EXCLUDED.contents, last_modified = CURRENT_TIMESTAMP;

/*WITH RECURSIVE raw_cgm_table_name AS (
    -- Select the first table name
    SELECT table_name
    FROM drh_raw_cgm_table_lst
    WHERE table_name IS NOT NULL
    
)
INSERT INTO sqlpage_aide_navigation*/

