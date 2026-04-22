# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Plugin Does

An Obsidian plugin that streamlines creating TTRPG (Tabletop RPG) session notes. It adds a ribbon icon (dice) that opens a modal form — the user picks a campaign, fills in session metadata, and the plugin creates a new Markdown note by substituting `{{variables}}` into a Handlebars-style template file stored in the vault.

It integrates with the **Fantasy Calendar** Obsidian plugin via `fc-date` and `fc-category` frontmatter fields.

## Test Vault

A pre-configured Obsidian vault lives at:
```
C:\Users\cacha\Documents\Claude\Obsidian Pluging\test vaults\plugin-test
```

The vault's `.obsidian/plugins/obsidian-ttrpg-session-notes/` folder **is** the dev repo (linked directly), so any `main.js` produced by a build is immediately live in Obsidian — no copy step needed.

**Pre-loaded content:**
- `templates/session-gm-handlebar.md` — active session template; uses both `{{handlebar}}` substitution (this plugin) and Templater `<% %>` syntax (processed by Templater after file creation)
- `ttrpgs/` — three campaigns: *Phandalin Kids*, *Quarantine Qohort* (91 sessions), *Trollskull Trading Company* (45 sessions)
- Plugin `data.json` already configured: `sessionTemplate` and `ttrpgsFolder` set correctly

**Installed plugins:** `dataview`, `templater-obsidian`, `plugin-reloader` (hot-reload without Obsidian restart), `create-campaign-session-plugin` (this plugin)

**Dev loop:** run `npm run dev` → make changes → use plugin-reloader in Obsidian to pick up the new `main.js` without a full restart.

## Build & Dev Commands

```bash
npm run dev        # watch mode — rebuilds main.js on save
npm run build      # type-check (tsc --noEmit) then production bundle
npm test           # run Jest suite once
npm run test:watch # Jest in interactive watch mode (TDD inner loop)
npm run version    # bump version in manifest.json + versions.json
```

Output is a single `main.js` (CJS bundle) in the repo root, loaded directly by Obsidian.

**To develop locally:** symlink or copy the repo folder into your Obsidian vault's `.obsidian/plugins/` directory, then run `npm run dev`. Reload Obsidian (Ctrl+R) after each rebuild to pick up changes.

## Testing

**Stack:** Jest 30 + ts-jest 29, `testEnvironment: node`. Tests live in `__tests__/`, run with `npm test`.

**Obsidian mock:** `__mocks__/obsidian.ts` is a manual module mock. `jest.config.js` maps `import ... from 'obsidian'` to this file via `moduleNameMapper`, so plugin source files can be imported in Node without the Obsidian runtime. The mock provides jest.fn() stubs for all used API classes.

**Test tsconfig:** `tsconfig.test.json` extends the base config but overrides `module: commonjs` so Jest can consume the TypeScript output. The main tsconfig stays on `ESNext` for the esbuild production build.

**What to test:** Pure business logic belongs in `sessionUtils.ts` (no Obsidian imports) and is fully unit-testable. Code that directly calls Obsidian DOM APIs (`createEl`, `contentEl`, etc.) should be kept thin and is tested via the mock stubs when needed. New features should be designed so the logic core lives in pure functions before being wired into modal/settings classes.

## Architecture

Three source files; no external runtime dependencies (everything in `devDependencies`).

```
main.ts                  Plugin entry point — registers ribbon icon + settings tab
CreateSessionModal.ts    Modal UI + all note-creation logic
CreateSessionSettings.ts Settings tab — template path & campaigns folder pickers
```

### Data Flow: Command Invocation → Note Creation

1. **`main.ts` `onload()`** registers a ribbon icon. Click → `new CreateSessionModal(app, plugin).open()`.
2. **`CreateSessionModal.onOpen()`** builds a DOM form imperatively using Obsidian's `createEl` API (no framework). It reads `plugin.settings.ttrpgsFolder` to enumerate campaign subfolders and populates a `<select>`.
3. **Campaign selection (`change` event)** scans all files in the chosen campaign folder, reads their metadata cache (`app.metadataCache.getFileCache()`), finds the highest `sessionNum` in frontmatter, auto-fills the next session number, and pre-populates other fields from the most recent session's frontmatter (world, thread, chapter, location, fc-date, fc-category).
4. **Form submit** reads `plugin.settings.sessionTemplate`, loads the template file content via `app.vault.read()`, does a global regex replace for each `{{variable}}`, then calls `app.vault.create()` with the resolved path `ttrpgs/<campaign>/<paddedNum>_<YYYYMMDD> - <title>.md` and opens the new file in a new leaf.
5. **Settings** (`CreateSessionSettings.ts`) enumerate the vault's `templates/` folder and root-level folders to populate dropdowns; values persist via `plugin.loadData()` / `plugin.saveData()`.

## CI / Release

Two workflows in `.github/workflows/`:

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | Every push + PR to `master` | `npm ci` → `npm test` → `npm run build` |
| `release.yml` | Push of a bare version tag (`1.1.0`) | same as CI + version/manifest check + GitHub Release with assets |

**Note:** `.github/Test Flows/build2.yml` is a legacy file that GitHub Actions never executes (wrong directory, also targets Node 12 + yarn). It can be deleted.

### Cutting a release

```bash
npm version patch        # or minor / major
#  → bumps package.json, runs version-bump.mjs (updates manifest.json + versions.json), commits, tags
git push --follow-tags   # pushes commit + tag → triggers release.yml
```

The release workflow enforces that the tag matches `manifest.json` version and fails fast if they diverge. The resulting GitHub Release attaches `main.js`, `manifest.json`, and `styles.css` — the exact three files Obsidian's community plugin registry reads when a user installs the plugin.

### Publishing to Obsidian's community plugin list

This is a one-time manual step (separate from each release):
1. Fork `obsidian-md/obsidian-releases`
2. Add an entry to `community-plugins.json` pointing to `cacharbe/obsidian-ttrpg-session-notes`
3. Open a PR — Obsidian's team reviews and merges

After that, each tagged GitHub Release is automatically picked up by Obsidian for updates.

### Key Hardcoded Assumptions

- Campaign path lookup on submit is hardcoded to `ttrpgs/<selectedCampaign>` (line 150 / 189 of `CreateSessionModal.ts`), even though the setting `ttrpgsFolder` was meant to make this configurable — **the setting is only used for populating the dropdown, not for the create path**.
- Template folder is hardcoded to `templates/` in `CreateSessionSettings.ts` line 24.
- Note filename format: `<3-digit-padded-sessionNum>_<YYYYMMDD> - <title>.md`.
