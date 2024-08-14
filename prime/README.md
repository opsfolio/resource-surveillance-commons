# Resource Surveillance Commons Prime

`RSC` Prime houses reusable and common
[Resource Surveillance](https://www.opsfolio.com/surveilr) (`surveilr`)
"primary" (universal) patterns such as "Console", general navigation, and other
"universal helpers" (content and pages that work across `surveilr`-based
applications)

You can load these into any `surveilr` RSSD:

```bash
$ deno run https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/prime/ux.sql.ts | sqlite3 resource-surveillance.sqlite.db
$ surveilr web-ui --port 9000
# open the page at http://localhost:9000/
```

Ease development using `watch` mode:

```bash
$ ../support/bin/sqlpagectl.ts dev --watch . --standalone
```

The above would start a standalone SQLPage instance and automatically reload all
`*.sql*` files so you can just save from your IDE and refresh the web page to
see changes.

## Orchestration
First prepare the RSSD with sample emails:
```bash
$ cd prime
```

Now, [Download `surveilr` binary](https://docs.opsfolio.com/surveilr/how-to/installation-guide/)
into this directory, then ingest emails:

```bash
# ingest emails from IMAP boxes
$ surveilr ingest imap -u surveilrregression@gmail.com --password '' -a "imap.gmail.com" -b 20 -s "all" --extract-attachments "yes"
```
or using synthetic data
```bash
# initialize and empty resource-surveillance.sqlite.db
$ surveilr admin init
# put data into the RSSD
$ cat ../pattern/privacy/anonymize-sample/de-identification/sample-imap-rssd.sql | sqlite3 resource-surveillance.sqlite.db
```
execute the orchestration script
```bash
$ surveilr orchestrate -n "deidentification" -s https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/pattern/privacy/anonymize-sample/de-identification/deidentification.sql -s ../pattern/privacy/anonymize-sample/de-identification/deidentification_without_orchestration.sql 
```

Post-orchestration, `surveilr` is no longer required, only `sqlite3` is required because all content is in the
`resource-surveillance.sqlite.db` SQLite database which does not require any
other dependencies.
```bash
# load the "Console" and other menu/routing utilities
$ deno run ./ux.sql.ts | sqlite3 resource-surveillance.sqlite.db

# if you want to start surveilr embedded SQLPage in "watch" mode to re-load files automatically
$ ../support/bin/sqlpagectl.ts dev --watch .
# browse http://localhost:9000/ to see web UI

# if you want to start a standalone SQLPage in "watch" mode to re-load files automatically
$ ../support/bin/sqlpagectl.ts dev --watch . --standalone
# browse http://localhost:9000/ to see web UI
```