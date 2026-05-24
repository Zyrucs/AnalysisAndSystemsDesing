Markdown

# Workshop No. 3: Robust System Design and Project Management

## General Workshop Description
This repository contains the deliverables corresponding to **Workshop No. 3**, which consolidates the transition of the ECM platform from previous conceptual models into a robust, mature, and production-ready architectural blueprint.

The primary focus of this phase consisted of applying advanced software engineering principles (Clean Architecture within a **Java** backend ecosystem and a **React** frontend framework) aligned with international quality standards (**ISO/IEC 25010**), risk management frameworks (**ISO 31000**), and a structured project governance model based on **PMBOK** principles.

---

## Deliverable Structure

The workshop is divided into three strategic components completely codified under the official double-column **IEEEtran** format:

### 1. Enhanced System Design Document
* **System Architecture Refinement:** Evolution of the decoupled domain-driven design (DDD) architecture. Fault tolerance and modularity mechanisms were implemented to concurrently support an academic community of **7,000 potential users**.
* **Risk Management Plan:** A formal technical and operational risk matrix (mitigating server downtime via auto-scaling/Redis and managing concurrent simultaneous lending requests through database transaction locks).
* **Quality Assurance Framework:** Definition of software acceptance metrics, establishing a mandatory minimum threshold of **80% unit test coverage** for the core domain business logic.
* **Evolution Summary:** Synthesis of the lessons learned and design improvements from previous workshops, highlighting the incorporation of behavioral design patterns (such as the *Observer* pattern) based on direct user feedback.

### 2. Project Management Documentation
Each subsection was structured into an ultra-condensed paragraph (fewer than 6 lines per block) to maximize document readability, synthesis, and administrative organization:
* **Project Charter:** Formal project authorization, performance benchmarks (system response time < 2s), and institutional scope definitions.
* **Team Structure and Roles:** Responsibility and accountability matrix segregated into Project Management, Backend Engineering (Java), Frontend Engineering (React), and Quality Assurance (QA).
* **Project Timeline:** Sequential, phased project lifecycle progression (Environment Setup -> Core Domain Codification -> API Integration -> Controlled Pilot Deployment -> Full Institutional Rollout).
* **Resource Management Plan:** Dynamic planning of engineering hours, cloud infrastructure provisioning, and capacity forecasting to handle academic concurrent peak traffic.
* **Communication and Control Plan:** Weekly technical reviews, automated baseline tracking controls, and periodic progress reporting for university administrative approval gates.

### 3. Visual Representations and Tools
All visual artifacts were programmed directly and natively using **TikZ** and **PGFPlots** libraries to guarantee full reproducibility, flawless vector scaling, and seamless Git version-control compatibility:
* **Enhanced System Architecture Diagram:** A three-tier structural model (*Presentation*, *Application Logic*, and *Data/Integration* layers) illustrating synchronous and asynchronous data flows between React components and Java microservices.
* **Risk Management Matrix Visualization (Bubble Chart):** A two-dimensional visual mapping of Probability vs. Impact using an ordinal scale for critical mitigation prioritization under the ISO 31000 standard.
* **Quality Assurance Process Flow:** A detailed flowchart of the Continuous Integration (CI) deployment pipeline, featuring explicit rework loops across three validation levels (Unit, Integration, and UAT).