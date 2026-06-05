# Scoring Logic — How It Works

## Overview

The IS Security Framework uses a **two-tier weighted average** scoring model aligned with ISO/IEC 27001:2022 Annex A controls. This document explains how maturity ratings translate into domain scores and an overall organizational security maturity score.

---

## Step 1: Each Control Gets a Maturity Rating

Every ISO 27001 control (93 total across 4 domains) is rated on a **7-point maturity scale**:

| Level           | Score | Meaning                                                                 |
|-----------------|-------|-------------------------------------------------------------------------|
| ? Unknown       | 0     | Not yet assessed                                                        |
| Nonexistent     | 1     | Totally absent — not even planned                                       |
| Initial         | 2     | Development has barely started; significant work required                |
| Limited         | 3     | Progressing nicely but not yet complete                                  |
| Defined         | 4     | Mostly complete but not fully implemented, enforced, or supported by top management |
| Managed         | 5     | Implemented and recently started operating                              |
| Optimized       | 6     | Fully satisfied, actively monitored and improved, with audit evidence   |
| Not Applicable  | —     | Control does not apply to this organization; excluded from scoring      |

**Best possible score per control: 6 (Optimized)**

---

## Step 2: Controls Have Weights

Not all controls carry the same importance. Each control has a **numeric weight** reflecting its criticality to the organization's security posture:

| Criticality | Weight | Description                              |
|-------------|--------|------------------------------------------|
| Critical    | 3.0    | Core security controls (e.g., access control, incident management, encryption at rest) |
| High        | 2.0    | Important controls (e.g., supplier security, authentication, remote working) |
| Medium      | 1.0    | Standard controls (e.g., desk policy, equipment disposal, acceptable use) |
| Low         | 0.5    | Controls with limited applicability       |

A Critical control rated "Initial" (score 2) has more impact on the overall score than a Low control rated "Managed" (score 5).

---

## Step 3: Domain Score (Tier 1 — Weighted Average of Controls)

The 93 controls are grouped into **4 ISO 27001 Annex A domains**. Each domain's score is a weighted average of its controls:

```
Domain Score = SUM(control_score × control_weight) / SUM(control_weight)
```

Only controls with a scorable maturity level are included. Controls marked "Not Applicable" are excluded from both the numerator and denominator.

### Domain Breakdown

| Domain | Code | Controls | Domain Weight | Description             |
|--------|------|----------|---------------|-------------------------|
| Organizational controls | A5 | 37 | 30% | Policies, governance, compliance, supplier management |
| People controls          | A6 | 8  | 15% | HR security, awareness, training                     |
| Physical controls        | A7 | 14 | 20% | Facility security, equipment, environmental           |
| Technological controls   | A8 | 34 | 35% | IT security, network, application, data protection    |

---

## Step 4: Overall Score (Tier 2 — Weighted Average of Domains)

The overall organizational maturity score is a weighted average of the domain scores:

```
Overall Score = SUM(domain_score × domain_weight) / SUM(domain_weight)
```

This produces a single number from **0 to 6** representing the organization's overall information security maturity.

### Interpreting the Overall Score

| Score Range | Maturity Band | Interpretation                                      |
|-------------|---------------|-----------------------------------------------------|
| 0.0 – 1.0  | Nonexistent   | Security program has not been established            |
| 1.1 – 2.0  | Initial       | Ad-hoc efforts; no formal processes                  |
| 2.1 – 3.0  | Limited       | Some processes defined but inconsistently applied    |
| 3.1 – 4.0  | Defined       | Formal processes exist; enforcement is incomplete    |
| 4.1 – 5.0  | Managed       | Processes implemented and operating across the org   |
| 5.1 – 6.0  | Optimized     | Continuous improvement; strong audit evidence        |

---

## Key Rules

1. **"Not Applicable" controls are excluded** — they do not lower (or raise) any score. If a control does not apply to the organization, it is simply removed from the calculation.

2. **"? Unknown" controls count as 0** — unassessed controls actively reduce the score, incentivizing complete assessment coverage.

3. **Weights are non-destructive** — the original maturity rating is always preserved as-is. Weights only affect the aggregated domain and overall scores. You can always see the raw rating for any individual control.

4. **No rounding until final output** — intermediate calculations use full precision. Only the final displayed scores are rounded to 2 decimal places.

---

## Worked Example

### Scenario: Domain A8 (Technological Controls) with 3 controls

| Control | Criticality | Weight | Maturity Level  | Score |
|---------|-------------|--------|-----------------|-------|
| A.8.1   | Critical    | 3.0    | Managed         | 5     |
| A.8.2   | Critical    | 3.0    | Initial         | 2     |
| A.8.3   | Medium      | 1.0    | Not Applicable  | —     |

**A.8.3 is excluded** (Not Applicable), so:

```
Domain A8 Score = (5 × 3.0 + 2 × 3.0) / (3.0 + 3.0)
               = (15 + 6) / 6
               = 21 / 6
               = 3.50 out of 6
```

### Continuing to Overall Score

| Domain | Domain Score | Domain Weight |
|--------|-------------|---------------|
| A5     | 4.20        | 0.30          |
| A6     | 3.80        | 0.15          |
| A7     | 2.90        | 0.20          |
| A8     | 3.50        | 0.35          |

```
Overall = (4.20 × 0.30 + 3.80 × 0.15 + 2.90 × 0.20 + 3.50 × 0.35)
        / (0.30 + 0.15 + 0.20 + 0.35)

        = (1.260 + 0.570 + 0.580 + 1.225) / 1.00
        = 3.635 / 1.00
        = 3.64 out of 6
```

**Interpretation:** The organization is at the **Defined** maturity band — formal processes exist but enforcement and continuous improvement are still needed.

---

## Summary

```
Control Score  = maturity rating (0–6)
Domain Score   = weighted average of its controls' scores
Overall Score  = weighted average of domain scores
Max Score      = 6 (Optimized)
```

The model is simple, transparent, and auditable. Every score can be traced back to individual control ratings.
