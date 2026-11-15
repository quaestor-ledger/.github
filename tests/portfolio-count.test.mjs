import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('portfolio coverage ratchet stays synchronized across CLI, CI and docs', async () => {
  const [cli, workflow, docs] = await Promise.all([
    readFile(new URL('../scripts/audit-org.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../.github/workflows/portfolio-security-audit.yml', import.meta.url), 'utf8'),
    readFile(new URL('../docs/portfolio-audit.md', import.meta.url), 'utf8'),
  ]);
  // Updating the fleet requires an explicit review of this expected count.
  const expectedRepositories = 28;
  const cliMatch = cli.match(/expectedRepositories:\s*(\d+),/);
  const workflowMatch = workflow.match(/--expected-repositories\s+(\d+)/);
  assert.ok(cliMatch, 'CLI coverage default must be explicit');
  assert.ok(workflowMatch, 'scheduled audit must require an explicit count');
  assert.equal(Number(cliMatch[1]), expectedRepositories);
  assert.equal(Number(workflowMatch[1]), expectedRepositories);
  assert.match(docs, /exactly 28 repositories/);
  assert.match(docs, /adding a twenty-ninth repository requires an explicit review/);
});
