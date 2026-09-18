# Hopper

**Hopper for @mykeura - Add and manage custom OpenRouter models in Hermes without modifying the core catalog.**

Hopper is a Hermes model-provider plugin backed by OpenRouter. It gives you a
small, user-controlled catalog that appears as a separate provider in Hermes,
while preserving Hermes' own OpenRouter integration and avoiding patches to the
core model catalog.

## Included models

Hopper starts with:

```text
inclusionai/ling-3.0-flash-vl:free
inclusionai/ling-3.0-flash-fin:free
inclusionai/ling-3.0-flash-sante:free
deepseek/deepseek-v4-flash-0731:free
```

You can remove any of them or add any valid OpenRouter model ID.

## What changed from OpenRouter Custom

Hopper replaces the earlier `openrouter-custom` prototype.

- Provider renamed to **Hopper** everywhere.
- DeepSeek V4 Flash 0731 (free) is included by default.
- Hopper is packaged as a **unified Hermes plugin** with an agent/provider half
  and a Desktop half.
- It appears in **Capabilities → Plugins**.
- The Desktop half provides a native Hopper model editor.
- Existing `openrouter-custom` model selections are migrated by `install.sh`.
- The editable model list lives outside the plugin install directory, so plugin
  updates do not overwrite user choices.

## Important Hermes UI limitation

Current Hermes versions do not expose an SDK hook that lets third-party plugins
insert arbitrary controls such as a `Textarea` directly into the right-hand
detail pane of **Capabilities → Plugins**. That pane currently owns its Desktop
and Agent switches itself.

Hopper therefore uses the supported Desktop Plugin SDK:

1. Hopper appears normally in **Capabilities → Plugins**, with its name,
   description and Desktop/Agent controls.
2. Enabling the Desktop half adds a **Hopper** page to Hermes.
3. That page contains the editable model textbox requested for Hopper.
4. `Ctrl/Cmd+K` → **Hopper: Manage OpenRouter models** opens the same editor.

This avoids patching Hermes Desktop internals and keeps Hopper compatible with
normal Hermes updates.

## Install / upgrade from the previous prototype

```bash
unzip hopper-v1.0.0.zip
cd hopper
bash install.sh
```

The installer places Hopper at:

```text
~/.hermes/plugins/hopper/
```

and keeps the user's catalog at:

```text
~/.hermes/plugin-data/hopper/models.txt
```

If it finds the previous prototype at:

```text
~/.hermes/plugins/model-providers/openrouter-custom/
```

it moves that directory to `~/.hermes/plugin-backups/` so Hermes does not show
both providers.

After installing:

1. Restart Hermes / the gateway.
2. Open **Capabilities → Plugins** and choose **Rescan**.
3. Enable Hopper's Desktop half.
4. Open **Hopper** from the sidebar or Command Palette.
5. If the editor cannot reach its backend, enable Hopper's Agent half and
   restart the gateway.
6. Open the model picker and select **Hopper**.

Hopper reuses your existing `OPENROUTER_API_KEY` and the standard OpenRouter
endpoint `https://openrouter.ai/api/v1`.

## Model editor

The Hopper page contains one model ID per line. For example:

```text
inclusionai/ling-3.0-flash-vl:free
deepseek/deepseek-v4-flash-0731:free
qwen/qwen3-coder
```

Click **Save models**, then reopen the Hermes model picker.

## CLI management

List:

```bash
python ~/.hermes/plugins/hopper/manage.py list
```

Add:

```bash
python ~/.hermes/plugins/hopper/manage.py add "provider/model-id"
```

Remove:

```bash
python ~/.hermes/plugins/hopper/manage.py remove "provider/model-id"
```

Restore the four defaults:

```bash
python ~/.hermes/plugins/hopper/manage.py reset
```

Show the data file:

```bash
python ~/.hermes/plugins/hopper/manage.py file
```

You may also edit `models.txt` directly.

## Architecture

Hopper subclasses Hermes' bundled `OpenRouterProfile`. It therefore reuses
Hermes' OpenRouter-specific behavior rather than cloning or patching it.

```text
hopper/
├── __init__.py
├── plugin.yaml
├── manage.py
├── LICENSE
├── desktop/
│   └── plugin.js
└── dashboard/
    ├── manifest.json
    └── plugin_api.py
```

The Desktop editor talks only to Hopper's namespaced backend API. The backend
reads and writes Hopper's `models.txt`; it does not store your OpenRouter API
key.

## License

MIT License.

SPDX headers in the source identify:

```text
SPDX-License-Identifier: MIT
Copyright (c) 2026 Miguel Euraque
```

Hermes Agent is a separate project developed by Nous Research and licensed
under MIT. OpenRouter is a third-party service; use of OpenRouter and individual
models is subject to their respective terms.

Hopper is an independent plugin and is not affiliated with or endorsed by Nous
Research, OpenRouter, InclusionAI, or DeepSeek.
