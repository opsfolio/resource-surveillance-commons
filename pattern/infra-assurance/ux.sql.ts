#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { sqlPageNB as spn } from "./deps.ts";
import {
  console as c,
  orchestration as orch,
  shell as sh,
  uniformResource as ur,
} from "../../prime/web-ui-content/mod.ts";

// custom decorator that makes navigation for this notebook type-safe
function iaNav(route: Omit<spn.RouteConfig, "path" | "parentPath">) {
  return spn.navigationPrime({
    ...route,
    parentPath: "/infra/assurance",
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
      -- delete all /ip-related entries and recreate them in case routes are changed
      DELETE FROM sqlpage_aide_navigation WHERE path like '/ip%';
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
    `;
  }

  @spn.navigationPrimeTopLevel({
    caption: "Infra Assurance",
    description: "Infra Assurance",
  })
  "infra/assurance/index.sql"() {
    return this.SQL`
        select
    'card'             as component,
    3                 as columns;
    select
    name as title
    FROM boundery;`;
  }

  @iaNav({
    caption: "Bounderies",
    description: ``,
    siblingOrder: 1,
  })
  "infra/assurance/boundery.sql"() {
    return this.SQL`
      ${this.activePageTitle()}
    SELECT
    'card'             as component
   SELECT
    name as title,
    'arrow-big-right'       as icon
    FROM
    boundery;
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
          import.meta.resolve("./stateless-ia.surveilr.sql"),
        );
      }

      async orchestrateStatefulIcSQL() {
        // read the file from either local or remote (depending on location of this file)
        // optional, for better performance:
        // return await TypicalSqlPageNotebook.fetchText(
        //   import.meta.resolve("./orchestrate-stateful-ia.surveilr.sql"),
        // );
      }
    }(),
    new sh.ShellSqlPages(),
    new c.ConsoleSqlPages(),
    new ur.UniformResourceSqlPages(),
    new orch.OrchestrationSqlPages(),
    new iaSqlPages(),
  );
  console.log(SQL.join("\n"));
}
