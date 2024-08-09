-- Perform De-identification
UPDATE ur_ingest_session_imap_account
SET
    email = anonymize_email(email),
    password = mask(password),
    host = anonymize_name(host),
    created_by = anonymize_name(created_by),
    updated_by = anonymize_name(updated_by),
    deleted_by = anonymize_name(deleted_by);

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

SELECT surveilr_device_id() AS device_id;
SELECT surveilr_orchestration_nature_id('De-identification') AS orchestration_nature_id;
SELECT surveilr_orchestration_context_session_id() AS orchestration_session_id;


CREATE TEMPORARY TABLE temp_session_info AS
SELECT
    orchestration_session_id,
    (SELECT orchestration_session_entry_id FROM orchestration_session_entry WHERE session_id = orchestration_session_id LIMIT 1) AS orchestration_session_entry_id
FROM orchestration_session
LIMIT 1;

-- Insert into orchestration_session_exec for uniform_resource_investigator
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

-- Insert into orchestration_session_exec for uniform_resource_author
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
