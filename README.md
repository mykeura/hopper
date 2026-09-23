# Hopper

**Hopper by @mykeura adds and manages custom OpenRouter models in Hermes without modifying the built-in catalog.**

![Hopper for Hermes](images/hopper.jpg)

Hopper gives you a small, personal OpenRouter catalog that you can edit from the command line. It can contain free models while they are temporarily available, as well as paid models available through OpenRouter. Model availability and pricing are controlled by OpenRouter and may change.

## Default models

The currently bundled default model is:

```text
qwen/qwen3.8-27b:free
```

As of September 23, 2026, OpenRouter's [model page](https://openrouter.ai/qwen/qwen3.8-27b:free)
lists exactly one endpoint for this free model, served by ModelRun [by
Modular] at zero prompt and completion prices. It accepts text, image, and
video input. OpenRouter's [provider table](https://openrouter.ai/providers)
currently marks ModelRun **No** for training and **Zero retention**. These
are time-sensitive listings, not permanent guarantees: endpoint availability,
provider routing, and provider practices can change. The Zero retention label
covers provider-side prompt/response retention, not all data handling;
OpenRouter may retain request metadata such as token counts, latency, model,
and cost. Check the live [model endpoint](https://openrouter.ai/qwen/qwen3.8-27b:free),
[provider table](https://openrouter.ai/providers), and
[ZDR explanation](https://openrouter.ai/blog/insights/zero-data-retention/)
before use.

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
| Windows | `%USERPROFILE%\.hermes` | `%USERPROFILE%\.hermes\plugin-data\hopper\models.txt` |

If you set the `HERMES_HOME` environment variable, that path is used instead
of the defaults above. You can also point Hopper at a specific catalog with
`HOPPER_MODELS_FILE`.

### With the CLI (recommended)

The bundled helper lives at `<hermes home>/plugins/hopper/manage.py`.
Replace `provider/model-id` with an ID copied from
[openrouter.ai/models](https://openrouter.ai/models), such as
`qwen/qwen3.8-27b:free`.

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
py "$env:USERPROFILE\.hermes\plugins\hopper\manage.py" list
py "$env:USERPROFILE\.hermes\plugins\hopper\manage.py" add "provider/model-id"
py "$env:USERPROFILE\.hermes\plugins\hopper\manage.py" remove "provider/model-id"
py "$env:USERPROFILE\.hermes\plugins\hopper\manage.py" reset
py "$env:USERPROFILE\.hermes\plugins\hopper\manage.py" file
```

**Windows (CMD):**

```bat
py "%USERPROFILE%\.hermes\plugins\hopper\manage.py" list
py "%USERPROFILE%\.hermes\plugins\hopper\manage.py" add "provider/model-id"
py "%USERPROFILE%\.hermes\plugins\hopper\manage.py" remove "provider/model-id"
py "%USERPROFILE%\.hermes\plugins\hopper\manage.py" reset
py "%USERPROFILE%\.hermes\plugins\hopper\manage.py" file
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
  - `provider/model-name` — e.g. `x-ai/grok-4.7` or `xiaomi/mimo-v2.6-pro`
  - `provider/model-name:free` — free variant, e.g.
    `qwen/qwen3.8-27b:free`
- Blank lines are ignored.
- Lines starting with `#` are comments.
- Duplicate IDs are saved once.
- An empty catalog is valid: it hides every Hopper model.

Save the file, then reopen the Hermes model picker (or press **Refresh
models** in the selector) so the updated catalog appears. After removing a
model, restart Hermes Desktop as well; otherwise removed models keep
appearing until that refresh.

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

If you are considering the Nous Portal Personal plan, you can use [my Nous Portal referral link](https://portal.nousresearch.com/r/mykeura). It takes **$15 off your first month** and gives me a **$10 referral credit** that helps cover the API usage behind my ongoing work on Hopper and related Hermes plugins. It is entirely optional, but it is a simple way for both of us to benefit.

The offer is for new customers starting a new Personal subscription. It applies to the first invoice, and each payment card can be used for only one referral; if the card has already backed another referral, the discount is reversed and no referral reward is paid.

## License

MIT License.

Hermes Agent and OpenRouter are separate projects/services. Hopper is an independent plugin and is not affiliated with or endorsed by Nous Research, OpenRouter, or InclusionAI.
