# Workshop No. 4: System Simulation and Validation


## General Workshop Description
This repository contains the deliverables corresponding to **Workshop No. 4**, which marks the final phase of the systems engineering lifecycle for the Equipment and Connectivity Management Platform (ECM). Building upon the structural, analytical, and architectural foundations established in previous workshops, this phase implements computational simulation and empirical validation models.

The primary focus of this workshop is to stress-test core architectural decisions, characterize emergent behaviors within a complex socio-technical system of up to 7,000 potential users, and supply quantitative evidence to validate or refine the design specifications before moving into physical pilot deployment.

---

## Simulation Methodology

To comprehensively evaluate the operational range of the ECM platform, two complementary computational simulation paradigms were developed using Python as the core runtime environment:

### 1. Process-Oriented Model: Discrete-Event Simulation (DES)
* **Framework:** Implemented via the `SimPy` engine alongside `Pandas` and `Matplotlib` for statistical processing and graphing.
* **Scope:** Replicates the linear and sequential workflow of device requests, administrative validation queues, priority calculation batches, loan period transitions, and return inventories under continuous simulated time.

### 2. Behavior-Oriented Model: Agent-Based Modeling (ABM)
* **Framework:** Implemented via the `Mesa` library framework.
* **Scope:** Captures non-linear dynamics and emergent social patterns arising from individual interactions between heterogeneous Student Agents ($n=7,000$), Device Agents ($n=200$) with discrete operational condition tracking, and an Administrator Agent executing system policies.

---

## Operational Scenarios & Quantitative Findings

The simulation framework evaluated three rigorous scenarios calibrated using primary data collected from early project phases:

* **Baseline Scenario:** Evaluated 840 active requests per 30-day allocation cycle with standard user distributions. The system yielded an average device assignment wait time of 2.1 days, an Asset Rotation Index of 9.2 days, and a 94.3% asset recovery rate. The Automated Scoring Engine processed batches within 0.3 simulated seconds, complying with the sub-2-second response SLA.
* **Optimized Scenario:** Enabled proactive maintenance scheduling and demand-driven weight recalibrations. Average wait time was reduced to 1.4 days (a 33% efficiency improvement) and the device recovery rate climbed to 98.7%, confirming operational targets.
* **Stress / Failure Scenario:** Simulated peak end-of-semester examination periods with demand surging to 1,400 concurrent requests while 30% of the hardware fleet was simultaneously sidelined for repairs. Average wait times degraded to 8.6 days, creating an immediate physical shortage of approximately 28 units.

---

## Emergent Behaviors and Technical Risk Discoveries

The behavior-oriented models unmasked critical system vulnerabilities that remained hidden during static architectural reviews:

* **Maintenance Avalanche Effect:** Under peak demand windows, intensive concurrent device usage accelerated wear uniformly across the hardware fleet. This caused correlated infrastructure aging, pushing over 25% of the total units into repair state within the same two-week window and inducing cascading supply shortages.
* **Server Scaling Ceiling:** System performance logs detected measurable request processing and response time degradation once concurrent validation inquiries surpassed 1,200 requests per minute. This identifies an architectural constraint threatening the 99.9% uptime SLA during examination spikes.
* **Connectivity Circumvention Spikes:** Student agents possessing low historical compliance profiles exhibited repeated domain-filtering bypass maneuvers when access restrictions were applied. This behavior generated anomalous localized bandwidth consumption spikes reaching 2.3x the average consumption baseline.
* **Scoring Weight Sensitivity Constraints:** Parameter sweeps revealed that dropping the vulnerability weight parameter ($V$) below 0.35 severely undermined social equity targets, cutting resource allocations to the most vulnerable group by 40%. Conversely, increasing $V$ above 0.65 impaired academic load responsiveness during peak workloads.

---

## Design Improvements and Architectural Recommendations

To address the findings uncovered during simulation, the following immediate adjustments have been integrated into the engineering roadmap:

* **Staggered Preventive Maintenance:** Implement a rolling maintenance window schedule restricting concurrent repairs to a maximum of 10% of the active fleet at any single moment, eliminating the maintenance avalanche trigger.
* **Horizontal Auto-Scaling Provisioning:** Configure infrastructure triggers to auto-scale the application tier horizontally when request volumes exceed 800 requests per minute to preserve the 99.9% uptime SLA.
* **Fleet Volume Expansion:** Increase the institutional equipment baseline by a minimum of 20 units (a 10% inventory expansion) to mitigate asymmetric wait-time sensitivity under high-stress conditions.
* **Scoring Engine Calibration Framework:** Establish quarterly equity audit procedures to dynamically adjust $V$ within a bounded 0.45-0.55 range, and integrate a wait-time bonus modifier to prevent permanent queue stagnation for borderline applicants.
