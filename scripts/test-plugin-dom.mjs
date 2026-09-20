#!/usr/bin/env node
/* Reproducible DOM contract test. Uses Hermes' existing jsdom installation. */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const jsdomPath = '/home/miguel/.hermes/hermes-agent/node_modules/jsdom'
const { JSDOM } = await import(pathToFileURL(`${jsdomPath}/lib/api.js`))
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'http://hopper.test/'
})
const { window } = dom
for (const key of ['window', 'document', 'MutationObserver', 'TextEncoder', 'btoa', 'atob']) {
  globalThis[key] = window[key] ?? globalThis[key]
}
globalThis.btoa = value => Buffer.from(value, 'binary').toString('base64')
globalThis.atob = value => Buffer.from(value, 'base64').toString('binary')
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0)
globalThis.cancelAnimationFrame = id => clearTimeout(id)

const calls = []
const notifications = []
globalThis.__hopperHost = {
  async request(type, payload) {
    calls.push({ type, payload })
    if (payload.command.endsWith(' dump')) {
      return { code: 0, stdout: 'provider/first\nprovider/first\nprovider/second\n' }
    }
    return { code: 0, stdout: 'Saved 2 model(s).\n' }
  },
  notify(message) { notifications.push({ type: 'success', message }) },
  notifyError(message, title) { notifications.push({ type: 'error', message, title }) }
}

const pluginSource = fs.readFileSync(path.join(root, 'desktop/plugin.js'), 'utf8')
assert.equal((pluginSource.match(/^import /gm) ?? []).length, 1, 'only the SDK import is allowed')
assert.match(pluginSource, /from ['"]@hermes\/plugin-sdk['"]/)
const moduleSource = pluginSource
  .replace("import { host } from '@hermes/plugin-sdk'", 'const host = __hopperHost')
  .replace('export default {', 'globalThis.__hopperPlugin = {')
new Function('__hopperHost', moduleSource)(globalThis.__hopperHost)
const plugin = globalThis.__hopperPlugin

function row(testId, withFolder = true) {
  const value = document.createElement('div')
  value.dataset.testid = testId
  value.setAttribute('role', 'row')
  const cell = document.createElement('div')
  cell.setAttribute('role', 'cell')
  const detail = document.createElement('div')
  detail.className = 'min-w-0 flex-1'
  const badges = document.createElement('div')
  badges.className = 'flex flex-wrap'
  detail.append(badges)
  cell.append(detail)
  if (withFolder) {
    const slot = document.createElement('span')
    slot.className = 'flex size-7 shrink-0 items-center justify-center'
    const folder = document.createElement('button')
    folder.type = 'button'
    const icon = document.createElement('i')
    icon.className = 'codicon codicon-folder-opened'
    folder.append(icon)
    slot.append(folder)
    cell.append(slot)
  }
  value.append(cell, document.createElement('div'))
  return value
}

const other = row('plugin-row-desktop:other')
let hopper = row('plugin-row-desktop:hopper')
document.body.append(other, hopper)
let disposed = null
plugin.register({ onDispose(callback) { disposed = callback } })
const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  await Promise.resolve()
}
await flush()

const hopperRow = () => document.querySelector('[data-testid="plugin-row-desktop:hopper"]')
const settings = () => hopperRow()?.querySelectorAll('button[aria-label="Hopper OpenRouter model settings"]') ?? []
assert.equal(settings().length, 1, 'exactly one Settings button is mounted')
assert.equal(hopperRow().querySelectorAll('i.codicon-folder-opened').length, 0, 'only Hopper folder slot is removed')
assert.equal(other.querySelectorAll('i.codicon-folder-opened').length, 1, 'other rows keep their folder')
assert.equal(document.querySelectorAll('[data-hopper-model-overlay]').length, 0, 'editor is lazy and outside the row')
document.body.append(document.createElement('div'))
await flush()
assert.equal(settings().length, 1, 'unrelated mutations do not duplicate Settings')

hopperRow().dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
assert.equal(document.querySelectorAll('[data-hopper-model-overlay]').length, 0, 'row click does not open editor')
const settingsButton = settings()[0]
settingsButton.click()
await flush()
const overlay = document.querySelector('[data-hopper-model-overlay]')
const dialog = overlay.querySelector('[role="dialog"]')
assert.match(calls[0].payload.command, /manage\.py" dump$/)
assert.doesNotMatch(calls[0].payload.command, /dump ''/)
assert.ok(dialog && !hopperRow().contains(dialog), 'modal is outside the plugin row')
assert.equal(dialog.getAttribute('aria-modal'), 'true')
assert.equal(dialog.querySelector('h2').textContent, 'OpenRouter models')
assert.match(pluginSource, /width:min\(28rem,92vw\)/)
assert.match(pluginSource, /height:min\(32rem,85vh\)/)
assert.match(dialog.style.cssText, /var\(--stroke-nous\)/)
assert.match(dialog.style.cssText, /var\(--radius-xl,12px\)/)
assert.match(dialog.style.cssText, /var\(--shadow-nous\)/)
const textarea = dialog.querySelector('textarea')
assert.match(textarea.style.cssText, /background:\s*var\(--ui-base\)/)
assert.match(textarea.style.cssText, /color:\s*var\(--theme-background-seed,var\(--ui-bg-chrome\)\)/)
assert.match(textarea.style.cssText, /color-scheme:\s*dark/)
assert.match(textarea.style.cssText, /min-height:\s*12rem/)
assert.equal(dialog.querySelector('button:not([aria-label])').textContent, 'Save models')
assert.equal([...dialog.querySelectorAll('button')].some(button => button.textContent === 'Reset Ling defaults'), true)
const dialogButtons = [...dialog.querySelectorAll('button')]
const closeButton = dialogButtons.find(button => button.hasAttribute('aria-label'))
const lastFocusable = dialogButtons.at(-1)
lastFocusable.focus()
window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
assert.equal(document.activeElement, closeButton, 'Tab wraps from last to first')
closeButton.focus()
window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
assert.equal(document.activeElement, lastFocusable, 'Shift+Tab wraps from first to last')
await flush()

textarea.value = 'provider/temporary'
dialog.querySelector('button:not([aria-label]) + button').click()
assert.match(textarea.value, /inclusionai\/ling-3\.0-flash-vl:free/)
textarea.value = 'invalid-model-without-provider'
dialog.querySelector('button:not([aria-label])').click()
await flush()
assert.equal(notifications.filter(item => item.type === 'error').length, 1, 'invalid model reports an error')

textarea.value = 'provider/one\n# ignored\nprovider/one\nprovider/two:free\n'
dialog.querySelector('button:not([aria-label])').click()
await flush()
const replaceCall = calls.find(call => call.payload.command.includes(' replace-b64 '))
assert.ok(replaceCall, 'save uses replace-b64')
assert.doesNotMatch(replaceCall.payload.command, /python\s+[-][ce]/)
assert.doesNotMatch(replaceCall.payload.command, /provider\/one/)
const encoded = replaceCall.payload.command.match(/replace-b64 '([^']+)'/)[1]
assert.equal(Buffer.from(encoded, 'base64').toString('utf8'), 'provider/one\nprovider/two:free\n')
assert.equal(notifications.filter(item => item.type === 'success').length, 1)
textarea.value = ''
dialog.querySelector('button:not([aria-label])').click()
await flush()
const emptyReplace = [...calls].reverse().find(call => call.payload.command.includes(" replace-b64 ''"))
assert.ok(emptyReplace, 'empty catalog still invokes replace-b64 with an empty argument')
assert.equal(Buffer.from(emptyReplace.payload.command.match(/replace-b64 '([^']*)'/)[1], 'base64').toString('utf8'), '')

settingsButton.focus()
window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
assert.equal(document.querySelectorAll('[data-hopper-model-overlay]').length, 0, 'Escape closes modal')
assert.equal(document.activeElement, settingsButton, 'Escape restores focus')
settingsButton.click()
await flush()
document.querySelector('[data-hopper-model-overlay]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
assert.equal(document.querySelectorAll('[data-hopper-model-overlay]').length, 0, 'backdrop closes modal')
settingsButton.click()
await flush()
document.querySelector('[role="dialog"] [aria-label="Close Hopper model settings"]').click()
assert.equal(document.querySelectorAll('[data-hopper-model-overlay]').length, 0, 'close button closes modal')

const oldHopper = hopper
oldHopper.remove()
hopper = row('plugin-row-desktop:hopper')
document.body.append(hopper)
await flush()
assert.equal(settings().length, 1, 'remount keeps one Settings button')
assert.equal(hopper.querySelectorAll('i.codicon-folder-opened').length, 0, 'remounted Hopper folder is hidden')
const newButton = settings()[0]
newButton.click()
await flush()
assert.equal(document.querySelectorAll('[data-hopper-model-overlay]').length, 1, 'remounted button opens modal')
disposed()
await flush()
assert.equal(document.querySelectorAll('[data-hopper-model-overlay]').length, 0, 'dispose removes modal')
assert.equal(document.querySelectorAll(`[${'data-hopper-settings-mount'}]`).length, 0, 'dispose removes mount')
assert.equal(hopper.querySelectorAll('i.codicon-folder-opened').length, 1, 'dispose restores folder slot')
console.log(`DOM harness passed (${calls.length} host calls, ${notifications.length} notifications).`)
