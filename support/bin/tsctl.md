# tsctl - TypeScript Controller

`tsctl` is a TypeScript Controller designed to dynamically load and execute `.ts` files from a GitHub repository. It supports different types of files indicated by their nature (extensions) and provides the appropriate MIME types for each.

## Features

- **Dynamic Import**: Fetch and execute TypeScript modules directly from a specified GitHub repository.
- **MIME Type Handling**: Automatically sets the correct MIME type for the response based on the file's nature.
- **Logging**: Captures console output from the executed modules.
- **Server Profiles**: Supports different server profiles such as SANDBOX, TEST, and PRODUCTION.

## Usage

```bash
deno run ./tsctl.ts serve --profile SANDBOX
```

This command runs `tsctl` in SANDBOX mode, allowing it to fetch and execute TypeScript files from the local environment.

## Command Line Options

- `-M, --mount-endpoint <endpoint:string>`: The mount endpoint to serve from. Defaults to `/tsctl`.
- `-p, --port <port:number>`: The port to run the server on. Defaults to `9022`.
- `--base-url <url:string>`: The base URL for fetching TypeScript files. Defaults to `https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main`.
- `--import-strategy <strategy:ImportStrategy>`: How to import the TypeScript module for execution. Can be `DIRECT` or `PROXY`. Defaults to `DIRECT`.
- `--profile <profile:ServerProfile>`: Server profile (SANDBOX, TEST, PRODUCTION). Defaults to `PRODUCTION`.

## Example Usage

### Fetching a .sql.ts File

To fetch and execute a `.sql.ts` file, navigate to the desired URL:

```
http://localhost:9022/tsctl/example.sql.ts
```

This will fetch the `example.sql.ts` file from the configured base URL or local environment (in SANDBOX mode) and execute it, returning the output with the appropriate MIME type.

### Fetching a .html.ts File

Similarly, to fetch and execute a `.html.ts` file:

```
http://localhost:9022/tsctl/example.html.ts
```

This will execute the `example.html.ts` file and serve the output as `text/html`.

