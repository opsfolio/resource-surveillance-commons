import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import { IngestTest } from "./ingest.ts";
import { CommandResult } from "https://deno.land/x/dax@0.39.2/mod.ts";
import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";

export interface ITest {
  setup(): Promise<void>;
  execute(): Promise<void>;
  executeTapTest(): Promise<Array<CommandResult>>;
  teardown(): Promise<void>;
}

function verifyTapTest(result: CommandResult) {
  const output = result.stdout;
  const containsNotOk = output.includes("not ok");

  if (containsNotOk) {
    console.error(
      colors.red(`❌ Test failed. Output contains "not ok":\n${output}`),
    );
    Deno.exit(1);
  } else {
    console.log(colors.green(`✅ All tests passed:\n${output}`));
  }
}

export const E2E_TEST_DIR = path.join(Deno.cwd(), "surveilr_e2e_test");
export const ASSURANCE_DIRECTORY = path.join(Deno.cwd(), "assurance");
export const ZIP_URL =
  "https://synthetichealth.github.io/synthea-sample-data/downloads/10k_synthea_covid19_csv.zip";
export const ZIP_FILE = "10k_synthea_covid19_csv.zip";
export const INGEST_DIR = "ingest";
export const DEFAULT_RSSD_PATH = path.join(
  E2E_TEST_DIR,
  "resource-surveillance.sqlite.db",
);

export async function runTests() {
  const tests = [
    new IngestTest(E2E_TEST_DIR),
  ];

  for (const test of tests) {
    console.log("🔍 Starting test:", test.constructor.name);
    await test.setup();
    await test.execute();
    const tapTestResults = await test.executeTapTest();
    tapTestResults.forEach((res) => verifyTapTest(res));
    await test.teardown();
    console.log("✅ Completed test:", test.constructor.name);
  }

  console.log("🎉 All tests completed successfully.");
}
