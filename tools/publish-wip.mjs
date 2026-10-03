/** First publication for the explicitly named WIP repository.
 * Run on the owner's PC with Node 22+, Git and GitHub CLI. No token is embedded.
 * Never force-push, delete a remote repository, or make a private repo public.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export const TARGET = 'IceWolf23X/CoreChatX-WebSite-wip';
const OWNER = 'IceWolf23X';
const REPO = 'CoreChatX-WebSite-wip';
const PUBLIC_ENTRIES = [
  '.github', '.gitignore', '.gitattributes', '.nojekyll', 'README.md', 'SETUP.md',
  'index.html', 'reference.html', 'assets', 'docs', 'synced-configs',
  'tools', 'tests', 'PUBBLICA-WIP.cmd', 'Publish-Wip.ps1'
];
const sleepDefault = ms => new Promise(resolve => setTimeout(resolve, ms));
function systemRun(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.interactive ? 'inherit' : 'pipe',
    shell: false,
    env: { ...process.env, GH_HOST: 'github.com', GH_PAGER: 'cat' }
  });
  return { status: result.status ?? 1, stdout: result.stdout || '', stderr: result.error?.message || result.stderr || '' };
}
function verifyPublicTree(file) {
  const stat = fs.lstatSync(file);
  if (stat.isSymbolicLink()) throw new Error('Refusing symbolic link in publication: ' + file);
  const name = path.basename(file);
  if (name.startsWith('.env') || ['.git', '.sync', 'node_modules'].includes(name) || /\.(?:pem|key|pfx|p12)$/i.test(name)) {
    throw new Error('Private/forbidden file in publication: ' + file);
  }
  if (stat.isDirectory()) for (const entry of fs.readdirSync(file)) verifyPublicTree(path.join(file, entry));
  else if (!stat.isFile()) throw new Error('Unsupported file: ' + file);
  else if (!/\.(?:png|jpe?g|webp|ico|gif)$/i.test(name)) {
    const text = fs.readFileSync(file, 'utf8');
    // A defensive check, not a replacement for the owner's review of public content.
    if (/gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) {
      throw new Error('Possible credential found; publication stopped: ' + file);
    }
  }
}
function isTargetRemote(value) {
  return ['https://github.com/' + TARGET, 'https://github.com/' + TARGET + '.git', 'git@github.com:' + TARGET + '.git']
    .some(url => value.trim().toLowerCase() === url.toLowerCase());
}

/** Validate and publish a fresh WIP checkout, then verify its requested Pages deployment. */
export async function publish(root, options = {}) {
  root = path.resolve(root);
  const run = options.run || systemRun;
  const log = options.log || console.log;
  const sleep = options.sleep || sleepDefault;
  const command = (cmd, args, extra = {}) => {
    const result = run(cmd, args, { cwd: root, ...extra });
    if (result.status !== 0) throw new Error(`${cmd} failed (${result.status}): ${result.stderr || result.stdout || args.join(' ')}`);
    return result.stdout.trim();
  };
  const api = (endpoint, args = []) => command('gh', ['api', endpoint, ...args]);
  const query = endpoint => {
    const r = run('gh', ['api', endpoint], { cwd: root });
    if (r.status === 0) return JSON.parse(r.stdout);
    if (/\bHTTP 404\b/.test(r.stderr)) return null;
    throw new Error(`GitHub read failed: ${r.stderr || r.stdout}`);
  };
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Install Node.js 22 or later first.');
  for (const entry of PUBLIC_ENTRIES) {
    const file = path.join(root, entry);
    if (!fs.existsSync(file)) throw new Error('Extract the whole package first. Missing: ' + entry);
    verifyPublicTree(file);
  }
  command('git', ['--version']);
  command('gh', ['--version']);
  log('Checking the local website before any remote changes...');
  command(process.execPath, ['tools/build-config-bundle.mjs', '.'], { interactive: true });
  command(process.execPath, ['tools/build-docs-bundle.mjs', '.'], { interactive: true });
  command(process.execPath, ['tests/validate-theme.mjs'], { interactive: true });
  command(process.execPath, ['--test'], { interactive: true });

  if (run('gh', ['auth', 'status', '--hostname', 'github.com'], { cwd: root }).status !== 0) {
    log('Complete GitHub login in your browser; use the IceWolf23X account.');
    command('gh', ['auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web', '--scopes', 'repo,workflow'], { interactive: true });
  }
  const profile = JSON.parse(api('user'));
  if (profile.login?.toLowerCase() !== OWNER.toLowerCase()) {
    throw new Error(`Wrong active GitHub account (${profile.login}). Select IceWolf23X using gh auth switch --user IceWolf23X.`);
  }
  const statePath = path.join(root, '.wip-publish-state.json');
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null;
  if (state && state.target !== TARGET) throw new Error('Local publication state belongs to a different target.');
  let remote = query('repos/' + TARGET);
  if (remote && !state?.remoteCreated) {
    throw new Error(`${TARGET} already exists. No files were uploaded. The script refuses to overwrite a pre-existing repository.`);
  }
  if (remote && (remote.private || remote.full_name?.toLowerCase() !== TARGET.toLowerCase())) {
    throw new Error('Existing repository is private or does not match the intended public target.');
  }
  const gitPath = path.join(root, '.git');
  if (fs.existsSync(gitPath) && !state?.initializedHere) {
    throw new Error('This folder is already a Git checkout. Extract into a NEW folder to avoid publishing unrelated history.');
  }
  const savedState = { target: TARGET, initializedHere: true, remoteCreated: Boolean(state?.remoteCreated) };
  fs.writeFileSync(statePath, JSON.stringify(savedState, null, 2) + '\n');
  if (!fs.existsSync(gitPath)) command('git', ['init', '--initial-branch=main', '.']);
  else {
    const branch = command('git', ['branch', '--show-current']);
    if (branch !== 'main') throw new Error('Resume only from the main branch. No remote changes were made.');
    const origin = run('git', ['remote', 'get-url', 'origin'], { cwd: root });
    if (origin.status === 0 && !isTargetRemote(origin.stdout)) throw new Error('Origin points to another repository.');
  }
  command('git', ['config', 'user.name', OWNER]);
  command('git', ['config', 'user.email', `${profile.id}+${OWNER}@users.noreply.github.com`]);
  // Only the known site folders are staged, never the entire parent directory.
  command('git', ['add', '--', ...PUBLIC_ENTRIES]);
  const staged = command('git', ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean);
  for (const file of staged) if (!PUBLIC_ENTRIES.includes(file.split('/')[0])) throw new Error('Unexpected staged file: ' + file);
  if (staged.length) command('git', ['commit', '-m', 'site: prepare public CoreChatX WIP website with GitHub Pages']);

  if (!remote) {
    log('Creating the NEW PUBLIC repository ' + TARGET + '...');
    command('gh', ['repo', 'create', TARGET, '--public', '--disable-wiki', '--description', 'CoreChatX website WIP - landing, documentation and versioned GitHub downloads', '--source', root, '--remote', 'origin']);
    savedState.remoteCreated = true;
    fs.writeFileSync(statePath, JSON.stringify(savedState, null, 2) + '\n');
    remote = query('repos/' + TARGET);
    if (!remote || remote.private) throw new Error('Repository creation could not be verified as public.');
  } else if (run('git', ['remote', 'get-url', 'origin'], { cwd: root }).status !== 0) {
    command('git', ['remote', 'add', 'origin', 'https://github.com/' + TARGET + '.git']);
  }
  log('Uploading the website (no force-push)...');
  // Use gh for this operation without modifying global Git credential configuration.
  command('git', ['-c', 'credential.helper=', '-c', 'credential.https://github.com.helper=', '-c', 'credential.https://github.com.helper=!gh auth git-credential', 'push', '--set-upstream', 'origin', 'main'], { interactive: false });
  api('repos/' + TARGET, ['--method', 'PATCH', '-f', 'default_branch=main']);

  const pages = query('repos/' + TARGET + '/pages');
  api('repos/' + TARGET + '/pages', ['--method', pages ? 'PUT' : 'POST', '-f', 'build_type=workflow']);
  api('repos/' + TARGET + '/pages', ['--method', 'PUT', '-F', 'https_enforced=true']);
  const pageInfo = query('repos/' + TARGET + '/pages');
  if (!pageInfo || pageInfo.build_type !== 'workflow' || !pageInfo.https_enforced) throw new Error('Pages settings were not verified.');
  api('repos/' + TARGET, ['--method', 'PATCH', '-f', 'homepage=' + pageInfo.html_url]);
  // This gate prevents the first push from trying to deploy before Pages is enabled.
  command('gh', ['variable', 'set', 'COREX_PAGES_ENABLED', '--repo', TARGET, '--body', 'true']);
  const requestId = 'first-publish-' + randomUUID();
  command('gh', ['workflow', 'run', 'deploy-pages.yml', '--repo', TARGET, '--ref', 'main', '-f', 'request_id=' + requestId]);
  log('Pages is configured. Waiting for the requested deployment to finish...');
  let selectedRun = null;
  for (let attempt = 0; attempt < 90; attempt++) {
    const runs = JSON.parse(command('gh', ['run', 'list', '--repo', TARGET, '--workflow', 'deploy-pages.yml', '--event', 'workflow_dispatch', '--branch', 'main', '--limit', '30', '--json', 'databaseId,displayTitle,status,conclusion,url']));
    selectedRun = runs.find(item => item.displayTitle?.includes(requestId));
    if (selectedRun?.status === 'completed') {
      if (selectedRun.conclusion !== 'success') throw new Error(`Pages deployment ended with ${selectedRun.conclusion}: ${selectedRun.url}`);
      break;
    }
    await sleep(10000);
  }
  if (selectedRun?.status !== 'completed') throw new Error(`Timed out waiting for deployment. Check https://github.com/${TARGET}/actions`);
  // Success is based on the actual Actions conclusion, not on dispatch acceptance.
  savedState.deploymentRunId = selectedRun.databaseId;
  savedState.pagesUrl = pageInfo.html_url;
  fs.writeFileSync(statePath, JSON.stringify(savedState, null, 2) + '\n');
  return { repository: TARGET, repositoryUrl: 'https://github.com/' + TARGET, pagesUrl: pageInfo.html_url, runId: selectedRun.databaseId, runUrl: selectedRun.url };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  try {
    const result = await publish(root);
    console.log('\nDeployment succeeded.\nRepository: ' + result.repositoryUrl + '\nWebsite: ' + result.pagesUrl + '\nRun: ' + result.runUrl);
    console.log('Private-plugin future sync remains optional: see docs/DEPLOY_WIP.md. Current defaults are already included.');
  } catch (error) {
    console.error('\nPublication stopped: ' + error.message);
    console.error('No force-push or repository deletion was attempted. Read docs/DEPLOY_WIP.md before retrying.');
    console.error('For an existing gh login missing workflow permissions: gh auth refresh --hostname github.com --scopes repo,workflow');
    process.exitCode = 1;
  }
}
