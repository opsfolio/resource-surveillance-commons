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
    parentPath: "/infra/audits",
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
      DELETE FROM sqlpage_aide_navigation WHERE path like '/ia%';
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
    `;
  }

  @spn.navigationPrimeTopLevel({
    caption: "Infrastructure Audits",
    description: "Infrastructure Audits",
  })
  "infra/audit/index.sql"() {
    return this.SQL`
    SELECT 'card' as component
    SELECT name  as title,
    'arrow-big-right' as icon,
    '/infra/audit/control_regime.sql?id=' ||control_regime_id || '' as link
    FROM
    tenant_based_control_regime WHERE tenant_id = '239518031485599747' AND parent_id == ''`;
  }

  @iaNav({
    caption: "Control Regimes",
    description: ``,
    siblingOrder: 1,
  })
  "infra/audit/control_regime.sql"() {
    return this.SQL`
      ${this.activePageTitle()}
      SELECT 'card' as component
      SELECT name  as title,
      'arrow-big-right' as icon,
      '/infra/audit/session_list.sql?id=' ||control_regime_id || '' as link
      FROM
      tenant_based_control_regime WHERE tenant_id = '239518031485599747' AND parent_id = $id:: Text`;
  }

  @iaNav({
    caption: "Audit Sessions",
    description: ``,
    siblingOrder: 1,
  })
  "infra/audit/session_list.sql"() {
    return this.SQL`
    ${this.activePageTitle()}

    SELECT 'table' AS component,
           TRUE AS sort,
           TRUE AS search,
           'Session' AS markdown;

    SELECT '[' || title || '](/infra/audit/session_detail.sql?id=' || audit_type_id  || '&sessionid=' || audit_session_id || ')' AS "Session",
           audit_type AS "Audit Type",
           due_date AS "Due Date",
           tenant_name AS "Tenant"
    FROM audit_session_list
    WHERE tenant_id = '239518031485599747' AND audit_type_id = $id::TEXT;
  `;
  }

  @iaNav({
    caption: "Audit Sessions",
    description: ``,
    siblingOrder: 1,
  })
  "infra/audit/session_detail.sql"() {
    return this.SQL`
    SELECT
    'title' AS component,
    'Control List' AS contents
    select 'table' as component,
    'Control code' AS markdown;
    SELECT
    '[' || control_code || '](/infra/audit/control_detail.sql?id=' || control_id || ')' AS "Control code",
    common_criteria as "Common criteria",
    question as "Question"
      FROM control WHERE CAST(audit_type_id AS TEXT)=CAST($id AS TEXT);
    `;
  }

  @iaNav({
    caption: "Controls Detail",
    description: ``,
    siblingOrder: 1,
  })
  "infra/audit/control_detail.sql"() {
    return this.SQL`
    SELECT 'card' as component
    SELECT question  as title, common_criteria
      FROM control WHERE CAST(control_id AS TEXT)=CAST($id AS TEXT);
    `;
  }
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
export async function auditSQL() {
  return await spn.TypicalSqlPageNotebook.SQL(
    new class extends spn.TypicalSqlPageNotebook {
      async statelessAuditSQL() {
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
    new iaSqlPages(),
  );
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  console.log((await auditSQL()).join("\n"));
}
