#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";
import {
 FlexibleTextSupplierSync,
 spawnedResult,
 textFromSupplierSync,
} from "../../lib/universal/spawn.ts";

// Detect platform-specific command format
const isWindows = Deno.build.os === "windows";
const toolCmd = isWindows ? ".\\surveilr" : "./surveilr";

// Helper function to execute a command
async function executeCommand(
 cmd: string[],
 stdinSupplier?: FlexibleTextSupplierSync,
) {
 try {
  console.log(colors.dim(`Executing command: ${cmd.join(" ")}`));

  // Use spawnedResult for executing the command
  const result = await spawnedResult(
   cmd,
   undefined,
   stdinSupplier ? textFromSupplierSync(stdinSupplier) : undefined,
  );

  if (!result.success) {
   throw new Error(`Command failed with status ${result.code}`);
  }
 } catch (error) {
  console.error(
   colors.red(`Error executing command ${cmd.join(" ")}:`),
   error.message,
  );
  Deno.exit(1);
 }
}

// Function to check if a file exists and delete it if it does
async function checkAndDeleteFile(filePath: string) {
 try {
  const fileInfo = await Deno.stat(filePath);
  if (fileInfo.isFile) {
   console.log(colors.yellow(`File ${filePath} found. Deleting...`));
   await Deno.remove(filePath);
   console.log(colors.green(`File ${filePath} deleted.`));
  }
 } catch (error) {
  if (error instanceof Deno.errors.NotFound) {
   console.log(colors.green(`File ${filePath} not found. No action needed.`));
  } else {
   console.error(
    colors.red(`Error checking or deleting file ${filePath}:`),
    error.message,
   );
   Deno.exit(1);
  }
 }
}

// Check if a folder name was provided
if (Deno.args.length === 0) {
 console.error(
  colors.red("No folder name provided. Please provide a folder name."),
 );
 Deno.exit(1);
}

// Store the folder name in a variable
const folderName = Deno.args[0];

// Path to the SQLite database file
const dbFilePath = "./resource-surveillance.sqlite.db";

// Read SQL content from local files
let deidentificationSQL: string;
let vvSQL: string;
let uxSQL: string;

try {
 deidentificationSQL = await Deno.readTextFile(
  "./de-identification/drh-deidentification.sql",
 );
 vvSQL = await Deno.readTextFile(
  "./verfication-validation/orchestrate-drh-vv.sql",
 );
 uxSQL = await Deno.readTextFile("./ux.auto.sql");
} catch (error) {
 console.error(
  colors.red(
   "Error reading SQL contents for DeIdentification and Verification & Validation:",
  ),
  error.message,
 );
 Deno.exit(1);
}

// Define synchronous suppliers
const deidentificationSQLSupplier: FlexibleTextSupplierSync = () =>
 deidentificationSQL;
const vvSQLSupplier: FlexibleTextSupplierSync = () => vvSQL;
const uxSQLSupplier: FlexibleTextSupplierSync = () => uxSQL;

// Check and delete the file if it exists
await checkAndDeleteFile(dbFilePath);

// Log the start of the process
console.log(colors.cyan(`Starting the process for folder: ${folderName}`));

try {
 // Ingest files and orchestrate transform-csv
 console.log(colors.dim(`Ingesting files from folder: ${folderName}...`));
 await executeCommand([toolCmd, "ingest", "files", "-r", `${folderName}/`]);
 await executeCommand([toolCmd, "orchestrate", "transform-csv"]);
 console.log(
  colors.green("Files ingestion and CSV transformation successful."),
 );

 // Perform DeIdentification
 console.log(colors.dim(`Performing DeIdentification: ${folderName}...`));
 await executeCommand(
  [toolCmd, "orchestrate", "-n", "deidentification"],
  deidentificationSQLSupplier,
 );
 console.log(colors.green("Deidentification successful."));

 // Perform Verification and Validation
 console.log(
  colors.dim(`Performing Verification and Validation: ${folderName}...`),
 );
 await executeCommand([toolCmd, "orchestrate", "-n", "v&v"], vvSQLSupplier);
 console.log(
  colors.green(
   "Verification and validation orchestration completed successfully.",
  ),
 );

 // Perform UX orchestration
 console.log(colors.dim(`Performing UX orchestration: ${folderName}...`));
 await executeCommand([toolCmd, "orchestrate", "-n", "v&v"], uxSQLSupplier);
 console.log(colors.green("UX orchestration completed successfully."));

 console.log(
  colors.green(`Loading DRH Edge UI... at http://localhost:9000/drh/index.sql`),
 );
 await executeCommand([toolCmd, "web-ui", "--port", "9000"]);
} catch (error) {
 console.error(colors.red("An error occurred:"), error.message);
 Deno.exit(1);
}
