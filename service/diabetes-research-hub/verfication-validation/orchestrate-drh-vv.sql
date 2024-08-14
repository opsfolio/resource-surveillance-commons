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
('uniform_resource_institution', 'city', 'TEXT', 0, 1),
('uniform_resource_institution', 'state', 'TEXT', 0, 1),
('uniform_resource_institution', 'country', 'TEXT', 0, 1),
('uniform_resource_institution', 'elaboration', 'TEXT', 0, 0),

-- uniform_resource_lab table
('uniform_resource_lab', 'lab_id', 'TEXT', 1, 1),
('uniform_resource_lab', 'lab_name', 'TEXT', 0, 1),
('uniform_resource_lab', 'lab_pi', 'TEXT', 0, 1),
('uniform_resource_lab', 'institution_id', 'TEXT', 0, 1),
('uniform_resource_lab', 'study_id', 'TEXT', 0, 1),
('uniform_resource_lab', 'elaboration', 'TEXT', 0, 0),

-- uniform_resource_study table
('uniform_resource_study', 'study_id', 'TEXT', 1, 1),
('uniform_resource_study', 'study_name', 'TEXT', 0, 1),
('uniform_resource_study', 'start_date', 'TEXT', 0, 1),
('uniform_resource_study', 'end_date', 'TEXT', 0, 1),
('uniform_resource_study', 'treatment_modalities', 'TEXT', 0, 1),
('uniform_resource_study', 'funding_source', 'TEXT', 0, 1),
('uniform_resource_study', 'nct_number', 'TEXT', 0, 1),
('uniform_resource_study', 'study_description', 'TEXT', 0, 1),
('uniform_resource_study', 'elaboration', 'TEXT', 0, 0),

-- uniform_resource_site table
('uniform_resource_site', 'site_id', 'TEXT', 1, 1),
('uniform_resource_site', 'study_id', 'TEXT', 0, 1),
('uniform_resource_site', 'site_name', 'TEXT', 0, 1),
('uniform_resource_site', 'site_type', 'TEXT', 0, 1),
('uniform_resource_site', 'elaboration', 'TEXT', 0, 0),

-- uniform_resource_participant table
('uniform_resource_participant', 'participant_id', 'TEXT', 1, 1),
('uniform_resource_participant', 'study_id', 'TEXT', 0, 1),
('uniform_resource_participant', 'site_id', 'TEXT', 0, 1),
('uniform_resource_participant', 'diagnosis_icd', 'TEXT', 0, 1),
('uniform_resource_participant', 'med_rxnorm', 'TEXT', 0, 1),
('uniform_resource_participant', 'treatment_modality', 'TEXT', 0, 0),
('uniform_resource_participant', 'gender', 'TEXT', 0, 1),
('uniform_resource_participant', 'race_ethnicity', 'TEXT', 0, 0),
('uniform_resource_participant', 'age', 'TEXT', 0, 1),
('uniform_resource_participant', 'bmi', 'TEXT', 0, 1),
('uniform_resource_participant', 'baseline_hba1c', 'TEXT', 0, 1),
('uniform_resource_participant', 'diabetes_type', 'TEXT', 0, 1),
('uniform_resource_participant', 'study_arm', 'TEXT', 0, 1),
('uniform_resource_participant', 'elaboration', 'TEXT', 0, 0),

-- uniform_resource_investigator table
('uniform_resource_investigator', 'investigator_id', 'TEXT', 1, 1),
('uniform_resource_investigator', 'investigator_name', 'TEXT', 0, 1),
('uniform_resource_investigator', 'email', 'TEXT', 0, 1),
('uniform_resource_investigator', 'institution_id', 'TEXT', 0, 1),
('uniform_resource_investigator', 'study_id', 'TEXT', 0, 1),
('uniform_resource_investigator', 'elaboration', 'TEXT', 0, 0),

-- uniform_resource_publication table
('uniform_resource_publication', 'publication_id', 'TEXT', 1, 1),
('uniform_resource_publication', 'publication_title', 'TEXT', 0, 1),
('uniform_resource_publication', 'digital_object_identifier', 'TEXT', 0, 0),
('uniform_resource_publication', 'publication_site', 'TEXT', 0, 0),
('uniform_resource_publication', 'study_id', 'TEXT', 0, 1),
('uniform_resource_publication', 'elaboration', 'TEXT', 0, 0),

-- uniform_resource_author table
('uniform_resource_author', 'author_id', 'TEXT', 1, 1),
('uniform_resource_author', 'name', 'TEXT', 0, 1),
('uniform_resource_author', 'email', 'TEXT', 0, 1),
('uniform_resource_author', 'investigator_id', 'TEXT', 0, 1),
('uniform_resource_author', 'study_id', 'TEXT', 0, 1),
('uniform_resource_author', 'elaboration', 'TEXT', 0, 0),

-- uniform_resource_cgm_file_metadata table
('uniform_resource_cgm_file_metadata', 'metadata_id', 'TEXT', 1, 1),
('uniform_resource_cgm_file_metadata', 'devicename', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'device_id', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'source_platform', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'patient_id', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'file_name', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'file_format', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'file_upload_date', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'data_start_date', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'data_end_date', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'study_id', 'TEXT', 0, 1),
('uniform_resource_cgm_file_metadata', 'elaboration', 'TEXT', 0, 0);

-- Schema Validation

-- Validate the schema to check for missing columns

WITH SchemaValidationMissingColumns AS (
    SELECT 
        'Schema Validation: Missing Columns' AS heading,
        e.table_name,
        e.column_name,
        e.column_type,
        e.is_primary_key,
        'Missing column: ' || e.column_name || ' in table ' || e.table_name AS status,
        'Include the ' || e.column_name || ' in table ' || e.table_name AS remediation
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
-- Insert into orchestration_session_issue table
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
    --'ORCISSUEID-'||((SELECT COUNT(*) FROM orchestration_session_issue) + 1)  AS orchestration_session_issue_id,
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) AS orchestration_session_issue_id,
    (SELECT surveilr_orchestration_context_session_id()) AS session_id,  -- Replace with actual session ID or dynamic value if needed
    (select orchestration_session_entry_id from orchestration_session_entry where session_id =(SELECT surveilr_orchestration_context_session_id())) AS session_entry_id,  -- Replace with actual session entry ID or dynamic value if needed
    heading as issue_type,
    status as issue_message,
    NULL AS issue_row,  -- Set as NULL if not applicable
    column_name AS issue_column,
    NULL AS invalid_value,  -- Set as NULL if not applicable
    remediation,
    NULL AS elaboration  -- Set as NULL or provide elaboration if needed
FROM SchemaValidationMissingColumns;


-- Line break
SELECT '\n' AS blank_line;

-- Validate the schema to check for additional  columns

WITH SchemaValidationAdditionalColumns AS (
    SELECT 
        'Schema Validation: Additional Columns' AS heading,
        a.table_name,
        a.column_name,
        a.column_type,
        a.is_primary_key,
        'Additional column found: ' || a.column_name || ' in table ' || a.table_name AS status,
        'Warning: Additional column found: ' || a.column_name || ' in table ' || a.table_name||'.The column can be maintained or removed as desired.' AS remediation
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
--select * FROM SchemaValidationAdditionalColumns;
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
    --'ORCISSUEID-'||((SELECT COUNT(*) FROM orchestration_session_issue) + 1)  AS orchestration_session_issue_id,
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) AS orchestration_session_issue_id,
    (SELECT surveilr_orchestration_context_session_id()) AS session_id,  -- Replace with actual session ID or dynamic value if needed
    (select orchestration_session_entry_id from orchestration_session_entry where session_id =(SELECT surveilr_orchestration_context_session_id())) AS session_entry_id,  -- Replace with actual session entry ID or dynamic value if needed
    heading as issue_type,
    status as issue_message,
    NULL AS issue_row,  -- Set as NULL if not applicable
    column_name AS issue_column,
    NULL AS invalid_value,  -- Set as NULL if not applicable
    remediation,
    NULL AS elaboration  -- Set as NULL or provide elaboration if needed
FROM SchemaValidationAdditionalColumns;


-- Line break
SELECT '\n' AS blank_line;


-- Data Integrity Checks: Check for invalid dates
WITH DataIntegrityInvalidDates AS (
    SELECT 
        'Data Integrity Checks: Invalid Dates' AS heading,
        table_name,
        column_name,
        value,
        'Dates must be in YYYY-MM-DD format: ' || value AS status,
        'The date value in column:'||column_name||'of table' || table_name ||'does not follow the YYYY-MM-DD format.Please ensure the dates are in this format' as remediation
    FROM (
        SELECT 
            'uniform_resource_study' AS table_name,
            'start_date' AS column_name,
            start_date AS value
        FROM 
            uniform_resource_study  where start_date != null or start_date !=''
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
            uniform_resource_cgm_file_metadata  where file_upload_date != null or file_upload_date !=''
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

--SELECT * FROM DataIntegrityInvalidDates;
-- Insert invalid dates results into orchestration_session_issue
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
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) AS orchestration_session_issue_id,
    (SELECT surveilr_orchestration_context_session_id()) AS session_id,
    (SELECT orchestration_session_entry_id FROM orchestration_session_entry WHERE session_id = (SELECT surveilr_orchestration_context_session_id())) AS session_entry_id,
    heading AS issue_type,
    status AS issue_message,
    NULL AS issue_row,
    column_name AS issue_column,
    value AS invalid_value,
    remediation,
    NULL AS elaboration
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
--SELECT * FROM  DataIntegrityInvalidAge;
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
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) AS orchestration_session_issue_id,
    (SELECT surveilr_orchestration_context_session_id()) AS session_id,
    (SELECT orchestration_session_entry_id FROM orchestration_session_entry WHERE session_id = (SELECT surveilr_orchestration_context_session_id())) AS session_entry_id,
    heading AS issue_type,
    status AS issue_message,
    NULL AS issue_row,
    column_name AS issue_column,
    value AS invalid_value,
    'Ensure the age is numeric.' AS remediation,
    NULL AS elaboration
FROM DataIntegrityInvalidAge;


-- Generate SQL for finding empty or NULL values in table
    WITH DataIntegrityEmptyCells AS (
    SELECT 
        'Data Integrity Checks: Empty Cells' AS heading,
        table_name,
        column_name,
        'The rows empty are:'|| GROUP_CONCAT(rowid) AS issue_row,  -- Concatenates row IDs with empty values
        'The following rows in column ' || column_name || ' of file ' || substr(table_name, 18) || ' are either NULL or empty.' AS status,
        'Please provide values for the ' || column_name || ' column in file ' || substr(table_name, 18) ||'.The Rows are:'|| GROUP_CONCAT(rowid) AS remediation
    FROM (
        -- Checking start_date in uniform_resource_study for empty or NULL values
        SELECT 
            'uniform_resource_study' AS table_name,
            'study_id' AS column_name,
            study_id AS value,
            rowid
        FROM 
            uniform_resource_study  
        WHERE 
            study_id IS NULL OR study_id = ''

        UNION ALL

        SELECT 
            'uniform_resource_study' AS table_name,
            'study_name' AS column_name,
            study_name AS value,
            rowid
        FROM 
            uniform_resource_study  
        WHERE 
            study_name IS NULL OR study_name = ''

        UNION ALL

        SELECT 
            'uniform_resource_study' AS table_name,
            'start_date' AS column_name,
            start_date AS value,
            rowid
        FROM 
            uniform_resource_study  
        WHERE 
            start_date IS NULL OR start_date = ''
        
        UNION ALL
        
        -- Checking end_date in uniform_resource_study for empty or NULL values
        SELECT 
            'uniform_resource_study' AS table_name,
            'end_date' AS column_name,
            end_date AS value,
            rowid
        FROM 
            uniform_resource_study 
        WHERE 
            end_date IS NULL OR end_date = ''
        
        UNION ALL

        SELECT 
            'uniform_resource_study' AS table_name,
            'treatment_modalities' AS column_name,
            treatment_modalities AS value,
            rowid
        FROM 
            uniform_resource_study 
        WHERE 
            treatment_modalities IS NULL OR treatment_modalities = ''
        
        UNION ALL

        SELECT 
            'uniform_resource_study' AS table_name,
            'funding_source' AS column_name,
            funding_source AS value,
            rowid
        FROM 
            uniform_resource_study 
        WHERE 
            funding_source IS NULL OR funding_source = ''
        
        UNION ALL

        SELECT 
            'uniform_resource_study' AS table_name,
            'nct_number' AS column_name,
            nct_number AS value,
            rowid
        FROM 
            uniform_resource_study 
        WHERE 
            nct_number IS NULL OR nct_number = ''
        
        UNION ALL

        SELECT 
            'uniform_resource_study' AS table_name,
            'study_description' AS column_name,
            study_description AS value,
            rowid
        FROM 
            uniform_resource_study 
        WHERE 
            study_description IS NULL OR study_description = ''
        
        UNION ALL


        --- uniform_resource_institution table

        SELECT 
            'uniform_resource_institution' AS table_name,
            'institution_id' AS column_name,
            institution_id AS value,
            rowid
        FROM 
            uniform_resource_institution 
        WHERE 
            institution_id IS NULL OR institution_id = ''
        
        UNION ALL

        SELECT 
            'uniform_resource_institution' AS table_name,
            'institution_name' AS column_name,
            institution_name AS value,
            rowid
        FROM 
            uniform_resource_institution 
        WHERE 
            institution_name IS NULL OR institution_name = ''
        
        UNION ALL

        SELECT 
            'uniform_resource_institution' AS table_name,
            'city' AS column_name,
            city AS value,
            rowid
        FROM 
            uniform_resource_institution 
        WHERE 
            city IS NULL OR city = ''
        
        UNION ALL

        SELECT 
            'uniform_resource_institution' AS table_name,
            'state' AS column_name,
            state AS value,
            rowid
        FROM 
            uniform_resource_institution 
        WHERE 
            state IS NULL OR state = ''
        
        UNION ALL

         SELECT 
            'uniform_resource_institution' AS table_name,
            'country' AS column_name,
            country AS value,
            rowid
        FROM 
            uniform_resource_institution 
        WHERE 
            country IS NULL OR country = ''
        
        UNION ALL       
        

        -- uniform_resource_site table

        SELECT 
            'uniform_resource_site' AS table_name,
            'site_id' AS column_name,
            site_id AS value,
            rowid
        FROM 
            uniform_resource_site  
        WHERE 
            site_id IS NULL OR site_id = ''
        
        UNION ALL
        

        SELECT 
            'uniform_resource_site' AS table_name,
            'study_id' AS column_name,
            study_id AS value,
            rowid
        FROM 
            uniform_resource_site  
        WHERE 
            study_id IS NULL OR study_id = ''
        
        UNION ALL


        SELECT 
            'uniform_resource_site' AS table_name,
            'site_name' AS column_name,
            site_name AS value,
            rowid
        FROM 
            uniform_resource_site  
        WHERE 
            site_name IS NULL OR site_name = ''
        
        UNION ALL

        
        SELECT 
            'uniform_resource_site' AS table_name,
            'site_type' AS column_name,
            site_type AS value,
            rowid
        FROM 
            uniform_resource_site  
        WHERE 
            site_type IS NULL OR site_type = ''
        
        UNION ALL        

        -- uniform_resource_lab table

        SELECT 
            'uniform_resource_lab' AS table_name,
            'lab_id' AS column_name,
            lab_id AS value,
            rowid
        FROM 
            uniform_resource_lab  
        WHERE 
            lab_id IS NULL OR lab_id = ''
        
        UNION ALL       

        SELECT 
            'uniform_resource_lab' AS table_name,
            'lab_name' AS column_name,
            lab_name AS value,
            rowid
        FROM 
            uniform_resource_lab  
        WHERE 
            lab_name IS NULL OR lab_name = ''
        
        UNION ALL      

         SELECT 
            'uniform_resource_lab' AS table_name,
            'lab_pi' AS column_name,
            lab_pi AS value,
            rowid
        FROM 
            uniform_resource_lab  
        WHERE 
            lab_pi IS NULL OR lab_pi = ''
        
        UNION ALL    

          SELECT 
            'uniform_resource_lab' AS table_name,
            'institution_id' AS column_name,
            institution_id AS value,
            rowid
        FROM 
            uniform_resource_lab  
        WHERE 
            institution_id IS NULL OR institution_id = ''
        
        UNION ALL    

        SELECT 
            'uniform_resource_lab' AS table_name,
            'study_id' AS column_name,
            study_id AS value,
            rowid
        FROM 
            uniform_resource_lab  
        WHERE 
            study_id IS NULL OR study_id = ''
        
        UNION ALL    
        

        -- uniform_resource_participant table
        SELECT 
            'uniform_resource_participant' AS table_name,
            'participant_id' AS column_name,
            participant_id AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            participant_id IS NULL OR participant_id = ''
        
        UNION ALL    
        
        SELECT 
            'uniform_resource_participant' AS table_name,
            'study_id' AS column_name,
            study_id AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            study_id IS NULL OR study_id = ''
        
        UNION ALL    

        SELECT 
            'uniform_resource_participant' AS table_name,
            'site_id' AS column_name,
            site_id AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            site_id IS NULL OR site_id = ''
        
        UNION ALL    

        SELECT 
            'uniform_resource_participant' AS table_name,
            'diagnosis_icd' AS column_name,
            diagnosis_icd AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            diagnosis_icd IS NULL OR diagnosis_icd = ''
        
        UNION ALL   

        SELECT 
            'uniform_resource_participant' AS table_name,
            'med_rxnorm' AS column_name,
            med_rxnorm AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            med_rxnorm IS NULL OR med_rxnorm = ''
        
        UNION ALL    

        SELECT 
            'uniform_resource_participant' AS table_name,
            'treatment_modality' AS column_name,
            treatment_modality AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            treatment_modality IS NULL OR treatment_modality = ''
        
        UNION ALL    

        SELECT 
            'uniform_resource_participant' AS table_name,
            'gender' AS column_name,
            gender AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            gender IS NULL OR gender = ''
        
        UNION ALL    

        SELECT 
            'uniform_resource_participant' AS table_name,
            'race_ethnicity' AS column_name,
            race_ethnicity AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            race_ethnicity IS NULL OR race_ethnicity = ''
        
        UNION ALL   

        SELECT 
            'uniform_resource_participant' AS table_name,
            'age' AS column_name,
            age AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            age IS NULL OR age = ''
        
        UNION ALL    

        SELECT 
            'uniform_resource_participant' AS table_name,
            'bmi' AS column_name,
            bmi AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            bmi IS NULL OR bmi = ''
        
        UNION ALL    

        SELECT 
            'uniform_resource_participant' AS table_name,
            'baseline_hba1c' AS column_name,
            baseline_hba1c AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            baseline_hba1c IS NULL OR baseline_hba1c = ''
        
        UNION ALL    

        
        SELECT 
            'uniform_resource_participant' AS table_name,
            'diabetes_type' AS column_name,
            diabetes_type AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            diabetes_type IS NULL OR diabetes_type = ''
        
        UNION ALL 

        SELECT 
            'uniform_resource_participant' AS table_name,
            'study_arm' AS column_name,
            study_arm AS value,
            rowid
        FROM 
            uniform_resource_participant  
        WHERE 
            study_arm IS NULL OR study_arm = ''
        
        UNION ALL 
        
        
        -- Checking file_upload_date in uniform_resource_cgm_file_metadata for empty or NULL values
        SELECT 
            'uniform_resource_cgm_file_metadata' AS table_name,
            'file_upload_date' AS column_name,
            file_upload_date AS value,
            rowid
        FROM 
            uniform_resource_cgm_file_metadata  
        WHERE 
            file_upload_date IS NULL OR file_upload_date = ''
        
        UNION ALL
        
        -- Checking data_start_date in uniform_resource_cgm_file_metadata for empty or NULL values
        SELECT 
            'uniform_resource_cgm_file_metadata' AS table_name,
            'data_start_date' AS column_name,
            data_start_date AS value,
            rowid
        FROM 
            uniform_resource_cgm_file_metadata 
        WHERE 
            data_start_date IS NULL OR data_start_date = ''
        
        UNION ALL
        
        -- Checking data_end_date in uniform_resource_cgm_file_metadata for empty or NULL values
        SELECT 
            'uniform_resource_cgm_file_metadata' AS table_name,
            'data_end_date' AS column_name,
            data_end_date AS value,
            rowid
        FROM 
            uniform_resource_cgm_file_metadata 
        WHERE 
            data_end_date IS NULL OR data_end_date = ''
    )
    GROUP BY table_name, column_name  -- Group by table and column to concatenate row IDs
)
-- Select to review the identified empty cells
--SELECT * FROM DataIntegrityEmptyCells;
-- Insert the validation issues into orchestration_session_issue table
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
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) AS orchestration_session_issue_id,
    (SELECT surveilr_orchestration_context_session_id()) AS session_id,
    (SELECT orchestration_session_entry_id 
     FROM orchestration_session_entry 
     WHERE session_id = (SELECT surveilr_orchestration_context_session_id())) AS session_entry_id,
    heading AS issue_type,
    status AS issue_message,
    issue_row,  -- No specific row for the summary issues
    column_name AS issue_column,
    NULL AS invalid_value,  -- No specific value for the summary issues
    remediation,
    NULL AS elaboration
FROM DataIntegrityEmptyCells;


-- CTE to compute the count of records in each table
WITH table_counts AS (
        SELECT 
        'uniform_resource_study' AS table_name,
        COUNT(*) AS row_count
        FROM uniform_resource_study
        UNION ALL
        SELECT 'uniform_resource_cgm_file_metadata' AS table_name ,
        COUNT(*) AS row_count
        FROM uniform_resource_cgm_file_metadata
        UNION ALL
        SELECT 'uniform_resource_participant' AS table_name,
        COUNT(*) AS row_count FROM uniform_resource_participant
        UNION ALL
        SELECT 'uniform_resource_institution' AS table_name,
        COUNT(*) AS row_count
        FROM uniform_resource_institution
        UNION ALL
        SELECT 'uniform_resource_lab' AS table_name,
        COUNT(*) AS row_count
        FROM uniform_resource_lab
        UNION ALL
        SELECT 'uniform_resource_site' AS table_name,
        COUNT(*) AS row_count
        FROM uniform_resource_site
        UNION ALL
        SELECT 'uniform_resource_investigator' AS table_name,
        COUNT(*) AS row_count
        FROM uniform_resource_investigator
        UNION ALL
        SELECT 'uniform_resource_publication' AS table_name,
        COUNT(*) AS row_count
        FROM uniform_resource_publication
        UNION ALL
        SELECT 'uniform_resource_author' AS table_name ,
        COUNT(*) AS row_count
        FROM uniform_resource_author      
        -- Add more tables as needed
    ),
empty_tables AS (
    SELECT 
        table_name,
        row_count,
        'The File ' || substr(table_name, 18) || ' is empty' AS status,
        'The file ' || substr(table_name, 18) || ' has zero records. Please check and ensure the file is populated with data.' AS remediation
    FROM 
        table_counts
    WHERE 
        row_count = 0
)
--SELECT * FROM empty_tables;
-- Insert findings into orchestration_session_issue table
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
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) AS orchestration_session_issue_id,
    (SELECT surveilr_orchestration_context_session_id()) AS session_id,
    (SELECT orchestration_session_entry_id 
     FROM orchestration_session_entry 
     WHERE session_id = (SELECT surveilr_orchestration_context_session_id())) AS session_entry_id,
    'Data Integrity Checks: Empty Tables' AS issue_type,
    status AS issue_message,
    NULL AS issue_row,
    NULL AS issue_column,
    NULL AS invalid_value,
    remediation,
    NULL AS elaboration
FROM 
    empty_tables;

