# Quaestor Ledger web/API connection patterns

Status: organization architecture guidance, tracked by [DEN-4261](https://linear.app/denman/issue/DEN-4261/document-quaestor-ledger-webapi-connection-patterns).

This policy applies to traditional web/BFF, ledger API, reporting, settlement, and worker services. Financial correctness and auditability take precedence over transport convenience.

## Four supported avenues

| Avenue | Appropriate use | Boundary |
| --- | --- | --- |
| Direct database read | Named public/reference or independently rebuilt reporting projection with a measured need | Never balances, journal entries, postings, customer-private financial data, authorization, settlement, or writes; require a distinct `SELECT`-only, `READ ONLY`, non-owner, `NOBYPASSRLS` role |
| Stateless HTTP/JSON | Default synchronous BFF-to-API path | Required for private reads, balances, posting, approvals, reconciliation commands, settlement, and all mutations |
| Stateful TCP | Measured authorized market/reference stream or high-frequency status feed | Never a ledger, posting, authorization, or settlement authority; require ADR, mTLS/delegated identity, bounded frames, deadlines, backpressure, and reconnect rules |
| NATS/message queue | Durable post-commit accounting effects, exports, notifications, and reconciliation work | Never login, approval, ledger commit, settlement decision, or immediate customer response; require transactional outbox and idempotent consumers |

HTTP is the default. Direct reads, TCP streams, and messaging are named exceptions with owners and expiry/review dates.

## Decision and ownership

1. Balances, journals, postings, approvals, settlement, private reporting, and every mutation go through the ledger API over HTTP.
2. Immediate authoritative answers use HTTP with versioned types, strict deadlines, bounded bodies, correlation context, and idempotency keys.
3. Durable post-commit effects are published from the same authoritative transaction through an outbox to NATS.
4. A measured stream may use TCP only after an ADR; it cannot create or imply a posting.
5. Direct reads remain limited to documented public/reference or independently reproducible projections under a restricted role.

The web/BFF owns HTML, secure opaque sessions, CSRF, and authorization-code plus PKCE. The API owns product authorization, financial state transitions, and audit decisions. A core/data package owns typed queries, mappings, and transaction helpers. The canonical migration repository owns DDL; services verify the expected schema and never migrate production at startup.

Shared Auth proves identity and session assurance, not account or ledger permissions. Validate realm, issuer, audience, tenant, app/client, scopes, session, freshness, and assurance. Protected introspection authenticates the service separately and carries the user's token only in the body. Never log tokens, cookies, PKCE material, account numbers, payment data, gift-card codes, or raw introspection results.

Use immutable dependency revisions. `opto-sync` may implement explicitly declared sync/outbox flows, `ores-otel` propagates redacted trace/metric context, and `zed-pkg` records dependency provenance. None may bypass the API's authorization or the ledger's transactional boundary.

## Financial invariants

- Never treat a browser redirect, transport acknowledgement, or queued message as evidence that money settled.
- Only signature-verified, replay-safe, deduplicated provider events may advance external payment state.
- Posting and outbox insertion share one transaction; consumers are duplicate-safe and cannot mutate ledger history.
- Fail closed. The BFF must not fall back from a failed API call to direct financial reads.
- Code comments identify the selected avenue and the financial invariant it preserves.

This document is the durable organization policy; repository ADRs may impose stricter controls.
