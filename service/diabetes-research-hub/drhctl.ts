#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import { $ } from "https://deno.land/x/dax@0.4.0/mod.ts";

// Define a helper function to fetch SQL content from a URL
async function fetchSqlContent(url: string): Promise<string> {
 const response = await fetch(url);
 if (!response.ok) {
  throw new Error(`Failed to fetch SQL content from ${url}`);
 }
 return await response.text();
}

// Define a helper function to execute a command with SQL content
async function executeCommandWithSql(command: string, sql: string) {
 console.log(`Running command: ${command}`);

 // Run the command with stdin
 const process = Deno.run({
  cmd: command.split(" "),
  stdin: "piped",
  stdout: "inherit",
  stderr: "inherit",
 });

 // Write SQL content to stdin
 const encoder = new TextEncoder();
 await process.stdin.write(encoder.encode(sql));
 process.stdin.close(); // Close stdin to indicate EOF

 const status = await process.status();
 if (!status.success) {
  console.error(`Command failed with status ${status.code}`);
 }
}

// Base URL for the resource surveillance commons
const RSC_BASE_URL =
 "https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main";

// Check if a folder name was provided
if (Deno.args.length === 0) {
 console.error("No folder name provided. Please provide a folder name.");
 Deno.exit(1);
}

// Store the folder name in a variable
const folderName = Deno.args[0];

/// Log the start of the process
console.log(`Starting the process for folder: ${folderName}`);

try {
 // Ingest files and orchestrate transform-csv
 console.log(
  `Files from folder: ${folderName} conversion is in progress...`,
 );
 await $`surveilr ingest files -r ${folderName} && surveilr orchestrate transform-csv`;
 console.log("Files Conversion Successful!!");

 // Fetch and execute deidentification orchestration
 const deidentificationUrl =
  `${RSC_BASE_URL}/service/diabetes-research-hub/de-identification/drh-deidentification.sql`;
 const deidentificationSql = await fetchSqlContent(deidentificationUrl);

 console.log("PHI De-Identification is inprogress");
 await executeCommandWithSql(
  "surveilr orchestrate -n deidentification",
  deidentificationSql,
 );
 console.log("Deidentification completed");

 // Fetch and execute verification and validation orchestration
 const vvUrl =
  `${RSC_BASE_URL}/service/diabetes-research-hub/verfication-validation/orchestrate-drh-vv.sql`;
 const vvSql = await fetchSqlContent(vvUrl);
 console.log("Verficaton and Valdiation of Files is inprogress");

 await executeCommandWithSql("surveilr orchestrate -n v&v", vvSql);
 console.log("Verification and validation completed successfully!!");

 // Fetch and execute UX auto orchestration
 // const uxAutoUrl = `${RSC_BASE_URL}/service/diabetes-research-hub/ux.auto.sql`;
 // const uxAutoSql = await fetchSqlContent(uxAutoUrl);
 // console.log("SqlPage Build in progress");
 // await executeCommandWithSql("surveilr orchestrate -n v&v", uxAutoSql);

 // console.log("Orchestration Process completed successfully!");

 // // Launch the SQLPage web UI
 // console.log("Sqlpage Web UI loading...");
 // await $`surveilr web-ui --port 9000`;
} catch (error) {
 console.error("An error occurred:", error.message);
 Deno.exit(1);
}
