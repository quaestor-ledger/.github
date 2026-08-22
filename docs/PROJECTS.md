<!-- org-project-routing:start -->
# Project routing

- **GitHub organization:** [quaestor-ledger](https://github.com/quaestor-ledger)
- **Canonical GitHub Project:** [quaestor-ledger-project](https://github.com/orgs/quaestor-ledger/projects/1) (project 1)
- **Canonical Linear project:** [planning workspace](https://linear.app/denman/project/githubcomquaestor-ledger-a8cd440b3acc)
- **Organization documentation repository:** [quaestor-ledger/.github](https://github.com/quaestor-ledger/.github)

## Source-of-truth boundaries

GitHub is authoritative for repositories, commits, pull requests, reviews, CI checks, releases, deployable artifacts, and runtime evidence. Linear is authoritative for product planning, priorities, ownership, dependencies, milestones, and status reporting. The GitHub Project is the organization-level execution board and should contain the governance issue maintained by this repository.

## Change and merge policy

Documentation branches must be reviewed through pull requests and merged after checks pass. Concurrent edits are reconciled semantically against the latest default branch: this managed routing block is regenerated while all unrelated prose outside the block is preserved. Do not resolve conflicts by blindly choosing one side.
<!-- org-project-routing:end -->

## Product architecture documents

- [Programmable pricing, promotions, referrals, and simulation](PROGRAMMABLE_PRICING.md)
- [Remote payment-provider E2E and certification](REMOTE_PAYMENT_PROVIDER_TESTING.md)
- [Canonical Linear programmable-pricing architecture](https://linear.app/denman/document/quaestor-programmable-pricing-promotions-referrals-and-simulation-d1aa892074de)
- [Canonical Linear remote-provider test architecture](https://linear.app/denman/document/global-remote-payment-provider-e2e-and-certification-architecture-7930110d601e)
- [Product launch epic DEN-1427](https://linear.app/denman/issue/DEN-1427)
- [Remote-provider test program DEN-3817](https://linear.app/denman/issue/DEN-3817)

Linear remains authoritative for priority, dependencies, and ticket status. The reviewed GitHub document is the durable architecture mirror. Material policy, acceptance-gate, repository-ownership, or issue-routing changes must update both surfaces in the same delivery.
