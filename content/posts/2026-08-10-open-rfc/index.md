---
title: "Introducing open-rfc: Calling SAP RFC from Node.js Without the SDK"
date: 2026-08-10T09:30:00+02:00
draft: false
description: "Why I built open-rfc, an open-source, SDK-free TypeScript and JavaScript RFC client for Node.js with zero runtime dependencies."
tags: ["sap", "rfc", "node.js", "typescript", "javascript", "open-source", "cap", "sap-btp", "cloud-connector"]
categories: ["projects"]
author: "Marian Zeis"
showToc: false
cover:
  image: "images/open-rfc-cover-v4.png"
  alt: "Illustration of open-rfc connecting Node.js to SAP without native SDK dependencies, showing macOS, Linux, Windows, and SAP BTP through Cloud Connector"
images: ["images/open-rfc-cover-v4.png"]
keywords: ["open-rfc", "SAP RFC Node.js", "node-rfc alternative", "SAP CAP RFC", "SDK-free RFC"]
---

If you ever wanted to call a remote-enabled ABAP function module from JavaScript or Node.js, you probably discovered quite quickly that this is not as easy as it sounds.

There is an RFC protocol. There are remote-enabled function modules. There is an npm package called [`node-rfc`](https://github.com/SAP-archive/node-rfc). So you would expect to install the package, add the connection details, and make the call.

But `npm install node-rfc` was never the complete setup.

You also need the SAP NetWeaver RFC SDK. You need the right authorization to download it from the SAP Support Portal, the correct build for your operating system and architecture, and the current supported patch level. The native libraries must be installed where the runtime can find them. On Linux that usually means configuring `SAPNWRFC_HOME` and the library search path. If no suitable prebuilt addon exists, you also need the C++ build toolchain, Python, `node-gyp`, and headers to compile the Node.js addon.

Then this has to work again in Docker, CI/CD, Cloud Foundry, Kyma, or wherever the application is deployed. The SDK cannot simply be bundled into a public npm package because SAP is its distribution channel. Even SAP's own [BTP and Kyma example](https://community.sap.com/t5/technology-blog-posts-by-sap/abap-rfc-connectivity-from-btp-node-js-buildpack-and-kyma/ba-p/13573993) has to copy the SDK into the buildpack application, rebuild the native module, and configure the library path for runtime.

This is all possible. Many projects have done it successfully for years. But it is quite a lot of setup for what starts as: I only want to call one function module.

## A short history of RFC outside ABAP

The [SAP NetWeaver RFC SDK](https://support.sap.com/en/product/connectors/nwrfcsdk.html) is the native C and C++ foundation for RFC clients and servers. Projects such as [PyRFC](https://github.com/SAP-archive/PyRFC) and [`node-rfc`](https://github.com/SAP-archive/node-rfc) made it usable from Python and Node.js, but both remained language bindings around this separately installed SDK.

These projects were valuable and gave both ecosystems practical APIs. Their shared problem was the native dependency, followed by the end of maintenance. The last `node-rfc` release was published in November 2023, followed by PyRFC 3.3.1 in January 2024. In July 2024 SAP published the same announcement for [`node-rfc`](https://github.com/SAP-archive/node-rfc/issues/329) and [PyRFC](https://github.com/SAP-archive/PyRFC/issues/372): changed priorities meant it could no longer maintain the projects. The bindings used an SDK patch no longer supported by SAP, with no planned update. After ownership could not be transferred to new maintainers, as explained in the final updates for [`node-rfc`](https://github.com/SAP-archive/node-rfc/issues/329#issuecomment-2541486229) and [PyRFC](https://github.com/SAP-archive/PyRFC/issues/372#issuecomment-2541490558), both repositories were eventually archived on May 28, 2026. The `node-rfc` package on npm is deprecated too.

There are forks, but they keep the same basic architecture. You still need the native SDK, platform-specific binaries, and somebody able to follow SDK changes.

There is also a newer SAP path for CAP. The public [`@sap/cds-rfc`](https://www.npmjs.com/package/@sap/cds-rfc) plugin uses `@sap-rfc/node-rfc-library` for low-level RFC communication. That connector is not available on the standard npm registry. According to the plugin documentation, it is available only for Linux and Windows, and SAP customers need an S-user, an SAP Build Code license, and credentials for SAP's Repository-Based Shipment Channel. macOS users have to use a container.

So the old open-source binding is archived, while the newer supported connector adds an entitlement, a private registry, and platform-specific deployment requirements. I would expect an easier answer from SAP for such a fundamental integration protocol.

## The conversation that started open-rfc

For a long time I was not very concerned about this. Most of my RFC contact is inside ABAP, not outside it. When I had a small Node.js use case, the setup was complicated enough that I simply did not continue. With AI it may be a bit easier to fight through native build errors and deployment files, but the underlying dependencies are still there.

Then the topic came up during the evening events at [Code Connect 2026](https://code-connect.dev/). Even SAP employees were annoyed by the current situation. The discussion was more or less: this should be rewritten without those dependencies, and in the world of AI it cannot be that hard.

I started an AI coding session the same night.

Spoiler: even with AI, it is hard.

I have been working on it since that evening, with AI helping across research, implementation, tests, and review. The deeper I went, the clearer it became that writing something that works once is not the hard part. The hard part is proving that it behaves correctly across SAP releases and also in failures.

Once you go deeper into RFC, a much larger world opens up. The client first has to log on, understand the function module and its parameters, translate JavaScript values into ABAP values, send and receive sometimes large structures and tables, and keep the connection in a safe state when something fails. Timeouts are especially tricky: the application may not know whether SAP already executed the call. Retrying a write automatically could therefore execute it twice.

The good news is that RFC is documented better than I first expected. I used the official [SAP NW RFC SDK 7.50 Programming Guide](https://support.sap.com/content/dam/support/en_us/library/ssp/products/connectors/nwrfcsdk/NW_RFC_750_ProgrammingGuide.pdf), the current SDK Doxygen documentation, the ABAP Keyword Documentation for the [RFC protocol](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABENRFC_PROTOCOL.html), interfaces, restrictions, and session context, plus SAP's Network Interface documentation and relevant SAP Notes. The archived `node-rfc` and PyRFC APIs and tests are also important compatibility references.

I also used [OWASP pysap](https://github.com/OWASP/pysap) and its [documentation](https://pysap.readthedocs.io/en/latest/) as a low-level reference for SAP network protocols. pysap, initially designed and developed by Martin Gallo, is a Python and Scapy packet-crafting and protocol-research toolkit, while open-rfc is an application-facing Node.js RFC client. Thank you to Martin and all pysap contributors for making this research available.

Most importantly, I do not only test against mocks. Because of [ARC-1](https://github.com/arc-mcp/arc-1), I already have three ABAP trial systems for SAP NetWeaver 7.50, SAP S/4HANA 2023, and SAP S/4HANA 2025. Development tests run against all three. The formal first-beta support contract is intentionally smaller and qualifies NetWeaver 7.50 and S/4HANA 2023 with the exact packaged artifact.

I keep offline protocol, property, fault, resource, and compatibility tests separate from live SAP evidence. The supported `node-rfc` facade is exercised against a pinned corpus from the archived project. For a beta release, the same exact tarball must pass as a standalone dependency, as the `node-rfc` npm alias, and below unchanged `@sap/cds-rfc`. A green test from some earlier source checkout does not promote a different package.

## What the first beta includes

The result is [open-rfc](https://github.com/marianfoo/open-rfc), an SDK-free TypeScript and JavaScript RFC client for Node.js. The current beta is [open-rfc on npm](https://www.npmjs.com/package/open-rfc), licensed under Apache 2.0.

The installed package has zero runtime dependencies. It contains portable JavaScript and TypeScript declarations, with no native addon, no SAP NW RFC SDK, no post-install download, and no runtime framework. It supports ESM and CommonJS and the same package is used in three ways:

- directly through the `open-rfc` API;
- as an npm alias for existing `node-rfc` client and pool consumers; and
- as the low-level connector below an unchanged `@sap/cds-rfc` installation.

The first beta focuses on direct application-server connections with password authentication and classic Unicode RFC. It includes metadata lookup and caching, synchronous function calls, common scalar values, exact decimals, date and time values, binary data, STRING and XSTRING, structures, tables, timeouts, cancellation, reset, bounded connection pooling, and representative commit and rollback paths.

It also includes `Client` and `Pool` facades for the common archived `node-rfc` API and the modern `RFCClient` and `RFCConnection` facade expected by SAP's CAP connector. Unsupported security or serializer options fail before business I/O. A timeout, cancellation, malformed response, or uncertain send retires the physical connection, and open-rfc never automatically replays the call.

The official 0.2.3 release matrix currently qualifies Ubuntu 24.04 x64 with Node.js 22.14 or newer, or Node.js 24. Because the package is portable JavaScript with no native addon, it is expected to work on other Node.js platforms too. macOS, Windows, and other Linux versions are not official release claims yet, so I especially want users to report what they try there.

The 0.x line has no production SLA. Direct classic RFC also has no transport encryption or peer authentication by itself. It belongs on a trusted private network or inside a separately managed protected tunnel, not openly across the internet.

## BTP, Cloud Connector, and an ARC-1 extension

`open-rfc` 0.2.3 also makes it possible to call an on-premise SAP system from BTP Cloud Foundry through SAP Cloud Connector. The [documented route](https://marianfoo.github.io/open-rfc/routes/) uses the BTP Connectivity service and Cloud Connector to reach the SAP system. I tested the exact published package end to end from Cloud Foundry to SAP S/4HANA 2023. This proves the path works, but it has not yet been tested broadly enough to be part of the release's qualified scope.

I added the same setup to the [ARC-1 extension sample](https://github.com/arc-mcp/arc-1-extension-sample). Its `Custom_RfcSystemInfo` tool calls the read-only `RFC_SYSTEM_INFO` function, accepts no user input, is off by default, uses a dedicated RFC user, and only returns selected fields. It shows how an ARC-1 extension can add an RFC tool beside ADT and OData without installing the SDK.

My tested setup uses a dedicated technical SAP user. Cloud Connector protects the connection between BTP and the company network. Inside the company network, RFC still needs a trusted network, and the technical user should only be allowed to call the exact function modules needed.

## Why beta does not mean almost 1.0

This first beta is not a release candidate for 1.0. RFC has too many paths for that claim.

The default target for 1.0 is intentionally smaller: direct application-server RFC with password authentication, the standalone API, the `node-rfc` compatibility layer, and unchanged `@sap/cds-rfc` through the npm override. Before 1.0, this still needs deeper testing of failures, isolation, large values, transactions, pool contention, repeated runs, and long-running use. It also needs a frozen API and support policy, real adopters, operational readiness, and another independent security and correctness review.

Message-server load balancing, SAProuter, WebSocket RFC, and passing individual user identities through Cloud Connector are conditional candidates. They enter 1.0 only if the scope decision includes them and live tests can prove them. Otherwise they remain later work.

Other features are later work, not promises for 1.0: registered RFC server mode and ABAP callbacks, tRFC, qRFC, bgRFC, Throughput APIs, SNC, X.509, non-Unicode and MDMP systems, basXML, and complete SAP NW RFC SDK parity.

I prefer to make this boundary explicit. A package that accepts every option and silently ignores half of them looks compatible until the day it causes a production problem.

## The CAP replacement I wanted from the beginning

One especially important goal was a drop-in replacement for `@sap-rfc/node-rfc-library` below SAP's `@sap/cds-rfc` CAP plugin. I do not want to fork or rebuild the CAP layer. SAP's unchanged package should continue to own RFC imports, destination lookup, Cloud SDK integration, multitenancy, and the CAP lifecycle. open-rfc should replace only the low-level connector.

With npm 11, the application can declare a nested override:

```json
{
  "dependencies": {
    "@sap/cds-rfc": "2.2.1",
    "open-rfc": "0.2.3"
  },
  "overrides": {
    "@sap/cds-rfc": {
      "@sap-rfc/node-rfc-library": "$open-rfc"
    }
  }
}
```

Your CAP service code stays unchanged. The normal `cds import --from rfc` flow stays with `@sap/cds-rfc`, and existing `cds.connect.to()` calls still go through the SAP plugin. After installation, `npm explain @sap-rfc/node-rfc-library` shows whether the override resolved to open-rfc.

The [dedicated CAP guide](https://marianfoo.github.io/open-rfc/cap/) explains the full setup, importer boundary, local credentials, destination boundary, transactions, and shutdown behavior. This should make local development and CI/CD much simpler because the application installs an ordinary npm artifact. There is no SDK archive to copy, no native addon to compile, and no extra SAP npm registry credential for this connector.

The qualified beta scope still covers only the direct application-server route with password authentication. An easier installation does not magically qualify every destination and authentication mode, so please read the [release status](https://marianfoo.github.io/open-rfc/status/) for the exact version you install.

## I need your help

Now comes the most important part. I can build a lot and I am willing to put in the work, but I cannot reproduce every SAP system, function module, network route, value shape, and deployment environment alone.

The [documentation](https://marianfoo.github.io/open-rfc/) is also part of the project, not a finished manual that users can only consume. It already covers the quick start, standalone and `node-rfc` use, CAP, Cloud Connector, configuration, safety, operations, troubleshooting, release status, and the road to 1.0. The sources live in the public [`docs_page` folder](https://github.com/marianfoo/open-rfc/tree/main/docs_page). If something is unclear, wrong for your environment, or missing a useful example, please open an issue or improve the page. A clearer explanation or a correction from a real setup can be as valuable as a code change.

The public repository now also contains a broad offline test suite, and its documentation links and examples are checked automatically. The [contribution guide](https://github.com/marianfoo/open-rfc/blob/main/CONTRIBUTING.md) explains how to prepare code and documentation changes safely.

Please test the beta with your real use cases, starting with a read-only function on a non-production system. Try the data types your application really uses. Test errors, cancellation, pools, and transactions, not only one successful `RFC_PING`. If you find a problem, open an issue with the open-rfc version, Node.js version, operating system, SAP release family, route type, function interface shape, and the smallest safe reproducer you can create.

Do not attach credentials, endpoints, system identities, business data, returned tables, raw traces, or packet captures to a public issue. If the problem needs private information, first describe the redacted shape so we can find a safe way to reproduce it.

If you prefer to throw tokens at the problem, do that as well. The repository ships a prompt written for exactly this situation: [report an RFC failure](https://github.com/marianfoo/open-rfc/blob/main/.claude/commands/report-rfc-failure.md). You do not need a checkout of the repository to use it. It has an agent first check whether your case is inside the documented boundary, then reduce the failure to a synthetic reproducer that keeps the real ABAP types and invents everything else, and finally fill in every field of the bug template. The redaction rules are part of the prompt, so an agent following it will not put your system identities, credentials, or business data into a public issue.

If you want to go further than reporting, the [deep bug workflow](https://github.com/marianfoo/open-rfc/blob/main/.claude/commands/deep-bug.md) picks up from there: root cause before any change, then a test that was seen to fail without the fix, then a focused pull request. External contributors will not have my private live-system evidence, so give the agent only a synthetic reproducer and public information. I can run the necessary SAP checks after the issue is reduced safely.

And of course, contributions are welcome. This project should not become one person's private RFC implementation with a public repository around it. I want it to become truly open, understandable, testable, and useful for different scenarios.

That takes more work. I am ready to do it, but I need your systems, your use cases, your bug reports, and your review.

Let's make this work.

## References and links

- [open-rfc repository](https://github.com/marianfoo/open-rfc)
- [open-rfc documentation](https://marianfoo.github.io/open-rfc/)
- [open-rfc CAP integration guide](https://marianfoo.github.io/open-rfc/cap/)
- [open-rfc release status](https://marianfoo.github.io/open-rfc/status/)
- [open-rfc contribution guide](https://github.com/marianfoo/open-rfc/blob/main/CONTRIBUTING.md)
- [open-rfc road to 1.0](https://marianfoo.github.io/open-rfc/roadmap/)
- [open-rfc 0.2.3 release](https://github.com/marianfoo/open-rfc/releases/tag/v0.2.3)
- [ARC-1 extension sample](https://github.com/arc-mcp/arc-1-extension-sample)
- [SAP NetWeaver RFC SDK](https://support.sap.com/en/product/connectors/nwrfcsdk.html)
- [SAP NW RFC SDK 7.50 Programming Guide](https://support.sap.com/content/dam/support/en_us/library/ssp/products/connectors/nwrfcsdk/NW_RFC_750_ProgrammingGuide.pdf)
- [Archived SAP node-rfc project](https://github.com/SAP-archive/node-rfc)
- [node-rfc maintenance announcement](https://github.com/SAP-archive/node-rfc/issues/329)
- [Archived SAP PyRFC project](https://github.com/SAP-archive/PyRFC)
- [PyRFC maintenance announcement](https://github.com/SAP-archive/PyRFC/issues/372)
- [OWASP pysap](https://github.com/OWASP/pysap)
- [SAP CAP RFC plugin](https://www.npmjs.com/package/@sap/cds-rfc)
- [Code Connect 2026](https://code-connect.dev/)
