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

  "fhir/index.sql"() {
    return this.SQL`
      SELECT
        'list' as component,
        'Get started: where to go from here ?' as title,
        'Here are some useful links to get you started with SQLPage.' as description;
      SELECT 'Uniform Resources Summary' as title,
        '../uniform-resource-summary.sql' as link,
        'uniform_resource row statistics (may be slow, be patient after clicking)' as description;
      SELECT 'FHIR Bundles Summary' as title,
        'bundles-summary.sql' as link,
        'count of types of FHIR resources available across all bundles (may be slow, be patient after clicking)' as description;
      SELECT 'Patient Resources' as title,
        'patients.sql' as link,
        'Patient resources found in FHIR bundles' as description`;
  }

  "uniform-resource-summary.sql"() {
    return this.SQL`
      SELECT 'table' as component, 1 as search, 1 as sort;
      SELECT * from uniform_resource_summary;`;
  }

  "fhir/bundles-summary.sql"() {
    return this.SQL`
      SELECT 'table' as component, 1 as search, 1 as sort;
      SELECT * from fhir_v4_bundle_resource_summary;`;
  }

  "fhir/patients.sql"() {
    return this.SQL`
      SELECT 'table' as component, 1 as search, 1 as sort;
      SELECT * from fhir_v4_bundle_resource_patient;`;
  }
}

if (import.meta.main || globalThis.importedFromTsctl) {
  const pages = new SqlPages();
  console.log(
    new spa.SQLPageAide(pages)
      .include(/\.sql$/)
      .onNonStringContents((result, _sp, method) =>
        SQLa.isSqlTextSupplier(result)
          ? result.SQL(pages.emitCtx)
          : `/* unknown result from ${method} */`
      )
      .emitformattedSQL()
      .SQL()
      .join("\n"),
  );
}
