--Code needs to be modified for orchestrate table entries

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
('uniform_resource_lab', 'lab_pi', 'TEXT', 0, 0),
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
('uniform_resource_site', 'site_name', 'TEXT', 0, 0),
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
('uniform_resource_cgm_file_metadata', 'patient_id', 'TEXT', 0, 0),
('uniform_resource_cgm_file_metadata', 'file_name', 'TEXT', 0, 0),
('uniform_resource_cgm_file_metadata', 'file_format', 'TEXT', 0, 0),
('uniform_resource_cgm_file_metadata', 'file_upload_date', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'data_start_date', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'data_end_date', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'study_id', 'TEXT', 0, 0);


-- Validate the schema: Check for missing and additional columns in tables starting with "uniform_resource_"


WITH device_info AS (
    SELECT device_id FROM device LIMIT 1
),
orch_nature_info AS (
    SELECT orchestration_nature_id FROM orchestration_nature WHERE nature = 'Verification and Validation' LIMIT 1
)
INSERT INTO orchestration_session (orchestration_session_id, device_id, orchestration_nature_id, version, args_json, diagnostics_json, diagnostics_md) 
SELECT
    'orc-session-id-' || hex(randomblob(16)) AS orchestration_session_id,
    d.device_id,
    o.orchestration_nature_id,
    '1.0',
    '{"parameters": "Verification&Validation"}',
    '{"status": "started"}',
    'Started Verification Validation process'
FROM device_info d, orch_nature_info o;


-- Retrieve the new session ID
WITH session_info AS (
    SELECT orchestration_session_id FROM orchestration_session LIMIT 1
)
INSERT INTO orchestration_session_entry (orchestration_session_entry_id, session_id, ingest_src, ingest_table_name, elaboration)
SELECT
    'ORCSESENDEID-' || hex(randomblob(16)) AS orchestration_session_entry_id,
    orchestration_session_id,
    'Verification&Validation',
    NULL,
    '{"description": "Verifcation Validation In process"}'
FROM session_info;


-- Schema Validation: Check for missing columns
--.output validation_verification.txt
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
SELECT * FROM SchemaValidationMissingColumns;

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
SELECT * FROM SchemaValidationAdditionalColumns;

-- Line break
SELECT '\n' AS blank_line;

-- Schema Validation: Check for type mismatches


-- Line break
SELECT '\n' AS blank_line;

-- Step 1: Retrieve tables with names like 'uniform_resource%'
WITH Tables AS (
    SELECT name AS table_name
    FROM sqlite_master
    WHERE type = 'table' AND
    name NOT LIKE 'uniform_resource_cgm_tracing%' AND
    name != 'uniform_resource_transform' AND
    name LIKE 'uniform_resource_%'
),
-- Step 2: Retrieve NOT NULL columns from these tables
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
select * from NotNullColumns;



-- Line break
SELECT '\n' AS blank_line;

-- Step 1: Generate queries to find empty or NULL values for each column in the 'uniform_resource_participant' table

-- Query for participant_id column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'participant_id' AS column_name, 
    rowid AS record_id, 
    CASE WHEN participant_id IS NULL OR participant_id = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    participant_id IS NULL OR participant_id = '';

-- Query for study_id column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'study_id' AS column_name, 
    rowid AS record_id, 
    CASE WHEN study_id IS NULL OR study_id = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    study_id IS NULL OR study_id = '';

-- Query for site_id column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'site_id' AS column_name, 
    rowid AS record_id, 
    CASE WHEN site_id IS NULL OR site_id = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    site_id IS NULL OR site_id = '';

-- Query for diagnosis_icd column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'diagnosis_icd' AS column_name, 
    rowid AS record_id, 
    CASE WHEN diagnosis_icd IS NULL OR diagnosis_icd = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    diagnosis_icd IS NULL OR diagnosis_icd = '';

-- Query for med_rxnorm column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'med_rxnorm' AS column_name, 
    rowid AS record_id, 
    CASE WHEN med_rxnorm IS NULL OR med_rxnorm = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    med_rxnorm IS NULL OR med_rxnorm = '';

-- Query for treatment_modality column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'treatment_modality' AS column_name, 
    rowid AS record_id, 
    CASE WHEN treatment_modality IS NULL OR treatment_modality = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    treatment_modality IS NULL OR treatment_modality = '';

-- Query for gender column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'gender' AS column_name, 
    rowid AS record_id, 
    CASE WHEN gender IS NULL OR gender = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    gender IS NULL OR gender = '';

-- Query for race_ethnicity column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'race_ethnicity' AS column_name, 
    rowid AS record_id, 
    CASE WHEN race_ethnicity IS NULL OR race_ethnicity = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    race_ethnicity IS NULL OR race_ethnicity = '';

-- Query for age column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'age' AS column_name, 
    rowid AS record_id, 
    CASE WHEN age IS NULL OR age = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    age IS NULL OR age = '';

-- Query for bmi column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'bmi' AS column_name, 
    rowid AS record_id, 
    CASE WHEN bmi IS NULL OR bmi = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    bmi IS NULL OR bmi = '';

-- Query for baseline_hba1c column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'baseline_hba1c' AS column_name, 
    rowid AS record_id, 
    CASE WHEN baseline_hba1c IS NULL OR baseline_hba1c = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    baseline_hba1c IS NULL OR baseline_hba1c = '';

-- Query for diabetes_type column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'diabetes_type' AS column_name, 
    rowid AS record_id, 
    CASE WHEN diabetes_type IS NULL OR diabetes_type = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    diabetes_type IS NULL OR diabetes_type = '';

-- Query for study_arm column
SELECT 
    'uniform_resource_participant' AS table_name, 
    'study_arm' AS column_name, 
    rowid AS record_id, 
    CASE WHEN study_arm IS NULL OR study_arm = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status 
FROM 
    uniform_resource_participant 
WHERE 
    study_arm IS NULL OR study_arm = '';

-- Query for metadata_id column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'metadata_id' AS column_name, 
    rowid AS record_id, 
    metadata_id AS value,
    CASE WHEN metadata_id IS NULL OR metadata_id = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    metadata_id IS NULL OR metadata_id = ''

UNION ALL

-- Query for devicename column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'devicename' AS column_name, 
    rowid AS record_id, 
    devicename AS value,
    CASE WHEN devicename IS NULL OR devicename = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    devicename IS NULL OR devicename = ''

UNION ALL

-- Query for device_id column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'device_id' AS column_name, 
    rowid AS record_id, 
    device_id AS value,
    CASE WHEN device_id IS NULL OR device_id = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    device_id IS NULL OR device_id = ''

UNION ALL

-- Query for source_platform column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'source_platform' AS column_name, 
    rowid AS record_id, 
    source_platform AS value,
    CASE WHEN source_platform IS NULL OR source_platform = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    source_platform IS NULL OR source_platform = ''

UNION ALL

-- Query for patient_id column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'patient_id' AS column_name, 
    rowid AS record_id, 
    patient_id AS value,
    CASE WHEN patient_id IS NULL OR patient_id = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    patient_id IS NULL OR patient_id = ''

UNION ALL

-- Query for file_name column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'file_name' AS column_name, 
    rowid AS record_id, 
    file_name AS value,
    CASE WHEN file_name IS NULL OR file_name = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    file_name IS NULL OR file_name = ''

UNION ALL

-- Query for file_format column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'file_format' AS column_name, 
    rowid AS record_id, 
    file_format AS value,
    CASE WHEN file_format IS NULL OR file_format = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    file_format IS NULL OR file_format = ''

UNION ALL

-- Query for file_upload_date column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'file_upload_date' AS column_name, 
    rowid AS record_id, 
    file_upload_date AS value,
    CASE WHEN file_upload_date IS NULL OR file_upload_date = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    file_upload_date IS NULL OR file_upload_date = ''

UNION ALL

-- Query for data_start_date column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'data_start_date' AS column_name, 
    rowid AS record_id, 
    data_start_date AS value,
    CASE WHEN data_start_date IS NULL OR data_start_date = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    data_start_date IS NULL OR data_start_date = ''

UNION ALL

-- Query for data_end_date column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'data_end_date' AS column_name, 
    rowid AS record_id, 
    data_end_date AS value,
    CASE WHEN data_end_date IS NULL OR data_end_date = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    data_end_date IS NULL OR data_end_date = ''

UNION ALL

-- Query for study_id column
SELECT 
    'uniform_resource_cgm_file_metadata' AS table_name, 
    'study_id' AS column_name, 
    rowid AS record_id, 
    study_id AS value,
    CASE WHEN study_id IS NULL OR study_id = '' THEN 'Value in column is Empty or NULL' ELSE 'Value in column is Not Empty' END AS status 
FROM 
    uniform_resource_cgm_file_metadata 
WHERE 
    study_id IS NULL OR study_id = '';

-- Schema Validation: Check for primary key mismatches
/*WITH SchemaValidationPrimaryKeyMismatch AS (
    SELECT 
        'Schema Validation: Primary Key Mismatches' AS heading,
        e.table_name,
        e.column_name,
        e.column_type,
        e.is_primary_key,
        'Primary Key Mismatch for column: ' || e.column_name || ' in table ' || e.table_name AS status
    FROM 
        expected_schema e
    LEFT JOIN (
        SELECT 
            m.name AS table_name,
            p.name AS column_name,
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
        a.is_primary_key IS NOT NULL
        AND a.is_primary_key != e.is_primary_key
)
SELECT * FROM SchemaValidationPrimaryKeyMismatch;*/

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
            uniform_resource_study   where start_date != null or start_date !=''
        UNION ALL
        SELECT 
            'uniform_resource_study' AS table_name,
            'end_date' AS column_name,
            end_date AS value
        FROM 
            uniform_resource_study where end_date != null or end_date !=''
        UNION ALL
        SELECT 
            'uniform_resource_cgm_file_metadata' AS table_name,
            'file_upload_date' AS column_name,
            file_upload_date AS value
        FROM 
            uniform_resource_cgm_file_metadata where file_upload_date != null or file_upload_date !=''
        UNION ALL
        SELECT 
            'uniform_resource_cgm_file_metadata' AS table_name,
            'data_start_date' AS column_name,
            data_start_date AS value
        FROM 
            uniform_resource_cgm_file_metadata where data_start_date != null or data_start_date !=''
        UNION ALL
        SELECT 
            'uniform_resource_cgm_file_metadata' AS table_name,
            'data_end_date' AS column_name,
            data_end_date AS value
        FROM 
            uniform_resource_cgm_file_metadata where data_end_date != null or data_end_date !=''
    ) 
    WHERE 
        value NOT LIKE '____-__-__'
)
SELECT * FROM DataIntegrityInvalidDates;

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
SELECT * FROM DataIntegrityInvalidAge;


-- Add any other data validation queries here as needed
--------------------------------------------------------------------------------------------------------------------------


-- Insert missing columns issues
INSERT INTO orchestration_session_issue (
    orchestration_session_issue_id, session_id, session_entry_id, issue_type, issue_message, issue_row, issue_column, invalid_value, elaboration
)
SELECT
    uuid_generate_v4(), 'new_session_id', NULL, 'Schema Validation: Missing Columns', 'Missing column: ' || column_name || ' in table ' || table_name, NULL, column_name, NULL, NULL
FROM SchemaValidationMissingColumns;

-- Insert additional columns issues
INSERT INTO orchestration_session_issue (
    orchestration_session_issue_id, session_id, session_entry_id, issue_type, issue_message, issue_row, issue_column, invalid_value, elaboration
)
SELECT
    uuid_generate_v4(), 'new_session_id', NULL, 'Schema Validation: Additional Columns', 'Additional column found: ' || column_name || ' in table ' || table_name, NULL, column_name, NULL, NULL
FROM SchemaValidationAdditionalColumns;

-- Insert empty or NULL values issues for uniform_resource_participant table
INSERT INTO orchestration_session_issue (
    orchestration_session_issue_id, session_id, session_entry_id, issue_type, issue_message, issue_row, issue_column, invalid_value, elaboration
)
SELECT
    uuid_generate_v4(), 'new_session_id', NULL, 'Empty or NULL Value', 'Empty or NULL value in ' || column_name, record_id, column_name, NULL, NULL
FROM (
    SELECT 'uniform_resource_participant' AS table_name, 'participant_id' AS column_name, rowid AS record_id, CASE WHEN participant_id IS NULL OR participant_id = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status FROM uniform_resource_participant WHERE participant_id IS NULL OR participant_id = ''
    UNION ALL
    SELECT 'uniform_resource_participant' AS table_name, 'study_id' AS column_name, rowid AS record_id, CASE WHEN study_id IS NULL OR study_id = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status FROM uniform_resource_participant WHERE study_id IS NULL OR study_id = ''
    UNION ALL
    SELECT 'uniform_resource_participant' AS table_name, 'site_id' AS column_name, rowid AS record_id, CASE WHEN site_id IS NULL OR site_id = '' THEN 'Empty or NULL' ELSE 'Not Empty' END AS status FROM uniform_resource_participant WHERE site_id IS NULL OR site_id = ''
    -- Add similar queries for other columns as needed
);

-- Complete the orchestration session
UPDATE orchestration_session
SET orch_finished_at = CURRENT_TIMESTAMP
WHERE orchestration_session_id = 'new_session_id';
