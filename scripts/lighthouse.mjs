import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'

const PORT = Number(process.env.LH_PORT ?? 4173)
const RUNS = Number(process.env.LH_RUNS ?? 3)
const REMOTE = process.env.LH_BASE_URL
const BASE = REMOTE ?? `http://localhost:${PORT}`
const SUFFIX = REMOTE ? '-deployed' : ''
const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'detalhe', path: '/nfts/nft_001' },
]
const PROFILES = ['mobile', 'desktop']
const METRICS = [
  ['largest-contentful-paint', 'LCP'],
  ['cumulative-layout-shift', 'CLS'],
  ['total-blocking-time', 'TBT'],
]

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function startPreview() {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const child = spawn(command, ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  return child
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(BASE)
      if (response.ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  throw new Error('preview server did not start')
}

function configFor(profile) {
  if (profile === 'desktop') {
    return {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    }
  }
  return { extends: 'lighthouse:default' }
}

const REPORT_DIR = `docs/lighthouse${SUFFIX}`

async function measure(url, profile, label) {
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  })
  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, output: ['json', 'html'], logLevel: 'error' },
      configFor(profile),
    )
    const { lhr } = result
    const [json, html] = result.report
    await writeFile(`${REPORT_DIR}/${label}.json`, json)
    await writeFile(`${REPORT_DIR}/${label}.html`, html)
    environment ??= {
      lighthouse: lhr.lighthouseVersion,
      chrome: lhr.environment.hostUserAgent,
      userAgent: lhr.environment.networkUserAgent,
    }
    const categories = Object.fromEntries(
      Object.entries(lhr.categories).map(([id, category]) => [
        id,
        Math.round(category.score * 100),
      ]),
    )
    const metrics = Object.fromEntries(
      METRICS.map(([id, label]) => [label, lhr.audits[id].numericValue]),
    )
    return { categories, metrics }
  } finally {
    await chrome.kill()
  }
}

const server = REMOTE ? null : startPreview()
const rows = []
let failed = false
let environment = null
await mkdir(REPORT_DIR, { recursive: true })

try {
  if (!REMOTE) await waitForServer()

  for (const page of PAGES) {
    for (const profile of PROFILES) {
      const runs = []
      for (let run = 0; run < RUNS; run += 1) {
        runs.push(
          await measure(`${BASE}${page.path}`, profile, `${page.name}-${profile}-run${run + 1}`),
        )
      }

      const scores = Object.fromEntries(
        Object.keys(TARGETS).map((id) => [id, median(runs.map((r) => r.categories[id]))]),
      )
      const metrics = Object.fromEntries(
        METRICS.map(([, label]) => [label, median(runs.map((r) => r.metrics[label]))]),
      )
      const passed = Object.entries(TARGETS).every(([id, minimum]) => scores[id] >= minimum)
      failed ||= !passed
      rows.push({ page: page.name, profile, scores, metrics, passed, runs: runs.length })
      console.log(
        `${page.name}/${profile}: perf ${scores.performance} a11y ${scores.accessibility} bp ${scores['best-practices']} seo ${scores.seo} | LCP ${Math.round(metrics.LCP)}ms CLS ${metrics.CLS.toFixed(3)} TBT ${Math.round(metrics.TBT)}ms ${passed ? 'OK' : 'BELOW TARGET'}`,
      )
    }
  }
} finally {
  server?.kill()
}

const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
const meta = {
  generatedAt: new Date().toISOString(),
  runsPerCombination: RUNS,
  targets: TARGETS,
  tools: {
    lighthouse: environment?.lighthouse,
    chrome: environment?.chrome,
    node: process.version,
    vite: packageJson.devDependencies?.vite,
    app: REMOTE
      ? `${REMOTE} (Vercel: CDN, HTTP/2 e Brotli; build de produção, mocks ligados, cenário default)`
      : 'vite preview (build de produção, mocks ligados, cenário default)',
  },
  host: {
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: os.cpus()[0]?.model,
    cores: os.cpus().length,
    memoryGB: Math.round(os.totalmem() / 1024 ** 3),
  },
  throttling: {
    mobile:
      'padrão do Lighthouse: 4G simulado (1,6 Mbps, 150 ms RTT), CPU 4x mais lenta, Moto G Power',
    desktop: '10 Mbps, 40 ms RTT, sem redução de CPU, 1350x940',
  },
  aggregation: 'mediana das execuções por categoria e por métrica',
}

await mkdir('docs', { recursive: true })
const lines = [
  '| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(
    (row) =>
      `| ${row.page} | ${row.profile} | ${row.scores.performance} | ${row.scores.accessibility} | ${row.scores['best-practices']} | ${row.scores.seo} | ${Math.round(row.metrics.LCP)} ms | ${row.metrics.CLS.toFixed(3)} | ${Math.round(row.metrics.TBT)} ms |`,
  ),
]
await writeFile(`docs/lighthouse${SUFFIX}-results.md`, `${lines.join('\n')}\n`)
await writeFile(
  `docs/lighthouse${SUFFIX}-results.json`,
  `${JSON.stringify({ meta, results: rows }, null, 2)}\n`,
)

process.exit(failed ? 1 : 0)
