"""
ECM Platform — Simulation 2: Behavior-Oriented (Agent-Based Model)
Workshop 4 — Systems Analysis & Design, Semester 2026-I
Universidad Distrital Francisco José de Caldas

Dependencies: mesa>=3, numpy, pandas, matplotlib
Run: python simulation_abm.py
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import random
from mesa import Agent, Model

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

STATE_AVAILABLE = "Available"
STATE_ASSIGNED  = "Assigned"
STATE_REPAIR    = "In-Repair"
STATE_OVERDUE   = "Overdue"

LOAN_TICKS       = 30
GRACE_TICKS      = 7
REPAIR_TICKS_MU  = 5
REPAIR_TICKS_SD  = 1.5
CONDITION_DECAY  = 0.015
REPAIR_THRESHOLD = 0.25


def scoring_engine(v, a, h, weights=(0.5, 0.3, 0.2)):
    return v * weights[0] + a * weights[1] + h * weights[2]


# ── Agents ────────────────────────────────────────────────────────────────────

class DeviceAgent(Agent):
    def __init__(self, model):
        super().__init__(model)
        self.state          = STATE_AVAILABLE
        self.condition      = 1.0
        self.assigned_to    = None
        self.ticks_in_state = 0

    def step(self):
        self.ticks_in_state += 1
        if self.state == STATE_ASSIGNED:
            self.condition = max(0, self.condition - CONDITION_DECAY)
            if self.condition <= REPAIR_THRESHOLD:
                self.state = STATE_REPAIR
                self.assigned_to = None
                self.ticks_in_state = 0
                self.model.maint_flags += 1
        elif self.state == STATE_REPAIR:
            repair_time = max(1, int(np.random.normal(REPAIR_TICKS_MU, REPAIR_TICKS_SD)))
            if self.ticks_in_state >= repair_time:
                self.state = STATE_AVAILABLE
                self.condition = 0.8
                self.ticks_in_state = 0
        elif self.state == STATE_OVERDUE:
            if self.ticks_in_state >= GRACE_TICKS + random.randint(1, 10):
                self.state = STATE_AVAILABLE
                self.assigned_to = None
                self.ticks_in_state = 0
                self.model.academic_holds += 1


class StudentAgent(Agent):
    def __init__(self, model):
        super().__init__(model)
        self.v = np.random.beta(2, 3)
        self.a = np.random.beta(3, 2)
        self.h = np.random.beta(4, 1.5)
        self.score       = scoring_engine(self.v, self.a, self.h)
        self.has_device  = False
        self.device      = None
        self.loan_tick   = 0
        self.wait_ticks  = 0
        self.waiting     = False

    def step(self):
        eff_a = min(1.0, self.a * 1.5) if self.model.exam_period else self.a

        if not self.has_device and eff_a > 0.45 and not self.waiting:
            self.waiting = True
            self.wait_ticks = 0
            self.model.total_requests += 1

        if self.waiting:
            self.wait_ticks += 1
            available = [d for d in self.model.devices if d.state == STATE_AVAILABLE]
            if available:
                waiting_students = [s for s in self.model.students if s.waiting]
                if waiting_students:
                    best = max(waiting_students, key=lambda s: s.score)
                    if best.unique_id == self.unique_id:
                        device = available[0]
                        device.state = STATE_ASSIGNED
                        device.assigned_to = self.unique_id
                        self.has_device = True
                        self.device = device
                        self.loan_tick = 0
                        self.waiting = False
                        self.model.wait_times.append(self.wait_ticks)
                        self.model.served += 1

        if self.has_device:
            self.loan_tick += 1
            compliant = random.random() < self.h
            if self.loan_tick >= LOAN_TICKS:
                if compliant or self.loan_tick >= LOAN_TICKS + GRACE_TICKS:
                    if self.device and self.device.state == STATE_ASSIGNED:
                        self.device.state = STATE_AVAILABLE if compliant else STATE_OVERDUE
                        self.device.assigned_to = None
                    self.has_device = False
                    self.device = None

        if self.h < 0.35 and random.random() < 0.12:
            self.model.bypass_events += 1


# ── Model ─────────────────────────────────────────────────────────────────────

class ECMModel(Model):
    def __init__(self, n_students=500, n_devices=200, sim_ticks=180,
                 exam_periods=None):
        super().__init__()
        self.sim_ticks    = sim_ticks
        self.exam_periods = exam_periods or [(60, 75), (150, 165)]
        self.exam_period  = False

        # Counters
        self.total_requests  = 0
        self.served          = 0
        self.academic_holds  = 0
        self.bypass_events   = 0
        self.maint_flags     = 0
        self.weight_recalibs = 0
        self.wait_times      = []
        self.daily_available = []
        self.daily_in_repair = []
        self.daily_queue     = []

        self.devices  = [DeviceAgent(self) for _ in range(n_devices)]
        self.students = [StudentAgent(self) for _ in range(n_students)]
        self.admin_tick = 0

    def step(self):
        t = self.admin_tick
        self.exam_period = any(s <= t <= e for s, e in self.exam_periods)

        for d in self.devices:
            d.step()
        random.shuffle(self.students)
        for s in self.students:
            s.step()

        # Admin: monthly weight recalibration
        if t > 0 and t % 30 == 0:
            demand = self.total_requests
            supply = sum(1 for d in self.devices if d.state == STATE_AVAILABLE)
            ratio  = supply / max(demand, 1)
            new_v  = min(0.65, max(0.35, 0.5 - (ratio - 0.3) * 0.2))
            new_a  = 0.3
            new_h  = round(1 - new_v - new_a, 4)
            for s in self.students:
                s.score = scoring_engine(s.v, s.a, s.h, (new_v, new_a, new_h))
            self.weight_recalibs += 1

        # Snapshot
        avail   = sum(1 for d in self.devices if d.state == STATE_AVAILABLE)
        repair  = sum(1 for d in self.devices if d.state == STATE_REPAIR)
        waiting = sum(1 for s in self.students if s.waiting)
        self.daily_available.append(avail)
        self.daily_in_repair.append(repair)
        self.daily_queue.append(waiting)
        self.admin_tick += 1

    def run(self):
        for _ in range(self.sim_ticks):
            self.step()


# ── Plot ──────────────────────────────────────────────────────────────────────

def plot_abm(model):
    days = list(range(model.sim_ticks))
    fig  = plt.figure(figsize=(13, 9))
    fig.suptitle("ECM Platform — ABM Simulation Results", fontsize=14, fontweight="bold")
    gs   = gridspec.GridSpec(2, 2, figure=fig, hspace=0.4, wspace=0.35)

    BLUE   = "#2E75B6"
    RED    = "#C00000"
    ORANGE = "#E36C09"
    GREEN  = "#70AD47"

    def shade_exams(ax):
        for s, e in model.exam_periods:
            ax.axvspan(s, e, alpha=0.12, color=RED)

    # 1. Device states + queue
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.plot(days, model.daily_available, color=BLUE,   lw=1.5, label="Available")
    ax1.plot(days, model.daily_in_repair, color=ORANGE, lw=1.5, label="In-Repair")
    ax1.plot(days, model.daily_queue,     color=RED,    lw=1.2, linestyle="--", label="Queue")
    shade_exams(ax1)
    ax1.set_title("Device State & Queue Over Time", fontweight="bold")
    ax1.set_xlabel("Simulation Day"); ax1.set_ylabel("Count")
    ax1.legend(fontsize=8)

    # 2. Wait time distribution
    ax2 = fig.add_subplot(gs[0, 1])
    wt = model.wait_times
    if wt:
        ax2.hist(wt, bins=25, color=BLUE, edgecolor="white", linewidth=0.6)
        ax2.axvline(np.mean(wt), color=RED, linestyle="--", lw=1.5,
                    label=f"Mean = {np.mean(wt):.1f}d")
        ax2.legend(fontsize=8)
    ax2.set_title("Wait Time Distribution", fontweight="bold")
    ax2.set_xlabel("Wait Time (days)"); ax2.set_ylabel("Frequency")

    # 3. Equity index vs V weight
    ax3 = fig.add_subplot(gs[1, 0])
    v_weights = np.arange(0.20, 0.71, 0.05)
    eq_idx    = []
    for vw in v_weights:
        aw  = 0.3
        hw  = round(1 - vw - aw, 4)
        rng = np.random.default_rng(SEED)
        vs  = rng.beta(2, 3, 300)
        as_ = rng.beta(3, 2, 300)
        hs  = rng.beta(4, 1.5, 300)
        scores = vs * vw + as_ * aw + hs * hw
        q1 = np.mean(scores[vs < np.percentile(vs, 25)])
        q4 = np.mean(scores[vs > np.percentile(vs, 75)])
        eq_idx.append(q1 / max(q4, 1e-6))
    ax3.plot(v_weights, eq_idx, color=BLUE, lw=2, marker="o", markersize=4)
    ax3.axvline(0.5,  color=GREEN,  linestyle="--", lw=1.5, label="Designed V=0.5")
    ax3.axvline(0.35, color=ORANGE, linestyle=":",  lw=1.2, label="Lower bound V=0.35")
    ax3.set_title("Equity Index vs V Weight", fontweight="bold")
    ax3.set_xlabel("V Weight"); ax3.set_ylabel("Equity Index (Q1/Q4)")
    ax3.legend(fontsize=8)

    # 4. Emergent events
    ax4 = fig.add_subplot(gs[1, 1])
    labels_bar = ["Academic\nHolds", "Bypass\nEvents", "Maintenance\nFlags", "Weight\nRecalibs"]
    values_bar = [model.academic_holds, model.bypass_events, model.maint_flags, model.weight_recalibs]
    bar_colors = [RED, ORANGE, ORANGE, GREEN]
    bars = ax4.bar(labels_bar, values_bar, color=bar_colors, edgecolor="white", linewidth=1)
    for b in bars:
        ax4.text(b.get_x() + b.get_width()/2, b.get_height() + 0.3,
                 str(int(b.get_height())), ha="center", va="bottom", fontsize=9)
    ax4.set_title("Emergent Event Summary", fontweight="bold")
    ax4.set_ylabel("Count")

    plt.savefig("/mnt/user-data/outputs/abm_results.png", dpi=150, bbox_inches="tight")
    plt.close()
    print("[ABM] Chart saved → abm_results.png")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Running ECM Agent-Based Model (180 ticks = 1 semester)...")
    model = ECMModel(n_students=500, n_devices=200, sim_ticks=180)
    model.run()

    wt       = model.wait_times
    served   = model.served
    holds    = model.academic_holds
    recovery = (served - holds) / max(served, 1) * 100

    print(f"\n{'='*50}")
    print(f"  ABM Results (180-day semester)")
    print(f"{'='*50}")
    print(f"  Total requests        : {model.total_requests}")
    print(f"  Served                : {served}")
    print(f"  Avg wait time (days)  : {np.mean(wt):.2f}" if wt else "  No wait data")
    print(f"  Recovery rate         : {recovery:.1f}%")
    print(f"  Academic holds        : {holds}")
    print(f"  Bypass events         : {model.bypass_events}")
    print(f"  Maintenance flags     : {model.maint_flags}")
    print(f"  Weight recalibrations : {model.weight_recalibs}")

    plot_abm(model)

    pd.DataFrame([
        {"Metric": "Total Requests",        "Value": model.total_requests},
        {"Metric": "Served",                "Value": served},
        {"Metric": "Avg Wait (days)",       "Value": round(np.mean(wt), 2) if wt else 0},
        {"Metric": "Recovery Rate (%)",     "Value": round(recovery, 1)},
        {"Metric": "Academic Holds",        "Value": holds},
        {"Metric": "Bypass Events",         "Value": model.bypass_events},
        {"Metric": "Maintenance Flags",     "Value": model.maint_flags},
        {"Metric": "Weight Recalibrations", "Value": model.weight_recalibs},
    ]).to_csv("/mnt/user-data/outputs/abm_results.csv", index=False)
    print("[ABM] CSV saved → abm_results.csv")
