#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { sqlPageNB as spn } from "./deps.ts";
import {
  console as c,
  orchestration as orch,
  shell as sh,
  uniformResource as ur,
} from "../../prime/web-ui-content/mod.ts";

// custom decorator that makes navigation for this notebook type-safe
function ipNav(route: Omit<spn.RouteConfig, "path" | "parentPath">) {
  return spn.navigationPrime({
    ...route,
    parentPath: "/infra/policy",
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
  "infra/policy/index.sql"() {
    return this.SQL`
        select
    'card'             as component,
    3                 as columns;
    select
    UPPER(SUBSTR(title, 1, 1)) || LOWER(SUBSTR(title, 2)) as title,
    'arrow-big-right'       as icon,
    '/infra/policy/policy_list.sql?segment=' || segment || '' as link
    FROM policy_dashboard;`;
  }

  // @ipNav({
  //   caption: "Policy Dashboard",
  //   description: ``,
  //   siblingOrder: 1,
  // })
  // "infra/policy_dashboard.sql"() {
  //   return this.SQL`
  //     ${this.activePageTitle()}
  //     select
  //   'card'             as component,
  //   3                 as columns;
  //   select
  //   UPPER(SUBSTR(title, 1, 1)) || LOWER(SUBSTR(title, 2)) as title,
  //   'arrow-big-right'       as icon,
  //   '/infra/policy_list.sql?segment=' || segment || '' as link
  //   FROM policy_dashboard;
  //     `;
  // }

  @ipNav({
    caption: "Policy List",
    description: ``,
    siblingOrder: 2,
  })
  "infra/policy/policy_list.sql"() {
    return this.SQL`
      ${this.activePageTitle()}
        select
      'card'             as component,
      1 as columns;
    select
        title,
        'arrow-big-right'       as icon,
        '/infra/policy/policy_detail.sql?id=' || uniform_resource_id || '' as link
        FROM policy_list WHERE parentfolder = $segment::TEXT AND segment1=""

        UNION ALL

        SELECT
          REPLACE(segment1, '-', ' ') as title,
          'chevrons-down' as icon,
          '/infra/policy/policy_inner_list.sql?parentfolder=' || parentfolder || '&segment=' || segment1  as link
      FROM
          policy_list
      WHERE
          parentfolder = $segment::TEXT
          AND segment1 != ''
      GROUP BY
          segment1
        ;
      `;
  }

  @ipNav({
    caption: "Policy Inner List",
    description: ``,
    siblingOrder: 3,
  })
  "infra/policy/policy_inner_list.sql"() {
    return this.SQL`
      ${this.activePageTitle()}
        select
      'card'             as component,
      1 as columns;
    select
        title,
        'arrow-big-right'       as icon,
        '/infra/policy/policy_detail.sql?id=' || uniform_resource_id || '' as link
        FROM policy_list WHERE parentfolder = $parentfolder::TEXT AND segment1= $segment::TEXT;
      `;
  }

  @ipNav({
    caption: "Policy Detail",
    description: ``,
    siblingOrder: 4,
  })
  "infra/policy/policy_detail.sql"() {
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

if (import.meta.main) {
  const SQL = await spn.TypicalSqlPageNotebook.SQL(
    new class extends spn.TypicalSqlPageNotebook {
      async statelessIpSQL() {
        // read the file from either local or remote (depending on location of this file)
        return await spn.TypicalSqlPageNotebook.fetchText(
          import.meta.resolve("./stateless-ip.surveilr.sql"),
        );
      }

      async orchestrateStatefulIcSQL() {
        // read the file from either local or remote (depending on location of this file)
        // optional, for better performance:
        // return await TypicalSqlPageNotebook.fetchText(
        //   import.meta.resolve("./orchestrate-stateful-ip.surveilr.sql"),
        // );
      }
    }(),
    new sh.ShellSqlPages(),
    new c.ConsoleSqlPages(),
    new ur.UniformResourceSqlPages(),
    new orch.OrchestrationSqlPages(),
    new ipSqlPages(),
  );
  console.log(SQL.join("\n"));
}
