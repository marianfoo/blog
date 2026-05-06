# Possible helpful links for the ARC-1 series

This file maps bookmarked resources (and a few added later, for example **link 23**) to the post outline in `ARC-1.md`: (1) LLMs in SAP development, (2) agentic ABAP strategies, (3) ARC-1 and security, (4) ARC-1 on BTP, (5) Microsoft Copilot, (6) Joule and clean core. Where a link fits multiple posts, the primary fit is listed first.

---

## 1. Hacker News: How I use Claude Code (planning vs execution)

**URL:** https://news.ycombinator.com/item?id=47106686

**Summary:** Discussion thread around separating planning from execution when using Claude Code: structure the work before the model runs long autonomous edits, so you keep control and quality.

**Where it helps:** Strongest in **post 1** (how LLMs help in SAP work) and **post 2** (strategies for agentic development). Secondary: **post 3** when you argue that “agentic” needs deliberate workflow, not only tooling.

**Fit in the series (examples, WHY):** Your series says SAP work is often minimal code change but heavy context (docs, dumps, tables). The HN thread supports the claim that **agentic success is a process pattern**, not only an MCP server. Example line for post 1: “The same separation of planning and execution that people discuss for general coding assistants applies to ABAP: the model needs bounded tasks and clear inputs (which ARC-1 later supplies via controlled tools).” WHY: It gives readers a **vendor-neutral** anchor before you introduce ARC-1.

---

## 2. Bluesky: Post by @jasper07.secondphase.com.au

**URL:** https://bsky.app/profile/jasper07.secondphase.com.au/post/3mffsveknvc2j

**Summary:** Short-form post from the same ecosystem as Second Phase (see link 11). Treat as optional social proof or a quotable aside once you open the post and confirm the exact claim.

**Where it helps:** **Post 1** or **post 2**, if the post reinforces context discipline, consulting delivery, or tool use in real projects.

**Fit in the series (examples, WHY):** Use only after you **verify the text** in the post. WHY: Bluesky posts are ephemeral in tone; they work as a “see also” footnote, not as the main citation, unless it contains a unique data point you want to quote.

---

## 3. Archive.today snapshot: Bloomberg on SAP users and AI value for money

**URL:** https://archive.is/M0RF2

**Summary:** Archived Bloomberg reporting on SAP customers questioning value for money of SAP’s AI offerings (paywalled original; archive preserves access).

**Where it helps:** **Post 1** (trust, expectations, “what is possible today”) and lightly in **post 6** (Joule and platform AI as a business decision, not only a tech upgrade).

**Fit in the series (examples, WHY):** Example framing: “Enterprise buyers are asking hard ROI questions about AI inside SAP stacks; that is why **governance, security, and clear scope** (your ARC-1 angle) matter as much as model quality.” WHY: It grounds your technical story in **commercial realism** without you needing to rely on a live paywall.

---

## 4. Simon Willison: Agentic engineering patterns

**URL:** https://simonwillison.net/guides/agentic-engineering-patterns/

**Summary:** Practical patterns for building with agents: tools, evals, boundaries, and how to think about reliability.

**Where it helps:** **Post 2** (primary), **post 3** (how ARC-1 embodies patterns in a security-first way), **post 4** (BTP deployment as part of a pattern: identity, destinations, least privilege).

**Fit in the series (examples, WHY):** You can map ARC-1 to explicit patterns: **tool allowlists**, **human checkpoints**, **observable actions**. Example: “An ADT MCP server is an agent tool surface; Willison-style patterns tell you how to keep that surface from becoming an ERP-shaped hole in your perimeter.” WHY: Readers outside SAP still recognize the vocabulary; it **bridges** general AI engineering and ABAP-specific constraints.

---

## 5. Stavros Korokithakis: How I write software with LLMs

**URL:** https://www.stavros.io/posts/how-i-write-software-with-llms/

**Summary:** Personal workflow for using LLMs in day-to-day software work: when to automate, when to stay hands-on, and how to stay effective.

**Where it helps:** **Post 1** (spectrum from “ask questions only” to “full agentic,” which your outline already mentions).

**Fit in the series (examples, WHY):** Parallel your UI5 or CAP developer example: “Not everyone runs ‘vibe coding’ in SAP; many teams use LLMs for **navigation, docs, and analysis** first.” WHY: It **normalizes** conservative adoption paths before you sell BTP, Copilot, or Joule as the next step.

---

## 6. arXiv 2602.19237 (PDF): Evaluating SAP RPT-1 for enterprise process prediction

**URL:** https://arxiv.org/pdf/2602.19237v1

**Summary:** Independent evaluation of SAP’s tabular foundation model RPT-1 vs gradient-boosted trees on structured SAP scenarios; proposes hybrid workflows (RPT-1 for screening, GBDT where accuracy pays off), with notes on limited-data crossover behavior.

**Where it helps:** **Post 1** as “another face of AI in SAP” (models on **tabular** ERP data, not only coding assistants). Optional depth in **post 6** if you discuss SAP’s broader AI portfolio vs custom tooling like ARC-1.

**Fit in the series (examples, WHY):** Clarifies that “SAP AI” is not one thing: **Joule and platform narratives** sit alongside **research-grade tabular models**. Example: “Coding MCP servers and RPT-1 style models answer different questions; your series focuses on **developer agent tooling and governance**.” WHY: Prevents readers from conflating ARC-1 with every SAP AI headline.

---

## 7. Towards Data Science: SAP-RPT-1 and tabular foundation models

**URL:** https://towardsdatascience.com/one-model-to-rule-them-all-sap-rpt-1-and-the-future-of-tabular-foundation-models/

**Summary:** Popular article framing SAP-RPT-1 and the idea of tabular foundation models for enterprise data (accessible narrative, not the paper’s full methodology).

**Where it helps:** **Post 1** (same bucket as link 6: orientation). Use **either** the TDS piece **or** the arXiv paper as deep citation, not both at length, unless you compare “blog intuition vs formal evaluation.”

**Fit in the series (examples, WHY):** One paragraph in post 1 can set landscape: **code agents (ARC-1) vs table prediction (RPT-1)**. WHY: Shows you understand the **full SAP AI context** while keeping the series focused.

---

## 8. Medium: ABAP Cloud MCP bridge without local installs (Warren Eiserman)

**URL:** https://medium.com/@warren_eiserman/abap-cloud-mcp-bridge-without-any-local-installs-dca412afc782

**Summary:** Describes an MCP bridge pattern for ABAP Cloud that avoids local installation, aligned with cloud-first and controlled connectivity ideas.

**Where it helps:** **Post 2** (alternative and complementary strategies), **post 4** (BTP and “no local secrets” narratives resonate), **post 3** when contrasting **other MCP approaches** with ARC-1’s security positioning.

**Fit in the series (examples, WHY):** Example: “The community is experimenting with **where** the MCP bridge runs; ARC-1 adds **how** you harden and operate it for enterprise ERP.” WHY: Shows the topic is **active** and that “bridge placement” is a design choice, not a solved monoculture.

---

## 9. SAP Community: Building custom Joule skills via RFC (S/4HANA and ECC)

**URL:** https://community.sap.com/t5/technology-blog-posts-by-sap/building-custom-joule-skills-via-rfc-guide-for-sap-s-4hana-and-ecc/ba-p/14363568

**Summary:** Official-lean SAP Community guide on extending Joule with custom skills using RFC, relevant when backend integration must reach classic interfaces.

**Where it helps:** **Post 6** (primary). Optional **post 5** if you compare “Copilot plus MCP” vs “Joule skills” as two orchestration surfaces.

**Fit in the series (examples, WHY):** Your outline already says Joule Studio can integrate MCP servers like ARC-1; this link shows **another integration path (RFC)** that readers may already be planning. Example: “Custom Joule skills can call into the system in approved ways; ARC-1 on BTP can remain the **governed ADT-facing tool path** while Joule handles conversational orchestration.” WHY: Helps architects see **where ARC-1 sits** relative to SAP’s own extensibility story.

---

## 10. SAP BTP: Cloud Identity Services administration console (tenant URL)

**URL:** https://aejz2oiae.accounts.cloud.sap/admin/

**Summary:** This is a **tenant-specific** SAP Cloud Identity Services admin URL from your bookmarks, not a stable public document.

**Where it helps:** **Private checklist** for **posts 4 and 5** when you implement OAuth, trusts, and app configurations. It is **not** something to paste into a published article as a “reference link.”

**Fit in the series (examples, WHY):** In writing, prefer **product documentation** links (SAP Help for Cloud Identity, BTP security, destination configuration) instead of a personal admin hostname. WHY: Avoids leaking environment hints and avoids broken reader links.

---

## 11. Second Phase: Context is the difference between slop and shipping

**URL:** https://secondphase.com.au/context-slop-vs-shipping/

**Summary:** Essay-style argument that **quality of context** (what you feed the model, how you curate it) determines whether output is usable engineering or “slop,” versus chasing bigger models alone.

**Where it helps:** **Post 1** (your outline’s core: docs, Confluence, SAP Help, dumps, tables), **post 5** (Copilot plus SharePoint and Atlassian as curated context), **post 2** (why tool design and retrieval matter for agents).

**Fit in the series (examples, WHY):** This is one of the **closest philosophical matches** to your first post: you already argue that ABAP fixes are often **context-bound**. Pull a short quote on **context curation** to justify why ARC-1 must integrate with **trusted** sources, not “the whole internet.” WHY: Gives readers language (“slop vs shipping”) that is memorable and **defensible** in enterprise settings.

---

## 12. SAP Community: Standardizing AI tool integration with MCP, Part 2 (implementing MCP with SAP)

**URL:** https://community.sap.com/t5/technology-blog-posts-by-sap/standardizing-ai-tool-integration-with-mcp-part-2-implementing-mcp-with-sap/ba-p/14359181

**Summary:** SAP’s direction on MCP as a standard integration layer for AI tools in the SAP ecosystem; Part 2 focuses on implementation angles.

**Where it helps:** **Post 2** and **post 3** (strongest): legitimizes MCP as **the** integration pattern SAP discusses, not only a hobbyist IDE plugin topic.

**Fit in the series (examples, WHY):** Example: “When SAP talks about standardizing MCP for AI tools, a security-focused ADT MCP server is not a side quest; it is part of the **same architectural conversation**.” WHY: Positions ARC-1 as **aligned with platform direction** while you still differentiate on **security and test strategy**.

---

## 13. SAP Community: Joule for developers, ABAP AI, Sapphire and ASUG 2026 sessions

**URL:** https://community.sap.com/t5/technology-blog-posts-by-sap/joule-for-developers-abap-ai-sapphire-and-asug-2026-sessions/ba-p/14365782

**Summary:** Session roundup and pointers for developer-facing Joule and ABAP AI topics at SAP’s 2026 events; useful for “what SAP is signaling” to developers.

**Where it helps:** **Post 6** (primary), **post 1** lightly (“here is where SAP is investing attention in 2026”).

**Fit in the series (examples, WHY):** Use as **timeline and agenda proof**: your Joule and clean core post is not speculative; SAP is placing ABAP AI in the **event narrative**. WHY: Helps consultants and leads justify reading the whole series **this year**.

---

## 14. Lalit Maganti: Eight years of wanting, three months of building with AI

**URL:** https://lalitm.com/post/building-syntaqlite-ai/

**Summary:** Long-form build story: years of intent compressed into months of execution with heavy AI assistance; reflects on velocity, scope, and what changed when tooling matured.

**Where it helps:** **Post 1** (velocity and expectations), **post 2** (agentic delivery stories).

**Fit in the series (examples, WHY):** Counterbalance link 3 (skepticism): “Some teams report dramatic acceleration when context and scope are right.” Pair with your **security and trust** section so the reader does not hear “move fast” without “**with guardrails**.” WHY: Human story + your ARC-1 thesis = **speed with boundaries**.

---

## 15. RFC 9700: OAuth 2.0 security best current practice

**URL:** https://www.rfc-editor.org/rfc/rfc9700.html

**Summary:** IETF BCP for securing OAuth 2.0 deployments: token handling, redirects, client types, and operational guidance that updates older OAuth assumptions.

**Where it helps:** **Post 4** (BTP, destinations, principal propagation) and **post 5** (Copilot integration via OAuth). Also **post 3** if you preview “we rely on standards, not bespoke password auth.”

**Fit in the series (examples, WHY):** When you describe connecting ARC-1 through SAP BTP and then to Microsoft Copilot, cite RFC 9700 as the **normative background** for why you avoid password embedding, emphasize confidential clients, rotation, and least privilege. WHY: Security stakeholders trust **IETF BCP** more than blog assertions alone.

---

## 16. SAP Community: The agentic revolution is here, and your ABAP code is the foundation

**URL:** https://community.sap.com/t5/technology-blog-posts-by-sap/the-agentic-revolution-is-here-and-your-abap-code-is-the-foundation/ba-p/14358726

**Summary:** SAP messaging that agentic AI will lean on existing ABAP assets; code quality, APIs, and clarity become leverage points for automation.

**Where it helps:** **Post 2** (why agentic ABAP is a serious theme), **post 6** (clean core: readable, modular ABAP as precondition for safe assistance).

**Fit in the series (examples, WHY):** Bridge from “tools” to **system readiness**: “ARC-1 can only be as safe as the surfaces you expose; messy custom code increases blast radius.” WHY: Aligns your clean core finale with **SAP’s own narrative** without sounding like a product press release.

**Note:** Your bookmark file contained this URL twice; one section is enough.

---

## 17. LinkedIn: Agentic AI in SAP landscapes (identity and authorization risk)

**URL:** https://www.linkedin.com/pulse/agentic-ai-sap-landscapes-next-identity-authorization-khalid-hussain-rc6zf/

**Summary:** Perspective piece on agentic AI increasing pressure on **identity and authorization** models in SAP landscapes (new actors, new tool calls, expanded attack surface).

**Where it helps:** **Post 3** (ARC-1 security thesis), **post 4** and **post 5** (operationalizing least privilege), **post 1** footnote on trust.

**Fit in the series (examples, WHY):** Use to introduce **non-obvious ERP risk**: it is not only “prompt injection,” it is **who can invoke what** against production backends. Example: “An MCP server is a new kind of client; identity architecture must treat it like one.” WHY: Directly supports why ARC-1’s **enterprise security focus** is not optional polish.

---

## 18. Pere Villega: Code is cheap now, and that changes everything

**URL:** https://perevillega.com/posts/2026-03-16-code-is-cheap-now/

**Summary:** Essay on economics of software when generation is cheap: value shifts to **design, verification, operations, and constraints** rather than raw typing speed.

**Where it helps:** **Post 1** and **post 2**, especially adjacent to your **testing and real-system validation** notes for ARC-1.

**Fit in the series (examples, WHY):** Example: “If code is cheap, **review, traceability, and controlled execution** become expensive and valuable; that is why ARC-1 emphasizes test strategies and security over ‘more endpoints faster.’” WHY: Turns a philosophical post into a **product design rationale** without sounding defensive.

---

## 19. Hacker News: Eight years of wanting, three months of building with AI (discussion)

**URL:** https://news.ycombinator.com/item?id=47648828

**Summary:** HN discussion thread on Lalit Maganti’s article (link 14): often contains critiques, comparisons, and nuance about what “AI built” really means.

**Where it helps:** **Post 1** if you want **balanced** reader perspective: enthusiasm plus skepticism in one place.

**Fit in the series (examples, WHY):** Pull 1 to 2 high-signal comments (with attribution) to show you engaged with objections. WHY: Enterprise readers often **think in HN patterns** even if they do not browse HN; it signals intellectual honesty.

---

## 20. Thomas Otter: Comments on a16z’s “Why the world still runs on SAP”

**URL:** https://thomasotter.substack.com/p/comments-on-a16zs-why-the-world-still

**Summary:** Commentary on SAP’s role in the global economy and vendor narrative, typically with an HR-tech and enterprise software lens Otter is known for.

**Where it helps:** **Post 1** (why SAP is a distinct AI adoption environment), **post 6** (why “clean core” and vendor roadmaps matter politically, not only technically).

**Fit in the series (examples, WHY):** One paragraph can anchor “**why SAP is different**” before you dive into ADT APIs: long-lived systems, compliance, process depth. WHY: Gives non-SAP readers **context** for why MCP into ERP needs **enterprise-grade** security.

---

## 21. Bryan Cantrill: The peril of laziness lost

**URL:** https://bcantrill.dtrace.org/2026/04/12/the-peril-of-laziness-lost/

**Summary:** Reflection on skill, craft, and what is lost when cognitive or technical “laziness” becomes normalized (framed as a cultural and engineering ethics argument).

**Where it helps:** **Post 1** as a **counterweight** to pure accelerationism; optional closing thought in **post 2**.

**Fit in the series (examples, WHY):** Pair with Stavros (link 5) and your own spectrum of adoption: “Agentic tooling is compatible with **maintaining engineering judgment**; the risk is skipping understanding.” WHY: Prevents the series from reading as “LLM solves ABAP”; it reads as “**LLM assists under constraints**,” which matches SAP reality.

---

## 22. adlrocha: How the “AI loser” may end up winning

**URL:** https://adlrocha.substack.com/p/adlrocha-how-the-ai-loser-may-end

**Summary:** Essay on counterintuitive outcomes where actors perceived as “losing” the AI race may still capture durable value (narrative depends on post content; use after a quick re-read before quoting tightly).

**Where it helps:** **Post 1** or **post 6** as a **speculative close**: consolidation, platform winners, and where **specialized connectors** (like a hardened MCP bridge) might remain valuable even as models commoditize.

**Fit in the series (examples, WHY):** Example angle: “If foundation models commoditize, **integration, identity, and ERP-specific tool quality** become the moat for serious SAP shops.” WHY: Supports why ARC-1’s positioning is **infrastructure and governance**, not “a better prompt.”

---

## 23. SAP Community: “Kiss of Death” for Web Dynpro Java (follow-up questions)

**URL:** https://community.sap.com/t5/additional-blog-posts-by-members/kiss-of-death-for-web-dynpro-java-the-follow-up-questions/ba-p/12877118

**Summary (original piece):** Thorsten Franz, reacting to SAP TechEd **2010**: SAP positioned **Web Dynpro Java** as having reached “maturity” in the lifecycle sense (bugfixes continue, **new feature development largely stops**). The post walks through follow-up questions (BPM interoperability, consistent UX with Web Dynpro ABAP, mobility, what succeeds WD Java) and links the in-community phrase **“Walldorf Kiss of Death”** (sounds gentle in executive wording, still marks the end of forward motion for a technology line).

**Cheeky hook for your series (your framing, not the article’s literal claim):** Some hot takes could label broad ABAP assistance “**kiss of death for ABAP developers**” the same way people read any “maintenance mode” or “commoditized coding” headline. **That parallel is misleading.** ABAP professionals were never only typists; ERP work is process, data, integration, release, security, and review. What changes with LLMs and agentic tooling is that **more roles can produce ABAP-shaped changes and, more importantly, read and reason about ABAP** (diffs, explanations, impact), which shifts emphasis toward **governance, architecture, and tests**, not toward unemployment-by-syntax.

**Where it helps:** **Post 1** (fear vs reality, trust, what “developer” means in SAP), **post 2** (who participates in agentic workflows), **post 6** (clean core and readable code as **shared surface** for humans and assistants).

**Fit in the series (examples, WHY):** Open post 1 with a contrast: the 2010 post is a **documented** example of how SAP ecosystems react when a stack line is formally slowed; your series argues ABAP is **not** in that story if the job is defined as “ERP engineering + assurance.” Example line: “If assistants lower the cost of **writing** a method, the scarce part becomes **knowing which method must not exist** and proving it in QA.” WHY: Gives you a **memorable SAP Community reference** and lets you reject doom framing **without** dismissing real workforce anxiety (redirect to skills: integration, security, reviews, ARC-1 as controlled tool access).

---

## Quick mapping table

| Post topic (from ARC-1.md) | Links that map most directly |
|----------------------------|------------------------------|
| 1. LLMs in SAP development | 1, 3, 5, 6, 7, 11, 14, 18, 19, 20, 21, 22, **23** |
| 2. Agentic ABAP strategies | 1, 4, 8, 12, 16, 18, **23** (+ PDF patterns doc already in folder) |
| 3. ARC-1 intro and security | 4, 12, 15, 17 |
| 4. ARC-1 on BTP | 4, 8, 10 (ops only), 15 |
| 5. Microsoft Copilot | 4, 11, 15 |
| 6. Joule and clean core | 3, 9, 12, 13, 16, **23** |

---

## Bookmark hygiene note

Your `bookmarks_14_04_2026.html` excerpt listed **link 16 twice** (same SAP Community URL). The duplicate did not add a separate resource; this file lists it once.
