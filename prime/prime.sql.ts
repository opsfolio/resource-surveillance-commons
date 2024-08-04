#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { SQLa, SQLPageAide as spa } from "./deps.ts";

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
      WHERE tbl.type = 'table' AND tbl.name NOT LIKE 'sqlite_%';`;
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
}

class ConsoleSqlPages extends SqlPages<SQLa.SqlEmitContext> {
  "console/index.sql"() {
    return this.SQL`
      SELECT
        'list' as component,
        'Resource Surveillance Console' as title,
        'Here are some useful links to get you started.' as description;
      SELECT 'SQLPage Pages' as title,
        'sqlpage-files/' as link;
      SELECT 'Stored SQL Notebooks' as title,
        'notebooks/' as link;
      SELECT 'Information Schema' as title,
        'info-schema/' as link;`;
  }

  "console/info-schema/index.sql"() {
    return this.SQL`
      select 'breadcrumb' as component;
      select 'Home' as title, '/' as link;
      select 'Console' as title, '../' as link;
      select 'Information Schema' as title, '#' as link;

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
      GROUP BY view_name;`;
  }

  "console/info-schema/table.sql"() {
    return this.SQL`
      select 'breadcrumb' as component;
      select 'Home' as title, '/' as link;
      select 'Console' as title, '../' as link;
      select 'Information Schema' as title, '#' as link;
      select $name || ' Table' as title;

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
      SELECT 'text' AS component, '\`\`\`sql\n' || (SELECT sql_ddl FROM console_information_schema_table WHERE table_name = $name) || '\n\`\`\`' as contents_md;`;
  }

  "console/info-schema/view.sql"() {
    return this.SQL`
      select 'breadcrumb' as component;
      select 'Home' as title, '/' as link;
      select 'Console' as title, '../' as link;
      select 'Information Schema' as title, 'index.sql' as link;
      select $name || ' View' as title, '#' as link;

      SELECT 'title' AS component, $name AS contents;      
      SELECT 'table' AS component;
      SELECT 
          column_name AS "Column", 
          data_type AS "Type"
      FROM console_information_schema_view
      WHERE view_name = $name;
      
      SELECT 'title' AS component, 'SQL DDL' as contents, 2 as level;
      SELECT 'text' AS component, '\`\`\`sql\n' || (SELECT sql_ddl FROM console_information_schema_view WHERE view_name = $name) || '\n\`\`\`' as contents_md;`;
  }

  "console/sqlpage-files/index.sql"() {
    return this.SQL`
      select 'breadcrumb' as component;
      select 'Home' as title, '/' as link;
      select 'Console' as title, '../' as link;
      select 'SQLPage Files in DB' as title, '#' as link;

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
      select 'breadcrumb' as component;
      select 'Home' as title, '/' as link;
      select 'Console' as title, '../' as link;
      select 'SQLPage Files in DB' as title, 'index.sql' as link;
      select $path || ' Path' as title, '#' as link;

      SELECT 'title' AS component, $path AS contents;
      SELECT 'text' AS component, 
             '\`\`\`sql\n' || (select contents FROM sqlpage_files where path = $path) || '\n\`\`\`' as contents_md;`;
  }

  "console/notebooks/index.sql"() {
    return this.SQL`
      select 'breadcrumb' as component;
      select 'Home' as title, '/' as link;
      select 'Console' as title, '../' as link;
      select 'Code Notebooks' as title, '#' as link;

      SELECT 'title' AS component, 'Code Notebooks' AS contents;
      SELECT 'table' as component, 'Cell' as markdown, 1 as search, 1 as sort;
      SELECT notebook_name,
             '[' || cell_name || '](notebook-cell.sql?notebook=' || replace(notebook_name, ' ', '%20') || '&cell=' || replace(cell_name, ' ', '%20') || ')' as Cell,
             description
        FROM code_notebook_cell;`;
  }

  "console/notebooks/notebook-cell.sql"() {
    return this.SQL`
      select 'breadcrumb' as component;
      select 'Home' as title, '/' as link;
      select 'Console' as title, '../' as link;
      select 'Code Notebooks' as title, 'index.sql' as link;
      select 'Notebook ' || $notebook || ' Cell' || $cell as title, '#' as link;

      SELECT 'text' as component,
             $notebook || '.' || $cell as title,
             '\`\`\`sql
      ' || interpretable_code || '
      \`\`\`' as contents_md
       FROM code_notebook_cell
      WHERE notebook_name = $notebook
        AND cell_name = $cell;`;
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
