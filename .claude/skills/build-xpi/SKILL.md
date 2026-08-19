---
name: build-xpi
description: Build 白い熊 Yomitan (the Firefox add-on) into a .xpi in ~/tmp — unsigned for iterating, or AMO-signed with --sign at release. Handles the Node 24 toolchain, the version stamping (upstream base plus our build counter, encoded into the last component), the build counter bump, and the AMO credential handling. Use after any code change in this repo, or when 白い熊 says /build-xpi, "build it", "build the extension", "make an xpi", or asks for a signed build to publish.
---

# Build 白い熊 Yomitan

Produces a package in `~/tmp/`. **The name says whether it is signed**: a signed build is
`shiroikuma-kako-yomitan_<version>.xpi`, an unsigned one
`shiroikuma-kako-yomitan_<version>-unsigned.xpi`. The plain name therefore always means
"signed, installs anywhere", and the two can never overwrite each other. Read `CLAUDE.md` for the fork model and the
versioning rules; this skill is the mechanics.

> **`~/git` is outside the sandbox's write allowlist** — every command here needs
> `dangerouslyDisableSandbox: true`.

## Toolchain

Upstream needs **Node ≥ 22**, and `web-ext` is installed under nvm's Node 24. The system `node` is 18,
so select 24 first — in _every_ shell, since shell state does not persist between calls:

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24
```

`npm ci` after a fresh clone, after `/upstream-new-version`, or whenever `package-lock.json` moved.

## Iterating — build unsigned

```bash
cd ~/git/shiroikuma-kako-yomitan
npm run test:fast                # eslint + tsc + unit tests
node tools/build-fork.mjs
```

That runs upstream's `dev/bin/build.js --target firefox` with our computed version, unpacks the
resulting zip into `builds/firefox-unpacked/`, checks the built manifest really carries our version
and our add-on ID, packages it with `web-ext build`, copies the result to
`~/tmp/shiroikuma-kako-yomitan_<version>-unsigned.xpi`, and **bumps `BUILD_NUMBER`** in
`fork.properties`.

**Do not sign while iterating.** 白い熊 火狐 desktop is built with `MOZ_REQUIRE_SIGNING` unset and
installs unsigned builds directly; loading `builds/firefox-unpacked/` through `about:debugging` is
faster still. Every signing run is an AMO round-trip and burns a version number AMO will never accept
again.

## Releasing — build signed

```bash
node tools/build-fork.mjs --sign
```

`web-ext sign --channel=unlisted`: Mozilla signs the `.xpi` and it installs in **any** Firefox,
including stock release builds, without being published or reviewed on AMO.

- Credentials come from the gitignored `amo.properties` (`AMO_JWT_ISSUER` / `AMO_JWT_SECRET`), passed
  through the environment so they never reach a log or a process listing. **Never echo them.**
- They are **per AMO account, shared by every extension fork**. Master record:
  `~/〇/[666] 私資料/[666][27] 暗号/firefox-amo-api-keys.org`. **Never generate a new pair** — it
  invalidates the existing one for every other extension at once.
- Our add-on ID `yomitan@shiroikuma` is recorded in that file's "Extension IDs we own" table.
- **AMO rejects a version it has already seen**, so never re-sign the same number. The counter bump is
  automatic; just never reset it by hand outside `/upstream-new-version`.

The signed build lands as `~/tmp/shiroikuma-kako-yomitan_<version>.xpi` — no suffix, because
only a signed artefact ever carries the plain name.

Then hand off to `/publish-version`: tag `<version>` (no leading `v`), attach the signed `.xpi`,
refresh the README, and merge the changelog.

## Version stamping — how it works

Upstream's version is already four components (`26.7.29.0` = `YY.M.D.P`) and Firefox allows no fifth,
so the last component carries both counters: `YY.M.D.(P × 100 + N)`, where `N` is our build number.
`26.7.29.1` is our build 1 on upstream `26.7.29.0`; `26.7.29.103` would be our build 3 on upstream
`26.7.29.1`.

- `UPSTREAM_BASE` and `BUILD_NUMBER` live in `fork.properties`; nothing else states a version.
- `N` must stay below 100 — the script aborts rather than emit a version that lies about its base.
- `build-fork.mjs` cross-checks the built manifest against what it expected and aborts on a mismatch.

## Delivery

The `.xpi` goes to `~/tmp/`. 白い熊 火狐 installs it directly on the desktop, and on Android through
its install-from-file support — this fork does not depend on AMO listing or a custom collection.

**Only a signed `.xpi` is delivered to the phone.** An unsigned build stays on the PC, where 白い熊
火狐 installs it without a signature; it is never pushed over adb or scp. Iterate unsigned here, sign
at release, deliver the signed artefact. (Global rule: `~/.claude/CLAUDE.md`.)

## If the build breaks

- `Node <n> is too old` — the nvm line above was not run in _this_ shell.
- `manifest says X but this build is Y` — `fork.properties` and the build disagree; check the manifest
  patch survived the last rebase.
- `the built manifest does not carry our add-on ID` — the rebase dropped the identity commit.
- `web-ext produced nothing` — upstream's build failed earlier in the log; read up.

---

**No Claude attribution** in commits, PRs, README, changelog or release notes.
