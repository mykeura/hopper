// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Miguel Euraque

import {
  Button,
  PALETTE_AREA,
  ROUTES_AREA,
  SIDEBAR_NAV_AREA,
  Textarea,
  host
} from '@hermes/plugin-sdk'
import { useEffect, useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

const DESCRIPTION =
  'Hopper for @mykeura - Add and manage custom OpenRouter models in Hermes without modifying the core catalog.'

const DEFAULT_TEXT = [
  'inclusionai/ling-3.0-flash-vl:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'inclusionai/ling-3.0-flash-sante:free',
  'deepseek/deepseek-v4-flash-0731:free'
].join('\n')

function HopperPage({ ctx }) {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await ctx.rest('/models')
      setText(result?.text ?? '')
      setMessage(`${result?.count ?? 0} model(s) configured`)
    } catch (_) {
      setError(
        'Could not reach Hopper backend. Enable Hopper’s Agent half in Capabilities → Plugins and restart the gateway if needed.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const result = await ctx.rest('/models', {
        method: 'PUT',
        body: { text }
      })
      setText(result?.text ?? text)
      setMessage(`Saved ${result?.count ?? 0} model(s). Reopen the model picker to refresh the list.`)
      host.notify({ kind: 'success', message: 'Hopper model list saved' })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      setError(`Could not save the model list. ${detail}`)
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const result = await ctx.rest('/reset', { method: 'POST' })
      setText(result?.text ?? DEFAULT_TEXT)
      setMessage('Restored Hopper’s four default models.')
      host.notify({ kind: 'success', message: 'Hopper defaults restored' })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      setError(`Could not reset Hopper. ${detail}`)
    } finally {
      setSaving(false)
    }
  }

  return jsxs('div', {
    className: 'mx-auto flex h-full w-full max-w-3xl flex-col gap-5 overflow-auto p-6',
    children: [
      jsxs('div', {
        className: 'flex flex-col gap-1',
        children: [
          jsx('h1', {
            className: 'text-xl font-semibold text-foreground',
            children: 'Hopper'
          }),
          jsx('p', {
            className: 'text-sm text-(--ui-text-tertiary)',
            children: DESCRIPTION
          })
        ]
      }),
      jsxs('div', {
        className: 'flex flex-col gap-2',
        children: [
          jsx('div', {
            className: 'text-sm font-medium text-foreground',
            children: 'OpenRouter models'
          }),
          jsx('p', {
            className: 'text-xs text-(--ui-text-tertiary)',
            children:
              'One OpenRouter model ID per line. Remove a line to hide that model from Hopper, or add another valid OpenRouter model ID.'
          }),
          jsx(Textarea, {
            'aria-label': 'Hopper OpenRouter models',
            className: 'min-h-64 w-full font-mono text-xs',
            disabled: loading || saving,
            onChange: event => setText(event.target.value),
            placeholder: 'provider/model-id',
            value: text
          })
        ]
      }),
      jsxs('div', {
        className: 'flex flex-wrap items-center gap-2',
        children: [
          jsx(Button, {
            disabled: loading || saving,
            onClick: () => void save(),
            children: saving ? 'Saving…' : 'Save models'
          }),
          jsx(Button, {
            disabled: loading || saving,
            onClick: () => void reset(),
            variant: 'outline',
            children: 'Reset defaults'
          }),
          jsx(Button, {
            disabled: loading || saving,
            onClick: () => void load(),
            variant: 'ghost',
            children: 'Reload'
          })
        ]
      }),
      message
        ? jsx('p', {
            className: 'text-xs text-(--ui-text-tertiary)',
            children: message
          })
        : null,
      error
        ? jsx('p', {
            className: 'text-xs text-(--ui-danger,#f87171)',
            children: error
          })
        : null
    ]
  })
}

export default {
  id: 'hopper',
  name: 'Hopper',
  defaultEnabled: false,
  register(ctx) {
    ctx.registerMany([
      {
        id: 'page',
        area: ROUTES_AREA,
        data: { path: '/hopper' },
        render: () => jsx(HopperPage, { ctx })
      },
      {
        id: 'nav',
        area: SIDEBAR_NAV_AREA,
        data: {
          path: '/hopper',
          label: 'Hopper',
          codicon: 'symbol-enum'
        }
      },
      {
        id: 'open',
        area: PALETTE_AREA,
        data: {
          id: 'hopper.open',
          label: 'Hopper: Manage OpenRouter models',
          keywords: ['hopper', 'openrouter', 'models', 'provider'],
          run: () => host.navigate('/hopper')
        }
      }
    ])
  }
}
