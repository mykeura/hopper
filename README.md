# Hopper

**Hopper by @mykeura adds and manages custom OpenRouter models in Hermes without modifying the built-in catalog.**

![Hopper for Hermes](images/hopper.jpg)

Hopper gives you a small, personal OpenRouter catalog that you can edit from Hermes. It can contain free models while they are temporarily available, as well as paid models available through OpenRouter. Model availability and pricing are controlled by OpenRouter and may change.

## Default models

Hopper v1.3.0 starts with these models:

```text
inclusionai/ling-3.0-flash-vl:free
inclusionai/ling-3.0-flash-fin:free
inclusionai/ling-3.0-flash-sante:free
```

## Demo

![Hopper model settings demo](demo/demo-2.gif)

## Manage models in Hermes

### Catalog installation

After installing from the catalog and enabling both **Agent** and **Desktop**,
open the Hopper page from the Hermes sidebar. You can also open it from the
command palette with **Hopper: Manage OpenRouter models**. Add or remove one
OpenRouter model ID per line, then choose **Save models**. To return to the
bundled list, choose **Reset Ling defaults**. Reopen the Hermes model picker so
the updated catalog appears in the selector.

### Manual installation

For the manual distribution, open **Capabilities → Plugins**, select
**Hopper**, and click **Settings** to open the model-list modal. Add or remove
one OpenRouter model ID per line, then click **Save models**. To return to the
bundled list, click **Reset Ling defaults**. Close the modal with its close
button, press **Escape**, or click the backdrop.

## Install from the Hermes catalog (recommended)

Once Hopper is available in the official Hermes plugin catalog, install it by
name:

```bash
hermes plugins install hopper
```

This installs the reviewed catalog version. Set `OPENROUTER_API_KEY` in your
Hermes environment, restart Hermes (or its gateway), and open
**Capabilities → Plugins**. Select **Hopper**, enable both **Agent** and
**Desktop**, then open the Hopper page from the sidebar or use the command
palette command **Hopper: Manage OpenRouter models**. The Agent and Desktop
switches are independent; both must be enabled for the complete Hopper
experience.
The catalog page is provided through the official Hermes Desktop SDK.

Catalog installation does not run this repository's `install.sh`; the script
is only the alternative manual installer described below.

## Manual installation (alternative)

From the extracted Hopper v1.3.0 release directory, run:

```bash
bash install.sh
```

The installer keeps your existing Hopper model list when upgrading and migrates an earlier OpenRouter Custom list when available. After installation or an upgrade:

1. Restart Hermes (or its gateway).
2. Open **Capabilities → Plugins** and click **Rescan**.
3. Select Hopper and enable its **Desktop** capability. The manual
   distribution keeps the model-provider half separate, so Hermes shows a dash
   for **Agent**; the catalog distribution above combines both capabilities.
4. Open **Settings** to confirm or edit the model list.
5. Choose an enabled Hopper model from the Hermes model selector.

No additional application configuration is required beyond your normal
`OPENROUTER_API_KEY`.

## Optional CLI

The catalog installation stores its helper at `~/.hermes/plugins/hopper/manage.py`:

```bash
python ~/.hermes/plugins/hopper/manage.py list
python ~/.hermes/plugins/hopper/manage.py add "provider/model-id"
python ~/.hermes/plugins/hopper/manage.py remove "provider/model-id"
python ~/.hermes/plugins/hopper/manage.py reset
```

The manual installation keeps its helper at
`~/.hermes/plugins/model-providers/hopper/manage.py`:

```bash
python ~/.hermes/plugins/model-providers/hopper/manage.py list
python ~/.hermes/plugins/model-providers/hopper/manage.py add "provider/model-id"
python ~/.hermes/plugins/model-providers/hopper/manage.py remove "provider/model-id"
python ~/.hermes/plugins/model-providers/hopper/manage.py reset
```

Hopper uses your normal `OPENROUTER_API_KEY`.

## A small way to support the project

If you are considering the Nous Portal Personal plan, you can use [my Nous Portal referral link](https://portal.nousresearch.com/r/mykeura). It takes **$15 off your first month** and gives me a **$10 referral credit** that helps cover the API usage behind my ongoing work on Hopper and related Hermes plugins. It is entirely optional, but it is a simple way for both of us to benefit.

The offer is for new customers starting a new Personal subscription. It applies to the first invoice, and each payment card can be used for only one referral; if the card has already backed another referral, the discount is reversed and no referral reward is paid.

## License

MIT License.

Hermes Agent and OpenRouter are separate projects/services. Hopper is an independent plugin and is not affiliated with or endorsed by Nous Research, OpenRouter, or InclusionAI.
