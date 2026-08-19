---
name: upstream-new-version
description: Bring 白い熊 Yomitan onto a NEW upstream Yomitan release (yomidevs/yomitan) and rebuild. Checks upstream for a newer release tag, ALWAYS presents a proceed-gated tabular description of what the new upstream version introduces BEFORE any fast-forwarding or rebasing, then — only after 白い熊 says proceed — fast-forwards the `master` mirror, rebases our `custom` stack onto the new release tag, updates the base and resets the build counter, folds upstream's release notes into CHANGELOG.md, verifies every customization survived, and builds the new .1. Use when 白い熊 runs /upstream-new-version, says a new Yomitan/upstream version is out, or asks to update/sync/bump the fork to upstream, rebase onto upstream, or rebase-and-rebuild the fork.
---

# Sync 白い熊 Yomitan onto a new upstream Yomitan release

Upstream is [yomidevs/yomitan](https://github.com/yomidevs/yomitan), the `upstream` remote (fetch only
— its push URL is deliberately `DISABLED_upstream_is_fetch_only`). Read `CLAUDE.md` first; this skill
assumes its fork model, the three-senses-of-"Yomitan" table, and the versioning rules.

> **Never `git push` unprompted.** The rebase and the build are this skill's job; **landing and
> pushing are not**. Stop after the build and wait for 白い熊 to test and say **"Push"**. Because the
> rebase rewrites `custom`, publishing it is `git push --force-with-lease origin custom`; `master` is
> a plain fast-forward.
>
> **`~/git` is outside the sandbox's write allowlist** — every git, build and write command here needs
> `dangerouslyDisableSandbox: true`.

## 1. Preflight

```bash
cd ~/git/shiroikuma-kako-yomitan
git status --porcelain          # must be empty — never reset --hard over uncommitted work
git branch --show-current       # note it; end back on custom
git fetch upstream --tags
git fetch origin
```

`amo.properties`, `node_modules/`, `builds/`, `web-ext-artifacts/` and `.scratch/` are gitignored, so
a clean tree means clean.

## 2. Detect the new release

Upstream tags releases on `master` as calver `YY.M.D.counter` — **no `v` prefix** (`26.7.29.0`). Take
upstream's version from upstream's own refs:

```bash
gh release view -R yomidevs/yomitan --json tagName,publishedAt,body
git tag --sort=-v:refname | head -5
```

**Our current base is `UPSTREAM_BASE` in `fork.properties`** — never a bare `git tag` listing, and
never `package.json`, whose version is a literal `0.0.0`; upstream's version exists only as a tag. If
the newest upstream tag is not newer than our base, report "already on the latest upstream release
(`<tag>`), nothing to do" and **stop**. Syncing is not a scheduled chore.

## 3. ⛔ GATE — describe what the new version brings, then wait

**This gate is mandatory and comes before any branch is touched.** Never fast-forward, rebase or build
before 白い熊 has said proceed.

Gather the substance from upstream itself — the release notes of **every** release between our base
and the new one, not just the newest, plus the commit range when the notes are thin:

```bash
gh release list -R yomidevs/yomitan -L 20                          # every release since our base
gh release view <tag> -R yomidevs/yomitan --json body -q .body     # for each one
git log --oneline <OLD>..<NEW>
```

Then present a **table**, one row per user-visible change, newest release first:

| Release   | Change                                                       | What it means for us                                    |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| 26.8.20.0 | _(concrete feature, named — never "various improvements")_    | _(does it touch anything we patch? any conflict expected?)_ |

Follow the table with:

- old base `<OLD>` → new release `<NEW>` and its date;
- **the stack size, captured now**: `OLD_COUNT=$(git rev-list --count <OLD>..custom)` — step 7 compares
  against it to prove no commit was silently dropped;
- anything in the range that touches our customization sites — `dev/data/manifest-variants.json`,
  `ext/images/`, `ext/js/background/backend.js` (`_updateBadge`), `ext/info.html`, `ext/support.html`,
  `ext/settings.html`, `ext/welcome.html`, `ext/quick-start-guide.html`, `ext/templates-modals.html`,
  `ext/js/core/log.js` — those are where conflicts will land;
- **whether upstream added new user-visible "Yomitan" strings or new links**, which the branding pass
  must then cover;
- the plan: FF `master`, back up `custom`, rebase onto `<NEW>`, update the base, reset the counter,
  rebuild.

Ask for the go-ahead with `AskUserQuestion`. Proceed only on a clear yes.

## 4. Fast-forward the mirror and back up the stack

```bash
git checkout master && git merge --ff-only upstream/master
git branch custom-pre-<NEW> custom      # e.g. custom-pre-26.8.20.0
```

If `master` cannot fast-forward, upstream rewrote history — **stop and discuss**.

## 5. Rebase `custom` onto the new release

```bash
git checkout custom
git rebase --onto <NEW> <OLD> custom
```

Conflict-prone files, in order of likelihood: `ext/settings.html` (the largest branding surface),
`dev/data/manifest-variants.json`, `ext/js/background/backend.js`, `ext/welcome.html`.

- **Small** conflicts (context drift, an obvious re-application of a known edit) → resolve inline and
  `git rebase --continue`.
- **Significant** conflicts (upstream refactored, renamed or deleted a file we patch; the shape of an
  edit site changed; many commits conflict) → **stop, do not improvise.** Bring 白い熊 a concrete plan
  via `AskUserQuestion` (resolve together / re-implement on the new base / defer) and act on their
  choice. `git rebase --abort` restores `custom`; `master` stays fast-forwarded, which is harmless.

## 6. Update the base and reset the build counter

`fork.properties` → `UPSTREAM_BASE=<NEW>` and `BUILD_NUMBER=1`, so the first build on the new upstream
line reads `<NEW's date>.<P×100 + 1>`.

Never hand-edit a version anywhere else: `package.json` stays `0.0.0`, `ext/manifest.json` is
generated and gitignored, and `tools/build-fork.mjs` computes the version from `fork.properties`.

## 7. Verify our customizations survived

| What                     | Expected                                             | Where                                              |
| ------------------------ | ---------------------------------------------------- | -------------------------------------------------- |
| Add-on ID                | `yomitan@shiroikuma`, dev `yomitan-dev@shiroikuma`    | `dev/data/manifest-variants.json`                   |
| No dev `update_url`      | absent                                               | same file                                           |
| Name / tooltip / homepage | 白い熊 Yomitan, our repo                              | same file                                           |
| Disabled-state icon      | `_setActionIcon` present and called from `_updateBadge` | `ext/js/background/backend.js`                   |
| Icon                     | ours, 14 assets — `python3 graphics/make-icons.py` must produce no diff | `ext/images/`                     |
| Identity links           | no `yomitan.wiki`, no `github.com/yomidevs/yomitan` outside the allowed sibling projects | `grep -rn 'yomitan\.wiki\|yomidevs/yomitan[/"]' ext` |
| Interoperability names   | `Yomitan API`, `Yomitan dictionary`, `.yomitan-glossary`, `yomitan_mecab`, `yomitan_api` untouched | see CLAUDE.md |

Also confirm nothing was dropped: `git rev-list --count <NEW>..custom` equals `OLD_COUNT` from step 3,
and skim `git log --oneline <NEW>..custom`.

Then re-check the three senses of "Yomitan": if upstream added a new user-visible product string,
rename it; if it added an API or format mention, leave it.

## 8. Fold the upstream release notes into CHANGELOG.md

Upstream ships **no `CHANGELOG.md`**; its notes live only on GitHub Releases. Ours is the whole file.
Add our entry for the new build at the top, and beneath it the upstream notes for every release
between the old base and the new one, newest first. See `/publish-version` for the exact shape.

## 9. Build

```bash
. ~/.nvm/nvm.sh && nvm use 24
npm ci                          # upstream bumps dependencies often — do this every sync
npm run test:fast               # eslint + tsc + unit tests must pass
node tools/build-fork.mjs       # -> ~/tmp/shiroikuma-kako-yomitan_<newver>.xpi
```

**Unsigned.** Signing is a release step (`--sign`), not a sync step — see the `build-xpi` skill.

## 10. Stop

Report what landed, hand over the `.xpi` path, and let 白い熊 test. Commit and push only on their
explicit **"Push"**.

---

**Commit convention — no Claude attribution.** Never add a `Co-Authored-By: Claude …` trailer nor a
"Generated with Claude Code" line to commits or PR bodies. End the message at the last line of the
body. (Global rule: `~/.claude/CLAUDE.md`.)
