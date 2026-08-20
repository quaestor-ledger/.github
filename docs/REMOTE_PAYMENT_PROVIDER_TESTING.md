# Remote payment-provider E2E and certification

**Status:** target test architecture and production launch contract

**Verified:** 2026-08-20

**Product planning:** [github.com/quaestor-ledger](https://linear.app/denman/project/githubcomquaestor-ledger-a8cd440b3acc)

**Test-fleet planning:** [github.com/quaestor-ledger-test](https://linear.app/denman/project/githubcomquaestor-ledger-test-5bbe2a7b92a1)

## Linear execution map

- [DEN-3817](https://linear.app/denman/issue/DEN-3817) — active global remote-provider sandbox and certification program
- [DEN-3818](https://linear.app/denman/issue/DEN-3818) — capability manifests, reusable drivers, durable webhook ingress, and remote runner
- [DEN-3819](https://linear.app/denman/issue/DEN-3819) — scoped sandbox credentials, protected CI, certification access, and revocation
- [DEN-3820](https://linear.app/denman/issue/DEN-3820) — North America/global processors, wallets, and rails
- [DEN-3821](https://linear.app/denman/issue/DEN-3821) — Europe/global BNPL, transfers, payouts, wallets, SEPA, and Open Banking
- [DEN-3822](https://linear.app/denman/issue/DEN-3822) — LATAM processors, wallets, local methods, and Pix
- [DEN-3823](https://linear.app/denman/issue/DEN-3823) — cross-provider pricing, webhook, reconciliation, chaos, and release evidence gate

This document mirrors the [canonical Linear test architecture](https://linear.app/denman/document/global-remote-payment-provider-e2e-and-certification-architecture-7930110d601e). Product launch acceptance is owned by [DEN-1432](https://linear.app/denman/issue/DEN-1432).

## Decision

Quaestor will maintain executable, capability-driven evidence that an immutable server-owned price decision survives checkout, provider processing, asynchronous notification, ledger posting, refund or reversal, and reconciliation without changing amount, currency, tenant, or economic identity.

Remote tests use official test modes, sandboxes, model banks, or contractually provisioned certification environments. They do not automate consumer accounts, move live money, scrape applications, or turn production credentials into a general-purpose test surface. A provider without a supported merchant API or approved test environment is covered by contracts, simulators, and partner certification until access is formally provisioned.

Provider breadth is not a reason to weaken the invariant. Dynamic pricing, promotions, referral rewards, tax, currency precision, and rounding finish inside Quaestor before a provider call. The provider adapter receives an immutable decision or invoice reference and the exact authorized amount; reconciliation proves that the provider outcome maps back to it exactly once.

## Names and ownership

The production organization is `quaestor-ledger`. The existing test-fleet organization is `quaestor-ledger-test` (singular), not `quaestor-ledger-tests`.

- `quaestor-ledger/quaestor-ledger-e2e` owns the release-level orchestration contract, browser or device handoff flows, cross-repository exact-head manifests, and the summary evidence consumed by production launch gates.
- `quaestor-ledger-test/billing-provider-adapters` owns provider capability manifests, adapter protocol conformance, deterministic provider doubles, webhook fixtures, and reusable driver code.
- `quaestor-ledger-test/billing-integration-e2e` owns executable remote sandbox and certification journeys across checkout, payment, invoice, ledger, refund, dispute, and reconciliation.
- The test-fleet repositories for contracts, idempotency, security boundaries, currency and rounding, chaos and recovery, and upgrade compatibility own their specialist assertions and publish machine-readable results for the release orchestrator.
- `quaestor-ledger-server.rs` and `quaestor-executor` own production provider implementations. A test repository may exercise those implementations; it must not become a second production implementation.
- `quaestor-infra` owns secret issuance, environment protection, public webhook ingress, scheduled runners, evidence retention, egress policy, and revocation.

Generated test-fleet files remain generated. Changes to a generated repository contract must be made in the fleet manifest or bootstrap source, then regenerated and reviewed, rather than hand-editing the generated README.

## Verified baseline — 2026-08-20

- The test organization has 29 active repositories (24 private and five public), all defaulting to unprotected `main` branches.
- [`billing-provider-adapters`](https://github.com/quaestor-ledger-test/billing-provider-adapters) is currently a README-only placeholder with no provider fixtures, harness, or CI.
- [`billing-integration-e2e`](https://github.com/quaestor-ledger-test/billing-integration-e2e) has generated plan/pin validation but no executable provider test on `main`; the scheduled integration job validates metadata and prints a profile rather than calling a provider.
- [`quaestor-ledger-e2e`](https://github.com/quaestor-ledger/quaestor-ledger-e2e) has 34 shared browser scenarios across Playwright, Puppeteer, and Selenium, but its coverage contract currently has no real billing submit-to-server or payment-provider flow.
- No audited default branch contains a named remote test implementation for the providers in this document. An un-PR'd branch contains offline Stripe snapshot tests, not remote Stripe API traffic.
- Repository-level Actions settings expose no provider secret, variable, or protected environment. Organization-level secrets could not be enumerated with the available GitHub token and must be verified separately.
- Generated source pins are immutable but stale relative to current upstream heads; the new evidence gate must deliberately repin and certify exact source revisions rather than quietly following a branch.

This is the starting baseline, not an assertion that documentation has already implemented remote coverage.

## Provider taxonomy

Adapters are named for the actual integration boundary. Quaestor must not represent every brand as a fungible payment processor.

| Class | Examples | Integration rule |
| --- | --- | --- |
| Processor, gateway, or merchant API | Stripe, PayPal/Braintree, Square, Adyen, Checkout.com, Mercado Pago, EBANX, dLocal, Conekta, Mollie | Direct remote adapter when an official test environment and merchant contract support it. |
| Wallet or alternative payment method | Venmo, Cash App Pay, Apple Pay, Google Pay, Klarna, PicPay, MACH, Nequi, Yape | Model wallet authorization/token handoff separately from the processor or acquirer that settles the payment. Consumer P2P functionality is out of scope. |
| Bank-transfer rail or scheme | ACH, Pix, SEPA, UK Open Banking, Zelle | Implement through the selected bank, PSP, participant, or certified partner. There is no generic remote `ach`, `pix`, `sepa`, or `zelle` processor endpoint. |
| Acquirer or multi-product portfolio | Worldpay, Fiserv, Global Payments, PagBank/PagSeguro | Identify the exact product, API generation, country, merchant configuration, and certification program in the capability manifest. |
| Business transfer or payout platform | Wise, Payoneer, Revolut Business | Keep pay-in, payout, balance, FX, and merchant-payment capabilities separate; test only contracted endpoints. |

Rail adapters therefore include the provider path, for example `ach_stripe`, `ach_trustly`, `pix_ebanx`, or `sepa_adyen`. Wallet adapters record their downstream gateway or processor. A generic label cannot imply capabilities the actual route does not have.

## Test lanes

| Lane | Trigger | Environment | Required result |
| --- | --- | --- | --- |
| L0 — deterministic contract | Every pull request | No network and no secrets | Schema compatibility, golden fixtures, canonical money and state mappings, signature vectors, property tests, and unsupported-capability rejection. |
| L1 — adversarial simulator | Every pull request or merge | Hermetic local provider doubles | Success and every documented failure class, duplicate/reordered/missing events, timeouts, rate limits, malformed bodies, signature rejection, retry exhaustion, and reconciliation repair. |
| L2 — official remote sandbox | Nightly, manual, and release candidate | Provider test mode or public/provisioned sandbox | Real request/response, hosted flow where automatable, signed webhook ingress, lifecycle transitions, cleanup, and provider correlation evidence. |
| L3 — partner certification | Manual protected workflow | Provisioned UAT, certification host, model bank, device lab, or provider review | Provider-specific certification cases and approval artifact. Missing access is a visible blocker, never a skipped green test. |
| L4 — production verification | Manual protected workflow after deployment | Production, read-only or explicitly approved zero-risk capability/status calls | Configuration identity, webhook endpoint registration, permissions, observability, and reconciliation visibility. No synthetic charge, consumer transfer, load test, or autonomous money movement. |

L0 and L1 gate ordinary pull requests. L2 failures are triaged as product regression, provider incident, credential/configuration failure, or test defect and remain visible without making unrelated pull requests flaky. L3 and L4 are separate protected gates because provider access, review, hardware, geography, or regulated-participant status may be required.

## Canonical capability manifest

Each provider product and region has one versioned manifest. The schema includes:

- provider, exact product/API generation, adapter ID, class, owner, and status;
- supported countries, currencies, money precision, rounding, and settlement currency behavior;
- integration path, downstream processor/acquirer, merchant-of-record assumptions, and platform/connected-account behavior;
- official documentation, test endpoint, production endpoint class, API version, SDK version, and deprecation date;
- access lane, account-provisioning owner, required secret names, minimum scopes, rotation/revocation path, and environment protection;
- payment capabilities: create/order, authorize, capture, partial capture, void/cancel, refund/partial refund, dispute, recurring, mandate, tokenization, payout, FX, and reconciliation;
- synchronous and asynchronous state mappings plus terminal-state rules;
- idempotency behavior, request fingerprint, retry contract, rate limits, timeout budget, and provider correlation identifiers;
- webhook signature/version, raw-body requirement, clock tolerance, event ordering guarantees, retry schedule, replay support, and test-event mechanism;
- provider test personas/instruments, hosted/device requirements, country restrictions, synthetic-data rules, cleanup and TTL;
- known sandbox differences, unsupported cases, certification checklist, go-live approval, and allowed L4 probes; and
- most recent successful evidence digest, exact Quaestor heads, timestamp, and expiry/SLA.

The runner selects tests from declared capabilities. Unsupported behavior is an explicit, reviewed manifest state with a reason and source—not an ignored test, silent skip, or assumed success.

## Required end-to-end journey

For each applicable provider route, the executable journey proves:

1. A versioned event and eligibility snapshot produce an immutable `PriceDecision`, including base price, promotion/referral effects, tax phase, currency precision, and rounding.
2. Quote commit atomically consumes any code reservation and creates or finalizes the invoice once.
3. Checkout or execution accepts the authoritative decision/invoice reference; a caller-provided amount mismatch fails closed.
4. The adapter sends the exact amount, currency, tenant-scoped merchant identity, idempotency key, and correlation identifiers to the provider.
5. The provider executes each supported path: success, additional action, authorization, capture, cancellation, expiration, partial/full refund, decline, dispute, reversal, or asynchronous failure.
6. The public per-run webhook endpoint verifies the raw signed request before parsing, durably records delivery, rejects invalid signatures, and processes duplicate, reordered, delayed, and missing-event cases exactly once.
7. Reconciliation independently retrieves or ingests the provider outcome, repairs a deliberately missing webhook, identifies amount/currency/status divergence, and never fabricates balance.
8. Ledger postings balance by currency and link source decision, invoice, provider object, event delivery, refund/dispute, adjustment, and reconciliation evidence.
9. The suite cleans up test objects when supported, expires its namespace, redacts evidence, revokes ephemeral credentials, and publishes the exact-head result.

Every route also covers idempotency-key reuse with a conflicting payload, transport timeout after remote success, provider 429/5xx responses, bounded retry, circuit opening, credential revocation, wrong tenant or merchant account, unsupported currency/country, and sandbox unavailability.

## Remote environment and webhook design

Each run receives a random non-sensitive namespace, a bounded correlation ID, a short-lived callback route, and an expiry. The callback route is registered or selected before the provider request and can receive delayed events after the active runner exits. A durable run record lets a later reconciliation job finish the assertion.

Webhook verification operates on the exact raw bytes and provider-selected headers. Tests include a valid provider-signed delivery where available, official signature fixtures, altered body/header/timestamp cases, duplicates, retries, reordering, stale events, unknown objects, cross-tenant objects, and an event that arrives after reconciliation already converged.

Provider timestamps are evidence, not the sole order authority. State transitions follow a provider-specific monotonic state machine. A late event cannot regress a terminal Quaestor state or create a second economic posting.

Secrets are provider-, environment-, and test-lane-specific. Workflows use protected environments, short-lived federation where supported, least-privilege accounts, secret masking, egress allowlists, and concurrency locks where a provider sandbox is shared. Forked pull requests and untrusted code never receive remote credentials. Logs, fixtures, traces, and artifacts contain no raw PAN, bank credentials, API secrets, signing keys, personal account data, or reusable wallet tokens.

## Provider coverage matrix

Legend: **D** direct merchant API; **P** provisioned/partner/certification access; **W** wallet/tokenization; **R** rail or scheme. Access is recorded per product and country; this table does not promise a capability that the contracted account lacks.

### North America and global merchant platforms

| Provider/route | Class and lane | Initial remote evidence |
| --- | --- | --- |
| [Stripe](https://docs.stripe.com/testing/overview) | D; L2 self-service test mode | PaymentIntent/Checkout, 3DS, auth/capture/cancel, refund/dispute, subscriptions where used, signed webhooks, idempotency, and Billing [test clocks](https://docs.stripe.com/billing/testing). |
| [PayPal](https://developer.paypal.com/tools/sandbox/) and [Braintree](https://developer.paypal.com/braintree/docs/guides/paypal/testing-go-live/) | D; L2 sandbox | Orders, authorization/capture/refund, vault only where contracted, [REST webhooks](https://developer.paypal.com/api/rest/webhooks/), retry, and reconciliation. |
| [Venmo](https://developer.paypal.com/braintree/docs/guides/venmo/testing-go-live/) | W through PayPal/Braintree; L2/L3 depending product | Merchant wallet approval and processor lifecycle. Consumer Venmo P2P is excluded. |
| [Square](https://developer.squareup.com/docs/devtools/sandbox/overview) | D; L2 sandbox | Payments, Orders, refunds, subscriptions where supported, sandbox test values, and [webhooks](https://developer.squareup.com/docs/webhooks/overview). |
| [Adyen](https://docs.adyen.com/development-resources/testing/) | D/P; L2 test platform, L3 for enabled methods | Card and enabled local-method lifecycle, 3DS, capture/refund, [HMAC webhooks](https://docs.adyen.com/development-resources/webhooks/), platform-account routing, and reconciliation. |
| [Checkout.com](https://www.checkout.com/docs/get-started) | D/P; L2 provisioned sandbox | Payments, 3DS/action flows, capture/refund, signed webhooks, delayed outcomes, and enabled local methods. |
| [Cash App Pay](https://developers.cash.app/docs/partner/technical-documentation/sandbox/developer-sandbox) | W/P; L2 after partner provisioning | Wallet authorization and [webhook](https://developers.cash.app/cash-app-pay-partner-api/guides/technical-guides/webhooks/webhooks-overview-part-2) lifecycle. Consumer Cash App P2P is excluded. |
| [Apple Pay](https://developer.apple.com/apple-pay/sandbox-testing/) | W; L2 device/token flow plus PSP sandbox | Merchant/domain/certificate setup, payment sheet and token handoff; authorization, refund, and settlement are asserted through the selected PSP. Apple Cash is not modeled as a separate merchant processor. |
| [Google Pay](https://developers.google.com/pay/api/web/guides/test-and-deploy/integration-checklist) | W; L2 `TEST` plus gateway sandbox | Sheet/callback/token handoff—including supported [dynamic-price and promo updates](https://developers.google.com/pay/api/web/guides/tutorial)—then the gateway's payment lifecycle. |
| [Zelle](https://www.zellepay.com/join-zelle-network/partners) | R/P; L1 until formal network/bank test access, then L3 | Contract/state/conformance tests against a specific approved bank or network partner. No consumer live transfer and no invented generic merchant API. |
| ACH | R; L1 plus selected bank/PSP L2; direct participants L3 | Nacha message/file rules using the [ACH Developer Guide](https://achdevguide.nacha.org/), returns/reversals/mandates through each adapter, and authorized [FedACH testing](https://www.frbservices.org/financial-services/ach/testing-opportunities.html) only when applicable. |
| [Worldpay](https://developer.worldpay.com/products/payments/testing) | D/P; product-specific L2/L3 | Exact Access/Payments product, magic test values, events, capture/refund, and reconciliation; never one umbrella Worldpay adapter. |
| [Fiserv](https://developer.fiserv.com/) | P; product-specific L2/L3 | Separate CommerceHub, CardPointe, BluePay, or other provisioned product adapters and their official certification suite. |
| [Global Payments](https://developer.globalpayments.com/docs/getting-started/register) | D/P; L2 sandbox, L3 where terminal/certification applies | Transaction lifecycle, [signed webhooks](https://developer.globalpayments.com/api/definitions/webhooks), and required [integration validation](https://developer.globalpayments.com/support/integration-valid). |

### Europe and global transfer/payout platforms

| Provider/route | Class and lane | Initial remote evidence |
| --- | --- | --- |
| [Klarna](https://docs.klarna.com/api/api-urls/) | W/D/P; L2 playground, L3 contracted review | Contracted checkout/BNPL product, test personas, authorization/capture/cancel/refund, and product-specific callback/status behavior. |
| [Mollie](https://docs.mollie.com/reference/testing) | D; L2 test mode | Payments, refunds, recurring/chargeback states where enabled, webhook ping and [payment webhooks](https://docs.mollie.com/reference/payments-api-webhooks). |
| [Trustly](https://amer.developers.trustly.com/api-reference/api) | D/P; L2 provisioned sandbox | Bank-payment/ACH transitions, eventual consistency, and [signed asynchronous webhooks](https://amer.developers.trustly.com/integrate/core-concepts/webhooks-and-events). |
| [Wise](https://docs.wise.com/guides/developer/environments) | D/P; partner sandbox or limited Business API | Synthetic transfer/balance/FX cases within contracted scope and [webhook simulation](https://docs.wise.com/guides/developer/webhooks); no real PII, routes, or performance load. |
| [Payoneer](https://www.payoneer.com/developers-docs/accounts-payable/ap-payments-between-payoneer-accounts/) | D/P; provisioned product-specific sandbox | Exact Mass Payout, Accounts Payable, payee-onboarding, or other contracted API; synthetic payees/payments, callbacks/status, idempotency, and reconciliation. Do not conflate payout APIs with merchant pay-in. |
| [Revolut Merchant API](https://developer.revolut.com/docs/api/merchant) | D/P; L2 provisioned sandbox | Merchant orders, payments, refunds, signed webhooks, and asynchronous lifecycle. General Revolut Business capabilities remain separate. |
| SEPA | R; L1 plus PSP/bank L2, participant L3 | EPC scheme and ISO 20022 message, mandate, return, and reversal rules using the [European Payments Council scheme](https://www.europeanpaymentscouncil.eu/what-we-do/epc-payment-scheme-management/what-payment-scheme); remote calls go to the named PSP/bank. |
| [UK Open Banking](https://www.openbanking.org.uk/account-providers/) | R/P; model bank/provider L2, regulated conformance L3 | Per-ASPSP authorization, consent, payment, certificate, callback, and conformance behavior; there is no universal production endpoint. |
| N26, Monzo, Lydia, Curve | W/bank product; L1 unless a contracted official merchant/partner API is selected | Consumer-app/P2P use is excluded. Add a product-specific L2/L3 adapter only after capability and access review. |

### Latin America

| Provider/route | Class and lane | Initial remote evidence |
| --- | --- | --- |
| [Mercado Pago](https://www.mercadopago.com.br/developers/en/docs/qr-code/resources/test-accounts) | D/W; L2 official test credentials/accounts | Country-specific preference/order/payment, card or wallet test flow, notification/webhook, refund, idempotency, currency, and delayed-state mapping. |
| [EBANX](https://docs.ebanx.com/docs/payments/get-started/) | D/P; L2 sandbox, L3 integration review | Country/local-method pay-in, tokenization/hosted flow where applicable, signed callback/JWS, refund, status mapping, and review evidence. |
| [dLocal](https://docs.dlocal.com/docs/make-a-test-payment) | D/P; L2 sandbox, provider-wallet tests may require L3 | Country-specific pay-in, [wallet methods](https://docs.dlocal.com/docs/wallet-payments), async notifications, refund, FX/currency mapping, and reconciliation. |
| [Conekta](https://developers.conekta.com/reference/testwebhook) | D; L2 test mode | Mexico payment/order lifecycle, test events, webhook signature/idempotency, refund, and cash/bank methods where the account enables them. |
| [PagBank/PagSeguro](https://developer.pagbank.com.br/docs/ambientes-disponiveis) | D/P; exact current product L2/L3 | Current PagBank API generation, sandbox credentials, card/Pix/boleto capabilities, notification, refund, and homologation. Deprecated SDKs are not evidence for a current adapter. |
| [Clip](https://developer.clip.mx/reference/pruebas) | D/P; product-specific L2 or L3 | Only APIs with official sandbox support run in L2; products such as subscriptions that lack sandbox support stay blocked pending an approved certification route. |
| [Khipu](https://docs.khipu.com/en/quick-start) | D/P; developer/test mode | Chile bank-payment creation and [payment webhook](https://docs.khipu.com/en/payment-solutions/instant-payments/payment-webhook), delayed/cancelled state, and reconciliation. |
| [MACH Business API](https://docs.business-api.soymach.com/) | W/D/P; L2 official sandbox when provisioned | Exact merchant/business product, authorization/payment/callback lifecycle, refund if supported, and country/currency behavior. |
| [PicPay Payment Link](https://developers-business.picpay.com/payment-link/en/docs/sandbox/) | W/D; product-specific L2 | Payment-link sandbox, callbacks, expiry/cancel/refund, and reconciliation. PicPay products without sandbox support remain L1/L3; production purchases are not automated. |
| Nequi | W/P; L3 until official account/environment is provisioned | Colombia merchant API contract and callback certification only; consumer app automation is excluded. |
| Yape and Plin | W/P; L1 or aggregator L2 until a direct official merchant test contract exists | Test via a named PSP/aggregator route such as an enabled dLocal method, or provider certification. Never infer a public direct API from the consumer wallet. |
| [Pix](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf) | R; L1 plus participant/PSP L2, regulated certification L3 | Banco Central do Brasil message/security/conformance rules, mTLS/OAuth and lifecycle through the exact participant or PSP. Pix is a rail, not one generic processor endpoint. |
| Nubank/NuPay | W/P; product-specific L2/L3 only after provisioning | Merchant NuPay or named PSP integration where supported; Nubank consumer banking is not a payment-provider test API. |

North American/global platforms also operating in LATAM or Europe remain one adapter only when the provider contract and API are actually uniform. Country, local method, connected account, tax, currency, and settlement differences remain independent manifest capabilities and test cases.

## Delivery sequence

1. Publish the capability schema, state model, canonical fixtures, evidence format, and provider-driver interface in `billing-provider-adapters` through the test-fleet generator.
2. Turn `billing-integration-e2e` from a test-plan placeholder into an executable harness with per-run namespaces, durable webhook ingress, secret isolation, cleanup, and exact-head manifests.
3. Establish L0/L1 parity for every planned provider route before adding credentials.
4. Deliver Wave 1 L2 routes: Stripe, PayPal/Braintree, Square, Adyen, Checkout.com, and one representative wallet handoff.
5. Deliver Europe and LATAM L2 routes by official access readiness; keep provisioned/certification products visibly blocked until credentials and contracts exist.
6. Add cross-provider reconciliation, missing/duplicate/reordered webhook, timeout-after-success, refund/dispute, currency/rounding, promotion, referral, and replay suites.
7. Wire `quaestor-ledger-e2e` to consume machine-readable test-fleet evidence for exact product heads and fail a release when required capabilities are missing, stale, skipped, or divergent.
8. Add protected L3 certification and L4 post-deployment verification with owners, expiry, evidence retention, and revocation drills.

## Production acceptance gates

- No production provider request accepts an unchecked caller-owned monetary amount; the provider amount and currency resolve from an immutable Quaestor decision or invoice.
- Each production-enabled provider product, region, currency, and payment method has a reviewed capability manifest and a fresh required-lane result for the exact release heads.
- At least one real official-sandbox path proves each supported state transition, or the manifest records why only formal certification can prove it and links unexpired certification evidence.
- Signed webhook verification, duplicate/reordered/missing events, timeout-after-success, idempotency conflicts, refunds/reversals, reconciliation repair, and balanced postings pass for each applicable route.
- Promotions, referral rewards, credits, tax phase, currency precision, and rounding survive provider round-trip and reconciliation without unexplained delta.
- Missing credentials, unavailable sandboxes, unsupported capabilities, or expired certification block the affected route; they are not converted to a green skip.
- Remote-suite reliability and provider incidents are measured separately from product correctness. Bounded retries cannot conceal a deterministic regression.
- No workflow exposes secrets or customer data to forks, logs, artifacts, or fixtures; no test stores raw PAN or bank credentials; no automated suite initiates consumer or live-money transfers.
- Restore/replay can rebuild provider and ledger state from durable decisions, events, reconciliation records, and redacted evidence without double-posting.

## Evidence and operating metrics

Each run publishes a signed or content-addressed manifest containing exact repository SHAs, interface/provider manifest versions, lane, region, account alias, case IDs, timestamps, provider correlation IDs in redacted form, request/response/event digests, reconciliation result, cleanup result, and artifact retention/expiry. Raw secrets or payment credentials are never evidence.

Track provider and capability coverage, stale/blocked certifications, pass rate by failure class, webhook and reconciliation convergence time, sandbox availability, retry rate, flaky-test rate, cleanup leakage, unexplained monetary deltas, duplicate economic effects, and the time required to certify a new provider or commercial offer.

The objective is not a long logo list. It is current, reproducible proof that every advertised route preserves Quaestor's pricing, authorization, idempotency, accounting, and recovery invariants under the real protocol and the failures that protocol can produce.
