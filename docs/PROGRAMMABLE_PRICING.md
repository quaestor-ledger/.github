# Programmable pricing, promotions, referrals, and simulation

**Status:** target architecture and production launch contract

**Verified against the default branches:** 2026-08-20

**Linear project:** [github.com/quaestor-ledger](https://linear.app/denman/project/githubcomquaestor-ledger-a8cd440b3acc)

## Linear execution map

- [DEN-1427](https://linear.app/denman/issue/DEN-1427) — billing launch parent and consolidated production contract
- [DEN-1428](https://linear.app/denman/issue/DEN-1428) — immutable catalog, price books, subscriptions, and entitlements
- [DEN-1429](https://linear.app/denman/issue/DEN-1429) — append-only usage authority and replayable aggregation
- [DEN-1430](https://linear.app/denman/issue/DEN-1430) — immutable invoices, allocation, tax, credits, adjustments, and credit notes
- [DEN-1431](https://linear.app/denman/issue/DEN-1431) — authoritative collection, dunning, provider state, and reconciliation
- [DEN-1432](https://linear.app/denman/issue/DEN-1432) — exact-head end-to-end, close, replay, restore, rollout, and SLO evidence
- [DEN-3811](https://linear.app/denman/issue/DEN-3811) — effective-dated eligibility and relationship facts
- [DEN-3813](https://linear.app/denman/issue/DEN-3813) — deterministic policy evaluator and explainable quote contract
- [DEN-3814](https://linear.app/denman/issue/DEN-3814) — campaigns, promo codes, atomic redemption, stacking, and allocation
- [DEN-3815](https://linear.app/denman/issue/DEN-3815) — referral attribution, reward vesting, reversal, and clawback
- [DEN-3816](https://linear.app/denman/issue/DEN-3816) — simulation, approval, scheduled rollout, canary, pause, and rollback

The [canonical Linear architecture document](https://linear.app/denman/document/quaestor-programmable-pricing-promotions-referrals-and-simulation-d1aa892074de) and this reviewed mirror must change together when the contract or issue routing changes.

## Decision

Quaestor must treat a commercial offer as a versioned, governed financial policy rather than hard-coded checkout arithmetic. A supported pricing change should normally be a validated data change that can be simulated, approved, scheduled, observed, and retired without changing the core ledger, deploying application code, or rewriting posted history.

The ledger remains the immutable accounting authority. Pricing produces an explainable `PriceDecision`; invoice, credit, reward, and settlement workflows consume that decision and post balanced entries exactly once.

## Why this is a launch gate

The current backend is a strong ledger and provider-reconciliation foundation, but it is not yet a commercial-policy engine:

- `quaestor-ledger-server.rs/src/checkout.rs` accepts an amount already calculated by a trusted caller;
- the standalone `checkout_service` persists and reconciles checkout sessions idempotently, but still accepts caller-supplied amount, currency, and description;
- `quaestor-executor` likewise accepts a caller-provided amount rather than a Quaestor price decision;
- the canonical interfaces do not yet define products, price books, pricing policies, decisions, promotions, redemptions, referrals, subscriptions, or usage pricing; and
- customer `next_bill` is intentionally unset while subscription and usage calculation remain outside the current implementation.

Caller-supplied amounts are a migration surface, not the production pricing authority. Production checkout and collection must ultimately reference an immutable server-owned invoice or unexpired committed price decision. A caller must not be able to choose the economic amount that reaches a payment provider.

## Architectural boundary

```text
Immutable business or usage event
                |
                v
Versioned evaluation context
(tenant, customer, contract, entitlement, relationship, usage)
                |
                v
Versioned pricing-policy evaluator
  | base and tiered prices
  | contract overrides
  | eligibility rules
  | campaigns and promo codes
  | referral programs and rewards
  | stacking, exclusivity, caps, and budgets
                |
                v
Immutable, explainable PriceDecision
                |
       +--------+--------+
       |                 |
       v                 v
Invoice/credit       Quote/checkout
       |                 |
       +--------+--------+
                v
Double-entry postings, collection, and reconciliation
```

Pricing may read versioned projections, but it must not call third-party services during evaluation. External membership, contract, entitlement, and relationship facts must be projected into Quaestor with provenance and effective intervals. This keeps evaluation deterministic, bounded, replayable, and resilient to an authority outage.

## Canonical domain objects

| Object | Required behavior |
| --- | --- |
| `Product` and `PriceBookVersion` | Stable product and metric identities; immutable fixed, seat, quantity, tiered, volume, package, usage, geographic, and contract price revisions with currency, precision, rounding, and effective intervals. |
| `PricingPolicyVersion` | Immutable after publication; typed predicates and effects; evaluator version; priority; activation window; tenant/product scope; approval metadata; no arbitrary network or filesystem access. |
| `EligibilityFactVersion` | Effective-dated tenant, customer, contract, entitlement, segment, partner, membership, and relationship facts with source, observed time, authority, confidence/state, and revocation history. |
| `PromotionCampaignVersion` | Offer definition, products, segments, jurisdictions, minimum spend, first-purchase rules, validity, budgets, global/customer/code limits, and stacking behavior. |
| `RedemptionCode` and `CodeReservation` | Normalization and lookup policy, activation/expiry, per-code limits, atomic reserve/commit/release, reservation expiry, revocation, and idempotency. Raw private or single-use codes must not appear in logs or traces. |
| `ReferralProgramVersion` and `ReferralAttribution` | Referrer/referee, attribution window, qualifying event, bilateral reward terms, provenance, and pending/earned/reversed/expired states. |
| `PriceDecision` | Immutable inputs and context hashes, source event, evaluator and policy versions, candidate rules, applied and rejected reasons, calculation tree, allocation, code/referral attribution, actor, timestamps, quote expiry, and resulting resource links. |
| `CreditGrant` and `RewardGrant` | First-class amount, currency, source, owner, vesting/expiry, consumption, reversal/clawback, and linked ledger entries. Never mutate a balance field as the source of truth. |

Published versions are append-only. Corrections create a new version or a compensating adjustment; they do not edit an activated policy, finalized invoice, earned reward, or posted ledger transaction.

## Rule model and determinism

Version 1 should use a constrained, typed declarative schema owned by `quaestor-interfaces`. Supported predicates and effects must be enumerated and schema-validated. General-purpose scripts, unmetered regular expressions, recursive expressions, and arbitrary WASM, Rego, CEL, or JSON-Logic execution are not part of the initial trust boundary.

A future expression adapter requires its own versioned contract, deterministic semantics, resource limits, signing and provenance, compatibility tests, and security review. Extensibility must not turn pricing into a remote-code-execution surface.

For identical events, context versions, policy versions, evaluator version, currency rules, and effective time, evaluation must produce an equivalent canonical decision. The evaluator must use:

- integer minor units or fixed-precision decimals, never binary floating point for money;
- explicit currency and rounding mode at declared calculation boundaries;
- an injected effective time rather than an ambient clock;
- deterministic ordering and stable tie-breakers;
- bounded input sizes, rule counts, depth, CPU, and memory;
- machine-readable rejection and ineligibility reasons; and
- no live network, filesystem, environment, or nondeterministic random access.

## Calculation and stacking

Every effect declares a calculation phase. Version 1 phases are:

1. base price and quantity/usage tier;
2. negotiated contract override;
3. pre-tax commercial discount;
4. tax decision and snapshot;
5. post-tax credit or reward application; and
6. resulting receivable, payable, commission, or partner allocation.

Within a phase, policies use explicit priority and stable policy ID as the final tie-breaker. Promotions declare exclusive groups, combinability, `best_price` behavior, line or order allocation, maximum aggregate discount, floor amount, and whether unused value may become a credit. Negative charges are forbidden unless an explicit credit policy creates a separate auditable credit.

Tax discounts, post-tax credits, referral rewards, commissions, and partner payouts are distinct economic objects. They must not be collapsed into a generic negative line item when their accounting or jurisdictional treatment differs.

## Dynamic pricing and offer coverage

The contract must support these changes without modifying core ledger code:

- fixed, seat, package, quantity, tiered, volume, and metered usage prices;
- customer segment, geography, currency, plan, contract, entitlement, and relationship eligibility;
- scheduled and tenant-specific prices with effective intervals;
- percentage and fixed-amount discounts, free units, trials, loyalty credits, and organization-pooled credits;
- public, private, single-use, customer-bound, and bulk campaign codes;
- first-purchase, minimum-spend, product-scoped, and usage-threshold offers;
- referrer-only, referee-only, and bilateral referral rewards;
- commissions, revenue sharing, partner payouts, and human-review rewards; and
- caps, floors, budgets, per-customer/global redemption limits, and manual overrides with approval.

Unsupported primitives fail validation before activation. Operators must never approximate an unsupported policy with an opaque manual balance edit.

## Promotion-code lifecycle

```text
draft -> validated -> approved -> scheduled -> active -> paused -> retired
                                      |
                                      v
                       reserved -> committed
                            |          |
                            v          v
                         released   reversed
```

Reservation, limit, and budget updates must be atomic. Concurrent requests cannot exceed a code, customer, campaign, or monetary budget. An idempotency key and request fingerprint must ensure retries have one economic effect. Quote-to-commit either consumes a still-valid pinned decision and reservation or returns a clear repricing requirement.

Redemption responses must not reveal whether a private code exists beyond the bounded result appropriate for the authenticated customer. Rate limits, entropy requirements for private codes, normalized comparison, safe display, audit events, and anomaly monitoring are required.

## Referral lifecycle and abuse controls

Referral attribution is not a coupon alias. It records both parties and the qualifying relationship, then moves a reward through `pending`, `earned`, `reversed`, and `expired` states. Reward issuance and reversal must be exactly once and linked to the qualifying purchase, refund, dispute, or fraud decision and to the resulting ledger entries.

Controls must cover self-referrals, circular referrals, duplicate identities, account farms, repeated purchase/refund behavior, reused payment instruments where legally and operationally appropriate, tenant crossing, and manual-review escalation. Store only bounded evidence and approved identifiers; do not place sensitive fraud signals or raw personal data in general-purpose pricing traces.

## APIs and trust boundaries

The versioned contract should expose at least:

- policy validation and lifecycle administration;
- eligibility-fact ingestion and historical-as-of lookup;
- campaign, code, referral-program, and attribution administration;
- quote/dry-run evaluation;
- reserve, commit, release, and reverse redemption operations;
- committed price-decision and compensating-adjustment creation;
- historical simulation and decision-diff reporting; and
- explain endpoints that return bounded, authorization-filtered decision reasons.

Every mutation requires exact tenant authorization, fresh assurance where required, an idempotency key, actor/session/correlation attribution, and an append-only audit record committed with the financial mutation.

Checkout migration must move both current checkout surfaces from caller-owned `amount_minor` to an authoritative `price_decision_id` or finalized `invoice_id`. During a bounded migration window, any legacy amount must be recomputed and matched against the pinned server-owned decision; mismatch fails closed. The legacy path must have an explicit retirement date and telemetry.

The two checkout surfaces must converge on one quote-to-checkout application service or delegate to the same authoritative implementation. Their current differences in persistence, authentication, Stripe account selection, and reconciliation cannot produce different economic outcomes. `quaestor-executor` must also bind every payment instruction to the same immutable decision or invoice total.

## Simulation, approval, and rollout

```text
draft -> schema validation -> historical simulation -> approval
      -> shadow evaluation -> tenant/campaign canary -> scheduled activation
      -> active monitoring -> pause or immutable successor version
```

Simulation must report affected customers, aggregate and per-currency revenue delta, largest increases/decreases, discount and reward totals, cap/budget consumption, eligibility changes, evaluation errors, and representative decision diffs. Historical inputs must be authorized and privacy-bounded.

Activation requires separation of duties for high-impact policies, a change reason, immutable approval evidence, exposure limits, monitoring, and a kill switch that pauses further use without rewriting existing decisions. Rollback means pausing the policy and activating a reviewed immutable successor or previously published version, not deleting data or changing history.

## Accounting and replay invariants

- Every finalized financial transaction balances by currency.
- Repeated event, quote, redemption, reward, invoice-finalization, and collection requests have one economic effect.
- Posted history is corrected only through linked compensating events and entries.
- Replaying a historical event uses its recorded policy, evaluator, context, usage-window, tax, currency, and rounding versions.
- Retroactive repricing produces an explicit delta and approval trail; it never silently changes prior balances.
- Credits, discounts, rewards, commissions, allocations, expirations, and reversals are queryable first-class records.
- A decision can be traced from source event and eligibility facts through calculation and approval to invoice lines, ledger entries, checkout, collection, and reconciliation.

## Repository ownership

- `quaestor-interfaces`: authoritative schemas, enums, compatibility rules, canonical fixtures, generated interfaces, and money representations for pricing events, policies, facts, decisions, campaigns, referrals, and rewards.
- `quaestor-ledger-server.rs`: persistence, policy lifecycle, context projection, deterministic evaluation, quote/commit, atomic redemptions, referral lifecycle, invoice integration, adjustments, simulation jobs/APIs, and migration of current checkout entry points.
- `quaestor-clients`: generated client parity for published pricing and explanation APIs; no independent monetary calculation.
- `quaestor-executor`: non-custodial execution of an amount and currency resolved from an immutable Quaestor price decision or invoice; no caller-authoritative monetary calculation.
- `quaestor-web-server.rs` and `quaestor-flutter`: authorization-aware administration, simulation, approval, and read-only explanation surfaces; no separate pricing engine.
- `quaestor-ledger-e2e`: golden decision fixtures, property and concurrency tests, replay, cross-SDK conformance, checkout migration, shadow/canary, and end-to-end accounting evidence.
- `quaestor-infra`: migrations, scheduling, feature flags, canary controls, kill switch, dashboards, alerts, capacity, backup/restore, and immutable deployment evidence.
- `.github/docs`: reviewed organization-level architecture mirror and planning links.

Do not invent a dependency on a missing `quaestor-lib`, `quaestor-simulator`, or other repository. Shared logic may be extracted only after the public contract and ownership boundary are reviewed and the repository exists.

## Migration plan

1. Publish versioned pricing-event, fact, policy, and decision schemas plus golden fixtures.
2. Add immutable product/price books and effective-dated eligibility projections.
3. Implement the bounded evaluator and quote API behind a disabled production flag.
4. Add campaigns, codes, referrals, credits, and atomic reservation state machines.
5. Integrate immutable decisions into invoices, converge both checkout entry points, and bind executor instructions to the same authority.
6. Replay synthetic and authorized historical events; dual-run legacy and new calculations and reconcile every difference.
7. Shadow live traffic, then canary by tenant/campaign with exposure caps and anomaly alerts.
8. Disable and retire caller-authoritative amounts only after exact-head E2E and recovery evidence is green.

Migrations are additive and roll forward. Existing ledger, checkout, invoice, and reconciliation history is retained.

## Production acceptance gates

- An operator can create and schedule a product-specific 20% first-purchase promotion, limited to one use per customer and 1,000 uses globally, without an application-code change or schema migration.
- A relational offer can require both parties to be active customers in an approved relationship; an ineligible quote includes a bounded machine-readable reason.
- Identical versioned inputs produce an equivalent canonical decision across replay and supported runtimes.
- Incompatible promotions are rejected deterministically, calculation phases and allocation are visible, and caps prevent unintended negative charges.
- Concurrent attempts cannot overspend a promotion budget or redemption limit, and retries cannot double-redeem, double-reward, double-invoice, or double-post.
- Referral rewards qualify, earn, expire, reverse, and claw back exactly once with linked evidence and ledger entries.
- Every applied or rejected amount is traceable to source events, context facts, policy/evaluator versions, approval, calculation steps, code/referral attribution, invoice lines, and ledger entries.
- Historical simulation and shadow evaluation report impact and decision diffs before activation; canaries, pause, exposure caps, and anomaly alerts are proven.
- Production checkout derives amount and currency from an immutable server-owned decision or invoice, never from an unchecked caller value.
- Property, boundary-time, currency, rounding, stacking, concurrency, duplicate, late-event, refund, replay, migration, restore, and accounting-invariant tests pass on the exact reviewed head.
- Every enabled payment route passes the [remote-provider E2E and certification contract](REMOTE_PAYMENT_PROVIDER_TESTING.md), proving that promotion, referral, tax, currency, and rounding decisions survive provider execution, asynchronous events, refunds, and reconciliation unchanged.

## Platform metrics

Track:

- lead time from approved offer request to safe activation;
- percentage of supported pricing changes requiring code deployment or schema migration, with a target of zero;
- quote and commit latency by policy complexity;
- shadow-versus-live decision divergence;
- redemption, budget, referral, reward, and revenue anomalies;
- replay mismatch and unexplained-adjustment rate; and
- time to pause a faulty policy and complete a reviewed successor rollout.

The AT&T/MCI lesson is operational: commercial strategy cannot move faster than the software that expresses and proves it. Quaestor succeeds when a new offer is a safe, explainable, reversible policy rollout—not a risky rewrite of the financial core.
