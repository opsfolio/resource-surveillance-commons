-- Below are the list of functions surveilr currently exposes for orchestaration and deidentification purposes
-- surveilr_version - Returns the current version of `suvrveilr` that's being executed
-- surveilr_orchestration_context_session_id - The active context, if present. It returns the ID of the current session
-- surveilr_orchestration_nature_id(<nature_type>), e.g surveilr_orchestration_nature_id('v&v') - Returns the ID of the orchestration nature if present, else it is null.
-- De Identification Functions
--  anonymize_name: Randomize any name or string like field
-- mask: mask sensitive information with delimeter, default is '*'. TODO: accept a delimeter e.g mask('data', '#').
-- generalize_age: change the age
-- anonymize_email: changes the host of the email address, e.g baasit@surveilr.com -> doe@surveilr.com
-- mask_financial: mask any financial data
-- anonymize_date
-- mask_phone: changes phone number to something like: 798-***-***
-- mask_dob
-- mask_address
-- hash: create a SHA1 hash of the data

-- TODO: explain how to ingest into IMAP, write script to put synthetic data into the 
-- Perform De-identification
UPDATE ur_ingest_session_imap_account
SET
    email = anonymize_email(email),
    password = mask(password),
    host = anonymize_name(host);

UPDATE ur_ingest_session_imap_acct_folder
SET
    folder_name = anonymize_name(folder_name),
    created_by = anonymize_name(created_by),
    updated_by = anonymize_name(updated_by),
    deleted_by = anonymize_name(deleted_by);

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