import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import { IngestTest } from "./ingest.ts";

export interface ITest {
  setup(): Promise<void>;
  execute(): Promise<void>;
  tap(): Promise<void>;
  teardown(): Promise<void>;
}

export const E2E_TEST_DIR = path.join(Deno.cwd(), "surveilr_e2e_test");
export const ZIP_URL =
  "https://synthetichealth.github.io/synthea-sample-data/downloads/10k_synthea_covid19_csv.zip";
export const ZIP_FILE = "10k_synthea_covid19_csv.zip";
export const INGEST_DIR = "ingest";

export async function runTests() {
  const tests = [
    new IngestTest(),
  ];

  for (const test of tests) {
    console.log("🔍 Starting test:", test.constructor.name);
    await test.setup();
    await test.execute();
    await test.teardown();
    console.log("✅ Completed test:", test.constructor.name);
  }

  console.log("🎉 All tests completed successfully.");
}
