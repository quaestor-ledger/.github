import path from 'node:path';

const ACTION_SHA = /^[0-9a-f]{40}$/i;
const WORKFLOW_PATH = /^\.github\/workflows\/[^/]+\.ya?ml$/i;
const LOCKFILES = new Set([
  'Cargo.lock', 'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml',
  'yarn.lock', 'bun.lock', 'bun.lockb', 'pubspec.lock', 'go.sum',
  'Gemfile.lock', 'composer.lock', 'Pipfile.lock', 'poetry.lock', 'uv.lock',
  'flake.lock',
]);

export function finding(severity, code, message, location = null) {
  return { severity, code, message, ...(location ? { location } : {}) };
}

function workflowJobs(content) {
  const lines = content.split(/\r?\n/);
  const jobsIndex = lines.findIndex((line) => /^jobs:\s*(?:#.*)?$/.test(line));
  if (jobsIndex < 0) return [];
  const jobs = [];
  let current = null;
  for (let index = jobsIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\S/.test(line) && line.trim() !== '') break;
    const match = line.match(/^  ([A-Za-z0-9_-]+):\s*(?:#.*)?$/);
    if (match) {
      if (current) jobs.push(current);
      current = { name: match[1], lines: [line] };
    } else if (current) current.lines.push(line);
  }
  if (current) jobs.push(current);
  return jobs;
}

function checkoutSegments(content) {
  const lines = content.split(/\r?\n/);
  const segments = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\s*-?\s*uses:\s*actions\/checkout@/i.test(lines[index])) continue;
    const indent = lines[index].match(/^\s*/)[0].length;
    const block = [lines[index]];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor];
      const candidateIndent = candidate.match(/^\s*/)[0].length;
      if (candidate.trim() !== '' && candidateIndent <= indent && /^\s*-\s+/.test(candidate)) break;
      if (candidate.trim() !== '' && candidateIndent < indent) break;
      block.push(candidate);
    }
    segments.push(block.join('\n'));
  }
  return segments;
}

export function auditWorkflow(pathname, content) {
  const findings = [];
  const lines = content.split(/\r?\n/);
  if (/^\s*pull_request_target\s*:/m.test(content)) {
    findings.push(finding('critical', 'workflow.pull_request_target', 'pull_request_target exposes a privileged trust boundary', pathname));
  }
  if (/^\s*permissions\s*:\s*write-all\s*(?:#.*)?$/mi.test(content)) {
    findings.push(finding('critical', 'workflow.write_all', 'workflow grants write-all permissions', pathname));
  }
  if (!/^permissions\s*:/m.test(content)) {
    findings.push(finding('medium', 'workflow.top_level_permissions_missing', 'workflow does not declare top-level permissions', pathname));
  }
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*-?\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/);
    if (!match) continue;
    const action = match[1];
    if (action.startsWith('./') || action.startsWith('docker://')) continue;
    const separator = action.lastIndexOf('@');
    const ref = separator >= 0 ? action.slice(separator + 1) : '';
    if (!ACTION_SHA.test(ref)) {
      findings.push(finding('high', 'workflow.action_unpinned', `external action is not pinned to a 40-character commit SHA: ${action}`, `${pathname}:${index + 1}`));
    }
  }
  for (const segment of checkoutSegments(content)) {
    if (!/^\s*persist-credentials\s*:\s*false\s*(?:#.*)?$/mi.test(segment)) {
      findings.push(finding('high', 'workflow.checkout_persists_credentials', 'actions/checkout does not explicitly disable persisted credentials', pathname));
    }
  }
  for (const job of workflowJobs(content)) {
    if (!/^\s{4}timeout-minutes\s*:\s*\d+/m.test(job.lines.join('\n'))) {
      findings.push(finding('medium', 'workflow.job_timeout_missing', `job ${job.name} has no timeout-minutes`, pathname));
    }
  }
  const untrusted = /\$\{\{\s*github\.event\.(?:pull_request|issue|discussion|comment|head_commit)\.(?:title|body|message|head\.ref|ref)\s*\}\}/;
  for (let index = 0; index < lines.length; index += 1) {
    if (untrusted.test(lines[index])) {
      findings.push(finding('high', 'workflow.untrusted_expression_in_run', 'potentially attacker-controlled event data is interpolated directly', `${pathname}:${index + 1}`));
    }
  }
  return findings;
}

export function repositorySignals(tree) {
  const paths = tree.map((entry) => entry.path);
  const lower = new Set(paths.map((item) => item.toLowerCase()));
  const basenames = new Set(paths.map((item) => path.posix.basename(item)));
  const workflowPaths = paths.filter((item) => WORKFLOW_PATH.test(item)).sort();
  const tests = paths.filter((item) => /(^|\/)(tests?|spec|scenarios)(\/|$)|(?:^|\/)[^/]+(?:\.test|_test|\.spec)\.[^/]+$/i.test(item));
  return {
    workflowPaths,
    hasWorkflows: workflowPaths.length > 0,
    hasTests: tests.length > 0,
    hasSecurityPolicy: lower.has('security.md') || lower.has('.github/security.md') || lower.has('docs/security.md'),
    hasCodeowners: lower.has('codeowners') || lower.has('.github/codeowners') || lower.has('docs/codeowners'),
    hasDependabot: lower.has('.github/dependabot.yml') || lower.has('.github/dependabot.yaml'),
    hasLockfile: [...LOCKFILES].some((name) => basenames.has(name)),
    hasDockerfile: basenames.has('Dockerfile'),
    hasDockerignore: basenames.has('.dockerignore'),
    committedPackageArchives: tree.filter((entry) => /^\.zed\/pack\/.+\.(?:tar\.gz|tgz|zip)$/i.test(entry.path)),
    largeBlobs: tree.filter((entry) => entry.type === 'blob' && Number(entry.size || 0) >= 10 * 1024 * 1024),
  };
}

export function auditRepositoryMetadata(repository, signals) {
  const findings = [];
  if (!signals.hasWorkflows) findings.push(finding('high', 'repo.no_workflows', 'repository has no GitHub Actions workflow'));
  if (!signals.hasTests) findings.push(finding('medium', 'repo.no_test_paths', 'no conventional test path was found'));
  if (!signals.hasSecurityPolicy) findings.push(finding(repository.private ? 'medium' : 'high', 'repo.security_policy_missing', 'SECURITY.md is missing'));
  if (!signals.hasCodeowners) findings.push(finding('medium', 'repo.codeowners_missing', 'CODEOWNERS is missing'));
  if (!signals.hasDependabot) findings.push(finding('low', 'repo.dependabot_missing', 'Dependabot configuration is missing'));
  if (repository.web_commit_signoff_required !== true) findings.push(finding('low', 'repo.web_commit_signoff_disabled', 'web commit signoff is not required'));
  if (signals.hasDockerfile && !signals.hasDockerignore) findings.push(finding('medium', 'repo.dockerignore_missing', 'Dockerfile exists without .dockerignore'));
  if (signals.committedPackageArchives.length > 0) {
    findings.push(finding('medium', 'repo.committed_package_archives', `${signals.committedPackageArchives.length} generated package archive(s) are committed under .zed/pack`, '.zed/pack'));
  }
  for (const entry of signals.largeBlobs) {
    findings.push(finding('high', 'repo.large_blob', `tracked blob is ${(Number(entry.size) / 1024 / 1024).toFixed(1)} MiB`, entry.path));
  }
  return findings;
}
