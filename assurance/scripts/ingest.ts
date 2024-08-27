import { INGEST_DIR, ITest, ZIP_FILE, ZIP_URL } from "./mod.ts";
import { $ } from "https://deno.land/x/dax@0.39.2/mod.ts";
import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";

export class IngestTest implements ITest {
  async multitenancy(): Promise<void> {
    const multitenancyRssd = "multitenancy-resource-surveillance.sqlite.db";
    const tenantId = "e2e-id-one";
    const tenantName = "surveilr end to end test";
    console.log(
      colors.blue("🚀 Running surveilr with multitenancy enabled"),
    );
    await $`surveilr ingest files -d ${multitenancyRssd} -r ./${INGEST_DIR} --tenant-id ${tenantId} --tenant-name ${tenantName}`;
    console.log(
      colors.green(
        "✅ Ingest command with multitenancy executed successfully.",
      ),
    );
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
    await $`surveilr ingest files -r ./${INGEST_DIR}`;
    console.log(colors.green("✅ Ingest command executed successfully."));
    await this.multitenancy();
  }

  async tap(): Promise<void> {
  }

  async teardown(): Promise<void> {
  }
}
