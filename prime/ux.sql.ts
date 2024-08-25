#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import {
  console as c,
  orchestration as orch,
  shell as sh,
  uniformResource as ur,
} from "./web-ui-content/mod.ts";
import * as spn from "./notebook/sqlpage.ts";

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  const SQL = await spn.TypicalSqlPageNotebook.SQL(
    new sh.ShellSqlPages(),
    new c.ConsoleSqlPages(),
    new ur.UniformResourceSqlPages(),
    new orch.OrchestrationSqlPages(),
  );
  console.log(SQL.join("\n"));
}
