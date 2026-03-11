#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DATA_DIR = path.resolve(process.cwd(), "data/fe-feature-map");
const LOG_PATH = path.join(DATA_DIR, "scrape-log.json");
const DEFAULT_INPUT = path.join(DATA_DIR, "fe-feature-adoption.md");
const DEFAULT_OUTPUT = path.join(DATA_DIR, "fe-feature-matrix.md");
const DEFAULT_PUBLISHED_OUTPUT = path.resolve(
  process.cwd(),
  "static/feature-map/fe-feature-matrix.md"
);

function normalizeWhitespace(text) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid version string: "${version}"`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function compareVersions(a, b) {
  const va = typeof a === "string" ? parseVersion(a) : a;
  const vb = typeof b === "string" ? parseVersion(b) : b;
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

function sortMinorKeys(minorA, minorB) {
  const [majorA, a] = minorA.split(".").map(Number);
  const [majorB, b] = minorB.split(".").map(Number);
  if (majorA !== majorB) return majorA - majorB;
  return a - b;
}

function parseMarkdownTableRow(line) {
  const trimmed = (line ?? "").trim();
  if (!trimmed.startsWith("|")) return null;

  const content = trimmed.endsWith("|") ? trimmed.slice(1, -1) : trimmed.slice(1);
  const cells = [];
  let current = "";
  let escaping = false;

  for (const char of content) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === "\\") {
      escaping = true;
      continue;
    }
    if (char === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (escaping) current += "\\";
  cells.push(current.trim());
  return cells;
}

function isSeparatorRow(cells) {
  return (cells ?? []).every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function extractFirstMarkdownTable(markdown) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  let headerIndex = -1;

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().startsWith("|")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex < 0) {
    throw new Error("No markdown table found in input file.");
  }

  const header = parseMarkdownTableRow(lines[headerIndex]);
  const separator = parseMarkdownTableRow(lines[headerIndex + 1] ?? "");
  if (!header || !separator || !isSeparatorRow(separator)) {
    throw new Error("Invalid markdown table format.");
  }

  const rows = [];
  for (let i = headerIndex + 2; i < lines.length; i += 1) {
    if (!lines[i].trim().startsWith("|")) break;
    const parsed = parseMarkdownTableRow(lines[i]);
    if (parsed) rows.push(parsed);
  }

  return { header, rows };
}

function pickPatchForMinor(minorLog) {
  const latestSeen = minorLog.latestSeenVersion;
  const patches = Object.values(minorLog.patches ?? {}).filter(
    (patch) => patch && typeof patch.version === "string"
  );
  if (patches.length === 0) return null;

  patches.sort((a, b) => compareVersions(b.version, a.version));
  const latestPatch = patches.find((patch) => patch.version === latestSeen);
  if (latestPatch) {
    return { displayVersion: latestSeen };
  }

  return { displayVersion: patches[0].version };
}

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function writeText(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

function extractDataUpdatedAt(markdown) {
  const match = String(markdown ?? "").match(/^Data updated at:\s*(.+)$/m);
  if (!match) return null;
  return normalizeWhitespace(match[1]);
}

function loadVersionsFromLog(log) {
  const versions = Object.entries(log.minors ?? {})
    .sort((a, b) => sortMinorKeys(a[0], b[0]))
    .map(([, minorLog]) => pickPatchForMinor(minorLog))
    .filter(Boolean)
    .map((entry) => entry.displayVersion);

  const deduped = [...new Set(versions)];
  deduped.sort((a, b) => compareVersions(b, a)); // newest -> oldest
  return deduped;
}

function buildRowsFromAdoptionTable(table, versionsDesc) {
  const featureIndex = table.header.indexOf("Controls, UI Elements, Features");
  const availableFromIndex = table.header.indexOf("Available from Version");
  if (featureIndex < 0 || availableFromIndex < 0) {
    throw new Error(
      'Required columns not found in adoption markdown: "Controls, UI Elements, Features", "Available from Version"'
    );
  }

  const rows = table.rows
    .map((cells) => {
      const feature = normalizeWhitespace(cells[featureIndex] ?? "");
      const availableFromVersion = normalizeWhitespace(cells[availableFromIndex] ?? "");
      if (!feature || !availableFromVersion) return null;

      const availability = versionsDesc.map((version) =>
        compareVersions(version, availableFromVersion) >= 0 ? "✅" : "❌"
      );
      const adoptionCount = availability.filter((value) => value === "✅").length;

      return {
        feature,
        availableFromVersion,
        availability,
        adoptionCount
      };
    })
    .filter(Boolean);

  rows.sort((a, b) => {
    const versionOrder = compareVersions(b.availableFromVersion, a.availableFromVersion);
    if (versionOrder !== 0) return versionOrder;
    if (a.adoptionCount !== b.adoptionCount) return a.adoptionCount - b.adoptionCount;
    return a.feature.localeCompare(b.feature, "en");
  });

  return rows;
}

function buildMatrixMarkdown(rows, versionsDesc, outputPath, dataUpdatedAt) {
  const headers = ["Feature", ...versionsDesc, "Available from Version", "Adoption"];

  const headerLine = `| ${headers.join(" | ")} |`;
  const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const totalVersions = versionsDesc.length;

  const tableLines = rows.map((row) => {
    return `| ${[
      escapeCell(row.feature),
      ...row.availability,
      row.availableFromVersion,
      `${row.adoptionCount}/${totalVersions}`
    ].join(" | ")} |`;
  });

  const oldest = versionsDesc[versionsDesc.length - 1] ?? "";
  const newest = versionsDesc[0] ?? "";

  return [
    "# SAP Fiori Elements Feature Matrix",
    "",
    `Data updated at: ${dataUpdatedAt || "unknown"}`,
    `Versions: ${versionsDesc.length} (left newest: ${newest}, right oldest: ${oldest})`,
    "Legend: ✅ available, ❌ not available",
    "Assumption: once a feature appears, it is treated as available from that version onward.",
    "",
    headerLine,
    separatorLine,
    ...tableLines,
    "",
    `Output file: ${outputPath}`,
    ""
  ].join("\n");
}

async function main() {
  const inputPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : DEFAULT_INPUT;
  const outputPath = process.argv[3]
    ? path.resolve(process.cwd(), process.argv[3])
    : DEFAULT_OUTPUT;

  const [log, adoptionMarkdown] = await Promise.all([readJson(LOG_PATH), readText(inputPath)]);
  const versionsDesc = loadVersionsFromLog(log);
  if (versionsDesc.length === 0) {
    throw new Error("No versions found in scrape-log.json");
  }

  const adoptionTable = extractFirstMarkdownTable(adoptionMarkdown);
  const matrixRows = buildRowsFromAdoptionTable(adoptionTable, versionsDesc);
  const dataUpdatedAt = extractDataUpdatedAt(adoptionMarkdown);
  const markdown = buildMatrixMarkdown(matrixRows, versionsDesc, outputPath, dataUpdatedAt);

  await writeText(outputPath, markdown);
  await writeText(DEFAULT_PUBLISHED_OUTPUT, markdown);

  console.log(`Wrote ${outputPath}`);
  console.log(`Wrote ${DEFAULT_PUBLISHED_OUTPUT}`);
  console.log(`Rows: ${matrixRows.length}, Versions: ${versionsDesc.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
