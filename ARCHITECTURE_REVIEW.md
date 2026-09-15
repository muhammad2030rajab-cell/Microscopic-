# Microscopic — Lead Architecture Review

## Immediate priorities

1. **Authorization consistency** — every report action must be enforced on the server and the UI must only mirror those permissions. Approval now uses `reports.approve`; editing a report also requires `patients.edit` because the current workflow updates the linked patient row.
2. **Auditability** — user-management changes are now written to `audit_logs` without storing passwords or sensitive values.
3. **Tenant isolation** — keep `lab_id` in every patient/report/user query and never trust a client-provided lab identifier.
4. **Transactional writes** — the next infrastructure change should add a transaction-capable DB abstraction so multi-table report/user updates are atomic.
5. **Immutable final reports** — approved reports should be treated as immutable; future corrections should create an amendment/revision rather than mutating the approved result.
6. **Rate limits and payload limits** — especially login, report creation, exports, and future upload/integration endpoints.
7. **Observability** — add structured error IDs, latency metrics, and alerting around auth failures, authorization failures, report approvals, and exports.

## Performance

- Add composite indexes for common tenant queries, e.g. `(lab_id, status, created_at desc)` on reports.
- Paginate report and patient lists; never load an unbounded archive.
- Select only fields needed by each screen.
- Cache stable lab/catalog metadata with short TTLs and invalidate on edits.
- Move heavy PDF generation/export to a background job when volume grows.

## UX direction

- Command/search bar for patients, reports, sample IDs and barcodes.
- Dashboard organized around work queues: `New`, `In progress`, `Pending review`, `Critical`, `Approved`.
- One-click barcode scan → patient/sample → order → result entry.
- Keyboard-first result entry on desktop and large touch targets on mobile.
- Clear status timeline on every report.
- Inline validation and autosave drafts, with an explicit finalization step.

## High-value product features

1. **Barcode-first sample workflow** — accession, collection, receiving, processing and result delivery.
2. **Smart result validation** — delta checks, critical-value rules, impossible-value checks and configurable reflex rules.
3. **Patient portal** — secure result delivery, historical results and downloadable final reports.
4. **Instrument integrations** — ASTM/HL7 first, then FHIR-based interoperability where appropriate.
5. **Quality & operations center** — audit trail, QC trends, turnaround time, non-conformities, inventory and maintenance.

## Target architecture

Web + Android clients → authenticated API/server functions → PostgreSQL/Neon → object storage for immutable report artifacts.

The API remains the authorization boundary. Android should maintain an offline local cache, but the server remains authoritative and sync uses version/conflict rules.
