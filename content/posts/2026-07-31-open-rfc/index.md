---
title: "Introducing open-rfc: Calling SAP RFC from Node.js Without the SDK"
date: 2026-08-03T08:00:00+02:00
draft: false
description: "Why I built open-rfc, an SDK-free TypeScript and JavaScript client for calling SAP RFC from Node.js."
tags: ["sap", "rfc", "node.js", "typescript", "javascript", "open-source", "cap"]
categories: ["projects"]
author: "Marian Zeis"
showToc: false
keywords: ["open-rfc", "SAP RFC Node.js", "node-rfc alternative", "SAP CAP RFC", "SDK-free RFC"]
---

<!-- Publication checklist: set the final date and draft to false, replace <exact-beta-version>, verify the admitted Node/SAP/@sap/cds-rfc versions and public links, and add the debugging prompt link. -->

If you ever wanted to call an SAP Remote Function Module from an application that is not ABAP, for example from JavaScript or Node.js, you probably discovered quite quickly that this is not as easy as it sounds.

There is an RFC protocol. There are remote-enabled function modules. There is an npm package called [`node-rfc`](https://github.com/SAP-archive/node-rfc). So you would expect to install the package, add the connection details, and make the call.

But `npm install node-rfc` was never the complete setup.

You also need the SAP NetWeaver RFC SDK. You need the right authorization to download it from the SAP Support Portal, the correct build for your operating system and architecture, and the current supported patch level. The native libraries must be installed where the runtime can find them. On Linux that usually means configuring `SAPNWRFC_HOME` and the library search path. If no suitable prebuilt addon exists, you also need the C++ build toolchain, Python, `node-gyp`, and headers to compile the Node.js addon.

Then this has to work again in Docker, CI/CD, Cloud Foundry, Kyma, or wherever the application is deployed. The SDK cannot simply be bundled into a public npm package because SAP is its distribution channel. Even SAP's own [BTP and Kyma example](https://community.sap.com/t5/technology-blog-posts-by-sap/abap-rfc-connectivity-from-btp-node-js-buildpack-and-kyma/ba-p/13573993) has to copy the SDK into the buildpack application, rebuild the native module, and configure the library path for runtime.

This is all possible. Many projects have done it successfully for years. But it is quite a lot of setup for what starts as: I only want to call one function module.

## A short history of RFC outside ABAP

The problem is not new and it is also not only a Node.js problem.

The [SAP NetWeaver RFC SDK](https://support.sap.com/en/product/connectors/nwrfcsdk.html) is the C and C++ foundation. SAP describes it as the native RFC implementation for clients and servers, supporting systems from R/3 4.6C up to current S/4HANA releases. It provides the broad RFC feature set, but consuming it from another language needs a binding.

[PyRFC](https://github.com/SAP-archive/PyRFC) brought that model to Python. Its documentation even explains that it was inspired by Piers Harding's earlier `sapnwrfc` package and was rewritten with Cython. The later `node-rfc` project did the same for JavaScript and TypeScript with a native Node addon. Both projects handled a lot: metadata, type conversion, client and server scenarios, stateful sessions, parallel calls, connection pools, and more.

To be clear, these are valuable projects. They made RFC usable from two huge ecosystems and they gave many applications a practical API. My criticism is not that the projects did nothing. The issue is the native foundation and what happened to maintenance.

The last `node-rfc` release, 3.3.1, was published in November 2023. The last PyRFC release with the same version number followed in January 2024. In July 2024 SAP announced that it could no longer maintain both projects because of changed priorities. The published versions used an older SDK patch that was no longer supported, and there were no plans to adapt the bindings to a newer one. After an unsuccessful search for new maintainers, both repositories were finally archived on May 28, 2026. The `node-rfc` package on npm is now deprecated as well.

There are forks, and I am happy that people try to keep existing applications alive. But a normal fork keeps the same basic architecture. You still need the native SDK, its distribution rights, platform-specific binaries, and someone who can safely follow changes in that SDK. A few patches do not remove this dependency.

There is also a newer SAP path for CAP. The public [`@sap/cds-rfc`](https://www.npmjs.com/package/@sap/cds-rfc) plugin uses `@sap-rfc/node-rfc-library` for low-level RFC communication. That connector is not available on the standard npm registry. According to the plugin documentation, it is available only for Linux and Windows, and SAP customers need an S-user, an SAP Build Code license, and credentials for SAP's Repository-Based Shipment Channel. macOS users have to use a container.

So the old open-source binding is archived, while the newer supported connector adds an entitlement, a private registry, and platform-specific deployment requirements. I would expect an easier answer from SAP for such a fundamental integration protocol.

## The conversation that started open-rfc

For a long time I was not very concerned about this. Most of my RFC contact is inside ABAP, not outside it. When I had a small Node.js use case, the setup was complicated enough that I simply did not continue. With AI it may be a bit easier to fight through native build errors and deployment files, but the underlying dependencies are still there.

Then the topic came up during the evening events at [Code Connect 2026](https://code-connect.dev/). Even SAP employees were annoyed by the current situation. The discussion was more or less: this should be rewritten without those dependencies, and in the world of AI it cannot be that hard.

I started an AI coding session the same night.

Spoiler: even with AI, it is hard.

That session has now been running almost constantly every day. The speed at which an agent can write protocol code is impressive. The speed at which it can write protocol code that only looks correct is even more impressive. The difficult part is not producing bytes. It is proving that the bytes, state transitions, error behavior, and value conversions are correct across different SAP releases.

Once you go deeper into RFC, a complete and quite complicated SAP world opens up. A call is not only a TCP socket plus a function name. There is SAP's Network Interface framing, APPC and CPIC conversation handling, logon, metadata discovery, multiple serialization formats, ABAP type conversion, table fragmentation, session state, errors, cancellation, pooling, and transaction behavior. After a timeout you also need to know if nothing was sent, if the request may have reached ABAP, and if a connection can still be reused. For a mutating call, blindly retrying can create a second business effect.

The good news is that RFC is documented better than I first expected. I used the official [SAP NW RFC SDK 7.50 Programming Guide](https://support.sap.com/content/dam/support/en_us/library/ssp/products/connectors/nwrfcsdk/NW_RFC_750_ProgrammingGuide.pdf), the current SDK Doxygen documentation, the ABAP Keyword Documentation for the [RFC protocol](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABENRFC_PROTOCOL.html), interfaces, restrictions, and session context, plus SAP's Network Interface documentation and relevant SAP Notes. The archived `node-rfc` and PyRFC APIs and tests are also important compatibility references.

Most importantly, I do not only test against mocks. Because of [ARC-1](https://github.com/arc-mcp/arc-1), I already have three ABAP trial systems for SAP NetWeaver 7.50, SAP S/4HANA 2023, and SAP S/4HANA 2025. Development tests run against all three. The formal first-beta support contract is intentionally smaller and qualifies NetWeaver 7.50 and S/4HANA 2023 with the exact packaged artifact.

I keep offline protocol, property, fault, resource, and compatibility tests separate from live SAP evidence. The supported `node-rfc` facade is exercised against a pinned corpus from the archived project. For a beta release, the same exact tarball must pass as a standalone dependency, as the `node-rfc` npm alias, and below unchanged `@sap/cds-rfc`. A green test from some earlier source checkout does not promote a different package.

## What the first beta includes

The result is [open-rfc](https://github.com/marianfoo/open-rfc), an SDK-free TypeScript and JavaScript RFC client for Node.js.

The installed package has zero runtime dependencies. It contains portable JavaScript and TypeScript declarations, with no native addon, no SAP NW RFC SDK, no post-install download, and no runtime framework. It supports ESM and CommonJS and the same package is used in three ways:

- directly through the `open-rfc` API;
- as an npm alias for existing `node-rfc` client and pool consumers; and
- as the low-level connector below an unchanged `@sap/cds-rfc` installation.

The first beta focuses on direct application-server connections with password authentication and classic Unicode RFC. It includes metadata lookup and caching, synchronous function calls, common scalar values, exact decimals, date and time values, binary data, STRING and XSTRING, structures, tables, timeouts, cancellation, reset, bounded connection pooling, and commit and rollback behavior.

It also includes `Client` and `Pool` facades for the common archived `node-rfc` API and the modern `RFCClient` and `RFCConnection` facade expected by SAP's CAP connector. Unsupported security or serializer options fail before business I/O. A timeout, cancellation, malformed response, or uncertain send retires the physical connection, and open-rfc never automatically replays the call.

The formal beta platform is Ubuntu 24.04 x64 with Node.js 22 or 24. This is narrower than where portable JavaScript may happen to run, because I only want to claim what the exact release artifact has actually proven.

The 0.x line has no production SLA. Direct classic RFC also has no transport encryption or peer authentication by itself. It belongs on a trusted private network or inside a separately managed protected tunnel, not openly across the internet.

## Why beta does not mean almost 1.0

This first beta is not a release candidate for 1.0. RFC has too many paths for that claim.

Message-server load balancing and SAProuter routes are already implemented and tested offline, but they are previews and not part of the beta support contract. WebSocket RFC and Cloud Connector principal propagation need more than a working tunnel. WebSocket business calls use a different fast serializer, and classic principal propagation requires SNC and X.509. These paths stay closed until the complete behavior can be implemented and tested properly.

The road to 1.0 includes live qualification for message-server and SAProuter routes, deeper work on WebSocket and Cloud Connector connectivity, a frozen stable API, longer soak tests, repeatable release candidates, real adopters, and another independent security and correctness review.

Other features are later work, not promises for 1.0: registered RFC server mode and ABAP callbacks, tRFC, qRFC, bgRFC, Throughput APIs, SNC, X.509, non-Unicode and MDMP systems, basXML, and complete SAP NW RFC SDK parity.

I prefer to make this boundary explicit. A package that accepts every option and silently ignores half of them looks compatible until the day it causes a production problem.

## The CAP replacement I wanted from the beginning

One especially important goal was a drop-in replacement for `@sap-rfc/node-rfc-library` below SAP's `@sap/cds-rfc` CAP plugin. I do not want to fork or rebuild the CAP layer. SAP's unchanged package should continue to own RFC imports, destination lookup, Cloud SDK integration, multitenancy, and the CAP lifecycle. open-rfc should replace only the low-level connector.

With npm 11, the application can declare a nested override:

```json
{
  "dependencies": {
    "@sap/cds-rfc": "2.2.1",
    "open-rfc": "<exact-beta-version>"
  },
  "overrides": {
    "@sap/cds-rfc": {
      "@sap-rfc/node-rfc-library": "$open-rfc"
    }
  }
}
```

Your CAP service code stays unchanged. The normal `cds import --from rfc` flow stays with `@sap/cds-rfc`, and existing `cds.connect.to()` calls still go through the SAP plugin. After installation, `npm explain @sap-rfc/node-rfc-library` shows whether the override resolved to open-rfc.

The [dedicated CAP guide](https://marianfoo.github.io/open-rfc/cap/) explains the full setup, importer workflow, local credentials, destination boundary, transactions, and shutdown behavior. This should make local development and CI/CD much simpler because the application installs an ordinary npm artifact. There is no SDK archive to copy, no native addon to compile, and no extra SAP npm registry credential for this connector.

The first beta still supports only the direct application-server route with password authentication. An easier installation does not magically qualify every destination and authentication mode, so please read the release status for the exact version you install.

## I need your help

Now comes the most important part. I can build a lot and I am willing to put in the work, but I cannot reproduce every SAP system, function module, network route, value shape, and deployment environment alone.

Please test the beta with your real use cases, starting with a read-only function on a non-production system. Try the data types your application really uses. Test errors, cancellation, pools, and transactions, not only one successful `RFC_PING`. If you find a problem, open an issue with the open-rfc version, Node.js version, operating system, SAP release family, route type, function interface shape, and the smallest safe reproducer you can create.

Do not attach credentials, endpoints, system identities, business data, returned tables, raw traces, or packet captures to a public issue. If the problem needs private information, first describe the redacted shape so we can find a safe way to reproduce it.

If you prefer to throw tokens at the problem, do that as well. I am preparing a reusable debugging prompt for the repository so an agent can inspect the documented boundary, reduce the failure, run the right tests, and prepare a focused contribution without leaking SAP data.

<!-- TODO before publication: link the public open-rfc debugging prompt after it is added to the release repository. -->

And of course, contributions are welcome. This project should not become one person's private RFC implementation with a public repository around it. I want it to become truly open, understandable, testable, and useful for different scenarios.

That takes more work. I am ready to do it, but I need your systems, your use cases, your bug reports, and your review.

Let's make this work.

## References and links

- [open-rfc repository](https://github.com/marianfoo/open-rfc)
- [open-rfc documentation](https://marianfoo.github.io/open-rfc/)
- [open-rfc CAP integration guide](https://marianfoo.github.io/open-rfc/cap/)
- [SAP NetWeaver RFC SDK](https://support.sap.com/en/product/connectors/nwrfcsdk.html)
- [SAP NW RFC SDK 7.50 Programming Guide](https://support.sap.com/content/dam/support/en_us/library/ssp/products/connectors/nwrfcsdk/NW_RFC_750_ProgrammingGuide.pdf)
- [Archived SAP node-rfc project](https://github.com/SAP-archive/node-rfc)
- [node-rfc maintenance announcement](https://github.com/SAP-archive/node-rfc/issues/329)
- [Archived SAP PyRFC project](https://github.com/SAP-archive/PyRFC)
- [PyRFC maintenance announcement](https://github.com/SAP-archive/PyRFC/issues/372)
- [SAP CAP RFC plugin](https://www.npmjs.com/package/@sap/cds-rfc)
- [Code Connect 2026](https://code-connect.dev/)
