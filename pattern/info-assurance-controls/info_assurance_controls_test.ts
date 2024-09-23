import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";
const DEFAULT_RSSD_PATH = "./resource-surveillance.sqlite.db";

Deno.test("View Check....", async (t) => {
    await t.step("Check database...", async () => {
        assertExists(
            await Deno.stat(DEFAULT_RSSD_PATH).catch(() => null),
            `❌ Error: ${DEFAULT_RSSD_PATH} does not exist`,
        );
    });
    const db = new DB(DEFAULT_RSSD_PATH);

    await t.step("Control Regimes", () => {
        try {
            db.execute(`DROP VIEW IF EXISTS control_regimes;
            CREATE VIEW control_regimes AS
            SELECT
                reg.name as control_regime,
                reg.control_regime_id as control_regime_id,
                audit.name as audit_type_name,
                audit.control_regime_id as audit_type_id
            FROM
                control_regime as audit
            INNER JOIN control_regime as reg ON audit.parent_id = reg.control_regime_id;`);
        } catch (e) {
            console.error(`Failed to create view control_group: ${e.message}`);
        }
        const result = db.query(
            `SELECT COUNT(*) AS count FROM control_regimes`,
        );
        assertEquals(result.length, 1);
    });

    await t.step("Control Group", () => {
        try {
            db.execute(`DROP VIEW IF EXISTS control_group;
            CREATE VIEW control_group AS
            SELECT
              cast("#" as int)  as display_order,
              ROW_NUMBER() OVER (ORDER BY "Common Criteria")  || '-' ||
              (SELECT control_regime_id FROM control_regime WHERE name='SOC2 Type I' AND parent_id IS NOT NULL) AS control_group_id,
              "Common Criteria" AS title,
              (SELECT control_regime_id FROM control_regime WHERE name='SOC2 Type I' AND parent_id IS NOT NULL) AS audit_type_id,
              NULL AS parent_id
            FROM
              uniform_resource_aicpa_soc2_controls
            GROUP BY
              "Common Criteria";`);
        } catch (e) {
            console.error(`Failed to create view control_group: ${e.message}`);
        }

        const result = db.query(
            `SELECT COUNT(*) AS count FROM control_group`,
        );
        assertEquals(result.length, 1);
    });

    db.close();
});
