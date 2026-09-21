#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalog = join(root, 'catalog')
const manifest = readFileSync(join(catalog, 'plugin.yaml'), 'utf8')
const desktop = readFileSync(join(catalog, 'desktop', 'plugin.js'), 'utf8')
const manager = join(catalog, 'manage.py')
const defaults = [
  'inclusionai/ling-3.0-flash-vl:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'inclusionai/ling-3.0-flash-sante:free'
]

assert.match(manifest, /^name:\s*hopper\s*$/m)
assert.match(manifest, /^kind:\s*model-provider\s*$/m)
assert.match(manifest, /^version:\s*1\.3\.0\s*$/m)
assert.match(manifest, /^license:\s*MIT\s*$/m)
assert.match(manifest, /^requires_hermes:\s*">=0\.21\.3"\s*$/m)
assert.match(manifest, /^\s*-\s*OPENROUTER_API_KEY\s*$/m)
assert.match(desktop, /ROUTES_AREA/)
assert.match(desktop, /SIDEBAR_NAV_AREA/)
assert.match(desktop, /PALETTE_AREA/)
assert.match(desktop, /plugins\/hopper\/manage\.py/)
assert.equal(existsSync(join(catalog, 'install.sh')), false, 'catalog package must not ship an installer')
assert.doesNotMatch(desktop, /\bdocument\b|\bMutationObserver\b|\bwindow\b/)
assert.doesNotMatch(desktop, /\bimport\s*\(/)
assert.doesNotMatch(desktop, /\beval\s*\(|\bnew\s+Function\b/)
assert.ok(statSync(manager).mode & 0o111, 'manage.py must be executable')
function shellScriptsUnder(directory) {
  const found = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) found.push(...shellScriptsUnder(path))
    else if (entry.name.endsWith('.sh')) found.push(path)
  }
  return found
}
assert.deepEqual(shellScriptsUnder(catalog), [], 'catalog package must not depend on .sh installers')

const hermesHome = mkdtempSync(join(tmpdir(), 'hopper-catalog-test-'))
const env = { ...process.env, HERMES_HOME: hermesHome }
delete env.HOPPER_MODELS_FILE
function runManager(args) {
  try {
    return execFileSync('python3', [manager, ...args], { env, encoding: 'utf8' })
  } catch (error) {
    // Some managed sandboxes report EPERM from Node's spawn wrapper even
    // after the child completed successfully. Preserve its successful output
    // while still surfacing genuine non-zero manager failures.
    if (error?.code === 'EPERM' && error?.status === 0 && typeof error.stdout === 'string') {
      return error.stdout
    }
    throw error
  }
}
try {
  const initial = runManager(['dump'])
  assert.deepEqual(initial.trim().split(/\r?\n/), defaults)
  const stored = join(hermesHome, 'plugin-data', 'hopper', 'models.txt')
  assert.ok(readFileSync(stored, 'utf8').includes(defaults[0]))

  const payload = Buffer.from('provider/custom\nprovider/custom\n').toString('base64')
  runManager(['replace-b64', payload])
  const deduped = runManager(['dump'])
  assert.deepEqual(deduped.trim().split(/\r?\n/), ['provider/custom'])
} finally {
  rmSync(hermesHome, { recursive: true, force: true })
}

console.log('catalog package checks passed')
