#!/usr/bin/env node
/**
 * 白い熊 Yomitan — fetch an already-uploaded signed .xpi from AMO.
 *
 *   node tools/fetch-signed.mjs [version]      default: the version in fork.properties
 *
 * `web-ext sign` uploads the package and then waits for AMO to approve it. When approval
 * outruns that wait, the command fails even though the upload succeeded — and the version
 * number is spent, because AMO never accepts one twice. This fetches the signed file for a
 * version that is already up there, so a slow approval costs a wait rather than a version.
 *
 * Credentials come from the gitignored amo.properties and are used to mint a short-lived JWT,
 * exactly as web-ext does. Nothing is printed that could leak them.
 */

import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {fileURLToPath} from 'url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GUID = 'yomitan@shiroikuma';
const API = 'https://addons.mozilla.org/api/v5';

const die = (msg) => {
    console.error('\n' + msg + '\n');
    process.exit(1);
};

const props = fs.readFileSync(path.join(ROOT, 'fork.properties'), 'utf8');
const base = props.match(/^UPSTREAM_BASE\s*=\s*(\S+)\s*$/m)?.[1] ?? '';
const build = Number(props.match(/^BUILD_NUMBER\s*=\s*(\d+)\s*$/m)?.[1]);
const [yy, mm, dd, upstreamCounter] = base.split('.');
const fallback = `${yy}.${mm}.${dd}.${Number(upstreamCounter) * 100 + build}`;
const version = process.argv[2] ?? fallback;

const amoPath = path.join(ROOT, 'amo.properties');
if (!fs.existsSync(amoPath)) { die('amo.properties is missing.'); }
const cfg = Object.fromEntries(fs.readFileSync(amoPath, 'utf8')
    .split('\n').filter((l) => l && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

/** @returns {string} a JWT valid for five minutes, the shape AMO's API expects */
function token() {
    const issuedAt = Math.floor(Date.now() / 1000);
    const head = b64({alg: 'HS256', typ: 'JWT'});
    const body = b64({iss: cfg.AMO_JWT_ISSUER, jti: crypto.randomUUID(), iat: issuedAt, exp: issuedAt + 300});
    const sig = crypto.createHmac('sha256', cfg.AMO_JWT_SECRET).update(`${head}.${body}`).digest('base64url');
    return `${head}.${body}.${sig}`;
}

const get = async (url) => {
    const response = await fetch(url, {headers: {Authorization: `JWT ${token()}`}});
    if (!response.ok) {
        const body = await response.text();
        die(`${url} -> HTTP ${response.status} ${response.statusText}\n${body.slice(0, 500)}`);
    }
    return response;
};

const versions = await (await get(`${API}/addons/addon/${encodeURIComponent(GUID)}/versions/?filter=all_with_unlisted`)).json();
const match = versions.results.find((v) => v.version === version);
if (!match) {
    die(`AMO has no version ${version} for ${GUID}. Uploaded versions: ` +
        versions.results.map((v) => v.version).join(', '));
}

const file = match.file;
if (!file || file.status !== 'public') {
    die(`version ${version} is not approved yet (status: ${file ? file.status : 'none'}).\n` +
        'Approval of an unlisted upload usually takes a few minutes; run this again shortly.');
}

const data = Buffer.from(await (await get(file.url)).arrayBuffer());
const out = path.join(os.homedir(), 'tmp', `shiroikuma-kako-yomitan_${version}-signed.xpi`);
fs.writeFileSync(out, data);

// A signed package carries Mozilla's signature block; an unsigned one does not.
const signed = data.includes(Buffer.from('META-INF/mozilla.rsa'));
console.log(`\n${signed ? 'SIGNED' : 'UNSIGNED (!)'} build downloaded:\n  ${out}\n  ${data.length} bytes\n`);
if (!signed) { process.exit(1); }
