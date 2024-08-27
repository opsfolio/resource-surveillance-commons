#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { sqlPageNB as spn } from "./deps.ts";
import {
  console as c,
  orchestration as orch,
  shell as sh,
  uniformResource as ur,
} from "../../prime/web-ui-content/mod.ts";

// custom decorator that makes navigation for this notebook type-safe
function icNav(route: Omit<spn.RouteConfig, "path" | "parentPath">) {
  return spn.navigationPrime({
    ...route,
    parentPath: "/infra/control",
  });
}

/**
 * These pages depend on ../../prime/ux.sql.ts being loaded into RSSD (for nav).
 */
export class icSqlPages extends spn.TypicalSqlPageNotebook {
  // TypicalSqlPageNotebook.SQL injects any method that ends with `DQL`, `DML`,
  // or `DDL` as general SQL before doing any upserts into sqlpage_files.
  navigationDML() {
    return this.SQL`
      -- delete all /ip-related entries and recreate them in case routes are changed
      DELETE FROM sqlpage_aide_navigation WHERE path like '/ic%';
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
    `;
  }

  @spn.navigationPrimeTopLevel({
    caption: "Infra Controls",
    description: "Infra Controls",
  })
  "infra/control/index.sql"() {
    return this.SQL`
    SELECT
    'card'             as component
   SELECT DISTINCT
    control_regime  as title,
    'arrow-big-right'       as icon,
    '/infra/control/control_regime.sql?id=' ||control_regime_id || '' as link
    FROM
    control_regimes;`;
  }

  @icNav({
    caption: "Control Regimes",
    description: ``,
    siblingOrder: 1,
  })
  "infra/control/control.sql"() {
    return this.SQL`
      ${this.activePageTitle()}
      -- SELECT 'table' AS component;
      -- SELECT * FROM policy_dashboard;
    SELECT
    'card'             as component
   SELECT DISTINCT
    control_regime  as title,
    'arrow-big-right'       as icon,
    '/infra/control/control_regime.sql?id=' ||control_regime_id || '' as link
    FROM
    control_regimes;
`;
  }

  @icNav({
    caption: "Audit Types",
    description: ``,
    siblingOrder: 2,
  })
  "infra/control/control_regime.sql"() {
    return this.SQL`
  SELECT
    'title' AS component,
    'Audit Types' AS contents
    select 'card' as component
    SELECT audit_type_name  as title,
      'arrow-big-right'       as icon,
     '/infra/control/controls.sql?id=' ||audit_type_id || '' as link
      FROM control_regimes WHERE control_regime_id = $id::TEXT;
    `;
  }

  @icNav({
    caption: "Control List",
    description: ``,
    siblingOrder: 3,
  })
  "infra/control/controls.sql"() {
    return this.SQL`
    SELECT
    'title' AS component,
    'Control List' AS contents
    select 'table' as component,
    'Control code' AS markdown;
    SELECT
    '[' || control_code || '](/infra/control/control_detail.sql?id=' || control_code || ')' AS "Control code",
    common_criteria as "Common criteria",
    fii as "Fii Id",
    question as "Question"
      FROM control WHERE audit_type_id = $id::TEXT;
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
          import.meta.resolve("./stateless-ic.surveilr.sql"),
        );
      }

      async orchestrateStatefulIcSQL() {
        // read the file from either local or remote (depending on location of this file)
        // optional, for better performance:
        // return await TypicalSqlPageNotebook.fetchText(
        //   import.meta.resolve("./orchestrate-stateful-ic.surveilr.sql"),
        // );
      }
    }(),
    new sh.ShellSqlPages(),
    new c.ConsoleSqlPages(),
    new ur.UniformResourceSqlPages(),
    new orch.OrchestrationSqlPages(),
    new icSqlPages(),
  );
  console.log(SQL.join("\n"));
}
