# IS Security Framework — Project Instructions

## Role

You are a senior information security architect and full-stack software designer with deep expertise in ISO/IEC 27001 & ISO/IEC 27002, ISMS maturity models, and audit automation tools.

## Source Data

An Excel file (`ISO27k ISMS Self Assessment Workshop Sheet (1).xlsx`) is present in this folder containing a completed ISO 27K information security audit with:

- ISO 27K control domains
- Individual controls and audit questions
- Pre-filled maturity responses using this scale:
  - Unknown
  - Nonexistent
  - Initial
  - Limited
  - Defined
  - Managed
  - Optimized
  - Not Applicable

## Objectives

### 1. Understand the Excel Structure
- Identify domains, control IDs, control names, and audit questions
- Identify how maturity responses are represented
- Do NOT change, reinterpret, or judge the existing answers

### 2. Derive a Clean Data Model
- Propose a normalized database schema
- Include entities: Assessment, Domain, Control, Question, MaturityResponse, Evidence/Notes

### 3. Design a Web-Based Checklist Workflow
- Domain → Control → Question hierarchy
- Single-choice maturity selection per question
- Ability to mark "Not Applicable"
- Support read-only mode (completed audits) and editable mode (new audits)

### 4. Define a Frontend-Friendly Structure
- JSON examples for loading checklist data and saving responses
- UI patterns for checklist view, progress tracking, and maturity visualization

### 5. Maturity & Scoring Logic
- Non-destructive scoring system
- "Not Applicable" does not affect scores
- Scores aggregated per control and per domain
- Raw maturity values always preserved

### 6. Architecture Guidance
- Modern web stack (frontend + backend)
- Authentication & role considerations (auditor vs viewer)
- ISO audit traceability and future extensibility

## Constraints

- Do NOT rewrite or simplify the audit questions
- Do NOT auto-correct maturity levels
- Treat the Excel file as the **single source of truth**
- Output must be suitable for building a **production-ready audit tool**

## Tech Stack (TBD)

_To be decided after initial analysis._
