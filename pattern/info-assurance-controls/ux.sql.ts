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
    parentPath: "/info/control",
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
    caption: "Information Assurance Controls",
    description: "Information Assurance Controls",
  })
  "info/control/index.sql"() {
    return this.SQL`
    SELECT
    'card'             as component
   SELECT DISTINCT
    control_regime  as title,
    'arrow-big-right'       as icon,
    '/info/control/control_regime.sql?id=' ||control_regime_id || '' as link
    FROM
    control_regimes;`;
  }

  @icNav({
    caption: "Control Regimes",
    description: ``,
    siblingOrder: 1,
  })
  "info/control/control.sql"() {
    return this.SQL`
      ${this.activePageTitle()}
      -- SELECT 'table' AS component;
      -- SELECT * FROM policy_dashboard;
    SELECT
    'card'             as component
   SELECT DISTINCT
    control_regime  as title,
    'arrow-big-right'       as icon,
    '/info/control/control_regime.sql?id=' ||control_regime_id || '' as link
    FROM
    control_regimes;
  `;
  }

  @icNav({
    caption: "Audit Types",
    description: ``,
    siblingOrder: 2,
  })
  "info/control/control_regime.sql"() {
    return this.SQL`
  SELECT
    'title' AS component,
    'Audit Types' AS contents
    select 'card' as component
    SELECT audit_type_name  as title,
      'arrow-big-right'       as icon,
     '/info/control/controls.sql?id=' ||audit_type_id || '' as link
      FROM control_regimes WHERE control_regime_id = $id::TEXT;
    `;
  }

  @icNav({
    caption: "Control List",
    description: ``,
    siblingOrder: 3,
  })
  "info/control/controls.sql"() {
    return this.SQL`
    SELECT
    'title' AS component,
    'Control List' AS contents
    select 'table' as component,
    'Control code' AS markdown;
    SELECT
    '[' || control_code || '](/info/control/control_detail.sql?id=' || control_id || ')' AS "Control code",
    common_criteria as "Common criteria",
    fii as "Fii Id",
    question as "Question"
      FROM control WHERE audit_type_id = $id::TEXT;
    `;
  }

  @icNav({
    caption: "Control Details",
    description: ``,
    siblingOrder: 4,
  })
  "info/control/control_detail.sql"() {
    return this.SQL`
     select
    'card'             as component,
    1               as columns;
    SELECT
      'title' AS component,
      common_criteria AS contents
    FROM
      control
    WHERE
      control_id = $id::TEXT
    SELECT
      'title' AS component,
      "Control Code" AS contents,
  3        as level;
      SELECT
      'text' AS component,
      control_code AS contents
      FROM
      control
    WHERE
      control_id = $id::TEXT
      SELECT
      'title' AS component,
      "Control Question" AS contents,
      3        as level;
         select
    'card'             as component,
    1               as columns;
    select question as title
    FROM
      control
    WHERE
      control_id = $id::TEXT
      SELECT
      'title' AS component,
      "Expected Evidence" AS contents,
      3         as level;
  select
    'card'             as component,
    1               as columns;
    select expected_evidence as title
    FROM
      control
    WHERE
      control_id = $id::TEXT
         SELECT
      'title' AS component,
      "Mapped Requirements" AS contents,
      3       as level;
      SELECT
    'card'             as component,
    1               as columns
    select fii as title
    FROM
      control
    WHERE
      control_id = $id::TEXT
    `;
  }
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT

export async function controlSQL() {
  return await spn.TypicalSqlPageNotebook.SQL(
    new class extends spn.TypicalSqlPageNotebook {
      async statelessControlSQL() {
        // read the file from either local or remote (depending on location of this file)
        return await spn.TypicalSqlPageNotebook.fetchText(
          import.meta.resolve("./stateless-ic.surveilr.sql"),
        );
      }

      async orchestrateStatefulControlSQL() {
        // read the file from either local or remote (depending on location of this file)
        // return await spn.TypicalSqlPageNotebook.fetchText(
        //   import.meta.resolve("./stateful-drh-surveilr.sql"),
        // );
      }
    }(),
    new sh.ShellSqlPages(),
    new c.ConsoleSqlPages(),
    new ur.UniformResourceSqlPages(),
    new orch.OrchestrationSqlPages(),
    new icSqlPages(),
  );
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  console.log((await controlSQL()).join("\n"));
}
