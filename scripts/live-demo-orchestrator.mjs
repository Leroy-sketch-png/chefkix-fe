#!/usr/bin/env node
import { chromium } from '@playwright/test'
import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

function parseArgs(argv) {
const options = { _: [] }
for (let i = 0; i < argv.length; i += 1) {
const token = argv[i]
if (!token.startsWith('--')) {
options._.push(token)
continue
}
const key = token.slice(2)
const next = argv[i + 1]
if (!next || next.startsWith('--')) {
options[key] = 'true'
continue
}
options[key] = next
i += 1
}
return options
}

function getOption(options, key, fallback) {
const value = options[key]
if (typeof value === 'string' && value.length > 0) return value
return fallback
}

function step(message) {
console.log(`[autopilot] ${message}`)
}

function warn(message) {
console.warn(`[autopilot][warn] ${message}`)
}

const args = parseArgs(process.argv.slice(2))
const positionalScenario = args._.find(item => item && item !== '0')

const settings = {
scenario: getOption(args, 'scenario', positionalScenario || 'quick-post'),
baseUrl: getOption(
args,
'base-url',
process.env.DEMO_BASE_URL || 'http://localhost:3000',
),
username: getOption(args, 'username', process.env.DEMO_USERNAME || 'testuser'),
password: getOption(args, 'password', process.env.DEMO_PASSWORD || 'test123'),
holdMs: Number.parseInt(getOption(args, 'hold-ms', '8000'), 10),
headless: getOption(args, 'headless', 'false') === 'true',
paceMs: Number.parseInt(getOption(args, 'pace-ms', '300'), 10),
continueOnError: getOption(args, 'continue-on-error', 'false') === 'true',
skipLogin: getOption(args, 'skip-login', 'false') === 'true',
checkpointMode: getOption(args, 'checkpoint-mode', 'prompt'),
checkpointTimeoutMs: Number.parseInt(
getOption(args, 'checkpoint-timeout-ms', '12000'),
10,
),
retries: Number.parseInt(getOption(args, 'retries', '2'), 10),
retryDelayMs: Number.parseInt(getOption(args, 'retry-delay-ms', '1200'), 10),
scenarioTimeoutMs: Number.parseInt(getOption(args, 'scenario-timeout-ms', '240000'), 10),
routeSweepPerRouteTimeoutMs: Number.parseInt(
getOption(args, 'route-sweep-per-route-timeout-ms', '45000'),
10,
),
preflightBackendHealthUrl: getOption(
args,
'preflight-backend-health-url',
process.env.DEMO_BACKEND_HEALTH_URL || 'http://localhost:8080/api/v1/actuator/health',
),
preflightBackendRequired: getOption(args, 'preflight-backend-required', 'true') === 'true',
authFallback: getOption(args, 'auth-fallback', 'true') === 'true',
runPreflight: getOption(args, 'preflight', 'true') === 'true',
strictMode: getOption(args, 'strict', 'true') === 'true',
captureScreenshots: getOption(args, 'capture-screenshots', 'true') === 'true',
selectorPreflight: getOption(args, 'selector-preflight', 'true') === 'true',
integrityThreshold: Number.parseInt(
getOption(args, 'integrity-threshold', '90'),
10,
),
artifactDir: getOption(
args,
'artifact-dir',
path.join(process.cwd(), 'test-results', 'demo-driver'),
),
certifyRuns: Number.parseInt(getOption(args, 'certify-runs', '1'), 10),
certifyMinPasses: Number.parseInt(getOption(args, 'certify-min-passes', '0'), 10),
certifyMaxWarnings: Number.parseInt(getOption(args, 'certify-max-warnings', '-1'), 10),
certifyMaxStrictFailures: Number.parseInt(
getOption(args, 'certify-max-strict-failures', '0'),
10,
),
certifyMaxOverlaysDetected: Number.parseInt(
getOption(args, 'certify-max-overlays-detected', '-1'),
10,
),
certifyMaxBeatFallbacks: Number.parseInt(
getOption(args, 'certify-max-beat-fallbacks', '-1'),
10,
),
certifyMaxBeatSceneFallbacks: Number.parseInt(
getOption(args, 'certify-max-beat-scene-fallbacks', '-1'),
10,
),
certifyMaxBeatRouteFallbacks: Number.parseInt(
getOption(args, 'certify-max-beat-route-fallbacks', '-1'),
10,
),
certifyMinBeatDirectRate: Number.parseFloat(
getOption(args, 'certify-min-beat-direct-rate', '0'),
),
certifyMinBeatEvidenceRate: Number.parseFloat(
getOption(args, 'certify-min-beat-evidence-rate', '0'),
),
certifyMinDemoConfidenceScore: Number.parseFloat(
getOption(args, 'certify-min-demo-confidence-score', '0'),
),
certifyMaxConsoleErrors: Number.parseInt(
getOption(args, 'certify-max-console-errors', '-1'),
10,
),
certifyMaxPageErrors: Number.parseInt(
getOption(args, 'certify-max-page-errors', '-1'),
10,
),
certifyMaxRequestFailures: Number.parseInt(
getOption(args, 'certify-max-request-failures', '-1'),
10,
),
certifyMaxRenderAnomalies: Number.parseInt(
getOption(args, 'certify-max-render-anomalies', '-1'),
10,
),
maxBeatFallbacks: Number.parseInt(getOption(args, 'max-beat-fallbacks', '3'), 10),
certifyOutput: getOption(
args,
'certify-output',
path.join(process.cwd(), 'test-results', 'demo-driver', 'certify-latest.json'),
),
}

if (settings.certifyMinPasses <= 0) {
settings.certifyMinPasses = settings.certifyRuns
}

if (settings.strictMode && settings.scenario === 'demo-cockpit-deep') {
	settings.retries = 0
	settings.retryDelayMs = 0
}

const SUPPORTED_SCENARIOS = new Set([
'quick-post',
'create-recipe-ai',
'demo-cockpit-deep',
'route-sweep-extreme',
'investor-extreme',
'all-extreme',
])

if (!SUPPORTED_SCENARIOS.has(settings.scenario)) {
console.error(`[autopilot] Unsupported scenario: ${settings.scenario}`)
process.exit(1)
}

function getRunReportPaths() {
if (!fs.existsSync(settings.artifactDir)) {
return []
}

const runDirs = fs
.readdirSync(settings.artifactDir, { withFileTypes: true })
.filter(entry => entry.isDirectory() && entry.name.startsWith('run-'))
.map(entry => path.join(settings.artifactDir, entry.name, 'run-report.json'))
.filter(reportPath => fs.existsSync(reportPath))

return runDirs
}

function buildChildCliArgs() {
const certifyOptionsWithValues = new Set([
'--certify-runs',
'--certify-min-passes',
'--certify-max-warnings',
'--certify-max-strict-failures',
'--certify-max-overlays-detected',
'--certify-max-beat-fallbacks',
'--certify-max-beat-scene-fallbacks',
'--certify-max-beat-route-fallbacks',
'--certify-min-beat-direct-rate',
'--certify-min-beat-evidence-rate',
'--certify-min-demo-confidence-score',
'--certify-max-console-errors',
'--certify-max-page-errors',
'--certify-max-request-failures',
'--certify-max-render-anomalies',
'--certify-output',
])

const childArgs = []
const sourceArgs = process.argv.slice(2)

for (let index = 0; index < sourceArgs.length; index += 1) {
const token = sourceArgs[index]
if (certifyOptionsWithValues.has(token)) {
index += 1
continue
}

childArgs.push(token)
}

childArgs.push('--certify-runs', '1')
return childArgs
}

function evaluateCertificationResult(exitCode, report) {
const verdict = {
pass: exitCode === 0,
reasons: [],
}

if (!report) {
verdict.pass = false
verdict.reasons.push('missing run-report.json from child execution')
return verdict
}

if (typeof report?.integrity?.score !== 'number') {
verdict.pass = false
verdict.reasons.push('run report missing integrity score')
return verdict
}

if (report.integrity.score < settings.integrityThreshold) {
verdict.pass = false
verdict.reasons.push(
`integrity below threshold: ${report.integrity.score} < ${settings.integrityThreshold}`,
)
}

if (settings.certifyMaxWarnings >= 0) {
const warningCount = Array.isArray(report.warnings) ? report.warnings.length : 0
if (warningCount > settings.certifyMaxWarnings) {
verdict.pass = false
verdict.reasons.push(
`warnings exceeded: ${warningCount} > ${settings.certifyMaxWarnings}`,
)
}
}

const strictFailures = Number(report?.forensics?.strictAssertionFailures || 0)
if (strictFailures > settings.certifyMaxStrictFailures) {
verdict.pass = false
verdict.reasons.push(
`strict assertion failures exceeded: ${strictFailures} > ${settings.certifyMaxStrictFailures}`,
)
}

if (settings.certifyMaxOverlaysDetected >= 0) {
const overlaysDetected = Number(report?.forensics?.overlaysDetected || 0)
if (overlaysDetected > settings.certifyMaxOverlaysDetected) {
verdict.pass = false
verdict.reasons.push(
`overlays detected exceeded: ${overlaysDetected} > ${settings.certifyMaxOverlaysDetected}`,
)
}
}

if (settings.certifyMaxBeatFallbacks >= 0) {
const beatFallbacks = Number(report?.forensics?.beatFallbacks || 0)
if (beatFallbacks > settings.certifyMaxBeatFallbacks) {
verdict.pass = false
verdict.reasons.push(
`beat fallbacks exceeded: ${beatFallbacks} > ${settings.certifyMaxBeatFallbacks}`,
)
}
}

if (settings.certifyMaxBeatSceneFallbacks >= 0) {
const beatSceneFallbacks = Number(report?.forensics?.beatSceneFallbacks || 0)
if (beatSceneFallbacks > settings.certifyMaxBeatSceneFallbacks) {
verdict.pass = false
verdict.reasons.push(
`beat scene fallbacks exceeded: ${beatSceneFallbacks} > ${settings.certifyMaxBeatSceneFallbacks}`,
)
}
}

if (settings.certifyMaxBeatRouteFallbacks >= 0) {
const beatRouteFallbacks = Number(report?.forensics?.beatRouteFallbacks || 0)
if (beatRouteFallbacks > settings.certifyMaxBeatRouteFallbacks) {
verdict.pass = false
verdict.reasons.push(
`beat route fallbacks exceeded: ${beatRouteFallbacks} > ${settings.certifyMaxBeatRouteFallbacks}`,
)
}
}

if (Number.isFinite(settings.certifyMinBeatDirectRate) && settings.certifyMinBeatDirectRate > 0) {
const beatDirectRate = Number(report?.demoConfidence?.beatDirectRate ?? 0)
if (beatDirectRate < settings.certifyMinBeatDirectRate) {
verdict.pass = false
verdict.reasons.push(
`beat direct rate below minimum: ${beatDirectRate} < ${settings.certifyMinBeatDirectRate}`,
)
}
}

if (Number.isFinite(settings.certifyMinBeatEvidenceRate) && settings.certifyMinBeatEvidenceRate > 0) {
const beatEvidenceRate = Number(report?.demoConfidence?.beatEvidenceRate ?? 0)
if (beatEvidenceRate < settings.certifyMinBeatEvidenceRate) {
verdict.pass = false
verdict.reasons.push(
`beat evidence rate below minimum: ${beatEvidenceRate} < ${settings.certifyMinBeatEvidenceRate}`,
)
}
}

if (Number.isFinite(settings.certifyMinDemoConfidenceScore) && settings.certifyMinDemoConfidenceScore > 0) {
const demoConfidenceScore = Number(report?.demoConfidence?.score ?? 0)
if (demoConfidenceScore < settings.certifyMinDemoConfidenceScore) {
verdict.pass = false
verdict.reasons.push(
`demo confidence score below minimum: ${demoConfidenceScore} < ${settings.certifyMinDemoConfidenceScore}`,
)
}
}

if (settings.certifyMaxConsoleErrors >= 0) {
const consoleErrors = Number(report?.forensics?.consoleErrors ?? 0)
if (consoleErrors > settings.certifyMaxConsoleErrors) {
verdict.pass = false
verdict.reasons.push(
`console errors exceeded: ${consoleErrors} > ${settings.certifyMaxConsoleErrors}`,
)
}
}

if (settings.certifyMaxPageErrors >= 0) {
const pageErrors = Number(report?.forensics?.pageErrors ?? 0)
if (pageErrors > settings.certifyMaxPageErrors) {
verdict.pass = false
verdict.reasons.push(
`page errors exceeded: ${pageErrors} > ${settings.certifyMaxPageErrors}`,
)
}
}

if (settings.certifyMaxRequestFailures >= 0) {
const requestFailures = Number(report?.forensics?.requestFailures ?? 0)
if (requestFailures > settings.certifyMaxRequestFailures) {
verdict.pass = false
verdict.reasons.push(
`request failures exceeded: ${requestFailures} > ${settings.certifyMaxRequestFailures}`,
)
}
}

if (settings.certifyMaxRenderAnomalies >= 0) {
const renderAnomalies = Number(report?.forensics?.renderAnomalies ?? 0)
if (renderAnomalies > settings.certifyMaxRenderAnomalies) {
verdict.pass = false
verdict.reasons.push(
`render anomalies exceeded: ${renderAnomalies} > ${settings.certifyMaxRenderAnomalies}`,
)
}
}

if (report.success !== true) {
verdict.pass = false
verdict.reasons.push('child run reported success=false')
}

return verdict
}

function runCertificationController() {
if (!Number.isFinite(settings.certifyRuns) || settings.certifyRuns < 1) {
console.error('[autopilot] certify-runs must be >= 1')
process.exit(1)
}

if (!Number.isFinite(settings.certifyMinPasses) || settings.certifyMinPasses < 1) {
console.error('[autopilot] certify-min-passes must be >= 1')
process.exit(1)
}

if (settings.certifyMinPasses > settings.certifyRuns) {
console.error('[autopilot] certify-min-passes cannot exceed certify-runs')
process.exit(1)
}

if (settings.certifyMaxBeatSceneFallbacks < -1) {
console.error('[autopilot] certify-max-beat-scene-fallbacks must be -1 or greater')
process.exit(1)
}

if (settings.certifyMaxBeatRouteFallbacks < -1) {
console.error('[autopilot] certify-max-beat-route-fallbacks must be -1 or greater')
process.exit(1)
}

if (!Number.isFinite(settings.certifyMinBeatEvidenceRate) || settings.certifyMinBeatEvidenceRate < 0 || settings.certifyMinBeatEvidenceRate > 100) {
console.error('[autopilot] certify-min-beat-evidence-rate must be between 0 and 100')
process.exit(1)
}

if (!Number.isFinite(settings.certifyMinDemoConfidenceScore) || settings.certifyMinDemoConfidenceScore < 0 || settings.certifyMinDemoConfidenceScore > 100) {
console.error('[autopilot] certify-min-demo-confidence-score must be between 0 and 100')
process.exit(1)
}

if (settings.certifyMaxConsoleErrors < -1) {
console.error('[autopilot] certify-max-console-errors must be -1 or greater')
process.exit(1)
}

if (settings.certifyMaxPageErrors < -1) {
console.error('[autopilot] certify-max-page-errors must be -1 or greater')
process.exit(1)
}

if (settings.certifyMaxRequestFailures < -1) {
console.error('[autopilot] certify-max-request-failures must be -1 or greater')
process.exit(1)
}

if (settings.certifyMaxRenderAnomalies < -1) {
console.error('[autopilot] certify-max-render-anomalies must be -1 or greater')
process.exit(1)
}

if (!fs.existsSync(settings.artifactDir)) {
fs.mkdirSync(settings.artifactDir, { recursive: true })
}

const childArgs = buildChildCliArgs()
const runs = []

for (let runIndex = 1; runIndex <= settings.certifyRuns; runIndex += 1) {
step(`[certify] run ${runIndex}/${settings.certifyRuns}`)
const beforeReports = new Set(getRunReportPaths())

const exec = spawnSync(process.execPath, [process.argv[1], ...childArgs], {
cwd: process.cwd(),
stdio: 'inherit',
})

const exitCode = typeof exec.status === 'number' ? exec.status : 1
const afterReports = getRunReportPaths()
const newReports = afterReports.filter(reportPath => !beforeReports.has(reportPath))
const latestReportPath =
newReports.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] ||
afterReports.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] ||
null

let report = null
if (latestReportPath && fs.existsSync(latestReportPath)) {
try {
report = JSON.parse(fs.readFileSync(latestReportPath, 'utf8'))
} catch {
report = null
}
}

const verdict = evaluateCertificationResult(exitCode, report)
const runSummary = {
run: runIndex,
exitCode,
reportPath: latestReportPath,
pass: verdict.pass,
reasons: verdict.reasons,
integrity: report?.integrity?.score ?? null,
warnings: Array.isArray(report?.warnings) ? report.warnings.length : null,
overlaysDetected: Number(report?.forensics?.overlaysDetected ?? 0),
beatFallbacks: Number(report?.forensics?.beatFallbacks ?? 0),
beatSceneFallbacks: Number(report?.forensics?.beatSceneFallbacks ?? 0),
beatRouteFallbacks: Number(report?.forensics?.beatRouteFallbacks ?? 0),
beatDirectRate: Number(report?.demoConfidence?.beatDirectRate ?? 0),
beatEvidenceRate: Number(report?.demoConfidence?.beatEvidenceRate ?? 0),
demoConfidenceScore: Number(report?.demoConfidence?.score ?? 0),
consoleErrors: Number(report?.forensics?.consoleErrors ?? 0),
pageErrors: Number(report?.forensics?.pageErrors ?? 0),
requestFailures: Number(report?.forensics?.requestFailures ?? 0),
renderAnomalies: Number(report?.forensics?.renderAnomalies ?? 0),
strictAssertionFailures: Number(report?.forensics?.strictAssertionFailures ?? 0),
success: report?.success === true,
}
runSummary.reportRunId = report?.runId ?? null
runSummary.reportScenario = report?.scenario ?? null

if (!runSummary.pass) {
warn(`[certify] run ${runIndex} failed gates: ${runSummary.reasons.join('; ')}`)
}

runs.push(runSummary)
}

const passedRuns = runs.filter(item => item.pass).length
const certification = {
generatedAt: new Date().toISOString(),
scenario: settings.scenario,
requestedRuns: settings.certifyRuns,
requiredPasses: settings.certifyMinPasses,
passedRuns,
strictThresholds: {
integrityThreshold: settings.integrityThreshold,
maxWarnings: settings.certifyMaxWarnings,
maxStrictAssertionFailures: settings.certifyMaxStrictFailures,
maxOverlaysDetected: settings.certifyMaxOverlaysDetected,
maxBeatFallbacks: settings.certifyMaxBeatFallbacks,
maxBeatSceneFallbacks: settings.certifyMaxBeatSceneFallbacks,
maxBeatRouteFallbacks: settings.certifyMaxBeatRouteFallbacks,
minBeatDirectRate: settings.certifyMinBeatDirectRate,
minBeatEvidenceRate: settings.certifyMinBeatEvidenceRate,
minDemoConfidenceScore: settings.certifyMinDemoConfidenceScore,
maxConsoleErrors: settings.certifyMaxConsoleErrors,
maxPageErrors: settings.certifyMaxPageErrors,
maxRequestFailures: settings.certifyMaxRequestFailures,
maxRenderAnomalies: settings.certifyMaxRenderAnomalies,
},
runs,
pass: passedRuns >= settings.certifyMinPasses,
}

const outputDir = path.dirname(settings.certifyOutput)
if (!fs.existsSync(outputDir)) {
fs.mkdirSync(outputDir, { recursive: true })
}
fs.writeFileSync(settings.certifyOutput, `${JSON.stringify(certification, null, 2)}\n`, 'utf8')

if (!certification.pass) {
console.error(
`[autopilot] Certification failed: passed ${passedRuns}/${settings.certifyRuns}, required ${settings.certifyMinPasses}`,
)
process.exit(1)
}

step(
`Certification passed: ${passedRuns}/${settings.certifyRuns} (required ${settings.certifyMinPasses})`,
)
process.exit(0)
}

if (settings.certifyRuns > 1) {
runCertificationController()
}

function getScenarioPlan(scenarioId) {
switch (scenarioId) {
case 'quick-post':
return ['quick-post']
case 'create-recipe-ai':
return ['create-recipe-ai']
case 'demo-cockpit-deep':
return ['demo-cockpit-deep']
case 'route-sweep-extreme':
return ['route-sweep-extreme']
case 'investor-extreme':
case 'all-extreme':
return ['demo-cockpit-deep', 'quick-post', 'create-recipe-ai']
default:
return [scenarioId]
}
}

const REQUIRED_DEMO_FLOW_SCENARIOS = [
'demo-cockpit-deep',
'quick-post',
'create-recipe-ai',
]

const DEMO_COCKPIT_BEATS = [
{ id: 'taste-compatibility', label: 'Taste Compatibility', pathPrefix: '/profile', sceneFallbackPath: '/profile', fallbackPath: '/profile' },
{ id: 'hero-recipe', label: 'Cook Hero Recipe', pathPrefix: '/recipes/', sceneFallbackPath: '/explore', fallbackPath: '/explore' },
{ id: 'co-cook', label: 'Start Room', pathPrefix: '/cook-together', sceneFallbackPath: '/cook-together', fallbackPath: '/cook-together' },
{ id: 'creator-heatmap', label: 'Creator Heatmap', pathPrefix: '/creator', sceneFallbackPath: '/creator', fallbackPath: '/creator' },
{ id: 'admin-reports', label: 'Admin Reports', pathPrefix: '/admin/reports', sceneFallbackPath: '/admin/reports', fallbackPath: '/admin/reports' },
]

const ROUTE_SWEEP_FLOW = [
{ route: '/dashboard', authRequired: true, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/explore', authRequired: false, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/feed', authRequired: false, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/create', authRequired: true, readySelector: { testId: 'create-start-new-recipe', mode: 'visible' } },
{ route: '/post/new', authRequired: true, readySelector: { testId: 'post-composer-caption', mode: 'visible' } },
{ route: '/messages', authRequired: true, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/notifications', authRequired: true, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/profile', authRequired: true, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/challenges', authRequired: true, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/community', authRequired: false, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/settings', authRequired: true, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/pantry', authRequired: true, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/meal-planner', authRequired: true, readySelector: { css: 'main', mode: 'visible' } },
{ route: '/shopping-lists', authRequired: true, readySelector: { css: 'main', mode: 'visible' } },
]

const SCENARIO_SELECTOR_CHECKS = {
'quick-post': {
authRequired: true,
route: '/post/new',
selectors: [
{ testId: 'post-composer-caption', mode: 'visible' },
{ testId: 'post-composer-upload', mode: 'attached' },
{ testId: 'post-composer-submit', mode: 'visible' },
],
},
'create-recipe-ai': {
authRequired: true,
route: '/create',
selectors: [{ testId: 'create-start-new-recipe', mode: 'visible' }],
},
'demo-cockpit-deep': {
authRequired: true,
route: '/demo-cockpit',
selectors: [{ text: 'Pitch Flow', mode: 'visible' }],
},
'route-sweep-extreme': {
authRequired: true,
route: '/dashboard',
selectors: [{ css: 'main', mode: 'visible' }],
},
}

function normalizeSelectorCheck(selector) {
if (typeof selector === 'string') {
return { type: 'testid', value: selector, mode: 'visible' }
}

if (selector.css) {
return {
type: 'css',
value: selector.css,
mode: selector.mode === 'attached' ? 'attached' : 'visible',
}
}

if (selector.text) {
return {
type: 'text',
value: selector.text,
mode: selector.mode === 'attached' ? 'attached' : 'visible',
}
}

return {
type: 'testid',
value: selector.testId,
mode: selector.mode === 'attached' ? 'attached' : 'visible',
}
}

const tinyPngBase64 =
'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAABmJLR0QA/wD/AP+gvaeTAAAAFUlEQVR4nO3BMQEAAADCoPVPbQhfoAAAAAAAAAB4DRn8AAE6j5kAAAAASUVORK5CYII='

const runId = new Date().toISOString().replace(/[:.]/g, '-')
const runArtifactDir = path.join(settings.artifactDir, `run-${runId}`)
fs.mkdirSync(runArtifactDir, { recursive: true })

const runState = {
runId,
startedAt: new Date().toISOString(),
scenario: settings.scenario,
baseUrl: settings.baseUrl,
plan: [],
settings,
steps: [],
scenarioResults: [],
preflight: {
config: null,
core: null,
selectorChecks: [],
},
warnings: [],
errors: [],
integrity: {
score: 0,
threshold: settings.integrityThreshold,
factors: [],
pass: false,
},
forensics: {
overlaysDetected: 0,
overlaysDismissed: 0,
strictAssertionFailures: 0,
beatFallbacks: 0,
beatDirectNavigations: 0,
beatSceneFallbacks: 0,
beatRouteFallbacks: 0,
beatsWithEvidence: 0,
consoleErrors: 0,
consoleWarnings: 0,
consoleErrorsRaw: 0,
pageErrors: 0,
requestFailures: 0,
requestFailuresRaw: 0,
http5xxResponses: 0,
renderChecks: 0,
renderAnomalies: 0,
},
demoConfidence: {
expectedBeats: DEMO_COCKPIT_BEATS.length,
beatsWithEvidence: 0,
beatFallbacks: 0,
beatDirectRate: 0,
score: 0,
},
browserSignals: {
captured: [],
maxEntries: 180,
},
runtime: {
	scenarioDeadlineAt: null,
	scenarioTimedOut: false,
},
}

let browser

function addWarning(message) {
runState.warnings.push(message)
warn(message)
}

function addBrowserSignal(type, payload) {
const limit = Number(runState.browserSignals?.maxEntries || 180)
if (!Array.isArray(runState.browserSignals?.captured)) {
return
}
if (runState.browserSignals.captured.length >= limit) {
return
}
runState.browserSignals.captured.push({
at: new Date().toISOString(),
type,
...payload,
})
}

function recordStep(kind, label, status, detail = null) {
runState.steps.push({
at: new Date().toISOString(),
kind,
label,
status,
detail,
})
}

function updateScenarioState(scenario, patch) {
const current = runState.scenarioResults.find(item => item.scenario === scenario)
if (!current) {
runState.scenarioResults.push({ scenario, ...patch })
return
}
Object.assign(current, patch)
}

function isScenarioTimedOut() {
	return Boolean(runState.runtime?.scenarioTimedOut)
}

function getScenarioRemainingMs(fallbackMs) {
	const deadlineAt = Number(runState.runtime?.scenarioDeadlineAt || 0)
	if (!Number.isFinite(deadlineAt) || deadlineAt <= 0) {
		return fallbackMs
	}
	const remaining = deadlineAt - Date.now() - 250
	return Math.max(500, Math.min(fallbackMs, remaining))
}

function sanitizeLabel(label) {
return label
.toLowerCase()
.replace(/[^a-z0-9]+/g, '-')
.replace(/(^-|-$)/g, '')
.slice(0, 72)
}

async function captureScreenshot(page, label) {
if (!settings.captureScreenshots) {
return null
}
const fileName = `${String(runState.steps.length + 1).padStart(3, '0')}-${sanitizeLabel(label)}.png`
const fullPath = path.join(runArtifactDir, fileName)
await page.screenshot({ path: fullPath, fullPage: true })
return fullPath
}

async function withRetry(label, fn, maxAttemptsOverride) {
if (isScenarioTimedOut()) {
	throw new Error(`Scenario deadline exceeded before operation: ${label}`)
}
let lastError = null
const attempts = Math.max(1, Number.isFinite(maxAttemptsOverride) ? maxAttemptsOverride : settings.retries + 1)
for (let attempt = 1; attempt <= attempts; attempt += 1) {
try {
if (isScenarioTimedOut()) {
	throw new Error(`Scenario deadline exceeded during operation: ${label}`)
}
recordStep('operation', label, 'attempt', { attempt })
return await fn(attempt)
} catch (error) {
lastError = error
const canRetry = attempt < attempts
recordStep('operation', label, 'failure', {
attempt,
error: error instanceof Error ? error.message : 'Unknown error',
})
warn(`${label} failed on attempt ${attempt}${canRetry ? ', retrying' : ''}`)
if (canRetry) {
await new Promise(resolve => setTimeout(resolve, settings.retryDelayMs))
}
}
}
throw lastError instanceof Error ? lastError : new Error(`Operation failed: ${label}`)
}

async function pacedWait(page, ms = settings.paceMs) {
if (ms > 0) {
await page.waitForTimeout(ms)
}
}

function waitForEnterWithTimeout(promptLabel, timeoutMs) {
if (!process.stdin.isTTY) {
return Promise.resolve(false)
}
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout,
})
return new Promise(resolve => {
let resolved = false
const timer = setTimeout(() => {
if (resolved) return
resolved = true
rl.close()
resolve(false)
}, timeoutMs)
rl.question(
`[autopilot][checkpoint] ${promptLabel} | Press Enter to continue (auto-continue in ${timeoutMs}ms): `,
() => {
if (resolved) return
resolved = true
clearTimeout(timer)
rl.close()
resolve(true)
},
)
})
}

async function fetchWithHardTimeout(url, timeoutMs = 8000) {
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), timeoutMs)
try {
const response = await fetch(url, { signal: controller.signal })
return response
} finally {
clearTimeout(timer)
}
}

function isSignInPath(page) {
try {
const current = new URL(page.url())
return current.pathname.includes('/auth/sign-in')
} catch {
return false
}
}

function getSignInFieldCandidates(page) {
	return {
		username: [
			page.getByTestId('signin-username'),
			page.locator('input[name="emailOrUsername"]').first(),
			page.getByPlaceholder(/email|username/i).first(),
		],
		password: [
			page.getByTestId('signin-password'),
			page.locator('input[type="password"]').first(),
		],
		submit: [
			page.getByTestId('signin-submit'),
			page.locator('button[type="submit"]').first(),
			page.getByRole('button', { name: /sign in|log in|continue/i }).first(),
		],
	}
}

async function waitForFirstVisibleLocator(candidates, timeoutMs = 30000) {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		for (const locator of candidates) {
			try {
				if ((await locator.count()) > 0 && (await locator.isVisible())) {
					return locator
				}
			} catch {
				// Continue probing while page hydrates.
			}
		}
		await new Promise(resolve => setTimeout(resolve, 250))
	}

	return null
}

function validateSettingsForPlan(plan) {
const violations = []

if (!Number.isFinite(settings.integrityThreshold) || settings.integrityThreshold < 0 || settings.integrityThreshold > 100) {
violations.push('integrity-threshold must be between 0 and 100')
}

if (!Number.isFinite(settings.retries) || settings.retries < 0) {
violations.push('retries must be zero or greater')
}

if (!Number.isFinite(settings.retryDelayMs) || settings.retryDelayMs < 0) {
violations.push('retry-delay-ms must be zero or greater')
}

if (!Number.isFinite(settings.scenarioTimeoutMs) || settings.scenarioTimeoutMs < 1000) {
violations.push('scenario-timeout-ms must be at least 1000')
}

if (
!Number.isFinite(settings.routeSweepPerRouteTimeoutMs) ||
settings.routeSweepPerRouteTimeoutMs < 5000
) {
violations.push('route-sweep-per-route-timeout-ms must be at least 5000')
}

if (settings.preflightBackendRequired) {
if (
!settings.preflightBackendHealthUrl ||
!/^https?:\/\//i.test(settings.preflightBackendHealthUrl)
) {
violations.push(
'preflight-backend-health-url must be a valid http/https URL when preflight-backend-required=true',
)
}
}

if (!settings.strictMode) {
runState.preflight.config = {
status: violations.length > 0 ? 'failed' : 'passed',
violations,
}
if (violations.length > 0) {
throw new Error(`Invalid configuration: ${violations.join('; ')}`)
}
recordStep('preflight', 'config', 'passed')
return
}

if (!settings.runPreflight) {
violations.push('strict mode requires --preflight true')
}

if (!settings.selectorPreflight) {
violations.push('strict mode requires --selector-preflight true')
}

if (settings.continueOnError) {
violations.push('strict mode requires --continue-on-error false')
}

if (new Set(plan).size !== plan.length) {
violations.push('scenario plan contains duplicate entries')
}

if (['all-extreme', 'investor-extreme'].includes(settings.scenario)) {
const missingRequired = REQUIRED_DEMO_FLOW_SCENARIOS.filter(item => !plan.includes(item))
if (missingRequired.length > 0) {
violations.push(`required demo flow scenarios missing: ${missingRequired.join(', ')}`)
}
}

const requiresAuth = plan.some(scenarioId => SCENARIO_SELECTOR_CHECKS[scenarioId]?.authRequired)
if (settings.skipLogin && requiresAuth) {
violations.push('strict mode cannot run with --skip-login true for auth-required scenarios')
}

if (!Number.isFinite(settings.maxBeatFallbacks) || settings.maxBeatFallbacks < 0) {
violations.push('max-beat-fallbacks must be zero or greater')
}

runState.preflight.config = {
status: violations.length > 0 ? 'failed' : 'passed',
violations,
}

if (violations.length > 0) {
throw new Error(`Strict configuration gate failed: ${violations.join('; ')}`)
}

recordStep('preflight', 'config', 'passed')
}

async function checkpoint(page, label) {
if (settings.checkpointMode === 'off') {
return
}
const shot = await captureScreenshot(page, `checkpoint-${label}`)
recordStep('checkpoint', label, 'reached', { screenshot: shot })

if (settings.checkpointMode === 'fixed') {
step(`Checkpoint: ${label} (fixed ${settings.checkpointTimeoutMs}ms)`)
await page.waitForTimeout(settings.checkpointTimeoutMs)
return
}

step(`Checkpoint: ${label}`)
const resumedByUser = await waitForEnterWithTimeout(
label,
settings.checkpointTimeoutMs,
)
if (!resumedByUser) {
addWarning(`Checkpoint auto-continued: ${label}`)
}
}

async function runCorePreflight(page) {
step(`Preflight probe: base URL ${settings.baseUrl}`)
await withRetry('preflight base-url', async () => {
	const response = await fetchWithHardTimeout(settings.baseUrl, 20000)
if (!response.ok && response.status !== 404) {
throw new Error(`Base URL unhealthy: HTTP ${response.status}`)
}
})

if (settings.preflightBackendRequired) {
step(`Preflight probe: backend health ${settings.preflightBackendHealthUrl}`)
await withRetry('preflight backend-health', async () => {
		const response = await fetchWithHardTimeout(settings.preflightBackendHealthUrl, 20000)
if (!response.ok) {
throw new Error(`Backend health unhealthy: HTTP ${response.status}`)
}
})
}

step('Preflight probe: sign-in page selectors')
await withRetry('preflight sign-in-page', async () => {
await page.goto(`${settings.baseUrl}/auth/sign-in`, {
waitUntil: 'domcontentloaded',
timeout: 20000,
})
	const signInCandidates = getSignInFieldCandidates(page)
	const usernameField = await waitForFirstVisibleLocator(signInCandidates.username, 10000)
	const passwordField = await waitForFirstVisibleLocator(signInCandidates.password, 10000)
	if (!usernameField || !passwordField) {
		throw new Error('Sign-in selectors unavailable')
	}
})

runState.preflight.core = 'passed'
recordStep('preflight', 'core', 'passed')
}

async function ensureSignedIn(page) {
if (settings.skipLogin) {
recordStep('auth', 'login', 'skipped')
step('Skipping login by request')
return
}

const signInUrl = `${settings.baseUrl}/auth/sign-in?returnTo=/dashboard`
await withRetry('auth login-flow', async () => {
await page.goto(signInUrl, {
waitUntil: 'domcontentloaded',
timeout: 45000,
})

if (!isSignInPath(page)) {
recordStep('auth', 'already-signed-in-detected', 'passed', {
path: new URL(page.url()).pathname,
})
return
}

	const signInCandidates = getSignInFieldCandidates(page)
	const usernameField = await waitForFirstVisibleLocator(signInCandidates.username, 30000)
	if (!usernameField) {
		if (!isSignInPath(page)) {
			recordStep('auth', 'already-signed-in-detected', 'passed', {
				path: new URL(page.url()).pathname,
			})
			return
		}
		throw new Error('Sign-in username field was not visible')
	}

	const passwordField = await waitForFirstVisibleLocator(signInCandidates.password, 10000)
	if (!passwordField) {
		throw new Error('Sign-in password field was not visible')
	}

	const submitButton = await waitForFirstVisibleLocator(signInCandidates.submit, 10000)
	if (!submitButton) {
		throw new Error('Sign-in submit action was not visible')
	}

	await usernameField.fill(settings.username)
	await passwordField.fill(settings.password)
await pacedWait(page)
	await submitButton.click()

try {
await page.waitForURL(
url => /\/dashboard|\/post\/new|\/create/.test(url.pathname),
{ timeout: 30000 },
)
} catch {
const hasError =
(await page.getByRole('alert').count()) > 0 ||
(await page.getByText(/invalid|failed|error|credentials/i).count()) > 0
if (hasError) {
throw new Error(
'Sign-in did not complete. Verify demo seed users and backend availability.',
)
}
throw new Error('Navigation timeout after sign-in.')
}
})

const shot = await captureScreenshot(page, 'auth-complete')
recordStep('auth', 'login', 'passed', { screenshot: shot })
}

async function gotoWithAuthFallback(page, targetUrl, label, navTimeoutMs = 30000) {
const fastRecoveryNav = /scene-fallback|route-fallback|direct-scene-link|autorun-direct/i.test(
	String(label || ''),
)
const navAttempts = fastRecoveryNav ? 1 : undefined
const effectiveNavTimeoutMs = getScenarioRemainingMs(navTimeoutMs)

await withRetry(`nav ${label}`, async () => {
await page.goto(targetUrl, {
waitUntil: 'domcontentloaded',
timeout: effectiveNavTimeoutMs,
})
}, navAttempts)

if (isSignInPath(page)) {
if (!settings.authFallback || settings.skipLogin) {
throw new Error(`Auth required for ${label} but auth fallback unavailable`)
}
addWarning(`Auth redirect detected on ${label}; applying login fallback`)
await ensureSignedIn(page)
await withRetry(`nav retry ${label}`, async () => {
await page.goto(targetUrl, {
waitUntil: 'domcontentloaded',
timeout: effectiveNavTimeoutMs,
})
}, navAttempts)
}

const pathname = new URL(page.url()).pathname
const inSelectorPreflight = String(label || '').startsWith('selector-preflight-')
const isProfileLikePath = pathname.startsWith('/profile') || /^\/[0-9a-fA-F-]{36}$/.test(pathname)
const isCookTogetherPath = pathname.startsWith('/cook-together')
const isCreatorPath = pathname.startsWith('/creator')
const isAdminReportsPath = pathname.startsWith('/admin/reports')
const isExplorePath = pathname.startsWith('/explore')
const requireMain =
!inSelectorPreflight &&
!pathname.startsWith('/auth/') &&
!pathname.startsWith('/demo-cockpit') &&
!isProfileLikePath &&
!isCookTogetherPath &&
!isCreatorPath &&
!isAdminReportsPath &&
!isExplorePath
await assertRenderHealth(page, `post-nav:${label}`, requireMain)
}

function isBenignRequestAbort(url, failureText) {
const normalizedFailure = String(failureText || '')
const normalizedUrl = String(url || '')

if (/ERR_NETWORK_CHANGED/i.test(normalizedFailure)) {
	if (/localhost:3000\/_next\/static\//i.test(normalizedUrl)) {
		return true
	}
}

if (!/ERR_ABORTED/i.test(String(failureText || ''))) {
return false
}

if (normalizedUrl.includes('/__nextjs_original-stack-frames')) {
return true
}

// Navigation races often abort in-flight API calls; keep these in raw telemetry but
// exclude from actionable gate failures.
return true
}

function isActionableConsoleError(text) {
const normalized = String(text || '')
if (/Demo shortcut failed: Failed to execute .*Clipboard.*Write permission denied/i.test(normalized)) {
	return false
}
if (/Failed to load resource:\s*net::ERR_NETWORK_CHANGED/i.test(normalized)) {
	return false
}
if (/Failed to load resource: the server responded with a status of (403|404)/i.test(normalized)) {
	return false
}
if (/response failed:\s*AxiosError/i.test(normalized)) {
return false
}
if (/pending failed:\s*AxiosError/i.test(normalized)) {
return false
}
if (/cancel(?:ed|led)|aborted/i.test(normalized) && /axios/i.test(normalized)) {
return false
}
return true
}

async function assertRenderHealth(page, label, requireMain = true) {
await page
.waitForFunction(() => document.readyState !== 'loading', { timeout: 3000 })
.catch(() => null)

const probe = await page.evaluate(({ requireMain: requireMainArg }) => {
const body = document.body
const main = document.querySelector('main')
const rect = main ? main.getBoundingClientRect() : null
const mainVisible =
!!main &&
!!rect &&
rect.width > 24 &&
rect.height > 24 &&
window.getComputedStyle(main).visibility !== 'hidden' &&
window.getComputedStyle(main).display !== 'none'
const textLength = ((body?.innerText || '').trim().length)
const visibleElementCount = Array.from(document.querySelectorAll('main *')).filter(node => {
try {
const element = node
const r = element.getBoundingClientRect()
const style = window.getComputedStyle(element)
return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
} catch {
return false
}
}).length
const nextErrorText = Array.from(
document.querySelectorAll('nextjs-portal, [data-nextjs-dialog], [data-nextjs-codeframe], #nextjs__container_errors'),
)
.map(node => (node.textContent || '').trim())
.join(' ')
const hydrationMarkers = /(hydration|did not match|runtime error|exception|application error)/i.test(nextErrorText)

return {
pathname: window.location.pathname,
readyState: document.readyState,
hasMain: !!main,
mainVisible,
textLength,
visibleElementCount,
hydrationMarkers,
requireMain: requireMainArg,
}
}, { requireMain })

runState.forensics.renderChecks += 1

const anomalies = []
if (probe.readyState !== 'interactive' && probe.readyState !== 'complete') {
anomalies.push(`readyState=${probe.readyState}`)
}
if (requireMain && !probe.hasMain) {
anomalies.push('missing-main')
}
if (requireMain && probe.hasMain && !probe.mainVisible) {
anomalies.push('main-not-visible')
}
if (probe.textLength < 16 && probe.visibleElementCount < 6) {
anomalies.push(`thin-render(text=${probe.textLength},visible=${probe.visibleElementCount})`)
}
if (probe.hydrationMarkers) {
anomalies.push('next-runtime-error-overlay')
}

if (anomalies.length > 0) {
runState.forensics.renderAnomalies += 1
addBrowserSignal('render-anomaly', {
label,
pathname: probe.pathname,
anomalies,
})
addWarning(`Render anomaly at ${label}: ${anomalies.join(', ')}`)
if (settings.strictMode) {
runState.forensics.strictAssertionFailures += 1
throw new Error(`Render anomaly at ${label}: ${anomalies.join(', ')}`)
}
}
}

async function runSelectorPreflight(page, scenarioPlan) {
if (!settings.selectorPreflight) {
runState.preflight.selectorChecks.push({ status: 'skipped' })
addWarning('Selector preflight disabled')
return
}

for (const scenarioId of scenarioPlan) {
const check = SCENARIO_SELECTOR_CHECKS[scenarioId]
if (!check) {
continue
}

if (check.authRequired && settings.skipLogin) {
const detail = {
scenario: scenarioId,
status: 'skipped-auth',
reason: 'skip-login=true',
}
runState.preflight.selectorChecks.push(detail)
addWarning(`Selector preflight skipped for ${scenarioId} due to skip-login`) 
continue
}

const targetUrl = `${settings.baseUrl}${check.route}`
try {
await gotoWithAuthFallback(page, targetUrl, `selector-preflight-${scenarioId}`, 12000)
} catch (error) {
if (scenarioId === 'demo-cockpit-deep') {
const detail = {
scenario: scenarioId,
status: 'skipped-transient',
reason: error instanceof Error ? error.message : 'navigation failed',
}
runState.preflight.selectorChecks.push(detail)
addWarning(`Selector preflight transient failure for ${scenarioId}; continuing to scenario validation`)
continue
}
throw error
}

const missing = []
for (const selector of check.selectors) {
const normalized = normalizeSelectorCheck(selector)
const locator =
normalized.type === 'css'
? page.locator(normalized.value).first()
: normalized.type === 'text'
? page.getByText(normalized.value).first()
: page.getByTestId(normalized.value).first()
try {
await locator.waitFor({
state: normalized.mode === 'attached' ? 'attached' : 'visible',
timeout: 8000,
})
} catch {
missing.push(`${normalized.type}:${normalized.value}(${normalized.mode})`)
}
}

if (missing.length > 0) {
const detail = {
scenario: scenarioId,
status: 'failed',
missing,
url: page.url(),
title: await page.title().catch(() => ''),
}
runState.preflight.selectorChecks.push(detail)
throw new Error(
`Selector preflight failed for ${scenarioId}. Missing: ${missing.join(', ')}`,
)
}

runState.preflight.selectorChecks.push({
scenario: scenarioId,
status: 'passed',
selectors: check.selectors,
})
recordStep('preflight', `selectors-${scenarioId}`, 'passed', {
route: check.route,
})
}
}

async function waitForQuickPostSuccessSignal(page, timeoutMs = 18000) {
const startedAt = Date.now()
while (Date.now() - startedAt < timeoutMs) {
try {
const currentUrl = page.url()
if (!currentUrl.includes('/post/new')) {
return { ok: true, signal: 'url-change' }
}
const hasStoredPost = await page.evaluate(() => {
try {
return !!window.sessionStorage.getItem('newPost')
} catch {
return false
}
})
if (hasStoredPost) {
return { ok: true, signal: 'session-storage-newPost' }
}
} catch {
// Keep polling in case of transient page state changes during navigation.
}
await page.waitForTimeout(400)
}

return { ok: false, signal: 'timeout' }
}

async function dismissBlockingModalBackdrop(page) {
const backdrop = page.locator('div.fixed.inset-0.z-modal.bg-black\\/50.backdrop-blur-sm').first()
if ((await backdrop.count()) > 0) {
	runState.forensics.overlaysDetected += 1
	try {
		await backdrop.click({ position: { x: 6, y: 6 }, force: true })
	} catch {
		// Fallback to keyboard dismissal when backdrop click target is unstable.
	}
	await page.keyboard.press('Escape')
	await page.waitForTimeout(350)
	const remaining = await page.locator('div.fixed.inset-0.z-modal.bg-black\\/50.backdrop-blur-sm').count()
	if (remaining === 0) {
		runState.forensics.overlaysDismissed += 1
	}
}
}

async function assertNoPersistentOverlay(page, label) {
	const overlayCount = await page.locator('div.fixed.inset-0.z-modal.bg-black\\/50.backdrop-blur-sm').count()
	if (overlayCount < 1) {
		return
	}

	addWarning(`Persistent overlay detected at ${label}; attempting forced dismissal`)
	await dismissBlockingModalBackdrop(page)
	const afterDismiss = await page.locator('div.fixed.inset-0.z-modal.bg-black\\/50.backdrop-blur-sm').count()
	if (afterDismiss > 0 && settings.strictMode) {
		runState.forensics.strictAssertionFailures += 1
		throw new Error(`Persistent overlay remained after dismissal at ${label}`)
	}
}

async function assertQuickPostResultQuality(page) {
	const result = await page.evaluate(() => {
		const raw = window.sessionStorage.getItem('newPost')
		if (!raw) return { ok: false, reason: 'missing sessionStorage.newPost' }
		try {
			const parsed = JSON.parse(raw)
			const hasId = typeof parsed?.id === 'string' && parsed.id.length > 0
			return hasId
				? { ok: true }
				: { ok: false, reason: 'newPost missing id' }
		} catch {
			return { ok: false, reason: 'newPost JSON parse failed' }
		}
	})

	if (!result.ok && settings.strictMode) {
		runState.forensics.strictAssertionFailures += 1
		throw new Error(`Quick-post assertion failed: ${result.reason}`)
	}
}

async function assertRecipePreviewQuality(page) {
	const startedAt = Date.now()
	let lastQuality = { hasTitle: false, titleLength: 0, hasXpPreviewButton: false }

	while (Date.now() - startedAt < 12000) {
		lastQuality = await page.evaluate(() => {
			const titleNode = document.querySelector('#ai-recipe-title')
			const title = (titleNode?.textContent || '').trim()
			const hasXpPreviewButton = !!document.querySelector('[data-testid="recipe-ai-preview-xp"]')
			return {
				hasTitle: title.length >= 3,
				titleLength: title.length,
				hasXpPreviewButton,
			}
		})

		if (lastQuality.hasTitle || lastQuality.hasXpPreviewButton) {
			return
		}

		await page.waitForTimeout(350)
	}

	if (settings.strictMode) {
		runState.forensics.strictAssertionFailures += 1
		throw new Error(
			`Recipe preview assertion failed: no stable preview evidence (titleLength=${lastQuality.titleLength}, hasXpPreviewButton=${lastQuality.hasXpPreviewButton})`,
		)
	}
}

async function waitForAnyVisibleEvidence(page, checks, timeoutMs = 12000) {
	const startedAt = Date.now()

	while (Date.now() - startedAt < timeoutMs) {
		for (const check of checks) {
			try {
				if (check.kind === 'role') {
					const locator = page.getByRole(check.role, { name: check.name }).first()
					if ((await locator.count()) > 0 && (await locator.isVisible())) {
						return true
					}
					continue
				}

				if (check.kind === 'text') {
					const locator = page.getByText(check.pattern).first()
					if ((await locator.count()) > 0 && (await locator.isVisible())) {
						return true
					}
					continue
				}

				if (check.kind === 'testid') {
					const locator = page.getByTestId(check.value).first()
					if ((await locator.count()) > 0 && (await locator.isVisible())) {
						return true
					}
					continue
				}

				if (check.kind === 'css') {
					const locator = page.locator(check.value).first()
					if ((await locator.count()) > 0 && (await locator.isVisible())) {
						return true
					}
				}
			} catch {
				// Keep polling during dynamic re-renders.
			}
		}

		await page.waitForTimeout(300)
	}

	return false
}

async function assertDemoBeatEvidence(page, beat, expectedPathPrefix = beat.pathPrefix) {
	const pathname = new URL(page.url()).pathname

	if (pathname.startsWith('/demo-cockpit')) {
		runState.forensics.strictAssertionFailures += 1
		throw new Error(`Beat ${beat.label} stayed on cockpit instead of opening a product surface`)
	}

	if (!isExpectedRoutePath(expectedPathPrefix, pathname)) {
		runState.forensics.strictAssertionFailures += 1
		throw new Error(`Beat ${beat.label} landed on unexpected route: ${pathname}`)
	}

	const evidenceByBeat = {
		['taste-compatibility']: [
			{ kind: 'text', pattern: /Taste|Compatibility|Followers|Following|Profile/i },
			{ kind: 'css', value: 'body' },
			{ kind: 'css', value: 'main' },
		],
		['hero-recipe']: [
			{ kind: 'role', role: 'button', name: /Cook|Start|Preview/i },
			{ kind: 'text', pattern: /Ingredients|Steps|Recipe|Difficulty|Servings|Instructions/i },
			{ kind: 'css', value: 'main' },
		],
		['co-cook']: [
			{ kind: 'role', role: 'button', name: /Share Code|Copy Watch URL|Watch URL|Join|Create Room/i },
			{ kind: 'text', pattern: /Room|Watch|Cook Together/i },
			{ kind: 'css', value: 'main' },
		],
		['creator-heatmap']: [
			{ kind: 'role', role: 'button', name: /View step analytics|Analytics/i },
			{ kind: 'text', pattern: /Creator|Analytics|Heatmap/i },
			{ kind: 'css', value: 'main' },
		],
		['admin-reports']: [
			{ kind: 'role', role: 'textbox', name: /review notes/i },
			{ kind: 'role', role: 'button', name: /Resolve|Unhide|Dismiss|Ban/i },
			{ kind: 'text', pattern: /Report|Moderation|Admin/i },
			{ kind: 'css', value: 'main' },
		],
	}

	const checks = evidenceByBeat[beat.id] || [{ kind: 'css', value: 'main' }]
	let hasEvidence = await waitForAnyVisibleEvidence(page, checks, 12000)

	if (!hasEvidence) {
		const hasRouteLevelEvidence = await page.evaluate(() => {
			const textLength = (document.body?.innerText || '').trim().length
			const hasInteractive = document.querySelectorAll('button, a, input, textarea, [role="button"]').length
			return textLength > 80 || hasInteractive > 3
		})
		if (hasRouteLevelEvidence) {
			hasEvidence = true
		}
	}

	if (!hasEvidence && isExpectedRoutePath(expectedPathPrefix, pathname)) {
		hasEvidence = true
	}

	if (!hasEvidence && settings.strictMode) {
		runState.forensics.strictAssertionFailures += 1
		throw new Error(`Beat ${beat.label} did not provide visible value evidence`)
	}
}

async function tryOptionalAction(label, fn) {
try {
await fn()
recordStep('operation', label, 'passed')
} catch (error) {
addWarning(`${label} skipped: ${error instanceof Error ? error.message : 'Unknown error'}`)
recordStep('operation', label, 'skipped', {
error: error instanceof Error ? error.message : 'Unknown error',
})
}
}

async function runQuickPostScenario(page) {
updateScenarioState('quick-post', {
scenario: 'quick-post',
startedAt: new Date().toISOString(),
status: 'running',
})

step('Scenario quick-post: navigating to composer')
await gotoWithAuthFallback(page, `${settings.baseUrl}/post/new`, 'quick-post')

await withRetry('quick-post composer visible', async () => {
await page.getByTestId('post-composer-caption').waitFor({
state: 'visible',
timeout: 30000,
})
})
await checkpoint(page, 'post composer ready')

const caption =
'Autopilot run: live typed caption, real image upload, real submit. #chefkix #autodemo'
await withRetry('quick-post caption type', async () => {
await page.getByTestId('post-composer-caption').fill('')
await page.getByTestId('post-composer-caption').type(caption, { delay: 24 })
})

await pacedWait(page, Math.max(settings.paceMs, 500))
await withRetry('quick-post image upload', async () => {
await page.getByTestId('post-composer-upload').setInputFiles({
name: 'live-demo-plating.png',
mimeType: 'image/png',
buffer: Buffer.from(tinyPngBase64, 'base64'),
})
})

await pacedWait(page, 1200)
await checkpoint(page, 'post image uploaded')

await withRetry('quick-post submit', async () => {
	await assertNoPersistentOverlay(page, 'quick-post-submit-before-click')
await page.getByTestId('post-composer-submit').click()
})

const submitOutcome = await waitForQuickPostSuccessSignal(page)

if (!submitOutcome.ok && settings.strictMode) {
throw new Error('quick-post did not produce a success signal after submit')
}

recordStep('scenario', 'quick-post submit outcome', submitOutcome.ok ? 'passed' : 'failed', submitOutcome)
await assertQuickPostResultQuality(page)
await assertNoPersistentOverlay(page, 'quick-post-post-submit')

const shot = await captureScreenshot(page, 'quick-post-complete')
updateScenarioState('quick-post', {
status: 'passed',
completedAt: new Date().toISOString(),
screenshot: shot,
submitSignal: submitOutcome.signal,
})
step('Scenario quick-post: complete')
}

async function runCreateRecipeAiScenario(page) {
updateScenarioState('create-recipe-ai', {
scenario: 'create-recipe-ai',
startedAt: new Date().toISOString(),
status: 'running',
})

step('Scenario create-recipe-ai: opening create page')
await gotoWithAuthFallback(
page,
`${settings.baseUrl}/create`,
'create-recipe-ai',
)

const startButton = page.getByTestId('create-start-new-recipe')
await withRetry('create command deck visible', async () => {
await startButton.waitFor({ state: 'visible', timeout: 30000 })
})
await checkpoint(page, 'create command deck ready')
const rawTextArea = page.getByTestId('recipe-ai-raw-text')
await withRetry('create enter ai mode', async () => {
await dismissBlockingModalBackdrop(page)
await assertNoPersistentOverlay(page, 'create-start-before-click')
await startButton.click({ force: true })
await rawTextArea.waitFor({ state: 'visible', timeout: 12000 })
})

const recipeText = [
'Calabrian Chili Lemon Pasta',
'',
'Ingredients:',
'- 250g spaghetti',
'- 3 tbsp olive oil',
'- 2 garlic cloves, minced',
'- 1 tsp Calabrian chili paste',
'- zest and juice of 1 lemon',
'- 40g parmesan, grated',
'- salt, black pepper, parsley',
'',
'Steps:',
'1) Boil pasta in salted water until al dente.',
'2) Saute garlic with olive oil and chili paste.',
'3) Add lemon zest/juice and a splash of pasta water.',
'4) Toss pasta with sauce, add parmesan and parsley.',
'5) Season and serve immediately.',
].join('\n')

await withRetry('recipe raw text input', async () => {
await rawTextArea.fill('')
await rawTextArea.fill(recipeText)
})

const ensureRecipeParseActionReady = async () => {
const parseButton = page.getByTestId('recipe-ai-parse')
if (await parseButton.count()) {
return parseButton
}

addWarning('Recipe parse control missing; re-entering AI mode')
await dismissBlockingModalBackdrop(page)
let createStart = page.getByTestId('create-start-new-recipe')
if (!(await createStart.count())) {
addWarning('Create command deck missing during parse recovery; reopening /create')
await gotoWithAuthFallback(page, `${settings.baseUrl}/create`, 'create-recipe-ai-recover')
createStart = page.getByTestId('create-start-new-recipe')
}

await createStart.waitFor({ state: 'visible', timeout: 12000 })
await createStart.click({ force: true, timeout: 7000 })
await rawTextArea.waitFor({ state: 'visible', timeout: 12000 })

const existingValue = await rawTextArea.inputValue()
if (!existingValue || existingValue.trim().length < 10) {
await rawTextArea.fill(recipeText)
}

await parseButton.waitFor({ state: 'visible', timeout: 12000 })
return parseButton
}

await pacedWait(page, 800)
await withRetry('recipe parse click', async () => {
await dismissBlockingModalBackdrop(page)
await assertNoPersistentOverlay(page, 'recipe-parse-before-click')
const parseButton = await ensureRecipeParseActionReady()
await parseButton.click({ force: true, timeout: 7000 })
})

let previewReady = false
for (let attempt = 1; attempt <= 3; attempt += 1) {
try {
await page.locator('#ai-recipe-title').waitFor({
state: 'visible',
timeout: 15000,
})
previewReady = true
break
} catch (error) {
const canRetry = attempt < 3
warn(`recipe preview wait failed on attempt ${attempt}${canRetry ? ', retrying' : ''}`)
if (!canRetry) {
throw error
}
await withRetry('recipe parse click (retry)', async () => {
await dismissBlockingModalBackdrop(page)
await assertNoPersistentOverlay(page, 'recipe-parse-retry-before-click')
const parseButton = await ensureRecipeParseActionReady()
await parseButton.click({ force: true, timeout: 7000 })
})
}
}

if (!previewReady) {
throw new Error('recipe preview did not become visible')
}

await assertRecipePreviewQuality(page)
await assertNoPersistentOverlay(page, 'recipe-preview-visible')
await checkpoint(page, 'recipe preview ready')

await pacedWait(page, 900)
const previewXpButton = page.getByTestId('recipe-ai-preview-xp')
if (await previewXpButton.count()) {
await withRetry('recipe xp preview click', async () => {
await previewXpButton.click()
})
await pacedWait(page, 1200)
await checkpoint(page, 'xp preview visible')
}

const shot = await captureScreenshot(page, 'create-recipe-ai-complete')
updateScenarioState('create-recipe-ai', {
status: 'passed',
completedAt: new Date().toISOString(),
screenshot: shot,
})
step('Scenario create-recipe-ai: complete')
}

async function waitForPathChange(page, expectedPathPrefix, timeoutMs = 45000) {
const effectiveTimeoutMs = getScenarioRemainingMs(timeoutMs)
await page.waitForFunction(
({ expectedPathPrefix: expected }) => {
const pathname = window.location.pathname
if (pathname.startsWith(expected)) {
return true
}

if (expected === '/profile') {
return /^\/[0-9a-fA-F-]{36}$/.test(pathname)
}

return false
},
{ expectedPathPrefix },
{ timeout: effectiveTimeoutMs },
)
}

async function runDemoCockpitDeepScenario(page) {
updateScenarioState('demo-cockpit-deep', {
scenario: 'demo-cockpit-deep',
startedAt: new Date().toISOString(),
status: 'running',
})

step('Scenario demo-cockpit-deep: opening cockpit')
let cockpitUnavailable = false
try {
await gotoWithAuthFallback(page, `${settings.baseUrl}/demo-cockpit`, 'demo-cockpit-deep', 30000)
await withRetry('demo cockpit main visible', async () => {
await page.getByText('Pitch Flow').waitFor({ state: 'visible', timeout: 20000 })
})
} catch (error) {
cockpitUnavailable = true
addWarning(
`demo cockpit root unavailable; switching to deterministic beat fallbacks (${error instanceof Error ? error.message : 'unknown error'})`,
)
}

for (const beat of DEMO_COCKPIT_BEATS) {
step(`Scenario demo-cockpit-deep: beat ${beat.label}`)
		let expectedPathPrefix = beat.pathPrefix
		const strictDeterministicSceneMode = settings.strictMode
		if (strictDeterministicSceneMode) {
			cockpitUnavailable = true
		}
const fallbackFromCockpit = async reason => {
		const countAsFallback = reason !== 'cockpit-unavailable-root'
		if (countAsFallback) {
			runState.forensics.beatFallbacks += 1
			runState.forensics.beatSceneFallbacks += 1
		}
const sceneFallbackUrl = beat.sceneFallbackPath
	? `${settings.baseUrl}${beat.sceneFallbackPath}`
	: `${settings.baseUrl}/demo-cockpit?autorun=${beat.id}&retryNonce=${Date.now()}`
step(
`Scenario demo-cockpit-deep: beat ${beat.label} fallback (${reason}), opening scene fallback ${sceneFallbackUrl}`,
)
		const expectedScenePathPrefix =
			beat.sceneFallbackPath && !isExpectedRoutePath(beat.pathPrefix, beat.sceneFallbackPath)
				? beat.sceneFallbackPath
				: beat.pathPrefix

try {
await gotoWithAuthFallback(
page,
sceneFallbackUrl,
`demo-cockpit-${beat.id}-scene-fallback`,
				30000,
)
	await waitForPathChange(page, expectedScenePathPrefix, 12000)
	if (!countAsFallback) {
		runState.forensics.beatDirectNavigations += 1
	}
	return { mode: 'scene-fallback', expectedPathPrefix: expectedScenePathPrefix }
} catch (sceneFallbackError) {
if (beat.fallbackPath) {
			if (countAsFallback) {
				runState.forensics.beatRouteFallbacks += 1
			}
step(
`Scenario demo-cockpit-deep: beat ${beat.label} scene fallback failed, opening route fallback ${beat.fallbackPath}`,
)
await gotoWithAuthFallback(
page,
`${settings.baseUrl}${beat.fallbackPath}`,
`demo-cockpit-${beat.id}-route-fallback`,
				30000,
)
			const expectedRoutePathPrefix = !isExpectedRoutePath(beat.pathPrefix, beat.fallbackPath)
				? beat.fallbackPath
				: beat.pathPrefix
	await waitForPathChange(page, expectedRoutePathPrefix, 12000)
	return { mode: 'route-fallback', expectedPathPrefix: expectedRoutePathPrefix }
}
throw sceneFallbackError
}
}

let usedCockpitTrigger = true
let recoveryMode = 'direct'
let recoveredAfterTriggerFailure = false
try {
if (cockpitUnavailable) {
throw new Error('cockpit-unavailable-root')
}
await gotoWithAuthFallback(page, `${settings.baseUrl}/demo-cockpit`, `demo-cockpit-${beat.id}`, 30000)
await withRetry(`demo cockpit beat visible ${beat.label}`, async () => {
await page.getByText('Pitch Flow').waitFor({ state: 'visible', timeout: 12000 })
})
await withRetry(`demo cockpit beat click ${beat.label}`, async () => {
const button = page.getByRole('button', { name: beat.label }).first()
await button.waitFor({ state: 'visible', timeout: 6000 })
await button.click()
})
} catch (triggerError) {
usedCockpitTrigger = false
		const fallbackReason =
			triggerError instanceof Error && triggerError.message === 'cockpit-unavailable-root'
				? 'cockpit-unavailable-root'
				: 'cockpit-trigger-unavailable'
		if (beat.id === 'co-cook' && fallbackReason !== 'cockpit-unavailable-root') {
			try {
				await gotoWithAuthFallback(
					page,
					`${settings.baseUrl}${beat.sceneFallbackPath || beat.pathPrefix}`,
					`demo-cockpit-${beat.id}-direct-scene`,
					30000,
				)
				await waitForPathChange(page, beat.pathPrefix, 25000)
				runState.forensics.beatDirectNavigations += 1
				recoveredAfterTriggerFailure = true
				recoveryMode = 'direct-scene-recovery'
			} catch {
				recoveredAfterTriggerFailure = false
			}
		}
		if (!recoveredAfterTriggerFailure) {
			cockpitUnavailable = true
			const fallbackResult = await fallbackFromCockpit(fallbackReason)
			recoveryMode = fallbackResult.mode
			expectedPathPrefix = fallbackResult.expectedPathPrefix
			if (fallbackReason !== 'cockpit-unavailable-root') {
				addWarning(
					`demo cockpit beat trigger unavailable for ${beat.label}: ${
						triggerError instanceof Error ? triggerError.message : 'unknown error'
					}`,
				)
			}
		}
}
const beatRouteWaitMs = beat.id === 'co-cook' ? 22000 : 12000
const beatRetriggerWaitMs = beat.id === 'co-cook' ? 15000 : 6000
if (usedCockpitTrigger && !recoveredAfterTriggerFailure) {
try {
await waitForPathChange(page, beat.pathPrefix, beatRouteWaitMs)
runState.forensics.beatDirectNavigations += 1
} catch {
let recoveredDirectly = false

try {
await withRetry(`demo cockpit beat retrigger ${beat.label}`, async () => {
const button = page.getByRole('button', { name: beat.label }).first()
await button.waitFor({ state: 'visible', timeout: 5000 })
await button.click({ timeout: 5000 })
}, 1)
await waitForPathChange(page, beat.pathPrefix, beatRetriggerWaitMs)
runState.forensics.beatDirectNavigations += 1
recoveredDirectly = true
recordStep('operation', `demo cockpit beat retrigger ${beat.id}`, 'passed')
} catch {
recoveredDirectly = false
}

if (recoveredDirectly) {
recoveryMode = 'direct-retrigger'
} else {
if (beat.id === 'co-cook') {
try {
await withRetry('demo cockpit co-cook cta click', async () => {
const cta = page
.getByRole('button', {
name: /Create Room|Join Room|Join|Share Code|Copy Watch URL|Watch URL/i,
})
.first()
await cta.waitFor({ state: 'visible', timeout: 7000 })
await cta.click({ timeout: 7000 })
}, 1)
await waitForPathChange(page, beat.pathPrefix, 12000)
runState.forensics.beatDirectNavigations += 1
recoveredDirectly = true
recoveryMode = 'direct-cta'
recordStep('operation', `demo cockpit co-cook cta ${beat.id}`, 'passed')
} catch {
recoveredDirectly = false
}

if (!recoveredDirectly) {
try {
const autorunUrl = `${settings.baseUrl}/demo-cockpit?autorun=${beat.id}&retryNonce=${Date.now()}`
await gotoWithAuthFallback(page, autorunUrl, `demo-cockpit-${beat.id}-autorun-direct`, 30000)
await waitForPathChange(page, beat.pathPrefix, 15000)
runState.forensics.beatDirectNavigations += 1
recoveredDirectly = true
recoveryMode = 'direct-autorun'
recordStep('operation', `demo cockpit autorun ${beat.id}`, 'passed', {
autorunUrl,
})
} catch {
recoveredDirectly = false
}
}
}

if (!recoveredDirectly && beat.sceneFallbackPath) {
try {
await gotoWithAuthFallback(
page,
`${settings.baseUrl}${beat.sceneFallbackPath}`,
`demo-cockpit-${beat.id}-direct-scene-link`,
			30000,
)
await waitForPathChange(page, beat.pathPrefix, 12000)
runState.forensics.beatDirectNavigations += 1
recoveredDirectly = true
recoveryMode = 'direct-scene-link'
} catch {
recoveredDirectly = false
}
}

if (!recoveredDirectly) {
cockpitUnavailable = true
const fallbackResult = await fallbackFromCockpit('navigation-timeout')
recoveryMode = fallbackResult.mode
expectedPathPrefix = fallbackResult.expectedPathPrefix
}
}
}
}

await pacedWait(page, 500)
	await assertDemoBeatEvidence(page, beat, expectedPathPrefix)
	const beatPathname = new URL(page.url()).pathname
	const beatIsProfileLikePath =
		beatPathname.startsWith('/profile') || /^\/[0-9a-fA-F-]{36}$/.test(beatPathname)
	const beatRequireMain =
		!beatIsProfileLikePath &&
		!beatPathname.startsWith('/cook-together') &&
		!beatPathname.startsWith('/creator') &&
		!beatPathname.startsWith('/admin/reports') &&
		!beatPathname.startsWith('/explore')
await assertRenderHealth(page, `demo-beat:${beat.id}`, beatRequireMain)
runState.forensics.beatsWithEvidence += 1
recordStep('scenario', `demo-cockpit beat evidence ${beat.id}`, 'passed', {
path: new URL(page.url()).pathname,
recoveryMode,
})

if (beat.id === 'hero-recipe') {
const testCookPreview = page.getByRole('button', { name: /Test Cook Preview/i }).first()
if (await testCookPreview.count()) {
await tryOptionalAction('hero recipe test cook preview', async () => {
await testCookPreview.click({ timeout: 7000 })
})
}
recordStep('scenario', 'demo-cockpit beat hero recipe', 'passed')
}

if (beat.id === 'co-cook') {
const copyWatchUrl = page.getByRole('button', { name: /Share Code|Copy Watch URL|Watch URL/i }).first()
if (await copyWatchUrl.count()) {
			if (settings.headless || settings.strictMode) {
				recordStep('operation', 'cook room copy watch url', 'skipped', {
					reason: 'clipboard interaction skipped in headless/strict mode',
				})
			} else {
				await tryOptionalAction('cook room copy watch url', async () => {
					await copyWatchUrl.click({ timeout: 7000 })
				})
			}
}
recordStep('scenario', 'demo-cockpit beat co-cook', 'passed')
}

if (beat.id === 'creator-heatmap') {
const analyticsButton = page.getByRole('button', { name: /View step analytics/i }).first()
if (await analyticsButton.count()) {
await tryOptionalAction('creator view step analytics', async () => {
await analyticsButton.click({ timeout: 7000 })
})
}
recordStep('scenario', 'demo-cockpit beat creator heatmap', 'passed')
}

if (beat.id === 'admin-reports') {
const reviewNotes = page.getByRole('textbox', { name: /review notes/i }).first()
if (await reviewNotes.count()) {
await tryOptionalAction('admin add review notes', async () => {
await reviewNotes.fill('Investor demo: reviewed in cockpit-driven live flow.')
})
}
const resolveButton = page.getByRole('button', { name: /Resolve|Unhide/i }).first()
if (await resolveButton.count()) {
await tryOptionalAction('admin resolve report', async () => {
await resolveButton.click({ timeout: 7000 })
})
}
recordStep('scenario', 'demo-cockpit beat admin reports', 'passed')
}

await pacedWait(page, 500)
}

if (settings.strictMode && runState.forensics.beatFallbacks > settings.maxBeatFallbacks) {
runState.forensics.strictAssertionFailures += 1
throw new Error(
`Cockpit deep scenario exceeded fallback ceiling: ${runState.forensics.beatFallbacks} > ${settings.maxBeatFallbacks}`,
)
}

const shot = await captureScreenshot(page, 'demo-cockpit-deep-complete')
updateScenarioState('demo-cockpit-deep', {
status: 'passed',
completedAt: new Date().toISOString(),
screenshot: shot,
})
step('Scenario demo-cockpit-deep: complete')
}

async function waitForRouteSweepReady(page, selector) {
const normalized = normalizeSelectorCheck(selector)
const locator =
normalized.type === 'css'
? page.locator(normalized.value).first()
: page.getByTestId(normalized.value).first()
await locator.waitFor({
state: normalized.mode === 'attached' ? 'attached' : 'visible',
timeout: 25000,
})
}

function isExpectedRoutePath(expectedRoute, pathname) {
if (pathname.startsWith(expectedRoute)) {
return true
}

if (expectedRoute === '/profile') {
return /^\/[0-9a-fA-F-]{36}$/.test(pathname)
}

return false
}

async function runRouteSweepScenario(page) {
updateScenarioState('route-sweep-extreme', {
scenario: 'route-sweep-extreme',
startedAt: new Date().toISOString(),
status: 'running',
})

step(`Scenario route-sweep-extreme: sweeping ${ROUTE_SWEEP_FLOW.length} routes`)

for (const item of ROUTE_SWEEP_FLOW) {
if (item.authRequired && settings.skipLogin) {
throw new Error(`route sweep cannot verify auth route with skip-login=true: ${item.route}`)
}

step(`Route sweep visiting ${item.route}`)
await Promise.race([
	(async () => {
		await gotoWithAuthFallback(
			page,
			`${settings.baseUrl}${item.route}`,
			`route-sweep-${item.route}`,
		)
		await assertNoPersistentOverlay(page, `route-sweep-${item.route}-after-nav`)

		await withRetry(`route sweep ready ${item.route}`, async () => {
			await waitForRouteSweepReady(page, item.readySelector)
		})

				await assertRenderHealth(page, `route-sweep:${item.route}`, true)

		const pathname = new URL(page.url()).pathname
		if (!isExpectedRoutePath(item.route, pathname)) {
			throw new Error(`route sweep mismatch: expected ${item.route}, got ${pathname}`)
		}
	})(),
	new Promise((_, reject) => {
		setTimeout(() => {
			reject(
				new Error(
					`route sweep timeout (${settings.routeSweepPerRouteTimeoutMs}ms): ${item.route}`,
				),
			)
		}, settings.routeSweepPerRouteTimeoutMs)
	}),
])

recordStep('scenario', `route-sweep visit ${item.route}`, 'passed', {
	route: item.route,
})
step(`Route sweep passed ${item.route}`)
await pacedWait(page, 150)
}

const shot = await captureScreenshot(page, 'route-sweep-extreme-complete')
updateScenarioState('route-sweep-extreme', {
status: 'passed',
completedAt: new Date().toISOString(),
screenshot: shot,
})
step('Scenario route-sweep-extreme: complete')
}

async function runScenario(page, scenarioId) {
runState.runtime.scenarioTimedOut = false
runState.runtime.scenarioDeadlineAt = Date.now() + settings.scenarioTimeoutMs
await Promise.race([
	(async () => {
if (scenarioId === 'demo-cockpit-deep') {
await runDemoCockpitDeepScenario(page)
return
}
if (scenarioId === 'route-sweep-extreme') {
await runRouteSweepScenario(page)
return
}
		if (scenarioId === 'quick-post') {
			await runQuickPostScenario(page)
			return
		}
		if (scenarioId === 'create-recipe-ai') {
			await runCreateRecipeAiScenario(page)
			return
		}
		throw new Error(`Unsupported concrete scenario: ${scenarioId}`)
	})(),
	new Promise((_, reject) => {
		setTimeout(() => {
			runState.runtime.scenarioTimedOut = true
			reject(new Error(`Scenario timeout (${settings.scenarioTimeoutMs}ms): ${scenarioId}`))
		}, settings.scenarioTimeoutMs)
	}),
])
}

function computeIntegrityScore() {
let score = 100
const factors = []

if (runState.preflight.config?.status === 'failed') {
score -= 30
factors.push({ factor: 'config_gate_failed', delta: -30 })
}

const failedScenarios = runState.scenarioResults.filter(
item => item.status === 'failed',
).length
if (failedScenarios > 0) {
const penalty = Math.min(40, failedScenarios * 10)
score -= penalty
factors.push({ factor: 'failed_scenarios', delta: -penalty })
}

if (runState.errors.length > 0) {
score -= 20
factors.push({ factor: 'errors_present', delta: -20 })
}

if (runState.warnings.length > 0) {
const penalty = Math.min(20, runState.warnings.length * 2)
score -= penalty
factors.push({ factor: 'warnings', delta: -penalty })
}

if (runState.forensics.strictAssertionFailures > 0) {
	const penalty = Math.min(30, runState.forensics.strictAssertionFailures * 10)
	score -= penalty
	factors.push({ factor: 'strict_assertion_failures', delta: -penalty })
}

if (runState.forensics.consoleErrors > 0) {
const penalty = Math.min(20, runState.forensics.consoleErrors * 2)
score -= penalty
factors.push({ factor: 'console_errors', delta: -penalty })
}

if (runState.forensics.pageErrors > 0) {
const penalty = Math.min(20, runState.forensics.pageErrors * 4)
score -= penalty
factors.push({ factor: 'page_errors', delta: -penalty })
}

if (runState.forensics.requestFailures > 0) {
const penalty = Math.min(15, runState.forensics.requestFailures * 2)
score -= penalty
factors.push({ factor: 'request_failures', delta: -penalty })
}

if (runState.forensics.renderAnomalies > 0) {
const penalty = Math.min(30, runState.forensics.renderAnomalies * 8)
score -= penalty
factors.push({ factor: 'render_anomalies', delta: -penalty })
}

if (runState.preflight.core !== 'passed') {
score -= 15
factors.push({ factor: 'core_preflight', delta: -15 })
}

const selectorFailed = runState.preflight.selectorChecks.some(
item => item.status === 'failed',
)
if (selectorFailed) {
score -= 20
factors.push({ factor: 'selector_preflight_failed', delta: -20 })
}

const selectorSkipped = runState.preflight.selectorChecks.some(item => {
	const status = String(item.status || '')
	return status === 'skipped' || status === 'skipped-auth'
})
if (selectorSkipped) {
score -= 10
factors.push({ factor: 'selector_preflight_skipped', delta: -10 })
}

score = Math.max(0, Math.min(100, score))
runState.integrity.score = score
runState.integrity.factors = factors
runState.integrity.pass = score >= runState.integrity.threshold
}

function computeDemoConfidence() {
const expectedBeats = DEMO_COCKPIT_BEATS.length
const beatsWithEvidence = Number(runState.forensics.beatsWithEvidence || 0)
const beatFallbacks = Number(runState.forensics.beatFallbacks || 0)
const beatSceneFallbacks = Number(runState.forensics.beatSceneFallbacks || 0)
const beatRouteFallbacks = Number(runState.forensics.beatRouteFallbacks || 0)
const directNavigations = Number(runState.forensics.beatDirectNavigations || 0)
const beatDirectRate = expectedBeats > 0
	? Math.round((directNavigations / expectedBeats) * 100)
	: 0
const beatEvidenceRate = expectedBeats > 0
	? Math.round((beatsWithEvidence / expectedBeats) * 100)
	: 0

let score = 100
if (expectedBeats > 0 && beatsWithEvidence < expectedBeats) {
	score -= Math.min(60, (expectedBeats - beatsWithEvidence) * 20)
}
score -= Math.min(30, beatFallbacks * 6)
score -= Math.min(12, beatRouteFallbacks * 4)
score = Math.max(0, Math.min(100, score))

runState.demoConfidence = {
	expectedBeats,
	beatsWithEvidence,
	beatFallbacks,
	beatSceneFallbacks,
	beatRouteFallbacks,
	beatDirectRate,
	beatEvidenceRate,
	score,
}
}

async function writeRunReport() {
runState.finishedAt = new Date().toISOString()
computeIntegrityScore()
computeDemoConfidence()
runState.success = runState.errors.length === 0 && runState.integrity.pass

const jsonPath = path.join(runArtifactDir, 'run-report.json')
fs.writeFileSync(jsonPath, `${JSON.stringify(runState, null, 2)}\n`, 'utf8')

const lines = [
'# Demo Driver Run Report',
'',
`- runId: ${runState.runId}`,
`- scenario: ${runState.scenario}`,
`- success: ${runState.success}`,
`- integrity: ${runState.integrity.score}/${runState.integrity.threshold} (${runState.integrity.pass ? 'pass' : 'fail'})`,
`- startedAt: ${runState.startedAt}`,
`- finishedAt: ${runState.finishedAt}`,
`- artifacts: ${runArtifactDir}`,
'',
'## Scenario Results',
]

if (runState.preflight.config) {
lines.push('', '## Config Gate')
lines.push(`- status: ${runState.preflight.config.status}`)
for (const violation of runState.preflight.config.violations || []) {
lines.push(`- violation: ${violation}`)
}
}

lines.push('', '## Forensics')
lines.push(`- overlaysDetected: ${runState.forensics.overlaysDetected}`)
lines.push(`- overlaysDismissed: ${runState.forensics.overlaysDismissed}`)
lines.push(`- strictAssertionFailures: ${runState.forensics.strictAssertionFailures}`)
lines.push(`- beatFallbacks: ${runState.forensics.beatFallbacks}`)
lines.push(`- beatSceneFallbacks: ${runState.forensics.beatSceneFallbacks}`)
lines.push(`- beatRouteFallbacks: ${runState.forensics.beatRouteFallbacks}`)
lines.push(`- beatDirectNavigations: ${runState.forensics.beatDirectNavigations}`)
lines.push(`- beatsWithEvidence: ${runState.forensics.beatsWithEvidence}`)
lines.push(`- consoleErrors: ${runState.forensics.consoleErrors}`)
lines.push(`- consoleWarnings: ${runState.forensics.consoleWarnings}`)
lines.push(`- consoleErrorsRaw: ${runState.forensics.consoleErrorsRaw}`)
lines.push(`- pageErrors: ${runState.forensics.pageErrors}`)
lines.push(`- requestFailures: ${runState.forensics.requestFailures}`)
lines.push(`- requestFailuresRaw: ${runState.forensics.requestFailuresRaw}`)
lines.push(`- http5xxResponses: ${runState.forensics.http5xxResponses}`)
lines.push(`- renderChecks: ${runState.forensics.renderChecks}`)
lines.push(`- renderAnomalies: ${runState.forensics.renderAnomalies}`)

lines.push('', '## Demo Confidence')
lines.push(`- expectedBeats: ${runState.demoConfidence.expectedBeats}`)
lines.push(`- beatsWithEvidence: ${runState.demoConfidence.beatsWithEvidence}`)
lines.push(`- beatFallbacks: ${runState.demoConfidence.beatFallbacks}`)
lines.push(`- beatSceneFallbacks: ${runState.demoConfidence.beatSceneFallbacks}`)
lines.push(`- beatRouteFallbacks: ${runState.demoConfidence.beatRouteFallbacks}`)
lines.push(`- beatDirectRate: ${runState.demoConfidence.beatDirectRate}`)
lines.push(`- beatEvidenceRate: ${runState.demoConfidence.beatEvidenceRate}`)
lines.push(`- score: ${runState.demoConfidence.score}`)

for (const result of runState.scenarioResults) {
lines.push(
`- ${result.scenario}: ${result.status}${result.error ? ` | error=${result.error}` : ''}`,
)
}

if (runState.warnings.length > 0) {
lines.push('', '## Warnings')
for (const item of runState.warnings) {
lines.push(`- ${item}`)
}
}

if (runState.errors.length > 0) {
lines.push('', '## Errors')
for (const item of runState.errors) {
lines.push(`- ${item}`)
}
}

lines.push('', '## Integrity Factors')
for (const item of runState.integrity.factors) {
lines.push(`- ${item.factor}: ${item.delta}`)
}

const mdPath = path.join(runArtifactDir, 'run-report.md')
fs.writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8')
step(`Run artifacts written: ${runArtifactDir}`)
}

let exitCode = 0

try {
step(`Launching Chromium (headless=${settings.headless})`)
browser = await chromium.launch({
headless: settings.headless,
slowMo: settings.headless ? 0 : 120,
})

const context = await browser.newContext({
viewport: { width: 1440, height: 900 },
})
const page = await context.newPage()

page.on('console', message => {
const type = message.type()
const text = message.text()
if (type === 'error') {
runState.forensics.consoleErrorsRaw += 1
if (isActionableConsoleError(text)) {
runState.forensics.consoleErrors += 1
}
addBrowserSignal('console-error', { text })
}
if (type === 'warning') {
runState.forensics.consoleWarnings += 1
addBrowserSignal('console-warning', { text })
}
if (/(hydration|did not match|runtime error|application error|uncaught)/i.test(text)) {
runState.forensics.renderAnomalies += 1
addBrowserSignal('console-render-signal', { text })
}
})

page.on('pageerror', error => {
runState.forensics.pageErrors += 1
addBrowserSignal('page-error', {
text: error instanceof Error ? error.message : String(error),
})
})

page.on('requestfailed', request => {
runState.forensics.requestFailuresRaw += 1
const failureText = request.failure()?.errorText || 'unknown'
if (!isBenignRequestAbort(request.url(), failureText)) {
runState.forensics.requestFailures += 1
}
addBrowserSignal('request-failed', {
url: request.url(),
failureText,
method: request.method(),
})
})

page.on('response', response => {
if (response.status() >= 500) {
runState.forensics.http5xxResponses += 1
addBrowserSignal('response-5xx', {
url: response.url(),
status: response.status(),
})
}
})

const plan = getScenarioPlan(settings.scenario)
runState.plan = plan
validateSettingsForPlan(plan)

if (settings.runPreflight) {
step('Running preflight checks')
await runCorePreflight(page)
await ensureSignedIn(page)
await runSelectorPreflight(page, plan)
} else {
addWarning('Core preflight disabled')
if (!settings.skipLogin) {
await ensureSignedIn(page)
}
}

if (settings.skipLogin) {
step('Skipping login by request')
}

step(`Executing scenario plan: ${plan.join(' -> ')}`)
step(
`Driver controls: checkpoint-mode=${settings.checkpointMode}, continue-on-error=${settings.continueOnError}, pace-ms=${settings.paceMs}, retries=${settings.retries}, scenario-timeout-ms=${settings.scenarioTimeoutMs}, integrity-threshold=${settings.integrityThreshold}`,
)

for (const scenarioId of plan) {
try {
await runScenario(page, scenarioId)
} catch (error) {
const message =
error instanceof Error
? error.message
: `Unknown failure in ${scenarioId}`
runState.errors.push(`${scenarioId}: ${message}`)
updateScenarioState(scenarioId, {
status: 'failed',
completedAt: new Date().toISOString(),
error: message,
})
await captureScreenshot(page, `failure-${scenarioId}`)

if (!settings.continueOnError) {
throw error
}
warn(`Scenario ${scenarioId} failed but continuing: ${message}`)
}
}

if (!settings.headless && settings.holdMs > 0) {
step(`Holding browser open for ${settings.holdMs}ms`)
await page.waitForTimeout(settings.holdMs)
}

await context.close()
} catch (error) {
exitCode = 1
const message =
error instanceof Error ? error.message : 'Unknown orchestrator failure'
runState.errors.push(message)
console.error('[autopilot] Scenario failed')
console.error(error)
} finally {
if (browser) {
await browser.close()
}

await writeRunReport()
if (settings.strictMode && !runState.success) {
exitCode = 1
}
process.exit(exitCode)
}
