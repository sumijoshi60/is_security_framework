# Weight Configuration Guide

## Who Is This For?

This guide is for the **administrator** setting up the IS Security Framework for their organization. It explains how to assign meaningful weights to domains and controls so that the resulting maturity scores accurately reflect your organization's security posture.

---

## Why Weights Matter

Without weights, every control and every domain counts equally. In reality:

- Losing access control is far worse than losing a clean desk policy
- For a cloud company, technological controls matter more than physical ones
- Regulatory mandates make certain controls non-negotiable

Weights let you tell the system: **"This matters more to us."**

---

## Control Weights

### The Core Question

For each control, ask:

> **"If this control was completely absent, what would happen to our organization?"**

### Weight Scale

| Weight | Label    | Criteria                                                                 |
|--------|----------|--------------------------------------------------------------------------|
| 3.0    | Critical | Business stops. Major financial loss, regulatory penalty, or data breach |
| 2.0    | High     | Significant disruption, reputational damage, or partial data exposure    |
| 1.0    | Medium   | Manageable impact, internal inconvenience, no external exposure          |
| 0.5    | Low      | Minimal impact, theoretical risk only                                    |

You are not limited to these values. You can use any positive number (e.g., 2.5, 1.5) for finer granularity.

### Three Factors to Consider

#### Factor 1: Business Impact

Map each control to what it protects, then assess the damage of failure.

| Example Control                | Protects                    | If Absent                              | Weight |
|--------------------------------|-----------------------------|----------------------------------------|--------|
| A.8.5 — Secure authentication | User accounts, systems      | Unauthorized access, data breach       | 3.0    |
| A.5.10 — Acceptable use       | Policy compliance           | Minor policy violations                | 1.0    |
| A.7.7 — Clear desk            | Physical document security  | Unlikely exposure in most environments | 0.5    |

#### Factor 2: Regulatory & Compliance Obligations

Controls that are mandated by law or required by your compliance frameworks should be weighted higher, regardless of other factors.

| Regulation | Controls It Impacts                          | Minimum Weight |
|------------|----------------------------------------------|----------------|
| GDPR       | Data classification, encryption, access control, breach notification | 2.0–3.0 |
| HIPAA      | Access control, audit logs, encryption, physical safeguards          | 2.0–3.0 |
| PCI-DSS    | Network security, encryption, access control, monitoring             | 2.0–3.0 |
| SOC 2      | Logical access, change management, monitoring, incident response     | 2.0–3.0 |
| ISO 27001  | All Annex A controls (baseline)                                      | 1.0+    |

**Rule of thumb:** If a regulator or auditor will specifically ask about it, weight it at 2.0 or above.

#### Factor 3: Your Threat Landscape

Weight controls higher if they protect against threats your organization actually faces.

| Organization Type     | Higher-Weight Areas                                   |
|-----------------------|-------------------------------------------------------|
| SaaS / Cloud          | Authentication, encryption, API security, logging     |
| Financial Services    | Access control, audit trails, data integrity, fraud   |
| Healthcare            | Data privacy, physical access, endpoint protection    |
| Manufacturing / OT    | Physical security, network segmentation, availability |
| Government            | Classification, clearance, encryption, incident response |
| Retail / E-commerce   | Payment security, customer data, web application security |

---

## Domain Weights

### The Core Question

> **"If we could only invest in one area of security, which would protect us the most?"**

Domain weights represent the **relative importance of each security area** to your specific organization. They determine how much each domain contributes to the overall score.

### Guidelines

- Domain weights should ideally **sum to 1.0** (representing 100%) for clean percentage interpretation
- No domain should be 0 unless you genuinely have zero exposure in that area
- The spread between highest and lowest weight should reflect real differences, not arbitrary preferences

### Example Configurations

#### SaaS / Cloud Company

| Domain               | Weight | Rationale                                         |
|----------------------|--------|----------------------------------------------------|
| Organizational (A5)  | 0.25   | Policies and governance are foundational            |
| People (A6)          | 0.15   | Remote workforce, phishing risk                     |
| Physical (A7)        | 0.10   | Minimal physical infrastructure (cloud-hosted)      |
| Technological (A8)   | 0.50   | Core business runs on technology                    |

#### Hospital / Healthcare

| Domain               | Weight | Rationale                                         |
|----------------------|--------|----------------------------------------------------|
| Organizational (A5)  | 0.25   | HIPAA compliance, vendor management                 |
| People (A6)          | 0.15   | Staff training, insider threat                      |
| Physical (A7)        | 0.30   | Patient areas, restricted zones, medical devices    |
| Technological (A8)   | 0.30   | EHR systems, network security, encryption           |

#### Manufacturing / Industrial

| Domain               | Weight | Rationale                                         |
|----------------------|--------|----------------------------------------------------|
| Organizational (A5)  | 0.20   | Supply chain security, IP protection                |
| People (A6)          | 0.15   | Floor workers, contractors, safety culture          |
| Physical (A7)        | 0.35   | Factories, warehouses, OT environments              |
| Technological (A8)   | 0.30   | SCADA/ICS, network segmentation, monitoring         |

#### Financial Services

| Domain               | Weight | Rationale                                         |
|----------------------|--------|----------------------------------------------------|
| Organizational (A5)  | 0.30   | Heavy regulatory governance, audit requirements     |
| People (A6)          | 0.10   | Smaller workforce, high vetting standards           |
| Physical (A7)        | 0.15   | Branch/data center security                         |
| Technological (A8)   | 0.45   | Transaction systems, fraud prevention, encryption   |

---

## The Setup Process

### Step 1: Assemble the Right People

Weights should not be set by one person. Bring together:
- **CISO / Security Lead** — overall risk perspective
- **IT / Engineering Head** — technical threat awareness
- **Compliance Officer** — regulatory requirements
- **Business Operations** — understands what matters commercially

### Step 2: Identify Crown Jewels

List the organization's most important assets:
- Customer data
- Intellectual property
- Financial systems
- Operational technology
- Reputation / brand

Map each asset to the controls and domains that protect it. Those get higher weights.

### Step 3: Draft Initial Weights

Using the factors above, assign a first-pass weight to every control and domain. Don't overthink it — use the 4-tier scale (0.5 / 1.0 / 2.0 / 3.0) as a starting point.

### Step 4: Run a Trial Assessment

Complete the maturity assessment with the draft weights and review the results:
- Does the overall score feel accurate?
- Do the domain scores reflect reality? (If physical security is strong but scores low, check the weights)
- Are any controls disproportionately skewing results?

### Step 5: Adjust and Finalize

Tweak weights based on the trial. Common adjustments:
- A domain score seems too low → check if critical controls in that domain are underweighted
- Overall score seems too high → you may have too many low-weight controls diluting the critical ones
- A single control dominates a domain → its weight may be too high relative to others

### Step 6: Lock and Document

Once weights are finalized:
- **Document the rationale** for each weight decision (for audit traceability)
- **Lock the weights** for the assessment period (don't change mid-audit)
- **Review annually** or when the threat landscape, regulations, or business model changes

---

## Common Mistakes to Avoid

| Mistake | Problem | Fix |
|---------|---------|-----|
| Everything is "Critical" (3.0) | Weights become meaningless — same as no weights | Force-rank: only 20-30% of controls should be Critical |
| Copying another company's weights | Their threat landscape is not yours | Use their config as a starting point, then customize |
| Setting weights once and forgetting | Business changes, threats evolve | Schedule annual weight reviews |
| Domain weights don't sum to 1.0 | Scores still work but percentages become confusing | Normalize to 1.0 for clarity |
| Ignoring "Not Applicable" | Marking controls N/A without justification | Document why each N/A was chosen; auditors will ask |

---

## Quick-Start Defaults

If you need to get started quickly and refine later, use these balanced defaults:

**Domain Weights:**
- Organizational (A5): 0.30
- People (A6): 0.15
- Physical (A7): 0.20
- Technological (A8): 0.35

**Control Weights:**
- Controls involving access, authentication, encryption, incident response: **3.0**
- Controls involving monitoring, backup, change management, supplier security: **2.0**
- Controls involving policy, awareness, documentation, classification: **1.0**
- Controls with limited applicability to your environment: **0.5**

These are the defaults pre-configured in the system. Adjust them to match your organization's specific risk profile.
