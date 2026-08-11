import assert from 'node:assert/strict';
import test from 'node:test';

import { auditWorkflow } from '../scripts/workflow-audit.mjs';
import { auditSnapshot } from '../scripts/report.mjs';

const safeWorkflow = `name: safe\non: [pull_request]\npermissions:\n  contents: read\njobs:\n  test:\n    timeout-minutes: 10\n    runs-on: ubuntu-24.04\n    steps:\n      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1\n        with:\n          persist-credentials: false\n      - run: node --test\n`;

test('safe workflow has no trust-boundary findings', () => {
  assert.deepEqual(auditWorkflow('.github/workflows/ci.yml', safeWorkflow), []);
});

test('workflow audit rejects privileged triggers, broad permissions, tags, and credential persistence', () => {
  const unsafe = `name: unsafe\non:\n  pull_request_target:\npermissions: write-all\njobs:\n  mutate:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo "${'${{ github.event.pull_request.title }}'}"\n`;
  const codes = new Set(auditWorkflow('.github/workflows/unsafe.yml', unsafe).map((item) => item.code));
  for (const code of [
    'workflow.pull_request_target',
    'workflow.write_all',
    'workflow.action_unpinned',
    'workflow.checkout_persists_credentials',
    'workflow.job_timeout_missing',
    'workflow.untrusted_expression_in_run',
  ]) assert.equal(codes.has(code), true, code);
});

test('snapshot audit inventories repository controls and source signals', () => {
  const snapshot = {
    organization: 'quaestor-ledger',
    repositories: [{
      metadata: {
        name: 'example',
        private: true,
        visibility: 'private',
        default_branch: 'main',
        web_commit_signoff_required: false,
      },
      tree: [
        { path: '.github/workflows/ci.yml', type: 'blob', mode: '100644' },
        { path: 'tests/example.test.mjs', type: 'blob', mode: '100644' },
        { path: 'SECURITY.md', type: 'blob', mode: '100644' },
        { path: '.github/CODEOWNERS', type: 'blob', mode: '100644' },
        { path: '.github/dependabot.yml', type: 'blob', mode: '100644' },
        { path: 'package-lock.json', type: 'blob', mode: '100644' },
      ],
      workflows: { '.github/workflows/ci.yml': safeWorkflow },
      adminControls: {
        branchProtection: 'not-observable-by-repository-integration',
        organizationRulesets: 'not-observable-by-repository-integration',
        actionsPolicy: 'not-observable-by-repository-integration',
      },
    }],
  };

  const report = auditSnapshot(snapshot, 1);
  assert.equal(report.coverageComplete, true);
  assert.equal(report.repositoryCount, 1);
  assert.equal(report.repositories[0].signals.hasTests, true);
  assert.equal(report.repositories[0].signals.hasSecurityPolicy, true);
  assert.deepEqual(report.counts, { critical: 0, high: 0, medium: 0, low: 1 });
});

test('snapshot audit fails closed on incomplete repository coverage', () => {
  assert.throws(
    () => auditSnapshot({ organization: 'quaestor-ledger', repositories: [] }, 13),
    /coverage failure: expected exactly 13 repositories/,
  );
});

test('missing workflow content is a high-severity coverage failure', () => {
  const report = auditSnapshot({
    organization: 'quaestor-ledger',
    repositories: [{
      metadata: {
        name: 'example',
        private: true,
        visibility: 'private',
        default_branch: 'main',
        web_commit_signoff_required: true,
      },
      tree: [{ path: '.github/workflows/ci.yml', type: 'blob', mode: '100644' }],
      workflows: {},
    }],
  }, 1);
  assert.equal(report.counts.high >= 1, true);
  assert.equal(report.repositories[0].findings.some((item) => item.code === 'workflow.content_missing'), true);
});


test('large committed package archives are visible supply-chain findings', () => {
  const report = auditSnapshot({
    organization: 'quaestor-ledger',
    repositories: [{
      metadata: {
        name: 'clients',
        private: true,
        visibility: 'private',
        default_branch: 'main',
        web_commit_signoff_required: true,
      },
      tree: [
        { path: '.github/workflows/ci.yml', type: 'blob', mode: '100644', size: 1000 },
        { path: '.zed/pack/clients-repository-0.1.0.tar.gz', type: 'blob', mode: '100644', size: 18 * 1024 * 1024 },
        { path: 'tests/smoke.test.mjs', type: 'blob', mode: '100644', size: 1000 },
      ],
      workflows: { '.github/workflows/ci.yml': safeWorkflow },
    }],
  }, 1);
  const codes = new Set(report.repositories[0].findings.map((item) => item.code));
  assert.equal(codes.has('repo.committed_package_archives'), true);
  assert.equal(codes.has('repo.large_blob'), true);
});
