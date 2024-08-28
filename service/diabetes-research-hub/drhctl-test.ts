#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";

// Detect platform-specific command format
const isWindows = Deno.build.os === "windows";
const toolCmd = isWindows ? ".\\surveilr" : "./surveilr";
const RSC_BASE_URL =
 "https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/service/diabetes-research-hub";

// Helper function to execute a command
async function executeCommand(cmd: string[]) {
 console.log(colors.dim(`Executing command: ${cmd.join(" ")}`));

 const process = Deno.run({
  cmd, // Pass the command as an array
  stdout: "inherit",
  stderr: "inherit",
 });

 const status = await process.status();
 process.close();

 if (!status.success) {
  throw new Error(`Command failed with status ${status.code}`);
 }
}

// Helper function to fetch SQL content from a URL
async function fetchSqlContent(url: string): Promise<string> {
 const response = await fetch(url);
 if (!response.ok) {
  throw new Error(`Failed to fetch SQL content from ${url}`);
 }
 return await response.text();
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

 // Ingest files and orchestrate transform-csv
 console.log(colors.dim(`Performing DeIdentification: ${folderName}...`));
 await executeCommand([
  toolCmd,
  "orchestrate",
  "-n",
  "deidentification",
  "-s",
  `${RSC_BASE_URL}/de-identification/drh-deidentification.sql`,
 ]);

 console.log(
  colors.green("Deidentification successful."),
 );

 // Ingest files and orchestrate transform-csv
 console.log(
  colors.dim(`Performing Verfication and Validation : ${folderName}...`),
 );
 await executeCommand([
  toolCmd,
  "orchestrate",
  "-n",
  "v&v",
  "-s",
  `${RSC_BASE_URL}/verfication-validation/orchestrate-drh-vv.sql`,
 ]);
 console.log(
  colors.green(
   "Verification and validation orchestration completed successfully.",
  ),
 );

 // Ingest files and orchestrate transform-csv
 console.log(
  colors.dim(`Performing UX orchestration : ${folderName}...`),
 );
 await executeCommand([
  toolCmd,
  "orchestrate",
  "-n",
  "v&v",
  "-s",
  `${RSC_BASE_URL}/ux.auto.sql`,
 ]);
 console.log(
  colors.green(
   "UX orchestration completed successfully.",
  ),
 );

 console.log(colors.dim(`Loading DRH Edge UI...`));
 await executeCommand([toolCmd, "web-ui", "--port", "9000"]);

 // Continue with further commands if needed...
} catch (error) {
 console.error(colors.red("An error occurred:"), error.message);
 Deno.exit(1);
}
