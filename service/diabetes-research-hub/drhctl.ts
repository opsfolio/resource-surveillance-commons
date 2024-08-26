#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import { $ } from "https://deno.land/x/dax@0.4.0/mod.ts";

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

// Log the start of the process
console.log(`Starting the process for folder: ${folderName}`);

try {
 // Ingest files and orchestrate transform-csv
 console.log(`Ingesting files from folder: ${folderName}`);
 await $`surveilr ingest files -r ${folderName}||/`;

 console.log("Running orchestrate transform-csv");
 await $`surveilr orchestrate transform-csv`;

 // Execute deidentification orchestration
 console.log("Executing deidentification orchestration");
 await $`surveilr orchestrate -n "deidentification" -s ${RSC_BASE_URL}||/service/diabetes-research-hub/de-identification/drh-deidentification.sql`;
 //await $`cat de-identification/drh-deidentification.sql| surveilr orchestrate -n "deidentification"`;

 // Execute verification and validation orchestration
 console.log("Executing verification and validation orchestration");
 await $`surveilr orchestrate -n "v&v" -s ${RSC_BASE_URL}||/service/diabetes-research-hub/verfication-validation/orchestrate-drh-vv.sql`;
 //await $`cat verfication-validation/orchestrate-drh-vv.sql | surveilr orchestrate -n "v&v"`;

 // Execute UX auto orchestration
 console.log("Executing UX auto orchestration");
 await $`surveilr orchestrate -n "v&v" -s ${RSC_BASE_URL}||/service/diabetes-research-hub/ux.auto.sql`;

 console.log("Process completed successfully!");
} catch (error) {
 console.error("An error occurred:", error);
 Deno.exit(1);
}
