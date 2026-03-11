#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const VERSIONS_URL =
  "https://ui5.sap.com/version.json?sap-ui-config-patches=true&sap-ui-config-showall=true";
const TOPIC_ID = "62d3f7c2a9424864921184fd6c7002eb";
const MIN_MINOR = 84;
const BASE_URL = "https://ui5.sap.com";

const DATA_DIR = path.resolve(process.cwd(), "data/fe-feature-map");
const LOG_PATH = path.join(DATA_DIR, "scrape-log.json");

function toIsoNow() {
  return new Date().toISOString();
}

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

function compareMinorKeys(a, b) {
  const [majorA, minorA] = a.split(".").map(Number);
  const [majorB, minorB] = b.split(".").map(Number);
  if (majorA !== majorB) return majorA - majorB;
  return minorA - minorB;
}

async function readJsonIfExists(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch JSON (${response.status}): ${url}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch HTML (${response.status}): ${url}`);
  }

  return response.text();
}

function buildFeatureMapUrl(fullVersion) {
  return `${BASE_URL}/${fullVersion}/docs/topics/${TOPIC_ID}.html`;
}

function getLatestMinorVersions(versionJson, minMinor) {
  const byMinor = new Map();

  for (const [minorKey, value] of Object.entries(versionJson)) {
    if (!/^\d+\.\d+$/.test(minorKey)) continue;
    if (!value || typeof value !== "object") continue;
    if (typeof value.version !== "string") continue;

    const parsed = parseVersion(value.version);
    if (parsed.major !== 1 || parsed.minor < minMinor) continue;

    const current = byMinor.get(minorKey);
    if (!current || compareVersions(value.version, current.fullVersion) > 0) {
      byMinor.set(minorKey, {
        minorKey,
        fullVersion: value.version,
        support: value.support ?? null,
        lts: Boolean(value.lts)
      });
    }
  }

  return [...byMinor.values()].sort((a, b) => compareMinorKeys(a.minorKey, b.minorKey));
}

function decodeHtmlEntities(text) {
  if (!text) return "";

  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    "#39": "'"
  };

  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isNaN(code) ? _ : String.fromCodePoint(code);
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      const code = Number.parseInt(dec, 10);
      return Number.isNaN(code) ? _ : String.fromCodePoint(code);
    })
    .replace(/&([a-zA-Z0-9#]+);/g, (match, name) => named[name] ?? match);
}

function stripTags(html) {
  return (html ?? "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]*>/g, " ");
}

function textFromHtml(html) {
  return normalizeWhitespace(decodeHtmlEntities(stripTags(html)));
}

function parseAttributes(rawAttrText) {
  const attrs = {};
  const attrRegex = /([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = attrRegex.exec(rawAttrText ?? "")) !== null) {
    const name = String(match[1] ?? "").toLowerCase();
    const value = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
    if (name) {
      attrs[name] = value;
    }
  }

  return attrs;
}

function elementInnerHtml(elementHtml, tagName) {
  const trimmed = (elementHtml ?? "").trim();
  return trimmed
    .replace(new RegExp(`^<${tagName}\\b[^>]*>`, "i"), "")
    .replace(new RegExp(`<\\/${tagName}>$`, "i"), "");
}

function extractFeatureMapTable(html, sourceUrl) {
  const byId = /<table\b[^>]*\bid\s*=\s*["']table_xrc_jls_g3b["'][^>]*>[\s\S]*?<\/table>/i.exec(
    html
  );
  if (byId) return byId[0];

  const tables = html.match(/<table\b[\s\S]*?<\/table>/gi) ?? [];
  for (const tableHtml of tables) {
    if (textFromHtml(tableHtml).includes("Controls, UI Elements, Features")) {
      return tableHtml;
    }
  }

  throw new Error(`Feature map table not found in ${sourceUrl}`);
}

function extractHeaders(tableHtml) {
  const thead = /<thead\b[\s\S]*?<\/thead>/i.exec(tableHtml)?.[0] ?? tableHtml;
  const thTags = thead.match(/<th\b[\s\S]*?<\/th>/gi) ?? [];
  return thTags.map((th) => textFromHtml(elementInnerHtml(th, "th"))).filter(Boolean);
}

function extractRows(tableHtml) {
  const tbody = /<tbody\b[\s\S]*?<\/tbody>/i.exec(tableHtml)?.[0] ?? tableHtml;
  return tbody.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? [];
}

function extractCells(rowHtml) {
  const tdTags = rowHtml.match(/<td\b[\s\S]*?<\/td>/gi) ?? [];
  return tdTags.map((td) => elementInnerHtml(td, "td"));
}

function extractLinksFromCell(cellHtml) {
  const links = [];
  const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(cellHtml ?? "")) !== null) {
    const attrs = parseAttributes(match[1] ?? "");
    const text = textFromHtml(match[2] ?? "");
    const title = normalizeWhitespace(attrs.title ?? "");
    const href = attrs.href || null;
    const target = attrs.target || null;
    const rel = attrs.rel || null;

    if (text || href) {
      links.push({
        text: text || null,
        href,
        title: title || null,
        target,
        rel
      });
    }
  }

  return links;
}

function extractListItems(cellHtml) {
  const items = [];
  const liRegex = /<li\b[\s\S]*?>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = liRegex.exec(cellHtml ?? "")) !== null) {
    const item = textFromHtml(match[1]);
    if (item) items.push(item);
  }

  return items;
}

function extractFloorplansFromCell(cellHtml) {
  const items = extractListItems(cellHtml);
  if (items.length > 0) return items;
  const fallback = textFromHtml(cellHtml);
  return fallback ? [fallback] : [];
}

function extractImagesFromCell(cellHtml) {
  const images = [];
  const imgRegex = /<img\b([^>]*?)\/?>/gi;
  let match;

  while ((match = imgRegex.exec(cellHtml ?? "")) !== null) {
    const attrs = parseAttributes(match[1] ?? "");
    if (!attrs.src) continue;

    images.push({
      src: attrs.src,
      alt: normalizeWhitespace(attrs.alt ?? "") || null,
      className: attrs.class || null
    });
  }

  return images;
}

function extractCaptionsFromCell(cellHtml) {
  const captions = [];
  const seen = new Set();
  const captionRegex =
    /<[^>]*class\s*=\s*["'][^"']*\bfigcap\b[^"']*\btitle\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
  let match;

  while ((match = captionRegex.exec(cellHtml ?? "")) !== null) {
    const caption = textFromHtml(match[1]);
    if (!caption || seen.has(caption)) continue;
    seen.add(caption);
    captions.push(caption);
  }

  return captions;
}

function extractTagsFromCell(cellHtml) {
  const listItems = extractListItems(cellHtml);
  if (listItems.length > 0) return listItems;

  const plain = textFromHtml(cellHtml);
  if (!plain) return [];

  return plain
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function findHeaderIndex(headers, matcher, fallback = -1) {
  const index = headers.findIndex((header) => matcher(header.toLowerCase()));
  return index >= 0 ? index : fallback;
}

function extractTitle(html) {
  const titleFromTopic = /<h1\b[^>]*class\s*=\s*["'][^"']*\btopictitle1\b[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i.exec(
    html
  );
  if (titleFromTopic) {
    const value = textFromHtml(titleFromTopic[1]);
    if (value) return value;
  }

  const titleFromInner = /<h1\b[^>]*class\s*=\s*["'][^"']*\binnerTitle\b[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i.exec(
    html
  );
  if (titleFromInner) {
    const value = textFromHtml(titleFromInner[1]);
    if (value) return value;
  }

  return null;
}

function extractShortDescription(html) {
  const match = /<(?:div|p)\b[^>]*class\s*=\s*["'][^"']*\bshortdesc\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p)>/i.exec(
    html
  );
  if (!match) return null;

  const value = textFromHtml(match[1]);
  return value || null;
}

function parseFeatureMapHtml(html, fullVersion, sourceUrl) {
  const tableHtml = extractFeatureMapTable(html, sourceUrl);
  const headers = extractHeaders(tableHtml);

  const floorplansIndex = findHeaderIndex(headers, (h) => h.includes("floorplan"), 1);
  const guidelinesIndex = findHeaderIndex(headers, (h) => h.includes("guideline"), 2);
  const docsIndex = findHeaderIndex(
    headers,
    (h) => h.includes("documentation") && !h.includes("guideline"),
    guidelinesIndex === 2 ? 3 : 2
  );
  const thumbnailIndex = findHeaderIndex(headers, (h) => h.includes("thumbnail"), 4);
  const tagsIndex = findHeaderIndex(headers, (h) => h.includes("tag"), -1);

  const rows = extractRows(tableHtml);
  const features = [];

  for (const [rowIndex, rowHtml] of rows.entries()) {
    const cells = extractCells(rowHtml);
    if (cells.length < 2) continue;

    const featureName = textFromHtml(cells[0]);
    if (!featureName) continue;

    const getCell = (index) => (index >= 0 && index < cells.length ? cells[index] : null);

    const floorplansCell = getCell(floorplansIndex);
    const guidelinesCell = getCell(guidelinesIndex);
    const docsCell = getCell(docsIndex);
    const thumbnailCell = getCell(thumbnailIndex);
    const tagsCell = getCell(tagsIndex);

    features.push({
      index: rowIndex + 1,
      feature: featureName,
      supportedFloorplans: floorplansCell ? extractFloorplansFromCell(floorplansCell) : [],
      uiDesignGuidelinesHeader: headers[guidelinesIndex] ?? null,
      uiDesignGuidelines: guidelinesCell ? extractLinksFromCell(guidelinesCell) : [],
      uiDesignGuidelinesText: guidelinesCell ? textFromHtml(guidelinesCell) || null : null,
      relatedDocumentationHeader: headers[docsIndex] ?? null,
      relatedDocumentation: docsCell ? extractLinksFromCell(docsCell) : [],
      relatedDocumentationText: docsCell ? textFromHtml(docsCell) || null : null,
      thumbnail: {
        header: headers[thumbnailIndex] ?? null,
        captions: thumbnailCell ? extractCaptionsFromCell(thumbnailCell) : [],
        images: thumbnailCell ? extractImagesFromCell(thumbnailCell) : [],
        text: thumbnailCell ? textFromHtml(thumbnailCell) || null : null
      },
      tagsHeader: tagsIndex >= 0 ? headers[tagsIndex] ?? null : null,
      tags: tagsCell ? extractTagsFromCell(tagsCell) : []
    });
  }

  return {
    meta: {
      topicId: TOPIC_ID,
      sourceUrl,
      fullVersion,
      fetchedAt: toIsoNow(),
      title: extractTitle(html),
      shortDescription: extractShortDescription(html),
      headers,
      columnIndexes: {
        floorplansIndex,
        guidelinesIndex,
        docsIndex,
        thumbnailIndex,
        tagsIndex
      },
      rowCount: features.length
    },
    features
  };
}

function hashFeatures(features) {
  return crypto.createHash("sha256").update(JSON.stringify(features)).digest("hex");
}

function getLatestPatchRecord(minorLog) {
  const patches = Object.values(minorLog.patches ?? {}).filter(
    (patch) => patch && typeof patch.version === "string" && typeof patch.hash === "string"
  );

  if (patches.length === 0) return null;

  patches.sort((a, b) => compareVersions(b.version, a.version));
  return patches[0];
}

async function loadLog() {
  const existing = await readJsonIfExists(LOG_PATH);
  if (existing) return existing;

  return {
    schemaVersion: 1,
    createdAt: toIsoNow(),
    updatedAt: null,
    versionsUrl: VERSIONS_URL,
    topicId: TOPIC_ID,
    minMinor: MIN_MINOR,
    minors: {}
  };
}

async function main() {
  const runStartedAt = toIsoNow();
  const log = await loadLog();
  const versions = await fetchJson(VERSIONS_URL);
  const latestMinorVersions = getLatestMinorVersions(versions, MIN_MINOR);

  if (latestMinorVersions.length === 0) {
    throw new Error(`No minor versions >= 1.${MIN_MINOR} found in version feed.`);
  }

  const summary = {
    minorsDiscovered: latestMinorVersions.length,
    alreadyChecked: 0,
    scraped: 0,
    checkedNoChange: 0,
    errors: 0
  };

  console.log(
    `Discovered ${latestMinorVersions.length} latest minor versions from 1.${MIN_MINOR}+`
  );

  for (const versionEntry of latestMinorVersions) {
    const { minorKey, fullVersion, support, lts } = versionEntry;
    const sourceUrl = buildFeatureMapUrl(fullVersion);

    const minorLog =
      log.minors[minorKey] ??
      {
        support,
        lts,
        latestSeenVersion: null,
        latestScrapedVersion: null,
        lastCheckedAt: null,
        lastStatus: null,
        patches: {}
      };
    log.minors[minorKey] = minorLog;

    minorLog.support = support;
    minorLog.lts = lts;
    minorLog.latestSeenVersion = fullVersion;

    if (minorLog.patches[fullVersion]) {
      summary.alreadyChecked += 1;
      minorLog.lastCheckedAt = minorLog.patches[fullVersion].checkedAt;
      minorLog.lastStatus = minorLog.patches[fullVersion].scraped
        ? "already-scraped"
        : "already-checked";
      console.log(
        `[skip] ${minorKey} -> ${fullVersion} already checked (${minorLog.lastCheckedAt})`
      );
      continue;
    }

    try {
      console.log(`[check] ${minorKey} -> ${fullVersion}`);
      const html = await fetchText(sourceUrl);
      const parsed = parseFeatureMapHtml(html, fullVersion, sourceUrl);
      const hash = hashFeatures(parsed.features);
      const previous = getLatestPatchRecord(minorLog);
      const hasChanged = !previous || previous.hash !== hash;
      const checkedAt = toIsoNow();

      let dataFile = null;
      if (hasChanged) {
        dataFile = `fe-features-${fullVersion}.json`;
        await writeJson(path.join(DATA_DIR, dataFile), parsed);
        summary.scraped += 1;
        minorLog.latestScrapedVersion = fullVersion;
        console.log(
          `[scraped] ${minorKey} -> ${fullVersion} (${parsed.meta.rowCount} rows) saved as ${dataFile}`
        );
      } else {
        summary.checkedNoChange += 1;
        console.log(
          `[no-change] ${minorKey} -> ${fullVersion} matches ${previous.version}, log updated`
        );
      }

      minorLog.patches[fullVersion] = {
        version: fullVersion,
        sourceUrl,
        checkedAt,
        hash,
        rowCount: parsed.meta.rowCount,
        scraped: hasChanged,
        dataFile,
        comparedToVersion: previous?.version ?? null,
        changedComparedToPrevious: hasChanged
      };
      minorLog.lastCheckedAt = checkedAt;
      minorLog.lastStatus = hasChanged ? "scraped" : "checked-no-change";
      minorLog.lastError = null;
    } catch (error) {
      summary.errors += 1;
      minorLog.lastCheckedAt = toIsoNow();
      minorLog.lastStatus = "error";
      minorLog.lastError = String(error?.message ?? error);
      console.error(`[error] ${minorKey} -> ${fullVersion}: ${minorLog.lastError}`);
    }
  }

  const hasNewChecks = summary.scraped > 0 || summary.checkedNoChange > 0 || summary.errors > 0;
  if (hasNewChecks) {
    log.updatedAt = toIsoNow();
    log.lastRun = {
      startedAt: runStartedAt,
      finishedAt: toIsoNow(),
      summary
    };
  }

  await writeJson(LOG_PATH, log);

  console.log("Run summary:", summary);

  if (summary.errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
