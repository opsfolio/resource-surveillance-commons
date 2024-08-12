-- Below are the list of functions surveilr currently exposed for orchestaration and deidentification purposes
-- surveilr_version - Returns the current version of `suvrveilr` that's being executed
-- surveilr_orchestration_context_session_id - The active context, if present. It returns the ID of the current session
-- surveilr_orchestration_nature_id(<nature_type>), e.g surveilr_orchestration_nature_id('v&v') - Returns the ID of the orchestration nature if present, else it is null.
-- De Identification Functions
-- anonymize_name: replaces any name or name-like string with a randomized pseudonym.
-- mask: Obscures sensitive information by replacing characters with a specified delimiter (default is '*'). Example: mask('1234567890') -> '****567890'.
-- generalize_age: modifies an age value to a broader range or category (e.g., '32' -> '30-35'). 
-- anonymize_email: replaces the username portion of an email address while keeping the domain, e.g baasit@surveilr.com -> doe@surveilr.com
-- mask_financial: conceals financial data, such as account numbers or transaction amounts.
-- anonymize_date: alters a date value to a less specific representation.
-- mask_phone: masks parts of a phone number while retaining its basic structure. Example: '+1 (555) 123-4567' -> '+1 (555) -*'.
-- mask_dob: 
-- mask_address
-- hash: generates a one-way cryptographic hash (SHA1) of the input data. 

-- Preparing Data for De-identification

-- Option 1: Ingest Real IMAP Data
-- Use 'surveilr' to collect email data from an IMAP server.
-- Detailed instructions can be found in the 'assurance' folder's documentation.

-- Option 2: Use Synthetic Data
-- Navigate to any directory in your terminal.
-- Create an empty RSSD by running the command: 'surveilr admin init'

-- Load Synthetic Data into the Database
-- Download synthetic data using 'curl' and pipe it directly into your RSSD:
-- 'curl https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/pattern/privacy/anonymize-sample/de-identification/sample-imap-rssd.sql | sqlite3 resource-surveillance.sqlite.db'

-- Run the De-identification Script
-- Execute the de-identification process using 'surveilr orchestrate':
-- 'surveilr orchestrate -n "deidentification" -s https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/pattern/privacy/anonymize-sample/de-identification/deidentification.sql'

-- Perform De-identification
UPDATE ur_ingest_session_imap_account
SET
    email = anonymize_email(email),
    password = mask(password),
    host = anonymize_name(host);

UPDATE ur_ingest_session_imap_acct_folder
SET
    folder_name = anonymize_name(folder_name);

UPDATE uniform_resource
SET
    uri = mask_phone(uri),
    content_digest = hash(content_digest),
    nature = anonymize_name(nature);

INSERT OR IGNORE INTO orchestration_nature (orchestration_nature_id, nature)
VALUES ('deidentify', 'De-identification');
-- TODO: create ensure_orchestration_nature('deidentify', 'De-identification'): do the INSERT or IGNORE
-- TODO: current_party 

SELECT surveilr_device_id() AS device_id;
SELECT surveilr_orchestration_nature_id('De-identification') AS orchestration_nature_id;
SELECT surveilr_orchestration_context_session_id() AS orchestration_session_id;


CREATE TEMPORARY TABLE temp_session_info AS
SELECT
    orchestration_session_id,
    (SELECT orchestration_session_entry_id FROM orchestration_session_entry WHERE session_id = orchestration_session_id LIMIT 1) AS orchestration_session_entry_id
FROM orchestration_session
LIMIT 1;

INSERT OR IGNORE INTO orchestration_session_exec (
    orchestration_session_exec_id,
    exec_nature,
    session_id,
    session_entry_id,
    exec_code,
    exec_status,
    input_text,
    output_text,
    exec_error_text,
    narrative_md
)
SELECT
    'ORCHSESSEXID-' || ((SELECT COUNT(*) FROM orchestration_session_exec) + 1),
    'De-identification',
    s.orchestration_session_id,
    s.orchestration_session_entry_id,
    'UPDATE uniform_resource_investigator SET email = anonymize_email(email) executed',
    1,
    'email column in uniform_resource_investigator',
    'De-identification completed',
    CASE 
        WHEN (SELECT changes()) = 0 THEN 'No rows updated' 
        ELSE NULL 
    END,
    'username in email is masked'
FROM temp_session_info s;

INSERT OR IGNORE INTO orchestration_session_exec (
    orchestration_session_exec_id,
    exec_nature,
    session_id,
    session_entry_id,
    exec_code,
    exec_status,
    input_text,
    output_text,
    exec_error_text,
    narrative_md
)
SELECT
    -- TODO: change ORCHSESSEXID to ulid() and all other id generation
    'ORCHSESSEXID-' || ((SELECT COUNT(*) FROM orchestration_session_exec) + 1),
    'De-identification',
    s.orchestration_session_id,
    s.orchestration_session_entry_id,
    'UPDATE uniform_resource_author SET email = anonymize_email(email) executed',
    1,
    'email column in uniform_resource_author',
    'De-identification completed',
    CASE 
        WHEN (SELECT changes()) = 0 THEN 'No rows updated' 
        ELSE NULL 
    END,
    'username in email is masked'
FROM temp_session_info s;

-- Drop the temporary table when done
DROP TABLE temp_session_info;

-- Handle exceptions, errors if any in an external mechanism (not possible through SQLITE)
-- Example:
-- ROLLBACK;
-- INSERT INTO orchestration_session_exec 
-- (orchestration_session_exec_id, exec_nature, session_id, exec_code, exec_status, input_text, output_text, exec_error_text, narrative_md)
-- VALUES (
--     'orc-exec-id-' || hex(randomblob(16)),
--     'De-identification',
--     (SELECT orchestration_session_id FROM orchestration_session LIMIT 1),
--     'UPDATE commands executed',
--     1,
--     'Data from uniform_resource_investigator, uniform_resource_author tables',
--     'Error occurred during de-identification',
--     'Detailed error message here',
--     'Error during update'
-- );

-- TODO: explain how to do vaccuumiing to ensure that all deleted data is removed from the RSSD