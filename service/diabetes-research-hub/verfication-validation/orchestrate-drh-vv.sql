-- Create a temporary table to define the expected schema
CREATE TEMP TABLE expected_schema (
    table_name TEXT,
    column_name TEXT,
    column_type TEXT,
    is_primary_key INTEGER,
    not_null INTEGER -- Add this column to indicate whether a column should be NOT NULL
);

-- Insert expected schema details for various tables
INSERT INTO expected_schema (table_name, column_name, column_type, is_primary_key, not_null) VALUES
-- uniform_resource_institution table
('uniform_resource_institution', 'institution_id', 'TEXT', 1, 1),
('uniform_resource_institution', 'institution_name', 'TEXT', 0, 1),
('uniform_resource_institution', 'city', 'TEXT', 0, 0),
('uniform_resource_institution', 'state', 'TEXT', 0, 0),
('uniform_resource_institution', 'country', 'TEXT', 0, 0),

-- uniform_resource_lab table
('uniform_resource_lab', 'lab_id', 'TEXT', 1, 1),
('uniform_resource_lab', 'lab_name', 'TEXT', 0, 1),
('uniform_resource_lab', 'lab_pi', 'TEXT', 0, 1),
('uniform_resource_lab', 'institution_id', 'TEXT', 0, 0),
('uniform_resource_lab', 'study_id', 'TEXT', 0, 0),

-- uniform_resource_study table
('uniform_resource_study', 'study_id', 'TEXT', 1, 1),
('uniform_resource_study', 'study_name', 'TEXT', 0, 1),
('uniform_resource_study', 'start_date', 'TEXT', 0, 1),
('uniform_resource_study', 'end_date', 'TEXT', 0, 1),
('uniform_resource_study', 'treatment_modalities', 'TEXT', 0, 0),
('uniform_resource_study', 'funding_source', 'TEXT', 0, 0),
('uniform_resource_study', 'nct_number', 'TEXT', 0, 0),
('uniform_resource_study', 'study_description', 'TEXT', 0, 0),

-- uniform_resource_site table
('uniform_resource_site', 'site_id', 'TEXT', 1, 1),
('uniform_resource_site', 'study_id', 'TEXT', 0, 1),
('uniform_resource_site', 'site_name', 'TEXT', 0, 1),
('uniform_resource_site', 'site_type', 'TEXT', 0, 0),

-- uniform_resource_participant table
('uniform_resource_participant', 'participant_id', 'TEXT', 1, 1),
('uniform_resource_participant', 'study_id', 'TEXT', 0, 1),
('uniform_resource_participant', 'site_id', 'TEXT', 0, 1),
('uniform_resource_participant', 'diagnosis_icd', 'TEXT', 0, 0),
('uniform_resource_participant', 'med_rxnorm', 'TEXT', 0, 0),
('uniform_resource_participant', 'treatment_modality', 'TEXT', 0, 0),
('uniform_resource_participant', 'gender', 'TEXT', 0, 0),
('uniform_resource_participant', 'race_ethnicity', 'TEXT', 0, 0),
('uniform_resource_participant', 'age', 'TEXT', 0, 0),
('uniform_resource_participant', 'bmi', 'TEXT', 0, 0),
('uniform_resource_participant', 'baseline_hba1c', 'TEXT', 0, 0),
('uniform_resource_participant', 'diabetes_type', 'TEXT', 0, 0),
('uniform_resource_participant', 'study_arm', 'TEXT', 0, 0),

-- uniform_resource_investigator table
('uniform_resource_investigator', 'investigator_id', 'TEXT', 1, 1),
('uniform_resource_investigator', 'investigator_name', 'TEXT', 0, 1),
('uniform_resource_investigator', 'email', 'TEXT', 0, 1),
('uniform_resource_investigator', 'institution_id', 'TEXT', 0, 0),
('uniform_resource_investigator', 'study_id', 'TEXT', 0, 0),

-- uniform_resource_publication table
('uniform_resource_publication', 'publication_id', 'TEXT', 1, 1),
('uniform_resource_publication', 'publication_title', 'TEXT', 0, 1),
('uniform_resource_publication', 'digital_object_identifier', 'TEXT', 0, 0),
('uniform_resource_publication', 'publication_site', 'TEXT', 0, 0),
('uniform_resource_publication', 'study_id', 'TEXT', 0, 0),

-- uniform_resource_author table
('uniform_resource_author', 'author_id', 'TEXT', 1, 1),
('uniform_resource_author', 'name', 'TEXT', 0, 1),
('uniform_resource_author', 'email', 'TEXT', 0, 1),
('uniform_resource_author', 'investigator_id', 'TEXT', 0, 0),
('uniform_resource_author', 'study_id', 'TEXT', 0, 0),

-- uniform_resource_cgm_file_metadata table
('uniform_resource_cgm_file_metadata', 'metadata_id', 'TEXT', 1, 1),
('uniform_resource_cgm_file_metadata', 'devicename', 'TEXT', 0, 0),
('uniform_resource_cgm_file_metadata', 'device_id', 'TEXT', 0, 0),
('uniform_resource_cgm_file_metadata', 'source_platform', 'TEXT', 0, 0),
('uniform_resource_cgm_file_metadata', 'patient_id', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'file_name', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'file_format', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'file_upload_date', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'data_start_date', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'data_end_date', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'study_id', 'TEXT', 0, 1);


-- Schema Validation


--track the not null columns in each table
-- Step 1: Create the drh_tbl_nonnull_defn table
CREATE TABLE IF NOT EXISTS drh_tbl_nonnull_defn (
    table_name TEXT,
    column_name TEXT
);

-- Retrieve tables and find the not null columns based on the schema defined 
WITH Tables AS (
    SELECT name AS table_name
    FROM sqlite_master
    WHERE type = 'table' 
      AND name LIKE 'uniform_resource_%'
      AND name NOT LIKE 'uniform_resource_cgm_tracing%' 
      AND name != 'uniform_resource_transform'
),

NotNullColumns AS (
    SELECT
        t.table_name,
        e.column_name
    FROM 
        Tables t
    JOIN 
        expected_schema e
    ON 
        t.table_name = e.table_name
    WHERE
        e.not_null = 1
)

-- Insert the retrieved NOT NULL columns into drh_tbl_nonnull_defn
INSERT INTO drh_tbl_nonnull_defn (table_name, column_name)
SELECT table_name, column_name FROM NotNullColumns;

-- Validate the schema: Check for missing and additional columns in tables"

CREATE TABLE IF NOT EXISTS drh_log_validation_issues (
    v_vtype TEXT,
    table_name TEXT,
    column_name TEXT,
    record_number INTEGER,
    issue TEXT
);

WITH SchemaValidationMissingColumns AS (
    SELECT 
        'Schema Validation: Missing Columns' AS heading,
        e.table_name,
        e.column_name,
        e.column_type,
        e.is_primary_key,
        'Missing column: ' || e.column_name || ' in table ' || e.table_name AS status
    FROM 
        expected_schema e
    LEFT JOIN (
        SELECT 
            m.name AS table_name,
            p.name AS column_name,
            p.type AS column_type,
            p.pk AS is_primary_key
        FROM 
            sqlite_master m
        JOIN 
            pragma_table_info(m.name) p
        WHERE 
            m.type = 'table' AND
            m.name not like 'uniform_resource_cgm_tracing%' AND
            m.name != 'uniform_resource_transform' AND 
            m.name LIKE 'uniform_resource_%'
    ) a ON e.table_name = a.table_name AND e.column_name = a.column_name
    WHERE 
        a.column_name IS NULL
)
--SELECT * FROM SchemaValidationMissingColumns;
-- Insert into drh_log_validation_issues table
INSERT INTO drh_log_validation_issues (v_vtype, table_name, column_name, record_number, issue)
SELECT 
    heading as v_vtype,
    table_name,
    column_name,
    column_type as record_number,
    status as issue
FROM SchemaValidationMissingColumns;
-- Insert into orchestration_session_issue table
/*INSERT INTO orchestration_session_issue (
    orchestration_session_issue_id, 
    session_id, 
    session_entry_id, 
    issue_type, 
    issue_message, 
    issue_row, 
    issue_column, 
    invalid_value, 
    remediation, 
    elaboration
)
SELECT 
    -- Generate a UUID for orchestration_session_issue_id (replace with actual UUID generation method if needed)
    'ORCISSUEID-'||((SELECT COUNT(*) FROM orchestration_session_issue) + 1)  AS orchestration_session_issue_id,
    (SELECT surveilr_orchestration_context_session_id()) AS session_id,  -- Replace with actual session ID or dynamic value if needed
    (select orchestration_session_entry_id from orchestration_session_entry where session_id =(SELECT surveilr_orchestration_context_session_id())) AS session_entry_id,  -- Replace with actual session entry ID or dynamic value if needed
    heading as issue_type,
    status as issue_message,
    NULL AS issue_row,  -- Set as NULL if not applicable
    column_name AS issue_column,
    NULL AS invalid_value,  -- Set as NULL if not applicable
    'Please add the missing column as per the expected schema.' AS remediation,
    NULL AS elaboration  -- Set as NULL or provide elaboration if needed
FROM SchemaValidationMissingColumns;*/

-- Line break
SELECT '\n' AS blank_line;


-- Schema Validation: Check for additional columns
WITH SchemaValidationAdditionalColumns AS (
    SELECT 
        'Schema Validation: Additional Columns' AS heading,
        a.table_name,
        a.column_name,
        a.column_type,
        a.is_primary_key,
        'Additional column found: ' || a.column_name || ' in table ' || a.table_name AS status
    FROM 
        (
            SELECT 
                m.name AS table_name,
                p.name AS column_name,
                p.type AS column_type,
                p.pk AS is_primary_key
            FROM 
                sqlite_master m
            JOIN 
                pragma_table_info(m.name) p
            WHERE 
                m.type = 'table' AND
                m.name not like 'uniform_resource_cgm_tracing%' AND
                m.name != 'uniform_resource_transform' AND 
                m.name LIKE 'uniform_resource_%'
        ) a
    LEFT JOIN expected_schema e ON a.table_name = e.table_name AND a.column_name = e.column_name
    WHERE 
        e.column_name IS NULL
)
--SELECT * FROM SchemaValidationAdditionalColumns;

INSERT INTO drh_log_validation_issues (v_vtype, table_name, column_name, record_number, issue)
SELECT 
    heading as v_vtype,
    table_name,
    column_name,
    column_type as record_number,
    status as issue
FROM SchemaValidationAdditionalColumns;
/*
INSERT INTO orchestration_session_issue (
    orchestration_session_issue_id, 
    session_id, 
    session_entry_id, 
    issue_type, 
    issue_message, 
    issue_row, 
    issue_column, 
    invalid_value, 
    remediation, 
    elaboration
)
SELECT 
    -- Generate a UUID for orchestration_session_issue_id (replace with actual UUID generation method if needed)
    'ORCISSUEID-'||((SELECT COUNT(*) FROM orchestration_session_issue) + 1)  AS orchestration_session_issue_id,
    (SELECT surveilr_orchestration_context_session_id()) AS session_id,  -- Replace with actual session ID or dynamic value if needed
    (select orchestration_session_entry_id from orchestration_session_entry where session_id =(SELECT surveilr_orchestration_context_session_id())) AS session_entry_id,  -- Replace with actual session entry ID or dynamic value if needed
    heading as issue_type,
    status as issue_message,
    NULL AS issue_row,  -- Set as NULL if not applicable
    column_name AS issue_column,
    NULL AS invalid_value,  -- Set as NULL if not applicable
    'Please add the missing column as per the expected schema.' AS remediation,
    NULL AS elaboration  -- Set as NULL or provide elaboration if needed
FROM SchemaValidationAdditionalColumns;*/


-- Line break
SELECT '\n' AS blank_line;


-- Data Integrity Checks: Check for invalid dates
WITH DataIntegrityInvalidDates AS (
    SELECT 
        'Data Integrity Checks: Invalid Dates' AS heading,
        table_name,
        column_name,
        value,
        'Dates must be in YYYY-MM-DD format: ' || value AS status
    FROM (
        SELECT 
            'uniform_resource_study' AS table_name,
            'start_date' AS column_name,
            start_date AS value
        FROM 
            uniform_resource_study  
        UNION ALL
        SELECT 
            'uniform_resource_study' AS table_name,
            'end_date' AS column_name,
            end_date AS value
        FROM 
            uniform_resource_study 
        UNION ALL
        SELECT 
            'uniform_resource_cgm_file_metadata' AS table_name,
            'file_upload_date' AS column_name,
            file_upload_date AS value
        FROM 
            uniform_resource_cgm_file_metadata 
        UNION ALL
        SELECT 
            'uniform_resource_cgm_file_metadata' AS table_name,
            'data_start_date' AS column_name,
            data_start_date AS value
        FROM 
            uniform_resource_cgm_file_metadata 
        UNION ALL
        SELECT 
            'uniform_resource_cgm_file_metadata' AS table_name,
            'data_end_date' AS column_name,
            data_end_date AS value
        FROM 
            uniform_resource_cgm_file_metadata 
    ) 
    WHERE 
        value NOT LIKE '____-__-__'
)
--SELECT * FROM DataIntegrityInvalidDates;
-- Insert invalid dates results into drh_log_validation_issues
INSERT INTO drh_log_validation_issues (v_vtype, table_name, column_name, record_number, issue)
SELECT 
    heading AS v_vtype,
    table_name,
    column_name,
    '0',
    status AS issue
FROM DataIntegrityInvalidDates;

-- Line break
SELECT '\n' AS blank_line;

-- Data Integrity Checks: Check for invalid age values
WITH DataIntegrityInvalidAge AS (
    SELECT 
        'Data Integrity Checks: Invalid Age Values' AS heading,
        'uniform_resource_participant' AS table_name,
        'age' AS column_name,
        age AS value,
        'Age must be numeric even if stored as TEXT: ' || age AS status
    FROM 
        uniform_resource_participant
    WHERE 
        typeof(age) = 'text' AND NOT age GLOB '[0-9]*'
)
--SELECT * FROM DataIntegrityInvalidAge;
-- Insert invalid age values results into drh_log_validation_issues
INSERT INTO drh_log_validation_issues (v_vtype, table_name, column_name, record_number, issue)
SELECT 
    heading AS v_vtype,
    table_name,
    column_name,
    '0',
    status AS issue
FROM DataIntegrityInvalidAge;

