import { repositorySignals } from './workflow-audit.mjs';

async function request(apiBase, token, route, optional = false) {
  const response = await fetch(`${apiBase}${route}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'quaestor-ledger-portfolio-auditor',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  const text = await response.text();
  if (response.ok) return optional ? { state: 'verified', status: response.status, data: text ? JSON.parse(text) : null } : (text ? JSON.parse(text) : null);
  if (optional && (response.status === 403 || response.status === 404)) return { state: 'not-observable', status: response.status };
  const detail = text.slice(0, 500).replace(token, '***');
  throw new Error(`GitHub API ${response.status} for ${route}: ${detail}`);
}

async function listRepositories(apiBase, token, org) {
  const repositories = [];
  for (let page = 1; ; page += 1) {
    const batch = await request(apiBase, token, `/orgs/${encodeURIComponent(org)}/repos?type=all&per_page=100&page=${page}`);
    repositories.push(...batch);
    if (batch.length < 100) break;
  }
  return repositories.sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadLiveSnapshot(options, token) {
  const repositories = await listRepositories(options.apiBase, token, options.org);
  if (repositories.length !== options.expectedRepositories) {
    throw new Error(`coverage failure: expected exactly ${options.expectedRepositories} repositories but token can see ${repositories.length}`);
  }
  const organizationRulesets = await request(options.apiBase, token, `/orgs/${encodeURIComponent(options.org)}/rulesets`, true);
  const actionsPolicy = await request(options.apiBase, token, `/orgs/${encodeURIComponent(options.org)}/actions/permissions`, true);
  const snapshot = {
    organization: options.org,
    organizationControls: {
      organizationRulesets: organizationRulesets.state === 'verified'
        ? { state: 'verified', count: Array.isArray(organizationRulesets.data) ? organizationRulesets.data.length : null }
        : organizationRulesets,
      actionsPolicy: actionsPolicy.state === 'verified'
        ? { state: 'verified', policy: actionsPolicy.data }
        : actionsPolicy,
    },
    repositories: [],
  };

  for (const repository of repositories) {
    const owner = encodeURIComponent(options.org);
    const name = encodeURIComponent(repository.name);
    const branch = encodeURIComponent(repository.default_branch);
    const tree = await request(options.apiBase, token, `/repos/${owner}/${name}/git/trees/${branch}?recursive=1`);
    if (tree.truncated) throw new Error(`coverage failure: recursive tree is truncated for ${repository.full_name}`);
    const workflowContents = {};
    const signals = repositorySignals(tree.tree);
    for (const workflowPath of signals.workflowPaths) {
      const encodedPath = workflowPath.split('/').map(encodeURIComponent).join('/');
      const file = await request(options.apiBase, token, `/repos/${owner}/${name}/contents/${encodedPath}?ref=${branch}`);
      if (file.encoding !== 'base64') throw new Error(`unsupported workflow encoding for ${repository.full_name}/${workflowPath}`);
      workflowContents[workflowPath] = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8');
    }
    const protection = await request(options.apiBase, token, `/repos/${owner}/${name}/branches/${branch}/protection`, true);
    snapshot.repositories.push({
      metadata: {
        name: repository.name,
        full_name: repository.full_name,
        private: repository.private,
        visibility: repository.visibility,
        default_branch: repository.default_branch,
        archived: repository.archived,
        disabled: repository.disabled,
        web_commit_signoff_required: repository.web_commit_signoff_required,
        pushed_at: repository.pushed_at,
      },
      tree: tree.tree.map(({ path, type, mode, size }) => ({ path, type, mode, ...(Number.isFinite(size) ? { size } : {}) })),
      workflows: workflowContents,
      adminControls: {
        branchProtection: protection.state === 'verified'
          ? {
              state: 'verified',
              requiredStatusChecks: Boolean(protection.data?.required_status_checks),
              requiredPullRequestReviews: Boolean(protection.data?.required_pull_request_reviews),
              enforceAdmins: Boolean(protection.data?.enforce_admins?.enabled),
              requiredLinearHistory: Boolean(protection.data?.required_linear_history?.enabled),
              requiredConversationResolution: Boolean(protection.data?.required_conversation_resolution?.enabled),
            }
          : protection,
      },
    });
  }
  return snapshot;
}
