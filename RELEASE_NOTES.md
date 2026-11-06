# Hopper v1.7.0

Hopper keeps your own list of OpenRouter models available in Hermes' model
picker, without touching the built-in catalog. This release fixes several
cases where the plugin and Hermes could disagree about which list to show.

## What's better now

- **Multiple profiles work correctly.** If you run more than one Hermes
  profile (for example with the multiplex gateway or the desktop app), each
  profile now uses its own Hopper model list instead of accidentally sharing
  the launch profile's.
- **Editing `models.txt` on Windows is safe.** Files saved with Notepad or
  PowerShell no longer produce a broken first model in the picker, and lines
  that aren't valid `provider/model` IDs are ignored just like the CLI does.
- **CLI changes always show up.** Running `add`, `remove` or `reset` while
  Hermes is open now reliably refreshes the picker — a stale cached list can
  no longer sneak back in.
- **Fresh installs behave as documented.** Running `manage.py add` before
  Hermes has ever started now keeps the bundled default model instead of
  silently dropping it.
- **Proxy and regional endpoints are honored.** If you set
  `OPENROUTER_BASE_URL`, Hopper follows it just like the built-in OpenRouter
  provider.

## Upgrading

Replace the plugin folder (or run `hermes plugins update`), restart Hermes,
and your existing `models.txt` keeps working — no action needed.

Note: to turn Hopper off, use `hermes plugins remove hopper`. The `disable`
command currently doesn't unload model providers (a Hermes limitation, not
a Hopper one).
