```bash
$ deno run ../../prime/ux.sql.ts | sqlite3 resource-surveillance.sqlite.db
$ deno run ./ux.sql.ts | sqlite3 resource-surveillance.sqlite.db
$ cat stateless-infra-assurance.surveilr.sql | sqlite3 resource-surveillance.sqlite.db
$ cat orchestrate-stateful-infra-assurance.surveilr.sql | sqlite3 resource-surveillance.sqlite.db
$ ../../support/bin/sqlpagectl.ts dev --watch . --watch ../../prime --standalone
```
