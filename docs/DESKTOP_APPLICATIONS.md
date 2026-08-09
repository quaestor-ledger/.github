# Desktop application allocation

Verified **2026-08-06**.

Quaestor Ledger uses the paired desktop application standard:

- Rust: [`quaestor-ledger/quaestor-desktop.rs`](https://github.com/quaestor-ledger/quaestor-desktop.rs) — **planned**, not yet verified as a published repository.
- Flutter: [`quaestor-ledger/quaestor-flutter`](https://github.com/quaestor-ledger/quaestor-flutter) — product repository exists, but native Linux, macOS, and Windows runners, packaging, and release status remain incomplete.

Flutter web/mobile support is not evidence of native desktop support.

## Why both Rust and Flutter remain active

The two implementations remain first-class so the project can compare data-entry and reconciliation performance, desktop ergonomics, accessibility, secure local storage, mobile reuse, developer velocity, packaging, and long-term maintenance against the same accounting features.

Every desktop-facing feature must inspect both repositories, share acceptance criteria and fixtures, and normally update both. A one-sided change requires an explicit no-change rationale and recorded parity gap.

## Rust desktop kit: Tauri 2 without React

**Selected strategy:** Tauri 2.

**WebView policy:** allowed for this product.

**Frontend policy:** no React, JSX, React-derived stack, Vue, or Svelte. Use vanilla HTML, CSS, and TypeScript. HTMX is allowed for authenticated server-driven fragments where it reduces client code. Rust/Tauri commands own local database, filesystem, secure-storage, import/export, and privileged operations; do not expose an unauthenticated loopback API.

Ledger tables, forms, reconciliation queues, CSV imports, reports, and dashboards fit lightweight HTML well, while Rust can own validation, persistence, migrations, security, and background work.

The Rust repository must contain `docs/DESKTOP_TOOLKIT.md` covering Tauri 2 version policy, CSP/capabilities, frontend restrictions, command boundaries, secure storage, deep links, tests, packaging, and Flutter companion.

## HTTPS-first deep linking

Canonical form:

```text
https://<verified-quaestor-owned-host>/open/<route>?<bounded-query>
```

Fallback scheme:

```text
quaestor://<route>?<bounded-query>
```

Routes belong in `quaestor-interfaces` and must be shared by Rust, Flutter, clients, and browser fallback pages.

Required behavior:

- use `tauri-plugin-deep-link` plus `tauri-plugin-single-instance`;
- support cold-start and already-running delivery;
- validate the exact host, route, ledger/account/reconciliation identifiers, action, and bounded query parameters;
- never place financial data, customer records, credentials, bearer tokens, report contents, or signing secrets in URLs;
- use short-lived, one-time, audience-bound codes for invitations, import handoffs, and authentication;
- require confirmation before importing external files or applying write actions; and
- test macOS, Windows, Linux, Android, and iOS app/universal links plus browser fallback.

## Product boundary

Both implementations should support semantic parity for accounts, ledgers, reconciliation, imports/exports, reporting, billing state, audit trails, offline work, secure local storage, multi-window review, and deep links.

Shared schemas, clients, route fixtures, sample books, migrations, and conformance tests must be versioned deliberately.

## Repository-local documentation

The Flutter repository records the companion and native-runner gap in [`COMPANION_DESKTOP.md`](https://github.com/quaestor-ledger/quaestor-flutter/blob/main/COMPANION_DESKTOP.md), introduced through [PR #4](https://github.com/quaestor-ledger/quaestor-flutter/pull/4).

Central toolkit assignments: [`rust-desktop-strategies.md`](https://github.com/ORESoftware/project-registry/blob/main/docs/rust-desktop-strategies.md).

## Project routing

- GitHub Project: [`quaestor-ledger-project` — Project 1](https://github.com/orgs/quaestor-ledger/projects/1)
- Linear project: `github.com/quaestor-ledger`
- Central registry: [`approved-private-registry`](private-registry://canonical/registry/desktop-applications.json)
- Portfolio rollout: [`DEN-2469`](https://linear.app/denman/issue/DEN-2469/roll-out-paired-rust-flutter-desktop-repositories-across-the-portfolio)

Repository creation, native-runner work, toolkit/frontend changes, deep-link changes, renames, transfers, archival, or platform-status changes must update this document, Linear, the central registry/strategy, and both companion repositories together.
