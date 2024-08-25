import { callable as c, SQLa, ulid, user } from "../deps.ts";
import { gitLikeHash, SurveilrSqlNotebook } from "./rssd.ts";
import * as m from "../models/lifecycle.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// deno-lint-ignore require-await
export const osUser = await user.osUserName(async () => ({
  userId: "indeterminate",
  provenance: "indeterminate",
}));

export type CodeNotebookKernelTableDefn = ReturnType<
  typeof m.codeNotebooksModels
>["codeNotebookKernel"];
export type CodeNotebookCellTableDefn = ReturnType<
  typeof m.codeNotebooksModels
>["codeNotebookCell"];

export type Singular<T> = T extends Array<infer U> ? U : T;

export type CodeNotebookKernelRecord = Singular<
  Parameters<CodeNotebookKernelTableDefn["insertDML"]>[0]
>;
export type CodeNotebookCellRecord = Singular<
  Parameters<CodeNotebookCellTableDefn["insertDML"]>[0]
>;

export const {
  codeNotebookKernel: codeNotebookKernelTable,
  codeNotebookCell: codeNotebookCellTable,
} = m.codeNotebooksModels();

/**
 * Type representing a decorated kern method, which includes the kernel
 * options and additional metadata about the method to which the kernl
 * config is attached.
 *
 * @property ensureKernel - If a kernel record might not already exist
 * @property methodName - The name of the method.
 * @property methodFn - The function of the method.
 * @property methodCtx - The context of the method decorator.
 */
export type DecoratedCell =
  & Partial<CodeNotebookCellRecord>
  & {
    readonly ensureKernel?: CodeNotebookKernelRecord;
    readonly methodName: string;
    readonly methodFn: Any;
    readonly methodCtx: ClassMethodDecoratorContext<TypicalCodeNotebook>;
  };

/**
 * Decorator function which declares that the method it decorates creates a
 * code_notebook_cell row. This decorator adds code_notebook_cell.* column values
 * to the method it decorates and the result of the method creates the content in
 * code_notebook_cell.interpretable_code.
 *
 * @param init - The code_notebook_cell.* column values
 * @returns A decorator function that informs its host notebook about declaration
 *
 * @example
 * class MyNotebook extends TypicalCodeNotebook {
 *   @cell({ ... })
 *   "myCell"() {
 *     // method implementation
 *   }
 * }
 */
export function cell(
  init?:
    & Partial<CodeNotebookCellRecord>
    & { readonly ensureKernel?: CodeNotebookKernelRecord },
) {
  return function (
    methodFn: Any,
    methodCtx: ClassMethodDecoratorContext<TypicalCodeNotebook>,
  ) {
    const methodName = String(methodCtx.name);
    const dcn: DecoratedCell = {
      cell_name: methodName, // default cell_name
      ...init, // if cell_name is provided in init, it will override
      methodName,
      methodFn,
      methodCtx,
    };

    methodCtx.addInitializer(function () {
      this.cellConfig.set(methodName, dcn);
    });

    // return void so that decorated function is not modified
  };
}

/**
 * Represents a code notebook base class that generates SQL for with Resource
 * Surveillance Commons (RSC) code_notebook_* tables to handle the storage and
 * execution of code cells within an RSSD (for surveilr `notebook` subcommands
 * and SQL info schema lifecycle migrations).
 *
 * This class is designed to be subclassed to define specific notebooks with
 * methods that generate SQL or other code that can be stored into `code_notebook_cell`
 * and related tables.
 *
 * The methods in these subclasses can be decorated with `@cell()` to attach
 * metadata and configure how they should be processed.
 *
 * The methods in the subclassed notebook that end with "_cell" (or are
 * decorated with @cell) are specifically designed to generate code that will
 * be inserted into the `code_notebook_cell` table. Methods ending with "DQL",
 * "DML", or "DDL" are assumed to be general SQL statements that will be
 * included before `code_notebook_cell` upserts.
 *
 * The `@cell()` decorator plays a double-role: it indicates that a method is
 * producing `code_notebook_cell` content but allows the method to override cell
 * column values which would otherwise be auto-computed for an insert statement.
 *
 * Key features include:
 * - **Cell and Kernel Management**: Manages mappings of cell methods to notebook names and kernels,
 *   allowing for flexible and organized code execution.
 * - **SQL Generation**: Provides a consistent way to generate SQL statements from the notebook's methods,
 *   which can be inserted into the appropriate database tables.
 * - **Provenance Tracking**: Includes functionality to generate SQL comments that track the origin
 *   of the code, aiding in traceability and debugging.
 *
 * ### Example Usage
 *
 * ```typescript
 * class MyNotebook extends TypicalCodeNotebook {
 *   constructor() {
 *     // if no @cell provided, these are defaults
 *     super("MyNotebook", { kernelId: "myKernel" });
 *   }
 *
 *   @cell({ notebook_name: "MyCustomNotebook" }) // override default cell notebook
 *   myCell() {
 *     // whatever is returned from `*Cell` methods is assumed to be code that
 *     // will be inserted into code_notebook_cell.interpreted_code
 *     return `SELECT * FROM my_table;`;
 *   }
 *
 *   @cell() // will be treated as a cell with name `myCell2` in default notebook
 *   myCell2() {
 *     // whatever is returned from `*Cell` methods is assumed to be code that
 *     // will be inserted into code_notebook_cell.interpreted_code
 *     return `SELECT * FROM my_table;`;
 *   }
 *
 *   // ends in `_cell` so it will be treated as a cell record named `sqlCode` content
 *   sqlCode_cell() {
 *     // use codeBlock to unindent what should be put into `code_notebook_cell.interpreted_code`
 *     return codeBlock`
 *        -- ${this.tsProvenanceComment(import.meta.url)}
 *        INSERT INTO my_table (col1) VALUES ('value');`;
 *   }
 * }
 *
 * // Create an instance of the notebook
 * const notebook = new MyNotebook();
 *
 * // Generate SQL statements from the notebook methods
 * const sqlStatements = await TypicalCodeNotebook.SQL(notebook);
 *
 * // Outputs SQL including the notebook-specific cells and kernels
 * console.log(sqlStatements);
 * ```
 *
 * ### Fetching and Using External Code
 *
 * The `TypicalCodeNotebook` class also provides utility functions, such as `fetchText()`, to fetch external
 * code or data that can be used within the notebook's cells, making it flexible and extensible for various
 * use cases.
 *
 * @example
 * // Example for fetching external code
 * const externalCode = await TypicalCodeNotebook.fetchText("https://example.com/code.sql");
 * console.log(externalCode);
 * ```
 */
export class TypicalCodeNotebook
  extends SurveilrSqlNotebook<SQLa.SqlEmitContext> {
  readonly cellConfig: Map<string, DecoratedCell> = new Map();

  constructor(
    readonly notebookName: string,
    readonly ensureKernel?: DecoratedCell["ensureKernel"],
  ) {
    super();
  }

  async interpretableCodeHash(code: string) {
    return await gitLikeHash(code);
  }

  kernelUpsertStmt(
    ensure: Parameters<CodeNotebookKernelTableDefn["insertDML"]>[0],
  ) {
    const kc = codeNotebookKernelTable.columnNames(this.emitCtx).symbol;
    return codeNotebookKernelTable.insertDML({
      ...this.housekeepingValues,
      ...ensure,
    }, {
      onConflict: this.onAnyConflictUpdate(
        kc.code_notebook_kernel_id,
        kc.kernel_name,
        kc.description,
        kc.mime_type,
        kc.file_extn,
        kc.governance,
        kc.elaboration,
      ),
    });
  }

  cellUpsertStmt(
    ensure: Parameters<CodeNotebookCellTableDefn["insertDML"]>[0],
  ) {
    const cc = codeNotebookCellTable.columnNames(this.emitCtx).symbol;

    // TODO: the ON CONFLICT needs more investigation
    return codeNotebookCellTable.insertDML({
      ...this.housekeepingValues,
      ...ensure,
    }, {
      onConflict: this.onAnyConflictUpdate(
        cc.description,
        cc.cell_governance,
        cc.interpretable_code,
      ),
    });
  }

  /**
   * Generates SQL statements from TypicalCodeNotebook subclasses' method-based "code" notebooks.
   *
   * This function processes instances of `TypicalCodeNotebook` subclasses to generate SQL statements
   * based on methods defined within those subclasses. Methods with names ending in "_cell" are assumed
   * to generate text that will be upserted into the `code_notebook_cell` table with the name of the
   * call everything up to `_cell` (which will be stripped), while methods ending in "DQL", "DML", or
   * "DDL" are assumed to be general SQL statements included before the cell upserts. All other methods
   * are ignored.
   *
   * Additionally, methods in the subclassed notebooks that are decorated with `@cell()` will be properly
   * handled by this function.
   *
   * @param sources - A list of one or more instances of `TypicalCodeNotebook` subclasses.
   *
   * @returns A promise that resolves to an array of strings representing the SQL statements.
   *
   * @example
   * // Example usage:
   * const sqlStatements = await SQL(notebookInstance1, notebookInstance2);
   * console.log(sqlStatements); // Outputs an array of SQL statements as strings
   */
  static async SQL(...sources: TypicalCodeNotebook[]) {
    const cc = c.callablesCollection<TypicalCodeNotebook, Any>(...sources);
    const arbitrarySqlStmts = await Promise.all(
      cc.filter({
        // include all methods don't have cell() decorator and their names end in SQL, DQL, DML, or DDL
        include: (c, instance) =>
          instance.cellConfig.get(String(c))
            ? false
            : /(SQL|DQL|DML|DDL)$/.test(String(c)),
      }).map(async (c) => await c.source.instance.methodText(c as Any)),
    );
    const ensureKernels: CodeNotebookKernelRecord[] = [];
    const ensureKernelsUpserts: string[] = [];
    const codeCellUpserts = await Promise.all(
      cc.filter({
        // include all methods whose names end with _cell or has @cell() decorator
        include: [
          /_cell$/,
          (c, instance) => instance.cellConfig.get(String(c)) ? true : false,
        ],
      }).map(
        async (c) => {
          const notebook = c.source.instance;

          const cell_name = String(c.callable).replace(/_cell$/, "");
          const cellOverrides = notebook.cellConfig.get(cell_name);

          const ensureKernel = cellOverrides?.ensureKernel ??
            notebook.ensureKernel;
          if (
            ensureKernel &&
            ensureKernels.find((k) =>
              k.code_notebook_kernel_id ==
                ensureKernel.code_notebook_kernel_id
            )
          ) {
            ensureKernels.push(ensureKernel);
            ensureKernelsUpserts.push(
              notebook.kernelUpsertStmt(ensureKernel).SQL(
                notebook.emitCtx,
              ),
            );
          } // else notebook_kernel_id's value must exist in the database already

          // deno-fmt-ignore (c as Any is used because c is untyped)
          const interpretable_code = await c.source.instance.methodText(c as Any);
          return notebook.cellUpsertStmt({
            code_notebook_cell_id: cellOverrides?.code_notebook_cell_id ??
              ulid.ulid(),
            notebook_kernel_id: ensureKernel?.code_notebook_kernel_id ??
              cellOverrides?.notebook_kernel_id ?? "SQL",
            notebook_name: cellOverrides?.notebook_name ??
              notebook.notebookName,
            cell_name: cellOverrides?.cell_name ?? cell_name,
            interpretable_code,
            interpretable_code_hash: cellOverrides?.interpretable_code_hash ??
              await notebook.interpretableCodeHash(
                interpretable_code,
              ),
          }).SQL(notebook.emitCtx);
        },
      ),
    );
    return [
      ...arbitrarySqlStmts,
      ...ensureKernelsUpserts,
      ...codeCellUpserts,
    ];
  }
}
