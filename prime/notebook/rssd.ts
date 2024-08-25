import { callable as c, SQLa, SQLa_typ as tp, user } from "../deps.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// deno-lint-ignore require-await
export const osUser = await user.osUserName(async () => ({
  userId: "indeterminate",
  provenance: "indeterminate",
}));

/**
 * Processes a template literal to remove unnecessary leading whitespace from each line.
 *
 * This function is typically used to format multi-line strings in a consistent manner
 * by removing leading spaces that match the indentation of the first non-blank line.
 *
 * @param literals - The array of literal strings in the template.
 * @param expressions - The array of expressions that are interpolated within the template.
 *
 * @returns {string} The formatted string with leading whitespace removed based on the first non-blank line's indentation.
 *
 * @example
 * // Example usage:
 * const formatted = unindentedText`
 *   function test() {
 *     console.log('Hello, World!');
 *   }
 * `;
 *
 * // The above code will remove the leading spaces that match the indentation
 * // of the first non-blank line ("function test()").
 * console.log(formatted);
 */
export function unindentedText(
  literals: TemplateStringsArray,
  ...expressions: unknown[]
): string {
  // Remove the first line if it has whitespace only or is a blank line
  const firstLiteral = literals[0].replace(/^(\s+\n|\n)/, "");
  const indentation = /^(\s*)/.exec(firstLiteral);

  let result: string;
  if (indentation) {
    const replacer = new RegExp(`^${indentation[1]}`, "gm");
    result = firstLiteral.replaceAll(replacer, "");
    for (let i = 0; i < expressions.length; i++) {
      result += expressions[i] + literals[i + 1].replaceAll(replacer, "");
    }
  } else {
    result = firstLiteral;
    for (let i = 0; i < expressions.length; i++) {
      result += expressions[i] + literals[i + 1];
    }
  }

  return result;
}

/**
 * Generates a Git-like SHA-1 hash for a given content string.
 *
 * This function emulates how Git calculates the hash for a `blob` object.
 * It adds a header to the content, encodes it, and then computes the SHA-1 hash.
 *
 * @param content - The content for which the hash will be generated.
 *
 * @returns A promise that resolves to the SHA-1 hash of the content in hexadecimal format.
 *
 * @example
 * // Example usage:
 * const hash = await gitLikeHash('Hello, World!');
 * console.log(hash); // Outputs the SHA-1 hash as a hexadecimal string
 */
export async function gitLikeHash(content: string) {
  // Git header for a blob object (change 'blob' to 'commit' or 'tree' for those objects)
  // This assumes the content is plain text, so we can get its length as a string
  const header = `blob ${content.length}\0`;

  // Combine header and content
  const combinedContent = new TextEncoder().encode(header + content);

  // Compute SHA-1 hash
  const hashBuffer = await crypto.subtle.digest("SHA-1", combinedContent);

  // Convert hash to hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  );

  return hashHex;
}

// TODO: https://github.com/opsfolio/resource-surveillance/issues/17
//       Integrate SQLa Quality System functionality so that documentation
//       is not just in code but makes its way into the database.

// Reminders:
// - when sending arbitrary text to the SQL stream, use SqlTextBehaviorSupplier
// - when sending SQL statements (which need to be ; terminated) use SqlTextSupplier
// - use jtladeiras.vscode-inline-sql, frigus02.vscode-sql-tagged-template-literals-syntax-only or similar SQL syntax highlighters in VS Code so it's easier to edit SQL

/**
 * MORE TODO for README.md:
 * Our SQL "notebook" is a library function which is responsible to pulling
 * together all SQL we use. It's important to note we do not prefer to use ORMs
 * that hide SQL and instead use stateless SQL generators like SQLa to produce
 * all SQL through type-safe TypeScript functions.
 *
 * Because applications come and go but data lives forever, we want to allow
 * our generated SQL to be hand-edited later if the initial generated code no
 * longers benefits from being regenerated in the future.
 *
 * We go to great lengths to allow SQL to be independently executed because we
 * don't always know the final use cases and we try to use the SQLite CLI whenever
 * possible because performance is best that way.
 *
 * Because SQL is a declarative and TypeScript is imperative langauage, use each
 * for their respective strengths. Use TypeScript to generate type-safe SQL and
 * let the database do as much work as well.
 * - Capture all state, valid content, invalid content, and other data in the
 *   database so that we can run queries for observability; if everything is in
 *   the database, including error messages, warnings, etc. we can always run
 *   queries and not have to store logs in separate system.
 * - Instead of imperatively creating thousands of SQL statements, let the SQL
 *   engine use CTEs and other capabilities to do as much declarative work in
 *   the engine as possible.
 * - Instead of copy/pasting SQL into multiple SQL statements, modularize the
 *   SQL in TypeScript functions and build statements using template literal
 *   strings (`xyz${abc}`).
 * - Wrap SQL into TypeScript as much as possible so that SQL statements can be
 *   pulled in from URLs.
 * - If we're importing JSON, CSV, or other files pull them in via
 *   `import .. from "xyz" with { type: "json" }` and similar imports in case
 *   the SQL engine cannot do the imports directly from URLs (e.g. DuckDB can
 *   import HTTP directly and should do so, SQLite can pull from URLs too with
 *   the http0 extension).
 * - Whenever possible make SQL stateful functions like DDL, DML, etc. idempotent
 *   either by using `ON CONFLICT DO NOTHING` or when a conflict occurs put the
 *   errors or warnings into a table that the application should query.
 */

/**
 * Represents a typical SQL notebook that produces blocks of SQL that will be
 * executed either by SQLite or `surveilr` to help create and populate Resource
 * Surveillance State Database (RSSDs) objects.
 *
 * This class is abstract and designed to be subclassed to define specific
 * notebooks with methods that generate SQL or other code. Its most important
 * subclasses are TypicalSqlNotebook and TypicalSqlPagesNotebook.
 *
 * ### Fetching and Using External Code
 *
 * The `TypicalSqlNotebook` class also provides utility functions, such as `fetchText()`, to fetch external
 * code or data that can be used within the notebook's cells, making it flexible and extensible for various
 * use cases.
 *
 * @example
 * // Example for fetching external code
 * const externalCode = await TypicalSqlNotebook.fetchText("https://example.com/code.sql");
 * console.log(externalCode);
 * ```
 */
export class SurveilrSqlNotebook<
  EmitContext extends SQLa.SqlEmitContext,
  DomainQS extends tp.TypicalDomainQS = tp.TypicalDomainQS,
  DomainsQS extends tp.TypicalDomainsQS = tp.TypicalDomainsQS,
> {
  readonly templateState = tp.governedTemplateState<
    DomainQS,
    DomainsQS,
    EmitContext
  >();
  readonly ddlOptions = this.templateState.ddlOptions;
  readonly emitCtx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.sqliteDialect(),
  }) as EmitContext;
  readonly keys = tp.governedKeys<DomainQS, DomainsQS, EmitContext>();
  readonly domains = tp.governedDomains<DomainQS, DomainsQS, EmitContext>();
  readonly model = tp.governedModel<DomainQS, DomainsQS, EmitContext>(
    this.ddlOptions,
  );
  readonly sqliteParamsVirtualTable = this.model.table("sqlite_parameters", {
    key: this.domains.text(),
    value: this.domains.text(),
  });

  // type-safe wrapper for all SQL text generated in this library;
  // we call it `SQL` so that VS code extensions like frigus02.vscode-sql-tagged-template-literals
  // properly syntax-highlight code inside SQL`xyz` strings.
  get SQL() {
    return SQLa.SQL<EmitContext>(this.ddlOptions);
  }

  // type-safe wrapper for all SQL that should not be treated as SQL statements
  // but as arbitrary text to send to the SQL stream
  sqlBehavior(
    sts: SQLa.SqlTextSupplier<EmitContext>,
  ): SQLa.SqlTextBehaviorSupplier<EmitContext> {
    return {
      executeSqlBehavior: () => sts,
    };
  }

  /**
   * Sets up SQL bind parameters for use in SQLite queries.
   *
   * This function transforms an object containing key-value pairs into SQL bind parameters,
   * where the keys are prefixed with a colon (`:`) to create SQLite-compatible parameter names
   * (e.g., `:key1`, `:key2`, etc.). The function also generates corresponding SQL Data Manipulation
   * Language (DML) statements that insert these parameters into the `sqlite_parameters` table,
   * which is a special table managed by SQLite to handle parameterized queries.
   *
   * SQLite has a special "virtual" table called `sqlite_parameters` that is used to store key-value
   * pairs for parameterized queries. This table should not be used for defining new schema (DDL) but
   * is useful for storing parameters for DML operations.
   *
   * The method generates an `INSERT INTO sqlite_parameters` statement for each key-value pair in the
   * `shape` object. This makes the keys available as SQLite bind parameters (e.g., `:key`) in SQL queries.
   *
   * Each key in the `shape` object is prefixed with a colon (`:`) to create a new key that is compatible
   * with SQLite's parameter binding syntax. For example, a key `key1` becomes `:key1`. The values in the
   * `shape` object are left unchanged, except when the value is a number. In this case, the number is
   * converted to a string, as SQLite parameters must be represented as strings.
   *
   * @template Shape - An object type representing the shape of the key-value pairs to be converted
   * into SQL bind parameters. Each key in the object is a string, and the value can be a string, number,
   * or an `SqlTextSupplier` instance.
   *
   * @param shape - An object containing the key-value pairs that will be converted to SQLite parameters.
   *
   * @returns An object containing two properties:
   * - `params`: A function that returns a new object where each key from the original `shape` is
   *   transformed into a SQLite parameter (prefixed with a colon `:`), and the values are unchanged.
   * - `paramsDML`: An array of DML statements that can be executed to insert the parameters into the
   *   `sqlite_parameters` table, making them available as bind parameters in subsequent queries.
   *
   * ### Example Usage:
   *
   * ```typescript
   * const paramsObj = {
   *   name: "Alice",
   *   age: 30,
   *   isAdmin: SQLa.literal("TRUE")
   * };
   *
   * const result = sqlParameters(paramsObj);
   *
   * // Access the transformed parameters
   * const bindParams = result.params();
   * // bindParams would be { ":name": "Alice", ":age": "30", ":isAdmin": SQLa.literal("TRUE") }
   *
   * // Access the DML statements to insert these parameters into the sqlite_parameters table
   * const dmlStatements = result.paramsDML;
   * ```
   *
   * In the above example, `sqlParameters` converts the `paramsObj` into SQLite-compatible bind parameters
   * and generates the necessary DML statements to insert these parameters into the `sqlite_parameters` table.
   */
  sqlParameters<
    Shape extends Record<
      string,
      string | number | SQLa.SqlTextSupplier<EmitContext>
    >,
  >(shape: Shape) {
    const paramsDML = Object.entries(shape).map(([key, value]) =>
      this.sqliteParamsVirtualTable.insertDML({
        key: `:${key}`,
        value: typeof value === "number" ? String(value) : value,
      })
    );

    type SqlParameters = { [K in keyof Shape as `:${string & K}`]: Shape[K] };
    return {
      params: (): SqlParameters => {
        const newShape: Partial<SqlParameters> = {};
        for (const key in shape) {
          const newKey = `:${key}`;
          (newShape as Any)[newKey] = shape[key];
        }
        return newShape as unknown as SqlParameters;
      },
      paramsDML,
    };
  }

  get sqlUser() {
    return osUser;
  }

  get sqlUserLiteral() {
    return `'${osUser?.userId.replaceAll("'", "''")}'`;
  }

  // ULID generator when the value is needed by the SQLite engine runtime
  get sqlEngineNewUlid(): SQLa.SqlTextSupplier<EmitContext> {
    return { SQL: () => `ulid()` };
  }

  // pass this into SQLa inserts, etc. when the SQL engine (not TypeScript) time should be used
  get sqlEngineNow(): SQLa.SqlTextSupplier<EmitContext> {
    return { SQL: () => `CURRENT_TIMESTAMP` };
  }

  get housekeepingValues() {
    return {
      created_at: this.sqlEngineNow,
      created_by: this.sqlUser?.userId,
    };
  }

  /**
   * Generates comment string indicating which class and method a subclassed
   * method is found, using the class name and method name from the call stack.
   *
   * @param importMetaURL - The URL from which the code is being executed, typically provided by `import.meta.url`.
   * @param [level=2] - The stack trace level to extract the method name from. Defaults to 2 (immediate parent).
   * @returns A string in the format "code provenance: `<class-name>.<method-name>` (<importMetaURL>)", or an error message if provenance can't be determined.
   */
  tsProvenanceComment(importMetaURL: string, level = 2) {
    // Get the stack trace using a new Error object
    const stack = new Error().stack;
    if (!stack) {
      return "code provenance: stack trace is not available";
    }

    // Split the stack to find the method name
    const stackLines = stack.split("\n");
    if (stackLines.length < level + 1) {
      return `code provenance: stack trace has fewer than ${level + 1} lines`;
    }

    // Parse the method name from the stack trace
    const methodLine = stackLines[level].trim();
    const methodNameMatch = methodLine.match(/at\s+(.*?)\s+\(/);
    if (!methodNameMatch) {
      return "code provenance: could not match method name in stack trace";
    }

    const fullMethodName = methodNameMatch[1];
    return `code provenance: \`${fullMethodName}\` (${importMetaURL})`;
  }

  onAnyConflictUpdate(...set: string[]) {
    return {
      // deno-fmt-ignore
      SQL: () => `ON CONFLICT DO UPDATE SET ${set.map(c => `${c} = COALESCE(EXCLUDED.${c}, ${c})`)}, "updated_at" = CURRENT_TIMESTAMP, "updated_by" = ${this.sqlUserLiteral};`,
    };
  }

  onSpecifcConflictUpdate(conflictExpr: string, ...set: string[]) {
    return {
      // deno-fmt-ignore
      SQL: () => `ON CONFLICT(${conflictExpr}) DO UPDATE SET ${set.map(c => `${c} = COALESCE(EXCLUDED.${c}, ${c})`)}, "updated_at" = CURRENT_TIMESTAMP, "updated_by" = ${this.sqlUserLiteral};`,
    };
  }

  viewDefn<ViewName extends string, DomainQS extends SQLa.SqlDomainQS>(
    viewName: ViewName,
  ) {
    return SQLa.viewDefinition<ViewName, EmitContext, DomainQS>(viewName, {
      isIdempotent: true,
      embeddedStsOptions: this.templateState.ddlOptions,
      before: (viewName) => SQLa.dropView(viewName),
    });
  }

  /**
   * Processes the result of a callable in a `TypicalSqlNotebook` subclass and converts it into a string.
   *
   * This function handles different types of return values from the callable:
   * - If the value is a string, it is returned as-is.
   * - If the value is an array, each item in the array is recursively processed, and the results are joined with newlines.
   * - If the value is an `SqlTextSupplier`, it generates the corresponding SQL using the notebook's emit context.
   * - If the value is of any other type, a comment string indicating the unexpected type is returned.
   *
   * @param c - The callable (usually class method) from which the value is obtained and processed.
   * @returns A promise that resolves to the processed string or SQL representation.
   *
   * @example
   * // Example usage within a TypicalSqlNotebook subclass:
   * const result = await notebookInstance.methodCodeText(callableFilterResult);
   * console.log(result); // Outputs the processed string or SQL statements
   */
  async methodText(c: c.Callable<SurveilrSqlNotebook<EmitContext>, Any>) {
    const textOf = (value: unknown): string => {
      if (typeof value === "string") {
        return value;
      } else if (Array.isArray(value)) {
        return value.map((item) => textOf(item)).join("\n");
      } else if (SQLa.isSqlTextSupplier(value)) {
        return value.SQL(this.emitCtx);
      } else {
        // deno-fmt-ignore
        return `\n/* '${String(c.callable)}' in '${String(c.source)}' returned type ${typeof value} instead of string | string[] | SQLa.SqlTextSupplier */`;
      }
    };

    return textOf(await c.call());
  }

  /**
   * Fetches the content of a local or remote file and returns it as a string.
   * The default implementation is just to use a static utility but can be
   * overriden for different behavior.
   * @param url the source to fetch text from
   * @returns A string promise
   * @see SurveilrSqlNotebook.fetchText
   */
  async fetchText(
    url: URL | string,
    onError?: (
      response?: Response,
      url?: URL | string,
      error?: Error,
    ) => string,
  ) {
    return await SurveilrSqlNotebook.fetchText(url, onError);
  }

  /**
   * Fetches the content of a local or remote file and returns it as a string.
   *
   * This method sends an HTTP GET request to the specified `url` and returns the
   * response body as a text string. If the request fails or an exception occurs,
   * an optional error handling function `onError` can be provided to customize the
   * error message. If `onError` is not provided, a default error message is returned.
   *
   * Regardless of success or failure, this function always returns a string.
   * In case of an error, the string returned will be the message generated by `onError`
   * or a default error message.
   *
   * @param url - The URL or file path of the resource to fetch.
   * @param onError - An optional callback function to handle errors. It receives the `Response` object (if available), the `url`, and an optional `Error` instance. The function should return a custom error message as a string. If it returns `undefined`, a default error message is used.
   *
   * @returns A promise that resolves to the text content of the fetched resource. If the fetch fails or an exception occurs, it resolves to the error message generated by `onError` or the default error message.
   *
   * @example
   * // Fetching a remote file
   * const text = await fetchText('https://example.com/data.txt');
   * console.log(text);
   *
   * @example
   * // Handling errors with a custom error function
   * const text = await fetchText('https://example.com/data.txt', (response, url, error) => {
   *   return `Failed to fetch ${url}: ${response?.statusText || error?.message}`;
   * });
   * console.log(text);
   */
  static async fetchText(
    url: URL | string,
    onError?: (
      response?: Response,
      url?: URL | string,
      error?: Error,
    ) => string,
  ): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return onError?.(response, url) ??
          `Error fetching ${url}: [${response.status}] (${response.statusText})`;
      }
      return response.text();
    } catch (error) {
      return onError?.(undefined, url, error) ??
        `Error fetching ${url}: ${error.message}`;
    }
  }

  /**
   * Generates SQL statements from TypicalSqlNotebook subclasses' method-based
   * notebooks.
   *
   * This function processes instances of `TypicalSqlNotebook` subclasses to
   * generate SQL statements based on methods defined within those subclasses.
   * Methods with names ending in "SQL", "DQL", "DML", or "DDL" are assumed to
   * be the SQL suppliers. All other methods are ignored.
   *
   * @param sources - A list of one or more instances of `TypicalSqlNotebook` subclasses.
   * @returns A promise that resolves to an array of strings representing the SQL statements.
   *
   * @example
   * // Example usage:
   * const sqlStatements = await SQL(notebookInstance1, notebookInstance2);
   * console.log(sqlStatements); // Outputs an array of SQL statements as strings
   */
  static async SQL(...sources: SurveilrSqlNotebook<Any>[]) {
    const cc = c.callablesCollection<SurveilrSqlNotebook<Any>, Any>(...sources);
    return await Promise.all(
      cc.filter({
        // include all methods whose names end in SQL, DQL, DML, or DDL
        include: /(SQL|DQL|DML|DDL)$/,
      }).map(async (c) => await c.source.instance.methodText(c)),
    );
  }
}
