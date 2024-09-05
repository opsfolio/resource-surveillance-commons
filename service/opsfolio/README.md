# Opsfolio Service - Unified Execution for Information Assurance

The `opsfolio` service under the `service/opsfolio` directory provides a unified
interface for managing and executing various information assurance components,
including controls, policies, and infra assurance. This setup ensures that the
relevant SQL scripts from different assurance folders are executed together,
streamlining the setup and execution process.

## Overview

The `web-ui.sql.ts` file located in the `service/opsfolio` folder is responsible
for loading and executing SQL scripts from the following folders:

- `info-assurance-controls`
- `info-assurance-policies`
- `infra-assurance`

The unified execution pattern allows you to manage and apply different assurance
components in a single, cohesive step.

### Key Components

- **Controls (`info-assurance-controls`)**: Handles the ingestion, display, and
  storage of controls related to audit requirements.
- **Policies (`info-assurance-policies`)**: Manages policy-specific data
  extraction and presentation from the database.
- **Infra Assurance (`infra-assurance`)**: Focuses on the infrastructure
  assurance aspects, providing necessary SQL operations.

## How to Run

To execute the unified SQL commands and ensure that all components are set up
correctly in the SQLite database, follow these steps:

1. **Place the SQLite Database Inside the `opsfolio` Folder:**

   Ensure the SQLite database file `resource-surveillance.sqlite.db` (RSSD) is
   placed inside the `service/opsfolio` folder. This database will store the
   resulting data after running the SQL scripts.

2. **Run the `web-ui.sql.ts` Script:**

   This command executes the unified SQL scripts for controls, policies, and
   infra assurance:
   ```bash
   deno run -A web-ui.sql.ts | sqlite3 resource-surveillance.sqlite.db
   ```

   The above command will run the SQL commands from all the assurance components
   and store the resulting data in the `resource-surveillance.sqlite.db` SQLite
   database located inside the `service/opsfolio` folder.

3. **Start SQLPage in Watch Mode:**

   For a dynamic and automatically reloading development environment, use the
   following command:

   ```bash
   ../../support/bin/sqlpagectl.ts dev --watch . --watch ../../prime --standalone
   ```

   After running this command, you can access the web UI at
   `http://localhost:9000/`.

## Development Notes

- The `web-ui.sql.ts` script uses dynamic imports to ensure that the SQL from
  each assurance component is loaded and executed correctly.
- **Watch Mode**: During development, you can use the watch mode to ensure that
  any changes to `.sql` or `.sql.ts` files are automatically reloaded and
  reflected in the database.
- **Database Location**: Ensure that the `resource-surveillance.sqlite.db` file
  remains in the `service/opsfolio` folder to avoid any issues with file paths
  during execution.

## Conclusion

The unified execution provided by the `opsfolio` service streamlines the process
of managing and executing multiple assurance components, ensuring a cohesive and
efficient setup. This approach is especially beneficial for environments where
consistency and unified management are critical.
