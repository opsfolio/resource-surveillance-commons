#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys

import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import * as colors from "https://deno.land/std@0.224.0/fmt/colors.ts";

/**
 * Checks if a given file is executable.
 *
 * @param filePath - The path to the file that needs to be checked.
 * @returns A promise that resolves to `true` if the file is executable, `false` otherwise.
 */
async function isExecutable(filePath: string): Promise<boolean> {
  try {
    const fileInfo = await Deno.lstat(filePath);
    return fileInfo.mode !== null && (fileInfo.mode & 0o111) !== 0;
  } catch (error) {
    console.error(
      colors.red(
        `   Error checking if file is executable: ${error.message}`,
      ),
    );
    return false;
  }
}

/**
 * Executes an executable file and stores its output in a new file.
 * The new file's name is determined by the `getOutputFileName` function.
 *
 * @param filePath - The path to the file that needs to be executed.
 * @param getOutputFileName - A function that takes the original file path and returns the new file name.
 * @returns A promise that resolves when the file has been executed and the output has been stored.
 */
async function executeFile(
  filePath: string,
  getOutputFileName: (filePath: string) => string,
): Promise<void> {
  try {
    const outputFileName = getOutputFileName(filePath);
    const command = new Deno.Command(filePath);
    const output = await command.output();

    if (output.success) {
      await Deno.writeFile(outputFileName, output.stdout);
      console.log("✅", colors.brightGreen(`${outputFileName}`));
    } else {
      console.error(
        "❌",
        colors.red(
          `${filePath} (${new TextDecoder().decode(output.stderr)}`,
        ),
      );
    }
  } catch (error) {
    console.error("❌", colors.red(`${filePath} (${error.message})`));
  }
}

/**
 * Walks through the current directory, finds all files matching the specified pattern,
 * checks if they are executable, and if so, executes them.
 * The output of each executable file is stored in a corresponding output file whose name
 * is determined by the `getOutputFileName` function.
 *
 * If a file matches the pattern but is not executable, an error message is emitted.
 *
 * @param match - A regular expression pattern to match file names.
 * @param getOutputFileName - A function that takes the original file path and returns the new file name.
 * @returns A promise that resolves when all matching files have been processed.
 */
async function generateSqlFromExecutable(
  match: RegExp,
  getOutputFileName: (filePath: string) => string,
): Promise<void> {
  for await (
    const entry of walk(Deno.cwd(), {
      includeFiles: true,
      match: [match],
    })
  ) {
    const filePath = entry.path;
    console.log(colors.dim(`👀 ${filePath}`));

    if (await isExecutable(filePath)) {
      await executeFile(filePath, getOutputFileName);
    } else {
      console.error("⚠️ ", colors.yellow(`Not executable: ${filePath}`));
    }
  }
}

await generateSqlFromExecutable(
  /.+\.sql\..*/,
  (filePath) => filePath.replace(/\.sql\..*$/, ".auto.sql"),
);
