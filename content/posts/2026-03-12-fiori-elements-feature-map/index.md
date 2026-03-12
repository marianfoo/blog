---
title: "SAP Fiori Elements Feature Map: What Is Available in Each SAPUI5 Version"
date: 2026-03-11T20:55:00+01:00
draft: false
description: "Interactive SAP Fiori Elements feature map with search, filters, sorting, and daily automated updates."
tags: ["sap", "fiori", "fiori-elements", "ui5", "feature-map", "automation"]
categories: ["Overview"]
author: "Marian Zeis"
showToc: false
mainWidth: "1080px"
cover:
  image: "featuremap.jpg"
  alt: "SAP Fiori Elements Feature Map showing the interactive table with search, filters, and version availability."
  relative: true
  hiddenInSingle: true
images:
  - "featuremap.jpg"
---

If you work with SAP Fiori Elements, you have probably run into this problem before:  
it is hard to see in which UI5 version a specific feature was introduced.

Bjorn Schulz already built a strong matrix for ABAP: [ABAP Feature Matrix](https://software-heroes.com/abap-feature-matrix).  
For Fiori Elements and RAP/CAP, there was no comparable matrix yet.

So I created an Influence request to close this gap:  
[influence.sap.com/sap/ino/#idea/351729](https://influence.sap.com/sap/ino/#idea/351729)

The new Developer Portal would be a great home for a matrix like this but so far, there still is no official version.  
The closest alternative is the [SAP Fiori Elements Feature Map](https://ui5.sap.com/#/topic/62d3f7c2a9424864921184fd6c7002eb) in the SAPUI5 documentation.

The challenge is that SAPUI5 docs are published per version, so you mostly see a point-in-time view.  
You do not get a clear cross-version overview showing when a feature first appeared.

That is why I decided to fetch the feature map for each version and compare when a feature first appears.  
The result is the feature map below, updated automatically whenever new versions are released.

You can filter by features, floorplans, and versions, and sort by the key columns.  
The data is taken directly from the official feature list.

Since the feature map in the SAPUI5 documentation has not been clearly managed, there are sometimes discrepancies.  
You can see this more clearly in the [feature matrix markdown](/feature-map/fe-feature-matrix.md).

**Download the data:** [JSON](/feature-map/fe-feature-adoption.json) · [CSV](/feature-map/fe-feature-adoption.csv) · [Markdown](/feature-map/fe-feature-adoption.md)

{{< fe-feature-map >}}