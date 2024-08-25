#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { cell, TypicalCodeNotebook } from "./notebook/code.ts";
import { lifecycle as lcm } from "./models/mod.ts";

export class BootstrapNotebook extends TypicalCodeNotebook {
  readonly codeNbModels = lcm.codeNotebooksModels();
  readonly serviceModels = lcm.serviceModels();

  constructor() {
    super("bootstrap", {
      code_notebook_kernel_id: "SQL",
      kernel_name: "SQLite SQL Statements",
      mime_type: "application/sql",
      file_extn: ".sql",
    });
  }

  bootstrapDDL() {
    return this.SQL`
      ${this.codeNbModels.informationSchema.tables}

      ${this.codeNbModels.informationSchema.tableIndexes}
      `;
  }

  bootstrapSeedDML() {
    return [
      this.kernelUpsertStmt({
        code_notebook_kernel_id: "SQL",
        kernel_name: "SQLite SQL Statements",
        mime_type: "application/sql",
        file_extn: ".sql",
      }),
      this.kernelUpsertStmt({
        code_notebook_kernel_id: "DenoTaskShell",
        kernel_name: "Deno Task Shell",
        mime_type: "application/x-deno-task-sh",
        file_extn: ".deno-task-sh",
      }),
    ];
  }

  // note `once_` pragma means it must only be run once in the database; this
  // `once_` pragma does not mean anything to the code_notebook_* infra but the
  // naming convention does tell `surveilr` migration lifecycle how to operate
  // the cell at runtime initiatlize of the RSSD.
  @cell()
  v001_once_initialDDL() {
    // deno-fmt-ignore
    return this.SQL`
      -- ${this.tsProvenanceComment(import.meta.url)}

      ${this.serviceModels.informationSchema.tables}

      ${this.serviceModels.informationSchema.tableIndexes}`;
  }
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  const SQL = await TypicalCodeNotebook.SQL(new BootstrapNotebook());
  console.log(SQL.join("\n"));
}
