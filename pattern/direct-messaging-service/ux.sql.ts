#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { SqlPageNotebook as spn } from "./deps.ts";

// custom decorator that makes navigation for this notebook type-safe
function dmsNav(route: Omit<spn.RouteConfig, "path" | "parentPath">) {
  return spn.navigationPrime({
    ...route,
    parentPath: "/dms",
  });
}

/**
 * These pages depend on ../../prime/ux.sql.ts being loaded into RSSD (for nav).
 */
export class dmsSqlPages extends spn.TypicalSqlPageNotebook {
  // TypicalSqlPageNotebook.SQL injects any method that ends with `DQL`, `DML`,
  // or `DDL` as general SQL before doing any upserts into sqlpage_files.
  navigationDML() {
    return this.SQL`
      -- delete all /dms-related entries and recreate them in case routes are changed
      DELETE FROM sqlpage_aide_navigation WHERE path like '/dms%';
      ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
    `;
  }

  @spn.navigationPrimeTopLevel({
    caption: "Direct Protocol Email System",
    description: "Email system with direct protocol",
  })
  "dms/index.sql"() {
    return this.SQL`
      WITH navigation_cte AS (
          SELECT COALESCE(title, caption) as title, description
            FROM sqlpage_aide_navigation
           WHERE namespace = 'prime' AND path = '/dms'
      )
      SELECT 'list' AS component, title, description
        FROM navigation_cte;
      SELECT caption as title, COALESCE(url, path) as link, description
        FROM sqlpage_aide_navigation
       WHERE namespace = 'prime' AND parent_path = '/dms'
       ORDER BY sibling_order;`;
  }

  @dmsNav({
    caption: "Inbox",
    description: ``,
    siblingOrder: 1,
  })
  "dms/inbox.sql"() {
    return this.SQL`
      ${this.activePageTitle()}

      SELECT 'table' AS component,
            'subject' AS markdown,
            'Column Count' as align_right,
            TRUE as sort,
            TRUE as search;

      SELECT id,
      "from",
       '[' || subject || '](/dms/email-detail.sql?id=' || id || ')' AS "subject",
      date
      from inbox
      `;
  }

  // @spn.shell({ breadcrumbsFromNavStmts: "no" })
  // "dms/email-detail.sql"() {
  //   return this.SQL`
  //   SELECT 'table' as component;
  //   SELECT 'From: ' || "from" as "from" from inbox where CAST(id AS TEXT) = CAST($id AS TEXT);
  //   SELECT 'To: ' || "to" as "to" from inbox where CAST(id AS TEXT) = CAST($id AS TEXT);
  //   SELECT 'Date: ' || "date" as "date" from inbox where CAST(id AS TEXT) = CAST($id AS TEXT);
  //   SELECT 'Subject: ' || "subject" as "subject" from inbox where CAST(id AS TEXT) = CAST($id AS TEXT);
  //   SELECT "content" from  inbox where CAST(id AS TEXT)=CAST($id AS TEXT);
  //   `;
  // }
  @spn.shell({ breadcrumbsFromNavStmts: "no" })
  "dms/email-detail.sql"() {
    return this.SQL`
    ${this.activeBreadcrumbsSQL({ titleExpr: `$id` })}
     SELECT 'list' AS component;
      select 'From: ' || "from" as "description" from inbox where CAST(id AS TEXT)=CAST($id AS TEXT)
      union ALL
      select 'To: ' || "to"  from inbox where CAST(id AS TEXT)=CAST($id AS TEXT)
      union ALL
      select 'Subject: ' || "subject"  from inbox where CAST(id AS TEXT)=CAST($id AS TEXT)
      union ALL
      select 'Date: ' || "date"  from inbox where CAST(id AS TEXT)=CAST($id AS TEXT);





    SELECT 'table' as component;
    SELECT "content" FROM inbox where CAST(id AS TEXT)=CAST($id AS TEXT);
    `;
  }

  @dmsNav({
    caption: "Dispatched",
    description: "",
    siblingOrder: 2,
  })
  "dms/dispatched.sql"() {
    return this.SQL`
      ${this.activePageTitle()}

      SELECT 'table' as component,
            'subject' AS markdown,
            'Column Count' as align_right,
            TRUE as sort,
            TRUE as search;
      SELECT * from phimail_delivery_detail where status='dispatched'`;
  }

  @dmsNav({
    caption: "Failed",
    description: "",
    siblingOrder: 2,
  })
  "dms/failed.sql"() {
    return this.SQL`
      ${this.activePageTitle()}

      SELECT 'table' as component,
            'subject' AS markdown,
            'Column Count' as align_right,
            TRUE as sort,
            TRUE as search;
      SELECT * from phimail_delivery_detail where status!='dispatched'`;
  }

  // @dmsNav({
  //     caption: "Patient Details",
  //     description:
  //         "Shows the details of patient",
  //     siblingOrder: 3,
  // })
  // "dms/patient-detail.sql"() {
  //     return this.SQL`
  //   ${this.activePageTitle()}

  //   SELECT 'table' as component;
  //   SELECT * from patient_detail`;
  // }

  // @dmsNav({
  //     caption: "Patient Diangnostics",
  //     description:
  //         "Shows the patient observations",
  //     siblingOrder: 4,
  // })
  // "dms/patient-diagnostic-detail.sql"() {
  //     return this.SQL`
  //   ${this.activePageTitle()}

  //   SELECT 'table' as component;
  //   SELECT * from patient_clinical_observation`;
  // }
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  console.log(spn.TypicalSqlPageNotebook.SQL(new dmsSqlPages()).join("\n"));
}
