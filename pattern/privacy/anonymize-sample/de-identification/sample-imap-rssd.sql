INSERT INTO ur_ingest_session (
    ur_ingest_session_id, 
    device_id, 
    behavior_id, 
    behavior_json, 
    ingest_started_at, 
    ingest_finished_at, 
    session_agent, 
    elaboration
) VALUES (
    lower(hex(randomblob(16))), 
    lower(hex(randomblob(16))), 
    lower(hex(randomblob(16))),
    '{"extract_attachments": "uniform_resource"}',
    '2023-08-10 10:00:00', 
    '2023-08-10 11:30:00',
    '{"name": "Test Ingest Agent", "version": "1.0.0"}',
    '{}'
);

INSERT INTO ur_ingest_session_imap_account (
    ur_ingest_session_imap_account_id, 
    ingest_session_id, 
    email, 
    password, 
    host, 
    elaboration
) VALUES (
    lower(hex(randomblob(16))),
    (SELECT ur_ingest_session_id FROM ur_ingest_session ORDER BY created_at DESC LIMIT 1), 
    'testuser@example.com', 
    'password123', 
    'imap.example.com', 
    '{}'
);

INSERT INTO ur_ingest_session_imap_acct_folder (
    ur_ingest_session_imap_acct_folder_id,
    ingest_session_id, 
    ingest_account_id, 
    folder_name, 
    elaboration
) VALUES (
    lower(hex(randomblob(16))),
    (SELECT ur_ingest_session_id FROM ur_ingest_session ORDER BY created_at DESC LIMIT 1),
    (SELECT ur_ingest_session_imap_account_id FROM ur_ingest_session_imap_account ORDER BY created_at DESC LIMIT 1),
    'Inbox', 
    '{}'
), (
    lower(hex(randomblob(16))),
    (SELECT ur_ingest_session_id FROM ur_ingest_session ORDER BY created_at DESC LIMIT 1),
    (SELECT ur_ingest_session_imap_account_id FROM ur_ingest_session_imap_account ORDER BY created_at DESC LIMIT 1),
    'Sent', 
    '{}'
), (
    lower(hex(randomblob(16))),
    (SELECT ur_ingest_session_id FROM ur_ingest_session ORDER BY created_at DESC LIMIT 1),
    (SELECT ur_ingest_session_imap_account_id FROM ur_ingest_session_imap_account ORDER BY created_at DESC LIMIT 1),
    'Drafts',
    '{}'
); 

INSERT INTO ur_ingest_session_imap_acct_folder_message (
    ur_ingest_session_imap_acct_folder_message_id, 
    ingest_session_id, 
    ingest_imap_acct_folder_id,
    uniform_resource_id, 
    message, 
    message_id, 
    subject, 
    'from',
    cc, 
    bcc, 
    status, 
    date, 
    email_references
) VALUES 
    (lower(hex(randomblob(16))), (SELECT ur_ingest_session_id FROM ur_ingest_session ORDER BY created_at DESC LIMIT 1), 
    (SELECT ur_ingest_session_imap_acct_folder_id FROM ur_ingest_session_imap_acct_folder WHERE folder_name = 'Inbox' ORDER BY created_at DESC LIMIT 1), 
    NULL, 'Hello, this is a test email.', '12345', 'Test Email', 'sender@example.com', '[]', '[]', '["READ"]', '2023-08-09', '[]'),
    (lower(hex(randomblob(16))), (SELECT ur_ingest_session_id FROM ur_ingest_session ORDER BY created_at DESC LIMIT 1),
    (SELECT ur_ingest_session_imap_acct_folder_id FROM ur_ingest_session_imap_acct_folder WHERE folder_name = 'Inbox' ORDER BY created_at DESC LIMIT 1), 
    'attachment_resource_id_1', 'Email with attachment', '67890', 'Important Update', 'boss@example.com', '[]', '[]', '["UNREAD", "STARRED"]', '2023-08-10', '[]'),
    (lower(hex(randomblob(16))), (SELECT ur_ingest_session_id FROM ur_ingest_session ORDER BY created_at DESC LIMIT 1),
    (SELECT ur_ingest_session_imap_acct_folder_id FROM ur_ingest_session_imap_acct_folder WHERE folder_name = 'Sent' ORDER BY created_at DESC LIMIT 1), 
    NULL, 'Re: Test Email', '54321', 'Re: Test Email', 'testuser@example.com', '["sender@example.com"]', '[]', '["READ"]', '2023-08-10', '["12345"]'),

    (lower(hex(randomblob(16))), (SELECT ur_ingest_session_id FROM ur_ingest_session ORDER BY created_at DESC LIMIT 1),
    (SELECT ur_ingest_session_imap_acct_folder_id FROM ur_ingest_session_imap_acct_folder ORDER BY random() LIMIT 1),
    (CASE WHEN random() < 0.3 THEN 'attachment_resource_id_1' ELSE NULL END),
    'This is another test email.', 
    lower(hex(randomblob(5))), 
    'Random Subject ' || CAST(random() * 100 AS INT), 
    'random_sender@example.com', 
    '[]', '[]', 
    '{"' || (SELECT 'READ' ORDER BY RANDOM() LIMIT 1) || '"}' ,
    '2023-08-' || (10 + CAST(random() * 2 AS INT)), 
    '[]'
    )
;

