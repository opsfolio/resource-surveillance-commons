#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";

// Detect platform-specific command format
const isWindows = Deno.build.os === "windows";
const toolCmd = isWindows ? ".\\surveilr" : "./surveilr";

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

// Helper function to execute a command with SQL content passed to stdin
async function executeCommandWithSqlSTDIN(sql: string, cmd: string[]) {
 console.log(colors.dim(`Running command: ${cmd.join(" ")}`));

 const process = Deno.run({
  cmd,
  stdin: "piped",
  stdout: "inherit",
  stderr: "inherit",
 });

 const encoder = new TextEncoder();
 await process.stdin.write(encoder.encode(sql));
 process.stdin.close();

 const status = await process.status();
 process.close();

 if (!status.success) {
  throw new Error(`Command failed with status ${status.code}`);
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

// Base URL for the resource surveillance commons
const RSC_BASE_URL =
 "https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/service/diabetes-research-hub";

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
 // Check if the surveilr tool exists and is executable

 // Ingest files and orchestrate transform-csv
 console.log(colors.dim(`Ingesting files from folder: ${folderName}...`));
 await executeCommand([toolCmd, "ingest", "files", "-r", `${folderName}/`]);
 await executeCommand([toolCmd, "orchestrate", "transform-csv"]);
 console.log(
  colors.green("Files ingestion and CSV transformation successful."),
 );

 // Fetch and execute deidentification orchestration
 const deidentificationUrl =
  `${RSC_BASE_URL}/de-identification/drh-deidentification.sql`;
 const deidentificationSql = await fetchSqlContent(deidentificationUrl);
 console.log(colors.dim("Executing deidentification orchestration..."));
 await executeCommandWithSqlSTDIN(deidentificationSql, [
  toolCmd,
  "orchestrate",
  "-n",
  "deidentification",
 ]);
 console.log(colors.green("Deidentification orchestration completed."));

 // Fetch and execute verification and validation orchestration
 const vvUrl = `${RSC_BASE_URL}/verfication-validation/orchestrate-drh-vv.sql`;
 const vvSql = await fetchSqlContent(vvUrl);
 console.log(
  colors.dim("Executing verification and validation orchestration..."),
 );
 await executeCommandWithSqlSTDIN(vvSql, [toolCmd, "orchestrate", "-n", "v&v"]);
 console.log(
  colors.green(
   "Verification and validation orchestration completed successfully.",
  ),
 );

 // Fetch and execute UX auto orchestration
 console.log("Executing UX auto orchestration...");
 const exec_url: string = `${RSC_BASE_URL}/ux.auto.sql`;
 await executeCommand([toolCmd, "orchestrate", "-n", "v&v", "-s", exec_url]);
 console.log(colors.green("UX auto orchestration completed successfully."));

 // Launch the SQLPage web UI
 console.log("SQLPage Web UI loading...");
 await executeCommand([toolCmd, "web-ui", "--port", "9000"]);
} catch (error) {
 console.error(colors.red("An error occurred:"), error.message);
 Deno.exit(1);
}
