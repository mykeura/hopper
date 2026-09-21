// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Miguel Euraque

import {
  Button,
  host,
  PALETTE_AREA,
  ROUTES_AREA,
  SIDEBAR_NAV_AREA,
  Textarea
} from '@hermes/plugin-sdk'
import { useEffect, useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

const DESCRIPTION =
  'Hopper by @mykeura - Add and manage custom OpenRouter models in Hermes without modifying the core catalog.'

const DEFAULT_MODELS = [
  'inclusionai/ling-3.0-flash-vl:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'inclusionai/ling-3.0-flash-sante:free'
]

const DEFAULT_TEXT = DEFAULT_MODELS.join('\n')
const MANAGER = '"${HERMES_HOME:-$HOME/.hermes}/plugins/hopper/manage.py"'

function managerCommand(subcommand, argument) {
  // The installed helper owns validation and file writes. The payload is
  // base64 in one quoted argument, so model IDs never become shell syntax.
  return argument === undefined
    ? `${MANAGER} ${subcommand}`
    : `${MANAGER} ${subcommand} '${argument}'`
}

function encodeUtf8Base64(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function readModels() {
  const result = await host.request('shell.exec', { command: managerCommand('dump') })
  if (typeof result?.code === 'number' && result.code !== 0) {
    throw new Error(result.stderr || `Hopper helper exited with ${result.code}`)
  }
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
    if (/\s/.test(model)) {
      throw new Error(`Line ${index + 1}: model IDs cannot contain whitespace.`)
    }
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
  const result = await host.request('shell.exec', {
    command: managerCommand('replace-b64', encodeUtf8Base64(normalized))
  })
  if (typeof result?.code === 'number' && result.code !== 0) {
    throw new Error(result.stderr || `Hopper helper exited with ${result.code}`)
  }
  return models
}

function HopperPage() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [status, setStatus] = useState('Loading…')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    void readModels()
      .then(value => {
        if (!active) return
        setText(value)
        setStatus(`${validateModels(value).length} model(s)`)
      })
      .catch(error => {
        if (!active) return
        setStatus('Using defaults')
        host.notifyError(error instanceof Error ? error.message : String(error), 'Hopper')
      })
    return () => {
      active = false
    }
  }, [])

  const save = async () => {
    if (busy) return
    setBusy(true)
    setStatus('Saving…')
    try {
      const models = await writeModels(text)
      setText(models.join('\n'))
      setStatus(`${models.length} model(s) saved`)
      host.notify({
        kind: 'success',
        message: 'Hopper model list saved. Reopen the model picker to refresh it.'
      })
    } catch (error) {
      setStatus('Save failed')
      host.notifyError(error instanceof Error ? error.message : String(error), 'Hopper')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    if (busy) return
    setText(DEFAULT_TEXT)
    setStatus('Defaults ready — save to apply')
  }

  return jsxs('main', {
    className: 'flex h-full min-h-0 w-full justify-center overflow-y-auto p-4 text-sm',
    children: jsx('section', {
      className: 'flex w-full max-w-lg min-w-0 flex-col gap-3',
      style: { maxWidth: 'min(28rem, 100%)' },
      children: [
        jsx('header', {
          className: 'flex flex-col gap-1',
          children: [
            jsx('h1', {
              className: 'text-base font-semibold text-(--ui-text-primary)',
              children: 'OpenRouter models'
            }),
            jsx('p', {
              className: 'text-xs leading-5 text-(--ui-text-secondary)',
              children: DESCRIPTION
            })
          ]
        }),
        jsx('div', {
          className: 'text-xs text-(--ui-text-secondary)',
          role: 'status',
          'aria-live': 'polite',
          children: status
        }),
        jsx('label', {
          className: 'text-xs font-medium text-(--ui-text-primary)',
          htmlFor: 'hopper-models',
          children: 'Model IDs'
        }),
        jsx('p', {
          className: 'm-0 text-xs leading-5 text-(--ui-text-secondary)',
          children:
            'One OpenRouter model ID per line. Blank lines and comments are ignored; duplicate IDs are saved once.'
        }),
        jsx(Textarea, {
          id: 'hopper-models',
          'aria-label': 'Hopper OpenRouter models',
          className: 'min-h-48 resize-y font-mono text-xs',
          disabled: busy,
          onChange: event => setText(event.currentTarget.value),
          placeholder: 'provider/model-id\nprovider/another-model:free',
          value: text
        }),
        jsxs('div', {
          className: 'flex flex-wrap items-center gap-2 pt-1',
          children: [
            jsx(Button, {
              disabled: busy,
              loading: busy,
              onClick: () => void save(),
              type: 'button',
              children: 'Save models'
            }),
            jsx(Button, {
              disabled: busy,
              onClick: reset,
              type: 'button',
              variant: 'ghost',
              children: 'Reset Ling defaults'
            })
          ]
        })
      ]
    })
  })
}

export default {
  id: 'hopper',
  name: 'Hopper',
  description: DESCRIPTION,
  register(ctx) {
    ctx.registerMany([
      {
        id: 'page',
        area: ROUTES_AREA,
        data: { path: '/hopper' },
        render: () => jsx(HopperPage, {})
      },
      {
        id: 'nav',
        area: SIDEBAR_NAV_AREA,
        order: 55,
        data: { path: '/hopper', label: 'Hopper', codicon: 'settings-gear' }
      },
      {
        id: 'open',
        area: PALETTE_AREA,
        data: {
          id: 'hopper.open',
          label: 'Hopper: Manage OpenRouter models',
          keywords: ['hopper', 'openrouter', 'models', 'catalog'],
          run: () => host.navigate('/hopper')
        }
      }
    ])
  }
}
