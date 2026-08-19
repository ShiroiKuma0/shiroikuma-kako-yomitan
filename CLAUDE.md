# CLAUDE.md — 白い熊 Yomitan (`yomitan@shiroikuma`)

Guidance for Claude Code in this repository. It captures the fork's facts so a fresh session can pick
up where the last one left off. For **syncing to a new upstream release**, the authoritative procedure
is `.claude/skills/upstream-new-version`; for **building and signing**, `.claude/skills/build-xpi`.

## Project

**白い熊 Yomitan** — 白い熊's fork of [Yomitan](https://github.com/yomidevs/yomitan), the pop-up
dictionary that succeeded Yomichan, for **白い熊 火狐** (`~/git/shiroikuma-kako`) on desktop and
Android. A WebExtension: manifest v3 everywhere, with upstream's Firefox variant swapping the service
worker for a background page. We ship the **firefox** target only.

## Fork model

| Ref          | Role                                                                                                                         | Update mode                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `origin`     | `git@github.com:ShiroiKuma0/shiroikuma-kako-yomitan.git` — our fork, push here                                               | `git push` (only on 白い熊's explicit go-ahead) |
| `upstream`   | `https://github.com/yomidevs/yomitan.git` — read-only; its push URL is deliberately set to `DISABLED_upstream_is_fetch_only` | `git fetch upstream`                            |
| `master`     | pure mirror of `upstream/master`. **Fast-forward only — never develop here, never carry our work**                           | `git merge --ff-only upstream/master`           |
| **`custom`** | **all fork work**, a small stack rebased onto each upstream **release tag**. This is the working branch                      | `git rebase --onto <newtag> <oldtag> custom`    |

`custom` sits on upstream **release tags** (`26.7.29.0`, …), not on `master`'s tip: upstream tags
roughly monthly and a release is a stable base. `master` still mirrors the tip so a sync can see what
has landed. Upstream tags are calver `YY.M.D.counter` and carry no `v` prefix.

## ⚠ "Yomitan" is three different words — only one is ours to rename

A blind rename breaks the user's own data. This is the single most dangerous thing in the tree.

| Sense                      | Where                                                                                                                                                                                                                                                                                                                                                                                                 | Rule                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **The product**            | manifest `name` / `default_title`, page titles and headings, prose in `ext/*.html`, the `Lookup in …` context-menu entry, log lines                                                                                                                                                                                                                                                                   | **ours to rename**                                                     |
| **Interoperability names** | the **Yomitan API** (`ext/js/comm/yomitan-api.js`, the `enableYomitanApi` setting, the `yomidevs/yomitan-api` component the user installs), the **Yomitan dictionary format** third parties publish in, `minimumYomitanVersion` in dictionary indexes                                                                                                                                                 | **never touch** — they name someone else's artefact                    |
| **Internal identifiers**   | `.yomitan-glossary` (already-mined Anki cards carry it in their CSS), `yomitan-popup` and the popup stylesheet ids, the `yomitan_mecab` and `yomitan_api` native-messaging hosts, `general.yomitanApiServer`, the `yomitan-settings-*` / `yomitan-dictionaries-*` export filenames, `yomitan_dictionary_media` and `yomitan_audio` Anki media prefixes, JSON-schema `$id`s under `yomidevs.github.io` | **never touch** — renaming breaks stored data and installed components |

Also left alone on purpose: the GPL copyright line in `ext/legal.html` (our line is **added** above
upstream's, never substituted), the `yomidevs/yomitan-api`, `yomidevs/yomitan-mecab-installer`,
`yomidevs/yomichan-data-exporter` and `yomidevs.github.io/wiktionary-to-yomitan` links (other people's
resources), and `docs/` — upstream's developer documentation, which we do not maintain.

## Our customizations

| What                     | Value                                                                                                   | Where                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add-on ID                | `yomitan@shiroikuma` (dev variant: `yomitan-dev@shiroikuma`)                                            | `dev/data/manifest-variants.json`, firefox / firefox-dev                                                                                                                                        |
| Dev `update_url`         | **removed** — it pointed at upstream's `metadata/updates.json`                                          | same file                                                                                                                                                                                       |
| Name, tooltip, homepage  | 白い熊 Yomitan, our repo                                                                                | same file                                                                                                                                                                                       |
| Author                   | 白い熊 in the firefox and safari variants; upstream's `author.email` in the base is never shipped by us | same file                                                                                                                                                                                       |
| Icon                     | traced black-yellow, both states, 14 assets                                                             | `ext/images/icon*.png`, from `graphics/icon.svg` via `graphics/make-icons.py`                                                                                                                   |
| Inline prose icon        | retraced in the house palette                                                                           | `ext/images/yomitan-icon.svg`                                                                                                                                                                   |
| Disabled-state icon      | `_setActionIcon`, called from `_updateBadge`                                                            | `ext/js/background/backend.js`                                                                                                                                                                  |
| No badge over the icon   | `_updateBadge` clears the badge text; the status stays in the tooltip                                   | same file                                                                                                                                                                                       |
| Toolbar button as switch | click toggles scanning; `general.actionButtonMode` switches back to upstream's popup                    | `_updateActionButtonMode`, `_onActionClicked`, `_setupActionContextMenu` in the same file; the option in `ext/data/schemas/options-schema.json`, `types/ext/settings.d.ts`, `ext/settings.html` |
| Black-and-yellow paint   | palettes repainted in place, `.settings-group` gains a yellow border                                    | `ext/css/material.css`, `settings.css`, `search.css`, `search-settings.css`, `action-popup.css`                                                                                                 |
| Product name in the UI   | 白い熊 Yomitan                                                                                          | every `ext/*.html`, plus a handful of strings in `ext/js/**`                                                                                                                                    |
| Every user-facing link   | our repo / wiki / issues / privacy policy                                                               | `ext/info.html`, `ext/support.html`, `ext/settings.html`, `ext/welcome.html`, `ext/quick-start-guide.html`, `ext/templates-modals.html`, `ext/js/core/log.js`                                   |
| Version and base tag     | `UPSTREAM_BASE`, `BUILD_NUMBER`                                                                         | `fork.properties`                                                                                                                                                                               |
| Build and signing        | `node tools/build-fork.mjs [--sign]`                                                                    | `tools/build-fork.mjs`                                                                                                                                                                          |
| Credentials              | AMO API key pair                                                                                        | `amo.properties` (**gitignored**)                                                                                                                                                               |

`ext/manifest.json` is **generated** by upstream's build from `dev/data/manifest-variants.json` and is
gitignored — never edit it, and never expect it to hold our identity.

## Versioning — the last component carries two counters

Upstream's version is already four components (`26.7.29.0` = `YY.M.D.P`), and Firefox and AMO accept
no fifth. So our build number cannot be appended; instead the final component encodes both:

```
version = YY.M.D.(P × 100 + N)      P = upstream's counter, N = our build number

upstream 26.7.29.0 + our build 3  ->  26.7.29.3
upstream 26.7.29.1 + our build 3  ->  26.7.29.103
upstream 26.7.29.2 + our build 1  ->  26.7.29.201
```

- `N` must stay **below 100**; `tools/build-fork.mjs` refuses to build past that rather than emit a
  version that lies about its base.
- `UPSTREAM_BASE` in `fork.properties` records the release tag `custom` is rebased onto — upstream's
  version literal exists **only as a git tag** (`package.json` says `0.0.0`, and the manifest carries
  a `$YOMITAN_VERSION` placeholder), so there is nothing in the tree to read it from.
- `BUILD_NUMBER` is bumped by every build and **reset to 1** by `/upstream-new-version`.
- The same string is the manifest version, the git tag, the release title and the `.xpi` filename, so
  they can never disagree. Output: `~/tmp/shiroikuma-kako-yomitan_<version>.xpi`.

## Building

Needs **Node ≥ 22** (upstream's `engines`) and `web-ext`, which is installed under nvm's Node 24. The
system `node` is 18, so every build must select a newer one first — in _every_ shell, since shell
state does not persist between calls:

```bash
. ~/.nvm/nvm.sh && nvm use 24
npm ci                                  # once, or after a dependency change
node tools/build-fork.mjs               # unsigned -> ~/tmp/*.xpi, bumps BUILD_NUMBER
node tools/build-fork.mjs --sign        # release only: AMO-signed .xpi
npm run test:fast                       # eslint + tsc + unit tests
```

**Iterate unsigned.** 白い熊 火狐 desktop is built with `MOZ_REQUIRE_SIGNING` unset, so it installs
unsigned builds directly; `about:debugging` → _Load Temporary Add-on_ on `builds/firefox-unpacked/`
is faster still. Sign only at release: every signing run is an AMO round-trip and burns a version
number AMO will never accept again.

## Signing

We sign through **addons.mozilla.org**, `--channel=unlisted`: Mozilla signs the `.xpi` and it installs
in any Firefox, including stock release builds, without being published or reviewed.

- Credentials are **per AMO account and shared by every extension fork** — `amo.properties`
  (`AMO_JWT_ISSUER` / `AMO_JWT_SECRET`), gitignored, mirroring `keystore.properties` in the Android
  forks. Master record: `~/〇/[666] 私資料/[666][27] 暗号/firefox-amo-api-keys.org`, which also holds
  the "Extension IDs we own" table — `yomitan@shiroikuma` is recorded there, `First signed: pending`.
- **Never generate a new key pair** — it invalidates the existing one for every other extension.
- **Never echo the credentials** into the chat, a log, or a process listing. `build-fork.mjs` passes
  them through the environment for exactly that reason.
- Bump the version on every upload; AMO rejects a version it has already seen.

## Icon

Yellow `#FFFF00` on black, taken from **upstream's own vector master**: `resources/icons.svg` holds
the icon as a layer named `Yomitan` — a rounded 16×16 tile (`rect3857`) and the katakana ヨミ
(`path3859`). `graphics/icon.svg` carries both shapes verbatim with only the fills changed, so the
fork stays recognisably the same extension without anything being redrawn.

`python3 graphics/make-icons.py` regenerates all 14 PNGs plus `graphics/icon-512.png`. Needs
`rsvg-convert` (librsvg2-bin). Two states:

- `icon<size>.png` — enabled, pure yellow;
- `icon-off<size>.png` — disabled, dimmed `#666600`, the same tone `shiroikuma-kako-stylus` uses for
  its all-disabled state.

An outline-only disabled variant was measured and rejected: a glyph bar is 2 px tall at toolbar size
and a hollow bar needs three pixels, so any stroke thin enough to leave a hole antialiases into mud.

## The paint

The pages are repainted in place — upstream's palette variables carry house values rather than an
override sheet being stacked on top, so a colour upstream adds later shows up as a rebase conflict
instead of silently rendering grey. `:root` and `:root[data-theme=dark]` resolve to the same black
and yellow, which means **the Theme setting no longer affects the pages**; it still governs the
dictionary popup, whose own palette in `ext/css/display.css` is deliberately **not** repainted —
its colours are semantic (tag categories, popular and rare headwords, pitch-accent graphs) and
collapsing them into one hue would delete information. That remains an open question for 白い熊.

New options are declared in `ext/data/schemas/options-schema.json` **with a default and no version
step**: `OptionsUtil.update()` ends in `getValidValueOrDefault`, which backfills anything missing,
whereas a `_updateVersionNN` of ours would collide with upstream's next one at every sync.

## Changelog

Upstream ships **no `CHANGELOG.md`** — its release notes live only on GitHub Releases
(`gh release view <tag> -R yomidevs/yomitan`). Ours is therefore the whole file, in the
`/publish-version` shape: our releases newest-first, each naming the upstream release it is built on,
with the upstream notes for that release folded in.

## Open threads

### The wiki is not initialized

Every documentation link in the extension now points at this repository's wiki, which **does not
exist yet**, so those links 404 until it is created. GitHub creates a repo's wiki git remote only
after the first page is saved through the web UI; there is no API for it.

**Four pages are written and staged in the gitignored `.scratch/wiki/`** — `Home`, `Dictionaries`,
`Anki` and `Yomichan-migration`, matching the anchors the pages link to. Once 白い熊 has created any
first page at <https://github.com/ShiroiKuma0/shiroikuma-kako-yomitan/wiki>, push them:

```bash
git clone git@github.com:ShiroiKuma0/shiroikuma-kako-yomitan.wiki.git /tmp/skwiki
cp .scratch/wiki/*.md /tmp/skwiki/ && cd /tmp/skwiki && git add -A && git commit && git push
```

### Nothing is signed or released yet

`yomitan@shiroikuma` has never been through AMO — the "First signed" column in the key file still
reads `pending`. **The ID becomes permanent at the first signing run.**

## HARD RULES

- **Never `git push` without 白い熊's explicit go-ahead.** Build, let them test, and push only on
  "Push". Rebasing rewrites `custom`, so publishing after a sync is
  `git push --force-with-lease origin custom`; `master` is a plain fast-forward.
- **Never `git commit --amend` on published history**, and never force-push `master`.
- **No Claude/Anthropic attribution** in commits, PRs, the README, the changelog or release notes.
  End commit messages at the last line of the body. (Global rule: `~/.claude/CLAUDE.md`.)
- **`~/git` is outside the sandbox's write allowlist.** Reads work sandboxed; every write, build and
  git command in this repo needs `dangerouslyDisableSandbox: true`.
- **Markdown is linted.** `npm run test:md` runs `prettier . --check` over every `*.md` in the tree,
  including this file — run `npx prettier --write <file>` after editing one.
- Keep the fork a **small, legible layer**: prefer new files under `graphics/` and `tools/` over edits
  to upstream's, so each new release replays cleanly.
