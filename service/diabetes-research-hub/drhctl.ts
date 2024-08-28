#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

// execute the file using command `deno run -A drhctl.ts study-files`
//`study-files` is the name of the folder containing files to be ingested

import { $ } from "https://deno.land/x/dax@0.4.0/mod.ts";
import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";
import { typeGuard } from "https://raw.githubusercontent.com/netspective-labs/sql-aide/v0.14.8/lib/universal/safety.ts";

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
  try {
    // Ingest files and orchestrate transform-csv
    console.log(colors.dim(`Ingesting files from folder: ${folderName}...`));
    console.log(colors.dim(`Please wait....may incur more time`));
    await $`./surveilr ingest files -r ${folderName} && ./surveilr orchestrate transform-csv`;
    //await $`surveilr orchestrate transform-csv`;
    console.log(
      colors.green("Files ingestion and transformation successful."),
    );
  } catch (error) {
    // Optionally handle the error or log it if needed
    console.error(
      colors.red(
        "An error occurred during Files ingestion and transformation process.",
      ),
      error,
    );
  }

  // Fetch and execute deidentification orchestration
  try {
    const deidentificationUrl =
      `${RSC_BASE_URL}/de-identification/drh-deidentification.sql`;
    const deidentificationSql = await fetchSqlContent(deidentificationUrl);
    console.log(colors.dim("Executing deidentification ..."));
    await executeCommandWithSqlSTDIN(
      deidentificationSql,
      "./surveilr",
      "orchestrate",
      "-n",
      "deidentification",
    );
    console.log(colors.green("Deidentification completed."));
  } catch (error) {
    // Optionally handle the error or log it if needed
    console.error(
      colors.red("An error occurred during Deidentification process."),
      error,
    );
  }

  // Fetch and execute verification and validation orchestration
  try {
    const vvUrl =
      `${RSC_BASE_URL}/verfication-validation/orchestrate-drh-vv.sql`;
    const vvSql = await fetchSqlContent(vvUrl);
    console.log(
      colors.dim("Executing verification and validation ..."),
    );
    await executeCommandWithSqlSTDIN(
      vvSql,
      "./surveilr",
      "orchestrate",
      "-n",
      "v&v",
    );
    console.log(
      colors.green(
        "Verification and validation orchestration completed successfully.",
      ),
    );
  } catch (error) {
    // Optionally handle the error or log it if needed
    console.error(
      colors.red(
        "An error occurred during Verification and validation process.",
      ),
      error,
    );
  }

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

  try {
    console.log("Executing UX auto orchestration...");
    //console.log(`${RSC_BASE_URL}/ux.auto.sql`);
    //await executeCommandWithSql("surveilr orchestrate -n v&v -s", uxAutoSql);
    const exec_url: string = `${RSC_BASE_URL}/ux.auto.sql`;
    await $`./surveilr orchestrate -n "v&v" -s ${exec_url}`;
    //await $`surveilr orchestrate -n "v&v" -s https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/service/diabetes-research-hub/ux.auto.sql`;

    console.log(colors.green("UX auto orchestration completed successfully."));
  } catch (error) {
    // Optionally handle the error or log it if needed
    console.error(
      colors.red("An error occurred during UX auto orchestration process."),
      error,
    );
  }

  try {
    // Launch the SQLPage web UI
    console.log(
      "DRH EDGE Web UI loading...at http://localhost:9000/drh/index.sql",
    );
    await $`./surveilr web-ui --port 9000`;
  } catch (error) {
    // Optionally handle the error or log it if needed
    console.error(colors.red("An error occurred UI loading process."), error);
  }
} catch (error) {
  console.error(colors.red("An error occurred:"), error.message);
  Deno.exit(1);
}
