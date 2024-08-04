# Resource Surveillance Commons Prime

`RSC` Prime houses reusable and common
[Resource Surveillance](https://www.opsfolio.com/surveilr) (`surveilr`)
"primary" (universal) patterns such as "Console", general navigation, and other
"universal helpers" (content and pages that work across `surveilr`-based
applications)

You can load these into any `surveilr` RSSD:

```bash
$ deno run https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/prime/prime.sql.ts | sqlite3 resource-surveillance.sqlite.db
$ surveilr sqlpage --port 9000
# open the page at http://localhost:9000/
```

Ease development using `watch` mode:

```bash
$ ../support/bin/sqlpagectl.ts dev --watch . --standalone
```

The above would start a standalone SQLPage instance and automatically reload all
`*.sql*` files so you can just save from your IDE and refresh the web page to
see changes.
