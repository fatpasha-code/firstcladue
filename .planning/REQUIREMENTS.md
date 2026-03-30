# Requirements: Update Tracker

**Defined:** 2026-03-25
**Core Value:** Given a raw text from a call or chat, produce a structured management picture in under 2 minutes — reducing the need to re-read the original.

## v1 Requirements

### Auth

- [x] **AUTH-01**: User can sign in with email and password or magic link
- [x] **AUTH-02**: User session persists across browser refresh
- [x] **AUTH-03**: All pages redirect to /login when unauthenticated

### Ingestion

- [x] **INGEST-01**: User can paste text (call transcript / chat / notes) into input form
- [x] **INGEST-02**: System validates input: non-empty, within character limit
- [x] **INGEST-03**: User can add an optional label to a record
- [x] **INGEST-04**: User sees loading state while analysis runs

### Extraction

- [x] **EXTRACT-01**: System extracts: done, in_progress, blockers, assignments, deadlines
- [x] **EXTRACT-02**: Inferred deadlines are marked separately from explicit ones
- [x] **EXTRACT-03**: User can view extracted data in structured tabs
- [x] **EXTRACT-04**: User can edit extracted data inline *(post-core, implement after pipeline is stable)*

### Interpretation

- [x] **INTERP-01**: System generates management interpretation: summary, real_status, hidden_blockers, ambiguities, clarification_questions
- [x] **INTERP-02**: User can view interpretation in a dedicated tab on the record page
- [x] **INTERP-03**: real_status is clearly and visibly communicated to the user *(specific visual treatment left to UI layer)*

### History

- [ ] **HIST-01**: User can see a list of all past records (date, label, status) in a clear default order (newest first)
- [ ] **HIST-02**: User can open any past record
- [ ] **HIST-03**: User can mark a record as reviewed
- [ ] **HIST-04**: User can select multiple records for report generation

### Reports

- [ ] **REPORT-00**: System clearly communicates when no records are selected for report generation
- [ ] **REPORT-01**: User can generate a weekly digest from selected records
- [ ] **REPORT-02**: User can generate a monthly digest from selected records
- [ ] **REPORT-03**: User can generate a follow-up task list from selected records
- [ ] **REPORT-04**: User can view generated report (markdown rendered)
- [ ] **REPORT-05**: User can copy report to clipboard

## v2 Requirements

### Audio/Video Ingestion

- **AV-01**: User can upload audio/video file for transcription
- **AV-02**: System transcribes via selected transcription provider → feeds into extraction pipeline

### KPI Drafts

- **KPI-01**: User can generate a KPI draft for an employee
- **KPI-02**: User can edit and copy the KPI draft

### Export

- **EXP-01**: User can export report to PDF
- **EXP-02**: User can send report to Notion / Slack

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user / team access | Single-user internal tool in v1 |
| Payments / subscriptions | Not a commercial product in v1 |
| Rate limiting | Single user — not needed |
| PostHog / Sentry / observability | Production level — not MVP requirement |
| Real-time / websocket updates | Sync pipeline is fine for single user |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| INGEST-01 | Phase 2 | Complete |
| INGEST-02 | Phase 2 | Complete |
| INGEST-03 | Phase 2 | Complete |
| INGEST-04 | Phase 2 | Complete |
| EXTRACT-01 | Phase 2 | Complete |
| EXTRACT-02 | Phase 2 | Complete |
| EXTRACT-03 | Phase 3 | Complete |
| EXTRACT-04 | Phase 3 | Complete |
| INTERP-01 | Phase 2 | Complete |
| INTERP-02 | Phase 3 | Complete |
| INTERP-03 | Phase 3 | Complete |
| HIST-01 | Phase 4 | Pending |
| HIST-02 | Phase 4 | Pending |
| HIST-03 | Phase 4 | Pending |
| HIST-04 | Phase 4 | Pending |
| REPORT-00 | Phase 5 | Pending |
| REPORT-01 | Phase 5 | Pending |
| REPORT-02 | Phase 5 | Pending |
| REPORT-03 | Phase 5 | Pending |
| REPORT-04 | Phase 5 | Pending |
| REPORT-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after initial definition*
