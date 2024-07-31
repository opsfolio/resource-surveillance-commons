#!/usr/bin/env -S deno run --allow-read --allow-net --allow-write --allow-env --allow-run --allow-sys

/**
 * This script, `tsserve-gen.ts`, generates a TypeScript server script `tsserve.auto.ts`
 * that serves TypeScript (.ts) and JavaScript (.js) files from a specified GitHub repository.
 *
 * The generated script uses static imports to comply with Deno Deploy's restrictions on
 * dynamic imports, ensuring that all module imports are statically analyzable.
 *
 * The server handles requests to routes under `/ts/` by dynamically importing the corresponding
 * module based on the URL path and invoking the default export, if present, to generate the response.
 *
 * This process involves:
 * 1. Walking through the repository directory to identify supported files.
 * 2. Generating static import statements in the `tsserve.auto.ts` script.
 * 3. Ensuring MIME types are correctly set for each file type.
 *
 * The resulting `tsserve.auto.ts` script is designed to be deployed on Deno Deploy, leveraging
 * its static nature to serve content efficiently and securely.
 */

import { walk } from "https://deno.land/std@0.224.0/fs/mod.ts";
import {
  basename,
  dirname,
  extname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const baseURL =
  `https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main`;

// Determine the root directory of the repository
const scriptPath = dirname(fromFileUrl(import.meta.url));
const rootDir = fromFileUrl(import.meta.resolve("../../"));

const supportedExtensions = [".ts", ".js"];
const MIME: { [key: string]: string } = {
  ".ts": "application/typescript",
  ".js": "application/javascript",
  ".html": "text/html",
  ".json": "application/json",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".xml": "application/xml",
  ".sql": "text/sql",
};

const isServable = (urlPath: string) => urlPath.endsWith(".sql");
const collected: { relativePath: string; urlPath: string; mimeType: string }[] =
  [];

// Function to generate the tsserve.ts content
async function generateTsServe() {
  let fileCases = "";

  // Walk through the directory structure starting from the rootDir
  for await (
    const entry of walk(rootDir, { includeFiles: true, followSymlinks: true })
  ) {
    // Check if the entry is a file and if the extension is supported
    if (entry.isFile && supportedExtensions.includes(extname(entry.name))) {
      // Get the relative path and URL path for the file
      const relativePath = entry.path.slice(rootDir.length).replace(/\\/g, "/");
      const urlPath = relativePath.replace(/\.ts$/, "").replace(/\.js$/, "");

      // Skip files that are not considered servable
      if (!isServable(urlPath)) continue;

      // Determine the MIME type based on the file extension
      const mimeType = MIME[extname(urlPath)] ?? "text/plain";
      collected.push({ relativePath, urlPath, mimeType });

      // Generate case statements for each file to be served
      fileCases += `
        case '${urlPath}': {
          importedModule = await import('${baseURL}/${relativePath}');
          mimeType = '${mimeType}';
          break;
        }`;
    }
  }

  // Content for the generated tsserve.ts file
  const tsServeContent = `
// generated by ${basename(fromFileUrl(import.meta.url))}. DO NOT EDIT.

// Setup the environment and globals to let imported modules know their caller
Deno.env.set(
  "SURVEILR_COMMONS_IMPORT_META",
  JSON.stringify({ importedFrom: import.meta.url }),
);

Deno.serve({ port: 9022 }, async (request) => {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith('/ts/')) {
    const path = pathname.slice(4);
    const fullUrl = \`${baseURL}/\${path}.ts\`;
    let mimeType = 'text/plain';
    let importedModule;

    try {
      switch (path) {${fileCases}
        default:
          return new Response(\`Path \${path} did not match a valid route. Valid routes: [${
    collected.map((c) => c.urlPath).join(", ")
  }]\`, { status: 404 });
      }
    } catch (error) {
      return new Response(
        \`Path \${path} (\${fullUrl}) error: \${error.message}. Please check the script content and try again.\`,
        { status: 500 }
      );
    }

    // Extract default export from the imported module, if available
    // deno-lint-ignore no-explicit-any
    const defaultService = (importedModule as any)["default"];
    let output = \`No content delivered by \${path} (\${fullUrl}), did you forget to set a default string supplier (module.default is of type \${typeof defaultService})?\`;
    if(defaultService && typeof defaultService === "function") {
        const result = defaultService();
        if(typeof result === "string") {
            output = result;
        } else {
            output = \`No content delivered by \${path} (\${fullUrl}), module.default returned type \${typeof defaultService})?\`;
        }
    }

    console.log({ path, importedModule, defaultService, fullUrl });

    return new Response(output, {
      status: 200,
      headers: { 'Content-Type': mimeType },
    });

  } else {
    return new Response('Can only handle /ts routes', { status: 404 });
  }
});
`;

  // Write the generated tsserve.ts to the same directory as tsserve-gen.ts,
  // this will be the app server in Deno Deploy
  const outputFilePath = join(scriptPath, "tsserve.auto.ts");
  await Deno.writeTextFile(outputFilePath, tsServeContent);
  console.log(outputFilePath);
}

// Execute the generateTsServe function to create the tsserve.auto.ts script
await generateTsServe();