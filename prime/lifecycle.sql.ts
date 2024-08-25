#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { cell, TypicalCodeNotebook } from "./notebook/code.ts";
import { lifecycle as lcm } from "./models/mod.ts";

// TODO: should the `CREATE VIEW` definitions be in code_notebook_cell or straight in RSSD?

export class BootstrapNotebook extends TypicalCodeNotebook {
  readonly codeNbModels = lcm.codeNotebooksModels();
  readonly serviceModels = lcm.serviceModels();

  constructor() {
    super("bootstrap", {
      code_notebook_kernel_id: "SQL",
      kernel_name: "SQLite SQL Statements",
      mime_type: "application/sql",
      file_extn: ".sql",
    });
  }

  bootstrapDDL() {
    return this.SQL`
      ${this.codeNbModels.informationSchema.tables}

      ${this.codeNbModels.informationSchema.tableIndexes}
      `;
  }

  bootstrapSeedDML() {
    return [
      this.kernelUpsertStmt({
        code_notebook_kernel_id: "SQL",
        kernel_name: "SQLite SQL Statements",
        mime_type: "application/sql",
        file_extn: ".sql",
      }),
      this.kernelUpsertStmt({
        code_notebook_kernel_id: "DenoTaskShell",
        kernel_name: "Deno Task Shell",
        mime_type: "application/x-deno-task-sh",
        file_extn: ".deno-task-sh",
      }),
    ];
  }

  // note `once_` pragma means it must only be run once in the database; this
  // `once_` pragma does not mean anything to the code_notebook_* infra but the
  // naming convention does tell `surveilr` migration lifecycle how to operate
  // the cell at runtime initiatlize of the RSSD.
  @cell()
  v001_once_initialDDL() {
    // deno-fmt-ignore
    return this.SQL`
      -- ${this.tsProvenanceComment(import.meta.url)}

      ${this.serviceModels.informationSchema.tables}

      ${this.serviceModels.informationSchema.tableIndexes}`;
  }

  // note since `once_` pragma is not present, it will be run each time
  // so be sure to setup "on conflict" properly and ensure idempotency.
  @cell()
  v001_seedDML() {
    const created_at = this.sqlEngineNow;
    const namespace = "default";

    const urIngestPathMatchRules = () => {
      const { urIngestPathMatchRule } = this.serviceModels;
      const options = { onConflict: { SQL: () => `ON CONFLICT DO NOTHING` } };
      const ur_ingest_resource_path_match_rule_id = this.sqlEngineNewUlid;
      // NOTE: all `\\` will be replaced by JS runtime with single `\`
      return [
        urIngestPathMatchRule.insertDML({
          ur_ingest_resource_path_match_rule_id,
          namespace,
          regex: "/(\\.git|node_modules)/",
          flags: "IGNORE_RESOURCE",
          description:
            "Ignore any entry with `/.git/` or `/node_modules/` in the path.",
          created_at,
        }, options),
        urIngestPathMatchRule.insertDML({
          ur_ingest_resource_path_match_rule_id,
          namespace,
          regex:
            "\\.(?P<nature>md|mdx|html|json|jsonc|puml|txt|toml|yml|xml|tap|csv|tsv|ssv|psv|tm7)$",
          flags: "CONTENT_ACQUIRABLE",
          nature: "?P<nature>", // should be same as src/resource.rs::PFRE_READ_NATURE_FROM_REGEX
          description:
            "Ingest the content for md, mdx, html, json, jsonc, puml, txt, toml, and yml extensions. Assume the nature is the same as the extension.",
          created_at,
        }, options),
        urIngestPathMatchRule.insertDML({
          ur_ingest_resource_path_match_rule_id,
          namespace,
          regex: "surveilr\\[(?P<nature>[^\\]]*)\\]",
          flags: "CAPTURABLE_EXECUTABLE",
          nature: "?P<nature>", // should be same as src/resource.rs::PFRE_READ_NATURE_FROM_REGEX
          description:
            "Any entry with `surveilr-[XYZ]` in the path will be treated as a capturable executable extracting `XYZ` as the nature",
          created_at,
        }, options),
        urIngestPathMatchRule.insertDML({
          ur_ingest_resource_path_match_rule_id,
          namespace,
          regex: "surveilr-SQL",
          flags: "CAPTURABLE_EXECUTABLE | CAPTURABLE_SQL",
          description:
            "Any entry with surveilr-SQL in the path will be treated as a capturable SQL executable and allow execution of the SQL",
          created_at,
        }, options),
      ];
    };

    const urIngestPathRewriteRules = () => {
      const { urIngestPathRewriteRule } = this.serviceModels;
      const options = { onConflict: { SQL: () => `ON CONFLICT DO NOTHING` } };
      const ur_ingest_resource_path_rewrite_rule_id = this.sqlEngineNewUlid;
      // NOTE: all `\\` will be replaced by JS runtime with single `\`
      return [
        urIngestPathRewriteRule.insertDML({
          ur_ingest_resource_path_rewrite_rule_id,
          namespace,
          regex: "(\\.plantuml)$",
          replace: ".puml",
          description: "Treat .plantuml as .puml files",
          created_at,
        }, options),
        urIngestPathRewriteRule.insertDML({
          ur_ingest_resource_path_rewrite_rule_id,
          namespace,
          regex: "(\\.text)$",
          replace: ".txt",
          description: "Treat .text as .txt files",
          created_at,
        }, options),
        urIngestPathRewriteRule.insertDML({
          ur_ingest_resource_path_rewrite_rule_id,
          namespace,
          regex: "(\\.yaml)$",
          replace: ".yml",
          description: "Treat .yaml as .yml files",
          created_at,
        }, options),
      ];
    };

    const partyTypeRules = () => {
      const { partyType } = this.serviceModels;
      const options = { onConflict: { SQL: () => `ON CONFLICT DO NOTHING` } };

      return [
        partyType.insertDML({
          code: "ORGANIZATION",
          value: lcm.PartyType.ORGANIZATION,
        }, options),
        partyType.insertDML({
          code: "PERSON",
          value: lcm.PartyType.PERSON,
        }, options),
      ];
    };

    const orchestrationNatureRules = () => {
      const { orchestrationNature } = this.serviceModels;
      const options = { onConflict: { SQL: () => `ON CONFLICT DO NOTHING` } };

      return [
        orchestrationNature.insertDML({
          orchestration_nature_id: "surveilr-transform-csv",
          nature: "Transform CSV",
        }, options),
        orchestrationNature.insertDML({
          orchestration_nature_id: "surveilr-transform-xml",
          nature: "Transform XML",
        }, options),
        orchestrationNature.insertDML({
          orchestration_nature_id: "surveilr-transform-html",
          nature: "Transform HTML",
        }, options),
      ];
    };

    // deno-fmt-ignore
    return this.SQL`
      ${urIngestPathMatchRules()}

      ${urIngestPathRewriteRules()}

      ${partyTypeRules()}

      ${orchestrationNatureRules()}
      `;
  }

  // note since `once_` pragma is not present, it will be run each time
  @cell()
  v002_fsContentIngestSessionFilesStatsViewDDL() {
    // deno-fmt-ignore
    return this.viewDefn("ur_ingest_session_files_stats")/* sql */`
      WITH Summary AS (
          SELECT
              device.device_id AS device_id,
              ur_ingest_session.ur_ingest_session_id AS ingest_session_id,
              ur_ingest_session.ingest_started_at AS ingest_session_started_at,
              ur_ingest_session.ingest_finished_at AS ingest_session_finished_at,
              COALESCE(ur_ingest_session_fs_path_entry.file_extn, '') AS file_extension,
              ur_ingest_session_fs_path.ur_ingest_session_fs_path_id as ingest_session_fs_path_id,
              ur_ingest_session_fs_path.root_path AS ingest_session_root_fs_path,
              COUNT(ur_ingest_session_fs_path_entry.uniform_resource_id) AS total_file_count,
              SUM(CASE WHEN uniform_resource.content IS NOT NULL THEN 1 ELSE 0 END) AS file_count_with_content,
              SUM(CASE WHEN uniform_resource.frontmatter IS NOT NULL THEN 1 ELSE 0 END) AS file_count_with_frontmatter,
              MIN(uniform_resource.size_bytes) AS min_file_size_bytes,
              AVG(uniform_resource.size_bytes) AS average_file_size_bytes,
              MAX(uniform_resource.size_bytes) AS max_file_size_bytes,
              MIN(uniform_resource.last_modified_at) AS oldest_file_last_modified_datetime,
              MAX(uniform_resource.last_modified_at) AS youngest_file_last_modified_datetime
          FROM
              ur_ingest_session
          JOIN
              device ON ur_ingest_session.device_id = device.device_id
          LEFT JOIN
              ur_ingest_session_fs_path ON ur_ingest_session.ur_ingest_session_id = ur_ingest_session_fs_path.ingest_session_id
          LEFT JOIN
              ur_ingest_session_fs_path_entry ON ur_ingest_session_fs_path.ur_ingest_session_fs_path_id = ur_ingest_session_fs_path_entry.ingest_fs_path_id
          LEFT JOIN
              uniform_resource ON ur_ingest_session_fs_path_entry.uniform_resource_id = uniform_resource.uniform_resource_id
          GROUP BY
              device.device_id,
              ur_ingest_session.ur_ingest_session_id,
              ur_ingest_session.ingest_started_at,
              ur_ingest_session.ingest_finished_at,
              ur_ingest_session_fs_path_entry.file_extn,
              ur_ingest_session_fs_path.root_path
      )
      SELECT
          device_id,
          ingest_session_id,
          ingest_session_started_at,
          ingest_session_finished_at,
          file_extension,
          ingest_session_fs_path_id,
          ingest_session_root_fs_path,
          total_file_count,
          file_count_with_content,
          file_count_with_frontmatter,
          min_file_size_bytes,
          CAST(ROUND(average_file_size_bytes) AS INTEGER) AS average_file_size_bytes,
          max_file_size_bytes,
          oldest_file_last_modified_datetime,
          youngest_file_last_modified_datetime
      FROM
          Summary
      ORDER BY
          device_id,
          ingest_session_finished_at,
          file_extension;`;
  }

  // note since `once_` pragma is not present, it will be run each time
  @cell()
  v002_fsContentIngestSessionFilesStatsLatestViewDDL() {
    // deno-fmt-ignore
    return this.viewDefn("ur_ingest_session_files_stats_latest")/* sql */`
      SELECT iss.*
        FROM ur_ingest_session_files_stats AS iss
        JOIN (  SELECT ur_ingest_session.ur_ingest_session_id AS latest_session_id
                  FROM ur_ingest_session
              ORDER BY ur_ingest_session.ingest_finished_at DESC
                 LIMIT 1) AS latest
          ON iss.ingest_session_id = latest.latest_session_id;`;
  }

  // note since `once_` pragma is not present, it will be run each time
  @cell()
  v002_urIngestSessionTasksStatsViewDDL() {
    // deno-fmt-ignore
    return this.viewDefn("ur_ingest_session_tasks_stats")/* sql */`
        WITH Summary AS (
            SELECT
              device.device_id AS device_id,
              ur_ingest_session.ur_ingest_session_id AS ingest_session_id,
              ur_ingest_session.ingest_started_at AS ingest_session_started_at,
              ur_ingest_session.ingest_finished_at AS ingest_session_finished_at,
              COALESCE(ur_ingest_session_task.ur_status, 'Ok') AS ur_status,
              COALESCE(uniform_resource.nature, 'UNKNOWN') AS nature,
              COUNT(ur_ingest_session_task.uniform_resource_id) AS total_file_count,
              SUM(CASE WHEN uniform_resource.content IS NOT NULL THEN 1 ELSE 0 END) AS file_count_with_content,
              SUM(CASE WHEN uniform_resource.frontmatter IS NOT NULL THEN 1 ELSE 0 END) AS file_count_with_frontmatter,
              MIN(uniform_resource.size_bytes) AS min_file_size_bytes,
              AVG(uniform_resource.size_bytes) AS average_file_size_bytes,
              MAX(uniform_resource.size_bytes) AS max_file_size_bytes,
              MIN(uniform_resource.last_modified_at) AS oldest_file_last_modified_datetime,
              MAX(uniform_resource.last_modified_at) AS youngest_file_last_modified_datetime
          FROM
              ur_ingest_session
          JOIN
              device ON ur_ingest_session.device_id = device.device_id
          LEFT JOIN
              ur_ingest_session_task ON ur_ingest_session.ur_ingest_session_id = ur_ingest_session_task.ingest_session_id
          LEFT JOIN
              uniform_resource ON ur_ingest_session_task.uniform_resource_id = uniform_resource.uniform_resource_id
          GROUP BY
              device.device_id,
              ur_ingest_session.ur_ingest_session_id,
              ur_ingest_session.ingest_started_at,
              ur_ingest_session.ingest_finished_at,
              ur_ingest_session_task.captured_executable
      )
      SELECT
          device_id,
          ingest_session_id,
          ingest_session_started_at,
          ingest_session_finished_at,
          ur_status,
          nature,
          total_file_count,
          file_count_with_content,
          file_count_with_frontmatter,
          min_file_size_bytes,
          CAST(ROUND(average_file_size_bytes) AS INTEGER) AS average_file_size_bytes,
          max_file_size_bytes,
          oldest_file_last_modified_datetime,
          youngest_file_last_modified_datetime
      FROM
          Summary
      ORDER BY
          device_id,
          ingest_session_finished_at,
          ur_status;`;
  }

  // note since `once_` pragma is not present, it will be run each time
  @cell()
  v002_urIngestSessionTasksStatsLatestViewDDL() {
    // deno-fmt-ignore
    return this.viewDefn("ur_ingest_session_tasks_stats_latest")/* sql */`
        SELECT iss.*
          FROM ur_ingest_session_tasks_stats AS iss
          JOIN (  SELECT ur_ingest_session.ur_ingest_session_id AS latest_session_id
                    FROM ur_ingest_session
                ORDER BY ur_ingest_session.ingest_finished_at DESC
                   LIMIT 1) AS latest
            ON iss.ingest_session_id = latest.latest_session_id;`;
  }

  @cell()
  v002_urIngestSessionFileIssueViewDDL() {
    // deno-fmt-ignore
    return this.viewDefn("ur_ingest_session_file_issue")/* sql */`
        SELECT us.device_id,
               us.ur_ingest_session_id,
               usp.ur_ingest_session_fs_path_id,
               usp.root_path,
               ufs.ur_ingest_session_fs_path_entry_id,
               ufs.file_path_abs,
               ufs.ur_status,
               ufs.ur_diagnostics
          FROM ur_ingest_session_fs_path_entry ufs
          JOIN ur_ingest_session_fs_path usp ON ufs.ingest_fs_path_id = usp.ur_ingest_session_fs_path_id
          JOIN ur_ingest_session us ON usp.ingest_session_id = us.ur_ingest_session_id
         WHERE ufs.ur_status IS NOT NULL
      GROUP BY us.device_id,
               us.ur_ingest_session_id,
               usp.ur_ingest_session_fs_path_id,
               usp.root_path,
               ufs.ur_ingest_session_fs_path_entry_id,
               ufs.file_path_abs,
               ufs.ur_status,
               ufs.ur_diagnostics;`
  }
}

// this will be used by any callers who want to serve it as a CLI with SDTOUT
if (import.meta.main) {
  const SQL = await TypicalCodeNotebook.SQL(new BootstrapNotebook());
  console.log(SQL.join("\n"));
}
