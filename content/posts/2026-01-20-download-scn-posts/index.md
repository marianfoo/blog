---
title: "Extract your SAP Community blog posts with a simple Node.js script"
date: 2026-01-20T06:00:00+01:00
draft: false
description: "A single Node.js script to fetch your SAP Community posts, generate local HTML files, and download referenced images."
tags: ["sap-community", "nodejs", "script", "archiving", "offline"]
categories: ["Development"]
author: "Marian Zeis"
showToc: false
---


I wanted to have a local archive of my SAP Community blog posts for my own reference and to have a better overview of my content.  
Also I tried writing posts locally in Markdown first and then converting them to HTML. Mixed experience so far.  
Currently this is in a private repository and it fetches the latest posts from SAP Community daily if there are any new ones.  

I at least wanted to share my script so others can use it too.

As I'm currently just too lazy to create a proper repository for this, I will just share the script here.

## What you need

You need Node.js 18+ (Node 22 works as well). The script uses the built-in `fetch()` API, so you do not need extra dependencies.

## The idea

The workflow is intentionally simple and mirrors a common “ETL” pattern.

First, fetch the posts and store the raw API response as JSON.

Second, generate local HTML files (one file per post). The SAP Community API already returns the post body as HTML, so the script wraps that into a minimal HTML document and adds a few metadata fields into the `<head>`.

Third, scan those HTML files for `<img src="...">` references and download the images. This makes the archive usable offline and helps when you want to copy content into another system later.

This also makes it possible to just open the HTML files in a browser and read the posts offline, including the pictures.

## A minimal script (test mode)

Save the following file as `blogpost/extract-posts-generate-html-download-images.js`.

If you prefer, you can also download the script directly from this post: [`/downloads/extract-posts-generate-html-download-images.js`](/downloads/extract-posts-generate-html-download-images.js)

Before you run it, change `USER_ID` to your own SAP Community numeric user ID. For testing, the script uses `LIMIT = 10`, so you don’t accidentally pull thousands of posts while you are still experimenting.

Please be API-friendly: keep `LIMIT` small while testing, and don’t run the script in a tight loop.

Expand the section below to see the full script.

{{< collapse summary="extract-posts-generate-html-download-images.js" openByDefault=false >}}

```javascript
/**
 * SAP Community: extract your posts (test mode) and archive locally.
 *
 * This single script intentionally combines three steps into one file:
 *   1) fetch posts from the SAP Community Search API
 *   2) generate local HTML files from the response (one file per post)
 *   3) download images referenced by those HTML files
 *
 * Why keep it in one file?
 * - It’s easier to explain in a short blog post.
 * - Readers can copy/paste one script, change USER_ID, run it, and inspect output.
 *
 * IMPORTANT:
 * - This is a "demo/testing" version. The query uses LIMIT 10 on purpose.
 * - The SAP Community API can be rate-limited. Keep limits small while experimenting.
 *
 * Requirements:
 * - Node.js 18+ (Node 22 also works). This script relies on the built-in global fetch().
 *
 * Usage:
 *   node blogpost/extract-posts-generate-html-download-images.js
 *
 * Output folders created inside blogpost/:
 * - blogpost/output/user_<USER_ID>_messages_limit10.json   (raw API response)
 * - blogpost/posts/                                       (generated HTML posts)
 * - blogpost/images/<postId>/                             (downloaded images)
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// --- Configuration (change these for your own account) -----------------------

// Your SAP Community numeric user id (not your username).
// In Marian’s repo this is 61; replace with your own.
const USER_ID = 61;

// Keep this small while testing. For a real archive you’d increase it.
// If you hit server-side errors (e.g., HTTP 413), you’ll need batching.
const LIMIT = 10;

// SAP Community Search API endpoint used by this repo.
const API_BASE_URL = 'https://community.sap.com/api/2.0/search';

// Small delay between image downloads (be respectful).
const IMAGE_DOWNLOAD_DELAY_MS = 200;

// --- Paths (everything is local to this folder to keep it self-contained) ----

const ROOT_DIR = __dirname; // blogpost/
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');
const POSTS_DIR = path.join(ROOT_DIR, 'posts');
const IMAGES_DIR = path.join(ROOT_DIR, 'images');

// --- Step 1: Fetch posts -----------------------------------------------------

/**
 * Fetch top-level posts for a user and store the raw response as JSON.
 *
 * Why store the raw response?
 * - It’s your "source of truth" archive.
 * - It makes debugging easier: you can inspect what the API returned.
 * - It decouples fetching from the downstream steps (HTML generation, downloads).
 */
async function fetchPostsAsJson({ userId, limit }) {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });

  // depth=0 = top-level posts (not replies/comments)
  // Keep selected fields small to reduce payload; body is still the largest part.
  // For a larger export, consider fetching IDs first, then bodies in batches (IN (...)).
  const query = `select id,subject,post_time,depth,body from messages where author.id='${userId}' and depth=0 order by post_time desc limit ${limit}`;
  const url = `${API_BASE_URL}?q=${encodeURIComponent(query)}`;

  console.log(`\n[1/3] Fetching posts from SAP Community API...`);
  console.log(`      USER_ID=${userId}, LIMIT=${limit}`);
  console.log(`      Query: ${query}`);

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`API request failed: HTTP ${response.status}\n${body}`);
  }

  const json = await response.json();
  const items = json?.data?.items ?? [];

  const outFile = path.join(OUTPUT_DIR, `user_${userId}_messages_limit${limit}.json`);
  await fsp.writeFile(outFile, JSON.stringify(json, null, 2), 'utf8');

  console.log(`      Saved raw response to: ${outFile}`);
  console.log(`      Posts returned: ${items.length}`);

  return { outFile, items };
}

// --- Step 2: Generate HTML files --------------------------------------------

/**
 * Generate one HTML file per post.
 *
 * Why generate HTML at all?
 * - It’s the easiest format to open in any browser.
 * - It enables simple image extraction by scanning <img src="..."> tags.
 *
 * Note:
 * - SAP Community post bodies already contain HTML. We keep it as-is and wrap it
 *   into a minimal HTML document with metadata in <head>.
 */
async function generateHtmlFiles({ posts }) {
  await fsp.mkdir(POSTS_DIR, { recursive: true });

  console.log(`\n[2/3] Generating local HTML files...`);

  let written = 0;
  for (const post of posts) {
    if (!post?.id || !post?.body) continue;

    const postDate = safeDate(post.post_time);
    const dateStr = postDate ? postDate.toISOString().slice(0, 10) : 'unknown-date';

    const cleanSubject = safeSlug(post.subject || 'sap-community-post').slice(0, 40);
    const filename = `${dateStr}-${post.id}-${cleanSubject}.html`;
    const filepath = path.join(POSTS_DIR, filename);

    const html = buildHtmlDocument({
      title: post.subject || 'SAP Community Post',
      meta: {
        'post-id': String(post.id),
        'author-id': String(USER_ID),
        'post-time': post.post_time || '',
        depth: String(post.depth ?? ''),
        subject: post.subject || '',
      },
      bodyHtml: post.body,
    });

    await fsp.writeFile(filepath, html, 'utf8');
    written++;
    console.log(`      Wrote: ${filename}`);
  }

  console.log(`      HTML files written: ${written}`);
  console.log(`      Output folder: ${POSTS_DIR}`);
}

function buildHtmlDocument({ title, meta, bodyHtml }) {
  const escapeAttr = (s) => String(s).replace(/"/g, '&quot;');
  const metaTags = Object.entries(meta || {})
    .map(([k, v]) => `    <meta name="${escapeAttr(k)}" content="${escapeAttr(v)}">`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeAttr(title)}</title>
${metaTags}
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

function safeDate(value) {
  const d = new Date(value);
  // NaN check: invalid date produces NaN time
  return Number.isFinite(d.getTime()) ? d : null;
}

function safeSlug(value) {
  return String(value)
    .replace(/^Re:\s*/i, '')
    .replace(/[<>:"/\\|?*]/g, '') // invalid filename characters
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

// --- Step 3: Download images -------------------------------------------------

/**
 * Scan each generated HTML file for <img src="..."> and download the images.
 *
 * Why download images?
 * - When you archive HTML locally, images often point to remote URLs.
 * - A local copy is useful for offline reading and for further processing.
 *
 * Notes:
 * - This is a lightweight HTML scan using regex (good enough for a blog post).
 * - Some posts may use SAP Community-specific tags or lazy-loading patterns.
 *   If an image is missed, you can refine the regex or parse with a DOM library.
 */
async function downloadImagesFromGeneratedHtml() {
  await fsp.mkdir(IMAGES_DIR, { recursive: true });

  console.log(`\n[3/3] Downloading images referenced by the generated HTML...`);

  const files = await fsp.readdir(POSTS_DIR).catch(() => []);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));

  if (htmlFiles.length === 0) {
    console.log(`      No HTML files found in ${POSTS_DIR} (skipping image download).`);
    return;
  }

  let totalFound = 0;
  let downloaded = 0;
  let skipped = 0;

  for (const htmlFile of htmlFiles) {
    // Filename format: YYYY-MM-DD-ID-subject.html
    const match = htmlFile.match(/^\d{4}-\d{2}-\d{2}-(\d+)-/);
    const postId = match?.[1] || 'unknown-post';

    const htmlPath = path.join(POSTS_DIR, htmlFile);
    const html = await fsp.readFile(htmlPath, 'utf8');

    const imageUrls = extractImgSrcUrls(html);
    if (imageUrls.length === 0) continue;

    totalFound += imageUrls.length;

    const postDir = path.join(IMAGES_DIR, postId);
    await fsp.mkdir(postDir, { recursive: true });

    console.log(`      ${htmlFile}: found ${imageUrls.length} <img> URLs`);

    for (const imageUrl of imageUrls) {
      try {
        const filename = chooseImageFilename(imageUrl);
        const fullPath = path.join(postDir, filename);

        if (await exists(fullPath)) {
          skipped++;
          continue;
        }

        await downloadToFile(imageUrl, fullPath);
        downloaded++;

        // Be polite to the server.
        await sleep(IMAGE_DOWNLOAD_DELAY_MS);
      } catch (e) {
        // For a blog post, it’s fine to keep going on individual failures.
        console.log(`        Failed: ${imageUrl} (${e.message})`);
      }
    }
  }

  console.log(`\n      Image download summary:`);
  console.log(`      - <img> URLs found: ${totalFound}`);
  console.log(`      - downloaded: ${downloaded}`);
  console.log(`      - skipped (already present): ${skipped}`);
  console.log(`      Images folder: ${IMAGES_DIR}`);
}

function extractImgSrcUrls(html) {
  // Matches: <img ... src="..." ...> and <IMG ... SRC='...' ...>
  const imageRegex = /<img[^>]*\ssrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const matches = [...html.matchAll(imageRegex)];
  return matches.map((m) => m[1]).filter(Boolean);
}

function chooseImageFilename(url) {
  // Try to keep recognizable filenames for SAP Community images, else create a stable hash.
  // SAP Community often uses URLs like: .../image-id/<id>/...
  const idMatch = String(url).match(/image-id\/([^\/?#]+)/i);
  if (idMatch?.[1]) return `${idMatch[1]}.jpg`;

  try {
    const u = new URL(url);
    const base = path.basename(u.pathname).split('?')[0];
    if (base && base.includes('.')) return base;
  } catch {
    // Not a valid absolute URL, fall through to hash.
  }

  const hash = crypto.createHash('sha1').update(String(url)).digest('hex').slice(0, 12);
  return `image_${hash}.jpg`;
}

async function downloadToFile(url, filepath) {
  // Use the URL protocol to decide between https/http.
  const protocol = String(url).startsWith('https:') ? https : http;

  await new Promise((resolve, reject) => {
    const req = protocol.get(url, (res) => {
      // Follow basic redirects.
      if (res.statusCode === 301 || res.statusCode === 302) {
        const next = res.headers.location;
        if (!next) return reject(new Error(`Redirect without location header: ${url}`));
        res.resume();
        return downloadToFile(next, filepath).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const out = fs.createWriteStream(filepath);
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
      out.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Main pipeline -----------------------------------------------------------

async function main() {
  // Step 1: Fetch
  const { items } = await fetchPostsAsJson({ userId: USER_ID, limit: LIMIT });

  // Step 2: Generate HTML
  await generateHtmlFiles({ posts: items });

  // Step 3: Download images
  await downloadImagesFromGeneratedHtml();

  console.log(`\nDone.`);
  console.log(`You can now inspect:`);
  console.log(`- Raw JSON: ${OUTPUT_DIR}`);
  console.log(`- HTML posts: ${POSTS_DIR}`);
  console.log(`- Images: ${IMAGES_DIR}`);
}

main().catch((e) => {
  console.error(`\nScript failed: ${e.message}`);
  process.exitCode = 1;
});
```

{{< /collapse >}}

Run it with:

```bash
node blogpost/extract-posts-generate-html-download-images.js
```

After it finishes, you’ll find three folders under `blogpost/`: `output/` for the raw JSON, `posts/` for the generated HTML files, and `images/` for downloaded images grouped by post ID.

## Example resulting folder structure

If you have a repo like `sap-community-blog-posts` and put the script into a `blogpost/` folder, it can look like this afterwards:

```text
/sap-community-blog-posts/
└── blogpost/
    ├── extract-posts-generate-html-download-images.js
    ├── output/
    │   └── user_61_messages_limit10.json
    ├── posts/
    │   ├── 2026-02-19-1234567-my-first-post.html
    │   ├── 2026-02-10-1234500-another-post.html
    │   └── 2026-01-05-1234000-some-topic.html
    └── images/
        ├── 1234567/
        │   ├── 4c2f1f6e-aaaa-bbbb-cccc-1234567890ab.jpg
        │   └── image_6f2c0a1b3d4e.jpg
        └── 1234500/
            └── image_1a2b3c4d5e6f.jpg
```

## Notes and limitations

The script queries `depth = 0` to fetch only top-level posts, not comments or replies. It also does not limit to blog posts, so you will get other types of posts as well (Q&A, etc.).

