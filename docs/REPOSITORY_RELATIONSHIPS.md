<!-- ore-org-baseline:begin -->
# Repository relationships for `quaestor-ledger`

This file is rendered from `repository-relationships.json`. The JSON registry is authoritative.

- Audience: `public`
- Repositories represented: **3**
- Relationships represented: **3**
- Inventory digest: `sha256:ea7a725a35ae6232ae881a0321204d89da32e81ed500594aeef0ffd768eb57a7`

## Immutable routing identity

| Field | Value |
|---|---|
| Mapping ID | `context:quaestor-ledger` |
| GitHub owner ID | `306201356` |
| Linear project ID | `aced9d50-40ea-4634-9574-3a6afa49c4ad` |
| Linear team ID | `eb8ab169-5afe-4b6f-9cab-3f2aa3e887dc` |

## Repositories

| Repository | Visibility | Roles | Archived |
|---|---|---|---|
| `quaestor-ledger/.github` | `public` | `community-health`, `governance`, `relationship-registry` | no |
| `quaestor-ledger/quaestor-ledger-e2e` | `public` | `end-to-end-tests` | no |
| `quaestor-ledger/quaestor-ledger.github.io` | `public` | `documentation-site` | no |

## Relationships

| From | Type | To | Status | Required |
|---|---|---|---|---|
| `quaestor-ledger/.github` | `governs` | `quaestor-ledger/quaestor-ledger-e2e` | `declared` | yes |
| `quaestor-ledger/.github` | `governs` | `quaestor-ledger/quaestor-ledger.github.io` | `declared` | yes |
| `quaestor-ledger/quaestor-ledger.github.io` | `documents` | `quaestor-ledger/.github` | `inferred` | no |

## Editing relationships

Put reviewed public declarations in `repository-relationships.manual.json`; do not edit the generated registry directly.
Private repository names and private-only relationships belong in the private `ORESoftware/project-registry` mirror.
Inferred edges are advisory and must remain visibly labeled until reviewed.
<!-- ore-org-baseline:end -->
