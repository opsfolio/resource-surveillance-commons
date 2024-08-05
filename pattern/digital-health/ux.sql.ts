#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { SqlPageNotebook as spn } from "./deps.ts";

// custom decorator that makes navigation for this notebook type-safe
function fhirNav(route: Omit<spn.RouteInit, "path" | "parentPath">) {
  return spn.navigation({
    ...route,
    parentPath: "/fhir",
  });
}

/**
 * These pages depend on ../../prime/ux.sql.ts being loaded into RSSD (for nav).
 */
export class FhirSqlPages extends spn.TypicalSqlPageNotebook {
  // TypicalSqlPageNotebook.SQL injects any method that ends with `DQL`, `DML`,
  // or `DDL` as general SQL before doing any upserts into sqlpage_files.
  navigationDML() {
    return this.SQL`
      -- delete all /fhir-related entries and recreate them in case routes are changed
      DELETE FROM sqlpage_aide_navigation WHERE path like '/fhir%';
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
    `;
  }

  @spn.navigation({
    parentPath: "/",
    caption: "FHIR Examples",
    description: "Learn how to query injested FHIR content using SQL",
  })
  "fhir/index.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}

      WITH navigation_cte AS (
          SELECT COALESCE(title, caption) as title, description
            FROM sqlpage_aide_navigation 
           WHERE namespace = 'prime' AND path = '/fhir'
      )
      SELECT 'list' AS component, title, description
        FROM navigation_cte;
      SELECT caption as title, COALESCE(url, path) as link, description
        FROM sqlpage_aide_navigation
       WHERE namespace = 'prime' AND parent_path = '/fhir'
       ORDER BY sibling_order;`;
  }

  @fhirNav({
    caption: "FHIR-specific Tables and Views",
    description:
      "Information Schema documentation for FHIR-specific database objects",
    siblingOrder: 1,
  })
  "fhir/info-schema.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}

      SELECT 'title' AS component, 'FHIR-specific Tables and Views' as contents;
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
      WHERE table_name like 'fhir%'
      GROUP BY table_name

      UNION ALL

      SELECT 
          'View' as "Type",
          '[' || view_name || '](/console/info-schema/view.sql?name=' || view_name || ')' AS "Name",
          COUNT(column_name) AS "Column Count"
      FROM console_information_schema_view
      WHERE view_name like 'fhir%'
      GROUP BY view_name;
    `;
  }

  @fhirNav({
    caption: "Uniform Resources Summary",
    description:
      "uniform_resource row statistics (may be slow, be patient after clicking)",
    siblingOrder: 2,
  })
  "fhir/uniform-resource-summary.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}
      ${this.activePageTitle()}

      SELECT 'table' as component;
      SELECT * from uniform_resource_summary;`;
  }

  @fhirNav({
    caption: "FHIR Bundles Summary",
    description:
      "count of types of FHIR resources available across all bundles (may be slow, be patient after clicking)",
    siblingOrder: 3,
  })
  "fhir/bundles-summary.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}
      ${this.activePageTitle()}

      select 'list' as component, TRUE as compact;
      select 'Learn more about fhir_v4_bundle_resource_summary view' as title, '/console/info-schema/view.sql?name=fhir_v4_bundle_resource_summary' as link;
      select 'Learn more about fhir_v4_bundle_resource view' as title, '/console/info-schema/view.sql?name=fhir_v4_bundle_resource' as link;

      SELECT 'table' as component, 1 as search, 1 as sort;
      SELECT * from fhir_v4_bundle_resource_summary;
       
      ${this.activePageSource()}`;
  }

  @fhirNav({
    caption: "Patient Resources",
    description:
      "Patient resources found in FHIR bundles (may be slow, be patient after clicking)",
    siblingOrder: 10,
  })
  "fhir/patients.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}
      ${this.activePageTitle()}

      select 'list' as component, TRUE as compact;
      select 'Learn more about fhir_v4_bundle_resource_patient view' as title, '/console/info-schema/view.sql?name=fhir_v4_bundle_resource_patient' as link;
      select 'Learn more about fhir_v4_bundle_resource_summary view' as title, '/console/info-schema/view.sql?name=fhir_v4_bundle_resource_summary' as link;
      select 'Learn more about fhir_v4_bundle_resource view' as title, '/console/info-schema/view.sql?name=fhir_v4_bundle_resource' as link;

      SELECT 'table' as component, 1 as search, 1 as sort;
      SELECT * from fhir_v4_bundle_resource_patient;
       
      ${this.activePageSource()}`;
  }

  @fhirNav({
    caption: "Observation Resources",
    description:
      "Observation resources found in FHIR bundles (may be slow, be patient after clicking)",
    siblingOrder: 10,
  })
  "fhir/observations.sql"() {
    return this.SQL`
      ${this.activeBreadcrumbsSQL()}
      ${this.activePageTitle()}

      select 'list' as component, TRUE as compact;
      select 'Learn more about fhir_v4_bundle_resource view' as title, '/console/info-schema/view.sql?name=fhir_v4_bundle_resource' as link;

      SELECT 'table' as component;
      SELECT resource_type as "Type", resource_content AS "JSON", 'json' AS language 
        FROM fhir_v4_bundle_resource 
       WHERE resource_type = 'Observation' LIMIT 5;
       
      ${this.activePageSource()}`;
  }
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  console.log(spn.TypicalSqlPageNotebook.SQL(new FhirSqlPages()).join("\n"));
}
