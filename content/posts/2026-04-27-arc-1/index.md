---
title: "Introducing ARC-1: A Secure ADT MCP Server for Enterprise SAP Development"
date: 2026-04-27T09:00:00+02:00
draft: false
description: "Why I built ARC-1 as a secure ADT MCP server for SAP ABAP systems, with central deployment, safe defaults, layered security, per-user identity, and real testing against SAP systems."
tags: ["arc-1", "sap", "abap", "mcp", "agentic", "security", "btp", "development", "ai-abap-development-series"]
categories: ["projects"]
author: "Marian Zeis"
showToc: false
cover:
  image: "arc-1-cover.png"
  alt: "Diagram showing VS Code, Eclipse, Cursor, and Microsoft Copilot connecting through ARC-1 as a centrally deployed ADT MCP gateway on SAP BTP or an own server to ABAP systems on-premise, private cloud, and SAP BTP ABAP Environment."
  relative: true
images:
  - "arc-1-cover.png"
keywords: ["ARC-1", "ADT MCP server", "secure SAP MCP server", "ABAP MCP", "enterprise SAP AI", "principal propagation", "SAP BTP MCP"]
---

Series note: This post is part of my [AI ABAP development series](/tags/ai-abap-development-series/), where I go from AI development in general, to ABAP-specific problems, and then to ARC-1.

In the [first post of this series](https://blog.zeis.de/posts/2026-04-20-how-i-use-ai/), I wrote about context and how I use AI in development. In the [previous post](https://blog.zeis.de/posts/2026-04-22-ai-abap-development/), I then moved that discussion into ABAP and ended more or less with one question: what would an ADT MCP setup need to look like if you take control, identity, and security seriously from the beginning?

This post is my current answer to that question. It is called [ARC-1](https://github.com/arc-mcp/arc-1) (ABAP Relay Connector, pronounced arc one [ɑːrk wʌn]), and yes, it is another ADT MCP server. But the important difference is not that it can talk to ADT at all. Other projects already showed very well that this is possible and useful. The difference is the architecture and the focus, which is also why the [ARC-1 documentation](https://docs.arc-1-mcp.com/) spends a lot of space on security, authentication, deployment, and operations, not only on the tool list.

## Why ARC-1 had to exist

Luckily, the community already did a lot of the hard work before ARC-1. [Marcello Urbani's abap-adt-api](https://github.com/marcellourbani/abap-adt-api) gave many TypeScript projects the foundation to work with ADT APIs at all, which are still not really documented in a useful way. Projects like [oisee/vibing-steampunk](https://github.com/oisee/vibing-steampunk), [fr0ster/mcp-abap-adt](https://github.com/fr0ster/mcp-abap-adt), and [DassianInc/dassian-adt](https://github.com/DassianInc/dassian-adt) already proved that MCP and ABAP development can work in practice and can be very useful. And [Wouter Lemaire's btp-sap-odata-to-mcp-server](https://github.com/lemaiwo/btp-sap-odata-to-mcp-server) was also important for me, because it already showed a BTP-deployed and centrally managed direction much earlier, and Wouter also helped me during the ARC-1 implementation.

So ARC-1 is not me claiming that nobody solved this before. For me it is more this: the others already proved the technical possibility, and ARC-1 is my attempt to close the enterprise gap. That gap is the same one I described in the last post. In ABAP, the hard part is not only getting context into the model. It is that context access, write access, and control are tied very closely together in a real SAP landscape.

That is why I did not want to build just another local developer tool that happens to speak MCP. I wanted to build a secure ADT MCP server with a clearer security concept, more central control, and an architecture that fits better into enterprise SAP environments.

## Central instead of local

For me this is probably the biggest architectural difference. Most current MCP ADT setups are still mainly local. The server runs on the developer laptop, gets configured there, stores credentials there, and then talks directly to the SAP system from there.

That is fine for trying things out. It is also fine for fast experimentation. And to be clear, ARC-1 can also run locally. That is useful for tests, local development, and simply trying the server out. But local developer setup is not the main story I care about here. The main story is central deployment.

That means one managed ARC-1 instance per SAP system, with central configuration, central security settings, central logging, and a clear operational owner. That can run on a company server, in Docker, or ideally on SAP BTP Cloud Foundry. The [architecture documentation](https://docs.arc-1-mcp.com/architecture/) goes into the technical flow in more detail, but I will go much deeper into the BTP side in the next post, because that deserves its own post.

For me BTP is especially interesting here because it lets you reuse things that already exist in many companies anyway: XSUAA, destinations, Cloud Connector, audit services, role assignment, and the usual BTP login flow. Then the developer mostly just needs the MCP URL and the standard login, while admins and authorization teams keep control in the place where they already work.

I also do not think this is only an SAP-specific thought. Salesforce is already moving in a similar direction with [hosted MCP servers](https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/hosted-mcp-servers-overview.html) and [Headless 360](https://www.salesforce.com/news/stories/salesforce-headless-360-announcement/), where more of the platform is exposed as APIs, MCP tools, or CLI commands. To me that confirms that enterprise MCP is a platform and governance topic, not only a developer convenience topic.

The reason this matters is simple. If the MCP server sits only on the laptop of an individual developer, then the architecture is also controlled there. That is exactly the part I do not find convincing for enterprise usage.

## Two auth hops matter

One thing that became very clear while building ARC-1 is that there are really two completely different authentication questions. The first one is who is allowed to talk to the MCP server at all. The second one is as which user the MCP server talks to the SAP system.

That sounds obvious, but many discussions around MCP servers blur those two things together. In ARC-1, these are treated as two separate hops: `MCP client -> ARC-1` and `ARC-1 -> SAP`. This matters because the architecture becomes much clearer after that.

For the first hop, ARC-1 can use things like API keys, OIDC/JWT, or [XSUAA OAuth](https://docs.arc-1-mcp.com/enterprise-auth/), depending on how and where it is deployed. For the second hop, ARC-1 can talk to SAP with Basic Auth, BTP service keys, or with [Principal Propagation](https://docs.arc-1-mcp.com/principal-propagation-setup/), depending on the target landscape.

That split is very important for enterprise usage, because it lets you separate client access control from SAP identity handling instead of hiding both behind one local config file. It also makes it easier to support different use cases. If ARC-1 is used more like a backend connector for an automation, an API key may be totally fine. If real per-user identity matters, then OAuth or XSUAA plus Principal Propagation is the much more interesting setup.

## Safe by default, not allow all by default

The next big difference is that ARC-1 starts from the assumption that the default should be restrictive. Out of the box ARC-1 is read-only. It blocks free SQL. It blocks named table preview. Transport reads such as list, get, check, and history remain available, but transport mutations require both writes and transport writes to be explicitly enabled. And even if writing is enabled, writes are still restricted to `$TMP` unless packages are explicitly allowed.

That last point is important to me. Yes, it makes the first setup a bit less magical. Sometimes you need to configure one more thing. But I prefer that over accidentally giving an AI assistant full write access to transportable packages because one flag was too broad.

ARC-1 also has an action deny list, package restrictions, and safety profiles including `viewer`, `viewer-data`, `viewer-sql`, `developer`, `developer-data`, `developer-sql`, and `admin`. So there is not only one on or off switch. For SAP development that feels much more realistic to me than a server that starts by allowing everything and then hopes people will restrict it later.

## Layered security, not just one switch

This also leads to the next point. For me, security here is not one boolean setting. It is several layers on top of each other.

At the ARC-1 level there is the server safety configuration itself: read-only mode, blocked SQL, package restrictions, the action deny list, and transport gates. Then there is the identity and role layer on top, for example via OIDC or XSUAA scopes and roles. And then there is still the SAP system itself with its own authorization objects and checks.

That means all of these layers have to allow something before it actually happens. If ARC-1 is configured read-only, then even a user with a more powerful role still cannot write. If a user has write scope in ARC-1, but the SAP backend authorization is missing, the write still fails.

That is exactly how I want it. ARC-1 should not replace SAP authorization. It should add another control layer in front of it.

## Per-user identity matters

This becomes even more interesting once you look at per-user identity. One of the things I wanted very early is that ARC-1 should not force everything through one shared technical SAP user if that can be avoided.

That is why [Principal Propagation](https://docs.arc-1-mcp.com/principal-propagation-setup/) is such an important part of the architecture for me. If Principal Propagation is active, the MCP user identity can flow through ARC-1 and into SAP, so that the action runs with the real SAP user and the real SAP authorization of that person. I already tested this and it works.

That is important not only because it is cleaner technically. It is important because it fits much better into audit, compliance, and real enterprise authorization models. I do not want the whole architecture to end in "trust this one service account and hope nobody asks too many questions later". I want the system to be able to say who actually did what.

## Audit logging is part of the feature, not an afterthought

The same applies to audit logging. If AI is allowed to read from or write to a real SAP system, then logging is not some optional extra feature. It is part of the basic architecture.

ARC-1 emits structured audit events and can integrate with the [BTP Audit Log Service](https://docs.arc-1-mcp.com/security-guide/). That means you can log who called which tool, what happened, and in which request context it happened. Especially on BTP, that gives you a much better compliance story than a local MCP server that mostly lives on one laptop.

For normal hobby tooling this might feel like overkill. For SAP it does not. Especially if the recommended target architecture is BTP, it makes sense to also use the established platform services for logging and identity instead of building a parallel side world around them.

## Not locked into one client

This point is also important to me personally. There are already many useful prompt files, local plugins, slash commands, and client-specific workflows around SAP and ABAP. I do not think that is wrong. A lot of that work is useful and practical.

But that is still a different architecture. Very often the logic, the access, and the credentials live mainly on one laptop and inside one AI client. For enterprise usage I want the opposite.

I want one secure ADT MCP server that can be used from many clients. That can be Claude, [GitHub Copilot](https://github.com/features/copilot), Copilot Studio, IDEs, or later other MCP clients that also support OAuth. In the best case, that can then be combined with Principal Propagation instead of local SAP credentials.

That flexibility matters, because in many companies the default AI developer tooling will not be Claude Code. It will more likely be GitHub Copilot or other centrally managed tools. And I do not want the SAP side of the architecture to depend on one specific AI client. MCP is useful exactly because it decouples those things.

## Testing matters more here than for normal dev tooling

I also want to stress the testing part, because for a project like this it matters a lot.

If an MCP server only works in one perfect demo system, then that is not enough. SAP systems are messy. Different releases behave differently. Different endpoints exist or do not exist. BTP ABAP is different again. And error handling around ADT is not always beautiful.

That is why ARC-1 puts a lot of effort into testing. Right now the project has [3,474 unit tests, a 262-test default integration profile, and a 141-test default E2E profile](https://github.com/arc-mcp/arc-1#testing). The integration and E2E profiles test against live SAP systems, and the E2E tests execute real MCP tool calls against a running ARC-1 server. As a freelancer I obviously do not have access to every possible enterprise landscape, but I do test against real systems. I test against BTP ABAP, the ABAP trial system in Docker, and the older 7.50 trial system.

I also do not test only with one ideal model and one toy example. I try it myself with stronger and weaker models and with workflows that are much closer to reality. That includes things like clean core analysis or creating a full RAP project from nothing, not even a table, up to an activated RAP project you can actually use. A lot of the workflows and feature ideas behind that are also visible in the [ARC-1 skills catalog](https://github.com/arc-mcp/arc-1/blob/main/skills/README.md), because those are more or less the kinds of use cases I want to make work reliably.

For me that is also one of the big lessons from working with SAP tooling in general: if you do not test against real systems, you often only test your assumptions.

## So yes, this is another ADT MCP server

And that is fine. I do not think ARC-1 needs to exist because every other project is wrong. Quite the opposite. The other projects created the category, pushed the ecosystem forward, and showed there is real interest.

At the same time I think ARC-1 is different enough in architecture and focus that it makes sense right now. It is especially different from the angle of secure defaults, central deployment, layered security, per-user identity, and auditability.

And yes, it now also differentiates itself from SAP's official approach. SAP first announced the server in its [November 4, 2025 post about the next era of ABAP development](https://community.sap.com/t5/technology-blog-posts-by-sap/introducing-the-next-era-of-abap-development/ba-p/14260522). Since then, SAP has [made the official ABAP MCP server available in both Eclipse and VS Code](https://community.sap.com/t5/technology-blog-posts-by-sap/abap-ai-chapter-3-we-go-agentic/ba-p/14391469). I think that is good news.

The current difference is architectural. SAP's [configuration guide](https://help.sap.com/docs/abap-cloud/abap-development-tools-user-guide/configuring-adt-mcp-server-ed94320814734d97801f51a5b6deb802) describes the ADT MCP server as a local HTTP server hosted by the IDE and protected with a generated bearer token. ARC-1 can also run locally, but the main direction described in this post remains central deployment, BTP integration, enterprise authentication, per-user backend identity, roles, and audit logging.

SAP also says that a possible standalone shipment of the ABAP Language Server and MCP Server is still under discussion. If reusable standalone components become available, ARC-1 should evaluate using that foundation instead of reimplementing more and more HTTP details on the community side. For now, the official local server and a centrally deployed ARC-1 instance are two existing approaches with different deployment and governance models.

The point is not that my server must win. The point is that different architectures serve different needs, and competition is usually good. It helps people choose, it helps ideas spread, and it gives both SAP and community projects feedback from real use. People can decide whether the official local ADT MCP server, a centrally deployed ARC-1 setup, or both fit their landscape.

## A note on ADT APIs and SAP's new API policy

There is one more point worth separating from the architecture discussion. SAP published a new API policy in April 2026. The [current SAP API Policy is version 4.2026a](https://help.sap.com/doc/sap-api-policy/latest/en-US/API_Policy_latest.pdf). It permits published APIs for their documented use, but says non-published APIs must not be used unless documentation or SAP authorization permits it. It also explicitly restricts API use with generative AI systems that plan, select, or execute sequences of calls outside SAP-endorsed architectures and documented limits. That makes this more than a theoretical support question for SAP customers, partners, and community tools that build on top of SAP development APIs.

For ADT, the publicly available material points to a more nuanced situation. SAP provides an official ADT SDK with JavaDoc, and the ADT download page describes it as a public API to implement or integrate your own tools with SAP's ABAP IDE. There is also an SAP document about creating and consuming RESTful APIs in ADT. This does not imply that every internal `/sap/bc/adt` endpoint is covered by the same support boundary, but it does show that parts of the ADT tooling and communication model are documented and intended for integration scenarios.

Since then, SAP has shipped the ABAP Language Server and MCP Server as parts of Eclipse and VS Code, while a standalone shipment remains under discussion. That does not by itself define the support boundary for every endpoint used by third-party tools. ARC-1's position is therefore deliberately cautious: stay close to documented and discoverable ADT behavior, keep data preview and free SQL off by default, review the SAP policy and the customer's SAP agreement, and ask SAP before production use. The [ARC-1 API Policy and Architecture Alignment](https://docs.arc-1-mcp.com/sap-api-policy-and-architecture/) page covers that position in more detail.

## Why this matters for the next post

In this post I mainly wanted to explain why ARC-1 exists at all and why it looks the way it does.

The next post is where I want to go deeper into the BTP side, because that is where the architecture becomes much more interesting in practice: XSUAA, Destination Service, Cloud Connector, Principal Propagation, and how this can fit into a real enterprise setup instead of just a developer laptop.

## Discuss this post

- [Saptodon](https://saptodon.org/@Mianbsp/116477784495254338)
- [Bluesky](https://bsky.app/profile/marian.zeis.de/post/3mkikvj4aos2k)
- [LinkedIn](https://www.linkedin.com/posts/marianzeis_introducing-arc-1-an-enterprise-adt-mcp-activity-7454748910893457408-M8BU)

## References & links

- [ARC-1 on GitHub](https://github.com/arc-mcp/arc-1)
- [ARC-1 Documentation](https://docs.arc-1-mcp.com/)
- [ARC-1 Architecture](https://docs.arc-1-mcp.com/architecture/)
- [ARC-1 Authentication Overview](https://docs.arc-1-mcp.com/enterprise-auth/)
- [ARC-1 Security Guide](https://docs.arc-1-mcp.com/security-guide/)
- [How I Use AI for Development and Why Context Matters](https://blog.zeis.de/posts/2026-04-20-how-i-use-ai/)
- [ABAP and Agentic AI: The Hidden Problem in Real Projects](https://blog.zeis.de/posts/2026-04-22-ai-abap-development/)
- [Marcello Urbani: abap-adt-api](https://github.com/marcellourbani/abap-adt-api)
- [Wouter Lemaire: btp-sap-odata-to-mcp-server](https://github.com/lemaiwo/btp-sap-odata-to-mcp-server)
- [oisee/vibing-steampunk](https://github.com/oisee/vibing-steampunk)
- [fr0ster/mcp-abap-adt](https://github.com/fr0ster/mcp-abap-adt)
- [DassianInc/dassian-adt](https://github.com/DassianInc/dassian-adt)
- [ARC-1 Skills Catalog](https://github.com/arc-mcp/arc-1/blob/main/skills/README.md)
- [Introducing the Next Era of ABAP Development](https://community.sap.com/t5/technology-blog-posts-by-sap/introducing-the-next-era-of-abap-development/ba-p/14260522)
- [ABAP AI - Chapter 3: We Go Agentic!](https://community.sap.com/t5/technology-blog-posts-by-sap/abap-ai-chapter-3-we-go-agentic/ba-p/14391469)
- [Configuring the ADT MCP Server](https://help.sap.com/docs/abap-cloud/abap-development-tools-user-guide/configuring-adt-mcp-server-ed94320814734d97801f51a5b6deb802)
- [SAP Model Context Protocol Tools](https://help.sap.com/docs/abap-cloud/abap-development-tools-user-guide/model-context-protocol-tools)
- [SAP API Policy](https://help.sap.com/doc/sap-api-policy/latest/en-US/API_Policy_latest.pdf)
- [ARC-1 API Policy and Architecture Alignment](https://docs.arc-1-mcp.com/sap-api-policy-and-architecture/)
- [ABAP Development Tools SDK](https://tools.hana.ondemand.com/#abap)
- [Create and Consume RESTful APIs in ADT](https://www.sap.com/documents/2013/04/12289ce1-527c-0010-82c7-eda71af511fa.html)
- [ABAP Development Tools for VS Code discussion](https://community.sap.com/t5/technology-blog-posts-by-sap/abap-development-tools-for-vs-code-everything-you-need-to-know/bc-p/14263439/highlight/true#M186133)
