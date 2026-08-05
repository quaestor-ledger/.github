# quaestor-ledger organization handbook

> Shared operating defaults for repositories maintained under **quaestor-ledger**. Repository-local policy may strengthen these rules but should not silently weaken them.

## Mission

quaestor-ledger maintains billing, ledger, accounting, and financial-integration software. This `.github` repository is the canonical home for shared policy, reusable templates, community health files, and planning links.

## Repository contract

Each active repository must document purpose, ownership, maturity, supported environments, development and test commands, authoritative ledger and interface formats, release and rollback procedures, compatibility policy, and GitHub Project/Linear links. Financial components should also document currency and precision, posting invariants, idempotency, reconciliation, audit trails, authorization, retention, settlement states, reversals, and failure recovery.

## Change workflow

1. Anchor work in an issue, Linear item, or documented maintenance objective.
2. Keep branches and pull requests focused.
3. Explain motivation, scope, financial and compatibility risk, validation, migration, and rollback.
4. Test duplicate, out-of-order, reversal, rounding, concurrency, partial failure, retry, and reconciliation paths as relevant.
5. Resolve conflicts semantically by reconstructing both sides' intent.
6. Prefer squash merges for focused work unless commit structure materially improves auditability.

## Evidence, security, and documentation

Pull requests should include reproducible commands, synthetic fixtures, expected and observed postings, invariant and reconciliation evidence, negative-path coverage, documentation updates, and CI or local-equivalent evidence. Never commit credentials, real financial records, signing keys, or sensitive logs. Follow `SECURITY.md` for private reporting. Keep examples sanitized, precision and currency semantics explicit, compatibility matrices current, and important accounting, security, and operational decisions recorded.

## Planning ownership

GitHub owns code, reviews, checks, releases, and delivery evidence. Linear owns priority, dependencies, sequencing, and cross-project planning. The organization GitHub Project is the cross-repository execution view; see `PROJECTS.md` for routing details.

## Organization health

- [ ] Profiles, descriptions, topics, and READMEs are current.
- [ ] Community health files and reusable issue/PR guidance are present.
- [ ] Precision, invariants, idempotency, reconciliation, audit, reversal, and recovery are documented.
- [ ] Required checks cover concurrency, duplicate delivery, migrations, authorization, and supply-chain risk.
- [ ] Stale repositories are archived or clearly marked.
- [ ] GitHub Project and Linear links resolve and reflect completed work.
