#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DATA_DIR = path.resolve(process.cwd(), "data/fe-feature-map");
const LOG_PATH = path.join(DATA_DIR, "scrape-log.json");
const DEFAULT_OUTPUT = path.join(DATA_DIR, "fe-feature-adoption.md");
const DEFAULT_PUBLISHED_OUTPUT = path.resolve(
  process.cwd(),
  "static/feature-map/fe-feature-adoption.md"
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

function canonicalFeatureKey(name) {
  return normalizeWhitespace(name).toLowerCase();
}

function sortMinorKeys(minorA, minorB) {
  const [majorA, a] = minorA.split(".").map(Number);
  const [majorB, b] = minorB.split(".").map(Number);
  if (majorA !== majorB) return majorA - majorB;
  return a - b;
}

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function writeText(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

function pickPatchForMinor(minorLog) {
  const latestSeen = minorLog.latestSeenVersion;
  const patches = Object.values(minorLog.patches ?? {}).filter(
    (patch) => patch && typeof patch.version === "string"
  );

  if (patches.length === 0) {
    return null;
  }

  patches.sort((a, b) => compareVersions(b.version, a.version));

  const latestPatch = patches.find((patch) => patch.version === latestSeen);
  if (latestPatch?.dataFile) {
    return {
      displayVersion: latestSeen,
      dataVersion: latestPatch.version,
      dataFile: latestPatch.dataFile
    };
  }

  const latestScrapedPatch = patches.find((patch) => typeof patch.dataFile === "string");
  if (!latestScrapedPatch) {
    return null;
  }

  return {
    displayVersion: latestSeen ?? latestScrapedPatch.version,
    dataVersion: latestScrapedPatch.version,
    dataFile: latestScrapedPatch.dataFile
  };
}

function resolveDocLink(href, version) {
  const value = normalizeWhitespace(href);
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/#/")) return `https://ui5.sap.com/${version}${value}`;
  if (value.startsWith("#/")) return `https://ui5.sap.com/${version}/${value}`;
  if (value.startsWith("topic/")) return `https://ui5.sap.com/${version}/#/${value}`;
  if (value.startsWith("./topic/")) {
    return `https://ui5.sap.com/${version}/#/${value.replace(/^\.\//, "")}`;
  }
  return `https://ui5.sap.com/${version}/${value}`;
}

function formatLinks(links, version) {
  const seen = new Set();
  const values = [];

  for (const link of links ?? []) {
    const text = normalizeWhitespace(link?.text) || normalizeWhitespace(link?.title);
    const url = resolveDocLink(link?.href, version);
    const label = text || url || "";
    if (!label) continue;

    const rendered = url ? `[${escapeCell(label)}](${url})` : escapeCell(label);
    if (seen.has(rendered)) continue;
    seen.add(rendered);
    values.push(rendered);
  }

  return values.join("<br>");
}

function formatFloorplans(items) {
  const values = [...new Set((items ?? []).map((item) => normalizeWhitespace(item)).filter(Boolean))];
  return values.map((value) => escapeCell(value)).join("<br>");
}

async function loadVersionsFromLog(log) {
  const versions = Object.entries(log.minors ?? {})
    .sort((a, b) => sortMinorKeys(a[0], b[0]))
    .map(([minorKey, minorLog]) => {
      const selectedPatch = pickPatchForMinor(minorLog);
      if (!selectedPatch) return null;

      return {
        minorKey,
        ...selectedPatch
      };
    })
    .filter(Boolean);

  if (versions.length === 0) {
    throw new Error("No usable versions found in scrape log.");
  }

  versions.sort((a, b) => compareVersions(a.displayVersion, b.displayVersion));
  return versions;
}

async function aggregateFeatureRows(versionEntriesAsc) {
  const featureMap = new Map();
  const dataCache = new Map();
  let dataUpdatedAt = null;

  for (const entry of versionEntriesAsc) {
    const filePath = path.join(DATA_DIR, entry.dataFile);
    let parsed = dataCache.get(filePath);
    if (!parsed) {
      parsed = await readJson(filePath);
      dataCache.set(filePath, parsed);
    }
    const fetchedAt = normalizeWhitespace(parsed?.meta?.fetchedAt);
    if (fetchedAt && (!dataUpdatedAt || fetchedAt > dataUpdatedAt)) {
      dataUpdatedAt = fetchedAt;
    }

    for (const rawFeature of parsed.features ?? []) {
      const featureName = normalizeWhitespace(rawFeature.feature);
      if (!featureName) continue;

      const key = canonicalFeatureKey(featureName);
      const existing = featureMap.get(key);

      if (!existing) {
        featureMap.set(key, {
          key,
          feature: featureName,
          availableFromVersion: entry.displayVersion,
          latestSeenVersion: entry.displayVersion,
          sourceVersionForLinks: entry.displayVersion,
          supportedFloorplans: rawFeature.supportedFloorplans ?? [],
          developerDocumentation: rawFeature.relatedDocumentation ?? [],
          designGuidelines: rawFeature.uiDesignGuidelines ?? [],
          tags: rawFeature.tags ?? []
        });
        continue;
      }

      if (compareVersions(entry.displayVersion, existing.latestSeenVersion) >= 0) {
        existing.feature = featureName;
        existing.latestSeenVersion = entry.displayVersion;
        existing.sourceVersionForLinks = entry.displayVersion;
        existing.supportedFloorplans = rawFeature.supportedFloorplans ?? [];
        existing.developerDocumentation = rawFeature.relatedDocumentation ?? [];
        existing.designGuidelines = rawFeature.uiDesignGuidelines ?? [];
        existing.tags = rawFeature.tags ?? [];
      }
    }
  }

  const rows = [...featureMap.values()].sort((a, b) => {
    const versionCompare = compareVersions(b.availableFromVersion, a.availableFromVersion);
    if (versionCompare !== 0) return versionCompare;
    return a.feature.localeCompare(b.feature, "en");
  });

  return {
    rows,
    dataUpdatedAt
  };
}

function buildMarkdown(rows, versionEntriesAsc, publicPath, dataUpdatedAt) {
  const oldestVersion = versionEntriesAsc[0]?.displayVersion ?? "";
  const newestVersion = versionEntriesAsc[versionEntriesAsc.length - 1]?.displayVersion ?? "";

  const headers = [
    "Controls, UI Elements, Features",
    "Supported Floorplans",
    "Developer Documentation",
    "SAP Fiori Design Guidelines",
    "Available from Version"
  ];

  const headerLine = `| ${headers.join(" | ")} |`;
  const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;

  const tableLines = rows.map((row) => {
    return `| ${[
      escapeCell(row.feature),
      formatFloorplans(row.supportedFloorplans),
      formatLinks(row.developerDocumentation, row.sourceVersionForLinks),
      formatLinks(row.designGuidelines, row.sourceVersionForLinks),
      escapeCell(row.availableFromVersion)
    ].join(" | ")} |`;
  });

  return [
    "# SAP Fiori Elements Feature Map (From 1.84)",
    "",
    `Data updated at: ${dataUpdatedAt || "unknown"}`,
    `Versions analyzed: ${versionEntriesAsc.length} (${oldestVersion} -> ${newestVersion})`,
    "Assumption applied: once a feature appears, it is treated as available from that version onward.",
    "",
    headerLine,
    separatorLine,
    ...tableLines,
    "",
    `Published file: ${publicPath}`,
    ""
  ].join("\n");
}

async function main() {
  const outputArg = process.argv[2];
  const outputPath = outputArg ? path.resolve(process.cwd(), outputArg) : DEFAULT_OUTPUT;

  const log = await readJson(LOG_PATH);
  const versionsAsc = await loadVersionsFromLog(log);
  const { rows, dataUpdatedAt } = await aggregateFeatureRows(versionsAsc);
  const markdown = buildMarkdown(
    rows,
    versionsAsc,
    "/feature-map/fe-feature-adoption.md",
    dataUpdatedAt
  );

  await writeText(outputPath, markdown);
  await writeText(DEFAULT_PUBLISHED_OUTPUT, markdown);

  console.log(`Wrote ${outputPath}`);
  console.log(`Wrote ${DEFAULT_PUBLISHED_OUTPUT}`);
  console.log(
    `Versions: ${versionsAsc.length}, Features: ${rows.length}, Oldest: ${versionsAsc[0]?.displayVersion}, Newest: ${versionsAsc[versionsAsc.length - 1]?.displayVersion}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
