# Watching Files with `inotifywait` and Executing Commands on Change

This guide demonstrates how to use `inotifywait` from the `inotify-tools`
package to watch for changes in `.sql.ts` and `.sql` files. When a `.sql.ts`
file changes, it runs the file with Deno and pipes the output to SQLite. When a
`.sql` file changes, it pipes the file contents to SQLite using `cat`.

## Prerequisites

Ensure that `inotify-tools` is installed on your system. You can install it
using your package manager. For example, on Debian-based systems like Ubuntu,
use:

```bash
sudo apt-get install inotify-tools
```

## Watch Script

The following script watches for changes in `.sql.ts` and `.sql` files. It uses
an environment variable `SURVEILR_RSSD_PATH` to specify the SQLite database
path, which defaults to `resource-surveillance.sqlite.db`. 

The actual script is available here: [`watch-and-reload-sql.sh`](watch-and-reload-sql.sh).

Below is the general approach to learn from:

```bash
#!/bin/bash

# Set default database path if not provided
DB_PATH=${SURVEILR_RSSD_PATH:-resource-surveillance.sqlite.db}

# List all files being watched
echo "Watching the following files:"
ls *.sql.ts *.sql

# Watch for changes in *.sql.ts and *.sql files
while inotifywait -e close_write *.sql.ts *.sql; do
    # Loop through each modified file
    for file in $(inotifywait -e close_write --format "%w%f" --quiet *.sql.ts *.sql); do
        if [[ "$file" == *.sql.ts ]]; then
            command="deno run \"$file\" | sqlite3 \"$DB_PATH\""
            echo "$file modified, running $command"
            eval "$command"
        elif [[ "$file" == *.sql ]]; then
            command="cat \"$file\" | sqlite3 \"$DB_PATH\""
            echo "$file modified, running $command"
            eval "$command"
        fi
    done
done
```

This script will continue running and monitor changes in the specified `.sql.ts`
and `.sql` files, executing the appropriate commands whenever changes are
detected.

### Explanation (if you need to edit it or make your own version)

- `DB_PATH=${SURVEILR_RSSD_PATH:-resource-surveillance.sqlite.db}`: Sets the
  database path to the value of `SURVEILR_RSSD_PATH` or defaults to
  `resource-surveillance.sqlite.db`.
- `ls *.sql.ts *.sql`: Lists all `.sql.ts` and `.sql` files being watched.
- `inotifywait -e close_write *.sql.ts *.sql`: Watches for `close_write` events
  on `.sql.ts` and `.sql` files.
- `if [[ "$file" == *.sql.ts ]]; then ...`: Checks if the modified file is a
  `.sql.ts` file and runs it using Deno, piping the output to SQLite.
- `elif [[ "$file" == *.sql ]]; then ...`: Checks if the modified file is a
  `.sql` file and pipes the file's contents to SQLite using `cat`.
- `command="..."`: Constructs the command to be run and displays it before
  execution.

