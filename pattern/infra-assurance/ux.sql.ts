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
    parentPath: "/opsfolio",
  });
}

/**
 * These pages depend on ../../prime/ux.sql.ts being loaded into RSSD (for nav).
 */
export class InfraAssuranceSqlPages extends spn.TypicalSqlPageNotebook {
  // TypicalSqlPageNotebook.SQL injects any method that ends with `DQL`, `DML`,
  // or `DDL` as general SQL before doing any upserts into sqlpage_files.
  navigationDML() {
    return this.SQL`
      -- delete all /ip-related entries and recreate them in case routes are changed
      DELETE FROM sqlpage_aide_navigation WHERE path like '/opsfolio/infra/assurance%';
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
    `;
  }

  @spn.navigationPrimeTopLevel({
    caption: "Opsfolio",
    description: "Opsfolio",
  })
  "opsfolio/index.sql"() {
    return this.SQL`
    select
     'card'             as component,
     3                 as columns;
      SELECT caption as title, COALESCE(url, path) as link, description
        FROM sqlpage_aide_navigation
       WHERE namespace = 'prime' AND parent_path = '/opsfolio' AND sibling_order = 2
       ORDER BY sibling_order;`;
  }

  @iaNav({
    caption: "Infrastructure Assurance",
    description:
      `The Infra Assurance focuses on managing and overseeing assets and
portfolios within an organization. This project provides tools and processes to
ensure the integrity, availability, and effectiveness of assets and portfolios,
supporting comprehensive assurance and compliance efforts.`,
    siblingOrder: 2,
  })
  "opsfolio/infra/assurance/index.sql"() {
    return this.SQL`
        select
    'card'             as component,
    3                 as columns;
    select name as title FROM boundary;`;
  }
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
export async function assuranceSQL() {
  return await spn.TypicalSqlPageNotebook.SQL(
    new class extends spn.TypicalSqlPageNotebook {
      async statelessPolicySQL() {
        // read the file from either local or remote (depending on location of this file)
        return await spn.TypicalSqlPageNotebook.fetchText(
          import.meta.resolve("./stateless-ia.surveilr.sql"),
        );
      }

      async orchestrateStatefulIaSQL() {
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
    new InfraAssuranceSqlPages(),
  );
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  console.log((await assuranceSQL()).join("\n"));
}
