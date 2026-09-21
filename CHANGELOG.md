# Changelog

All notable user-facing changes to Hopper are documented here. Dates follow
the corresponding Git commit dates. There are no release tags in this
repository, so version headings are based on the versions recorded in the
plugin manifest.

## [1.3.0] - 2026-09-20

### Added

- Prepared the plugin for submission to the official Hermes plugin catalog,
  including a catalog entry template and a catalog-sized banner image.
- Added the SDK-based Hopper page for the catalog distribution, reachable from
  the sidebar and command palette.

### Changed

- Updated the manual distribution, installer messages, and user guide to
  version 1.3.0.
- Documented catalog installation as the recommended path and clarified that
  both the Agent and Desktop capabilities should be enabled, with separate
  instructions for the catalog page and the manual Settings modal.
- Declared the catalog distribution's verified Hermes minimum and Linux/macOS
  platform support in its catalog-entry template.
- Ensured the manual model provider discovers Hermes' bundled OpenRouter
  profile before extending it.

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
