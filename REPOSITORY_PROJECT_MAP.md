# Quaestor Ledger repository and planning map

This document is the organization-level routing index for GitHub repositories, the canonical GitHub Project, and Linear planning.

## Sources of truth

- GitHub organization: https://github.com/quaestor-ledger
- GitHub Project: https://github.com/orgs/quaestor-ledger/projects/1
- Linear project: https://linear.app/denman/project/githubcomquaestor-ledger-a8cd440b3acc
- Organization policies and shared contributor guidance: `quaestor-ledger/.github`

GitHub owns source, pull requests, checks, releases, deployment manifests, and repository-local issues. Linear owns portfolio sequencing, cross-repository dependencies, production launch gates, and decisions that span repositories. GitHub Project items should link to the corresponding Linear issue when work crosses repository boundaries.

## Repository ownership map

| Repository | Primary responsibility | Planning lane |
| --- | --- | --- |
| `.github` | Organization governance, contribution policy, security policy, repository map, and shared automation guidance | Organization operations and documentation |
| `quaestor-interfaces` | Canonical financial schemas, wire contracts, generated interfaces, SQL and money representations | Contract compatibility and artifact certification |
| `quaestor-clients` | Generated and hand-maintained client SDKs plus Zed package/runtime routing | SDK parity, package publication, and consumer compatibility |
| `quaestor-ledger-server.rs` | Authoritative ledger API, Shared Auth introspection, Quaestor-owned tenant grants, provider ingestion, and financial invariants | Production billing hardening and launch gates |
| `quaestor-web-server.rs` | Browser-facing billing application, RLS enforcement, step-up ceremony consumption, and deployment wiring | Web rollout, auth assurance, and browser evidence |
| `quaestor-executor` | Non-custodial payment execution under merchant-owned provider credentials | Execution safety, idempotency, and provider controls |
| `quaestor-ledger-sync` | Quaestor-owned replication envelope and adapters over approved synchronization primitives | Sync protocol, offline behavior, and artifact adoption |
| `quaestor-ledger-e2e` | Cross-driver, cross-runtime, release, security, and integration evidence | Release gates and production smoke evidence |
| `quaestor-ledger-mcp-server.rs` | Agent/MCP access with strict URL, identifier, tenant, and command validation | Agent surface safety and integration contracts |
| `quaestor-flutter` | Mobile, desktop, and web client application | Client startup safety, mobile background behavior, and UX rollout |
| `quaestor-infra` | Kubernetes, secrets, observability, migrations, deployment, rollback, and environment policy | Production deployment and operational readiness |
| `quaestor-monorepo` | Source-repository composition and Zed package integration; must not absorb infrastructure or CLI ownership | Repository graph and integration validation |
| `quaestor-ledger.github.io` | Public product and architecture landing site | Public documentation and trust boundary communication |

## Required repository family

The target organization pattern is:

- `quaestor-interfaces` — Zed package
- `quaestor-lib` — shared Zed package depending on `quaestor-interfaces`
- `quaestor-clients` — Zed package depending on `quaestor-interfaces` and, where the implementation requires shared behavior, `quaestor-lib`
- `quaestor-cli` — Zed package consuming interfaces, library, and clients
- `quaestor-monorepo` — Zed package interoperating with reviewed source gitlinks; it must not import `quaestor-infra` or `quaestor-cli`

`quaestor-lib` and `quaestor-cli` are currently missing repository contracts. Until they exist, repositories must not add dangling package dependencies or fabricate lock state.

## Current production gates

Customer billing remains gated until all of the following are complete and evidenced in Linear:

1. Shared Auth introspection and assurance fields are deployed and compatible with Quaestor consumers.
2. Quaestor authorization schema is reviewed, rehearsed, and applied.
3. Every active tenant has an explicitly reviewed owner grant.
4. Wrong-tenant, revoked-session, stale-AAL2, authority-outage, migration, and rollback tests pass.
5. Read-only cross-repository CI credentials are configured where real private-crate or private-package integration is required.
6. GitHub Actions billing/spending limits permit required workflows to allocate runners; checks rejected before runner allocation are not evidence of correctness.

## Pull request and conflict policy

Never merge solely because a branch is mergeable or because a bot opened it. Review the exact head, changed files, dependency graph, open review threads, and all required checks.

resolve any and all git conflicts semantically, will full context, even looking back 3-10 commits in git log history for more context - never hastily pick sides in a conflict but merge things conceptually, using max context and complete conceptual awareness for a given github organization's repos and external org repos too

A semantic merge must preserve compatible intent and invariants across same-organization and external repositories, then update tests, documentation, schemas, lockfiles, generated artifacts, CI, and deployment configuration as required.

## Update procedure

Update this map whenever a repository is created, renamed, archived, transferred, or assigned a materially different boundary. Apply the same change to the Linear document named **Quaestor Ledger GitHub and Linear Project Map**, and link the implementing PR or commit in the Linear project discussion.