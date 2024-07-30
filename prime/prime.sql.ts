#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { SQLa, SQLPageAide as spa } from "./deps.ts";

class SqlPages<EmitContext extends SQLa.SqlEmitContext> {
  readonly cr: spa.ComponentRenderer = new spa.ComponentRenderer();
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

class ConsolePages extends SqlPages<SQLa.SqlEmitContext> {
  "console/index.sql"() {
    return this.SQL`
      select
          'list' as component,
          'Website files' as title;

      select
          path as title,
          path as link,
          sqlpage.link ('edit.sql', json_build_object ('path', path)) as edit_link,
          sqlpage.link ('delete.sql', json_build_object ('path', path)) as delete_link
      from
          sqlpage_files;

      select
          'Create new file' as title,
          'edit.sql' as link,
          'file-plus' as icon,
          'green' as color;

      select 'list' as component,
          'Database tables' as title;

      select
          table_name as title,
          sqlpage.link ('view_table.sql', json_build_object('table_name', table_name)) as link
      from
          information_schema.tables
      where
          table_schema = 'public'
          and table_type = 'BASE TABLE';`;
  }
}

if (import.meta.main) {
  const consolePages = new ConsolePages();
  console.log(
    new spa.SQLPageAide(consolePages)
      .include(/\.sql$/)
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
