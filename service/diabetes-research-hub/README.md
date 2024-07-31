# Surveilr DRH Data Transformation and SqlPage Preview

## Overview

The `drh-deidentification.sql` performs the deidentification of the columns in the study data converted tables. The `stateless-drh-surveilr.sql` creates the database views which shall be used in SQLPage preview. The `orchestrate-drh-vv.sql` performs the verification and validation on the study data tables.(TODO)

## Getting Started

1. **Prepare the Study Files:**

   - Prepare the study files in the format mentioned in [‘Getting Started’](https://drh.diabetestechnology.org/getting-started/) on the DRH website.
   - Ensure the study files are as mentioned in the above link.

2. **Download Surveilr:**

   - Follow the installation instructions at [Surveilr Installation Guide](https://docs.opsfolio.com/surveilr/how-to/installation-guide).
   - Move the downloaded software to the study files folder.
   - Example: Move the downloaded software to the 'DRH_STUDY_DATA' folder, which contains a subfolder 'STUDY1'.

3. **Data Conversion Steps**

   - Open the command prompt and change to the directory containing the study CSV files.
   - Command: `cd <folderpath>`
   - Example: `cd D:/workfiles/DRH_STUDY_DATA`
  
   **Verify the Tool Version**

   - Input the command `surveilr --version`.
   - If the tool is available, it will show the version number.

   3.1 **Ingest the Files**

   **Command:**

   - Command: `surveilr ingest files -r <foldername>/`
   - Example: `surveilr ingest files -r STUDY1/`

   **Note**: Here 'STUDY1' is the folder name containing specific study CSV files.

   3.2 **Transform the Files**

   **Command:**

   - Command: `surveilr transform csv`    

   3.3 **Verify the Transformed Data**

   - Type the command `ls` to list the files.
   - You can also check the folder directly to see the transformed database.

4. **De-Identification**

   **Note:** 

   - De-identification is an optional step, and DRH does not have any PHI columns in any CSV in the current situation.
   - If De-identification is to be performed, please refer to the steps below.
   - The SQL script will require changes from time to time.

   **Steps for De-identification:**

   4.1 **Download the SQL File**

   ```bash
   curl -L -o De-Identification.sql https://raw.githubusercontent.com/MeetAnithaVarghese/drh-sql-page/main/de-identification/drh-deidentification.sql
   ```

   4.2 **Execute the De-identification Process**

   ```bash
   surveilr anonymize --sql De-Identification.sql 
   ```
   

   
   4.3 **Remove the de-identification sql after the de-identification**

   ```bash
   rm De-Identification.sql
   ```


5. **Apply the Study Database Views to Preview in SQLPage**

   ```bash
   curl -L https://raw.githubusercontent.com/MeetAnithaVarghese/drh-sql-page/main/stateless-drh-surveilr.sql | sqlite3 resource-surveillance.sqlite.db   
   ```

6. **Preview Content with SQLPage (requires `deno` v1.40 or above):**

   ```bash
   deno run https://raw.githubusercontent.com/MeetAnithaVarghese/drh-sql-page/main/ux.sql.ts | sqlite3 resource-surveillance.sqlite.db
     
   ```
   ```bash
   surveilr sqlpage --port 9000 
   ```
   Then, open a browser and navigate to [http://localhost:9000/drh/index.sql](http://localhost:9000/drh/index.sql).

