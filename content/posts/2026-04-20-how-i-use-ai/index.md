---
title: "How I Use AI for Development and Why Context Matters"
date: 2026-04-20T20:00:00+02:00
draft: false
description: "How I actually use AI in software development today, why context matters more than hype, and why this gets much harder in SAP."
tags: ["ai", "llm", "sap", "mcp", "abap", "agentic", "development"]
categories: ["General"]
author: "Marian Zeis"
showToc: false
cover:
  image: "image.png"
  alt: "Screenshot of the AI development workflow with ChatGPT, Claude Code, and MCP servers."
  relative: true
images:
  - "image.png"
keywords: ["AI development workflow", "context engineering", "SAP AI development", "ABAP AI", "MCP", "agentic coding"]
---

When it comes to AI, I do not really think about magic.

I think more about another colleague helping me out.

Sometimes that means architecture. Sometimes implementation. Sometimes testing, review, CI/CD, or deployment.

But this only works with trust, and trust needs communication.

If I do not know something, I ask. If code looks strange, I ask. If tests fail, I ask.

The less I need to ask, the more likely it is because I already gave enough context up front: architecture, documentation, constraints, examples, and what I actually want. Even then I still review the result.

That is why using AI well is a skill you build over time.

My first larger projects with AI were much less smooth than newer ones. Over time I learned that better context, better tooling, and better guardrails lead to much better results. AI can speed things up a lot, but it does not remove engineering judgement.

## My workflow changed over the last year

Last year I was mostly just using ChatGPT directly, before tools like Claude Code became more normal. I asked something, copied the generated code into my project, checked if it runs, copied the error back if it failed, and repeated that loop.

The error message was context. The result of trying it out was context. That manual loop slowly improved the output.

What changed over time was not only the model. More and more the AI can get context itself.

Before I had to spoon feed much more manually. Now tools can search, read docs, inspect files, and in some cases get the needed context on their own. For me that is one of the biggest improvements, because the AI does not only answer, it can first understand more.

That is also why I liked [How I write software with LLMs](https://www.stavros.io/posts/how-i-write-software-with-llms/) by Stavros. Not because I use exactly the same workflow, but because it shows quite well that this is not only about the model. The workflow around the model matters a lot as well.

## Context matters more than people first think

A lot of the time the biggest value is not even that the model writes code for me.

Very often it helps with understanding. It can explain a codebase, compare options, write down a plan, summarize documentation, help with tests and refactoring, or point me to the next thing I should check. For a lot of developers that alone is already useful, without going fully agentic.

In many projects the important information is not only in the source code. It is in documentation, issues, diagrams, product docs, logs, dumps, table data, screenshots, pipeline output, and things people in the team just know. If the model only sees one file, it often gives you an answer that sounds nice but misses the actual problem.

That is why I really liked the post [Context is the Difference Between Slop and Shipping](https://secondphase.com.au/context-slop-vs-shipping/). I think the core point is right.

If you do not understand the system first, or if the model does not get the right grounding, then you just get plausible looking nonsense faster. It looks like momentum, but often it is just wrong output with confidence.

One of the first places where I really noticed this was UI5, especially with controls like the UI5 Wizard. I had to explain the API again and again, and without that extra context the output was often just wrong. That was one of the first moments where I noticed more clearly that in SAP development good context is not optional.

Especially in SAP I noticed pretty quickly that you need some kind of grounding. You want to be able to say: use this documentation, use this guideline, use this code reference, trust this as the source of truth and do not just invent something.

It still hallucinates sometimes, that does not fully go away, but it becomes less. Especially weaker models benefit a lot from having the right information at the right time.

## Why I care so much about tooling around the model

That is also one reason why last year I started building my own MCP server for context. It can search GitHub repositories, SAP Help, and related sources, so I can bring better grounding into the workflow.

For SAP development especially this helped, because so much is not directly visible in one code file. If the model can pull in SAP documentation, guidelines, and related references, it gets pushed much more into the right direction.

I now almost always have that SAP docs setup with me. At the beginning it felt even more important, because the models were weaker and hallucinations were stronger. Today it is a bit better with the stronger frontier models.

I also noticed this with BTP and Cloud Foundry work. There the models can often already use the CLI and public documentation quite well. So the models are improving.

But the more special something gets, the more hidden it is, or the more SAP specific it is, the more important that extra context becomes again.

That is also why I do not find the current AI discussion fully convincing sometimes. People talk a lot about models, but much less about the system around the model. To me, context and tooling matter more in real projects than benchmark discussions alone.

## Model quality still matters, but it is not the whole story

I already wrote two separate blog posts about ABAP LLM benchmark results, one more around [code generation](https://blog.zeis.de/posts/2026-02-09-abap-llm-benchmark/) and one around [understanding](https://blog.zeis.de/posts/2026-03-05-abap-llm-benchmark-understanding/).

My takeaway there was that strong general models are currently still the more practical choice for me, and that tooling and grounding are often the bigger lever than hoping for one SAP specific model to solve everything by itself.

What also helps a lot is that my MCP SAP docs setup is not only pure API documentation. There are also style guides, DSAG guidelines, and other recommendations in there. These are often not hard rules, but they still push you in a certain direction. So even if I do not know the exact recommendation by heart, I can ask the model to look for guidelines and it gets nudged more automatically towards a better direction.

And context is not only documentation. If I say change this class, then the context is not just that class. It is also the tables that are used, the other classes that are called, similar implementations, internal guidelines, what this system can even do, and what is already there in working code. That broader context improves quality a lot more than just throwing one file at the model.

## I am still skeptical of full agentic hype

There is also a very practical spectrum in how much AI help you even want. You can just ask questions about context. You can ask it to find docs and let you read them. You can use it for analysis and planning. Or you can let it implement things more autonomously. That is not one binary choice. It is more a slider, and depending on the project, the team, and the risk, you move that slider differently.

At the same time I am still not sure that going more agentic automatically makes you faster. Pure AI assistance already helps me a lot. But once it becomes more agentic, other things get harder again. The coding itself is very fast, but then you spend more time on plans, instructions, guardrails, review, and correction.

This also matches quite well with the [METR study on experienced open-source developers](https://arxiv.org/abs/2507.09089). What I found interesting there is not some simple "AI bad" takeaway, but more the gap between feeling faster and actually being faster.

If less time goes into typing code, but more time goes into prompting, reviewing, waiting, and correcting, then it can still feel fast while the total time says something else. That matches quite well with what I notice myself.

At the same time I also do not want to overcorrect too much into pure skepticism. The post [Eight years of wanting, three months of building with AI](https://lalitm.com/post/building-syntaqlite-ai/) is a good counterexample. AI helped a lot there, but the first more maximalist agentic approach also created a messy codebase, and things only got better again with tighter ownership and stronger review. That feels much closer to reality than either extreme.

For me there is still a big difference between strong AI assistance and just letting the agent fully take over. Writing the code is now often the easiest part. I spend more time before coding on research, testing, planning, and architecture. And I spend more time after coding on review, rework, manual testing, and documentation.

It is still faster in my opinion, but the time moved.

## Process helps, but process is also overhead

This also fits well to [How I teach Claude Code to work my way](https://community.sap.com/t5/artificial-intelligence-blogs-posts/how-i-teach-claude-code-to-work-my-way/ba-p/14349299). What I like there is that the focus is not on one magical prompt, but on process. Explore first, think first, plan first, then execute.

I do not use exactly the same process everywhere, but the general idea fits very well to what I learned myself. If you give the AI a process, it usually follows one. If you do not, it drifts more easily. At the same time, process also creates overhead, so it is only worth it when the task is big enough.

That is also why I often want the model to first find a reference before it gives me a strong answer. Search for the SAP documentation. Find the guideline. Show me a similar implementation. Do not just make something up because it sounds right.

## Why this gets harder in SAP

Security is also part of that trust question. How much trust do you put in the llm itself, how much in the model provider, and how much in the tools around it? How much security are you willing to give up to move faster? For toy projects people often accept a lot of risk. In enterprise development that looks very different.

In SAP this matters even more, because so much important context is outside the code itself. The actual code change can be very small, but understanding why you need that change can require docs, config, logs, dumps, table entries, business process context, authorizations, and knowledge about how the landscape is set up.

At the same time SAP is also moving. I was pleasantly surprised when SAP released MCP servers for [UI5](https://community.sap.com/t5/technology-blog-posts-by-sap/give-your-ai-agent-some-tools-introducing-the-ui5-mcp-server/bc-p/14206959), [CAP](https://community.sap.com/t5/technology-blog-posts-by-sap/boost-your-cap-development-with-ai-introducing-the-mcp-server-for-cap/ba-p/14202849), and [Fiori](https://community.sap.com/t5/technology-blog-posts-by-sap/sap-fiori-tools-update-first-release-of-the-sap-fiori-mcp-server-for/ba-p/14204694).

In that world it already feels much more natural, because a lot of that development is off stack anyway. You work locally, use git, run pipelines, get peer review, and if something goes wrong you can usually revert it. That is much easier territory for AI assisted development.

So the interesting question for me is not if AI can help in SAP development. It already can. The more interesting question is where it helps today, where it becomes risky, and why especially ABAP development is still much harder than frontend or CAP development.

In frontend and CAP development, AI can already fit quite naturally into workflows many teams already have. In ABAP, things look very different.

The next post is where I want to look more concrete at that gap: what is already possible today, which patterns exist, and why enterprise guardrails matter much more there.

## References & links

- [How I write software with LLMs](https://www.stavros.io/posts/how-i-write-software-with-llms/)
- [Context is the Difference Between Slop and Shipping](https://secondphase.com.au/context-slop-vs-shipping/)
- [Eight years of wanting, three months of building with AI](https://lalitm.com/post/building-syntaqlite-ai/)
- [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://arxiv.org/abs/2507.09089)
- [How I teach Claude Code to work my way](https://community.sap.com/t5/artificial-intelligence-blogs-posts/how-i-teach-claude-code-to-work-my-way/ba-p/14349299)
- [Finally: An MCP Server for ABAP](https://blog.zeis.de/posts/2026-02-04-abap-mcp-server/)
- [SAP MCP Servers: The Missing Overview](https://blog.zeis.de/posts/2026-03-05-sap-ai-mcp-servers-overview/)
- [Benchmarking LLMs for ABAP: Why ABAP-1 Isn't a Code Generator (Yet)](https://blog.zeis.de/posts/2026-02-09-abap-llm-benchmark/)
- [SAP’s ABAP-1 Loses Every ABAP Benchmark, Even “Explaining”](https://blog.zeis.de/posts/2026-03-05-abap-llm-benchmark-understanding/)
- [Give Your AI Agent Some Tools: Introducing the UI5 MCP Server](https://community.sap.com/t5/technology-blog-posts-by-sap/give-your-ai-agent-some-tools-introducing-the-ui5-mcp-server/bc-p/14206959)
- [Boost your CAP Development with AI: Introducing the MCP Server for CAP](https://community.sap.com/t5/technology-blog-posts-by-sap/boost-your-cap-development-with-ai-introducing-the-mcp-server-for-cap/ba-p/14202849)
- [SAP Fiori Tools Update – First Release of the SAP Fiori MCP Server for Agentic AI Workflows](https://community.sap.com/t5/technology-blog-posts-by-sap/sap-fiori-tools-update-first-release-of-the-sap-fiori-mcp-server-for/ba-p/14204694)
