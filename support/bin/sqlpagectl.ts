#!/usr/bin/env -S deno run --allow-run --allow-env --allow-net --allow-read --allow-write

import { debounce } from "https://deno.land/std@0.224.0/async/debounce.ts";
import {
  brightGreen,
  brightRed,
  brightWhite,
  brightYellow,
  cyan,
  dim,
} from "https://deno.land/std@0.224.0/fmt/colors.ts";
import { relative, resolve } from "https://deno.land/std@0.224.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

const DEV_DEFAULT_PORT = 9000;
const DEV_DEFAULT_DB = Deno.env.get("SURVEILR_STATEDB_FS_PATH") ??
  "resource-surveillance.sqlite.db";

function timeSince(date: Date): string {
  const milliseconds = new Date().getTime() - date.getTime();
  const intervals = [
    { label: "years", seconds: 31536000 },
    { label: "months", seconds: 2592000 },
    { label: "days", seconds: 86400 },
    { label: "hours", seconds: 3600 },
    { label: "minutes", seconds: 60 },
    { label: "seconds", seconds: 1 },
    { label: "milliseconds", seconds: 1 / 1000 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(milliseconds / (interval.seconds * 1000));
    if (count >= 1) {
      return `${count} ${interval.label}`;
    }
  }

  return `${milliseconds} milliseconds`;
}

export type FlexibleText =
  | string
  | { readonly fileSystemPath: string | string[] }
  | Iterable<string>
  | ArrayLike<string>
  | Generator<string>;

export type FlexibleTextSupplierSync =
  | FlexibleText
  | (() => FlexibleText);

/**
 * Accept a flexible source of text such as a string, a file system path, an
 * array of strings or a TypeScript Generator and convert them to a string
 * array.
 * @param supplier flexible source of text
 * @returns a resolved string array of text
 */
export const flexibleTextList = (
  supplier: FlexibleTextSupplierSync,
  options?: {
    readTextFileSync?: (...fsPath: string[]) => string[];
  },
): string[] => {
  const readTextFileSync = options?.readTextFileSync ??
    ((...fsPath) => fsPath.map((fsp) => Deno.readTextFileSync(fsp)));

  return typeof supplier === "function"
    ? flexibleTextList(supplier())
    : typeof supplier === "string"
    ? [supplier]
    : (typeof supplier === "object" && "fileSystemPath" in supplier
      ? Array.isArray(supplier.fileSystemPath)
        ? readTextFileSync(...supplier.fileSystemPath)
        : readTextFileSync(supplier.fileSystemPath)
      : Array.from(supplier));
};

/**
 * Executes a command with optional environment variables and input data.
 * @param command - The command to execute, specified as an array where the first element is the command and the rest are arguments.
 * @param env - Optional environment variables to set for the command.
 * @param stdInSupplier - Optional string input to pass to the command via stdin.
 * @returns A promise that returns the spawned results
 */
export async function spawnedResult(
  command: string[],
  env?: Record<string, string>,
  stdInSupplier?: Uint8Array | FlexibleTextSupplierSync,
) {
  const cmd = new Deno.Command(command[0], {
    args: command.slice(1),
    env,
    stdin: stdInSupplier ? "piped" : undefined,
    stdout: "piped",
    stderr: "piped",
  });
  const childProcess = cmd.spawn();

  if (stdInSupplier) {
    const stdInPipe = childProcess.stdin.getWriter();
    if (stdInSupplier instanceof Uint8Array) {
      stdInPipe.write(stdInSupplier);
    } else {
      const te = new TextEncoder();
      for (const SQL of flexibleTextList(stdInSupplier)) {
        stdInPipe.write(te.encode(SQL));
      }
    }
    stdInPipe.close();
  }

  const { success, code, stdout: stdoutRaw, stderr: stderrRaw } =
    await childProcess
      .output();

  return {
    childProcess,
    command,
    code,
    success,
    stdoutRaw,
    stderrRaw,
    stdout: () => new TextDecoder().decode(stdoutRaw),
    stderr: () => new TextDecoder().decode(stderrRaw),
  };
}

async function observeSqlPageFiles(db: string) {
  const dbFileStat = Deno.lstatSync(db);
  const sqliteResult = await spawnedResult(
    ["sqlite3", db, "--json"],
    undefined,
    `SELECT path, length(contents) as contentsSize, last_modified as modifiedAt FROM sqlpage_files;`,
  );
  const stdErr = sqliteResult.stderr().trim();
  if (stdErr.length) console.log(brightRed(stdErr));
  return {
    db: resolve(db),
    dbFileStat,
    ...sqliteResult,
    sqlPageFiles: () =>
      JSON.parse(
        sqliteResult.stdout(),
        (key, value) => key == "modifiedAt" ? new Date(value) : value,
      ) as {
        readonly path: string;
        readonly modifiedAt: Date;
        readonly contentsSize: number;
      }[],
  };
}

/**
 * Executes SQL scripts from a given file on an SQLite database.
 * The file can be a plain SQL file or a TypeScript file. For TypeScript files, the default export
 * must provide the SQL script either directly as a string or via a function that returns a string.
 *
 * @param file - The path to the file containing the SQL script.
 * @param db - The path to the SQLite database file.
 */
async function executeSqlite3(
  file: string,
  db: string,
  showModifiedUrlsOnChange: boolean,
) {
  let sqlScript: string | null = "";

  const stat = Deno.lstatSync(file);
  if (!file.endsWith(".sql") && stat.mode && (stat.mode & 0o111)) {
    const execFileResult = await spawnedResult([file]);
    sqlScript = execFileResult.stdout();
    if (!sqlScript) {
      return; // Exit if there was an error or no script was found
    }
    console.log(
      dim(`⌛ Executing generated ${relative(".", file)} in database ${db}`),
    );
  } else {
    // For .sql files, read the contents directly
    sqlScript = await Deno.readTextFile(file);
    console.log(dim(`⌛ Executing ${relative(".", file)} in database ${db}`));
  }

  const observeBefore = showModifiedUrlsOnChange
    ? await observeSqlPageFiles(db)
    : null;
  const sqlResult = await spawnedResult(["sqlite3", db], undefined, sqlScript);
  if (sqlResult.success) {
    console.log(
      dim(`✅`),
      brightGreen(`cat ${relative(".", file)} | sqlite3 ${db}`),
    );
  } else {
    // if you change the name of this file, update watchFiles(...) call and gitignore
    const errorSqlScriptFName = `ERROR-${crypto.randomUUID()}.sql`;
    Deno.writeTextFile(errorSqlScriptFName, sqlScript);
    console.error(
      dim(`❌`),
      brightRed(
        `Failed to execute ${
          relative(".", file)
        } (${sqlResult.code}) [see ${errorSqlScriptFName}]`,
      ),
    );
    if (!file.endsWith(".sql")) {
      console.error(
        dim(`❗`),
        brightYellow(
          `Reminder: ${
            relative(".", file)
          } must be executable in order to generate SQL.`,
        ),
      );
    }
  }
  const stdOut = sqlResult.stdout().trim();
  if (stdOut.length) console.log(dim(stdOut));
  console.log(brightRed(sqlResult.stderr()));

  const observeAfter = showModifiedUrlsOnChange
    ? await observeSqlPageFiles(db)
    : null;
  return {
    sqlScript,
    sqlResult,
    observeBefore,
    observeAfter,
    sqlPageFilesModified: showModifiedUrlsOnChange
      ? observeAfter?.sqlPageFiles().filter((afterEntry) => {
        const beforeEntry = observeBefore?.sqlPageFiles().find((beforeEntry) =>
          beforeEntry.path === afterEntry.path
        );
        return (
          !beforeEntry ||
          beforeEntry.modifiedAt.getTime() !==
            afterEntry.modifiedAt.getTime() ||
          beforeEntry.contentsSize !== afterEntry.contentsSize
        );
      })
      : null,
  };
}

/**
 * Watches for changes in the specified files and triggers the execution of SQL scripts
 * on the SQLite database whenever a change is detected.
 *
 * @param watch.paths - The list of paths to watch
 * @param watch.recusive - Whether to watch the list of paths recursively
 * @param files - The list of files to watch.
 * @param db - The path to the SQLite database file.
 * @param service
 * @showModifiedUrlsOnChange - Query the database and see what was changed between calls
 */
async function watchFiles(
  watch: { paths: string[]; recursive: boolean },
  files: RegExp[],
  db: string,
  service: {
    readonly stop?: () => Promise<void>;
    readonly start?: () => Promise<void>;
  },
  showModifiedUrlsOnChange: boolean,
) {
  try {
    console.log(
      dim(
        `👀 Watching paths [${watch.paths.join(" ")}] ${
          files.map((f) => f.toString()).join(", ")
        } (${watch.paths.length})`,
      ),
    );
    const reload = debounce(async (event: Deno.FsEvent) => {
      for (const path of event.paths) {
        for (const file of files) {
          if (file.test(path)) {
            // deno-fmt-ignore
            console.log(dim(`👀 Watch event (${event.kind}): ${brightWhite(relative(".", path))}`));
            await service.stop?.();
            const result = await executeSqlite3(
              path,
              db,
              showModifiedUrlsOnChange,
            );
            if (showModifiedUrlsOnChange) {
              const spFiles = result?.sqlPageFilesModified?.sort((a, b) =>
                b.modifiedAt.getTime() - a.modifiedAt.getTime()
              );
              // deno-fmt-ignore
              console.log(dim(`${relative('.', result?.observeAfter?.db ?? '.')} size ${result?.observeBefore?.dbFileStat.size} -> ${result?.observeAfter?.dbFileStat.size} (${result?.observeBefore?.dbFileStat.mtime} -> ${result?.observeAfter?.dbFileStat.mtime})`));
              if (spFiles) {
                for (const spf of spFiles) {
                  // deno-fmt-ignore
                  console.log(cyan(`http://localhost:9000/${spf.path}`), `[${spf.contentsSize}]`, dim(`(${timeSince(spf.modifiedAt)} ago, ${spf.modifiedAt})`));
                }
              }
            }
            service.start?.();
          }
        }
      }
    }, 200);

    const watcher = Deno.watchFs(watch.paths, { recursive: watch.recursive });
    for await (const event of watcher) {
      if (event.kind === "modify" || event.kind === "create") {
        reload(event);
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log(
        brightRed(`Invalid watch path: ${watch.paths.join(":")} (${error})`),
      );
    } else {
      console.log(brightRed(`watchFiles issue: ${error} (${files}, ${db})`));
    }
  }
}

function sqlPageDevAction(options: {
  readonly port: number;
  readonly watch: string[];
  readonly watchRecurse: boolean;
  readonly standalone: boolean;
  readonly restartSqlpageOnChange: true;
  readonly showModifiedUrlsOnChange: boolean;
}) {
  const {
    port,
    standalone,
    restartSqlpageOnChange,
    showModifiedUrlsOnChange,
  } = options;
  const db = DEV_DEFAULT_DB;

  // Determine the command and arguments
  const serverCommand = standalone
    ? ["sqlpage"]
    : ["surveilr", "web-ui", "--port", String(port)];
  const serverEnv = standalone
    ? {
      SQLPAGE_PORT: String(port),
      SQLPAGE_DATABASE_URL: `sqlite://${db}?mode=ro`,
    }
    : undefined;

  // Start the server process
  if (standalone) {
    console.log(cyan(`Starting standlone SQLPage server on port ${port}...`));
    console.log(brightYellow(`SQLPage server running with database: ${db}`));
  } else {
    console.log(
      cyan(`Starting surveilr embedded SQLPage server on port ${port}...`),
    );
  }

  const baseUrl = `http://localhost:${port}`;
  console.log(
    dim(`Restart SQLPage server on each change: ${restartSqlpageOnChange}`),
  );
  console.log(brightYellow(`${baseUrl}/index.sql`));

  let sqlPageServerProcess: Deno.ChildProcess | null;
  const sqlPageService = {
    // deno-lint-ignore require-await
    start: async () => {
      if (sqlPageServerProcess) {
        if (!restartSqlpageOnChange) return;
        console.log(
          brightRed(
            `⚠️ Unable start new SQLPage server, process is already running.`,
          ),
        );
        return;
      }
      const sqlPageCmd = new Deno.Command(serverCommand[0], {
        args: serverCommand.slice(1),
        env: serverEnv,
        stdout: "inherit",
        stderr: "inherit",
      });
      sqlPageServerProcess = sqlPageCmd.spawn();
      console.log(
        dim(`👍 Started SQLPage server with PID ${sqlPageServerProcess.pid}`),
      );
    },

    stop: async () => {
      if (!restartSqlpageOnChange) return;
      if (sqlPageServerProcess) {
        const existingPID = sqlPageServerProcess?.pid;
        sqlPageServerProcess?.kill("SIGINT");
        const { code } = await sqlPageServerProcess.status;
        sqlPageServerProcess = null;
        console.log(
          dim(`⛔ Stopped SQLPage server with PID ${existingPID}: ${code}`),
        );
      } else {
        console.log(
          brightRed("Unable to stop SQLPage server, no process started."),
        );
      }
    },
  };

  // Watch for changes in SQL and TS files and execute sqlite3 on change
  watchFiles(
    { paths: options.watch, recursive: options.watchRecurse },
    [/\.sql\.ts$/, /(^ERROR-).*\.sql$/],
    db,
    sqlPageService,
    showModifiedUrlsOnChange,
  );

  sqlPageService.start();
}

// deno-fmt-ignore so that commands defn is clearer
await new Command()
  .name("sqlpagectl")
  .version("1.0.0")
  .description("SQLPage controller")
  .command("dev", "Developer (sqlpage_files) lifecycle and experience")
    .option("-p, --port <port:number>", "Port to run SQLPage server on", { default: DEV_DEFAULT_PORT })
    .option("-w, --watch <path:string>", "watch path(s)", { default: ".", collect: true })
    .option("-R, --watch-recurse", "Watch subdirectories too", { default: false })
    .option("-s, --standalone", "Run standalone SQLPage instead of surveilr embedded", { default: false })
    .option("--restart-sqlpage-on-change", "Restart the SQLPage server on each change, needed for SQLite", { default: true })
    .option("--show-modified-urls-on-change", "After reloading sqlpage_files, show the recently modified URLs", { default: false })
    .action(sqlPageDevAction)
  .parse(Deno.args ?? ["dev"]);
