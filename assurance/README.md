# `surveilr` End-to-End Quality Assurance Patterns

These are SQL scripts executed against `surveilr` after ingesting or orchestrating real world data to test the whole `surbeilr` flow as user/customer would. These are done by creating views on top of the existing data and then executing the scripts. The results are confirmed by using the TAP protocol to print out the expected results against the actual results in the DB.

1. File Ingestions
   - Run `surveilr ingest files --stats` and to confirm, check [this](./ingest-files.sql)
   - Multitenancy with `parties` and `orgs`, execute `surveilr ingest files --tenant-name "timur" --tenant-id "tenant_2"` but this [file](./ingest-files-multitenancy.sql).
2. Email Ingestions
   - IMAP: Using gmail as the IMAP server, execute: 
        ```bash
            surveilr ingest imap -u surveilrregression@gmail.com --password '' -a "imap.gmail.com" -b 20 -s "all" --extract-attachments "yes"
        ```
    - Microsoft 365: 
        ```sh
            ingest imap -f "Inbox" -b 20 -e="yes" microsoft-365 -i="4961b791-3590-470a-94d2-77079a4faa95" -s="" -t=""
        ```
    - Then execute the [file](./ingest-imap.sql).
3. PLM Ingestion
   1. Github: Run `surveilr ingest plm -e="yes" -b 100 github -o "rust-lang" -r "libc"`, then execute this [file](./ingest-plm-github.sql)
   2. Gitlab:  Run `surveilr ingest plm gitlab --host "gitlab.kitware.com" -o "utils" -p "rust-gitlab"` then execute this [file](./ingest-plm-github.sql)