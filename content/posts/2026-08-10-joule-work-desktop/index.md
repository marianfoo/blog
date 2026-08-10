---
title: "Testing Joule Work Desktop with Microsoft 365, Local Files, and SAP"
date: 2026-08-10T09:00:00+02:00
draft: true
description: "My first hands-on look at Joule Work Desktop, including email, calendar, local files, Spaces, skills, MCP connectors, and SAP system access."
tags: ["sap", "joule", "joule-work", "mcp", "skills", "arc-1", "microsoft-365", "ai"]
categories: ["projects"]
author: "Marian Zeis"
showToc: false
keywords: ["Joule Work Desktop", "SAP Joule Work", "Joule Spaces", "SAP MCP", "SAP AI skills", "ARC-1"]
---

You have probably seen Joule Work Desktop on LinkedIn by now. [Sebastian Steinhaeuser](https://www.linkedin.com/posts/sebastian-steinhaeuser_prepare-me-for-my-meeting-with-thats-ugcPost-7490314981784154112-QCE4/) showed how it prepares him for a customer meeting. [Philipp Herzig](https://www.linkedin.com/posts/philipp-herzig_im-excited-to-present-the-new-sap-gui-ugcPost-7488584210123837440-TuTW/) called it the new SAP GUI, with a smile, and demonstrated a workflow across email, a spreadsheet, a Space, and PowerPoint.

Joule Work Desktop is now available to SAP employees after a test with more than 6,000 colleagues. Selected customers can also use it through the Early Adopter Care program on macOS and Windows.

It is a desktop application that can work with local files and applications, Microsoft 365, SAP knowledge, and SAP business systems. It also supports MCP connectors and skills. This is much more interesting than another small Joule chat window inside one SAP application.

I already built similar setups with [LibreChat](/posts/2026-02-16-librechat-enterprise-gpt/) and [Microsoft Copilot Studio](/posts/2026-05-05-arc-1-copilot-studio/). A native desktop application adds direct access to the files and applications people use every day.

This could become a real killer application for SAP.

Luckily, I was one of the few people who got access to the application and could test the currently available features. So here is my first hands-on experience with what I am allowed to show.

<!-- Screenshot: Clean application overview with Conversations, the composer, integrations, and connectors visible. Suggested file: images/joule-work-desktop-overview.png -->

## The basic desktop experience

The application starts with Conversations and feels familiar if you have used ChatGPT or Claude Desktop. You describe a task, add files, and choose which sources or connectors the agent can use.

From the composer, I can enable web search, Work Email, Work Calendar, a working directory, and external connectors. Completed tool calls appear above the answer. Generated files are collected in a side panel and can be opened in the normal desktop application.

The interface itself is not the interesting part. The value comes from combining these tools in one workflow.

## Email and calendar integration

The email and calendar integration was the first thing I tested.

I asked the application to prepare me for a meeting. It found the calendar entry, read related email messages, and created a brief with logistics, open points, risks, and questions.

The individual steps were visible while it worked. First it checked the connected Microsoft 365 account. Then it read the calendar. After that it searched for the supporting email messages. This is useful because I can see where the result comes from instead of only receiving a confident summary.

Joule Work Desktop can also start from the other direction. It can look for an important or time-sensitive email and then collect the information needed to answer it. This is what Philipp showed in his video when the application found an urgent request for a board presentation about increasing shipment defects.

For me, this is more useful than a general inbox summary. The email becomes the start of a task instead of only another item to read.

<!-- Screenshot: Work Email and Work Calendar selected, completed task rows, grounded meeting brief, and Word attachment visible. Suggested file: images/meeting-preparation.png -->

## Local files, OneDrive, and real documents

I can attach Word documents, PowerPoint files, CSV data, JSON, text files, and images. Files synchronized through OneDrive are also available. The application can combine their content with email, calendar, web research, or an external connector.

For the meeting-preparation example, I attached an existing Word template. The application filled the relevant sections and created a new document instead of giving me text to copy manually.

The same works for presentations. In the public demo, Joule reads a spreadsheet about shipment defects, analyzes the changes, and generates a PowerPoint presentation with recommendations. The file can then be opened directly in PowerPoint.

The result still needs review. A chart can use the wrong interpretation and a meeting brief can miss context. But reviewing a prepared document is often faster than starting with an empty file.

## Spaces are more useful than I expected

SAP calls the generated work areas Spaces. A Space is a persistent view for one topic or goal.

For the shipment-defect example, the Space contains the current KPIs, the trend over time, the main causes, findings, and prioritized recommendations. It can be opened again from the Spaces area without searching through the original conversation.

The most useful Space in my test was a transport backlog based on data from my SAP system. It shows open transports, empty transports, their owners, and the biggest requests by object count.

This does not replace a proper application or reporting solution. But not every temporary business question needs a new Fiori application. Spaces are more useful than a long chat answer and much faster to create than a normal application.

<!-- Screenshot: Shipment-defect Space with synthetic data, KPIs, trend, and recommendations, plus the generated PowerPoint in Conversation Details. Suggested file: images/space-and-powerpoint.png -->

## Connecting the SAP system

The SAP system integration is the most important feature for me. It is what can make Joule Work Desktop more than a general desktop agent.

At the moment, the direct SAP business system integration available to me is for SAP S/4HANA Cloud Public Edition. I do not have such a system. My test system is SAP S/4HANA 2023 on-premise.

This was not a big problem because I could add my own MCP connector. I used [ARC-1](https://github.com/arc-mcp/arc-1), my open-source ADT MCP server.

ARC-1 can also run as a remote MCP server with OAuth. I can deploy it to SAP BTP Cloud Foundry and connect the remote endpoint instead of running it only on my laptop.

I could then read transports, inspect ABAP objects, analyze custom code, check ATC findings, or compare a specification with what actually exists in the system.

Adding the connector does not magically bypass SAP security. The connector still needs valid authentication, and the SAP user authorizations still apply. For a normal first setup I would start with a development system and read-only access.

I also added my [SAP Notes MCP server](https://github.com/marianfoo/sap-mcp-servers/tree/main/packages/notes) for authenticated access to SAP Notes and Knowledge Base articles.

A specification can therefore be checked against the affected objects in the SAP system and the relevant SAP documentation. This is the kind of context combination I have wanted from an SAP AI assistant for a long time.

<!-- Screenshot: ARC-1 selected with a fresh successful read from A4H client 001 and the completed task row visible. Suggested file: images/arc-1-sap-access.png -->

## Connectors and one-click skills

Joule Work Desktop supports MCP connectors and skills, so SAP does not have to build every connector and workflow itself.

The [SAP AI Skills Library](https://skills.cloud.sap/) contains reusable skills for different agents. SAP has shown that they can be imported into Joule Work Desktop with one click.

A skill is a set of instructions for a task. It tells the agent which tools and steps to use and what to verify. This is useful for repeated workflows such as explaining an ABAP object, creating unit tests, or reviewing a transport.

MCP servers provide the tools, while skills describe how to use them. This keeps the application extendable without adding every possible SAP feature to the desktop client.

## What I hope SAP adds next

Joule Work Desktop can become a very useful application.

For that to happen, it should not stay limited to the newest cloud applications. Private Cloud and on-premise systems still contain much of the data, custom code, and processes SAP customers use every day. MCP servers could provide a path, but they also need a practical authentication and governance model.

The other big question is pricing. We do not know enough yet. An open-source setup can reduce product cost, but somebody still has to operate it and support the integrations.

I expect that we will hear more at TechEd, but this is only my guess. I mainly hope the next announcements are features customers can try soon and not only another roadmap slide.

For now, I am impressed by the direction. The remaining questions will decide whether it becomes useful for the wider SAP customer base.

## Something is strange

Anyone who already works with Joule Work Desktop may have noticed something by now.

Some details in my screenshots do not look exactly like the application SAP installed. The interface is very close, the workflows work, and the features are there, but a few things are just slightly different.

There is a simple reason for that.

I do not have access to Joule Work Desktop.

The screenshots and video in this post do not show an SAP application. They show an application I built myself.

After watching the public demos, I wanted to see how difficult it would be to rebuild the same core idea with open-source components. I spent roughly two days vibe coding it with Codex. The result is called **Werkbank**.

Werkbank is the German word for workbench, a place where different tools come together to get work done.

The temporary interface follows the public Joule Work Desktop videos closely because I wanted to reproduce the workflows shown there. But there is no internal SAP code behind it, I had no access to a Joule Work Desktop build, and I have no additional product information beyond public posts and videos.

## What is actually behind Werkbank

The agent behind Werkbank is [goose](https://github.com/aaif-goose/goose), an open-source AI agent hosted by the Agentic AI Foundation. Goose handles the model, conversations, and tool calls. It also supports OAuth for remote MCP servers, which Werkbank can use for connectors such as ARC-1 on BTP Cloud Foundry.

I added local conversations, file attachments, generated-file handling, Spaces, connector selection, Microsoft 365 integration, and skill installation. The meeting brief is based on live read-only calendar and email calls. The Word and PowerPoint outputs are real files. The shipment-defect Space is generated from an attached synthetic CSV file, not from a prerecorded animation.

For SAP, Werkbank uses the same MCP servers I can use from Claude Desktop, Codex, VS Code, LibreChat, or Copilot Studio. ARC-1 connects to the ABAP system, while the SAP Notes server provides the knowledge source.

Werkbank also supports an **Add to Werkbank** button for MCP servers. A repository can provide an install link, Werkbank opens a confirmation dialog, and the user can see what will run before approving it. Sensitive values are stored separately in the operating-system keychain.

Skills work in a similar way. Werkbank can accept the skill links used by the SAP AI Skills Library, show the repository and skill name, and ask for confirmation before installation. Installed skills can then be selected by typing `/` in the composer.

The source code will be available in the [Werkbank repository](https://github.com/marianfoo/werkbank). The repository is still private while I clean it up. Once it is public, clone it, run `npm install`, copy `.env.example` to `.env`, add the model configuration, and start it with `npm run dev`.

<!-- Screenshot: Add to Werkbank button, connector confirmation, and imported ABAP skill visible after the reveal. Suggested file: images/werkbank-connectors-and-skills.png -->

## What this little experiment shows

Werkbank is not a replacement for Joule Work Desktop. It is a two-day prototype with bugs and much narrower workflows. It is far away from the quality and support expected from an SAP product.

SAP also has to solve the difficult enterprise parts: identity, authorizations, data protection, auditing, deployment, updates, model governance, and reliable operation for many users and systems. A local prototype does not solve these problems just because the demo looks similar.

But the experiment still shows something useful. The core workflows SAP currently demonstrates are already possible with open-source components:

- Read email and calendar context.
- Work with local files and OneDrive-synchronized files.
- Analyze structured data.
- Create persistent dashboards.
- Generate real Word and PowerPoint files.
- Connect SAP documentation and SAP systems through MCP.
- Add reusable skills and new connectors.

Goose is only one possible base. LibreChat can provide a similar experience in the browser. Microsoft Copilot Studio can combine Microsoft 365 connectors and MCP servers. Claude Desktop can also work with local files, connectors, and skills. The individual building blocks already exist.

The real value of Joule Work Desktop will therefore not come only from having these features. It will come from how well SAP connects them to business context, SAP authorizations, supported applications, and real processes.

For now, I am impressed by the direction. I just could not test the real application yet, so I built the part I wanted to test myself.

<!-- TODO before publication: make the Werkbank repository public, add the final screenshots and cover image, verify the live ARC-1 recording, replace the temporary reference branding, and add the final independent-project and trademark notice. -->

## References and links

- [Joule Work product page](https://www.sap.com/products/artificial-intelligence/joule-work.html)
- [SAP Sapphire 2026 announcement](https://news.sap.com/2026/05/sap-sapphire-keynote-business-ai-platform-power-autonomous-enterprise/)
- [Philipp Herzig's Joule Work Desktop post](https://www.linkedin.com/posts/philipp-herzig_im-excited-to-present-the-new-sap-gui-ugcPost-7488584210123837440-TuTW/)
- [Sebastian Steinhaeuser's meeting-preparation post](https://www.linkedin.com/posts/sebastian-steinhaeuser_prepare-me-for-my-meeting-with-thats-ugcPost-7490314981784154112-QCE4/)
- [SAP Developer News: importing skills into Joule Work Desktop](https://www.linkedin.com/pulse/sap-developer-news-july-16th-2026-thomas-jung-socjf/)
- [SAP AI Skills Library](https://skills.cloud.sap/)
- [Werkbank](https://github.com/marianfoo/werkbank)
- [goose](https://github.com/aaif-goose/goose)
- [ARC-1](https://github.com/arc-mcp/arc-1)
- [SAP Notes MCP server](https://github.com/marianfoo/sap-mcp-servers/tree/main/packages/notes)
