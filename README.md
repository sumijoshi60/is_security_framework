# isms_audit_toolkit ##
This is a tool to perform security audits of information systems.
Fill out the checklist of organization domains and it's controls. 
Every control is rated on a 7-point maturity scale. "Not Applicable" controls are excluded from scoring.

| Maturity Level | Score | Description                                                   |
|----------------|------|---------------------------------------------------------------|
| Unknown        | 0    | Not yet assessed                                              |
| Nonexistent    | 1    | Totally absent — not even planned                             |
| Initial        | 2    | Development has barely started; significant work required     |
| Limited        | 3    | Progressing nicely but not yet complete                       |
| Defined        | 4    | Mostly complete but not fully implemented or enforced         |
| Managed        | 5    | Implemented and recently started operating                    |
| Optimized      | 6    | Fully satisfied, actively monitored and improved              |
| Not Applicable | —    | Excluded from scoring                                         |

## How Scoring Works ##
Control Score = maturity rating (0-6)\
Domain Score = weighted average of its controls' scores\
Overall Score = weighted average of domain scores\
Max Score = 6 (Optimized)

## Control Weight Scale ##
| Weight | Label    | Criteria                                                                 |
|--------|----------|--------------------------------------------------------------------------|
| 3      | Critical | Business stops. Major financial loss, regulatory penalty, or data breach |
| 2      | High     | Significant disruption or reputational damage                            |
| 1      | Medium   | Manageable impact, internal inconvenience, no external exposure          |
| 0.5    | Low      | Minimal impact, theoretical risk only                                    |

## Score Interpretation ##
| Score Range | Band        | Interpretation                                              |
|-------------|------------|-------------------------------------------------------------|
| 0.0 – 1.0   | Nonexistent | Security program has not been established                   |
| 1.1 – 2.0   | Initial     | Ad-hoc efforts; no formal processes                         |
| 2.1 – 3.0   | Limited     | Some processes defined but inconsistently applied           |
| 3.1 – 4.0   | Defined     | Formal processes exist; enforcement is incomplete           |
| 4.1 – 5.0   | Managed     | Processes implemented and operating across the organization |
| 5.1 – 6.0   | Optimized   | Continuous improvement; strong audit evidence               |




## Worked Example ##
Domain A8 (Technological Controls) with 3 controls:

| Control | Score | Band           | Rating |
|---------|------|----------------|--------|
| A.8.1   | 3.0  | Managed        | 5      |
| A.8.2   | 3.0  | Initial        | 2      |
| A.8.3   | 1.0  | Not Applicable | —      |

Domain A8 = (5 x 3.0 + 2 x 3.0) / (3.0 + 3.0)\
= (15 + 6) / 6\
= 3.50 out of 6


