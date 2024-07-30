#!/usr/bin/env -S deno run --allow-read --allow-net --allow-write --allow-env --allow-run --allow-sys
import { Buffer } from "https://deno.land/std@0.224.0/io/buffer.ts";
import { fromFileUrl } from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

declare global {
  // deno-lint-ignore no-var
  var importedFromTsctl: boolean;
}

// Setup the environment and globals to let imported modules know their caller
globalThis.importedFromTsctl = true;
Deno.env.set(
  "DENO_IMPORT_META",
  JSON.stringify({ importedFrom: import.meta.url }),
);

const DEFAULT_MOUNT_ENDPOINT = "/tsctl";
const DEFAULT_PORT = 9022;

enum ServerProfile {
  SANDBOX = "SANDBOX",
  TEST = "TEST",
  PRODUCTION = "PRODUCTION",
}

enum ImportStrategy {
  DIRECT = "IMPORT_DIRECTLY",
  PROXY = "IMPORT_PROXY_DATAURL",
}

// Base types for file extensions
type BaseExtension = "sql" | "html" | "json" | "md" | "txt" | "csv" | "xml";

// Template literal type for nature supporting up to two extensions
type Nature = `.${BaseExtension}` | `.${BaseExtension}.${BaseExtension}`;

/**
 * Represents the MIME type details for a specific nature.
 */
interface MimeTypeDetail<Nature extends string> {
  mime: string;
  onEmpty: (rawUrl: string, nature: Nature) => string;
}

type MimeTypeConfig = {
  [key in Nature]?: MimeTypeDetail<Nature>;
};

const MIME_TYPES: MimeTypeConfig = {
  ".txt": {
    mime: "text/plain",
    onEmpty: (rawUrl, nature) =>
      `no content delivered by ${rawUrl} for ${nature}, did you forget to check globalThis.importedFromTsctl?`,
  },
  ".csv": {
    mime: "text/csv",
    onEmpty: (rawUrl, nature) =>
      `no content delivered by ${rawUrl} for ${nature}, did you forget to check globalThis.importedFromTsctl?`,
  },
  ".sql": {
    mime: "application/sql",
    onEmpty: (rawUrl, nature) =>
      `-- no content delivered by ${rawUrl} for ${nature}, did you forget to check globalThis.importedFromTsctl?`,
  },
  ".html": {
    mime: "text/html",
    onEmpty: (rawUrl, nature) =>
      `<!-- no content delivered by ${rawUrl} for ${nature}, did you forget to check globalThis.importedFromTsctl? -->`,
  },
  ".xml": {
    mime: "application/xml",
    onEmpty: (rawUrl, nature) =>
      `<!-- no content delivered by ${rawUrl} for ${nature}, did you forget to check globalThis.importedFromTsctl? -->`,
  },
  ".json": {
    mime: "application/json",
    onEmpty: (rawUrl, nature) =>
      JSON.stringify({
        error:
          `no content delivered by ${rawUrl} for ${nature}, did you forget to check globalThis.importedFromTsctl?`,
      }),
  },
  ".md": {
    mime: "text/markdown",
    onEmpty: (rawUrl, nature) =>
      `no content delivered by ${rawUrl} for ${nature}, did you forget to check globalThis.importedFromTsctl?`,
  },
  ".md.html": {
    mime: "text/html",
    onEmpty: (rawUrl, nature) =>
      `<!-- no content delivered by ${rawUrl} for ${nature}, did you forget to check globalThis.importedFromTsctl? -->`,
  },
  // Add more mappings as needed
};

/**
 * Handles the incoming request by fetching and executing the corresponding TypeScript file.
 * @param req - The HTTP request object.
 * @param mimeTypeMappings - Mappings of nature to MIME type details.
 * @param importStrategy - Strategy for importing the TypeScript module.
 * @param baseUrl - The base URL for fetching TypeScript files.
 * @returns A Response object with the output of the executed file.
 */
async function handler(
  req: Request,
  mimeTypeMappings: MimeTypeConfig,
  importStrategy: ImportStrategy,
  baseUrl: string,
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(DEFAULT_MOUNT_ENDPOINT, "");

  if (!path) {
    return new Response(
      "Path not specified. Please provide a valid file path in the URL after /tsctl/. For example, /tsctl/example.sql.ts",
      { status: 400 },
    );
  }

  // Split the path into segments and determine the nature and filename
  const segments = path.split("/");
  const filename = segments.pop() ?? "";

  // Extract the nature from the filename by removing the last .ts extension
  const natureMatch = filename.match(/(\..+?)\.ts$/);
  const nature = natureMatch ? natureMatch[1] : "unknown";

  const rawUrl = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const mimeTypeConfig = mimeTypeMappings[nature as Nature] || {
    mime: "text/plain",
    onEmpty: (rawUrl, nature) =>
      `// no content delivered by ${rawUrl} for ${nature}, did you forget to check globalThis.importedFromTsctl?`,
  };

  try {
    let moduleImportUrl: string;

    if (importStrategy === ImportStrategy.DIRECT) {
      // Directly use the raw URL
      moduleImportUrl = rawUrl;
    } else {
      // Fetch the content from the repository and use Data URL
      const response = await fetch(rawUrl);
      if (!response.ok) {
        return new Response(
          `Error fetching file: ${response.statusText}. The file may not exist or the URL might be incorrect. Please verify the path: ${rawUrl}`,
          { status: response.status },
        );
      }

      const scriptContent = await response.text();
      moduleImportUrl = `data:application/typescript;base64,${
        btoa(scriptContent)
      }`;
    }

    // Capture console output
    const stdoutBuffer = new Buffer();
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      stdoutBuffer.write(new TextEncoder().encode(args.join(" ") + "\n"));
    };

    const reload = async () => {
      await import(moduleImportUrl + `?${Date.now()}`);
    };

    try {
      await reload();
    } finally {
      console.log = originalConsoleLog;
    }

    let output = new TextDecoder().decode(stdoutBuffer.bytes());

    // Check if the output is empty and use the onEmpty message if it is
    if (!output.trim()) {
      output = mimeTypeConfig.onEmpty(rawUrl, nature as Nature);
    }

    return new Response(output, {
      status: 200,
      headers: {
        "Content-Type": mimeTypeConfig.mime,
      },
    });
  } catch (error) {
    return new Response(
      `Error: ${error.message}. This might be due to a problem with the script or an issue executing it. Please check the script content and try again.`,
      { status: 500 },
    );
  }
}

await new Command()
  .globalType("ImportStrategy", new EnumType(ImportStrategy))
  .globalType("ServerProfile", new EnumType(ServerProfile))
  .name("tsctl")
  .version("1.0.0")
  .description(
    "A TypeScript Controller to execute .ts files from a GitHub repository.",
  )
  .command("serve", "Serve via HTTP")
  .option(
    "-M, --mount-endpoint <endpoint:string>",
    "The mount endpoint to serve from.",
    { default: DEFAULT_MOUNT_ENDPOINT },
  )
  .option("-p, --port <port:number>", "Port to run the server on.", {
    default: DEFAULT_PORT,
  })
  .option(
    "--base-url <url:string>",
    "Base URL for fetching TypeScript files.",
    {
      default:
        "https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main",
    },
  )
  .option(
    "--import-strategy <strategy:ImportStrategy>",
    "How to import the TypeScript module for execution",
    { default: ImportStrategy.DIRECT },
  )
  .option(
    "--profile <profile:ServerProfile>",
    "Server profile (sandbox, test, production, etc.)",
    { default: ServerProfile.PRODUCTION },
  )
  .action(({ port, mountEndpoint, importStrategy, baseUrl, profile }) => {
    console.log(`Starting server at http://localhost:${port}${mountEndpoint}`);
    const resolvedBaseUrl = profile === ServerProfile.SANDBOX
      ? fromFileUrl(import.meta.resolve("../.."))
      : baseUrl;
    Deno.serve(
      { port },
      (req) => handler(req, MIME_TYPES, importStrategy, resolvedBaseUrl),
    );
  })
  .parse(Deno.args.length > 0 ? Deno.args : ["serve"]);
