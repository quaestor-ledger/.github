## Change summary

Describe the problem and user-visible behavior, why this repository owns the change, the repositories or components affected, compatibility impact, staged rollout, and rollback path. Mark non-applicable checks as `N/A` with a reason.

## Review path

- [ ] All commits are on a topic branch and this pull request is the only proposed path into the protected default branch.
- [ ] No generated tool, bot, migration runner, or deployment process writes directly to `main`, `master`, or another protected default branch.
- [ ] The change is small enough to review, or its staged rollout and follow-up pull requests are identified.

## Scope, ownership, and dependencies

- [ ] The change is focused and does not silently cross repository ownership boundaries.
- [ ] No `*-infra` repository is introduced as a Git submodule under `*-monorepo/apps`.
- [ ] Shared functionality is imported from its owning repository rather than copied into a new local implementation.
- [ ] Cross-repository dependencies are pinned by immutable commit, lockfile, or released Zed package.
- [ ] Public contracts are generated from the canonical interface or schema source, and consumer compatibility was checked.
- [ ] Breaking changes include compatibility, migration, rollback, telemetry, failure behavior, and staged rollout notes.

## Contracts, SQL, and state

- [ ] No SQL changes, or every declaration has an explicit owning repository, a registered logical namespace such as `<organization>.<domain>`, and a stable `<domain>_` object prefix where a shared PostgreSQL schema is required.
- [ ] Domain SQL may remain with its owning organization, but identity, ordering, checksums, drift detection, and promotion are registered through `declarative-migrations`.
- [ ] Application startup validates schema compatibility and does not apply production DDL.
- [ ] JSON Schema, generated language interfaces, ORM models, fixtures, and migration declarations were updated and checked deterministically together.
- [ ] Destructive changes include compatibility, backfill, rollback, tenant isolation, row-level-security, idempotency, and state-machine invariant evidence.

## Infrastructure and security

- [ ] Application manifests remain app-owned; cluster composition is delegated to `oresoftware/k8s-cluster` and shared components to `oresoftware/k8s-libs-and-shared-defs`.
- [ ] Workloads use least privilege, workload identity, restricted Pod Security, default-deny networking, explicit egress, probes, non-root execution, immutable images and dependency references, and bounded resources where applicable.
- [ ] Secrets, credentials, personal data, private-repository inventory, and user content are excluded from source, logs, fixtures, build artifacts, and sensitive telemetry.
- [ ] Authentication and authorization failures are fail-closed, tenant boundaries are preserved, and sensitive operations are auditable.

## Verification and observability

- [ ] Zed lifecycle hooks run deterministic format, lint, build, schema/codegen, contract, and publish checks without bypassing language-native validation.
- [ ] Unit, integration, adversarial, migration, destructive, and end-to-end tests cover the changed behavior in the corresponding `*-test` organization or an isolated environment, with teardown evidence.
- [ ] ORES OTEL trace and correlation propagation is present where applicable; logs and traces exclude secrets and user content by default.
- [ ] Test evidence, residual risks, follow-up work, and any intentionally deferred repositories are listed below.

## Validation evidence and residual risk

Provide exact commands, checks, fixtures, test-organization run links, migration and drift results, manual verification, known limitations, and an explanation for every check that could not run.

## Merge safety

- [ ] Conflicts were resolved semantically using both sides and relevant history.
- [ ] Destructive Git recovery, force pushes to protected branches, and history rewrites were not used.

## Salvage check

If this PR supersedes or replaces an older one, say which, and name at least one
concrete thing carried forward from it (a test, a fixture, an error message, a
pin, a doc paragraph). See [`docs/pr-salvage-policy.md`](../docs/pr-salvage-policy.md).

- [ ] Supersedes nothing, **or** the salvaged item is named above.
