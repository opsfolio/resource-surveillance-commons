#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import { $ } from "https://deno.land/x/dax@0.4.0/mod.ts";

// Base URL for the resource surveillance commons
const RSC_BASE_URL =
 "https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main";

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

// Define a function to execute a Deno script with full permissions
async function runDenoScript(scriptPath: string) {
 console.log(`Running Deno script: ${scriptPath}`);

 const process = Deno.run({
  cmd: ["deno", "run", "-A", scriptPath],
  stdout: "inherit",
  stderr: "inherit",
 });

 const status = await process.status();
 if (!status.success) {
  console.error(`Deno script failed with status ${status.code}`);
 }
}

// Define a function to run an external command with stdin redirection
// async function runCommandWithPipe(cmd: string[], input: Deno.Reader) {
//  console.log(`Running command with input pipe: ${cmd.join(" ")}`);

//  const process = Deno.run({
//   cmd,
//   stdin: "piped",
//   stdout: "inherit",
//   stderr: "inherit",
//   stdin: "piped",
//  });

//  // Pipe the input to the command
//  await input.pipeTo(process.stdin);

//  // Close stdin to indicate EOF
//  process.stdin.close();

//  const status = await process.status();
//  if (!status.success) {
//   console.error(`Command failed with status ${status.code}`);
//  }
// }

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
 console.log(
  `Ingesting files from folder: ${folderName} and transforming the CSV`,
 );
 await $`surveilr ingest files -r ${folderName} && surveilr orchestrate transform-csv`;

 // Read the SQL file content
 const sqlFilePath = "de-identification/drh-deidentification.sql";
 const sqlContent = await Deno.readTextFile(sqlFilePath);

 // Execute the deidentification orchestration command with SQL content
 console.log("Executing deidentification orchestration");
 await executeCommandWithSql(
  "surveilr orchestrate -n deidentification",
  sqlContent,
 );

 // Read and execute additional SQL files if needed

 console.log("Executing verfication and validation");
 const vvFilePath = "verfication-validation/orchestrate-drh-vv.sql";
 const vvSql = await Deno.readTextFile(vvFilePath);
 await executeCommandWithSql("surveilr orchestrate -n v&v", vvSql);

 //  // Run the Deno script and pipe its output to sqlite3
 //  console.log("Running internal Deno script with full permissions and piping output to sqlite3");
 //  const scriptOutput = await runDenoScript("./ux.sql.ts");
 //  await runCommandWithPipe(["sqlite3", "resource-surveillance.sqlite.db"], scriptOutput);

 // console.log(
 //  `Sqlpage Web UI loading...`,
 // );
 // await $`surveilr web-ui --port 9000`;
} catch (error) {
 console.error("An error occurred:", error.message);
 Deno.exit(1);
}
