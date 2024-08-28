#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

// execute the file using command `deno run -A drhctl.ts study-files`
//`study-files` is the name of the folder containing files to be ingested

import { $ } from "https://deno.land/x/dax@0.4.0/mod.ts";
import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";

// Define a helper function to fetch SQL content from a URL
async function fetchSqlContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SQL content from ${url}`);
  }
  return await response.text();
}

// Define a helper function to execute a command with SQL content
async function executeCommandWithSqlSTDIN(sql: string, ...cmd: string[]) {
  console.log(colors.dim(`Running command: ${cmd.join(" ")}`));

  // Run the command with stdin
  const process = Deno.run({
    cmd,
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
    console.error(colors.red(`Command failed with status ${status.code}`));
    Deno.exit(status.code);
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

// Log the start of the process
console.log(colors.cyan(`Starting the process for folder: ${folderName}`));

try {
  // Ingest files and orchestrate transform-csv
  console.log(colors.dim(`Ingesting files from folder: ${folderName}...`));
  await $`surveilr ingest files -r ${folderName} && surveilr orchestrate transform-csv`;
  //await $`surveilr orchestrate transform-csv`;
  console.log(
    colors.green("Files ingestion and CSV transformation successful."),
  );

  // Fetch and execute deidentification orchestration
  const deidentificationUrl =
    `${RSC_BASE_URL}/de-identification/drh-deidentification.sql`;
  const deidentificationSql = await fetchSqlContent(deidentificationUrl);
  console.log(colors.dim("Executing deidentification orchestration..."));
  await executeCommandWithSqlSTDIN(
    deidentificationSql,
    "surveilr",
    "orchestrate",
    "-n",
    "deidentification",
  );
  console.log(colors.green("Deidentification orchestration completed."));

  // Fetch and execute verification and validation orchestration
  const vvUrl = `${RSC_BASE_URL}/verfication-validation/orchestrate-drh-vv.sql`;
  const vvSql = await fetchSqlContent(vvUrl);
  console.log(
    colors.dim("Executing verification and validation orchestration..."),
  );
  await executeCommandWithSqlSTDIN(
    vvSql,
    "surveilr",
    "orchestrate",
    "-n",
    "v&v",
  );
  console.log(
    colors.green(
      "Verification and validation orchestration completed successfully.",
    ),
  );

  // Fetch and execute UX auto orchestration
  // const uxAutoUrl = `${RSC_BASE_URL}/service/diabetes-research-hub/ux.auto.sql`;
  // const uxAutoSql = await fetchSqlContent(uxAutoUrl);
  // console.log(colors.dim("Executing UX auto orchestration..."));
  // await executeCommandWithSqlSTDIN(
  //  uxAutoSql,
  //  "surveilr",
  //  "orchestrate",
  //  "-n",
  //  "v&v",
  // );
  // console.log(colors.green("UX auto orchestration completed successfully."));

  console.log("Executing UX auto orchestration...");
  console.log(`${RSC_BASE_URL}/ux.auto.sql`);
  //await executeCommandWithSql("surveilr orchestrate -n v&v -s", uxAutoSql);
  await $`surveilr orchestrate -n "v&v" -s https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/service/diabetes-research-hub/ux.auto.sql`;

  // console.log("Orchestration Process completed successfully!");

  // Launch the SQLPage web UI
  console.log("Sqlpage Web UI loading...");
  await $`surveilr web-ui --port 9000`;
} catch (error) {
  console.error(colors.red("An error occurred:"), error.message);
  Deno.exit(1);
}
