---
title: "ARC-1 and SAP ADT: Growing Together"
date: 2026-10-27T07:01:51+01:00
draft: false
slug: "arc-1-sap-adt-growing-together"
description: "How ARC-1's governed SAP access on BTP works with SAP ADT: direct links from Copilot, shared RAP workflows and a shrinking feature gap."
tags: ["sap", "arc-1", "abap", "adt", "vscode", "mcp", "github-copilot", "rap", "btp"]
categories: ["projects"]
author: "Marian Zeis"
showToc: false
keywords: ["ARC-1 SAP ADT", "SAP ADT MCP server", "ABAP VS Code Copilot", "SAP ADT 1.2", "RAP generation skills"]
cover:
  image: "images/arc-1-sap-adt-header-v3.png"
  alt: "ARC-1 and the SAP ADT VS Code extension growing together. A supporting diagram shows Copilot using ARC-1 and the SAP ADT MCP server to open ABAP source in the extension."
  relative: true
  hiddenInSingle: false
images: ["images/arc-1-sap-adt-header-v3.png"]
---

When I started [ARC-1](https://arc-1-mcp.com/), there were already MCP servers for SAP's ADT APIs. **My main goal was enterprise-ready access: a service hosted on SAP BTP, with central control over who can use it and what they are allowed to do.**

For a team, that means being able to give some users read access and others permission to make changes, restrict where changes are allowed, and manage the service centrally. ARC-1's [authorization model](https://docs.arc-1-mcp.com/authorization/) combines those controls with the SAP user's backend permissions. That has been the purpose of the project from the beginning.

Several bigger changes built on that foundation. [ARC-1 1.0](/posts/2026-08-03-arc-1-update/) brought multi-system operation from one BTP deployment, alongside reusable skills and extensions for custom tools. I also extracted the authentication code into [a reusable XSUAA package for other MCP servers](/posts/custom-mcp-server-joule-work-desktop-xsuaa/#why-i-built-xsuaa-auth). More recently, [ARC-1 1.7.0](https://github.com/arc-mcp/arc-1/releases/tag/v1.7.0) added access to saved application logs and SAPscript texts, giving assistants more context beyond source code.

SAP's ADT extension and its MCP server bring AI into the developer's local environment. As those tools improve, there are more opportunities to connect the two approaches. A centrally managed ARC-1 service can supply system context, while SAP's tools provide the native development experience in VS Code.

The latest ARC-1 releases make that connection more useful: **you can investigate an ABAP object in Copilot and follow a link straight into SAP's ADT editor.**

## From a chat answer to the ABAP editor

Suppose you ask Copilot to explain a class using ARC-1. Once you have the explanation, you want to inspect the source yourself. Previously, that could mean copying the object name and searching for it again in the editor.

Now Copilot can ask SAP's ADT MCP server for the object's editor link and include it in the answer. Click the link, and the source opens through the SAP ADT extension. The navigation support arrived in [ARC-1 1.8.0](https://github.com/arc-mcp/arc-1/releases/tag/v1.8.0) and is included in [1.9.0](https://github.com/arc-mcp/arc-1/releases/tag/v1.9.0).

You need SAP ADT 1.2 or later, its MCP server enabled, and an allowed local SAP connection that you are logged into. The tool used for the link, `abap_object_get_file_uri`, is included in SAP's MCP server by default.

If you already use both MCP servers in Copilot, just tell it which local ADT connection matches ARC-1's backend and SAP client. For example:

> My local ADT destination “My-Dev” connects to the same backend and SAP client as ARC-1. Use ARC-1 to read CL_ABAP_TYPEDESCR, explain its purpose, and use SAP's ADT tools to give me a link to open the source in VS Code.

You can save that connection information in your personal Copilot instructions. No additional ARC-1 link configuration is needed. ARC-1 continues to run on BTP, and the source opens through your local ADT connection. The [editor integration guide](https://docs.arc-1-mcp.com/ide-integration/) has the details.

## Write skills that go beyond source code

SAP's MCP server already covers much of the work on ABAP objects: creation, reading, editing, RAP generation, activation and checks. Those tools should be part of a combined skill.

But a development task often reaches further. A RAP service may activate successfully and still return unexpected data, respond slowly or fail during processing. This is where ARC-1 can add useful context beyond the source code:

- **Investigate the data.** ARC-1 can query tables and CDS entities through MCP, including ABAP SQL joins and aggregates. A skill can check the records behind an unexpected result. SAP ADT has SQL notebooks in the IDE, but its published MCP catalog currently has no dedicated SQL query tool. See [ARC-1's data tools](https://docs.arc-1-mcp.com/tools/#sapquery).
- **Understand performance.** ARC-1 can read ABAP profiler traces, inspect the SQL generated for a CDS view and retrieve timing information for an OData request. That helps an assistant investigate where time is being spent before proposing a code change. These are additional [ARC-1 diagnostic tools](https://docs.arc-1-mcp.com/tools/#sapdiagnose); SAP's 1.2 announcement lists MCP access to ABAP traces as planned work.
- **Read the application context.** ARC-1 can retrieve a saved SLG1 application log when its log number is known, or read stored SAPscript texts. That brings processing messages and document text into an investigation. These [data operations](https://docs.arc-1-mcp.com/tools/#sapquery) are distinct from the short-dump and Gateway-error feeds SAP already exposes.

This comparison is against [SAP's published MCP toolset](https://community.sap.com/t5/technology-blog-posts-by-sap/abap-development-tools-mcp-server-major-update-available/ba-p/14496064), rather than everything available in the ADT interface. Backend support and permissions still apply, and ARC-1's data access must be explicitly enabled. Teams can also add their own service tools through the [ARC-1 extension framework](https://docs.arc-1-mcp.com/extensions/).

My [RAP service generation skill](https://github.com/arc-mcp/arc-1/blob/v1.9.0/skills/generate-rap-service/SKILL.md#step-3b-optional-delegate-the-build-to-saps-official-abap-generator) already uses SAP's native generator when it fits. I would build on that pattern: use SAP's tools to generate and edit the objects, then bring in ARC-1 to inspect the data, investigate a slow request or read a relevant application log.

A skill can connect those steps into one workflow. The assistant works with the code and the surrounding system evidence, then gives the developer a link to review the relevant object in ADT.

## More shared features, different deployment models

SAP ADT 1.2 makes this combination more useful. The extension adds features such as SQL notebooks, the Transport Organizer and object version history. The expanded MCP tools give assistants more ways to find, read, edit and check ABAP objects. [SAP's October developer news](https://community.sap.com/t5/developer-news/sap-developer-news-october-22nd-2026/ba-p/14509149) covers the changes.

I welcome that progress. I would like SAP's MCP server to offer the same development capabilities as ARC-1 over time. With 1.2, it is getting closer. SAP also explicitly includes cooperation with community MCP servers in its [design for the updated server](https://community.sap.com/t5/technology-blog-posts-by-sap/abap-development-tools-mcp-server-major-update-available/ba-p/14496064).

**Matching features would still leave the deployment question.** SAP's server runs with the local ADT environment. For my planning, I do not expect SAP to offer a centrally hosted ADT MCP server on BTP in the near term. Enterprise access through a managed BTP service therefore remains ARC-1's main purpose, even as the feature gap shrinks.

SAP's server has its own access controls, including destination and package-change restrictions. In a combined setup, each server enforces its own permissions. The [comparison of ARC-1 and SAP's ADT MCP server](https://docs.arc-1-mcp.com/arc-1-vs-sap-abap-mcp-server/) goes into the differences in capabilities, architecture and administration.

## A better starting point for developers

Thank you to the developers and product managers behind SAP's ADT extension and MCP server. The improvements make it easier to start using AI for ABAP development, and the support for working with other tools makes the whole setup more useful.

If you are getting started, SAP's tools already provide a lot in the development environment you use. The [ADT MCP setup tutorial for VS Code](https://developers.sap.com/tutorials/abap-dev-adt-mcp-server-tools/) walks through enabling the server and connecting your assistant. Available capabilities depend on your backend and configuration.

For teams using ARC-1 on BTP, the new links are a first step toward bringing that managed access closer to everyday development: investigate in Copilot, use tools from both servers, and open the result in ADT to review it.
