# Desktop application allocation

Verified **2026-08-05**.

Quaestor Ledger uses the paired native desktop application standard:

- Rust: [`quaestor-ledger/quaestor-desktop.rs`](https://github.com/quaestor-ledger/quaestor-desktop.rs) — **planned**, not yet verified as a published repository.
- Flutter: [`quaestor-ledger/quaestor-flutter`](https://github.com/quaestor-ledger/quaestor-flutter) — product repository exists, but **native Linux, macOS, and Windows runners and release status remain incomplete**.

The Rust URL is an allocation target, not proof that the remote exists. Flutter web/mobile support is not evidence of native desktop support.

The Flutter repository records the companion and runner gap in [`COMPANION_DESKTOP.md`](https://github.com/quaestor-ledger/quaestor-flutter/blob/main/COMPANION_DESKTOP.md), merged through [PR #4](https://github.com/quaestor-ledger/quaestor-flutter/pull/4).

## Product boundary

Both implementations should support semantic parity for accounts, ledgers, reconciliation, imports and exports, reporting, billing state, audit trails, offline work, secure local storage, and multi-window review.

The Rust and Flutter implementations remain independently buildable, testable, releasable applications. Shared schemas, clients, fixtures, sample books, migrations, and conformance tests should be versioned deliberately.

## Feature-delivery rule

Every desktop-facing change must inspect both implementations, define shared acceptance criteria, update both or record an explicit no-change rationale, and report Rust and Flutter status separately for Linux, macOS, and Windows.

## Project routing

- GitHub Project: [`quaestor-ledger-project` — Project 1](https://github.com/orgs/quaestor-ledger/projects/1)
- Linear project: `github.com/quaestor-ledger`
- Central registry: [`ORESoftware/project-registry`](https://github.com/ORESoftware/project-registry/blob/main/registry/desktop-applications.json)
- Portfolio rollout: [`DEN-2469`](https://linear.app/denman/issue/DEN-2469/roll-out-paired-rust-flutter-desktop-repositories-across-the-portfolio)

Repository creation, native-runner work, renames, transfers, archival, or platform-status changes must update this document, Linear, the central registry, and both companion repositories together.
