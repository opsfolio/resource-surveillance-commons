#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { SqlPageNotebook as spn } from "./deps.ts";
import {
  console as c,
  orchestration as orch,
  shell as sh,
  uniformResource as ur,
} from "../../prime/content/mod.ts";

// custom decorator that makes navigation for this notebook type-safe
function ipNav(route: Omit<spn.RouteConfig, "path" | "parentPath">) {
  return spn.navigationPrime({
    ...route,
    parentPath: "/ip",
  });
}

/**
 * These pages depend on ../../prime/ux.sql.ts being loaded into RSSD (for nav).
 */
export class ipSqlPages extends spn.TypicalSqlPageNotebook {
  // TypicalSqlPageNotebook.SQL injects any method that ends with `DQL`, `DML`,
  // or `DDL` as general SQL before doing any upserts into sqlpage_files.
  navigationDML() {
    return this.SQL`
      -- delete all /ip-related entries and recreate them in case routes are changed
      DELETE FROM sqlpage_aide_navigation WHERE path like '/ip%';
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
    `;
  }

  @spn.navigationPrimeTopLevel({
    caption: "Infra Policies",
    description: "Infra Policies",
  })
  "ip/index.sql"() {
    return this.SQL`
      WITH navigation_cte AS (
          SELECT COALESCE(title, caption) as title, description
            FROM sqlpage_aide_navigation
           WHERE namespace = 'prime' AND path = '/ip'
      )
      SELECT 'list' AS component, title, description
        FROM navigation_cte;
      SELECT caption as title, COALESCE(url, path) as link, description
        FROM sqlpage_aide_navigation
       WHERE namespace = 'prime' AND parent_path = '/ip'
       ORDER BY sibling_order;`;
  }

  @ipNav({
    caption: "Policy Dashboard",
    description: ``,
    siblingOrder: 1,
  })
  "ip/policy_dashboard.sql"() {
    return this.SQL`
      ${this.activePageTitle()}
      select
    'card'             as component,
    3                 as columns;
    select
    segment  as title,
    'arrow-big-right'       as icon,
    '/ip/policy_detail.sql?id=' || uniform_resource_id || '' as link
    FROM policy_dashboard;
      `;
  }

  @spn.shell({ breadcrumbsFromNavStmts: "no" })
  "ip/policy_detail.sql"() {
    return this.SQL`

    select 'card' as component,
    1      as columns;
      SELECT  json_extract(content_fm_body_attrs, '$.attrs.title') AS title,
    json_extract(content_fm_body_attrs, '$.body') AS description_md
    FROM policy_detail WHERE uniform_resource_id = $id::TEXT;


    `;
  }
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
// if (import.meta.main) {
//   console.log(spn.TypicalSqlPageNotebook.SQL(new ipSqlPages()).join("\n"));
// }

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  const SQL = await spn.TypicalSqlPageNotebook.SQL(
    new sh.ShellSqlPages(),
    new c.ConsoleSqlPages(),
    new ur.UniformResourceSqlPages(),
    new orch.OrchestrationSqlPages(),
    new ipSqlPages(),
  );
  console.log(SQL.join("\n"));
}
