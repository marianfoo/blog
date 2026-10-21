---
title: "Build a Custom MCP Server for Joule Work Desktop with XSUAA"
date: 2026-10-21T17:25:36+02:00
lastmod: 2026-10-22T00:39:51+02:00
draft: false
slug: "custom-mcp-server-joule-work-desktop-xsuaa"
description: "Build custom MCP servers for Joule Work Desktop with xsuaa-auth: OAuth sign-in, per-user access, and central authorization on SAP BTP."
tags: ["joule-work-desktop", "mcp", "xsuaa", "xsuaa-auth", "btp", "principal-propagation", "sap", "ai-abap-development-series"]
categories: ["projects"]
author: "Marian Zeis"
showToc: false
cover:
  image: "images/jwd-custom-mcp-architecture-v3.png"
  alt: "Custom MCP servers on SAP BTP, following SAP's architecture with xsuaa-auth. Joule Work Desktop connects to your MCP server inside SAP BTP, then to SAP systems."
  relative: true
  hiddenInSingle: false
images: ["images/jwd-custom-mcp-architecture-v3.png"]
---

You have a spreadsheet with business-partner IDs and want to check the names against SAP. In **Joule Work Desktop (JWD)**, a useful request would be:

> Look up business partner 1000001 in SAP and compare its name with the entry in this spreadsheet. Tell me what differs, include the source system and retrieval time, and leave SAP unchanged.

A **custom MCP server for Joule Work Desktop** can give the assistant the specific SAP tool it needs for that task. Your developers decide what the tool can read, whose permissions it uses, and how much work it may send to SAP.

**I developed [`@arc-mcp/xsuaa-auth`](https://github.com/arc-mcp/xsuaa-auth) to make that authentication layer reusable.** It connects MCP servers to SAP's Authorization and Trust Management service, XSUAA, and provides helpers for calling SAP through destinations with the signed-in user's context.

The goal is a shared MCP service with **individual user access and centrally managed permissions**. The library helps implement the authentication part of [SAP's documented architecture for a custom MCP server on BTP](https://architecture.learning.sap.com/docs/ref-arch/137800#pattern-2-custom-mcp-server-on-sap-btp). SAP systems are the main example here, but the same sign-in foundation can protect MCP tools for other business applications and internal services.

## What a custom MCP server adds to JWD

MCP stands for Model Context Protocol. It gives AI applications a common way to discover and call tools. In JWD, an MCP server is available as a **connector**, which you select for a conversation. SAP's [connector documentation](https://help.sap.com/docs/JOULE_WORK_DESKTOP/3fec5cf19c7040baa71e42a88099180e/8c11ae6508de4b9ea9bea100e106ecfd.html?locale=en-US) explains the relationship.

Our example would offer a tool called `get_business_partner_summary`. It takes one business-partner ID and retrieves the fields needed for the comparison. JWD can then use that result alongside the spreadsheet you provide.

The same approach could support reading a delivery status, checking an order, or retrieving a result from a company-specific service. Each needs an appropriate API and its own tool implementation.

**Start with a question your team already knows how to answer in SAP.** That makes it easier to check whether the connector returns the right information and whether the assistant explains it accurately.

## Following SAP's architecture for custom MCP servers

SAP documents [Pattern 2: Custom MCP Server on SAP BTP](https://architecture.learning.sap.com/docs/ref-arch/137800#pattern-2-custom-mcp-server-on-sap-btp) for organizations that want to build and operate their own server. Its guidance calls for authenticated connections, controlled access, protection of backend API quotas, and reliable operation.

{{< figure src="images/sap-custom-mcp-reference-architecture.jpg" alt="SAP Architecture Center diagram showing a custom MCP server inside the SAP BTP subaccount, connected to external AI clients and SAP solutions, with identity trust shown separately." width="940" caption="SAP's reference architecture. The **Custom MCP Server** box inside BTP is the part this article builds on. Screenshot captured on 22 October 2026; diagram dated 8 June 2026. Source: [SAP Architecture Center](https://architecture.learning.sap.com/docs/ref-arch/137800#architecture), © SAP SE or an SAP affiliate company and contributors ([Apache 2.0](https://github.com/SAP/architecture-center#Apache-2.0-1-ov-file))." >}}

**xsuaa-auth helps turn the authentication part of that architecture into reusable code.** It gives your server an XSUAA sign-in flow, token validation, and helpers for destination-based user propagation. Your team can build on those components while defining the business tools and their permissions.

The complete architecture also needs input validation, rate limits, monitoring, and credential management. SAP additionally calls for identifying the calling agent, retaining the human user's context, and narrowing downstream credentials to the tool's needs. User authentication alone does not establish all of those properties. The library is a building block for this design, not certification of a finished server.

For example, checking a spreadsheet can trigger many backend calls. Per-user limits keep capacity available to colleagues, while a shared request budget protects the SAP API across all server instances, including retries. Your application or infrastructure enforces those limits and explains to the user when they need to wait.

SAP also describes [MCP Gateway in Integration Suite](https://architecture.learning.sap.com/docs/ref-arch/137800#mcp-gateway-in-sap-integration-suite) for managed governance. With a custom deployment, your organization owns the controls and must verify its API use against SAP's [API Policy](https://help.sap.com/doc/sap-api-policy/latest/en-US/API_Policy_latest.pdf).

## What using the connector would feel like

Your IT team would deploy and configure a shared server. You would use the connector provided by your organization, sign in with your own work account, and select it in the conversation where you need information. Everyone can use the same endpoint while receiving results according to their own permissions.

For the business-partner example, the result could be as small as this:

| Field | Illustrative result |
| --- | --- |
| Business partner | 1000001 |
| Name | Demo Industrial Components |
| Category | Organization |
| Source | S4-DEMO |
| Retrieved | 21 October 2026, 12:00 UTC |

These are synthetic values. The point is to give the assistant enough information to answer the question, with a source you can check. A name comparison does not require every address, contact, and bank detail associated with the business partner.

This first tool would only read data. Changing records is a separate capability that your team can design later, with its own validation and permissions. The server must enforce that distinction even if a prompt asks it to do more.

Returning only the necessary fields also limits what enters the conversation. SAP documents that JWD sends conversation context to AI models through SAP AI Core; see its [security and data privacy guide](https://help.sap.com/docs/JOULE_WORK_DESKTOP/3fec5cf19c7040baa71e42a88099180e/5adde9df7ec7474bb7e406b04d39a2d2.html?locale=en-US).

## Your SAP permissions should travel with the request

The important part of this design is **whose access SAP checks**. This simplified view shows where the library fits:

{{< figure src="images/xsuaa-auth-btp-flow.svg" alt="xsuaa-auth runs inside the custom MCP server on SAP BTP. It connects OAuth sign-in to XSUAA, validates the user's token, and provides destination helpers. The application's tool code calls SAP with destination credentials, and SAP checks the mapped user's permissions." width="1000" caption="Simplified authentication and connectivity view. Green boxes are library code; blue boxes are BTP services. OAuth browser redirects and the on-premise network path are omitted." >}}

**Green boxes are xsuaa-auth code inside your server.** XSUAA handles token issuance and sign-in through the configured identity provider. Your tool uses the library's BTP helpers to obtain destination credentials, then its HTTP client calls the API. On-premise connections can also require Connectivity Service and Cloud Connector, omitted here for clarity. The configured exchange, trust, and user mapping determine the effective backend user.

After the browser's OAuth sign-in, JWD sends authenticated requests to the MCP server on your behalf. With xsuaa-auth configured to require a user, the server validates that user context and the permissions needed for the tool.

For the SAP connection, the destination and trust configuration then obtain the appropriate backend credential for your mapped SAP user. SAP applies that user's authorizations for the selected API. This is the goal of **principal propagation**: retaining your identity through the connection. The user context is preserved through the supported exchange or propagation flow; the incoming MCP token is not simply forwarded to every backend.

Suppose you can read a test business partner but a colleague cannot. The connector should preserve that difference. A successful login must not cause both of you to read SAP through a shared account with broader permissions.

There are two checks to keep distinct. The connector checks whether you may use its tool. SAP checks whether your mapped user may access the requested business data through that API. Your developers and administrators configure both, then verify them with users who have different permissions.

For a JWD user, the expected experience is straightforward: sign in through the browser, request information, and receive either the permitted result or a clear explanation that access was denied. You do not paste a SAP password into the conversation.

## Why I built xsuaa-auth

I extracted xsuaa-auth from ARC-1's authentication stack so other MCP servers could reuse it. Connecting a new business tool should not mean rebuilding the OAuth sign-in, token validation, and user-context handling each time.

The package supplies those building blocks for **Node.js MCP servers using Express and the TypeScript MCP SDK**. Its separate BTP helpers resolve destinations with the verified user's context. A server does not need to call SAP to use the authentication layer: it could expose an internal knowledge service, a document lookup, or another company's API.

In that case, XSUAA can still govern who may use the MCP service. Access to the downstream application follows that application's own authentication and permissions. Preserving the same user all the way to a non-SAP backend requires a supported identity flow there too.

A destination is the centrally configured connection to a target system, including its authentication method. For an on-premise SAP system, that connection can involve Connectivity Service and Cloud Connector. Cloud targets use the authentication flow supported by their API and configuration.

This gives developers an authentication foundation while leaving the business tool in their own application:

| Component | Its job |
| --- | --- |
| Joule Work Desktop | Uses the connector's tools in your conversation |
| xsuaa-auth and BTP identity services | Handle OAuth sign-in and token validation; BTP helpers support credentials for configured destinations |
| Your custom MCP server | Defines the tools, checks permissions, calls the business API, and controls request volume |
| Target application, SAP in this example | Applies its API authorization rules and returns the requested data |

The [library documentation](https://github.com/arc-mcp/xsuaa-auth#readme) describes the authentication and destination APIs. The package does not supply your business tools, a complete MCP server, or business-API rate limiting. Those remain part of the application your team builds.

## MCP servers already using xsuaa-auth

The library is already used beyond ARC-1. These public projects declare it as a dependency and integrate it into their server code:

| MCP server | What it helps with | Where xsuaa-auth is used |
| --- | --- | --- |
| [ARC-1](https://github.com/arc-mcp/arc-1) | ABAP development and investigation | [OAuth and token validation](https://github.com/arc-mcp/arc-1/blob/main/src/server/http.ts), alongside BTP connectivity helpers |
| [BW Modeling MCP](https://github.com/dnic-dev/bw-modeling-mcp) | SAP BW/4HANA modeling and analysis | [HTTP authentication](https://github.com/dnic-dev/bw-modeling-mcp/blob/main/src/http.ts) and destination-based connections, with principal propagation as a configured option |
| [calmcp](https://github.com/consetto/calmcp) | SAP Cloud ALM projects, tasks, and analytics | [Authentication for its remote HTTP transport](https://github.com/consetto/calmcp/blob/main/src/transport/http.ts) through the library's setup function |
| [LISA](https://github.com/ClementRingot/LISA) | Reading and maintaining SAP object translations | [OAuth and token verification](https://github.com/ClementRingot/LISA/blob/main/packages/server/src/server/http.ts) in its standalone server, plus BTP destination helpers |
| [ROSA](https://github.com/ClementRingot/ROSA) | Finding released SAP objects and alternatives for ABAP Cloud | [Optional XSUAA/OIDC authentication](https://github.com/ClementRingot/ROSA/blob/main/src/middleware/oauth.ts) for its hosted service |

That is the reuse I wanted: different tools, with a shared authentication foundation. I checked these integrations on 21 October 2026. Their deployment options and downstream identities differ; using the package does not by itself mean every backend request runs as the individual user, or that every project has been tested with JWD.

## Central administration on BTP, individual access for users

With a shared MCP server on BTP, administrators can manage the deployment, target destinations, and application access centrally. Users connect to that managed service with their own identity; they do not each need to operate a server or configure backend credentials.

Developers define the application's permissions, such as access to a read-only lookup. Administrators group them into **BTP role collections** and assign them to users or identity-provider groups. The MCP server enforces the corresponding permissions on requests. SAP documents this in [assigning role collections to users or user groups](https://help.sap.com/docs/btp/sap-business-technology-platform/assigning-role-collections-to-users-or-user-groups?locale=en-us).

For example, an organization could make the business-partner tool available to its customer-service group. Knowing the connector URL would not be enough to use it: a caller would need the required application permission, and the backend would still check that person's mapped SAP access.

JWD also supports organization-provided, **Admin-Managed connectors**, as described in its [connector guide](https://help.sap.com/docs/JOULE_WORK_DESKTOP/3fec5cf19c7040baa71e42a88099180e/8c11ae6508de4b9ea9bea100e106ecfd.html?locale=en-US#managing-connectors). That gives users a centrally supplied connection. BTP governs access to the service; JWD and your organization's client policies govern which connectors users can add or use. xsuaa-auth supplies the server's authentication layer, not a desktop-wide connector policy.

## Which SAP systems can be connected

The approach can be adapted to these landscapes, but the API and identity setup depend on the target:

| SAP landscape | What your team needs to establish |
| --- | --- |
| ECC | A suitable API for the release, plus the connection and user mapping, often through Cloud Connector |
| S/4HANA on-premise or Private Edition | The business API and, for the Cloud Connector route, principal propagation and backend trust |
| SAP BTP applications and ABAP environment | The authentication exchange supported by the target, its trust configuration, and the user's roles |
| S/4HANA Cloud Public Edition | An API and communication scenario that support the intended business-user access |

For this example, SAP's [Business Partner A2X API](https://api.sap.com/api/API_BUSINESS_PARTNER/overview) is a concrete starting point for a suitable S/4HANA system. It is not a universal API recipe for all four rows.

The practical question for your team is: **which documented API can answer our business question while retaining the intended user's access?** That decision comes before implementing the connector.

## A starting point for developers

Build the first version around **one tool, one destination, and two test users**. Keep the business response small, and prove both an allowed read and a denied read before adding more capabilities.

The main implementation decisions are:

1. **Expose a real MCP endpoint.** Use the MCP SDK's Streamable HTTP transport for the remote server. The library's Express example demonstrates authentication with a JSON stub; it is not a complete JWD connector.
2. **Require a user and the tool's permission.** Compose `createXsuaaTokenVerifier` with `requireUserToken: true` and require your local scope through bearer middleware. In the reviewed version, `setupHttpAuth` does not expose that user-only option. See the [verified-user documentation](https://github.com/arc-mcp/xsuaa-auth#verified-user-attributes-optional-building-block).
3. **Resolve the destination with the verified user's token.** `lookupDestinationWithUserToken` supplies authentication material for the connection. Your HTTP client applies it and makes the SAP request. Keep credentials and cached results separated by tenant, user, and target. See the [destination documentation](https://github.com/arc-mcp/xsuaa-auth#principal-propagation-btp).
4. **Put limits around the work.** Enforce a per-user allowance, a shared budget for actual API requests, bounded concurrency, and timeouts. These controls belong to your application or its managed infrastructure.
5. **Test the entire path.** Verify JWD sign-in, the effective SAP user, denied access, concurrent users, and throttling across multiple server instances. Record the exact package, SDK, desktop, and backend versions.

A narrowly defined tool is also easier for a coding agent to implement and test: one identifier in, a documented set of fields out, and explicit behavior when access is denied or the backend is unavailable.

## Connect it to JWD with OAuth

My earlier post, [How to Connect Joule Work Desktop to SAP Systems](/posts/connect-joule-work-desktop-to-sap/#how-to-connect-joule-work-desktop-to-sap-with-arc-1), walks through adding an MCP connector and completing the browser's OAuth sign-in. It uses ARC-1 as the example; a custom server built with xsuaa-auth uses the same kind of connection experience.

Use your organization's provided connector, or open **Extensions → New → Add Connector**, enter the deployed server's URL, and choose the OAuth option specified by your administrator. Sign in with your own work account, then select the connector in a conversation. SAP's [connector guide](https://help.sap.com/docs/JOULE_WORK_DESKTOP/3fec5cf19c7040baa71e42a88099180e/8c11ae6508de4b9ea9bea100e106ecfd.html?locale=en-US) covers the current options.

JWD's subsequent requests carry your authenticated user context to the server. With the SAP destination, trust, and user mapping in place, xsuaa-auth's BTP helpers let the application make the backend request as your mapped SAP user. The result depends on your permissions, even when colleagues use the very same connector.

Start with a task that repeatedly sends you from a document or spreadsheet into another application. A small, well-defined tool can bring that information into JWD while the organization manages the service and its access centrally. SAP is a useful place to start; the authentication foundation is reusable for your other MCP tools too.

*Implementation status: this is a proposed connector design. The complete business example and its live JWD-to-SAP validation are still pending. SAP's desktop help carries an Early Adopter Care notice as of 21 October 2026; availability depends on your organization.*
