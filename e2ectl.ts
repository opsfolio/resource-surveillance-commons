#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-net

import { $ } from "https://deno.land/x/dax@0.39.2/mod.ts";
import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";
import { E2E_TEST_DIR, runTests } from "./assurance/scripts/mod.ts";

// # TODO: automatically upgrade surveilr
// # TODO add tap tests from just file
// adming merge command
// # TODO: commands
// # 1. add notebook orchestration: surveilr orchestrate notebooks --cell="%htmlAnchors%" -a "key1=value1" -a "name=starting"
// # 2. IMAP
// # 3. use the piping method to execute orchestration
// # 4. add multitenancy tests

const mode = Deno.args[0] || "local";

async function commandExists(command: string): Promise<boolean> {
  try {
    await $`which ${command}`.quiet();
    return true;
  } catch {
    return false;
  }
}

if (!(await commandExists("surveilr"))) {
  console.log(
    colors.yellow(
      "🔍 surveilr not found or not executable, installing surveilr...",
    ),
  );
  await $`curl -sL https://raw.githubusercontent.com/opsfolio/releases.opsfolio.com/main/surveilr/install.sh | sh`;
  console.log(colors.green("✅ surveilr installed successfully."));
  await $`surveilr --version`;
} else {
  console.log(colors.green("✅ surveilr is already installed."));
  await $`surveilr --version`;
}

if (mode === "local") {
  console.log(
    colors.yellow("🔄 Pulling the latest changes from the repository..."),
  );
  await $`git pull origin main`;
  console.log(colors.green("✅ Repository updated successfully."));
} else {
  console.log(
    colors.dim("🚀 Running in CI/CD mode, skipping repository update."),
  );
}

await $`rm -rf ${E2E_TEST_DIR}`;
await Deno.mkdir(E2E_TEST_DIR, { recursive: true });
Deno.chdir(E2E_TEST_DIR);

await runTests();

// Step 7: Run the transform-csv command with surveilr
// console.log(
//   colors.blue("🔄 Running the transform-csv command with surveilr..."),
// );
// await $`surveilr orchestrate transform-csv`;
// console.log(colors.green("✅ Transform-csv command executed successfully."));

// // Step 7 (Repeated): Run the transform-csv command again to test syncing
// console.log(
//   colors.blue("🔄 Running the transform-csv command again to test syncing"),
// );
// await $`surveilr orchestrate transform-csv`;
// console.log(
//   colors.green("✅ Transform-csv command executed again successfully."),
// );

// // Step 8: Run the de-identification orchestration command with surveilr
// console.log(
//   colors.blue(
//     "🔒 Running the de-identification orchestration command with surveilr...",
//   ),
// );
// await $`surveilr orchestrate -n "dd" -s https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/pattern/privacy/anonymize-sample/de-identification/deidentification.sql -s ${REPO_DIR}/pattern/privacy/anonymize-sample/de-identification/`;
// console.log(
//   colors.green(
//     "✅ De-identification orchestration command executed successfully.",
//   ),
// );

// console.log(colors.green("🎉 E2E testing completed successfully."));

// // Cleanup
Deno.chdir("..");
await $`rm -rf ${E2E_TEST_DIR}`;
