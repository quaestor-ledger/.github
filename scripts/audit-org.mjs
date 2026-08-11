#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { loadLiveSnapshot } from './github-snapshot.mjs';
import { auditSnapshot, markdownReport } from './report.mjs';

function parseArgs(argv) {
  const options = {
    org: process.env.GITHUB_REPOSITORY_OWNER || 'quaestor-ledger',
    expectedRepositories: 13,
    outputDir: 'artifacts/portfolio-audit',
    apiBase: process.env.GITHUB_API_URL || 'https://api.github.com',
    snapshot: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === '--org') options.org = value, index += 1;
    else if (arg === '--expected-repositories') options.expectedRepositories = Number(value), index += 1;
    else if (arg === '--output-dir') options.outputDir = value, index += 1;
    else if (arg === '--api-base') options.apiBase = value, index += 1;
    else if (arg === '--snapshot') options.snapshot = value, index += 1;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.expectedRepositories) || options.expectedRepositories < 1) {
    throw new Error('--expected-repositories must be a positive integer');
  }
  return options;
}

function usage() {
  return `Usage: node scripts/audit-org.mjs [options]\n\n` +
    `  --org <name>                    GitHub organization\n` +
    `  --expected-repositories <n>     Fail closed unless exactly n repositories are visible\n` +
    `  --output-dir <path>             JSON/Markdown output directory\n` +
    `  --snapshot <path>               Audit an offline fixture instead of the API\n` +
    `  --api-base <url>                GitHub API base URL\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return process.stdout.write(usage());
  let snapshot;
  if (options.snapshot) snapshot = JSON.parse(await fs.readFile(options.snapshot, 'utf8'));
  else {
    const token = process.env.ORG_AUDIT_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) throw new Error('ORG_AUDIT_TOKEN or GITHUB_TOKEN is required for a live audit');
    snapshot = await loadLiveSnapshot(options, token);
  }
  const report = auditSnapshot(snapshot, options.expectedRepositories);
  await fs.mkdir(options.outputDir, { recursive: true });
  const jsonPath = path.join(options.outputDir, 'quaestor-ledger-audit.json');
  const markdownPath = path.join(options.outputDir, 'quaestor-ledger-audit.md');
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, markdownReport(report));
  process.stdout.write(`${JSON.stringify({ jsonPath, markdownPath, counts: report.counts, repositories: report.repositoryCount })}\n`);
  if (report.counts.critical > 0) process.exitCode = 2;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
