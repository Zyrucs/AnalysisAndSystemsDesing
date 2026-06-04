"""
ECM Automated Scoring Engine
S = (V * 0.5) + (A * 0.3) + (H * 0.2)

V = vulnerability_index  [0,1]
A = academic_load        [0,1]
H = compliance_history   [0,1]
"""

from typing import Tuple

# Default weights from Workshop 2 design specification
DEFAULT_WEIGHTS = (0.5, 0.3, 0.2)

# Adaptive weight bounds (from Workshop 4 parameter sweep)
V_MIN, V_MAX = 0.35, 0.65
A_FIXED      = 0.30


def compute_score(
    vulnerability_index: float,
    academic_load: float,
    compliance_history: float,
    weights: Tuple[float, float, float] = DEFAULT_WEIGHTS,
) -> float:
    """
    Compute the ECM priority score for a student request.
    Returns a float in [0, 1]; higher = higher priority.
    """
    v_w, a_w, h_w = weights
    score = (
        vulnerability_index * v_w +
        academic_load       * a_w +
        compliance_history  * h_w
    )
    return round(min(max(score, 0.0), 1.0), 4)


def priority_band(score: float) -> str:
    """Classify score into a human-readable priority band."""
    if score >= 0.70:
        return "High"
    elif score >= 0.45:
        return "Medium"
    return "Low"


def score_breakdown(
    vulnerability_index: float,
    academic_load: float,
    compliance_history: float,
    weights: Tuple[float, float, float] = DEFAULT_WEIGHTS,
) -> dict:
    v_w, a_w, h_w = weights
    return {
        "vulnerability_contribution": round(vulnerability_index * v_w, 4),
        "academic_contribution":      round(academic_load       * a_w, 4),
        "compliance_contribution":    round(compliance_history  * h_w, 4),
        "weights_used":               {"V": v_w, "A": a_w, "H": h_w},
    }


def adaptive_recalibrate(demand: int, supply: int) -> Tuple[float, float, float]:
    """
    Monthly adaptive recalibration of scoring weights.
    If supply/demand ratio drops, increase V weight to protect
    the most vulnerable students (as validated in Workshop 4 ABM).
    """
    ratio = supply / max(demand, 1)
    new_v = round(min(V_MAX, max(V_MIN, 0.5 - (ratio - 0.3) * 0.2)), 4)
    new_a = A_FIXED
    new_h = round(1.0 - new_v - new_a, 4)
    return (new_v, new_a, new_h)
