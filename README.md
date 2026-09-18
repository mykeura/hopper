# Hopper

**Hopper for @mykeura - Add and manage custom OpenRouter models in Hermes without modifying the core catalog.**

Hopper adds a small user-controlled OpenRouter catalog to Hermes without
patching Hermes' built-in catalog.

## Default models

```text
inclusionai/ling-3.0-flash-vl:free
inclusionai/ling-3.0-flash-fin:free
inclusionai/ling-3.0-flash-sante:free
```

DeepSeek V4 Flash 0731 was removed from Hopper's defaults in v1.1.0.

## v1.1.0 layout

Hopper deliberately installs its two pieces separately:

```text
~/.hermes/plugins/model-providers/hopper/   # provider used by the model picker
~/.hermes/desktop-plugins/hopper/           # Capabilities UI helper
~/.hermes/plugin-data/hopper/models.txt     # user-owned model list
```

This matters because Hermes filters `model-providers/*` from the ordinary Agent
plugin inventory. As a result, **Capabilities → Plugins → Hopper** shows:

```text
Desktop                    [on/off]
Agent in Hermes (profile)        —
```

There is no meaningless Agent switch and no Agent version beside the Hopper
name.

## Model editor inside Capabilities

Current Hermes does not expose a supported contribution slot inside the plugin
detail pane. Hopper v1.1.0 therefore uses a small DOM augmentation from its
Desktop half to place the model editor directly below the Desktop/Agent rows.
It does **not** patch Hermes source files.

The editor contains one OpenRouter model ID per line. Add or remove lines and
click **Save models**. The provider reads the same `models.txt` file the next
time Hermes refreshes the model list.

Because this is DOM augmentation rather than a public SDK slot, a future Hermes
UI refactor may require updating Hopper's selector. The provider itself is not
dependent on that UI integration and can still be managed from the CLI/file.

## Install / upgrade

```bash
unzip hopper-v1.1.0.zip
cd hopper-v1.1.0
bash install.sh
```

The installer:

- migrates an existing Hopper/OpenRouter Custom model list;
- removes the DeepSeek default added by Hopper v1.0.0;
- backs up the previous unified Hopper package;
- removes stale unified-package markers from the Desktop half;
- installs Hopper as a hidden model-provider plus a standalone Desktop plugin.

Then restart Hermes and use **Capabilities → Plugins → Rescan**.

## CLI

```bash
python ~/.hermes/plugins/model-providers/hopper/manage.py list
python ~/.hermes/plugins/model-providers/hopper/manage.py add "provider/model-id"
python ~/.hermes/plugins/model-providers/hopper/manage.py remove "provider/model-id"
python ~/.hermes/plugins/model-providers/hopper/manage.py reset
```

Hopper reuses your normal `OPENROUTER_API_KEY`.

## License

MIT License.

Source files carry:

```text
SPDX-License-Identifier: MIT
Copyright (c) 2026 Miguel Euraque
```

Hermes Agent and OpenRouter are separate projects/services. Hopper is an
independent plugin and is not affiliated with or endorsed by Nous Research,
OpenRouter, or InclusionAI.
