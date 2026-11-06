# Changelog

All notable user-facing changes to Hopper are documented here. Dates follow
the corresponding Git commit dates. Version headings match the versions
recorded in the plugin manifest and the matching `v*` git tags.

## [Unreleased]

## [1.7.0] - 2026-11-06

### Fixed

- Resolved the Hermes home through the host's `get_hermes_home()` instead of
  reading `HERMES_HOME` from the environment directly: under the multiplex
  gateway or the Desktop serve backend, non-launch profiles were reading
  (and seeding) the launch profile's `models.txt`. `HERMES_HOME` and
  `HOPPER_MODELS_FILE` also gained the host's `expandvars`/strip handling
  (`HERMES_HOME=$VAR/...` now resolves like Hermes resolves it).
- `models.txt` is now read as `utf-8-sig` and lines are validated the same
  way `manage.py` validates them: a UTF-8 BOM or a hand-edited line without
  `provider/model` shape no longer leaks into the picker as a phantom model
  that 404s at inference.
- The `manage.py` cache-invalidation fallback now edits
  `provider_models_cache.json` under the same `provider_models_cache.json.lock`
  the host takes, so a running Hermes can no longer resurrect the deleted
  `hopper` cache row with a concurrent write.
- `add` on a fresh install (no `models.txt` yet) now seeds the bundled
  default model first, matching what the first Hermes run would create.
- Hopper now honors `OPENROUTER_BASE_URL` (`base_url_env_var`), keeping
  proxy/regional-endpoint setups in parity with the bundled OpenRouter
  provider, and declares `aggregator`/`catalog_aliases` so the `hop` alias
  normalizes to `hopper` in the model-catalog cache instead of leaving an
  un-invalidated second cache row.
- `manage.py` exits with a clean error (not a traceback) on filesystem
  errors such as a `models.txt` locked by another program on Windows.

### Changed

- The manifest now uses the recognized `author` field (the `maintainer`
  field was ignored by Hermes' manifest loader).
- `models.txt`'s header now notes that the manage commands rewrite the file
  and do not preserve custom comment lines.
- README documents that `hermes plugins remove` (not `disable`) unloads the
  provider, and that Hopper follows `OPENROUTER_BASE_URL`.

## [1.6.0] - 2026-10-06

### Changed

- Replaced the bundled default model with `inclusionai/ling-3.0-flash-vl`, the
  paid Ling 3.0 Flash VL variant (5.5B active / 124B total MoE, 262K context,
  native vision and tool calling, roughly $0.02 / $0.06 per 1M tokens). A paid
  default does not depend on launch-time free trials expiring out of the
  catalog; README examples and the default-model notes were updated.

### Fixed

- The bundled default model is now removable: `fallback_models` is empty so
  Hermes no longer merges it back into the picker list (curated-first) after
  `remove` or an emptied `models.txt`. An empty catalog now truly hides every
  Hopper model, as documented.
- `manage.py` and the provider now resolve the real Windows Hermes home
  (`%LOCALAPPDATA%\hermes`, matching Hermes' platform default) instead of
  `~/.hermes`, so CLI edits and cache invalidation land where Hermes reads
  them on Windows.
- README corrections: only `add`/`remove`/`reset` invalidate the model cache
  (`list`/`file` are read-only), and the Windows paths now point at
  `%LOCALAPPDATA%\hermes`.

### Removed

- Dropped the dead mtime-clamp in the cache-invalidation fallback: the host
  fingerprint hashes credential-file mtimes, never the cache file's own.

## [1.5.0] - 2026-10-03

### Added

- `manage.py` mutations (`add`/`remove`/`reset`/`replace-b64`) now invalidate
  the `hopper` entry in `$HERMES_HOME/provider_models_cache.json`, preferring
  the host's `clear_provider_models_cache` API and falling back to an atomic
  JSON rewrite, so CLI edits take effect without restarting Hermes.

### Changed

- Replaced the bundled default model with `inclusionai/ling-3.1-flash`;
  updated README examples and its dated notes on endpoint availability,
  provider routing, and data handling.

## [1.4.0] - 2026-09-21

### Removed

- Removed the Desktop half (`desktop/plugin.js`). It decorated the
  Capabilities hub row through direct DOM mutation (row selectors, folder-icon
  removal, Agent-toggle hiding, badge injection, and a `document.body` modal),
  which is outside the plugin SDK contract. Models are now managed with the
  `manage.py` CLI or by editing `plugin-data/hopper/models.txt` directly.
- Removed the Desktop settings demo (`demo/demo.gif`) and its README section;
  the README now documents model management from the terminal on Linux,
  macOS, and Windows, and clarifies that model IDs are OpenRouter IDs
  (`provider/model-name`, optional `:free`) copied from openrouter.ai/models.

### Changed

- Dropped the `Hopper by @mykeura - ` prefix from the plugin description in
  the manifest and provider profile; attribution lives in the `maintainer`
  field (renamed from `author`).

## [1.3.0] - 2026-09-21

### Changed

- Repackaged Hopper as a unified Agent+Desktop plugin directory that installs
  with `hermes plugins install`, as required by the Hermes plugin catalog.
  Install by copying this directory to `~/.hermes/plugins/hopper`; the
  `install.sh` split-installer was removed.
- No visual changes except a generic **Reset defaults** button (was
  **Reset Ling defaults**); the bundled default list is now just
  `inclusionai/ling-3.0-flash-vl:free`. Same validation, same `manage.py`
  CLI (now at `plugins/hopper/`).

## [1.2.0] - 2026-09-20

### Added

- Added a **Settings** button to the Hopper row in Hermes Capabilities.
- Added a lazy, accessible modal for editing OpenRouter model IDs.
- Added modal focus handling and close actions for Escape, the backdrop, and
  the close button; focus returns to Settings when the modal closes.
- Added DOM-level tests for mounting, remounting, saving, validation, and modal
  keyboard/mouse behavior.

### Changed

- Moved the model editor out of the plugin row and into the modal. Selecting
  the row alone no longer opens the editor.
- Kept saving, validation, duplicate removal, comments, and **Reset Ling
  defaults** available in the new modal workflow.

## [1.1.1] - 2026-09-18

### Security

- Replaced Desktop calls using `python -c` with the installed `manage.py`
  helper, avoiding Hermes security-guard blocks on interpreter `-c`/`-e`
  execution.
- Desktop writes now use validated UTF-8/base64 payloads through the helper, so
  model IDs are not embedded as shell syntax.

### Changed

- Removed the DeepSeek V4 Flash default while preserving user-added models;
  Hopper now ships with the three Ling defaults.
- Added helper commands for clean model-list reads and validated replacement.

## [1.1.0] - 2026-09-18

### Changed

- Split Hopper into a hidden model-provider and a standalone Desktop plugin so
  Capabilities shows a Desktop switch without an unrelated Agent switch.
- Moved the user-owned model list to `plugin-data/hopper/models.txt` and added
  migration/backup handling for the earlier OpenRouter Custom and unified
  Hopper layouts.
- Reworked the Capabilities editor as a Desktop DOM integration while keeping
  CLI/file management available.

## [1.0.0] - 2026-09-18

### Added

- Initial Hopper plugin for a user-controlled OpenRouter model catalog that
  leaves Hermes' built-in catalog unchanged.
- Added a Desktop model editor, CLI management commands, migration from the
  `openrouter-custom` prototype, and reuse of `OPENROUTER_API_KEY`.
- Shipped the initial Ling models plus the DeepSeek V4 Flash default, which was
  removed during the 1.1.1 upgrade path.
