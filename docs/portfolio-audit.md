# Portfolio security audit

`portfolio-security-audit.yml` provides one read-only evidence path across every repository in `quaestor-ledger`. The auditor checks repository source signals, workflow trust boundaries, large tracked artifacts, and the visibility of organization-level controls.

## Coverage contract

The live job fails unless its credential can see exactly 13 repositories. This is deliberate:

- a repository-scoped `GITHUB_TOKEN` must not produce a false-green private-organization audit;
- losing access to one private repository is a coverage failure;
- adding a fourteenth repository requires an explicit review and count ratchet in the workflow; and
- a truncated recursive Git tree or missing workflow body is a failure, not a skipped check.

## Credential configuration

Configure an Actions secret named `ORG_AUDIT_TOKEN` in `quaestor-ledger/.github`. Prefer a short-lived GitHub App installation token. The minimum useful permissions are organization metadata read and repository contents read for every organization repository. Administration read permissions additionally allow the report to verify default-branch protection, organization rulesets, and the organization Actions policy.

Do not commit a personal access token, place one in workflow YAML, print one in logs, or pass one in a pull-request event. Pull-request jobs run only the dependency-free contract tests and never receive the audit credential.

## Checks

The source-level audit currently detects:

- incomplete repository visibility;
- missing or unreadable workflow content;
- `pull_request_target` trust boundaries;
- `permissions: write-all`;
- external Actions not pinned to a 40-character commit;
- checkout steps that persist credentials;
- jobs without timeouts;
- direct interpolation of attacker-controlled event fields;
- repositories without workflows, conventional tests, `SECURITY.md`, `CODEOWNERS`, or Dependabot configuration;
- Dockerfiles without `.dockerignore`;
- generated package archives committed under `.zed/pack`; and
- tracked blobs of at least 10 MiB.

Critical workflow findings make the live command exit non-zero. Other findings remain visible in JSON and Markdown so remediation can be staged without hiding debt.

## Evidence handling

The live job writes `quaestor-ledger-audit.json` and `quaestor-ledger-audit.md`, then copies the Markdown report into the GitHub Actions job summary. The workflow is read-only and does not mutate repositories, branch protections, rulesets, secrets, or Actions settings.

The dated snapshot in `audits/2026-08-10-quaestor-ledger.md` records the initial connector-assisted audit. It distinguishes source coverage from controls that the repository integration could not observe.
