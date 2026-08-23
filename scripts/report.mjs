import { auditRepositoryMetadata, auditWorkflow, repositorySignals } from './workflow-audit.mjs';

export function auditSnapshot(snapshot, expectedRepositories = null) {
  if (!snapshot || !Array.isArray(snapshot.repositories)) throw new Error('snapshot.repositories must be an array');
  if (expectedRepositories !== null && snapshot.repositories.length !== expectedRepositories) {
    throw new Error(`coverage failure: expected exactly ${expectedRepositories} repositories but snapshot contains ${snapshot.repositories.length}`);
  }
  const repositories = snapshot.repositories.map((entry) => {
    const signals = repositorySignals(entry.tree || []);
    const findings = auditRepositoryMetadata(entry.metadata, signals);
    for (const workflowPath of signals.workflowPaths) {
      const content = entry.workflows?.[workflowPath];
      if (typeof content !== 'string') {
        findings.push({ severity: 'high', code: 'workflow.content_missing', message: 'workflow content is absent from snapshot', location: workflowPath });
      } else findings.push(...auditWorkflow(workflowPath, content));
    }
    return {
      name: entry.metadata.name,
      visibility: entry.metadata.visibility,
      private: entry.metadata.private,
      defaultBranch: entry.metadata.default_branch,
      pushedAt: entry.metadata.pushed_at ?? null,
      signals: {
        workflowCount: signals.workflowPaths.length,
        hasTests: signals.hasTests,
        hasSecurityPolicy: signals.hasSecurityPolicy,
        hasCodeowners: signals.hasCodeowners,
        hasDependabot: signals.hasDependabot,
        hasLockfile: signals.hasLockfile,
      },
      adminControls: entry.adminControls ?? { branchProtection: { state: 'not-audited' } },
      findings,
    };
  });
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const repository of repositories) for (const item of repository.findings) counts[item.severity] += 1;
  const branchStates = repositories.map((repository) => repository.adminControls?.branchProtection?.state ?? 'not-audited');
  return {
    schemaVersion: 1,
    organization: snapshot.organization,
    generatedAt: new Date().toISOString(),
    repositoryCount: repositories.length,
    coverageComplete: expectedRepositories === null || repositories.length === expectedRepositories,
    adminControlCoverage: {
      branchProtectionVerified: branchStates.filter((state) => state === 'verified').length,
      branchProtectionNotObservable: branchStates.filter((state) => state === 'not-observable').length,
      organizationRulesets: snapshot.organizationControls?.organizationRulesets?.state ?? 'not-audited',
      actionsPolicy: snapshot.organizationControls?.actionsPolicy?.state ?? 'not-audited',
    },
    organizationControls: snapshot.organizationControls ?? {},
    counts,
    repositories,
  };
}

export function markdownReport(report) {
  const lines = [
    `# ${report.organization} portfolio audit`, '',
    `Generated: ${report.generatedAt}`, '',
    `Repository source coverage: **${report.repositoryCount} repositories** (${report.coverageComplete ? 'complete' : 'incomplete'}).`, '',
    `Admin controls: branch protection verified for **${report.adminControlCoverage.branchProtectionVerified}/${report.repositoryCount}** repositories; org rulesets **${report.adminControlCoverage.organizationRulesets}**; Actions policy **${report.adminControlCoverage.actionsPolicy}**.`, '',
    `Findings: critical ${report.counts.critical}, high ${report.counts.high}, medium ${report.counts.medium}, low ${report.counts.low}.`, '',
    '| Repository | Workflows | Tests | SECURITY | CODEOWNERS | Dependabot | Critical | High | Medium | Low |',
    '|---|---:|:---:|:---:|:---:|:---:|---:|---:|---:|---:|',
  ];
  for (const repository of report.repositories) {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const item of repository.findings) counts[item.severity] += 1;
    lines.push(`| ${repository.name} | ${repository.signals.workflowCount} | ${repository.signals.hasTests ? 'yes' : 'no'} | ${repository.signals.hasSecurityPolicy ? 'yes' : 'no'} | ${repository.signals.hasCodeowners ? 'yes' : 'no'} | ${repository.signals.hasDependabot ? 'yes' : 'no'} | ${counts.critical} | ${counts.high} | ${counts.medium} | ${counts.low} |`);
  }
  lines.push('', '## Findings', '');
  for (const repository of report.repositories) {
    lines.push(`### ${repository.name}`, '');
    if (repository.findings.length === 0) lines.push('- No source-level findings.');
    else for (const item of repository.findings) lines.push(`- **${item.severity.toUpperCase()} ${item.code}:** ${item.message}${item.location ? ` (${item.location})` : ''}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}
