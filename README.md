# Hopper

**Hopper by @mykeura adds and manages custom OpenRouter models in Hermes without modifying the built-in catalog.**

![Hopper for Hermes](images/hopper.jpg)

Hopper gives you a small, personal OpenRouter catalog that you can edit from the command line. It can contain free models while they are temporarily available, as well as paid models available through OpenRouter. Model availability and pricing are controlled by OpenRouter and may change.

## Default models

The currently bundled default model is:

```text
inclusionai/ling-3.0-flash-vl
```

OpenRouter's [model page](https://openrouter.ai/inclusionai/ling-3.0-flash-vl)
lists Ling 3.0 Flash VL, a small vision-language mixture-of-experts model
from InclusionAI (5.5B active parameters out of 124B total), with a
262K-token context window and native tool calling. It is a **paid** model —
chosen over a free variant on purpose, so the bundled default does not
depend on launch-time free trials that expire and silently leave the
catalog. At roughly $0.02 / $0.06 per 1M input/output tokens it is cheap
enough to keep as a permanent default. These are time-sensitive listings,
not permanent guarantees: endpoint availability, provider routing, pricing,
and provider practices can change. Check the live [model
page](https://openrouter.ai/inclusionai/ling-3.0-flash-vl) and [provider
table](https://openrouter.ai/providers) before use.

## Manage models

Hopper only works with **OpenRouter**: model IDs must be the ones listed on
[openrouter.ai/models](https://openrouter.ai/models), in the form
`provider/model-name` (optionally with OpenRouter's `:free` suffix for free
variants — e.g. `qwen/qwen3.8-27b:free`). Traffic and billing go
through your normal `OPENROUTER_API_KEY`.

Hopper stores its catalog in a single text file under your Hermes home
directory:

| OS | Hermes home | Models file |
|----|-------------|-------------|
| Linux / macOS | `~/.hermes` | `~/.hermes/plugin-data/hopper/models.txt` |
| Windows | `%LOCALAPPDATA%\hermes` | `%LOCALAPPDATA%\hermes\plugin-data\hopper\models.txt` |

If you set the `HERMES_HOME` environment variable, that path is used instead
of the defaults above. You can also point Hopper at a specific catalog with
`HOPPER_MODELS_FILE`.

### With the CLI (recommended)

The bundled helper lives at `<hermes home>/plugins/hopper/manage.py`.
Replace `provider/model-id` with an ID copied from
[openrouter.ai/models](https://openrouter.ai/models), such as
`inclusionai/ling-3.0-flash-vl`.

**Linux / macOS:**

```bash
python3 ~/.hermes/plugins/hopper/manage.py list
python3 ~/.hermes/plugins/hopper/manage.py add "provider/model-id"
python3 ~/.hermes/plugins/hopper/manage.py remove "provider/model-id"
python3 ~/.hermes/plugins/hopper/manage.py reset
python3 ~/.hermes/plugins/hopper/manage.py file
```

**Windows (PowerShell):**

```powershell
py "$env:LOCALAPPDATA\hermes\plugins\hopper\manage.py" list
py "$env:LOCALAPPDATA\hermes\plugins\hopper\manage.py" add "provider/model-id"
py "$env:LOCALAPPDATA\hermes\plugins\hopper\manage.py" remove "provider/model-id"
py "$env:LOCALAPPDATA\hermes\plugins\hopper\manage.py" reset
py "$env:LOCALAPPDATA\hermes\plugins\hopper\manage.py" file
```

**Windows (CMD):**

```bat
py "%LOCALAPPDATA%\hermes\plugins\hopper\manage.py" list
py "%LOCALAPPDATA%\hermes\plugins\hopper\manage.py" add "provider/model-id"
py "%LOCALAPPDATA%\hermes\plugins\hopper\manage.py" remove "provider/model-id"
py "%LOCALAPPDATA%\hermes\plugins\hopper\manage.py" reset
py "%LOCALAPPDATA%\hermes\plugins\hopper\manage.py" file
```

Commands:

| Command | What it does |
|---------|----------------|
| `list` | Print the configured model IDs |
| `add "provider/model-id" …` | Add one or more OpenRouter model IDs |
| `remove "provider/model-id" …` | Remove one or more OpenRouter model IDs |
| `reset` | Restore the bundled default model |
| `file` | Print the full path to `models.txt` |

On Windows, use `python` instead of `py` if the Python launcher is not
installed.

### Editing the file directly

Open the models file from the table above (or run the `file` command to print
its exact location) in any text editor:

- One **OpenRouter** model ID per line, copied from
  [openrouter.ai/models](https://openrouter.ai/models):
  - `provider/model-name` — e.g. `z-ai/glm-5.3` or `deepseek/deepseek-v4.1-flash`
  - `provider/model-name:free` — free variant, e.g.
    `inclusionai/ling-3.0-flash-vl:free`
- Blank lines are ignored.
- Lines starting with `#` are comments.
- Duplicate IDs are saved once.
- An empty catalog is valid: it hides every Hopper model.

Save the file, then open the model picker or press **Refresh models** in
the selector so the updated catalog appears.

The `list`/`add`/`remove`/`reset`/`file` commands in this plugin update
`models.txt` **and** invalidate Hermes' cached model list, so CLI edits
take effect on the next model-picker read without restarting the app.
Editing `models.txt` by hand is treated as an external change: open the
model picker (or **Refresh models**) so it re-fetches. If a removed model
still shows up after a refresh, the stale entry lives in
`~/.hermes/provider_models_cache.json` under the `hopper` key — delete that
key (or run any of the CLI commands above) and refresh again.

## Install or upgrade

Copy this directory to `~/.hermes/plugins/hopper` (or install it with
`hermes plugins install owner/repo`), then:

1. Restart Hermes (or its gateway).
2. Open **Capabilities → Plugins** and click **Rescan**.
3. Confirm Hopper is listed as a model provider.
4. Choose a Hopper model from the Hermes model selector.

Your existing model list (`~/.hermes/plugin-data/hopper/models.txt`) is kept
on upgrade.

## A small way to support the project

If you are considering the Nous Portal **Plus** plan, you can use [my Nous Portal referral link](https://portal.nousresearch.com/r/mykeura). Your first month costs **$5 instead of $20**, and I receive a $10 referral credit that helps cover the API usage behind my ongoing work on Hopper and related Hermes plugins. It is entirely optional, but it is a simple way for both of us to benefit.

The offer is for new customers starting a new Plus subscription. It applies to the first invoice, and each payment card can be used for only one referral. If the card has already backed another referral, the discount is reversed and no referral reward is paid.

If you would rather support my work directly, you can also [sponsor me on GitHub](https://github.com/sponsors/mykeura). Every bit helps me keep building and maintaining these open-source plugins. Thank you!

## License

MIT License.

Hermes Agent and OpenRouter are separate projects/services. Hopper is an independent plugin and is not affiliated with or endorsed by Nous Research, OpenRouter, or InclusionAI.
