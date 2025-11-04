/*
 * Copyright 2025 Markup AI
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Script to check and add license headers at the top of all source files.
 *
 * Recursively scans source files and verifies they start with the required license header.
 * Use the "check" command to verify license headers or the "fix" command to automatically add
 * missing license headers. Supports optional configuration via a .license-header.json file and
 * automatically detects the author from the package.json file.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

/**
 * User-provided configuration for license header checking.
 * All fields are optional and will be merged with defaults.
 * @see DEFAULT_LICENSE_HEADER_CONFIG for default values
 */
interface UserLicenseHeaderConfig {
  /**
   * Copyright holder name.
   */
  author?: string;

  /**
   * File extensions of files to process for license headers.
   */
  fileExtensions?: readonly string[];

  /**
   * License header template with optional year placeholder.
   * The year placeholder will be replaced with the current year when adding headers.
   * @see YEAR_PLACEHOLDER
   */
  headerTemplate?: string;

  /**
   * Directory names to ignore when scanning for source files.
   */
  ignoreDirectories?: readonly string[];
}

/**
 * Resolved configuration for license header checking.
 * All fields are required after merging with defaults.
 */
type LicenseHeaderConfig = Required<UserLicenseHeaderConfig>;

const DEFAULT_CONFIG_FILE_NAME: string = ".license-header.json";
const PACKAGE_JSON_FILE_NAME: string = "package.json";

/**
 * Year placeholder string to use in custom header templates.
 * This will be replaced with the current year when adding headers.
 * @example "Copyright __YEAR__ __AUTHOR__"
 */
export const YEAR_PLACEHOLDER: string = "__YEAR__";

/**
 * Author placeholder string to use in custom header templates.
 * This will be replaced with the actual author name.
 * @example "Copyright __YEAR__ __AUTHOR__"
 */
export const AUTHOR_PLACEHOLDER: string = "__AUTHOR__";

const DEFAULT_LICENSE_HEADER_CONFIG: LicenseHeaderConfig = {
  author: "Unknown Author",
  fileExtensions: [".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"],
  headerTemplate: `/*
 * Copyright ${YEAR_PLACEHOLDER} ${AUTHOR_PLACEHOLDER}
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
`,
  ignoreDirectories: [".git", "coverage", "dist", "node_modules"],
};

function addLicenseHeaders(licenseHeaderConfig: LicenseHeaderConfig): void {
  const filesWithoutLicenseHeaders: string[] = findFilesWithoutLicenseHeaders(licenseHeaderConfig);

  if (filesWithoutLicenseHeaders.length === 0) {
    console.log("All source files have a license header");
    return;
  }

  const currentYear: number = new Date().getFullYear();
  const licenseHeader: string = licenseHeaderConfig.headerTemplate
    .replaceAll(YEAR_PLACEHOLDER, currentYear.toString())
    .replaceAll(AUTHOR_PLACEHOLDER, licenseHeaderConfig.author);

  for (const filePath of filesWithoutLicenseHeaders) {
    const currentFileContent: string = readFileSync(filePath, "utf8");
    const updatedFileContent: string = licenseHeader + "\n" + currentFileContent;
    writeFileSync(filePath, updatedFileContent, "utf8");
    console.log(`Added license header to file: ${filePath}`);
  }
}

function checkLicenseHeaders(licenseHeaderConfig: LicenseHeaderConfig): number {
  const filesWithoutLicenseHeaders: string[] = findFilesWithoutLicenseHeaders(licenseHeaderConfig);

  if (filesWithoutLicenseHeaders.length === 0) {
    console.log("All source files have a license header");
    return 0;
  }

  console.error(`Missing license headers in ${filesWithoutLicenseHeaders.length} file(s):`);

  for (const filePath of filesWithoutLicenseHeaders) {
    console.error(`  ${filePath}`);
  }

  return 1;
}

function createLicenseRegExp(headerTemplate: string): RegExp {
  const escapedHeaderTemplate: string = escapeRegExp(headerTemplate);
  const patternWithYear: string = escapedHeaderTemplate.replaceAll(
    YEAR_PLACEHOLDER,
    String.raw`20(2[5-9]|[3-9]\d)`,
  );
  const pattern: string = patternWithYear.replaceAll(AUTHOR_PLACEHOLDER, String.raw`[^\n]+`);
  return new RegExp("^" + pattern);
}

/**
 * Escapes all regex special characters in a string and returns a new string.
 *
 * Note: Replace with native RegExp.escape() function once upgraded to Node.js 24+
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
 */
function escapeRegExp(string: string): string {
  return string.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function extractAuthorFromPackageJson(packageJson: {
  author?: string | { name?: string };
}): string | undefined {
  if (!packageJson.author) {
    return undefined;
  }

  // npm allows author to be either a string or an object
  if (typeof packageJson.author === "string") {
    return packageJson.author;
  }

  return packageJson.author.name;
}

function findFilesRecursively(
  directoryPath: string,
  fileExtensions: readonly string[],
  ignoredDirectories: ReadonlySet<string>,
  filePaths: string[] = [],
): string[] {
  for (const entryName of readdirSync(directoryPath)) {
    if (directoryPath === "." && ignoredDirectories.has(entryName)) {
      continue;
    }

    const fullPath: string = join(directoryPath, entryName);

    if (statSync(fullPath).isDirectory()) {
      findFilesRecursively(fullPath, fileExtensions, ignoredDirectories, filePaths);
    } else if (fileExtensions.some((extension: string) => fullPath.endsWith(extension))) {
      filePaths.push(fullPath);
    }
  }

  return filePaths;
}

function findFilesWithoutLicenseHeaders(licenseHeaderConfig: LicenseHeaderConfig): string[] {
  const licenseRegExp: RegExp = createLicenseRegExp(licenseHeaderConfig.headerTemplate);
  const fileExtensions: readonly string[] = licenseHeaderConfig.fileExtensions;
  const ignoredDirectories: ReadonlySet<string> = new Set(licenseHeaderConfig.ignoreDirectories);

  return findFilesRecursively(".", fileExtensions, ignoredDirectories).filter(
    (filePath: string) => {
      const fileContent: string = readFileSync(filePath, "utf8");
      return !licenseRegExp.test(fileContent);
    },
  );
}

/**
 * Checks if a string is empty or contains only whitespace.
 */
function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function loadLicenseHeaderConfig(configFilePath: string): LicenseHeaderConfig {
  const userLicenseHeaderConfig: UserLicenseHeaderConfig = existsSync(configFilePath)
    ? JSON.parse(readFileSync(configFilePath, "utf8"))
    : {};

  validateUserLicenseHeaderConfig(userLicenseHeaderConfig);

  const author: string =
    userLicenseHeaderConfig.author ??
    readAuthorFromPackageJson() ??
    DEFAULT_LICENSE_HEADER_CONFIG.author;
  const fileExtensions: readonly string[] =
    userLicenseHeaderConfig.fileExtensions ?? DEFAULT_LICENSE_HEADER_CONFIG.fileExtensions;
  const headerTemplate: string =
    userLicenseHeaderConfig.headerTemplate ?? DEFAULT_LICENSE_HEADER_CONFIG.headerTemplate;
  const ignoreDirectories: readonly string[] =
    userLicenseHeaderConfig.ignoreDirectories ?? DEFAULT_LICENSE_HEADER_CONFIG.ignoreDirectories;

  return {
    author,
    fileExtensions,
    headerTemplate,
    ignoreDirectories,
  };
}

function loadResolvedConfig(): LicenseHeaderConfig {
  const configFilePath: string = resolveConfigFilePath();
  return loadLicenseHeaderConfig(configFilePath);
}

function printUsage(): void {
  console.error(`Usage: ${basename(process.argv[1])} <check|fix> [--config <file>]`);
}

function readAuthorFromPackageJson(): string | undefined {
  if (!existsSync(PACKAGE_JSON_FILE_NAME)) {
    return undefined;
  }

  const packageJsonContent: string = readFileSync(PACKAGE_JSON_FILE_NAME, "utf8");
  const packageJson: { author?: string | { name?: string } } = JSON.parse(packageJsonContent);

  return extractAuthorFromPackageJson(packageJson);
}

function resolveConfigFilePath(): string {
  const configFlagIndex: number = process.argv.indexOf("--config");
  const hasConfigValue: boolean =
    configFlagIndex !== -1 && configFlagIndex + 1 < process.argv.length;

  return hasConfigValue ? process.argv[configFlagIndex + 1] : DEFAULT_CONFIG_FILE_NAME;
}

function validateFileExtensions(fileExtensions: readonly string[] | undefined): void {
  if (fileExtensions !== undefined) {
    if (fileExtensions.length === 0) {
      throw new Error("Invalid configuration: fileExtensions array must not be empty");
    }

    // Validate that file extensions start with a dot
    for (const fileExtension of fileExtensions) {
      if (!fileExtension.startsWith(".")) {
        throw new Error(
          `Invalid configuration: file extension "${fileExtension}" must start with a dot`,
        );
      }
    }
  }
}

function validateUserLicenseHeaderConfig(userLicenseHeaderConfig: UserLicenseHeaderConfig): void {
  validateFileExtensions(userLicenseHeaderConfig.fileExtensions);
  validateNotBlank(userLicenseHeaderConfig.headerTemplate, "headerTemplate");
  validateNotBlank(userLicenseHeaderConfig.author, "author");
}

function validateNotBlank(value: string | undefined, fieldName: string): void {
  if (value !== undefined && isBlank(value)) {
    throw new Error(`Invalid configuration: ${fieldName} string must not be empty`);
  }
}

function main(): number {
  const command: string | undefined = process.argv[2];

  switch (command) {
    case "check":
      return checkLicenseHeaders(loadResolvedConfig());
    case "fix":
      addLicenseHeaders(loadResolvedConfig());
      return 0;
    case undefined:
      console.error("No command provided");
      printUsage();
      return 1;
    default:
      console.error(`Unknown command: "${command}"`);
      printUsage();
      return 1;
  }
}

process.exit(main());
