# Hopper

**Hopper by @mykeura - Add and manage custom OpenRouter models in Hermes without modifying the core catalog.**

![Hopper for Hermes](images/hopper.jpg)

Hopper adds a small user-controlled OpenRouter catalog to Hermes without patching Hermes' built-in catalog.

## Default models

```text
inclusionai/ling-3.0-flash-vl:free
inclusionai/ling-3.0-flash-fin:free
inclusionai/ling-3.0-flash-sante:free
```

DeepSeek V4 Flash 0731 is not part of Hopper's defaults.

### v1.2.0 security-guard compatibility

The Desktop editor no longer uses `python -c` to read or write the model list. Hermes intentionally classifies interpreter `-c`/`-e` execution as dangerous. Hopper now calls its installed `manage.py` helper as a normal executable and sends writes as a validated base64 payload (`replace-b64`), avoiding the blocked execution pattern while keeping model text out of shell syntax.

## v1.2.0 layout

Hopper deliberately installs its two pieces separately:

```text
~/.hermes/plugins/model-providers/hopper/   # provider used by the model picker
~/.hermes/desktop-plugins/hopper/           # Capabilities UI helper
~/.hermes/plugin-data/hopper/models.txt     # user-owned model list
```

This matters because Hermes filters `model-providers/*` from the ordinary Agent plugin inventory. As a result, **Capabilities → Plugins → Hopper** shows:

```text
Desktop                    [on/off]
Agent in Hermes (profile)        —
```

There is no meaningless Agent switch and no Agent version beside the Hopper name.

## Model editor inside Capabilities

Current Hermes does not expose a supported contribution slot inside the plugin detail pane. Hopper v1.2.0 therefore uses a small DOM augmentation from its Desktop half to add a **Settings** button to the Hopper row. The editor opens lazily in an accessible modal outside the row; it does **not** patch Hermes source files or open when the row is selected.

Click **Settings** to edit one OpenRouter model ID per line. Add or remove lines and click **Save models**. **Reset Ling defaults** restores Hopper's three bundled models. The provider reads the same `models.txt` file the next time Hermes refreshes the model list. Close the modal with its close button, Escape, or the backdrop; focus returns to Settings.

Because this is DOM augmentation rather than a public SDK slot, a future Hermes UI refactor may require updating Hopper's selector. The provider itself is not dependent on that UI integration and can still be managed from the CLI/file.

## Install / upgrade

```bash
unzip hopper-v1.2.0.zip
cd hopper-v1.2.0
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

## A small way to support the project

If you are considering the Nous Portal Personal plan, you can use [my Nous Portal referral link](https://portal.nousresearch.com/r/mykeura). It takes **$15 off your first month** and gives me a **$10 referral credit** that helps cover the API usage behind my ongoing work on Hopper and related Hermes plugins. It is entirely optional, but it is a simple way for both of us to benefit.

The offer is for new customers starting a new Personal subscription. It applies to the first invoice, and each payment card can be used for only one referral; if the card has already backed another referral, the discount is reversed and no referral reward is paid.

## License

MIT License.

Hermes Agent and OpenRouter are separate projects/services. Hopper is an independent plugin and is not affiliated with or endorsed by Nous Research, OpenRouter, or InclusionAI.
