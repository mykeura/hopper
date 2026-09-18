// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Miguel Euraque

import { host } from '@hermes/plugin-sdk'

const DESCRIPTION =
  'Hopper for @mykeura - Add and manage custom OpenRouter models in Hermes without modifying the core catalog.'

const DEFAULT_MODELS = [
  'inclusionai/ling-3.0-flash-vl:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'inclusionai/ling-3.0-flash-sante:free'
]

const DEFAULT_TEXT = DEFAULT_MODELS.join('\n')
const EDITOR_ATTR = 'data-hopper-model-editor'
const DETAIL_SELECTOR = '[data-testid="plugin-row-desktop:hopper"]'

function pythonPathExpression() {
  return "pathlib.Path(os.environ.get('HERMES_HOME') or pathlib.Path.home()/'.hermes')/'plugin-data'/'hopper'/'models.txt'"
}

function encodeUtf8Base64(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function readModels() {
  const expr = pythonPathExpression()
  const command = `python -c "import pathlib,os; p=${expr}; print(p.read_text(encoding='utf-8') if p.exists() else '')"`
  const result = await host.request('shell.exec', { command })
  const stdout = typeof result?.stdout === 'string' ? result.stdout : ''
  const models = stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))

  return models.length ? models.join('\n') : DEFAULT_TEXT
}

function validateModels(text) {
  const models = []
  const seen = new Set()

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const model = raw.trim()
    if (!model || model.startsWith('#')) continue
    if (/\s/.test(model)) throw new Error(`Line ${index + 1}: model IDs cannot contain whitespace.`)
    if (!model.includes('/')) {
      throw new Error(`Line ${index + 1}: expected an OpenRouter ID such as provider/model.`)
    }
    if (!seen.has(model)) {
      seen.add(model)
      models.push(model)
    }
  }

  return models
}

async function writeModels(text) {
  const models = validateModels(text)
  const normalized = models.join('\n') + (models.length ? '\n' : '')
  const encoded = encodeUtf8Base64(normalized)
  const expr = pythonPathExpression()
  const command = `python -c "import pathlib,os,base64; p=${expr}; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(base64.b64decode('${encoded}').decode('utf-8'),encoding='utf-8')"`
  const result = await host.request('shell.exec', { command })

  if (typeof result?.code === 'number' && result.code !== 0) {
    throw new Error(result.stderr || `shell.exec exited with ${result.code}`)
  }

  return models
}

function makeElement(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function mountEditor(detail) {
  if (detail.querySelector(`[${EDITOR_ATTR}]`)) return

  const container = makeElement('div', 'flex w-full flex-col gap-2')
  container.setAttribute(EDITOR_ATTR, 'true')

  const header = makeElement('div', 'flex items-center justify-between gap-2')
  const label = makeElement(
    'label',
    'text-xs text-(--ui-text-tertiary)',
    'OpenRouter models'
  )
  const status = makeElement('span', 'text-[0.65rem] text-(--ui-text-quaternary)', 'Loading…')
  header.append(label, status)

  const textarea = document.createElement('textarea')
  textarea.setAttribute('aria-label', 'Hopper OpenRouter models')
  textarea.className = [
    'min-h-32 w-full resize-y rounded-md border border-(--ui-stroke-secondary)',
    'bg-(--ui-bg-secondary) px-2.5 py-2 font-mono text-xs text-foreground',
    'outline-none focus:border-(--ui-stroke-primary)'
  ].join(' ')
  textarea.placeholder = 'provider/model-id\nprovider/another-model:free'
  textarea.value = DEFAULT_TEXT

  const help = makeElement(
    'div',
    'text-[0.65rem] leading-relaxed text-(--ui-text-quaternary)',
    'One OpenRouter model ID per line. Add or remove lines, then save.'
  )

  const actions = makeElement('div', 'flex items-center gap-2')
  const save = makeElement(
    'button',
    'h-7 rounded-md border border-(--ui-stroke-secondary) px-2.5 text-xs text-foreground hover:bg-(--ui-bg-secondary)',
    'Save models'
  )
  save.type = 'button'

  const reset = makeElement(
    'button',
    'h-7 rounded-md px-2.5 text-xs text-(--ui-text-tertiary) hover:bg-(--ui-bg-secondary)',
    'Reset Ling defaults'
  )
  reset.type = 'button'

  actions.append(save, reset)
  container.append(header, textarea, help, actions)
  detail.append(container)

  let busy = false

  const setBusy = value => {
    busy = value
    textarea.disabled = value
    save.disabled = value
    reset.disabled = value
  }

  void readModels()
    .then(text => {
      textarea.value = text
      status.textContent = `${validateModels(text).length} model(s)`
    })
    .catch(error => {
      status.textContent = 'Using defaults'
      console.warn('[hopper] could not read model list', error)
    })

  save.addEventListener('click', () => {
    if (busy) return
    setBusy(true)
    status.textContent = 'Saving…'

    void writeModels(textarea.value)
      .then(models => {
        textarea.value = models.join('\n')
        status.textContent = `${models.length} model(s) saved`
        host.notify({
          kind: 'success',
          message: 'Hopper model list saved. Reopen the model picker to refresh it.'
        })
      })
      .catch(error => {
        status.textContent = 'Save failed'
        host.notifyError(error instanceof Error ? error.message : String(error), 'Hopper')
      })
      .finally(() => setBusy(false))
  })

  reset.addEventListener('click', () => {
    textarea.value = DEFAULT_TEXT
    status.textContent = 'Defaults ready — save to apply'
    textarea.focus()
  })
}

function ensureEditor() {
  const detail = document.querySelector(DETAIL_SELECTOR)
  if (detail) mountEditor(detail)
}

export default {
  id: 'hopper',
  name: 'Hopper',
  description: DESCRIPTION,
  defaultEnabled: true,
  register(ctx) {
    const observer = new MutationObserver(() => ensureEditor())
    observer.observe(document.body, { childList: true, subtree: true })
    ensureEditor()

    if (typeof ctx.onDispose === 'function') {
      ctx.onDispose(() => {
        observer.disconnect()
        document.querySelectorAll(`[${EDITOR_ATTR}]`).forEach(node => node.remove())
      })
    }
  }
}
