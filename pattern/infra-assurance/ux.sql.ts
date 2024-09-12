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
    SELECT
    'card'             as component,
    3                 as columns;
    SELECT
    name AS title,
    '/opsfolio/infra/assurance/boundary_list.sql?boundary=' || name || '' as link,
    'Assets ' || (SELECT count(boundary)  FROM server_data WHERE boundary = border_boundary.name) AS footer_md
    FROM
        border_boundary;`;
  }

  @iaNav({
    caption: "Boundary List",
    description: ``,
    siblingOrder: 3,
  })
  "opsfolio/infra/assurance/boundary_list.sql"() {
    return this.SQL`

      select
    'title'              as component,
    $boundary as contents;
        select
      'card'             as component,
      3 as columns;
    select
        server              as title,
        'Assets ' || count(server) AS footer_md
        FROM asset_service_view WHERE boundary = $boundary::TEXT GROUP BY server;

      SELECT 'table' AS component,
        TRUE            as sort,
        TRUE            as search,
        TRUE    as hover,
        TRUE    as striped_rows,
        'Name' as markdown;
      SELECT
        '[' || name || '](/opsfolio/infra/assurance/assurance_detail.sql?name=' || name || ')' AS "Name",
        server as Server,
        asset_type as "Asset Type",
        boundary as Boundary,
        description as Description,
        port as Port,
        experimental_version as "Experimental Version",
        production_version as "Production Version",
        latest_vendor_version as "Latest Vendor Version",
        resource_utilization as "Resource Utilization",
        log_file as "Log File",
        vendor_link as "Vendor Link",
        installation_date as "Installation Date",
        criticality as Criticality,
        owner as Owner,
        asset_criticality as "Asset Criticality",
        asymmetric_keys as "Asymmetric Keys",
        cryptographic_key as "Cryptographic Key",
        symmetric_keys as "Symmetric Keys",
        status as Status
      FROM server_data WHERE boundary=$boundary::TEXT;
      `;
  }

  @iaNav({
    caption: "Infra Assurance Detail",
    description: ``,
    siblingOrder: 4,
  })
  "opsfolio/infra/assurance/assurance_detail.sql"() {
    return this.SQL`
    select
    'title'              as component,
    $name as contents;
    select
    'html' as component;
select
    '<div style="margin-top:15px;">
   <div style="width:49%; margin-right:1%; float:left; background:#fff;">
      <div class="border shadow-sm" style="border-radius:8px;">
         <div class="p-4">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Name</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || name ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

             <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Server</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || server ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Organization id</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || organization_id ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Asset type</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || asset_type ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Asset service type id</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || asset_service_type_id ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Boundary</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || boundary ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Description</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || description ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Port</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || port ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Experimental version</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || experimental_version ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Production version</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || production_version ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Latest vendor version</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || latest_vendor_version ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

             <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Resource utilization</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || resource_utilization ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">
         </div>
      </div>
   </div>

  <div style="width:49%; margin-right:1%; float:left; background:#fff;">
      <div class="border shadow-sm" style="border-radius:8px;">
         <div class="p-4">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Log file</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || log_file ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

             <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Url</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || url ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Vendor link</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || vendor_link ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Installation date</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || installation_date ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Criticality</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || criticality ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Owner</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || owner ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Tag</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || tag ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Asset criticality</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || asset_criticality ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Asymmetric keys</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || asymmetric_keys ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Cryptographic key</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || cryptographic_key ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

           <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Symmetric keys</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || symmetric_keys ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">

            <aside>
               <div style="width:39%; margin-right:1%; float:left;">
                  <div style="font-weight:600;">Status</div>
               </div>
               <div style="width:59%; margin-right:1%; float:left; text-align:right;">' || status ||'</div>
               <div style="clear:both;"></div>
            </aside>
            <hr style="margin-top:10px; margin-bottom:10px;">
         </div>
      </div>
   </div>
</div>' as html
FROM
  server_data WHERE name=$name::TEXT`;
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
