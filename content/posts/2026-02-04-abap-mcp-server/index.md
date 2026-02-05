---
title: "Finally: An MCP Server for ABAP"
date: 2026-02-04T09:30:00+01:00
draft: false
description: "I built a community MCP server for ABAP so GitHub Copilot in Eclipse can pull in the right ABAP knowledge fast, including SAP Docs, SAP Community, and SAP blogs."
tags: ["abap", "mcp", "github-copilot", "eclipse", "sap"]
categories: ["projects"]
author: "Marian Zeis"
showToc: false
cover:
  image: "eclipse-mcp-server.jpg"
  alt: "Screenshot of Eclipse showing GitHub Copilot working with the ABAP MCP server."
  relative: true
  hiddenInSingle: true
images:
  - "eclipse-mcp-server.jpg"
---

Finally, there is an MCP server for ABAP.

You can use it directly in Eclipse via `https://mcp-abap.marianzeis.de/mcp`.

Setup instructions are here: [Eclipse configuration (GitHub Copilot)](https://github.com/marianfoo/abap-mcp-server/blob/main/README.md#eclipse-configuration-github-copilot)

---

## Why a community ABAP MCP server?

SAP has announced an MCP server for ABAP, so why create a community one?

The trigger for me was the [release of Agent Mode in GitHub Copilot for ADT](https://github.com/orgs/community/discussions/151288), which finally makes it possible to edit ABAP code by Copilot.

LLM models are already really good, but ABAP knowledge is still a recurring problem. So I wanted an MCP server that is actually tailored for ABAP.

For that, I took my existing MCP server for SAP docs, removed documentation that is irrelevant for ABAP, and added ABAP-specific sources like Official ABAP Keyword Documentation, DSAG ABAP Development Guidelines and ABAP Style Guide.

I also tweaked the MCP tools so that search automatically looks beyond local docs and includes SAP Community posts and SAP Help, then returns the best results. And since GitHub Copilot in Eclipse is not exactly the fastest, getting to relevant context quicker makes a real difference.

Here is what it looks like in Eclipse:

![Eclipse with MCP server](eclipse-mcp-server.jpg)

---

## Why Eclipse matters (right now)

GitHub Copilot for Eclipse is especially important right now because (currently) Joule for Developers in Eclipse is not available for S/4HANA on-premise systems. For many ABAP developers in Eclipse, Copilot is the only practical way to use LLMs today.

Sure, there is also VS Code, and SAP will support it in the near future. But let's be honest: not every ABAP developer is even on Eclipse yet. And the "average developer" is not going to switch to VS Code now, and probably not anytime soon either.

So this means: **right now**, every ABAP developer, no matter which system, can use LLMs in Eclipse and also access ABAP-specific knowledge.

Competition is good, so I published the ABAP MCP server as open source. That way, we have something to compare once SAP releases their own ABAP MCP server. And it also gives us a useful alternative to Joule for Developers.

Uwe Fetzer already tested the new ABAP MCP server and confirmed it works better than the SAP MCP Docs server:
[saptodon.org post](https://saptodon.org/@se38@nrw.social/116011617758947257)

Try it out and let me know what you think! You can use either the deployed version on my server or run it locally with Node or Docker.

---

## Update (2026-02-05)

Since publishing, I added two new capabilities:

- **Software Heroes as an online search source**: The `search` tool can now also pull relevant content from [Software Heroes](https://software-heroes.com/) (including German and English results).
- **New `abap_feature_matrix` tool**: You can query the [ABAP Feature Matrix](https://software-heroes.com/abap-feature-matrix) to quickly check feature availability across releases and ABAP Cloud, also provided by Björn Schulz.

Huge thanks to **Björn Schulz** for offering his APIs and making these integrations possible.

More info about the tools and sources is in the GitHub Repo README: https://github.com/marianfoo/abap-mcp-server#available-tools