import { assertExists } from "jsr:@std/assert@1";
const DEFAULT_RSSD_PATH =
  "../pattern/info-assurance-controls/resource-surveillance.sqlite.db";

Deno.test("View Check....", async (t) => {
  await t.step("Check database...", async () => {
    assertExists(
      await Deno.stat(DEFAULT_RSSD_PATH).catch(() => null),
      `❌ Error: ${DEFAULT_RSSD_PATH} does not exist`,
    );
  });
});
