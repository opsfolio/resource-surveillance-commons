#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import { $ } from "https://deno.land/x/dax@0.4.0/mod.ts";

// Base URL for the resource surveillance commons, including the diabetes research hub path
const RSC_BASE_URL =
  "https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/service/diabetes-research-hub";

// Check if a folder name was provided
if (Deno.args.length === 0) {
  console.error("No folder name provided. Please provide a folder name.");
  Deno.exit(1);
}

// Store the folder name in a variable
const folderName = Deno.args[0];

// Run the surveilr commands with the provided folder name

try {
  // Ingest files and Orchestrate transform-csv
  await $`surveilr ingest files -r ${folderName}/`;
  await $`surveilr orchestrate transform-csv`;

  // Execute deidentification orchestration
  await $`surveilr orchestrate -n "deidentification" -s ${RSC_BASE_URL}/de-identification/drh-deidentification.sql`;

  // Execute verification and validation orchestration
  await $`surveilr orchestrate -n "v&v" -s ${RSC_BASE_URL}/verfication-validation/orchestrate-drh-vv.sql`;

  // Execute UX auto orchestration
  await $`surveilr orchestrate -n "v&v" -s ${RSC_BASE_URL}/ux.auto.sql`;
} catch (error) {
  console.error("An error occurred:", error);
}
