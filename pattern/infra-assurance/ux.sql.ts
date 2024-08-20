#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { SqlPageNotebook as spn } from "./deps.ts";

// custom decorator that makes navigation for this notebook type-safe
function iaNav(route: Omit<spn.RouteConfig, "path" | "parentPath">) {
  return spn.navigationPrime({
    ...route,
    parentPath: "/ia",
  });
}

/**
 * These pages depend on ../../prime/ux.sql.ts being loaded into RSSD (for nav).
 */
export class iaSqlPages extends spn.TypicalSqlPageNotebook {
  // TypicalSqlPageNotebook.SQL injects any method that ends with `DQL`, `DML`,
  // or `DDL` as general SQL before doing any upserts into sqlpage_files.
  navigationDML() {
    return this.SQL`
      -- delete all /ia-related entries and recreate them in case routes are changed
      DELETE FROM sqlpage_aide_navigation WHERE path like '/ia%';
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
    `;
  }

  @spn.navigationPrimeTopLevel({
    caption: "Infrastructural assurance",
    description: "Infrastructural assurance",
  })
  "ia/index.sql"() {
    return this.SQL`
      WITH navigation_cte AS (
          SELECT COALESCE(title, caption) as title, description
            FROM sqlpage_aide_navigation
           WHERE namespace = 'prime' AND path = '/ia'
      )
      SELECT 'list' AS component, title, description
        FROM navigation_cte;
      SELECT caption as title, COALESCE(url, path) as link, description
        FROM sqlpage_aide_navigation
       WHERE namespace = 'prime' AND parent_path = '/ia'
       ORDER BY sibling_order;`;
  }

  @iaNav({
    caption: "Policy",
    description: ``,
    siblingOrder: 1,
  })
  "ia/policy.sql"() {
    const viewName = `policy`;
    const pagination = this.pagination({ tableOrViewName: viewName });
    return this.SQL`
      ${this.activePageTitle()}
      SELECT 'table' AS component;
      SELECT * FROM policy;

       ${pagination.init()}

      -- Display uniform_resource table with pagination
      SELECT 'table' AS component,
            TRUE AS sort,
            TRUE AS search;
      SELECT * FROM ${viewName}
       LIMIT $limit
      OFFSET $offset;

      ${pagination.renderSimpleMarkdown()}
      `;
  }
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  console.log(spn.TypicalSqlPageNotebook.SQL(new iaSqlPages()).join("\n"));
}
