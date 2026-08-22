# Quaestor Ledger organization audit — 2026-08-10

## Scope and evidence boundary

The audit inventoried all 13 repositories currently visible in `quaestor-ledger` and all 17 repositories currently visible in `quaestor-ledger-test`. Repository metadata, default-branch trees, workflow paths, package/lock files, conventional test paths, deployment material, and active pull requests were reviewed through the connected GitHub integration.

The integration returned HTTP 403 for organization rulesets, organization Actions policy, and default-branch protection. Those controls are **unverified**, not presumed missing and not counted as passing. The new live auditor can verify them only when `ORG_AUDIT_TOKEN` has administration-read access.

## Portfolio assessment

The organization is not an empty scaffold. Strong controls already exist across the core server, web server, infrastructure, sync, browser E2E, mobile, interfaces, and monorepo topology:

- the ledger server includes locked Rust builds, formal authorization models, financial-operation audit documentation, Kubernetes network policy, external-secret wiring, and image workflows;
- the web server includes Rust and TypeScript lockfiles, browser/self-hosted lanes, Shared-Auth contracts, image validation, repair fixtures, Dependabot, and `SECURITY.md`;
- infrastructure includes Terraform, generated Argo CD and tenancy resources, network policy, quotas, Cloudflare drift checks, deployment documentation, and `SECURITY.md`;
- sync includes Rust, Dart, and TypeScript protocol/conformance tests plus Opto-Sync resilience lanes;
- the E2E repository exercises Playwright, Puppeteer, and Selenium through a shared scenario harness;
- the monorepo uses immutable gitlinks under `apps/`, validates Zed/submodule topology, and keeps infrastructure out of the app superproject; and
- the Astro marketing site has build, deploy, Playwright, Puppeteer, and distribution contract tests.

The largest risk is uneven evidence aggregation: many controls exist, but there was no single fail-closed inventory proving that all 13 repositories remained visible and that every workflow continued to honor the same trust rules.

## Prioritized findings

### High — generated client archives are tracked in source

`quaestor-clients` commits generated archives under `.zed/pack`, including repository and Swift archives above 17 MiB. This inflates clone/history size and places opaque release-shaped binaries inside the reviewed source tree. The portfolio auditor now flags all committed `.zed/pack` archives and any blob at least 10 MiB. Follow-up should move generated packages to release/registry storage, record checksums and provenance, and retain only reproducible manifests in Git.

### High — three financial/security risk domains lack dedicated repositories

The existing test organization has 16 specialized repositories plus `.github`, but tenant isolation, webhook authentication/replay, and migration/restore recovery were not isolated into first-class suites. `zed-pkg-test/zed-pkg-e2e` draft PR #164 adds those three repositories to the canonical deterministic factory rather than creating unmanaged one-offs.

### Medium — generated test plans are not uniformly executable

Several `quaestor-ledger-test` repositories contain immutable source pins and detailed `test-plan.json` contracts but little or no executable adversarial logic. `idempotent-posting-e2e` draft PR #3 converts one of the highest-risk plans into a dependency-free oracle with nine passing tests. The same pattern should be applied to reconciliation, PostgreSQL accounting, auth/3FA, and the three new repositories.

### Medium — executor gate hardening is already active elsewhere

`quaestor-executor` contains formal models, authorization/fencing documentation, Rust source tests, and payment-domain checks. Existing draft PR #6 hardens its formal-model gate with pinned checkout, disabled persisted credentials, bounded runtime, and locked Rust checks. No duplicate executor PR was opened in this wave.

### Medium — exact-head evidence is partially blocked outside source

Open work records private cross-organization checkout and GitHub Actions billing/runner constraints. A green source-level contract must not be treated as production certification when the real private-server, browser, database, or mobile lane did not run. Merge decisions should require exact-head checks or a documented self-hosted canary.

### Control-coverage gap — organization administration settings are not observable

Rulesets, default-branch protection, and organization Actions policy could not be read with the connected repository integration. Configure the documented GitHub App/secret, run the scheduled auditor, and retain its job summary before declaring the organization fully hardened.

## Changes opened by this wave

1. `quaestor-ledger-test/idempotent-posting-e2e` draft PR #3 — executable idempotency oracle and least-privilege CI; local 9/9 and both GitHub workflows green.
2. `zed-pkg-test/zed-pkg-e2e` draft PR #164 — canonical creation plan for `tenant-isolation-e2e`, `webhook-auth-replay-e2e`, and `migration-recovery-e2e`, with fail-closed overlay validation.
3. This governance change — portfolio auditor, tests, live scheduled workflow, coverage contract, and dated evidence.

## Recommended merge and activation order

1. Merge the governance auditor after its contract workflow passes.
2. Configure a short-lived GitHub App credential as `ORG_AUDIT_TOKEN`, run the live audit, and resolve any critical workflow finding.
3. Merge idempotency PR #3 after exact-head review; use its fixture matrix against the private ledger server before claiming production conformance.
4. Merge fleet PR #164 after its full fleet contract succeeds, then run the credential-gated apply workflow to create the three repositories and inspect each generated draft PR.
5. Merge or supersede existing executor PR #6 only after its exact-head Rust/formal checks pass.
6. Move generated `.zed/pack` archives out of `quaestor-clients` in a focused follow-up that preserves reproducibility and checksums.
