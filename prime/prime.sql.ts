#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { path, SQLa, SQLPageAide as spa, ws } from "./deps.ts";

class ConsoleSqlNotebook<EmitContext extends SQLa.SqlEmitContext> {
  readonly emitCtx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.sqliteDialect(),
  }) as EmitContext;
  readonly ddlOptions = SQLa.typicalSqlTextSupplierOptions<EmitContext>();

  // type-safe wrapper for all SQL text generated in this library;
  // we call it `SQL` so that VS code extensions like frigus02.vscode-sql-tagged-template-literals
  // properly syntax-highlight code inside SQL`xyz` strings.
  get SQL() {
    return SQLa.SQL<EmitContext>(this.ddlOptions);
  }

  infoSchemaDDL() {
    return this.SQL`
      -- console_information_schema_* tables are convenience tables
      -- to make it easier to work than pragma_table_info.

      -- Drop and create the table for storing general table information
      DROP TABLE IF EXISTS console_information_schema_table;
      CREATE TABLE console_information_schema_table (
          table_name TEXT,
          column_name TEXT,
          data_type TEXT,
          is_primary_key TEXT,
          is_not_null TEXT,
          default_value TEXT,
          sql_ddl TEXT
      );

      -- Drop and create the table for storing view information
      DROP TABLE IF EXISTS console_information_schema_view;
      CREATE TABLE console_information_schema_view (
          view_name TEXT,
          column_name TEXT,
          data_type TEXT,
          sql_ddl TEXT
      );

      -- Drop and create the table for storing table column foreign keys
      DROP TABLE IF EXISTS console_information_schema_table_col_fkey;
      CREATE TABLE console_information_schema_table_col_fkey (
          table_name TEXT,
          column_name TEXT,
          foreign_key TEXT
      );

      -- Drop and create the table for storing table column indexes
      DROP TABLE IF EXISTS console_information_schema_table_col_index;
      CREATE TABLE console_information_schema_table_col_index (
          table_name TEXT,
          column_name TEXT,
          index_name TEXT
      );

      -- Populate the table with table-specific information
      INSERT INTO console_information_schema_table
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
      INSERT INTO console_information_schema_view
      SELECT 
          vw.name AS view_name,
          col.name AS column_name,
          col.type AS data_type,
          vw.sql as sql_ddl
      FROM sqlite_master vw
      JOIN pragma_table_info(vw.name) col
      WHERE vw.type = 'view' AND vw.name NOT LIKE 'sqlite_%';

      -- Populate the table with table column foreign keys
      INSERT INTO console_information_schema_table_col_fkey
      SELECT 
          tbl.name AS table_name,
          f."from" AS column_name,
          f."from" || ' references ' || f."table" || '.' || f."to" AS foreign_key
      FROM sqlite_master tbl
      JOIN pragma_foreign_key_list(tbl.name) f
      WHERE tbl.type = 'table' AND tbl.name NOT LIKE 'sqlite_%';

      -- Populate the table with table column indexes
      INSERT INTO console_information_schema_table_col_index
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

      -- Create navigation content
      INSERT INTO sqlpage_aide_navigation (namespace, parent_path, sibling_order, path, url, caption, abbreviated_caption, title, description)
      VALUES
          ('prime', NULL, 1, '/', '/', 'Home', NULL, 'Resource Surveillance State Database (RSSD)', 'Welcome to Resource Surveillance State Database (RSSD)'),
          ('prime', '/', 999 /* fall to bottom of list if other items present */, '/console', '/console/', 'RSSD Console', 'Console', 'Resource Surveillance State Database (RSSD) Console', 'Explore RSSD information schema, code notebooks, and SQLPage files'),
          ('prime', '/console', 1, '/console/info-schema', '/console/info-schema/', 'RSSD Information Schema', 'Info Schema', 'RSSD Information Schema', 'Explore RSSD tables, columns, views, and other information schema documentation'),
          ('prime', '/console', 2, '/console/notebooks', '/console/notebooks/', 'RSSD Code Notebooks', 'Code Notebooks', 'RSSD Code Notebooks', 'Explore RSSD Code Notebooks which contain reusable SQL and other code blocks'),
          ('prime', '/console', 3, '/console/sqlpage-files', '/console/sqlpage-files/', 'RSSD SQLPage Files', 'SQLPage Files', 'RSSD SQLPage Files', 'Explore RSSD SQLPage Files which govern the content of the web-UI')
      ON CONFLICT (namespace, parent_path, path)
      DO UPDATE SET title = EXCLUDED.title, abbreviated_caption = EXCLUDED.abbreviated_caption, description = EXCLUDED.description, url = EXCLUDED.url, sibling_order = EXCLUDED.sibling_order;
      `;
  }

  notebook() {
    return this.SQL`
      ${this.infoSchemaDDL()}
    `.SQL(this.emitCtx);
  }
}

class SqlPages<EmitContext extends SQLa.SqlEmitContext> {
  readonly emitCtx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.sqliteDialect(),
  }) as EmitContext;
  readonly ddlOptions = SQLa.typicalSqlTextSupplierOptions<EmitContext>();

  // type-safe wrapper for all SQL text generated in this library;
  // we call it `SQL` so that VS code extensions like frigus02.vscode-sql-tagged-template-literals
  // properly syntax-highlight code inside SQL`xyz` strings.
  get SQL() {
    return SQLa.SQL<EmitContext>(this.ddlOptions);
  }

  /**
   * Assume caller's method name contains "path/path/file.sql" format, reflect
   * the method name in the call stack and extract path components from the
   * method name in the stack trace.
   *
   * @param [level=2] - The stack trace level to extract the method name from. Defaults to 2 (immediate parent).
   * @returns An object containing the absolute path, base name, directory path, and file extension, or undefined if unable to parse.
   */
  sqlPagePathComponents(level = 2) {
    // Get the stack trace using a new Error object
    const stack = new Error().stack;
    if (!stack) {
      return undefined;
    }

    // Split the stack to find the method name
    const stackLines = stack.split("\n");
    if (stackLines.length < 3) {
      return undefined;
    }

    // Parse the method name from the stack trace
    const methodLine = stackLines[level].trim();
    const methodNameMatch = methodLine.match(/at (.+?) \(/);
    if (!methodNameMatch) {
      return undefined;
    }

    // Get the full method name including the class name
    const fullMethodName = methodNameMatch[1];

    // Extract the method name by removing the class name
    const className = this.constructor.name;
    const methodName = fullMethodName.startsWith(className + ".")
      ? fullMethodName.substring(className.length + 1)
      : fullMethodName;

    // assume methodName is now a proper sqlpage_files.path value
    return {
      absPath: "/" + methodName,
      basename: path.basename(methodName),
      path: "/" + path.dirname(methodName),
      extension: path.extname(methodName),
    };
  }

  breadcrumbsSQL(
    activePath: string,
    ...additional: ({ title: string; titleExpr?: never; link?: string } | {
      title?: never;
      titleExpr: string;
      link?: string;
    })[]
  ) {
    return ws.unindentWhitespace(`
      SELECT 'breadcrumb' as component;
      WITH RECURSIVE breadcrumbs AS (
          SELECT 
              COALESCE(abbreviated_caption, caption) AS title,
              COALESCE(url, path) AS link,
              parent_path, 0 AS level
          FROM sqlpage_aide_navigation
          WHERE path = '${activePath.replaceAll("'", "''")}'
          UNION ALL
          SELECT 
              COALESCE(nav.abbreviated_caption, nav.caption) AS title,
              COALESCE(nav.url, nav.path) AS link,
              nav.parent_path, b.level + 1
          FROM sqlpage_aide_navigation nav
          INNER JOIN breadcrumbs b ON nav.path = b.parent_path
      )
      SELECT title, link FROM breadcrumbs ORDER BY level DESC;`) +
      (additional.length
        ? (additional.map((crumb) =>
          `\nSELECT ${
            crumb.title ? `'${crumb.title}'` : crumb.titleExpr
          } AS title, '${crumb.link ?? "#"}' AS link;`
        ))
        : "");
  }

  /**
   * Assume caller's method name contains "path/path/file.sql" format, reflect
   * the method name in the call stack and assume that's the path then compute
   * the breadcrumbs.
   * @param additional any additional crumbs to append
   * @returns the SQL for active breadcrumbs
   */
  activeBreadcrumbsSQL(
    ...additional: ({ title: string; titleExpr?: never; link?: string } | {
      title?: never;
      titleExpr: string;
      link?: string;
    })[]
  ) {
    return this.breadcrumbsSQL(
      this.sqlPagePathComponents(3)?.path ?? "/",
      ...additional,
    );
  }
}

class ConsoleSqlPages extends SqlPages<SQLa.SqlEmitContext> {
  "index.sql"() {
    return this.SQL`
      WITH prime_navigation_cte AS (
          SELECT title, description
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

  "console/sqlpage-files/sqlpage-file.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL({ titleExpr: `$path || ' Path'` })}

      SELECT 'title' AS component, $path AS contents;
      SELECT 'text' AS component, 
             '\`\`\`sql\n' || (select contents FROM sqlpage_files where path = $path) || '\n\`\`\`' as contents_md;`;
  }

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

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  console.log(new ConsoleSqlNotebook().notebook());

  const consolePages = new ConsoleSqlPages();
  console.log(
    new spa.SQLPageAide(consolePages)
      .include(/\.sql$/, /^sqlpage/)
      .onNonStringContents((result, _sp, method) =>
        SQLa.isSqlTextSupplier(result)
          ? result.SQL(consolePages.emitCtx)
          : `/* unknown result from ${method} */`
      )
      .emitformattedSQL()
      .SQL()
      .join("\n"),
  );
}
