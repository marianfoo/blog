---
title: "ARC-1 1.0: One Deployment, Multiple SAP Systems"
date: 2026-08-03T15:00:00+02:00
draft: false
description: "ARC-1 1.0 adds multi-system support on SAP BTP, 22 reusable SAP skills, extensions, and better enterprise guidance shaped by community feedback."
tags: ["arc-1", "sap", "abap", "mcp", "btp", "multi-system", "skills", "segw", "rap", "open-source", "ai-abap-development-series"]
categories: ["projects"]
author: "Marian Zeis"
showToc: false
cover:
  image: "images/linkedin-arc-1-1-0.png"
  alt: "ARC-1 version 1.0 release cover showing the enterprise-ready open-source ADT MCP connected to ECC, S/4HANA, BTP ABAP Environment, and S/4HANA Cloud Public Edition."
  relative: true
images:
  - "images/linkedin-arc-1-1-0.png"
keywords: ["ARC-1 1.0", "SAP ADT MCP server", "SAP BTP multi-system MCP", "ARC-1 skills", "SEGW to RAP", "ABAP AI development", "ARC-1 extensions", "SAP ABAP MCP server"]
---

[ARC-1 1.0 is here](https://github.com/arc-mcp/arc-1/releases/tag/v1.0.0).

When I published the [first ARC-1 post](/posts/2026-04-27-arc-1/), I explained why I built an MCP server for ABAP development and why security has to be part of it from the beginning. This post is not another deep dive into every tool. The [release notes](https://docs.arc-1-mcp.com/release-notes/) already do that.

For version 1.0 I want to focus on what really changed: ARC-1 became more stable, it can serve multiple SAP systems from one BTP deployment, the BTP and security setup is much better documented, and the project is no longer only one repository.

Most of this happened because people used ARC-1, asked difficult questions, reported problems, opened issues and pull requests, sent me private messages, and invited me to Teams meetings about their plans and experiences. That is the most important part of this release.

## What version 1.0 means

Version 1.0 does not mean ARC-1 is finished. It means there is now a stable base.

ARC-1 now has a clearer scope. It is a controlled connection between AI assistants and ABAP systems. It can run locally for one developer or centrally on SAP BTP for a team. It supports classic on-premise ABAP, S/4HANA, BTP ABAP Environment, and S/4HANA Cloud Public Edition.

It stays read-only by default. Changing code, reading business data, running SQL, changing transports, or using Git has to be enabled separately. This makes it possible to start small and only allow more when a team is ready.

The new multi-system mode is still marked as experimental because parts of the setup and behavior may change. But it can already be used and is running in productive BTP environments, not only in my own setup.

That is what 1.0 means to me: not that every possible ADT feature exists, but that the foundation, operating model, and safety boundaries are clear enough to build on.

## This release was built through feedback

The first versions were mostly based on my own systems and workflows. That changed quickly. SAP systems, releases, login setups, networks, and transport processes are too different to understand from one landscape.

Public issues and pull requests brought real system shapes into the project. A few examples:

- [Wouter Lemaire added the first BTP Cloud Foundry deployment](https://github.com/arc-mcp/arc-1/pull/97), followed it with [deployment and write fixes](https://github.com/arc-mcp/arc-1/pull/107), and continued to give very practical guidance on BTP, destinations, and how a shared ARC-1 service should be operated.
- Sami Bouguerra contributed [NetWeaver 7.50 probe fixtures and cookie handling](https://github.com/arc-mcp/arc-1/pull/170), then fixed cases where activation looked successful although SAP had not activated the object in [PR #179](https://github.com/arc-mcp/arc-1/pull/179).
- Clément Ringot made BTP login more reliable across deployments in [PR #212](https://github.com/arc-mcp/arc-1/pull/212) and [PR #267](https://github.com/arc-mcp/arc-1/pull/267), and fixed Cloud Connector response handling in [PR #440](https://github.com/arc-mcp/arc-1/pull/440).
- [Geert-Jan Klaps added S/4HANA Public Cloud support](https://github.com/arc-mcp/arc-1/pull/524). I do not have access to such a system myself, so his contribution made it possible to add and verify this landscape in ARC-1.
- Community pull requests added table queries, newer package creation, safer transport handling, better BTP login, configurable server names, and cookie rotation. You can find them in the repository's [pull requests](https://github.com/arc-mcp/arc-1/pulls?q=is%3Apr+is%3Amerged).

Not every useful contribution was code. Issues such as [multi-system connections](https://github.com/arc-mcp/arc-1/issues/531) and [how to structure several systems on BTP](https://github.com/arc-mcp/arc-1/issues/377) changed the architecture and documentation. Reports from older systems improved release detection and fallbacks. Questions from Basis and security people forced me to make assumptions explicit instead of hiding them in configuration examples.

I also received many private messages and joined Teams meetings about ARC-1. Some people explained how their teams want to deploy it on BTP and walked me through their real landscape and requirements. Others pointed out security issues, unclear documentation, or places where the safety boundaries were not strong enough. These conversations directly improved login, error handling, audit information, package restrictions, user identity, and the deployment guides.

Thank you especially to everyone who reported a security concern privately. That is exactly how an open-source security process should work. ARC-1 now has a public [security policy](https://github.com/arc-mcp/arc-1/blob/main/SECURITY.md), private vulnerability reporting, automated checks for code and dependencies, container checks, and an inventory of the software included in each release.

## One ARC-1 instance, multiple SAP systems

The biggest addition in version 1.0 is the experimental [multi-system mode](https://docs.arc-1-mcp.com/multi-target-setup/).

You can now deploy one ARC-1 application on SAP BTP Cloud Foundry and attach several SAP systems or clients through destinations in the same subaccount. An administrator chooses which destinations belong to ARC-1. It does not connect to every destination by accident.

This is already used in productive BTP environments. Experimental in this case means that configuration and behavior can still change as more landscapes use it. It does not mean that the feature is only a local proof of concept or that people cannot use it today.

Each system and client gets its own MCP address. There is also an optional combined connection for tasks that really need several systems. A system-specific address is the safer choice for normal work because the conversation is already connected to the correct target.

Keeping the real user identity is the recommended setup. A user logs in on BTP and the identity is forwarded to SAP. SAP then checks the same authorizations the person already has. A shared technical user is possible for special cases, but it gives less clear responsibility and needs more care.

This feature started with community requests and Wouter's [first multi-backend implementation](https://github.com/arc-mcp/arc-1/pull/543). His code and BTP experience gave the final design important groundwork. The production-focused design, security review, tests, and administrator documentation then landed in [PR #579](https://github.com/arc-mcp/arc-1/pull/579).

## The biggest changes in short

I do not want to explain every feature here. These are the areas that matter most for 1.0:

- **Safer operation:** ARC-1 starts read-only. Higher-risk actions are separate choices, SAP still decides what the user may do, and teams get limits and audit information for shared use.
- **More SAP compatibility:** testing and fixes now cover older NetWeaver systems, several S/4HANA releases, ABAP Platform 2025, BTP ABAP Environment, and S/4HANA Cloud Public Edition.
- **Better BTP guidance:** the [BTP overview](https://docs.arc-1-mcp.com/btp-overview/), [Cloud Foundry guide](https://docs.arc-1-mcp.com/btp-cloud-foundry-deployment/), [user identity guide](https://docs.arc-1-mcp.com/principal-propagation-setup/), updates, rollback, destinations, roles, and multi-system operation are now documented as one path.
- **Reusable workflows:** 22 included skills cover RAP, tests, migrations, Clean Core analysis, transport reviews, system documentation, and more.
- **More checks before a release:** ARC-1 runs automated tests against the code and real SAP systems, checks dependencies and containers, and publishes information about what is included in a release.

For the exact technical list, including fixes for transport state, ABAP object types, BTP token exchange, tracing, and protocol compatibility, use the [release notes](https://docs.arc-1-mcp.com/release-notes/) and the [GitHub v1.0.0 release](https://github.com/arc-mcp/arc-1/releases/tag/v1.0.0).

## Skills for complete SAP tasks

ARC-1 1.0 includes 22 skills. A skill is a reusable workflow for an AI assistant. It gives the assistant a tested way to approach a larger task instead of relying on one large prompt.

The included skills cover creating RAP services and logic, ABAP and CDS tests, analytical models and queries, explaining and documenting existing code, finding slow SQL, Clean Core and S/4HANA migration work, unused-code checks, transport overviews and reviews, and modernizing legacy UI5 applications. There are also helpers to understand a system first, create a local ABAP mirror, and review an AI session. The [full skills catalog](https://docs.arc-1-mcp.com/skills/) has the complete list and installation options for Claude Code, GitHub Copilot, Cursor, Codex, and other assistants.

The [SEGW-to-RAP skill](https://github.com/arc-mcp/arc-1/tree/main/skills/migrate-segw-to-rap) deserves a special mention. It reads an existing SEGW OData V2 service, including its model and custom code, and guides the move to a modern RAP V4 service. My [SEGW-to-RAP post](/posts/2026-05-11-segw-to-rap/) got one of the biggest responses of the whole ARC-1 series. That was a clear signal that many teams are not only interested in creating something new. They also need practical help to modernize the large amount of existing SAP applications.

## Extensions for your own SAP APIs

ARC-1 will never include every custom API or company-specific endpoint. Forking the complete server for one internal tool is also difficult to maintain.

The [extension framework](https://docs.arc-1-mcp.com/extensions/) gives you another option. It lets you add your own tools and reuse the SAP connection, safety checks, and audit path of the ARC-1 instance. This can be useful for an internal service or any API that is not part of the standard ARC-1 tools.

The [extension sample](https://github.com/arc-mcp/arc-1-extension-sample) shows a simple configuration option and a code option. It also shows the safety limits. An extension cannot give itself more access than the ARC-1 instance already has, and changes still need to be enabled explicitly. Code extensions run inside ARC-1, so they should be reviewed like any other dependency.

[LISA](https://github.com/ClementRingot/LISA) is already a useful real example. It provides SAP translation tools as a standalone MCP server and as an ARC-1 extension. This proves both paths can work: build a separate focused service, or attach the capability to an existing ARC-1 deployment.

## Reusing the BTP authentication stack

Login and keeping the correct SAP user were some of the hardest parts of ARC-1. Other SAP MCP servers need the same foundations, so this code is now available as the separate [@arc-mcp/xsuaa-auth](https://www.npmjs.com/package/@arc-mcp/xsuaa-auth) package.

It provides the core pieces for deploying an MCP server to SAP BTP Cloud Foundry: login through XSUAA, reuse of BTP destinations, connections through Cloud Connector, and forwarding the real user to SAP. A project can reuse this setup and keep its own focused SAP API instead of copying the full ARC-1 server.

ARC-1 uses the package itself. [LISA](https://github.com/ClementRingot/LISA) and [ROSA](https://github.com/ClementRingot/ROSA) use it as well, and [BW Modeling MCP](https://github.com/dnic-dev/bw-modeling-mcp) now uses it for its central SAP BTP Cloud Foundry setup. For me this is an important part of the release. The value of ARC-1 is not only the number of ABAP tools. The deployment and security principles can now help other projects too.

## A new home for the project

ARC-1 moved from my personal GitHub account to the [arc-mcp organization](https://github.com/arc-mcp). There is also a dedicated [landing page](https://arc-1-mcp.com/), full documentation at [docs.arc-1-mcp.com](https://docs.arc-1-mcp.com/), and a [live replay demo](https://live-arc-1.arc-1-mcp.com/) that works without a SAP system, credentials, or a live LLM.

The organization now contains the main product, reusable components, experiments, and demos that are still active:

- [arc-1](https://github.com/arc-mcp/arc-1): the main SAP ADT MCP server.
- [xsuaa-auth](https://github.com/arc-mcp/xsuaa-auth): reusable XSUAA, OAuth, and BTP Principal Propagation.
- [arc-1-extension-sample](https://github.com/arc-mcp/arc-1-extension-sample): examples for custom ARC-1 tools.
- [adt-ls](https://github.com/arc-mcp/adt-ls): a TypeScript SDK for SAP's headless ADT language server.
- [arc-1-lsp](https://github.com/arc-mcp/arc-1-lsp): an experimental MCP server built on that language-server path.
- [arc1-adt-abap-mcp-ext](https://github.com/arc-mcp/arc1-adt-abap-mcp-ext): an Eclipse extension adding read-only tools to SAP's ADT MCP server.
- [arc-1-abap-cicd-review](https://github.com/arc-mcp/arc-1-abap-cicd-review): an ABAP review workflow with GitHub Actions, abaplint, AI review, and live SAP checks.
- [arc1-transport-review-poc](https://github.com/arc-mcp/arc1-transport-review-poc): a proof of concept for reviewing SAP transports through pull requests.
- [arc-1-segw-to-rap](https://github.com/arc-mcp/arc-1-segw-to-rap): the SEGW, RAP, UI5, and Fiori elements modernization demo.
- [arc-1-mcp.com](https://github.com/arc-mcp/arc-1-mcp.com): the source of the landing page.
- [live-arc-1](https://github.com/arc-mcp/live-arc-1): the source of the interactive replay demo.

Not every repository has the same maturity. ARC-1 is the stable core. Some projects are reusable packages, some are beta, and some are intentionally proofs of concept. Keeping them separate makes this more visible and lets each idea develop without making the main server bigger.

## Where to start

If you are new to ARC-1, use the [quickstart](https://docs.arc-1-mcp.com/quickstart/) with a development or sandbox system and start read-only. The live demo is useful if you first want to see how the workflows and tool calls look.

For a team deployment, start with the [BTP overview](https://docs.arc-1-mcp.com/btp-overview/). Decide the topology, identity model, destinations, and responsibilities before enabling more capabilities. Principal Propagation should be the normal choice when SAP needs to see the human user.

If you already run ARC-1, follow the [update guide](https://docs.arc-1-mcp.com/updating/) and review the [release notes](https://docs.arc-1-mcp.com/release-notes/). For production, pin a version instead of using `latest`, keep the first acceptance test read-only, and review the current SAP API policy and your own agreements before enabling data preview or free SQL.

## ARC-1, SAP's MCP server, and the API policy

SAP now also provides its own ABAP MCP server as part of the ABAP Development Tools. I do not see this as an either-or decision.

SAP's server is the natural choice for a developer who works inside VS Code or Eclipse and wants to reuse the existing IDE connection. ARC-1 has a different focus. It can run as a shared service on BTP, serve different AI clients and team workflows, cover classic and modern ABAP use cases, and give administrators one place for access rules and audit information. Many teams can use both.

The detailed [ARC-1 and SAP ABAP MCP Server comparison](https://docs.arc-1-mcp.com/arc-1-vs-sap-abap-mcp-server/) explains where each option fits, where each one is stronger, and where each one has limits. It is meant as a decision guide, not as a sales comparison.

More important for a wider rollout is the [SAP API Policy and architecture guide](https://docs.arc-1-mcp.com/sap-api-policy-and-architecture/).

ARC-1 uses the ADT interfaces behind SAP's ABAP development tools. These interfaces have been used by SAP and third-party developer tools for many years, but the ADT web endpoints are not listed as published APIs in the SAP Business Accelerator Hub. SAP's current API policy also talks directly about access by generative AI and autonomous agents.

At the same time, SAP has published an architecture for third-party MCP servers. ARC-1 is close to this architecture, especially when it runs on SAP BTP Cloud Foundry with BTP login, destinations, Cloud Connector, the real SAP user identity, traffic limits, and audit logging. This is a good technical fit, but it is not by itself a legal approval for every customer and every landscape.

My recommendation is simple. Start in development or test, start read-only, and keep SAP authorizations in control. Before a broader or production rollout, ask your SAP contact whether your agreement allows third-party tools to use the ADT endpoints in this way. The policy and SAP guidance can change, so check the current documents instead of relying only on this post.

## Thank you

ARC-1 1.0 is not the result of one large feature. It is the result of many small reports, tests, discussions, fixes, and reviews.

Thank you to everyone who opened an issue or pull request, tested another SAP release, shared a BTP setup, challenged a security decision, built an extension, tried the documentation, or sent a private message. Even when I could not implement an idea directly, the feedback helped make the project clearer and safer.

Feedback is still greatly appreciated. Open an [issue](https://github.com/arc-mcp/arc-1/issues) when something does not work or the documentation is unclear. Send a pull request when you have a fix or improvement. A private message is also welcome, especially when you want to share details about a real landscape or raise a security concern.

Version 1.0 is a milestone, not the end. Now there is a stable base, public documentation, a clearer security process, and a growing set of reusable projects around it.
