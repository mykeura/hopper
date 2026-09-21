// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Miguel Euraque

import { host } from '@hermes/plugin-sdk'

const DESCRIPTION =
  'Hopper by @mykeura - Add and manage custom OpenRouter models in Hermes without modifying the core catalog.'

const DEFAULT_MODELS = [
  'inclusionai/ling-3.0-flash-vl:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'inclusionai/ling-3.0-flash-sante:free'
]

const DEFAULT_TEXT = DEFAULT_MODELS.join('\n')
// Unified catalog packages merge both halves into one row (`plugin-row-hopper`);
// standalone disk installs keep the legacy row id (`plugin-row-desktop:hopper`).
const DETAIL_SELECTOR = '[data-testid="plugin-row-hopper"], [data-testid="plugin-row-desktop:hopper"]'
const BADGES_SELECTOR = ':scope > [role="cell"] > div.min-w-0.flex-1 > div.flex.flex-wrap'
const ROW_CELLS_SELECTOR = ':scope > [role="cell"]'
const FOLDER_ICON_SELECTOR = 'i.codicon-folder-opened'
const MOUNT_ATTR = 'data-hopper-settings-mount'
const OVERLAY_ATTR = 'data-hopper-model-overlay'
const AGENT_CELL_ATTR = 'data-hopper-agent-cell'
const AGENT_DASH_ATTR = 'data-hopper-agent-dash'

const MANAGER_CATALOG = '"${HERMES_HOME:-$HOME/.hermes}/plugins/hopper/manage.py"'
const MANAGER_LEGACY = '"${HERMES_HOME:-$HOME/.hermes}/plugins/model-providers/hopper/manage.py"'

function managerCommand(subcommand, argument, manager = MANAGER_CATALOG) {
  // Hopper deliberately invokes its installed helper as a normal executable
  // file. Hermes blocks interpreter -c/-e flags by design; using the helper
  // keeps this operation auditable and avoids embedding executable code in the
  // shell command. The payload argument is base64 and single-quoted, so model
  // IDs never become shell syntax.
  return argument !== undefined ? `${manager} ${subcommand} '${argument}'` : `${manager} ${subcommand}`
}

async function runManager(subcommand, argument) {
  // Unified catalog layout first, legacy split-install path as fallback.
  // Only missing-helper failures fall through; real helper errors throw.
  const commands = [
    managerCommand(subcommand, argument, MANAGER_CATALOG),
    managerCommand(subcommand, argument, MANAGER_LEGACY)
  ]
  let lastError = null
  for (const command of commands) {
    let result = null
    try {
      result = await host.request('shell.exec', { command })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
    if (typeof result?.code === 'number' && result.code !== 0) {
      const message = result.stderr || `Hopper helper exited with ${result.code}`
      // Exit 127 / shell "not found" signals a missing helper -> try next path.
      // Any other non-zero exit is the helper reporting a real error.
      if (/not found|no such file|exit 127|^127$/i.test(message)) {
        lastError = new Error(message)
        continue
      }
      throw new Error(message)
    }
    return result
  }
  throw lastError ?? new Error('Hopper helper not found')
}

function encodeUtf8Base64(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function readModels() {
  const result = await runManager('dump')
  const stdout = typeof result?.stdout === 'string' ? result.stdout : ''
  return stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
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
  await runManager('replace-b64', encodeUtf8Base64(normalized))
  return models
}

function makeElement(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function scheduleFrame(callback) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback)
  return setTimeout(callback, 0)
}

function cancelFrame(frame) {
  if (frame === null) return
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
  else clearTimeout(frame)
}

function installModelSettings(ctx) {
  if (typeof document === 'undefined' || typeof MutationObserver !== 'function') return

  const overlaySelector = `[${OVERLAY_ATTR}]`
  let row = null
  let badges = null
  let mount = null
  let button = null
  let folderSlot = null
  let folderParent = null
  let folderNextSibling = null
  let modal = null
  let trigger = null
  let focusFrame = null
  let escapeListener = null
  let disposed = false
  let asyncGeneration = 0
  let syncing = false

  const restoreFolderSlot = () => {
    if (!folderSlot || !folderParent || folderSlot.parentNode === folderParent) return
    if (!folderParent.isConnected) return
    const next = folderNextSibling?.parentNode === folderParent ? folderNextSibling : null
    folderParent.insertBefore(folderSlot, next)
  }

  const removeFolderSlot = cell => {
    const spans = [...cell.children].filter(child => child.tagName === 'SPAN')
    const candidate = spans.at(-1)
    if (!candidate?.querySelector(FOLDER_ICON_SELECTOR)) return
    if (candidate === mount || candidate.hasAttribute(MOUNT_ATTR)) return
    if (!folderSlot) {
      folderSlot = candidate
      folderParent = candidate.parentNode
      folderNextSibling = candidate.nextSibling
    }
    candidate.remove()
  }

  // The unified package row carries an Agent-half switch that is a no-op for
  // model-provider plugins (provider discovery ignores plugins.enabled), so
  // it only misleads. Hide it behind the same dash the app renders for a
  // missing half. The switch node itself is kept (hidden, not removed) so
  // React reconciliation never loses its reference.
  const hideAgentToggle = scope => {
    const cells = scope?.querySelectorAll(ROW_CELLS_SELECTOR) ?? []
    const agentCell = cells[2] ?? null
    if (!agentCell || agentCell.hasAttribute(AGENT_CELL_ATTR)) return
    const toggle = agentCell.querySelector('button[role="switch"]')
    if (!toggle) return
    agentCell.setAttribute(AGENT_CELL_ATTR, 'true')
    toggle.style.display = 'none'
    const dash = document.createElement('span')
    dash.setAttribute(AGENT_DASH_ATTR, 'true')
    dash.setAttribute('aria-hidden', 'true')
    dash.className = 'w-9 text-center'
    dash.style.cssText = 'color:var(--ui-text-quaternary);'
    dash.textContent = '—'
    toggle.before(dash)
  }

  const restoreAgentToggle = () => {
    document.querySelectorAll(`[${AGENT_DASH_ATTR}]`).forEach(node => node.remove())
    document.querySelectorAll(`[${AGENT_CELL_ATTR}]`).forEach(cell => {
      cell.querySelectorAll('button[role="switch"]').forEach(toggle => {
        toggle.style.display = ''
      })
      cell.removeAttribute(AGENT_CELL_ATTR)
    })
  }

  const clearEscape = () => {    if (escapeListener) {
      window.removeEventListener('keydown', escapeListener)
      escapeListener = null
    }
  }

  const close = (restoreFocus = true) => {
    asyncGeneration += 1
    cancelFrame(focusFrame)
    focusFrame = null
    clearEscape()
    modal?.remove()
    modal = null
    const previousTrigger = trigger
    trigger = null
    if (restoreFocus && previousTrigger?.isConnected) previousTrigger.focus()
  }

  const unmount = () => {
    close(false)
    button?.removeEventListener('click', open)
    mount?.remove()
    restoreFolderSlot()
    restoreAgentToggle()
    row = null
    badges = null
    mount = null
    button = null
    folderSlot = null
    folderParent = null
    folderNextSibling = null
  }

  const renderModal = generation => {
    if (disposed || !modal || generation !== asyncGeneration) return
    const card = document.createElement('div')
    const titleId = 'hopper-model-settings-title'
    card.setAttribute('role', 'dialog')
    card.setAttribute('aria-modal', 'true')
    card.setAttribute('aria-labelledby', titleId)
    card.style.cssText = [
      'position:fixed', 'left:50%', 'top:50%', 'z-index:var(--z-modal)',
      'display:flex', 'width:min(28rem,92vw)', 'height:min(32rem,85vh)',
      'max-width:92vw', 'max-height:85vh', 'transform:translate(-50%,-50%)',
      'flex-direction:column', 'overflow:hidden', 'border:1px solid var(--stroke-nous)',
      'border-radius:var(--radius-xl,12px)',
      'background:var(--theme-background-seed,var(--ui-bg-chrome))',
      'color:var(--ui-text-primary)', 'box-shadow:var(--shadow-nous)'
    ].join(';')

    const header = document.createElement('header')
    header.style.cssText = 'display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:16px 16px 8px;'
    const title = document.createElement('h2')
    title.id = titleId
    title.textContent = 'OpenRouter models'
    title.style.cssText = 'margin:0;font-size:15px;font-weight:600;color:var(--ui-text-primary);'
    const closeButton = document.createElement('button')
    closeButton.type = 'button'
    closeButton.setAttribute('aria-label', 'Close Hopper model settings')
    closeButton.textContent = '×'
    closeButton.style.cssText = 'margin-left:auto;border:0;border-radius:4px;background:transparent;color:var(--ui-text-tertiary);cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;'
    closeButton.addEventListener('click', () => close())
    header.append(title, closeButton)

    const body = document.createElement('div')
    body.style.cssText = 'display:flex;min-height:0;flex:1;flex-direction:column;gap:10px;overflow-y:auto;overflow-x:hidden;padding:0 16px 12px;'
    const status = makeElement('div', '', 'Loading…')
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    status.style.cssText = 'flex:0 0 auto;font-size:12px;color:var(--ui-text-secondary);'
    const help = makeElement(
      'p', '',
      'One OpenRouter model ID per line. Blank lines and comments are ignored; duplicate IDs are saved once.'
    )
    help.style.cssText = 'flex:0 0 auto;margin:0;font-size:12px;line-height:1.5;color:var(--ui-text-secondary);'
    const textarea = document.createElement('textarea')
    textarea.setAttribute('aria-label', 'Hopper OpenRouter models')
    textarea.className = 'w-full min-h-48 resize-y rounded-md font-mono text-xs outline-none'
    textarea.placeholder = 'provider/model-id\nprovider/another-model:free'
    textarea.value = DEFAULT_TEXT
    textarea.style.cssText = [
      'width:100%', 'min-height:12rem', 'flex:1 1 auto', 'resize:vertical',
      'box-sizing:border-box', 'padding:10px', 'border:1px solid var(--ui-stroke-secondary)',
      'border-radius:var(--radius-md,6px)', 'background:var(--ui-base)',
      'color:var(--theme-background-seed,var(--ui-bg-chrome))', 'color-scheme:dark',
      'outline:none', 'overflow-x:hidden'
    ].join(';')
    textarea.addEventListener('focus', () => {
      textarea.style.borderColor = 'var(--ui-stroke-primary)'
    })
    textarea.addEventListener('blur', () => {
      textarea.style.borderColor = 'var(--ui-stroke-secondary)'
    })
    body.append(status, help, textarea)

    const actions = document.createElement('footer')
    actions.style.cssText = 'display:flex;flex:0 0 auto;align-items:center;gap:8px;border-top:1px solid var(--ui-stroke-tertiary);padding:12px 16px 16px;'
    const save = makeElement('button', '', 'Save models')
    save.type = 'button'
    save.style.cssText = 'cursor:pointer;border:1px solid var(--ui-stroke-secondary);border-radius:6px;background:transparent;color:var(--ui-text-primary);padding:5px 10px;font-size:12px;'
    const reset = makeElement('button', '', 'Reset Ling defaults')
    reset.type = 'button'
    reset.style.cssText = 'cursor:pointer;border:0;border-radius:6px;background:transparent;color:var(--ui-text-tertiary);padding:5px 10px;font-size:12px;'
    actions.append(save, reset)
    card.append(header, body, actions)
    modal.replaceChildren(card)

    let busy = false
    const setBusy = value => {
      busy = value
      textarea.disabled = value
      save.disabled = value
      reset.disabled = value
    }

    void readModels()
      .then(text => {
        if (disposed || !modal || generation !== asyncGeneration) return
        textarea.value = text
        status.textContent = `${validateModels(text).length} model(s)`
      })
      .catch(error => {
        if (disposed || !modal || generation !== asyncGeneration) return
        status.textContent = 'Using defaults'
        console.warn('[hopper] could not read model list', error)
      })

    save.addEventListener('click', () => {
      if (busy || disposed || !modal || generation !== asyncGeneration) return
      setBusy(true)
      status.textContent = 'Saving…'
      void writeModels(textarea.value)
        .then(models => {
          if (disposed || !modal || generation !== asyncGeneration) return
          textarea.value = models.join('\n')
          status.textContent = `${models.length} model(s) saved`
          host.notify({
            kind: 'success',
            message: 'Hopper model list saved. Reopen the model picker to refresh it.'
          })
        })
        .catch(error => {
          if (disposed || !modal || generation !== asyncGeneration) return
          status.textContent = 'Save failed'
          host.notifyError(error instanceof Error ? error.message : String(error), 'Hopper')
        })
        .finally(() => {
          if (generation === asyncGeneration) setBusy(false)
        })
    })

    reset.addEventListener('click', () => {
      if (busy || disposed || !modal || generation !== asyncGeneration) return
      textarea.value = DEFAULT_TEXT
      status.textContent = 'Defaults ready — save to apply'
      textarea.focus()
    })
  }

  const open = event => {
    event?.stopPropagation?.()
    if (disposed || modal || !document.body || !button) return
    trigger = button
    const generation = ++asyncGeneration
    modal = document.createElement('div')
    modal.setAttribute(OVERLAY_ATTR, 'true')
    modal.setAttribute('data-slot', 'dialog-overlay')
    modal.setAttribute('role', 'presentation')
    modal.style.cssText = 'position:fixed;inset:0;z-index:var(--z-modal-backdrop);display:flex;align-items:center;justify-content:center;background:rgb(0 0 0 / 22%);backdrop-filter:blur(0.125rem);overflow:hidden;'
    modal.addEventListener('click', event => {
      if (event.target === event.currentTarget) close()
    })
    escapeListener = event => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault()
        close()
        return
      }
      if (event.key === 'Tab' && modal) {
        const focusable = [...modal.querySelectorAll('button:not([disabled]), textarea:not([disabled]), [href], input:not([disabled]), select:not([disabled])')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable.at(-1)
        if (!modal.contains(document.activeElement)) {
          event.preventDefault()
          const target = event.shiftKey ? last : first
          target.focus()
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', escapeListener)
    document.body.append(modal)
    renderModal(generation)
    focusFrame = scheduleFrame(() => {
      focusFrame = null
      modal?.querySelector('[role="dialog"] button')?.focus()
    })
  }

  const sync = () => {
    if (disposed || syncing) return
    syncing = true
    try {
      const nextRow = document.querySelector(DETAIL_SELECTOR)
      const nextCell = nextRow?.querySelector(':scope > [role="cell"]') ?? null
      const nextBadges = nextRow?.querySelector(BADGES_SELECTOR) ?? null
      if (!nextRow || !nextCell || !nextBadges) {
        unmount()
        return
      }
      if (nextRow !== row || nextBadges !== badges) {
        unmount()
        row = nextRow
        badges = nextBadges
        removeFolderSlot(nextCell)
        mount = document.createElement('span')
        mount.className = 'inline-flex shrink-0 items-center'
        mount.setAttribute(MOUNT_ATTR, 'true')
        button = document.createElement('button')
        button.type = 'button'
        button.setAttribute('aria-label', 'Hopper OpenRouter model settings')
        button.className = 'inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-(--ui-stroke-secondary) bg-(--ui-bg-chrome) px-2 py-0.5 text-[0.6875rem] leading-4 text-(--ui-text-primary)'
        button.style.cssText = 'cursor:pointer;'
        const icon = document.createElement('i')
        icon.className = 'codicon codicon-settings-gear'
        icon.setAttribute('aria-hidden', 'true')
        const label = document.createElement('span')
        label.textContent = 'Settings'
        button.append(icon, label)
        button.addEventListener('click', open)
        mount.append(button)
        nextBadges.append(mount)
        hideAgentToggle(nextRow)
      } else {
        removeFolderSlot(nextCell)
        hideAgentToggle(nextRow)
      }
    } finally {
      syncing = false
    }
  }

  const observer = new MutationObserver(records => {
    if (disposed) return
    // The modal is deliberately outside the row. Ignore its own mutations so
    // rendering/loading cannot trigger observer loops or duplicate controls.
    if (modal && records.length && records.every(record => {
      if (modal.contains(record.target)) return true
      return [...record.addedNodes, ...record.removedNodes].some(node => node === modal || modal.contains(node))
    })) return
    sync()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
  sync()

  ctx.onDispose?.(() => {
    disposed = true
    asyncGeneration += 1
    observer.disconnect()
    unmount()
    document.querySelectorAll(overlaySelector).forEach(node => node.remove())
  })
}

export default {
  id: 'hopper',
  name: 'Hopper',
  description: DESCRIPTION,
  defaultEnabled: true,
  register(ctx) {
    installModelSettings(ctx)
  }
}
