import * as spn from "../sqlpage-notebook.ts";

export function orchNav(route: Omit<spn.RouteConfig, "path" | "parentPath">) {
    return spn.navigationPrime({
        ...route,
        parentPath: "/orchestration",
    });
}

export class OrchestrationSqlPages extends spn.TypicalSqlPageNotebook {
    navigationDML() {
        return this.SQL`
          ${this.upsertNavSQL(...Array.from(this.navigation.values()))}
        `;
    }

    supportDDL() {
        return this.SQL`
            DROP VIEW IF EXISTS orchestration_sessions_by_device;
            CREATE VIEW orchestration_sessions_by_device AS
            SELECT
                d.device_id,
                d.name AS device_name,
                COUNT(*) AS session_count
            FROM orchestration_session os
            JOIN device d ON os.device_id = d.device_id
            GROUP BY d.device_id, d.name;

            DROP VIEW IF EXISTS orchestration_session_duration;
            CREATE VIEW orchestration_session_duration AS
            SELECT
                os.orchestration_session_id,
                onature.nature AS orchestration_nature,
                os.orch_started_at,
                os.orch_finished_at,
                (JULIANDAY(os.orch_finished_at) - JULIANDAY(os.orch_started_at)) * 24 * 60 * 60 AS duration_seconds
            FROM orchestration_session os
            JOIN orchestration_nature onature ON os.orchestration_nature_id = onature.orchestration_nature_id
            WHERE os.orch_finished_at IS NOT NULL;

            DROP VIEW IF EXISTS orchestration_success_rate;
            CREATE VIEW orchestration_success_rate AS
            SELECT
                onature.nature AS orchestration_nature,
                COUNT(*) AS total_sessions,
                SUM(CASE WHEN oss.to_state = 'surveilr_orch_completed' THEN 1 ELSE 0 END) AS successful_sessions,
                (CAST(SUM(CASE WHEN oss.to_state = 'surveilr_orch_completed' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)) * 100 AS success_rate
            FROM orchestration_session os
            JOIN orchestration_nature onature ON os.orchestration_nature_id = onature.orchestration_nature_id
            JOIN orchestration_session_state oss ON os.orchestration_session_id = oss.session_id
            WHERE oss.to_state IN ('surveilr_orch_completed', 'surveilr_orch_failed') -- Consider other terminal states if applicable
            GROUP BY onature.nature;

            DROP VIEW IF EXISTS scripts_per_orchestration_session;
            CREATE VIEW scripts_per_orchestration_session AS
            SELECT
                os.orchestration_session_id,
                onature.nature AS orchestration_nature,
                COUNT(*) AS script_count
            FROM orchestration_session os
            JOIN orchestration_nature onature ON os.orchestration_nature_id = onature.orchestration_nature_id
            JOIN orchestration_session_entry ose ON os.orchestration_session_id = ose.session_id
            GROUP BY os.orchestration_session_id, onature.nature;

            DROP VIEW IF EXISTS orchestration_executions_by_type;
            CREATE VIEW orchestration_executions_by_type AS
            SELECT
                exec_nature,
                COUNT(*) AS execution_count
            FROM orchestration_session_exec
            GROUP BY exec_nature;

            -- View 6:  Orchestration Execution Success Rate by Type
            DROP VIEW IF EXISTS orchestration_execution_success_rate_by_type;
            CREATE VIEW orchestration_execution_success_rate_by_type AS
            SELECT
                exec_nature,
                COUNT(*) AS total_executions,
                SUM(CASE WHEN exec_status = 0 THEN 1 ELSE 0 END) AS successful_executions,
                (CAST(SUM(CASE WHEN exec_status = 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)) * 100 AS success_rate
            FROM orchestration_session_exec
            GROUP BY exec_nature;

            DROP VIEW IF EXISTS issues_per_orchestration_session;
            CREATE VIEW issues_per_orchestration_session AS
            SELECT
                os.orchestration_session_id,
                onature.nature AS orchestration_nature,
                COUNT(*) AS issue_count
            FROM orchestration_session os
            JOIN orchestration_nature onature ON os.orchestration_nature_id = onature.orchestration_nature_id
            JOIN orchestration_session_issue osi ON os.orchestration_session_id = osi.session_id
            GROUP BY os.orchestration_session_id, onature.nature;

            DROP VIEW IF EXISTS issue_types_and_counts;
            CREATE VIEW issue_types_and_counts AS
            SELECT
                issue_type,
                COUNT(*) AS issue_count
            FROM orchestration_session_issue
            GROUP BY issue_type;

            DROP VIEW IF EXISTS issue_remediation_suggestions;
            CREATE VIEW issue_remediation_suggestions AS
            SELECT
                orchestration_session_issue_id,
                issue_type,
                issue_message,
                remediation
            FROM orchestration_session_issue
            WHERE remediation IS NOT NULL;

            DROP VIEW IF EXISTS orchestration_logs_by_session;
            CREATE VIEW orchestration_logs_by_session AS
            SELECT
                os.orchestration_session_id,
                onature.nature AS orchestration_nature,
                osl.category,
                COUNT(*) AS log_count
            FROM orchestration_session os
            JOIN orchestration_nature onature ON os.orchestration_nature_id = onature.orchestration_nature_id
            JOIN orchestration_session_log osl ON os.orchestration_session_id = osl.session_id
            GROUP BY os.orchestration_session_id, onature.nature, osl.category;

        `;
    }

    @spn.navigationPrimeTopLevel({
        caption: "Orchestration",
        description: "Explore details about all orchestration",
    })
    "orchestration/index.sql"() {
        return this.SQL`
            WITH navigation_cte AS (
            SELECT COALESCE(title, caption) as title, description
                FROM sqlpage_aide_navigation
            WHERE namespace = 'prime' AND path = '/orchestration'
            )
            SELECT 'list' AS component, title, description
                FROM navigation_cte;
            SELECT caption as title, COALESCE(url, path) as link, description
                FROM sqlpage_aide_navigation
            WHERE namespace = 'prime' AND parent_path = '/orchestration'
            ORDER BY sibling_order;
        `;
    }
}
