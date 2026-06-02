---
title: "A Clearer View of Your SAP Integrations Under the New API Policy"
date: 2026-06-02T09:00:00+02:00
draft: false
description: "The new SAP API Policy does not tell you which of your interfaces are affected, and SAP will not give a binary compliant or not compliant answer. So I built an open-source skill plus SAP MCP servers that gather sourced, confidence-rated evidence per interface, so you can go into the conversation with SAP prepared instead of guessing."
tags: ["sap", "api-policy", "mcp", "ai", "agentic", "compliance", "governance", "integration", "odp", "arc-1"]
categories: ["projects"]
author: "Marian Zeis"
showToc: false
cover:
  image: "images/cover.png"
  alt: "SAP API Hub, SAP Notes, SAP Docs, SAP Roadmap, and ARC-1 feeding evidence into an SAP API Policy alignment check."
  relative: true
images:
  - "images/cover.png"
keywords: ["SAP API Policy", "SAP API Policy v.4.2026a", "ODP-RFC prohibition", "SAP MCP server", "agentic AI SAP", "Published API", "SAP Business Accelerator Hub", "API compliance", "SAP Note 3255746"]
---

In April, SAP published a new [**API Policy (v.4.2026a)**](https://help.sap.com/doc/sap-api-policy/latest/en-US/API_Policy_latest.pdf). If you run SAP integrations of any kind, like middleware, custom extensions, analytics pipelines, RPA, or anything with "AI agent" in the name, you have probably already had the uncomfortable conversation. Are we still allowed to do that, and can we safely start the next project this way?

The honest answer is that nobody can fully answer that for you. That is the real problem.

When DSAG reacted to the policy, the loudest complaint was not the rules. It was the lack of clarity. Chairman Jens Hungershausen put it simply: *"The question is which interfaces are used in the partner solutions."* Board member Michael Bloch called the undefined contractual status of the SAP Business Accelerator Hub *"unacceptable"* ([CIO](https://www.cio.com/article/4166172/dsag-criticizes-saps-new-api-policy.html)). SAP says existing integrations are not affected, but it has not written that down in a way customers can rely on. Analysts went further. Forrester told CIOs to [push back](https://www.forrester.com/blogs/sap-is-attempting-to-become-the-gatekeeper-of-enterprise-ai-cios-should-push-back/).

That missing pre-project clarity is exactly the gap I built this for: a practical evidence workflow that helps you look at one real interface or automation approach at a time before you invest more time in it. It is not a replacement for SAP, not legal advice, and not a magic compliance stamp.

I have been following this closely. I am one of the consultants quoted in [The Register](https://www.theregister.com/2026/04/29/new_sap_api_policy_provokes/) on the AI clause. But commentary only goes so far. So I built something practical instead. It gives you an evidence-based view of your own interfaces against the policy, with sources and a confidence level.

It does not give you a verdict. That is on purpose. Here is why, and how it works.

## Why nobody can give you a clean yes or no

The policy is only two pages, but it is broad. You may use **Published APIs**, the ones listed on the SAP Business Accelerator Hub or named in product documentation, for their **Documented Use**. It then restricts non-published or internal APIs (§1.2), specific and general controls like rate limits and bulk-extraction preconditions (§2), and the clause everyone worries about, §2.2.2: interaction with autonomous or generative AI that plans, selects, or executes sequences of API calls, plus large-scale extraction, unless you go through an SAP-endorsed pathway. At Sapphire 2026, SAP CTO Philipp Herzig [spoke to the direction](https://diginomica.com/sap-sapphire-2026-sap-cto-philipp-herzig-saps-api-policy-changes-and-why-organizational-memory). The policy is about routing agentic access through governed, reliable pathways.

But here is the part that matters for a tool. In its own FAQ, SAP was asked the exact question customers and partners now care about: will there be a binding decision matrix or concrete examples that let them assess, before starting a project, whether an integration or automation approach is compliant and future-proof? SAP said no (FAQ Q49). Only SAP, your contract, or SAP support can give a binding answer for your landscape.

So any tool that prints "COMPLIANT" or "NOT COMPLIANT" would lie to you. The best you can honestly do is well-sourced, confidence-rated evidence, plus the right questions for SAP. That is what I aimed for, and it turns out to be more useful than a fake verdict.

## What I built

The project has two parts: the skill itself, plus a monorepo for the SAP MCP servers it depends on.

The skill is **[`sap-api-policy-evidence`](https://github.com/marianfoo/sap-api-policy-skill)**. You install it in Claude Code, Cursor, or Codex with [`npx skills`](https://github.com/vercel-labs/skills). It does the reasoning. It frames your scenario into facts, classifies it against the policy clauses, gathers evidence, and writes the assessment.

The skill reads its evidence from five SAP MCP servers. Three of them I put into one npm-workspaces monorepo, **[`sap-mcp-servers`](https://github.com/marianfoo/sap-mcp-servers)**, with a shared SAP login module: the **Business Accelerator Hub** server (is this a Published API?), **SAP Notes** (is it explicitly not permitted?), and the **Road Map Explorer** (future plans only, never current permission).

The other two are separate servers I already had. One is my [**SAP Docs MCP server**](https://github.com/marianfoo/mcp-sap-docs), for SAP Help and the Architecture Center, including released-object status and endorsed pathways. It also has a hosted URL, so you do not have to run it yourself. The other is [**ARC-1**](/posts/2026-04-27-arc-1/), my ADT MCP server, used read-only here for checks against a live SAP system.

The skill does the thinking. The MCP servers bring the evidence. You can wire up all of them for the best picture, or just a few. If a source is missing, the skill says so and lowers its confidence.

## What an assessment contains

Every result has the same shape, so you can compare them and file them.

- A fixed **assessment label**: `Likely aligned`, `Likely not aligned`, `Needs SAP confirmation`, or `Not assessable from provided facts`.
- One **confidence level**: `high`, `medium`, or `low`. It only reaches `high` when strong sources back the finding, like API Hub and an authenticated SAP Notes session.
- An **evidence table** that lists every source, what it said, how authoritative it is, and when it was retrieved.
- **Residual risk**, the **missing facts** that would most improve confidence, and **questions for SAP**.
- A disclaimer at the top and the bottom that this is not legal advice. This is not boilerplate. It is the main idea.

## Four examples

**1. The ODP-RFC pipeline you should check before June 9.** Extracting BW/4HANA data into a lake or warehouse over ODP-RFC through a third-party tool is the classic case. It is also urgent, because the enforcement patch lands on [June 9, 2026](https://theobald-software.com/en/blog/sap-note-3255746), based on SAP Note 3255746. Here is the short version of a real run, with the [full report](https://github.com/marianfoo/sap-api-policy-skill/blob/main/examples/01-odp-rfc-extraction.md) in the repo:

```text
**Assessment:** Likely not aligned
**Confidence:** high
**Date:** 2026-06-02

Why: ODP-RFC for customer or third-party access to ABAP systems that contain
PI_BASIS, SAP BW, or SAP BW/4HANA (on-premise or private cloud) is prohibited
per SAP Note 3255746. SAP Note 3439624 ships a self-assessment tool, and a
June 2026 security patch blocks unpermitted calls. The API Hub returned no
published artifact for ODP-RFC or RODPS_REPL.

Endorsed alternatives: SAP Business Data Cloud with Delta Sharing (including
BDC Connect for Snowflake), ODP-OData, or SLT where licensed.

Questions for SAP: confirm the migration target for this data scope, and the
deadline relative to the June 2026 blocking patch.
```

That is more useful than "not allowed". It cites the Note, points to SAP's own self-assessment, names real alternatives, and gives you the questions to ask.

**2. A third-party AI agent reaching into SAP.** This is the §2.2.2 worry. It is the clause that touches tools like Agentforce, Copilot, ServiceNow, Workday Illuminate, and Celonis. The skill does not flag every agent as forbidden. A read-only developer assistant is fine. A deterministic RPA bot is out of scope (FAQ Q40). But an autonomous agent that plans business-API call sequences through a custom gateway lands on `Likely not aligned`, and the report points to the endorsed pathway, like the MCP Gateway on SAP Integration Suite, or Joule with the Agent Gateway. Here is the short version of a real run, with the [full report](https://github.com/marianfoo/sap-api-policy-skill/blob/main/examples/02-third-party-ai-agent.md) in the repo:

```text
**Assessment:** Likely not aligned
**Confidence:** high
**Date:** 2026-06-02

Why: API_SALES_ORDER_SRV itself is published and active, but an autonomous
third-party AI agent that plans and executes read and create calls through a
custom-only MCP gateway triggers the agentic-AI control in section 2.2.2(a).
No SAP-endorsed path or written authorization was provided.

Endorsed path: expose the API through the MCP Gateway on SAP Integration Suite,
or A2A with Joule and the Agent Gateway, instead of a custom gateway.
```

The point is the nuance, not a blanket yes or no.

**3. "Which of these are we even allowed to use?"** This is the DSAG complaint turned into a workflow. You give the skill a list of interfaces, for example `API_SALES_ORDER_SRV`, `RFC_READ_TABLE`, `SD_SALESDOCUMENT_CREATE`, ODP-RFC, and `I_SalesDocument`. It returns one timestamped table: status per interface, the evidence behind it, the documented alternative, and which rows still need a full assessment. Here is the short version of a real run, with the [full report](https://github.com/marianfoo/sap-api-policy-skill/blob/main/examples/03-inventory-scan.md) in the repo:

```text
**Assessment:** Likely not aligned   **Confidence:** high
Portfolio: 1 prohibited, 1 discouraged, 1 not-found, 2 released or published.

ODP-RFC              Prohibited    SAP Note 3255746
RFC_READ_TABLE       Discouraged   SAP Note 382318 (not a released API)
SD_SALESDOCUMENT_*   Not found     no released or published evidence
API_SALES_ORDER_SRV  Published     SAP Business Accelerator Hub
I_SalesDocument      Released (A)  released-object data, Clean Core A
```

There is no SAP-published master list, so this is the closest thing you can build yourself. It is clearly marked as evidence captured on a date, not an SAP-approved allowlist.

**4. The same API, but a normal integration.** This is the positive case, and a good contrast to example 2. We sync about 500 sales orders per day from Salesforce into S/4HANA Cloud using Boomi, calling the standard Sales Order OData API (`API_SALES_ORDER_SRV`) with OAuth 2.0. It is the same API as in example 2, but a deterministic middleware flow instead of an autonomous AI agent. Here is the short version of a real run, with the [full report](https://github.com/marianfoo/sap-api-policy-skill/blob/main/examples/04-published-api-ipaas.md) in the repo:

```text
**Assessment:** Likely aligned
**Confidence:** medium
**Date:** 2026-06-02

Why: API_SALES_ORDER_SRV is active and published on the SAP Business
Accelerator Hub for S/4HANA Cloud (OData V2, OAuth 2.0, not deprecated). The
~500 orders/day is bounded operational use, not bulk extraction, and there is
no AI agent planning the calls. So the SAP-facing API and the usage pattern
both look documented.

Confidence is medium, not high, because tenant-specific rate limits, the
communication arrangement, and quotas are not visible in public sources. SAP
or tenant operations would confirm those and move it to high.
```

The contrast is the point. Example 2 and this one call the exact same Sales Order API. The assessment changes because the usage pattern is different, not the API. That is the whole idea of the policy. The question is the API surface and how you use it, not the tool.

## The real value: evidence you can take to SAP

This is the part I care about most. It is also why a non-definitive tool beats a fake-confident one.

SAP's own enforcement posture is dialogue first, not penalties. For existing integrations, SAP says it wants to make contact before it throttles anything (FAQ Q11, Q19). So the conversation is coming. The only question is whether you walk into it prepared or guessing.

An evidence report changes your position.

- You know your own exposure before SAP does. You can inventory your interfaces and classify them now, instead of finding out which ones matter when a pipe breaks.
- You can have a specific conversation. "Here is interface X, here is its API Hub status on this date, here is the relevant Note, here is our usage pattern and volume, please confirm." That is a very different meeting than "we think we are probably fine."
- You can push back where the evidence is on your side. If something is a Published API used within Documented Use, you have the sourced proof in hand. That helps when a partner solution or your own extension gets questioned.
- You can escalate the real gaps. Where no documented API exists, the report says so and points you to the SAP Customer Influence portal, instead of quietly relying on an undocumented interface.

It also works next to SAP's own tools, not against them. SAP Note 3439624 self-assesses ODP-RFC. The ABAP Test Cockpit Cloud Readiness Check finds non-released dependencies. The skill goes wider. It can cover any interface, the policy reasoning around it, and the endorsed alternative, and it gives you something you can put in front of your account team.

## It knows its limits

That honesty is built in, not just promised. The skill sends legal, commercial, and roadmap questions to SAP instead of guessing. It lowers its confidence when strong sources are not connected. It never asks for or stores credentials or business data. ARC-1 stays read-only. If you ask for a plain yes or no, you get the disclaimer, not a number. I tested all of this across 22 evaluation scenarios that cover every branch of the policy, including cases built to make it over-flag or under-flag.

## Try it

```bash
npx skills add marianfoo/sap-api-policy-skill --skill sap-api-policy-evidence
```

Then wire up the MCP servers. Most run with `npx -y`, SAP Docs has a hosted URL, and the three authenticated servers share one SAP login. The full setup, including auth, MFA, and the single-login flow, is in [MCP_SETUP.md](https://github.com/marianfoo/sap-api-policy-skill/blob/main/MCP_SETUP.md). The SAP API Hub and an authenticated SAP Notes session are what unlock `high`-confidence assessments. With fewer servers it still works, and it tells you what was missing.

One honest warning before you start: this is not a simple setup, and some of the servers read SAP sites through a browser login, not through official public APIs. The SAP Notes and Business Accelerator Hub servers work this way. So use them at your own risk, and check first that this is fine for you and your organization.

Then ask in plain language, for example: "Is it OK under the API policy to extract our BW/4HANA data into Snowflake nightly via ODP-RFC?" Then read the evidence.

## Open source, and honest about what it is

Both repos are public and use permissive licenses. The skill is MIT, the servers are Apache-2.0. The servers are published to npm with build provenance, and you can self-host everything if you need data residency. Issues and contributions are welcome.

To be honest, I would rather not need this at all. If SAP gave clear guidance on which interfaces are affected, we would not be left in this state of uncertainty. Until that changes, this is the best I have found. At least it gathers the sources for you, automatically and in one place, so you can decide from there.

You still cannot get a binding compliance verdict from a tool, and you should be careful with anyone who promises one. But you can replace hallway guesswork with current, sourced evidence and a clear list of what to confirm with SAP. Getting that clarity across your whole landscape, in minutes, is the real win. It is also a much stronger position to argue from.

## Sources

- [SAP API Policy v.4.2026a (PDF)](https://help.sap.com/doc/sap-api-policy/latest/en-US/API_Policy_latest.pdf): the policy itself, plus the FAQ it references.
- [SAP Note 3255746: data integration without ODP-RFC](https://theobald-software.com/en/blog/sap-note-3255746): the ODP-RFC prohibition and the June 9, 2026 enforcement date, with SAP Note 3439624 as the self-assessment tool.
- [CIO: DSAG criticizes SAP's new API policy](https://www.cio.com/article/4166172/dsag-criticizes-saps-new-api-policy.html): the transparency and "which interfaces are affected?" concerns.
- [The Register: AI clause in new SAP API policy provokes lock-in concern](https://www.theregister.com/2026/04/29/new_sap_api_policy_provokes/): §2.2.2, lock-in, and SAP's response.
- [Forrester: SAP is attempting to become the gatekeeper of enterprise AI, CIOs should push back](https://www.forrester.com/blogs/sap-is-attempting-to-become-the-gatekeeper-of-enterprise-ai-cios-should-push-back/): the analyst pushback.
- [diginomica: Sapphire 2026, SAP CTO Philipp Herzig on the API policy changes](https://diginomica.com/sap-sapphire-2026-sap-cto-philipp-herzig-saps-api-policy-changes-and-why-organizational-memory): SAP's framing.

**Project:** [`sap-api-policy-evidence` skill](https://github.com/marianfoo/sap-api-policy-skill) · [`sap-mcp-servers` (MCP servers)](https://github.com/marianfoo/sap-mcp-servers) · [`npx skills` CLI](https://github.com/vercel-labs/skills)
