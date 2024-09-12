# DRH Data Transformation and EDGE UI Guide

## Overview

Welcome to the DRH Data Transformation and EDGE UI Guide! This tool allows you
to securely convert your CSV files, perform de-identification, and conduct
verification and validation (V&V) processes all within your own environment. You
can view the results directly on your local system.

### Requirements for Previewing the Edge UI:

1. **Surveilr Tool** (use latest version surveilr)
2. **Deno Runtime** (requires `deno` v1.40 or above):
   [Deno Installation Guide](https://docs.deno.com/runtime/manual/getting_started/installation/)

Installation steps may vary depending on your operating system.

## Getting Started

### Step 1: Navigate to the Folder Containing the Files

- Open the command prompt and navigate to the directory with your files.
- Command: `cd <folderpath>`
- Example: `cd D:/DRH-Files`

### Step 2: Download Surveilr

- Follow the installation instructions at the
  [Surveilr Installation Guide](https://docs.opsfolio.com/surveilr/how-to/installation-guide).
- Download latest version `surveilr` from
  [Surveilr Releases](https://github.com/opsfolio/releases.opsfolio.com/releases)
  to this folder.

### Step 3: Verify the Tool Version

- Run the command `surveilr --version` in command prompt and
  `.\surveilr --version` in powershell.
- If the tool is installed correctly, it will display the version number.

### Step 4 : Execute the commands below

1. Clear the cache by running the following command:

   ```bash
   deno cache --reload https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/service/diabetes-research-hub/drhctl.ts
   ```

2. After clearing the cache, run the single execution command:

   ```bash
   deno run -A https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/service/diabetes-research-hub/drhctl.ts 'foldername'
   ```

- Replace `foldername` with the name of your folder containing all CSV files to
  be converted.

**Example:**

```bash
deno run -A https://raw.githubusercontent.com/opsfolio/resource-surveillance-commons/main/service/diabetes-research-hub/drhctl.ts study-files
```

- Replace `foldername` with the name of your folder containing all CSV files to
  be converted.

- After the above command completes execution launch your browser and go to
  [http://localhost:9000/drh/index.sql](http://localhost:9000/drh/index.sql).

This method provides a streamlined approach to complete the process and see the
results quickly.
