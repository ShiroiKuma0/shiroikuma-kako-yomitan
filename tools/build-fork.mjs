#!/usr/bin/env node
/**
 * 白い熊 Yomitan — build the fork's Firefox add-on.
 *
 *   node tools/build-fork.mjs            unsigned build, for iterating
 *   node tools/build-fork.mjs --sign     upload to AMO and fetch the signed .xpi (release only)
 *
 * The package lands in ~/tmp. A signed build is named `shiroikuma-kako-yomitan_<version>.xpi`
 * and an unsigned one `shiroikuma-kako-yomitan_<version>-unsigned.xpi`, so the plain name always
 * means "signed, installable anywhere" and neither can overwrite the other. BUILD_NUMBER in
 * fork.properties is bumped afterwards so the next build gets a fresh version.
 *
 * Do NOT sign while iterating: 白い熊 火狐 is built with MOZ_REQUIRE_SIGNING unset and installs
 * unsigned builds directly, whereas every signing run is an AMO round-trip and burns a version
 * number that AMO will never accept again.
 */

import {execFileSync} from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {fileURLToPath} from 'url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BUILDS = path.join(ROOT, 'builds');
const STAGE = path.join(BUILDS, 'firefox-unpacked');
const ARTIFACTS = path.join(ROOT, 'web-ext-artifacts');
const OUT_DIR = path.join(os.homedir(), 'tmp');
const PROPS = path.join(ROOT, 'fork.properties');
const SIGN = process.argv.includes('--sign');

const die = (msg) => {
    console.error('\n' + msg + '\n');
    process.exit(1);
};

if (Number(process.versions.node.split('.')[0]) < 22) {
    die(`Node ${process.versions.node} is too old — upstream needs >= 22.\n` +
        'Run:  . ~/.nvm/nvm.sh && nvm use 24');
}

const props = fs.readFileSync(PROPS, 'utf8');
const base = props.match(/^UPSTREAM_BASE\s*=\s*(\S+)\s*$/m)?.[1];
const build = Number(props.match(/^BUILD_NUMBER\s*=\s*(\d+)\s*$/m)?.[1]);
if (typeof base !== 'string' || !/^\d+\.\d+\.\d+\.\d+$/.test(base)) {
    die('fork.properties: UPSTREAM_BASE must be an upstream release tag, e.g. 26.7.29.0');
}
if (!Number.isInteger(build) || build < 1) {
    die('fork.properties: BUILD_NUMBER must be a positive integer');
}
if (build > 99) {
    die('fork.properties: BUILD_NUMBER is 100 or more, which collides with upstream\'s own\n' +
        'counter in the last version component. Rebase onto a newer upstream release and let\n' +
        '/upstream-new-version reset it, rather than emitting a version that lies about its base.');
}

// Upstream's version is YY.M.D.P and Firefox allows no fifth component, so the last one
// carries both counters: theirs and ours. See fork.properties.
const [yy, mm, dd, upstreamCounter] = base.split('.');
const version = `${yy}.${mm}.${dd}.${Number(upstreamCounter) * 100 + build}`;

const run = (cmd, args, opts) => execFileSync(cmd, args, {cwd: ROOT, stdio: 'inherit', ...opts});

console.log(`\n=== 白い熊 Yomitan ${version}  (upstream ${base}, build ${build}) ===\n`);

// Upstream's build script emits a .zip; web-ext wants a directory, so unpack it into builds/.
fs.rmSync(STAGE, {recursive: true, force: true});
run('node', ['dev/bin/build.js', '--target', 'firefox', '--version', version]);
const zip = path.join(BUILDS, 'yomitan-firefox.zip');
if (!fs.existsSync(zip)) { die(`upstream's build produced no ${zip}`); }
fs.mkdirSync(STAGE, {recursive: true});
run('unzip', ['-q', zip, '-d', STAGE]);

const built = JSON.parse(fs.readFileSync(path.join(STAGE, 'manifest.json'), 'utf8'));
if (built.version !== version) {
    die(`manifest says ${built.version} but this build is ${version}.`);
}
if (built.browser_specific_settings?.gecko?.id !== 'yomitan@shiroikuma') {
    die('the built manifest does not carry our add-on ID — did a rebase drop the manifest patch?');
}

fs.rmSync(ARTIFACTS, {recursive: true, force: true});
let packaged;

if (SIGN) {
    const amo = path.join(ROOT, 'amo.properties');
    if (!fs.existsSync(amo)) {
        die('amo.properties is missing. Copy AMO_JWT_ISSUER / AMO_JWT_SECRET into it from\n' +
            '~/〇/[666] 私資料/[666][27] 暗号/firefox-amo-api-keys.org — never generate a new pair.');
    }
    const cfg = Object.fromEntries(fs.readFileSync(amo, 'utf8')
        .split('\n').filter((l) => l && !l.startsWith('#'))
        .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
    // Credentials go through the environment, never argv, so they reach neither a log nor a
    // process listing.
    run('web-ext', [
        'sign', '--channel=unlisted', `--source-dir=${STAGE}`, `--artifacts-dir=${ARTIFACTS}`,
        // AMO approves an unlisted upload in its own time and web-ext gives up after a few
        // minutes by default — at which point the version number is spent even though the
        // upload succeeded. Wait half an hour instead; tools/fetch-signed.mjs picks up the
        // pieces if even that is not enough.
        '--approval-timeout=1800000',
    ], {
        env: {
            ...process.env,
            WEB_EXT_API_KEY: cfg.AMO_JWT_ISSUER,
            WEB_EXT_API_SECRET: cfg.AMO_JWT_SECRET,
        },
    });
    packaged = fs.readdirSync(ARTIFACTS).find((f) => f.endsWith('.xpi'));
} else {
    run('web-ext', [
        'build', `--source-dir=${STAGE}`, `--artifacts-dir=${ARTIFACTS}`, '--overwrite-dest',
    ]);
    packaged = fs.readdirSync(ARTIFACTS).find((f) => f.endsWith('.zip') || f.endsWith('.xpi'));
}
if (!packaged) { die(`web-ext produced nothing in ${ARTIFACTS}`); }

fs.mkdirSync(OUT_DIR, {recursive: true});
const out = path.join(OUT_DIR, `shiroikuma-kako-yomitan_${version}${SIGN ? '' : '-unsigned'}.xpi`);
fs.copyFileSync(path.join(ARTIFACTS, packaged), out);

fs.writeFileSync(PROPS, props.replace(/^BUILD_NUMBER\s*=\s*\d+\s*$/m, `BUILD_NUMBER=${build + 1}`));

console.log(`\n${SIGN ? 'SIGNED' : 'unsigned'} build ready:\n  ${out}\n` +
            `fork.properties bumped to BUILD_NUMBER=${build + 1}\n`);
