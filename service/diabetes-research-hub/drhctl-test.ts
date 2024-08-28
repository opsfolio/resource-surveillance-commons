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

// Check if a folder name was provided
if (Deno.args.length === 0) {
 console.error(
  colors.red("No folder name provided. Please provide a folder name."),
 );
 Deno.exit(1);
}

// Store the folder name in a variable
const folderName = Deno.args[0];

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

 // Continue with further commands if needed...
} catch (error) {
 console.error(colors.red("An error occurred:"), error.message);
 Deno.exit(1);
}
