#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import {
  console as c,
  shell as sh,
  uniformResource as ur,
} from "./content/mod.ts";
import * as spn from "./sqlpage-notebook.ts";

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  console.log(
    spn.TypicalSqlPageNotebook.SQL<
      spn.TypicalSqlPageNotebook
    >(
      new sh.ShellSqlPages(),
      new c.ConsoleSqlPages(),
      new ur.UniformResourceSqlPages(),
    ).join("\n"),
  );
}
