import { assert, assertEquals, assertExists } from "jsr:@std/assert@1";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import { $ } from "https://deno.land/x/dax@0.39.2/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

// # TODO: automatically upgrade surveilr
// adming merge command
// # TODO: commands
// # 1. add notebook orchestration: surveilr orchestrate notebooks --cell="%htmlAnchors%" -a "key1=value1" -a "name=starting"
// # 2. IMAP
// # 3. use the piping method to execute orchestration
// # 4. add multitenancy tests
// // await $`surveilr orchestrate -n "dd" -s https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/pattern/privacy/anonymize-sample/de-identification/deidentification.sql -s ${REPO_DIR}/pattern/privacy/anonymize-sample/de-identification/`;

const E2E_TEST_DIR = path.join(Deno.cwd(), "assurance");
const ZIP_URL =
  "https://synthetichealth.github.io/synthea-sample-data/downloads/10k_synthea_covid19_csv.zip";
const ZIP_FILE = path.join(E2E_TEST_DIR, "10k_synthea_covid19_csv.zip");
const INGEST_DIR = path.join(E2E_TEST_DIR, "ingest");
const DEFAULT_RSSD_PATH = path.join(
  E2E_TEST_DIR,
  "resource-surveillance.sqlite.db",
);
const TEST_FIXTURES_DIR = path.join(E2E_TEST_DIR, "test-fixtures");

export async function countFilesInDirectory(
  directoryPath: string,
): Promise<number> {
  let fileCount = 0;

  for await (const dirEntry of Deno.readDir(directoryPath)) {
    if (dirEntry.isFile) {
      fileCount++;
    }
  }

  return fileCount;
}

Deno.test("file ingestion", async (t) => {
  await t.step({
    name: "",
    fn: async () => {
      if (!await Deno.stat(ZIP_FILE).catch(() => false)) {
        await $`wget ${ZIP_URL}`;
      }

      assertExists(
        await Deno.stat(ZIP_FILE).catch(() => null),
        "❌ Error: Data file does not exist after download.",
      );

      if (!await Deno.stat(INGEST_DIR).catch(() => false)) {
        await Deno.mkdir(INGEST_DIR, { recursive: true });
        const unzipResult = await $`unzip ${ZIP_FILE} -d ${INGEST_DIR}`;

        assertEquals(
          unzipResult.code,
          0,
          "❌ Error: Failed to unzip the data file.",
        );
      }

      assertExists(
        await Deno.stat(INGEST_DIR).catch(() => null),
        `❌ Error: Ingest directory ${INGEST_DIR} does not exist after unzipping.`,
      );
    },
    ignore: false,
  });

  await t.step("surveilr ingest files", async () => {
    assertExists(
      await Deno.stat(INGEST_DIR).catch(() => null),
      `❌ Error: Ingest directory ${INGEST_DIR} before surveilr ingest`,
    );

    if (await Deno.stat(DEFAULT_RSSD_PATH).catch(() => null)) {
      await Deno.remove(DEFAULT_RSSD_PATH).catch(() => false);
    }

    const ingestResult =
      await $`surveilr ingest files -d ${DEFAULT_RSSD_PATH} -r ${INGEST_DIR}/10k_synthea_covid19_csv -r ${TEST_FIXTURES_DIR}`;
    assertEquals(
      ingestResult.code,
      0,
      `❌ Error: Failed to ingest data in ${INGEST_DIR}/10k_synthea_covid19_csv`,
    );

    assertExists(
      await Deno.stat(DEFAULT_RSSD_PATH).catch(() => null),
      `❌ Error: ${DEFAULT_RSSD_PATH} does not exist`,
    );
  });

  const db = new DB(DEFAULT_RSSD_PATH);

  await t.step("file change history", async () => {
    db.execute(`
            DROP VIEW IF EXISTS file_change_history;
            CREATE VIEW file_change_history AS
            SELECT
                ur.uniform_resource_id,
                ur.uri,
                COUNT(DISTINCT isfp.ingest_session_id) AS ingest_session_count,
                GROUP_CONCAT(DISTINCT isfp.ingest_session_id) AS ingest_sessions,
                MIN(ing_sess.ingest_started_at) AS first_seen,
                MAX(ing_sess.ingest_started_at) AS last_seen
            FROM uniform_resource ur
            JOIN ur_ingest_session_fs_path_entry isfpe ON ur.uniform_resource_id = isfpe.uniform_resource_id
            JOIN ur_ingest_session_fs_path isfp ON isfpe.ingest_fs_path_id = isfp.ur_ingest_session_fs_path_id
            JOIN ur_ingest_session ing_sess ON isfp.ingest_session_id = ing_sess.ur_ingest_session_id
            GROUP BY ur.uniform_resource_id, ur.uri;
        `);

    const result = db.query(
      `SELECT COUNT(*) AS count FROM file_change_history`,
    );
    assertEquals(result.length, 1);

    const filesInDir = await countFilesInDirectory(
      `${INGEST_DIR}/10k_synthea_covid19_csv`,
    ) + (await countFilesInDirectory(TEST_FIXTURES_DIR));

    const files = Number(result[0][0]);
    assert(filesInDir > files);
  });

  await t.step("user activity summary", () => {
    db.execute(`
            DROP VIEW IF EXISTS user_activity_summary;
            CREATE VIEW user_activity_summary AS
            SELECT
                p.person_id,
                p.person_first_name || ' ' || p.person_last_name AS full_name,
                COUNT(DISTINCT dpr.device_id) AS devices_accessed,
                COUNT(DISTINCT uris.ur_ingest_session_id) AS ingest_sessions,
                COUNT(DISTINCT udi.ur_ingest_session_udi_pgp_sql_id) AS sql_queries_executed
            FROM person p
            LEFT JOIN device_party_relationship dpr ON p.person_id = dpr.party_id
            LEFT JOIN ur_ingest_session uris ON dpr.device_id = uris.device_id
            LEFT JOIN ur_ingest_session_udi_pgp_sql udi ON uris.ur_ingest_session_id = udi.ingest_session_id
            GROUP BY p.person_id, full_name;
        `);

    const result = db.query(
      `SELECT COUNT(*) AS count FROM user_activity_summary`,
    );
    assertEquals(result.length, 1);
    assertEquals(result[0][0], 0);
  });

  await t.step("automatically transformed resources", () => {
    const result = db.query(
      `SELECT COUNT(*) AS row_count FROM uniform_resource_transform;`,
    );
    assertEquals(result.length, 1);
    assertEquals(result[0][0], 3);
  });

  // await t.step("compliance violations", () => {
  //     db.execute(`
  //         DROP VIEW IF EXISTS compliance_violations;
  //         CREATE VIEW compliance_violations AS
  //         SELECT
  //             ur.uniform_resource_id,
  //             ur.uri,
  //             isfpe.file_path_abs,
  //             CASE
  //                 WHEN ur.content LIKE '%confidential%' OR ur.content LIKE '%secret%' THEN 'Sensitive Data Exposure'
  //                 WHEN ur.content LIKE '%password%' OR ur.content LIKE '%credit card%' THEN 'PII Exposure'
  //                 ELSE 'Other Violation'
  //             END AS violation_type
  //         FROM uniform_resource ur
  //         JOIN ur_ingest_session_fs_path_entry isfpe ON ur.uniform_resource_id = isfpe.uniform_resource_id
  //         WHERE ur.content LIKE '%confidential%' OR ur.content LIKE '%secret%'
  //         OR ur.content LIKE '%password%' OR ur.content LIKE '%credit card%';
  //     `);

  //     const result = db.query(
  //         `SELECT COUNT(*) AS count FROM compliance_violations`,
  //     );
  //     console.log({ result });
  //     assertEquals(result.length, 1);
  //     assertEquals(result[0][0], 0);
  // });

  // await t.step("potentially risky files", () => {
  //     db.execute(`
  //        DROP VIEW IF EXISTS potential_risk_files;
  //         CREATE VIEW potential_risk_files AS
  //         SELECT
  //             ur.uniform_resource_id,
  //             ur.uri,
  //             ur.content_digest,
  //             CASE
  //                 WHEN ur.nature LIKE '%executable%' THEN 'Executable'
  //                 WHEN ur.nature LIKE '%script%' THEN 'Script'
  //                 WHEN isfpe.file_extn IN ('.exe', '.dll', '.bat', '.ps1', '.sh') THEN 'Suspicious Extension'
  //                 ELSE 'Other'
  //             END AS risk_category
  //         FROM uniform_resource ur
  //         JOIN ur_ingest_session_fs_path_entry isfpe ON ur.uniform_resource_id = isfpe.uniform_resource_id
  //         WHERE ur.nature LIKE '%executable%' OR ur.nature LIKE '%script%'
  //         OR isfpe.file_extn IN ('.exe', '.dll', '.bat', '.ps1', '.sh');
  //     `);

  //     const result = db.query(
  //         `SELECT COUNT(*) AS count FROM potential_risk_files`,
  //     );
  //     console.log({ result });
  //     assertEquals(result.length, 1);
  //     // assertEquals(result[0][0], 0);
  // });

  db.close();
});
