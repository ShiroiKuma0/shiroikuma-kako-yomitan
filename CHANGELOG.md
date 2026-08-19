# Changelog

This file carries **both histories**: 白い熊 Yomitan's releases and, folded into each one, the notes
for the upstream [Yomitan](https://github.com/yomidevs/yomitan) release it is built on. Upstream
ships no changelog file of its own — its notes live only on GitHub Releases — so this file is
entirely ours to maintain, newest first.

## 白い熊 Yomitan 26.7.29.1 — 2026-08-19

The first build of the fork, on upstream **26.7.29.0**. Almost all of it is an identity layer; the
only behaviour upstream did not already have is the dimmed toolbar icon.

### Identity

- Our own permanent add-on ID, **`yomitan@shiroikuma`**, replacing upstream's
  `{6b733b82-9261-47ee-a595-2dda294a4d08}`. AMO will not sign an ID registered to somebody else,
  add-on updates are keyed to the ID forever, and owning it is what lets this build install
  **alongside** an unmodified Yomitan in the same profile.
- The development variant likewise gets `yomitan-dev@shiroikuma`, and its `update_url` — which
  pointed at upstream's `metadata/updates.json` — is **removed**, so a development build of this
  fork can never quietly update itself into upstream's.
- `homepage_url` added, pointing at this repository, so `about:addons` links here.
- Author set to 白い熊 in the builds we ship. Upstream's Firefox floor (`115.0`) and its
  `gecko_android` declaration are kept as they are.

### Branding

- Named **白い熊 Yomitan** in the manifest, the toolbar tooltip, the `Lookup in 白い熊 Yomitan`
  context-menu entry, and every page title, heading and body text across the settings, welcome,
  quick-start, permissions, issues, legal, support, search and popup pages.
- **Every user-facing link points at this repository** — source, releases (including the
  this-version deep link), issue reporting, contribution guidelines, the crash logger's issue URL,
  and the privacy policy. The documentation links that pointed at `yomitan.wiki` now point at this
  fork's own wiki.
- Store review links are dropped from the info and support pages: this build is on no store.
- The inline icon shown in the settings and quick-start prose is retraced in the house palette.
- Deliberately **not** renamed, because they are interoperability names rather than branding: the
  **Yomitan API** and its native component, the **Yomitan dictionary** format, the `.yomitan-glossary`
  class that already-mined Anki cards carry, the `yomitan_mecab` and `yomitan_api` native-messaging
  hosts, the `yomitan-popup` DOM identifiers, settings keys such as `general.yomitanApiServer`,
  settings- and dictionary-export filenames, the JSON schema URLs, and the GPL copyright line in
  `legal.html` — to which our own line is added rather than substituted.

### Icon

- A black-and-yellow icon derived from **upstream's own vector master**: `resources/icons.svg` holds
  the icon as a rounded tile plus the katakana ヨミ, and both shapes are carried over verbatim with
  only their fills changed to pure yellow `#FFFF00` on black. Nothing is redrawn.
- A **dimmed `#666600` variant** for the disabled state, and the behaviour to go with it: upstream
  marks disabled scanning with a grey `off` badge alone, so this fork swaps the toolbar icon as well
  (`_setActionIcon` in `ext/js/background/backend.js`). The badge is untouched, and the error,
  warning and loading states keep upstream's treatment.
- A hollow, outline-only disabled variant was measured and rejected: a glyph bar is 2 px tall at
  toolbar size and a hollow bar needs three pixels — border, hole, border — so any stroke thin enough
  to leave a hole is sub-pixel and antialiases into mud.
- All fourteen assets regenerate from one master via `graphics/make-icons.py`.

### Packaging

- Version scheme `YY.M.D.(P×100 + N)`, where `P` is upstream's own final component and `N` our build
  number — Firefox and AMO accept only one to four plain dot-separated integers and upstream already
  uses all four, so the last component carries both counters losslessly. `26.7.29.1` is our first
  build on upstream's `26.7.29.0`; a build on upstream's `26.7.29.1` would read `26.7.29.101`.
- `tools/build-fork.mjs` builds the Firefox target, unpacks it for `web-ext`, verifies that the built
  manifest carries our version and our add-on ID, drops the `.xpi` in `~/tmp` and bumps the counter;
  `--sign` produces an AMO-signed unlisted build for release.
- AMO credentials live in a gitignored `amo.properties`, mirroring `keystore.properties` in the
  Android forks, and are passed to `web-ext` through the environment so they never reach a log or a
  process listing.

### Upstream 26.7.29.0 (2026-07-29)

**Enhancements**

- Add remaining Celtic languages (br, gv, kw) — @Al-tronic, yomidevs/yomitan#2469

**Bug fixes**

- Fix LNA issues when using local audio — @Lolle2000la, yomidevs/yomitan#2448
