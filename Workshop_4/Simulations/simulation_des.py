"""
ECM Platform — Simulation 1: Process-Oriented (Discrete-Event Simulation)
Workshop 4 — Systems Analysis & Design, Semester 2026-I
Universidad Distrital Francisco José de Caldas

Dependencies: simpy, numpy, pandas, matplotlib
Run: python simulation_des.py
"""

import simpy
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from dataclasses import dataclass, field
from typing import List
import random

# ── Reproducibility ──────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# ── Scenario parameters ───────────────────────────────────────────────────────
SCENARIOS = {
    "Baseline": {
        "num_devices":      200,
        "demand_rate":      840 / 30,      # requests/day
        "maintenance_prob": 0.08,
        "return_compliance": 0.943,
        "scoring_weights":  (0.5, 0.3, 0.2),
        "sim_days":         180,
    },
    "Optimized": {
        "num_devices":      200,
        "demand_rate":      840 / 30,
        "maintenance_prob": 0.04,           # proactive maintenance halves failures
        "return_compliance": 0.987,
        "scoring_weights":  (0.5, 0.3, 0.2),
        "sim_days":         180,
    },
    "Stress": {
        "num_devices":      200,
        "demand_rate":      1400 / 30,      # exam period peak
        "maintenance_prob": 0.12,           # higher wear
        "return_compliance": 0.812,
        "scoring_weights":  (0.5, 0.3, 0.2),
        "sim_days":         180,
    },
}

LOAN_DAYS      = 30
GRACE_DAYS     = 7
REPAIR_DAYS_MU = 5
REPAIR_DAYS_SD = 1.5


# ── Metrics collector ─────────────────────────────────────────────────────────
@dataclass
class Metrics:
    wait_times:      List[float] = field(default_factory=list)
    rotation_times:  List[float] = field(default_factory=list)
    hold_events:     int = 0
    served:          int = 0
    queued_peak:     int = 0
    daily_available: List[int] = field(default_factory=list)
    daily_queue:     List[int] = field(default_factory=list)


# ── Scoring engine ────────────────────────────────────────────────────────────
def score(v, a, h, weights):
    return v * weights[0] + a * weights[1] + h * weights[2]


# ── ECM simulation process ────────────────────────────────────────────────────
def student_request(env, devices, metrics, params, student_id):
    """Lifecycle of a single student device request."""
    # Generate student attributes
    v = np.random.beta(2, 3)          # vulnerability (skewed toward lower)
    a = np.random.beta(3, 2)          # academic load
    h = np.random.beta(4, 1.5)        # compliance history
    s = score(v, a, h, params["scoring_weights"])

    arrival = env.now
    with devices.request(priority=1 - s) as req:   # higher score = lower priority number
        result = yield req | env.timeout(14)        # abandon after 14 days waiting
        wait = env.now - arrival
        metrics.wait_times.append(wait)

        if req.triggered:
            metrics.served += 1
            # Loan period
            loan_days = LOAN_DAYS
            compliant = random.random() < params["return_compliance"]
            if not compliant:
                loan_days += GRACE_DAYS + random.randint(1, 10)
                metrics.hold_events += 1

            yield env.timeout(loan_days)

            # Maintenance check after return
            if random.random() < params["maintenance_prob"]:
                repair_time = max(1, np.random.normal(REPAIR_DAYS_MU, REPAIR_DAYS_SD))
                metrics.rotation_times.append(loan_days + repair_time)
                yield env.timeout(repair_time)
            else:
                metrics.rotation_times.append(loan_days)


def monitor(env, devices, metrics, sim_days):
    """Record daily snapshot of device state."""
    while env.now < sim_days:
        metrics.daily_available.append(devices.capacity - devices.count)
        metrics.daily_queue.append(len(devices.queue))
        metrics.queued_peak = max(metrics.queued_peak, len(devices.queue))
        yield env.timeout(1)


def request_generator(env, devices, metrics, params):
    """Generate student requests following a Poisson process."""
    student_id = 0
    while True:
        interarrival = np.random.exponential(1 / params["demand_rate"])
        yield env.timeout(interarrival)
        env.process(student_request(env, devices, metrics, params, student_id))
        student_id += 1


# ── Run one scenario ──────────────────────────────────────────────────────────
def run_scenario(name, params):
    env     = simpy.Environment()
    devices = simpy.PriorityResource(env, capacity=params["num_devices"])
    metrics = Metrics()

    env.process(request_generator(env, devices, metrics, params))
    env.process(monitor(env, devices, metrics, params["sim_days"]))
    env.run(until=params["sim_days"])

    avg_wait     = np.mean(metrics.wait_times)   if metrics.wait_times     else 0
    avg_rotation = np.mean(metrics.rotation_times) if metrics.rotation_times else 0
    recovery     = 1 - (metrics.hold_events / max(metrics.served, 1))

    print(f"\n{'='*50}")
    print(f"  Scenario: {name}")
    print(f"{'='*50}")
    print(f"  Requests served        : {metrics.served}")
    print(f"  Avg wait time (days)   : {avg_wait:.2f}")
    print(f"  Avg rotation (days)    : {avg_rotation:.2f}")
    print(f"  Recovery rate          : {recovery*100:.1f}%")
    print(f"  Academic hold events   : {metrics.hold_events}")
    print(f"  Peak queue depth       : {metrics.queued_peak}")

    return {
        "name":          name,
        "served":        metrics.served,
        "avg_wait":      avg_wait,
        "avg_rotation":  avg_rotation,
        "recovery_rate": recovery * 100,
        "hold_events":   metrics.hold_events,
        "peak_queue":    metrics.queued_peak,
        "daily_avail":   metrics.daily_available,
        "daily_queue":   metrics.daily_queue,
    }


# ── Plots ─────────────────────────────────────────────────────────────────────
def plot_results(results):
    names   = [r["name"] for r in results]
    colors  = ["#2E75B6", "#70AD47", "#C00000"]

    fig, axes = plt.subplots(2, 2, figsize=(12, 8))
    fig.suptitle("ECM Platform — DES Simulation Results", fontsize=14, fontweight="bold")

    # 1. Avg wait time
    ax = axes[0, 0]
    bars = ax.bar(names, [r["avg_wait"] for r in results], color=colors, edgecolor="white", linewidth=1.2)
    ax.set_title("Average Wait Time (days)", fontweight="bold")
    ax.set_ylabel("Days")
    for b in bars:
        ax.text(b.get_x() + b.get_width()/2, b.get_height() + 0.1,
                f"{b.get_height():.1f}", ha="center", va="bottom", fontsize=10)
    ax.set_ylim(0, max(r["avg_wait"] for r in results) * 1.25)

    # 2. Recovery rate
    ax = axes[0, 1]
    bars = ax.bar(names, [r["recovery_rate"] for r in results], color=colors, edgecolor="white", linewidth=1.2)
    ax.set_title("Recovery Rate (%)", fontweight="bold")
    ax.set_ylabel("%")
    ax.set_ylim(70, 102)
    ax.axhline(98, color="gray", linestyle="--", linewidth=0.8, label="Target 98%")
    ax.legend(fontsize=8)
    for b in bars:
        ax.text(b.get_x() + b.get_width()/2, b.get_height() + 0.2,
                f"{b.get_height():.1f}%", ha="center", va="bottom", fontsize=10)

    # 3. Asset rotation index
    ax = axes[1, 0]
    bars = ax.bar(names, [r["avg_rotation"] for r in results], color=colors, edgecolor="white", linewidth=1.2)
    ax.set_title("Asset Rotation Index (days)", fontweight="bold")
    ax.set_ylabel("Days")
    for b in bars:
        ax.text(b.get_x() + b.get_width()/2, b.get_height() + 0.1,
                f"{b.get_height():.1f}", ha="center", va="bottom", fontsize=10)

    # 4. Daily available devices over time (Baseline only for clarity)
    ax = axes[1, 1]
    for r, c in zip(results, colors):
        days = list(range(len(r["daily_avail"])))
        ax.plot(days, r["daily_avail"], color=c, linewidth=1.2, label=r["name"], alpha=0.85)
    ax.set_title("Daily Available Devices Over Time", fontweight="bold")
    ax.set_xlabel("Simulation Day")
    ax.set_ylabel("Available Devices")
    ax.legend(fontsize=8)

    plt.tight_layout()
    plt.savefig("/mnt/user-data/outputs/des_results.png", dpi=150, bbox_inches="tight")
    plt.close()
    print("\n[DES] Chart saved → des_results.png")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    results = [run_scenario(name, params) for name, params in SCENARIOS.items()]
    plot_results(results)

    df = pd.DataFrame([{
        "Scenario":       r["name"],
        "Served":         r["served"],
        "Avg Wait (d)":   round(r["avg_wait"], 2),
        "Rotation (d)":   round(r["avg_rotation"], 2),
        "Recovery (%)":   round(r["recovery_rate"], 1),
        "Hold Events":    r["hold_events"],
        "Peak Queue":     r["peak_queue"],
    } for r in results])
    print(f"\n{df.to_string(index=False)}")
    df.to_csv("/mnt/user-data/outputs/des_results.csv", index=False)
    print("[DES] CSV saved → des_results.csv")
