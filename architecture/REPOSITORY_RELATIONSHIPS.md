# `quaestor-ledger` repository relationships

Generated from reviewed policy and the current **public** repository inventory.

- Public repositories declared: **3**
- Private repository names withheld: **10**
- Relationship edges: **6**

## Repository roles

| Repository | Role | Lifecycle |
|---|---|---|
| [`.github`](https://github.com/quaestor-ledger/.github) | `organization_governance` | `active` |
| [`quaestor-ledger.github.io`](https://github.com/quaestor-ledger/quaestor-ledger.github.io) | `site` | `active` |
| [`quaestor-ledger-e2e`](https://github.com/quaestor-ledger/quaestor-ledger-e2e) | `end_to_end_tests` | `active` |

## Declared edges

| From | Relationship | To | Status/basis |
|---|---|---|---|
| `organization://quaestor-ledger` | `coordinates_via` | `capability://fiducia-cloud/distributed-coordination` | `platform-default` / `explicit-platform-decision`: locks, leases, idempotency, elections, schedules, budgets, and task claims |
| `organization://quaestor-ledger` | `authenticates_via` | `capability://shared-auth/human-identity` | `platform-default` / `explicit-platform-decision`: platform human identity and session authority |
| `organization://quaestor-ledger` | `packaged_via` | `platform://zed-pkg` | `platform-default` / `platform-policy`: Zed resolves artifacts while submodules compose editable source |
| `quaestor-ledger/.github` | `governs` | `quaestor-ledger/quaestor-ledger-e2e` | `inferred` / `role-convention`: organization defaults, safety, and relationship declarations |
| `quaestor-ledger/.github` | `governs` | `quaestor-ledger/quaestor-ledger.github.io` | `inferred` / `role-convention`: organization defaults, safety, and relationship declarations |
| `quaestor-ledger/quaestor-ledger-e2e` | `tests` | `quaestor-ledger/quaestor-ledger.github.io` | `inferred` / `role-convention`: black-box compatibility verification |

## Composition, service, and observability contract

Git submodules compose editable source; Zed packages resolve packages/artifacts; dual-managed commits must match. Production deploys immutable image digests, not runtime source builds. Cross-service access uses APIs/SDKs/events rather than another service database. MCP uses the product API/SDK. Services emit OpenTelemetry traces, bounded metrics, and correlated structured logs.

## Privacy boundary

This public registry deliberately omits private repository names and edges; the count above makes the boundary explicit.
