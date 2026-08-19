#!/usr/bin/env node
/**
 * 白い熊 Yomitan — what AMO has, and which of it is signed.
 *
 *   node tools/amo-status.mjs
 *
 * Every version we ever uploaded, newest first, with the only field that answers "is this one
 * signed?": the file's status.
 *
 *   public      approved and SIGNED — downloadable, and what a release attaches
 *   unreviewed  uploaded, validated, still waiting for Mozilla to approve and sign it
 *   disabled    rejected or taken down
 *
 * Signing is the output of AMO's review pipeline, so "approved" and "signed" are the same
 * event; there is no state where a version is signed but not yet approved.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GUID = 'yomitan@shiroikuma';
const HUB = 'https://addons.mozilla.org/en-US/developers/addon/7b4c8c9158274ea6bd45/versions';

const amo = path.join(ROOT, 'amo.properties');
if (!fs.existsSync(amo)) {
    console.error('amo.properties is missing.');
    process.exit(1);
}
const cfg = Object.fromEntries(fs.readFileSync(amo, 'utf8')
    .split('\n').filter((l) => l && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const issuedAt = Math.floor(Date.now() / 1000);
const head = b64({alg: 'HS256', typ: 'JWT'});
const body = b64({iss: cfg.AMO_JWT_ISSUER, jti: crypto.randomUUID(), iat: issuedAt, exp: issuedAt + 300});
const sig = crypto.createHmac('sha256', cfg.AMO_JWT_SECRET).update(`${head}.${body}`).digest('base64url');

const response = await fetch(
    `https://addons.mozilla.org/api/v5/addons/addon/${encodeURIComponent(GUID)}/versions/?filter=all_with_unlisted`,
    {headers: {Authorization: `JWT ${head}.${body}.${sig}`}},
);
if (!response.ok) {
    console.error(`AMO -> HTTP ${response.status} ${response.statusText}`);
    process.exit(1);
}
const {results} = await response.json();

console.log(`\n${GUID}\n`);
for (const v of results) {
    const status = v.file ? v.file.status : 'none';
    const mark = status === 'public' ? 'SIGNED  ' : '        ';
    console.log(`  ${mark}${v.version.padEnd(12)} ${status.padEnd(11)} ${v.reviewed ? 'approved ' + v.reviewed : ''}`);
}
const signed = results.filter((v) => v.file && v.file.status === 'public');
console.log(`\n${signed.length} of ${results.length} signed.` +
    (signed.length ? `  Newest signed: ${signed[0].version} — fetch with:\n  node tools/fetch-signed.mjs ${signed[0].version}` : '') +
    `\n\nDeveloper hub: ${HUB}\n`);
