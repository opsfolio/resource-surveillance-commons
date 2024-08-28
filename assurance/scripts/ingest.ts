import {
  ASSURANCE_DIRECTORY,
  DEFAULT_RSSD_PATH,
  INGEST_DIR,
  ITest,
  ZIP_FILE,
  ZIP_URL,
} from "./mod.ts";
import { $, CommandResult } from "https://deno.land/x/dax@0.39.2/mod.ts";
import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";

export class IngestTest implements ITest {
  private e2eTestDir: string;

  constructor(e2eTestDir: string) {
    this.e2eTestDir = e2eTestDir;
  }

  async multitenancy(): Promise<void> {
    const multitenancyRssd = path.join(
      this.e2eTestDir,
      "multitenancy-resource-surveillance.sqlite.db",
    );
    const tenantId = "e2e-id-one";
    const tenantName = "surveilr end to end test";
    console.log(
      colors.blue("🚀 Running surveilr with multitenancy enabled"),
    );
    await $`surveilr ingest files -d ${multitenancyRssd} -r ./${INGEST_DIR}/10k_synthea_covid19_csv --tenant-id ${tenantId} --tenant-name ${tenantName}`;
    console.log(
      colors.green(
        "✅ Ingest command with multitenancy executed successfully.",
      ),
    );
  }

  async executeMultitenancyTapTest(): Promise<CommandResult> {
    const dbFilePath = path.join(
      this.e2eTestDir,
      "multitenancy-resource-surveillance.sqlite.db",
    );

    const sqlFilePath = path.join(
      ASSURANCE_DIRECTORY,
      "ingest-files-multitenancy.sql",
    );

    console.log(
      colors.blue(
        `🚀 Executing mulitenancy tap test by running ${sqlFilePath} against RSSD: ${dbFilePath}`,
      ),
    );

    try {
      const sqlFileContent = await Deno.readTextFile(sqlFilePath);

      return $`sqlite3 ${dbFilePath}`.stdinText(
        sqlFileContent,
      ).captureCombined();
    } catch (error) {
      console.error(
        colors.red(
          `❌ Error during multitenancy tap test execution: ${error.message}`,
        ),
      );
      Deno.exit(1);
    }
  }

  async setup(): Promise<void> {
    if (await Deno.stat(ZIP_FILE).catch(() => false)) {
      console.log(
        colors.cyan("📁 Data file already exists, skipping download."),
      );
    } else {
      console.log(
        colors.yellow(`⬇️ Downloading the data file from ${ZIP_URL}...`),
      );
      await $`wget ${ZIP_URL}`;
      console.log(colors.green("✅ Data file downloaded successfully."));
    }

    // Verify if the ZIP file exists before unzipping
    if (await Deno.stat(ZIP_FILE).catch(() => false)) {
      console.log(
        colors.cyan(
          "📦 Preparing the ingest directory and unzipping data...",
        ),
      );
      await Deno.mkdir(INGEST_DIR, { recursive: true });
      await $`unzip ${ZIP_FILE} -d ${INGEST_DIR}`;
      console.log(colors.green("✅ Data unzipped successfully."));
    } else {
      console.error(
        colors.red(`❌ Error: Data file ${ZIP_FILE} does not exist.`),
      );
      Deno.exit(1);
    }
  }

  async execute(): Promise<void> {
    console.log(
      colors.blue("🚀 Running the ingest command with surveilr..."),
    );
    await $`surveilr ingest files -r ./${INGEST_DIR}/10k_synthea_covid19_csv`;
    console.log(colors.green("✅ Ingest command executed successfully."));
    await this.multitenancy();
  }

  async executeTapTest(): Promise<Array<CommandResult>> {
    const sqlFilePath = path.join(ASSURANCE_DIRECTORY, "ingest-files.sql");
    console.log(
      colors.blue(
        `🚀 Executing tap test by running ${sqlFilePath} against RSSD: ${DEFAULT_RSSD_PATH}`,
      ),
    );

    const results: CommandResult[] = [];
    try {
      const sqlFileContent = await Deno.readTextFile(sqlFilePath);

      const ingestResult = await $`sqlite3 ${DEFAULT_RSSD_PATH}`
        .stdinText(
          sqlFileContent,
        ).captureCombined();

      results.push(ingestResult);

      //   await this.delay(1000);

      //   results.push(await this.executeMultitenancyTapTest());

      return results;
    } catch (error) {
      console.error(
        colors.red(
          `❌ Error during tap test execution: ${error.message}`,
        ),
      );
      Deno.exit(1);
    }
  }

  // Helper method to add a delay
  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async teardown(): Promise<void> {
  }
}
