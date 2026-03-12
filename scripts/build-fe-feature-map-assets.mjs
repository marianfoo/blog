#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const COLUMNS = [
  "Controls, UI Elements, Features",
  "Supported Floorplans",
  "Developer Documentation",
  "SAP Fiori Design Guidelines",
  "Available from Version"
];

const DATA_DIR = path.resolve(process.cwd(), "data/fe-feature-map");
const STATIC_DIR = path.resolve(process.cwd(), "static/feature-map");
const LOG_PATH = path.join(DATA_DIR, "scrape-log.json");
const ADOPTION_DATA_PATH = path.join(DATA_DIR, "fe-feature-adoption.json");
const STATIC_DATA_PATH = path.join(STATIC_DIR, "fe-feature-adoption.json");
const STATIC_CSV_PATH = path.join(STATIC_DIR, "fe-feature-adoption.csv");
const STATIC_FRAGMENT_PATH = path.join(STATIC_DIR, "fe-feature-adoption.fragment.html");
const STATIC_CSS_PATH = path.join(STATIC_DIR, "fe-feature-adoption.css");
const STATIC_JS_PATH = path.join(STATIC_DIR, "fe-feature-adoption.js");

function normalizeWhitespace(value) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeFeatureName(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version ?? ""));
  if (!match) return { major: 0, minor: 0, patch: 0 };
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

function compareMinorKeys(a, b) {
  const [majorA, minorA] = String(a).split(".").map(Number);
  const [majorB, minorB] = String(b).split(".").map(Number);
  if (majorA !== majorB) return majorA - majorB;
  return minorA - minorB;
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

function dedupeStrings(values) {
  const seen = new Set();
  const output = [];
  for (const value of values ?? []) {
    const normalized = normalizeWhitespace(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
  }
  return output;
}

function resolveUrl(href, sourceUrl) {
  const normalized = normalizeWhitespace(href);
  if (!normalized) return null;

  // Already absolute
  if (/^https?:\/\//i.test(normalized)) return normalized;

  // SAP UI5 SDK uses a hash-based SPA router (#/topic/<id>).
  // Raw hrefs scraped from the HTML are relative to the page path
  // (e.g. "topic/<id>"), but must be resolved against the /#/ route,
  // not the filesystem path. Applying the same rules used in
  // generate-feature-adoption-markdown.mjs::resolveDocLink.
  const versionMatch = /^https?:\/\/ui5\.sap\.com\/([\d.]+)\//.exec(sourceUrl ?? "");
  const version = versionMatch?.[1] ?? null;

  if (version) {
    if (normalized.startsWith("/#/")) return `https://ui5.sap.com/${version}${normalized}`;
    if (normalized.startsWith("#/")) return `https://ui5.sap.com/${version}/${normalized}`;
    if (normalized.startsWith("./topic/")) {
      return `https://ui5.sap.com/${version}/#/${normalized.replace(/^\.\//, "")}`;
    }
    if (normalized.startsWith("topic/")) return `https://ui5.sap.com/${version}/#/${normalized}`;
  }

  // Fallback for any other relative URL patterns
  try {
    return new URL(normalized, sourceUrl).toString();
  } catch {
    return null;
  }
}

function normalizeLinks(links, sourceUrl) {
  const seen = new Set();
  const output = [];

  for (const link of links ?? []) {
    const label = normalizeWhitespace(link?.text ?? link?.title ?? link?.href ?? "");
    const url = resolveUrl(link?.href ?? "", sourceUrl);
    if (!label && !url) continue;

    const key = `${label.toLowerCase()}|${url ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    output.push({
      label: label || url,
      url
    });
  }

  return output;
}

async function selectSnapshotForMinor(minorKey, minorLog) {
  const patchCandidates = Object.values(minorLog?.patches ?? {})
    .filter((patch) => patch && patch.scraped && typeof patch.dataFile === "string")
    .sort((a, b) => compareVersions(b.version, a.version));

  for (const patch of patchCandidates) {
    const filePath = path.join(DATA_DIR, patch.dataFile);
    if (!(await exists(filePath))) continue;

    const parsed = await readJson(filePath);
    return {
      minorKey,
      fullVersion: patch.version,
      dataFile: patch.dataFile,
      filePath,
      parsed
    };
  }

  return null;
}

async function loadSnapshots(log) {
  const selected = [];

  for (const [minorKey, minorLog] of Object.entries(log.minors ?? {}).sort((a, b) =>
    compareMinorKeys(a[0], b[0])
  )) {
    const snapshot = await selectSnapshotForMinor(minorKey, minorLog);
    if (snapshot) selected.push(snapshot);
  }

  if (selected.length === 0) {
    throw new Error("No scraped snapshot files found. Run npm run feature-map:scrape first.");
  }

  selected.sort((a, b) => compareVersions(a.fullVersion, b.fullVersion));
  return selected;
}

function mergeRows(snapshots) {
  const byFeature = new Map();

  for (const snapshot of snapshots) {
    const sourceUrl = snapshot.parsed?.meta?.sourceUrl ?? null;
    const version = snapshot.fullVersion;
    const features = snapshot.parsed?.features ?? [];

    for (const featureRow of features) {
      const featureName = normalizeWhitespace(featureRow?.feature ?? "");
      if (!featureName) continue;

      const key = normalizeFeatureName(featureName);
      const floorplans = dedupeStrings(featureRow?.supportedFloorplans ?? []);
      const docsLinks = normalizeLinks(featureRow?.relatedDocumentation ?? [], sourceUrl);
      const guidelinesLinks = normalizeLinks(featureRow?.uiDesignGuidelines ?? [], sourceUrl);
      const docsText = normalizeWhitespace(featureRow?.relatedDocumentationText ?? "") || null;
      const guidelinesText =
        normalizeWhitespace(featureRow?.uiDesignGuidelinesText ?? "") || null;

      const existing = byFeature.get(key);
      if (!existing) {
        byFeature.set(key, {
          key,
          feature: featureName,
          availableFromVersion: version,
          metadataVersion: version,
          supportedFloorplans: floorplans,
          developerDocumentation: {
            links: docsLinks,
            text: docsText
          },
          sapFioriDesignGuidelines: {
            links: guidelinesLinks,
            text: guidelinesText
          }
        });
        continue;
      }

      if (compareVersions(version, existing.availableFromVersion) < 0) {
        existing.availableFromVersion = version;
      }

      if (compareVersions(version, existing.metadataVersion) >= 0) {
        existing.metadataVersion = version;
        existing.feature = featureName;
        existing.supportedFloorplans = floorplans;
        existing.developerDocumentation = {
          links: docsLinks,
          text: docsText
        };
        existing.sapFioriDesignGuidelines = {
          links: guidelinesLinks,
          text: guidelinesText
        };
      }
    }
  }

  const rows = [...byFeature.values()]
    .map((row) => ({
      feature: row.feature,
      normalizedFeature: row.key,
      supportedFloorplans: row.supportedFloorplans,
      developerDocumentation: row.developerDocumentation,
      sapFioriDesignGuidelines: row.sapFioriDesignGuidelines,
      availableFromVersion: row.availableFromVersion
    }))
    .sort((a, b) => {
      const byVersion = compareVersions(b.availableFromVersion, a.availableFromVersion);
      if (byVersion !== 0) return byVersion;
      return a.feature.localeCompare(b.feature, "en", { sensitivity: "base" });
    });

  return rows;
}

function getLatestSnapshotFetchedAt(snapshots) {
  let latest = null;

  for (const snapshot of snapshots ?? []) {
    const fetchedAt = normalizeWhitespace(snapshot?.parsed?.meta?.fetchedAt);
    if (fetchedAt && (!latest || fetchedAt > latest)) {
      latest = fetchedAt;
    }
  }

  return latest;
}

function escapeCsv(value) {
  const s = String(value ?? "").replace(/"/g, '""');
  if (/[,\r\n"]/.test(s)) return `"${s}"`;
  return s;
}

function buildCsv(rows) {
  const headers = [
    "Controls, UI Elements, Features",
    "Supported Floorplans",
    "Developer Documentation",
    "SAP Fiori Design Guidelines",
    "Available from Version"
  ];

  const headerLine = headers.map(escapeCsv).join(",");

  const dataLines = rows.map((row) => {
    const floorplans = (row.supportedFloorplans ?? []).join("; ");
    const docsText = (row.developerDocumentation?.links ?? [])
      .map((l) => l?.label ?? l?.url ?? "")
      .filter(Boolean)
      .join("; ");
    const guidelinesText = (row.sapFioriDesignGuidelines?.links ?? [])
      .map((l) => l?.label ?? l?.url ?? "")
      .filter(Boolean)
      .join("; ");
    const version = row.availableFromVersion ?? "";

    return [
      escapeCsv(row.feature),
      escapeCsv(floorplans),
      escapeCsv(docsText),
      escapeCsv(guidelinesText),
      escapeCsv(version)
    ].join(",");
  });

  return [headerLine, ...dataLines].join("\n");
}

function buildAdoptionData(snapshots, rows) {
  return {
    meta: {
      generatedAt: getLatestSnapshotFetchedAt(snapshots),
      rowCount: rows.length,
      columns: COLUMNS,
      sourceSnapshots: snapshots.map((snapshot) => ({
        minorKey: snapshot.minorKey,
        fullVersion: snapshot.fullVersion,
        dataFile: snapshot.dataFile,
        sourceUrl: snapshot.parsed?.meta?.sourceUrl ?? null,
        rowCount: snapshot.parsed?.meta?.rowCount ?? 0
      }))
    },
    rows
  };
}

function buildFragment() {
  return `<section class="fe-feature-map" data-fe-feature-map data-json-url="/feature-map/fe-feature-adoption.json">
  <h2 class="fe-feature-map__title">SAP Fiori Elements Feature Map</h2>
  <p class="fe-feature-map__meta">Data updated: <span data-role="generated-at">-</span></p>

  <div class="fe-feature-map__toolbar" role="group" aria-label="Feature map filters">
    <label class="fe-feature-map__toolbar-label">
      Full text search
      <input type="search" data-role="global-search" placeholder="Search all columns">
    </label>

    <div class="fe-feature-map__floorplan-filter" data-role="floorplan-filter">
      <button type="button" class="fe-feature-map__button" data-role="floorplan-toggle" aria-expanded="false" aria-haspopup="true">
        Floorplans: All
      </button>
      <div class="fe-feature-map__floorplan-menu" data-role="floorplan-menu" hidden>
        <div class="fe-feature-map__menu-actions">
          <button type="button" class="fe-feature-map__button" data-role="floorplan-select-all">Select all</button>
          <button type="button" class="fe-feature-map__button" data-role="floorplan-clear">Clear</button>
        </div>
        <div class="fe-feature-map__floorplan-options" data-role="floorplan-options"></div>
      </div>
    </div>

    <button type="button" class="fe-feature-map__button" data-role="clear-filters">Clear Filters</button>
    <span class="fe-feature-map__count" data-role="result-count">0 / 0 rows</span>
  </div>

  <div class="fe-feature-map__table-wrap">
    <table class="fe-feature-map__table" data-role="table">
      <caption>Feature availability and references across SAPUI5 versions</caption>
      <thead>
        <tr data-role="header-row"></tr>
        <tr class="fe-feature-map__filter-row" data-role="filter-row"></tr>
      </thead>
      <tbody data-role="table-body"></tbody>
    </table>
  </div>

  <p class="fe-feature-map__status" data-role="status" aria-live="polite"></p>

  <noscript>
    <p>This table needs JavaScript for search, filters, and sorting.</p>
  </noscript>
</section>
`;
}

function buildCss() {
  return `.fe-feature-map {
  --fe-map-bg: #f4f7fb;
  --fe-map-panel: #ffffff;
  --fe-map-panel-muted: #f6f9ff;
  --fe-map-text: #1f2937;
  --fe-map-muted: #4b5563;
  --fe-map-border: #c6d0df;
  --fe-map-brand: #0a6ed1;
  --fe-map-header: #dbe9fb;
  --fe-map-filter-header: #eef5ff;
  --fe-map-button-bg: #f8fafc;
  --fe-map-link: #0b63bd;
  --fe-map-link-hover: #084d93;
  --fe-map-input-bg: #ffffff;
  --fe-map-input-text: #111827;
  --fe-map-danger: #b42318;
  --fe-map-shadow: 0 10px 24px rgba(2, 8, 23, 0.16);
  color: var(--fe-map-text);
  margin: 1.5rem 0;
}

:root[data-theme="dark"] .fe-feature-map {
  --fe-map-bg: #11161f;
  --fe-map-panel: #1a2230;
  --fe-map-panel-muted: #202b3b;
  --fe-map-text: #e7edf8;
  --fe-map-muted: #b7c3d8;
  --fe-map-border: #32445d;
  --fe-map-brand: #69a9ff;
  --fe-map-header: #233043;
  --fe-map-filter-header: #27364b;
  --fe-map-button-bg: #26364a;
  --fe-map-link: #8ec5ff;
  --fe-map-link-hover: #b6d8ff;
  --fe-map-input-bg: #141d29;
  --fe-map-input-text: #e7edf8;
  --fe-map-danger: #ff9e9e;
  --fe-map-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}

.fe-feature-map__title {
  margin: 0 0 0.5rem 0;
  color: var(--fe-map-brand);
}

.fe-feature-map__meta {
  color: var(--fe-map-muted);
  font-size: 0.9rem;
  margin: 0 0 0.9rem 0;
}

.fe-feature-map__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid var(--fe-map-border);
  border-radius: 0.7rem;
  background: var(--fe-map-panel);
  padding: 0.75rem;
}

.fe-feature-map__toolbar-label {
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.fe-feature-map__toolbar-label input {
  min-width: 16rem;
}

.fe-feature-map input[type="search"] {
  border: 1px solid var(--fe-map-border);
  background: var(--fe-map-input-bg);
  color: var(--fe-map-input-text);
  border-radius: 0.45rem;
  padding: 0.42rem 0.55rem;
  font-size: 0.88rem;
}

.fe-feature-map input[type="search"]::placeholder {
  color: var(--fe-map-muted);
  opacity: 0.95;
}

.fe-feature-map__button {
  border: 1px solid var(--fe-map-border);
  border-radius: 0.45rem;
  background: var(--fe-map-button-bg);
  color: var(--fe-map-text);
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  cursor: pointer;
}

.fe-feature-map__button:hover,
.fe-feature-map__button:focus-visible {
  border-color: var(--fe-map-brand);
}

.fe-feature-map__button:focus-visible,
.fe-feature-map input[type="search"]:focus-visible,
.fe-feature-map__sort-button:focus-visible {
  outline: 2px solid var(--fe-map-brand);
  outline-offset: 1px;
}

.fe-feature-map__count {
  font-size: 0.8rem;
  color: var(--fe-map-muted);
}

.fe-feature-map__floorplan-filter {
  position: relative;
}

.fe-feature-map__floorplan-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  width: 22rem;
  max-height: 19rem;
  overflow: auto;
  background: var(--fe-map-panel);
  border: 1px solid var(--fe-map-border);
  border-radius: 0.55rem;
  box-shadow: var(--fe-map-shadow);
  padding: 0.6rem;
  z-index: 20;
}

.fe-feature-map__menu-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  border-bottom: 1px solid var(--fe-map-border);
  margin-bottom: 0.55rem;
  padding-bottom: 0.55rem;
}

.fe-feature-map__floorplan-options label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  margin-bottom: 0.35rem;
  cursor: pointer;
}

.fe-feature-map__table-wrap {
  margin-top: 0.8rem;
  border: 1px solid var(--fe-map-border);
  border-radius: 0.7rem;
  overflow: visible;
  max-height: none;
  background: var(--fe-map-bg);
}

.fe-feature-map__table {
  border-collapse: collapse;
  width: 100%;
  min-width: 0;
  table-layout: fixed;
  font-size: 0.84rem;
  line-height: 1.32;
}

.fe-feature-map__table caption {
  text-align: left;
  font-size: 0.8rem;
  color: var(--fe-map-muted);
  padding: 0.55rem 0.7rem;
  background: var(--fe-map-panel-muted);
  border-bottom: 1px solid var(--fe-map-border);
}

.fe-feature-map__table th,
.fe-feature-map__table td {
  border-top: 1px solid var(--fe-map-border);
  padding: 0.55rem 0.65rem;
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.fe-feature-map__table th:nth-child(1),
.fe-feature-map__table td:nth-child(1) {
  width: 16%;
}

.fe-feature-map__table th:nth-child(2),
.fe-feature-map__table td:nth-child(2) {
  width: 18%;
}

.fe-feature-map__table th:nth-child(3),
.fe-feature-map__table td:nth-child(3) {
  width: 28%;
}

.fe-feature-map__table th:nth-child(4),
.fe-feature-map__table td:nth-child(4) {
  width: 24%;
}

.fe-feature-map__table th:nth-child(5),
.fe-feature-map__table td:nth-child(5) {
  width: 14%;
}

.fe-feature-map__table tbody tr:hover td {
  background: var(--fe-map-panel-muted);
}

.fe-feature-map__table thead th {
  position: sticky;
  top: 0;
  background: var(--fe-map-header);
  z-index: 2;
  border-top: 0;
}

.fe-feature-map__table thead tr.fe-feature-map__filter-row th {
  top: 2.25rem;
  background: var(--fe-map-filter-header);
  z-index: 1;
  padding: 0.45rem 0.55rem;
}

.fe-feature-map__filter-row input {
  width: 100%;
  font-size: 0.77rem;
}

.fe-feature-map__sort-button {
  border: 0;
  background: transparent;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
}

.fe-feature-map__sort-indicator {
  font-size: 0.72rem;
  color: var(--fe-map-muted);
}

.fe-feature-map__table a {
  color: var(--fe-map-link);
  text-decoration: none;
}

.fe-feature-map__table a:hover {
  color: var(--fe-map-link-hover);
  text-decoration: underline;
}

.fe-feature-map__status {
  margin-top: 0.65rem;
  font-size: 0.8rem;
  color: var(--fe-map-danger);
  min-height: 1em;
}

@media (max-width: 960px) {
  .fe-feature-map__toolbar {
    align-items: stretch;
  }

  .fe-feature-map__toolbar-label {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .fe-feature-map__toolbar-label input {
    min-width: 0;
    width: 100%;
  }

  .fe-feature-map__floorplan-filter,
  .fe-feature-map__button[data-role="clear-filters"] {
    width: 100%;
  }

  .fe-feature-map__button[data-role="floorplan-toggle"],
  .fe-feature-map__button[data-role="clear-filters"] {
    width: 100%;
    justify-content: center;
  }

  .fe-feature-map__floorplan-menu {
    width: min(92vw, 22rem);
    left: 0;
    right: auto;
  }

  .fe-feature-map__table-wrap {
    overflow: visible;
    overflow-y: visible;
    border: 0;
    background: transparent;
  }

  .fe-feature-map__table caption {
    border-radius: 0.7rem;
    border: 1px solid var(--fe-map-border);
    margin-bottom: 0.5rem;
  }

  .fe-feature-map__table {
    min-width: 0;
    table-layout: fixed;
  }

  .fe-feature-map__table thead {
    display: none;
  }

  .fe-feature-map__table tbody {
    display: block;
  }

  .fe-feature-map__table tbody tr {
    display: block;
    border: 1px solid var(--fe-map-border);
    border-radius: 0.7rem;
    background: var(--fe-map-panel);
    margin-bottom: 0.7rem;
    overflow: hidden;
  }

  .fe-feature-map__table tbody td {
    display: grid;
    grid-template-columns: minmax(7.5rem, 40%) 1fr;
    gap: 0.45rem;
    padding: 0.55rem 0.65rem;
    width: 100%;
    border-top: 1px solid var(--fe-map-border);
  }

  .fe-feature-map__table tbody td:first-child {
    border-top: 0;
  }

  .fe-feature-map__table tbody td::before {
    content: attr(data-label);
    font-weight: 700;
    color: var(--fe-map-muted);
    font-size: 0.77rem;
    text-transform: none;
  }

  .fe-feature-map__table th:nth-child(1),
  .fe-feature-map__table td:nth-child(1),
  .fe-feature-map__table th:nth-child(2),
  .fe-feature-map__table td:nth-child(2),
  .fe-feature-map__table th:nth-child(3),
  .fe-feature-map__table td:nth-child(3),
  .fe-feature-map__table th:nth-child(4),
  .fe-feature-map__table td:nth-child(4),
  .fe-feature-map__table th:nth-child(5),
  .fe-feature-map__table td:nth-child(5) {
    width: auto;
  }
}
`;
}

function buildJs() {
  return `(() => {
  const COLUMNS = [
    "Controls, UI Elements, Features",
    "Supported Floorplans",
    "Developer Documentation",
    "SAP Fiori Design Guidelines",
    "Available from Version"
  ];
  const SORTABLE_LABELS = new Set([
    "Controls, UI Elements, Features",
    "Developer Documentation",
    "SAP Fiori Design Guidelines",
    "Available from Version"
  ]);

  function normalizeWhitespace(value) {
    return String(value ?? "").replace(/\\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseVersion(version) {
    const match = String(version ?? "").match(/^(\\d+)\\.(\\d+)\\.(\\d+)$/);
    if (!match) return [0, 0, 0];
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }

  function compareVersions(a, b) {
    const va = parseVersion(a);
    const vb = parseVersion(b);
    if (va[0] !== vb[0]) return va[0] - vb[0];
    if (va[1] !== vb[1]) return va[1] - vb[1];
    return va[2] - vb[2];
  }

  function renderLinkList(group) {
    const links = group?.links ?? [];
    if (links.length > 0) {
      return links
        .map((item) => {
          const label = escapeHtml(item?.label ?? item?.url ?? "");
          const url = normalizeWhitespace(item?.url ?? "");
          if (!url) return label;
          return '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + label + '</a>';
        })
        .join("<br>");
    }

    const fallback = normalizeWhitespace(group?.text ?? "");
    return fallback ? escapeHtml(fallback) : "";
  }

  function formatGeneratedAt(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "-";

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function setupFeatureMap(root) {
    if (!root || root.dataset.initialized === "true") return;
    root.dataset.initialized = "true";

    const jsonUrl = root.getAttribute("data-json-url") || "/feature-map/fe-feature-adoption.json";
    const globalSearch = root.querySelector('[data-role="global-search"]');
    const floorplanToggle = root.querySelector('[data-role="floorplan-toggle"]');
    const floorplanMenu = root.querySelector('[data-role="floorplan-menu"]');
    const floorplanOptionsContainer = root.querySelector('[data-role="floorplan-options"]');
    const floorplanSelectAll = root.querySelector('[data-role="floorplan-select-all"]');
    const floorplanClear = root.querySelector('[data-role="floorplan-clear"]');
    const clearFilters = root.querySelector('[data-role="clear-filters"]');
    const headerRow = root.querySelector('[data-role="header-row"]');
    const filterRow = root.querySelector('[data-role="filter-row"]');
    const tableBody = root.querySelector('[data-role="table-body"]');
    const resultCount = root.querySelector('[data-role="result-count"]');
    const generatedAt = root.querySelector('[data-role="generated-at"]');
    const status = root.querySelector('[data-role="status"]');

    const state = {
      rows: [],
      floorplanOptions: [],
      globalSearch: "",
      columnFilters: COLUMNS.map(() => ""),
      selectedFloorplans: [],
      sortColumn: null,
      sortDirection: "asc"
    };

    function setStatus(message) {
      if (!status) return;
      status.textContent = message || "";
    }

    function updateFloorplanLabel() {
      if (!floorplanToggle) return;
      if (state.selectedFloorplans.length === 0) {
        floorplanToggle.textContent = "Floorplans: All";
        return;
      }
      floorplanToggle.textContent = "Floorplans: " + state.selectedFloorplans.length;
    }

    function updateSortIndicators() {
      const headers = Array.from(headerRow.children);
      headers.forEach((th, index) => {
        const isSortable = SORTABLE_LABELS.has(COLUMNS[index]);
        if (!isSortable) {
          th.removeAttribute("aria-sort");
          return;
        }

        if (state.sortColumn === index) {
          th.setAttribute("aria-sort", state.sortDirection === "asc" ? "ascending" : "descending");
        } else {
          th.setAttribute("aria-sort", "none");
        }

        const indicator = th.querySelector(".fe-feature-map__sort-indicator");
        if (!indicator) return;

        if (state.sortColumn === index) {
          indicator.textContent = state.sortDirection === "asc" ? "▲" : "▼";
        } else {
          indicator.textContent = "↕";
        }
      });
    }

    function toggleSort(columnIndex) {
      if (!SORTABLE_LABELS.has(COLUMNS[columnIndex])) return;

      if (state.sortColumn === columnIndex) {
        state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      } else {
        state.sortColumn = columnIndex;
        state.sortDirection = "asc";
      }

      updateSortIndicators();
      render();
    }

    function buildHeader() {
      headerRow.innerHTML = "";
      filterRow.innerHTML = "";

      COLUMNS.forEach((label, index) => {
        const th = document.createElement("th");
        th.setAttribute("scope", "col");

        if (SORTABLE_LABELS.has(label)) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "fe-feature-map__sort-button";
          button.innerHTML = '<span>' + escapeHtml(label) + '</span><span class="fe-feature-map__sort-indicator">↕</span>';
          button.addEventListener("click", () => toggleSort(index));
          th.appendChild(button);
          th.setAttribute("aria-sort", "none");
        } else {
          th.textContent = label;
        }

        headerRow.appendChild(th);

        const filterCell = document.createElement("th");
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = "Filter";
        input.setAttribute("aria-label", "Filter " + label);
        input.addEventListener("input", () => {
          state.columnFilters[index] = normalizeWhitespace(input.value).toLowerCase();
          render();
        });
        filterCell.appendChild(input);
        filterRow.appendChild(filterCell);
      });

      updateSortIndicators();
    }

    function buildFloorplanFilter() {
      if (!floorplanOptionsContainer) return;
      floorplanOptionsContainer.innerHTML = "";

      state.floorplanOptions.forEach((floorplan, index) => {
        const id = "fe-floorplan-" + root.dataset.instanceId + "-" + index;
        const label = document.createElement("label");
        label.setAttribute("for", id);

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = floorplan;
        input.id = id;

        input.addEventListener("change", () => {
          const selected = floorplanOptionsContainer.querySelectorAll("input:checked");
          state.selectedFloorplans = Array.from(selected).map((node) => node.value);
          updateFloorplanLabel();
          render();
        });

        label.appendChild(input);
        label.appendChild(document.createTextNode(floorplan));
        floorplanOptionsContainer.appendChild(label);
      });

      updateFloorplanLabel();
    }

    function rowMatches(row) {
      if (state.globalSearch && !row.searchText.includes(state.globalSearch)) {
        return false;
      }

      if (state.selectedFloorplans.length > 0) {
        const rowFloorplans = new Set((row.floorplans ?? []).map((value) => value.toLowerCase()));
        const selected = state.selectedFloorplans.map((value) => value.toLowerCase());
        const matches = selected.some((value) => rowFloorplans.has(value));
        if (!matches) return false;
      }

      for (let i = 0; i < state.columnFilters.length; i += 1) {
        const filterValue = state.columnFilters[i];
        if (!filterValue) continue;
        const cellText = row.cells[i]?.text ?? "";
        if (!cellText.includes(filterValue)) return false;
      }

      return true;
    }

    function sortRows(rows) {
      if (state.sortColumn == null) return rows;

      const direction = state.sortDirection === "asc" ? 1 : -1;
      const index = state.sortColumn;

      return [...rows].sort((leftRow, rightRow) => {
        const left = leftRow.cells[index]?.sortText ?? "";
        const right = rightRow.cells[index]?.sortText ?? "";

        let result = 0;
        if (COLUMNS[index] === "Available from Version") {
          result = compareVersions(left, right);
        } else {
          result = left.localeCompare(right, undefined, { sensitivity: "base", numeric: true });
        }

        return result * direction;
      });
    }

    function render() {
      const filtered = state.rows.filter(rowMatches);
      const sorted = sortRows(filtered);

      const html = sorted
        .map((row) => {
          const cells = row.cells
            .map(
              (cell, cellIndex) =>
                '<td data-label="' + escapeHtml(COLUMNS[cellIndex]) + '">' + cell.html + "</td>"
            )
            .join("");
          return "<tr>" + cells + "</tr>";
        })
        .join("");

      tableBody.innerHTML = html;
      resultCount.textContent = filtered.length + " / " + state.rows.length + " rows";
    }

    function clearAllFilters() {
      state.globalSearch = "";
      state.columnFilters = COLUMNS.map(() => "");
      state.selectedFloorplans = [];
      state.sortColumn = null;
      state.sortDirection = "asc";

      if (globalSearch) globalSearch.value = "";
      Array.from(filterRow.querySelectorAll("input")).forEach((input) => {
        input.value = "";
      });
      Array.from(floorplanOptionsContainer.querySelectorAll("input[type='checkbox']")).forEach((checkbox) => {
        checkbox.checked = false;
      });

      updateFloorplanLabel();
      updateSortIndicators();
      render();
    }

    globalSearch?.addEventListener("input", () => {
      state.globalSearch = normalizeWhitespace(globalSearch.value).toLowerCase();
      render();
    });

    clearFilters?.addEventListener("click", clearAllFilters);

    floorplanToggle?.addEventListener("click", () => {
      const open = !floorplanMenu.hidden;
      floorplanMenu.hidden = open;
      floorplanToggle.setAttribute("aria-expanded", String(!open));
    });

    floorplanSelectAll?.addEventListener("click", () => {
      Array.from(floorplanOptionsContainer.querySelectorAll("input[type='checkbox']")).forEach((checkbox) => {
        checkbox.checked = true;
      });
      state.selectedFloorplans = [...state.floorplanOptions];
      updateFloorplanLabel();
      render();
    });

    floorplanClear?.addEventListener("click", () => {
      Array.from(floorplanOptionsContainer.querySelectorAll("input[type='checkbox']")).forEach((checkbox) => {
        checkbox.checked = false;
      });
      state.selectedFloorplans = [];
      updateFloorplanLabel();
      render();
    });

    document.addEventListener("click", (event) => {
      if (!floorplanMenu || floorplanMenu.hidden) return;
      if (floorplanMenu.contains(event.target) || floorplanToggle?.contains(event.target)) return;
      floorplanMenu.hidden = true;
      floorplanToggle?.setAttribute("aria-expanded", "false");
    });

    buildHeader();
    setStatus("Loading feature map data...");

    fetch(jsonUrl, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load feature map data (" + response.status + ")");
        }
        return response.json();
      })
      .then((payload) => {
        const rows = Array.isArray(payload?.rows) ? payload.rows : [];

        state.rows = rows.map((row) => {
          const feature = normalizeWhitespace(row?.feature ?? "");
          const floorplans = Array.isArray(row?.supportedFloorplans)
            ? row.supportedFloorplans.map((item) => normalizeWhitespace(item)).filter(Boolean)
            : [];
          const docsHtml = renderLinkList(row?.developerDocumentation);
          const docsText = normalizeWhitespace(
            (row?.developerDocumentation?.links ?? []).map((item) => item?.label ?? "").join(" ") ||
              row?.developerDocumentation?.text ||
              ""
          );
          const guidelinesHtml = renderLinkList(row?.sapFioriDesignGuidelines);
          const guidelinesText = normalizeWhitespace(
            (row?.sapFioriDesignGuidelines?.links ?? []).map((item) => item?.label ?? "").join(" ") ||
              row?.sapFioriDesignGuidelines?.text ||
              ""
          );
          const version = normalizeWhitespace(row?.availableFromVersion ?? "");

          const cells = [
            {
              html: escapeHtml(feature),
              text: feature.toLowerCase(),
              sortText: feature
            },
            {
              html: floorplans.map((value) => escapeHtml(value)).join("<br>"),
              text: floorplans.join(" ").toLowerCase(),
              sortText: floorplans.join(" ")
            },
            {
              html: docsHtml,
              text: docsText.toLowerCase(),
              sortText: docsText
            },
            {
              html: guidelinesHtml,
              text: guidelinesText.toLowerCase(),
              sortText: guidelinesText
            },
            {
              html: escapeHtml(version),
              text: version.toLowerCase(),
              sortText: version
            }
          ];

          return {
            cells,
            searchText: normalizeWhitespace(cells.map((cell) => cell.text).join(" ")),
            floorplans
          };
        });

        state.floorplanOptions = [...new Set(state.rows.flatMap((row) => row.floorplans))].sort((a, b) =>
          a.localeCompare(b, "en", { sensitivity: "base" })
        );

        buildFloorplanFilter();
        render();

        if (generatedAt) {
          generatedAt.textContent = formatGeneratedAt(payload?.meta?.generatedAt);
        }

        setStatus("");
      })
      .catch((error) => {
        tableBody.innerHTML = "";
        resultCount.textContent = "0 / 0 rows";
        setStatus(error?.message || "Failed to render feature map.");
      });
  }

  function init() {
    const roots = document.querySelectorAll("[data-fe-feature-map]");
    roots.forEach((root, index) => {
      root.dataset.instanceId = String(index + 1);
      setupFeatureMap(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
`;
}

async function main() {
  const log = await readJson(LOG_PATH);
  const snapshots = await loadSnapshots(log);
  const rows = mergeRows(snapshots);
  const adoptionData = buildAdoptionData(snapshots, rows);

  await writeJson(ADOPTION_DATA_PATH, adoptionData);
  await writeJson(STATIC_DATA_PATH, adoptionData);
  await writeText(STATIC_CSV_PATH, buildCsv(rows));
  await writeText(STATIC_FRAGMENT_PATH, buildFragment());
  await writeText(STATIC_CSS_PATH, buildCss());
  await writeText(STATIC_JS_PATH, buildJs());

  console.log(`Wrote ${ADOPTION_DATA_PATH}`);
  console.log(`Wrote ${STATIC_DATA_PATH}`);
  console.log(`Wrote ${STATIC_CSV_PATH}`);
  console.log(`Wrote ${STATIC_FRAGMENT_PATH}`);
  console.log(`Wrote ${STATIC_CSS_PATH}`);
  console.log(`Wrote ${STATIC_JS_PATH}`);
  console.log(`Rows: ${adoptionData.meta.rowCount}, Snapshots: ${adoptionData.meta.sourceSnapshots.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
