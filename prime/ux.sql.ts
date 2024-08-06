#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import * as spn from "./sqlpage-notebook.ts";

// custom decorator that makes navigation for this notebook type-safe
function consoleNav(
  route: Omit<spn.RouteInit, "path" | "parentPath" | "namespace">,
) {
  return spn.navigationPrime({
    ...route,
    parentPath: "/console",
  });
}

class ConsoleSqlPages extends spn.TypicalSqlPageNotebook {
  infoSchemaDDL() {
    return this.SQL`
      -- console_information_schema_* tables are convenience tables
      -- to make it easier to work than pragma_table_info.

      DROP VIEW IF EXISTS console_information_schema_table;
      CREATE VIEW console_information_schema_table AS
      SELECT 
          tbl.name AS table_name,
          col.name AS column_name,
          col.type AS data_type,
          CASE WHEN col.pk = 1 THEN 'Yes' ELSE 'No' END AS is_primary_key,
          CASE WHEN col."notnull" = 1 THEN 'Yes' ELSE 'No' END AS is_not_null,
          col.dflt_value AS default_value,
          tbl.sql as sql_ddl
      FROM sqlite_master tbl
      JOIN pragma_table_info(tbl.name) col
      WHERE tbl.type = 'table' AND tbl.name NOT LIKE 'sqlite_%';

      -- Populate the table with view-specific information
      DROP VIEW IF EXISTS console_information_schema_view;
      CREATE VIEW console_information_schema_view AS
      SELECT 
          vw.name AS view_name,
          col.name AS column_name,
          col.type AS data_type,
          vw.sql as sql_ddl
      FROM sqlite_master vw
      JOIN pragma_table_info(vw.name) col
      WHERE vw.type = 'view' AND vw.name NOT LIKE 'sqlite_%';

      -- Populate the table with table column foreign keys
      DROP VIEW IF EXISTS console_information_schema_table_col_fkey;
      CREATE VIEW console_information_schema_table_col_fkey AS
      SELECT 
          tbl.name AS table_name,
          f."from" AS column_name,
          f."from" || ' references ' || f."table" || '.' || f."to" AS foreign_key
      FROM sqlite_master tbl
      JOIN pragma_foreign_key_list(tbl.name) f
      WHERE tbl.type = 'table' AND tbl.name NOT LIKE 'sqlite_%';

      -- Populate the table with table column indexes
      DROP VIEW IF EXISTS console_information_schema_table_col_index;
      CREATE VIEW console_information_schema_table_col_index AS
      SELECT 
          tbl.name AS table_name,
          pi.name AS column_name,
          idx.name AS index_name
      FROM sqlite_master tbl
      JOIN pragma_index_list(tbl.name) idx
      JOIN pragma_index_info(idx.name) pi
      WHERE tbl.type = 'table' AND tbl.name NOT LIKE 'sqlite_%';
      
      -- Drop and create the table for storing navigation entries
      DROP TABLE IF EXISTS sqlpage_aide_navigation;
      CREATE TABLE sqlpage_aide_navigation (
          path TEXT NOT NULL, -- the "primary key" within namespace
          caption TEXT NOT NULL, -- for human-friendly general-purpose name
          namespace TEXT NOT NULL, -- if more than one navigation tree is required
          parent_path TEXT, -- for defining hierarchy
          sibling_order INTEGER, -- orders children within their parent(s)
          url TEXT, -- for supplying links, if different from path
          title TEXT, -- for full titles when elaboration is required, default to caption if NULL
          abbreviated_caption TEXT, -- for breadcrumbs and other "short" form, default to caption if NULL
          description TEXT, -- for elaboration or explanation
          CONSTRAINT fk_parent_path FOREIGN KEY (namespace, parent_path) REFERENCES sqlpage_aide_navigation(namespace, path),
          CONSTRAINT unq_ns_path UNIQUE (namespace, parent_path, path)
      );

      -- all @navigation decorated entries are automatically added to this.navigation
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
      `;
  }

  @spn.navigationPrime({
    caption: "Home",
    title: "Resource Surveillance State Database (RSSD)",
    description: "Welcome to Resource Surveillance State Database (RSSD)",
  })
  "index.sql"() {
    return this.SQL`
      WITH prime_navigation_cte AS (
          SELECT COALESCE(title, caption) as title, description
            FROM sqlpage_aide_navigation 
            WHERE namespace = 'prime' AND path = '/'
      )
      SELECT 'list' AS component, title, description
        FROM prime_navigation_cte;
      SELECT caption as title, COALESCE(url, path) as link, description
        FROM sqlpage_aide_navigation
       WHERE namespace = 'prime' AND parent_path = '/'
       ORDER BY sibling_order;`;
  }

  @spn.navigationPrimeTopLevel({
    caption: "RSSD Console",
    abbreviatedCaption: "Console",
    title: "Resource Surveillance State Database (RSSD) Console",
    description:
      "Explore RSSD information schema, code notebooks, and SQLPage files",
    siblingOrder: 999,
  })
  "console/index.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}
      
      WITH console_navigation_cte AS (
          SELECT title, description
            FROM sqlpage_aide_navigation 
           WHERE namespace = 'prime' AND path = '/console'
      )
      SELECT 'list' AS component, title, description
        FROM console_navigation_cte;
      SELECT caption as title, COALESCE(url, path) as link, description
        FROM sqlpage_aide_navigation
       WHERE namespace = 'prime' AND parent_path = '/console'
       ORDER BY sibling_order;`;
  }

  @consoleNav({
    caption: "RSSD Information Schema",
    abbreviatedCaption: "Info Schema",
    description:
      "Explore RSSD tables, columns, views, and other information schema documentation",
    siblingOrder: 1,
  })
  "console/info-schema/index.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}

      SELECT 'title' AS component, 'Tables' as contents;
      SELECT 'table' AS component, 
            'Table' AS markdown,
            'Column Count' as align_right,
            TRUE as sort,
            TRUE as search;
      SELECT 
          '[' || table_name || '](table.sql?name=' || table_name || ')' AS "Table",
          COUNT(column_name) AS "Column Count"
      FROM console_information_schema_table
      GROUP BY table_name;

      SELECT 'title' AS component, 'Views' as contents;
      SELECT 'table' AS component, 
            'View' AS markdown,
            'Column Count' as align_right,
            TRUE as sort,
            TRUE as search;
      SELECT 
          '[' || view_name || '](view.sql?name=' || view_name || ')' AS "View",
          COUNT(column_name) AS "Column Count"
      FROM console_information_schema_view
      GROUP BY view_name;
                 
      SELECT 'title' AS component, 'Migrations' as contents;
      SELECT 'table' AS component, 
            'Table' AS markdown,
            'Column Count' as align_right,
            TRUE as sort,
            TRUE as search;
      SELECT from_state, to_state, transition_reason, transitioned_at
      FROM code_notebook_state
      ORDER BY transitioned_at;`;
  }

  // no @consoleNav since this is a "utility" page (not navigable)
  "console/info-schema/table.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL({ titleExpr: `$name || ' Table'` })}

      SELECT 'title' AS component, $name AS contents;      
      SELECT 'table' AS component;
      SELECT 
          column_name AS "Column", 
          data_type AS "Type", 
          is_primary_key AS "PK", 
          is_not_null AS "Required", 
          default_value AS "Default"
      FROM console_information_schema_table
      WHERE table_name = $name;
      
      SELECT 'title' AS component, 'Foreign Keys' as contents, 2 as level;
      SELECT 'table' AS component;     
      SELECT 
          column_name AS "Column Name", 
          foreign_key AS "Foreign Key"
      FROM console_information_schema_table_col_fkey
      WHERE table_name = $name;
      
      SELECT 'title' AS component, 'Indexes' as contents, 2 as level;
      SELECT 'table' AS component;     
      SELECT 
          column_name AS "Column Name", 
          index_name AS "Index Name"
      FROM console_information_schema_table_col_index
      WHERE table_name = $name;
      
      SELECT 'title' AS component, 'SQL DDL' as contents, 2 as level;
      SELECT 'code' AS component;
      SELECT 'sql' as language, (SELECT sql_ddl FROM console_information_schema_table WHERE table_name = $name) as contents;`;
  }

  // no @consoleNav since this is a "utility" page (not navigable)
  "console/info-schema/view.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL({ titleExpr: `$name || ' View'` })}

      SELECT 'title' AS component, $name AS contents;      
      SELECT 'table' AS component;
      SELECT 
          column_name AS "Column", 
          data_type AS "Type"
      FROM console_information_schema_view
      WHERE view_name = $name;
      
      SELECT 'title' AS component, 'SQL DDL' as contents, 2 as level;
      SELECT 'code' AS component;
      SELECT 'sql' as language, (SELECT sql_ddl FROM console_information_schema_view WHERE view_name = $name) as contents;`;
  }

  @consoleNav({
    caption: "RSSD SQLPage Files",
    abbreviatedCaption: "SQLPage Files",
    description:
      "Explore RSSD SQLPage Files which govern the content of the web-UI",
    siblingOrder: 3,
  })
  "console/sqlpage-files/index.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}

      SELECT 'title' AS component, 'SQLPage pages in sqlpage_files table' AS contents;
      SELECT 'table' AS component, 
            'Path' as markdown,
            'Size' as align_right,
            TRUE as sort,
            TRUE as search;
      SELECT           
        '[' || path || '](sqlpage-file.sql?path=' || path || ')' AS "Path", 
        LENGTH(contents) as "Size", last_modified
      FROM sqlpage_files
      ORDER BY path;`;
  }

  // no @consoleNav since this is a "utility" page (not navigable)
  "console/sqlpage-files/sqlpage-file.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL({ titleExpr: `$path || ' Path'` })}

      SELECT 'title' AS component, $path AS contents;
      SELECT 'text' AS component, 
             '\`\`\`sql\n' || (select contents FROM sqlpage_files where path = $path) || '\n\`\`\`' as contents_md;`;
  }

  @consoleNav({
    caption: "RSSD SQLPage Navigation",
    abbreviatedCaption: "SQLPage Navigation",
    description:
      "See all the navigation entries for the web-UI; TODO: need to improve this to be able to get details for each navigation entry as a table",
    siblingOrder: 3,
  })
  "console/sqlpage-nav/index.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}

      SELECT 'title' AS component, 'SQLPage navigation in sqlpage_aide_navigation table' AS contents;
      SELECT 'table' AS component, TRUE as sort, TRUE as search;
      SELECT path, caption, description FROM sqlpage_aide_navigation ORDER BY namespace, parent_path, path, sibling_order;`;
  }

  @consoleNav({
    caption: "RSSD Code Notebooks",
    abbreviatedCaption: "Code Notebooks",
    description:
      "Explore RSSD Code Notebooks which contain reusable SQL and other code blocks",
    siblingOrder: 2,
  })
  "console/notebooks/index.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}

      SELECT 'title' AS component, 'Code Notebooks' AS contents;
      SELECT 'table' as component, 'Cell' as markdown, 1 as search, 1 as sort;
      SELECT c.notebook_name,
             '[' || c.cell_name || '](notebook-cell.sql?notebook=' || replace(c.notebook_name, ' ', '%20') || '&cell=' || replace(c.cell_name, ' ', '%20') || ')' as Cell,
             c.description,
             k.kernel_name as kernel
        FROM code_notebook_kernel k, code_notebook_cell c
       WHERE k.code_notebook_kernel_id = c.notebook_kernel_id;`;
  }

  // no @consoleNav since this is a "utility" page (not navigable)
  "console/notebooks/notebook-cell.sql"() {
    return this.SQL`
      ${
      this.activeBreadcrumbsSQL({
        titleExpr: `'Notebook ' || $notebook || ' Cell' || $cell`,
      })
    }

      SELECT 'code' as component;
      SELECT $notebook || '.' || $cell || ' (' || k.kernel_name ||')' as title,
             COALESCE(c.cell_governance -> '$.language', 'sql') as language,
             c.interpretable_code as contents
        FROM code_notebook_kernel k, code_notebook_cell c
       WHERE c.notebook_name = $notebook
         AND c.cell_name = $cell
         AND k.code_notebook_kernel_id = c.notebook_kernel_id;`;
  }
}

// custom decorator that makes navigation for this notebook type-safe
function urNav(route: Omit<spn.RouteInit, "path" | "parentPath">) {
  return spn.navigationPrime({
    ...route,
    parentPath: "/ur",
  });
}

class UniformResourceSqlPages extends spn.TypicalSqlPageNotebook {
  // TypicalSqlPageNotebook.SQL injects any method that ends with `DQL`, `DML`,
  // or `DDL` as general SQL before doing any upserts into sqlpage_files.
  navigationDML() {
    return this.SQL`
      -- delete all /fhir-related entries and recreate them in case routes are changed
      DELETE FROM sqlpage_aide_navigation WHERE path like '/fhir%';
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
    `;
  }

  // any SQL such as views or tables needed to support the SQLPage content;
  // SQL views are required to support pagination, grids, tables, etc.
  supportDDL() {
    return this.SQL`
      DROP VIEW IF EXISTS uniform_resource_file;
      CREATE VIEW uniform_resource_file AS
        SELECT ur.uniform_resource_id,
               ur.nature,
               p.root_path AS source_path,
               pe.file_path_rel,
               ur.size_bytes
        FROM uniform_resource ur
        LEFT JOIN ur_ingest_session_fs_path p ON ur.ingest_fs_path_id = p.ur_ingest_session_fs_path_id
        LEFT JOIN ur_ingest_session_fs_path_entry pe ON ur.uniform_resource_id = pe.uniform_resource_id
        WHERE ur.ingest_fs_path_id IS NOT NULL;
    `;
  }

  @spn.navigationPrimeTopLevel({
    caption: "Uniform Resource",
    description: "Explore ingested resources",
  })
  "ur/index.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}

      WITH navigation_cte AS (
          SELECT COALESCE(title, caption) as title, description
            FROM sqlpage_aide_navigation 
           WHERE namespace = 'prime' AND path = '/ur'
      )
      SELECT 'list' AS component, title, description
        FROM navigation_cte;
      SELECT caption as title, COALESCE(url, path) as link, description
        FROM sqlpage_aide_navigation
       WHERE namespace = 'prime' AND parent_path = '/ur'
       ORDER BY sibling_order;`;
  }

  @urNav({
    caption: "Uniform Resource Tables and Views",
    description:
      "Information Schema documentation for ingested Uniform Resource database objects",
    siblingOrder: 99,
  })
  "ur/info-schema.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}

      SELECT 'title' AS component, 'Uniform Resource Tables and Views' as contents;
      SELECT 'table' AS component, 
            'Name' AS markdown,
            'Column Count' as align_right,
            TRUE as sort,
            TRUE as search;

      SELECT 
          'Table' as "Type",
          '[' || table_name || '](/console/info-schema/table.sql?name=' || table_name || ')' AS "Name",
          COUNT(column_name) AS "Column Count"
      FROM console_information_schema_table
      WHERE table_name = 'uniform_resource' OR table_name like 'ur_%'
      GROUP BY table_name

      UNION ALL

      SELECT 
          'View' as "Type",
          '[' || view_name || '](/console/info-schema/view.sql?name=' || view_name || ')' AS "Name",
          COUNT(column_name) AS "Column Count"
      FROM console_information_schema_view
      WHERE view_name like 'ur_%'
      GROUP BY view_name;
    `;
  }

  @urNav({
    caption: "Uniform Resources (Files)",
    description: "Files ingested into the `uniform_resource` table",
    siblingOrder: 1,
  })
  "ur/uniform-resource-files.sql"() {
    const viewName = `uniform_resource_file`;
    const pagination = this.pagination({ tableOrViewName: viewName });
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}
      ${this.activePageTitle()}
      
      -- sets up $limit, $offset, and other variables (use pagination.debugVars() to see values in web-ui)
      ${pagination.init()}

      -- Display uniform_resource table with pagination
      SELECT 'table' AS component,
            'Uniform Resources' AS title,
            "Size (bytes)" as align_right,
            TRUE AS sort,
            TRUE AS search;
      SELECT * FROM ${viewName} ORDER BY uniform_resource_id
       LIMIT $limit
      OFFSET $offset;

      ${pagination.renderSimpleMarkdown()}
    `;
  }

  // TODO: add other types of Uniform Resources like IMAP, PLM, etc.
  // TODO: add other pages to view Uniform Resources by nature (e.g. JSON vs. Markdown)
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  console.log(
    spn.TypicalSqlPageNotebook.SQL<spn.TypicalSqlPageNotebook>(
      new ConsoleSqlPages(),
      new UniformResourceSqlPages(),
    ).join("\n"),
  );
}
