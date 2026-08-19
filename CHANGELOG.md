# Changelog

This file carries **both histories**: 白い熊 Yomitan's releases and, folded into each one, the notes
for the upstream [Yomitan](https://github.com/yomidevs/yomitan) release it is built on. Upstream ships
no changelog file of its own — its notes live only on GitHub Releases — so this file is entirely ours
to maintain, newest first.

## 白い熊 Yomitan 26.7.29.7 — 2026-08-19

The first published release, built on upstream **26.7.29.0** and signed by Mozilla on the unlisted
channel, so it installs in any Firefox without being listed on AMO. Everything below is what this
fork adds to stock Yomitan.

### Identity

- Our own permanent add-on ID, **`yomitan@shiroikuma`**, replacing upstream's
  `{6b733b82-9261-47ee-a595-2dda294a4d08}`. AMO will not sign an ID registered to somebody else,
  add-on updates are keyed to the ID forever, and owning it is what lets this build install
  **alongside** an unmodified Yomitan in the same profile.
- The development variant likewise gets `yomitan-dev@shiroikuma`, and its `update_url` — which pointed
  at upstream's `metadata/updates.json` — is **removed**, so a development build of this fork can
  never quietly update itself into upstream's.
- Named **白い熊 Yomitan** in the manifest, the toolbar tooltip and the `Lookup in 白い熊 Yomitan`
  context-menu entry; `homepage_url` points at this repository, so `about:addons` links here.
- Upstream's Firefox floor (`115.0`) and its `gecko_android` declaration are kept, so the build is a
  first-class Android add-on.

### Icon

- A black-and-yellow icon derived from **upstream's own vector master**: `resources/icons.svg` holds
  the icon as a rounded tile plus the katakana ヨミ, and both shapes are carried over verbatim with
  only their fills changed to pure yellow `#FFFF00` on black. Nothing is redrawn, so it still reads as
  the same extension.
- A **dimmed `#666600` variant for the disabled state**, and the behaviour to go with it: upstream
  marks disabled scanning with a grey `off` badge alone, so this fork swaps the toolbar icon as well.
- An outline-only disabled variant was measured and rejected: a glyph bar is 2 px tall at toolbar size
  and a hollow bar needs three pixels — border, hole, border — so any stroke thin enough to leave a
  hole antialiases into mud.
- All fourteen assets regenerate from one master via `graphics/make-icons.py`.

### The toolbar button

- **A click toggles text scanning.** Upstream opens a quick-actions popup instead — a menu for a
  two-state switch, and on a phone a full-screen panel for it. The **Toolbar button action** setting
  switches back to that popup; the toggle is the default.
- **Settings** are reached from the button's own right-click menu, which this fork adds, and from the
  existing keyboard shortcut. No WebExtension API reports a long press on the toolbar button on either
  platform, so that is the closest equivalent.
- **No badge is painted over the icon** — neither upstream's grey `off` label nor its orange `!`
  bubble. The icon says whether scanning is on; the status still reaches the user in the tooltip.

### Black and yellow throughout

- The pages are repainted into the house palette: pure `#FFFF00` on `#000000`, with the yellow dimmed
  in tiers where upstream needed a hierarchy — descriptions, disabled controls, separators — rather
  than falling back to grey.
- **Every card carries a yellow border.** Cards are black on a black page, so the border is what draws
  them.
- **Every drop-down wears a yellow pill** — a border rounded to half the control's height, the text
  inset, the arrow inside the frame — so a control reads as a control rather than as a line of text.
  The arrow glyph is yellow with it.
- **Text, number and password fields and textareas carry the same frame**, rectangular rather than a
  pill: upstream drew them as a fill with no edge, which on a black page left the value floating in
  the row with nothing to say it could be typed into.
- The **dictionary popup** gets the same ground and ink: the frame it wears inside a web page, body
  text, borders, the sidebar and its buttons, scrollbars, notifications, the progress bar.
- The repaint is done **in upstream's own palette variables**, not stacked as an override sheet, so a
  colour upstream adds later surfaces as a rebase conflict instead of silently rendering grey. Both
  `:root` and `:root[data-theme=dark]` resolve to the same palette, so the **Theme** setting no longer
  changes the pages; it still governs the popup.
- Three things deliberately keep a colour of their own, because there colour is information rather
  than decoration: the **eleven dictionary tag hues**, the **amber `#FFAA00`** of warnings, errors and
  the pitch-accent downstep marker, and the **advanced and debug toggles**. The pitch-accent graph
  itself draws in yellow, since upstream's black ink would have vanished on a black popup.

### Our name and our links

- Every page title, heading and body text names 白い熊 Yomitan — settings, welcome, quick-start,
  permissions, issues, legal, support, search and popup.
- **Every user-facing link points at this repository**: source, releases (including the this-version
  deep link), issue reporting, contribution guidelines, the crash logger's issue URL, the privacy
  policy, and the documentation links that pointed at `yomitan.wiki`. Store review links are dropped —
  this build is on no store.
- Deliberately **not** renamed, because they are interoperability names rather than branding: the
  **Yomitan API** and its native component, the **Yomitan dictionary** format, the `.yomitan-glossary`
  class that already-mined Anki cards carry, the `yomitan_mecab` and `yomitan_api` native-messaging
  hosts, the `yomitan-popup` DOM identifiers, settings keys such as `general.yomitanApiServer`,
  settings- and dictionary-export filenames, and the JSON schema URLs. Renaming any of them would
  break dictionaries, cards and installed components that have nothing to do with this fork. The GPL
  copyright line in `legal.html` gains our line above upstream's rather than replacing it.

### Packaging

- Version scheme `YY.M.D.(P×100 + N)`, where `P` is upstream's own final component and `N` our build
  number — Firefox and AMO accept only one to four plain dot-separated integers and upstream already
  uses all four, so the last component carries both counters losslessly. `26.7.29.7` is our seventh
  build on upstream's `26.7.29.0`.
- `tools/build-fork.mjs` builds the Firefox target, verifies that the built manifest carries our
  version and our add-on ID, drops the `.xpi` in `~/tmp` and bumps the counter; `--sign` produces the
  AMO-signed unlisted build published here.
- AMO credentials live in a gitignored `amo.properties`, mirroring `keystore.properties` in the
  Android forks, and reach `web-ext` through the environment so they never touch a log.
- Signing survives a slow approval: `web-ext` uploads quickly but gives AMO's approval only a few
  minutes by default, and a timeout there spends a version number that AMO will never accept again.
  The wait is raised to half an hour, and `tools/fetch-signed.mjs` downloads a version that is
  already uploaded, checking that what comes back really carries Mozilla's signature block.
- New options are declared in the schema with a default rather than through a version-update step,
  which would collide with upstream's numbering at every sync; the fork's own tooling and working
  directory are excluded from upstream's lint and JSON tests.

### Upstream 26.7.29.0 (2026-07-29)

**Enhancements**

- Add remaining Celtic languages (br, gv, kw) — @Al-tronic, yomidevs/yomitan#2469

**Bug fixes**

- Fix LNA issues when using local audio — @Lolle2000la, yomidevs/yomitan#2448
