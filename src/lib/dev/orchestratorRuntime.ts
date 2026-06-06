import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

export type OrchestratorLaunchMode = 'single-strict' | 'certify-strict'

export interface OrchestratorTask {
	taskId: string
	mode: OrchestratorLaunchMode
	startedAt: string
	endedAt: string | null
	status: 'running' | 'passed' | 'failed' | 'stopped'
	exitCode: number | null
	command: string
	artifactDir: string | null
	runId: string | null
	recentOutput: string[]
	errorMessage: string | null
	runtimeAgeSec: number
	lastOutputAgeSec: number
	maxRuntimeSec: number
	watchdogRisk: 'healthy' | 'warning' | 'critical'
}

interface OrchestratorTaskInternal extends OrchestratorTask {
	pid: number | null
	updatedAt: string
	lastOutputAt: string
	maxRuntimeMs: number
	child: ChildProcessWithoutNullStreams | null
}

export interface OrchestratorProgressSummary {
	status: string | null
	strictAssertionFailures: number | null
	renderAnomalies: number | null
	beatsWithEvidence: number | null
	beatsWithValueArc: number | null
	beatsWithPhaseCoverage: number | null
	expectedBeats: number | null
	beatFallbacks: number | null
	beatSceneFallbacks: number | null
	beatRouteFallbacks: number | null
	consoleErrors: number | null
	pageErrors: number | null
	requestFailures: number | null
	http5xxResponses: number | null
	warningCount: number | null
	errorCount: number | null
	preflightCoreStatus: string | null
	beatEvidenceRate: number | null
	beatValueArcRate: number | null
	beatPhaseCoverageRate: number | null
	criticalFindings: string[]
}

export interface OrchestratorPreflightSummary {
	backendBaseUrl: string
	backendHealthUrl: string
	authProbeUrl: string
	runningTaskCount: number
	maxConcurrentRunningTasks: number
	launchCapacityAvailable: boolean
	backendHealthOk: boolean
	authProbeOk: boolean
	backendHealthStatusCode: number | null
	authProbeStatusCode: number | null
	errorMessage: string | null
	checkedAt: string
}

const MAX_OUTPUT_LINES = 120
const MAX_TASKS = 20
const MAX_CONCURRENT_RUNNING_TASKS = 2
const RUNNING_TASK_SILENCE_TIMEOUT_MS = 120000
const RUNNING_TASK_RUNTIME_GRACE_MS = 120000
const STRICT_SCENARIO_TIMEOUT_MS = 660000
const STRICT_INTEGRITY_THRESHOLD = 95
const DEMO_COCKPIT_EXPECTED_BEATS = 6

function getTaskMaxRuntimeMs(mode: OrchestratorLaunchMode): number {
	if (mode === 'certify-strict') {
		return STRICT_SCENARIO_TIMEOUT_MS * 3 + 300000
	}

	return STRICT_SCENARIO_TIMEOUT_MS + RUNNING_TASK_RUNTIME_GRACE_MS
}

function getBackendBaseUrl(): string {
	const configured = (process.env.NEXT_PUBLIC_BASE_URL || '').trim()
	if (configured.length > 0) {
		return configured.replace(/\/+$/, '')
	}

	return 'http://localhost:8080'
}

async function probeUrl(url: string): Promise<{
	ok: boolean
	statusCode: number | null
	errorMessage: string | null
}> {
	try {
		const response = await fetch(url, {
			method: 'GET',
			cache: 'no-store',
			signal: AbortSignal.timeout(5000),
		})

		return {
			ok: response.ok,
			statusCode: response.status,
			errorMessage: response.ok ? null : `HTTP ${response.status}`,
		}
	} catch (error) {
		return {
			ok: false,
			statusCode: null,
			errorMessage:
				error instanceof Error ? error.message : 'Network or timeout failure',
		}
	}
}

export async function runOrchestratorPreflight(): Promise<OrchestratorPreflightSummary> {
	const backendBaseUrl = getBackendBaseUrl()
	const backendHealthUrl = `${backendBaseUrl}/api/v1/actuator/health`
	const authProbeUrl = `${backendBaseUrl}/api/v1/auth/check-username?username=testuser`
	const runningTaskCount = getRunningTaskCount()
	const launchCapacityAvailable = runningTaskCount < MAX_CONCURRENT_RUNNING_TASKS

	const [backendHealth, authProbe] = await Promise.all([
		probeUrl(backendHealthUrl),
		probeUrl(authProbeUrl),
	])

	const errorMessage = !backendHealth.ok
		? `backend health failed: ${backendHealth.errorMessage || 'unknown error'}`
		: !authProbe.ok
			? `auth probe failed: ${authProbe.errorMessage || 'unknown error'}`
			: null

	return {
		backendBaseUrl,
		backendHealthUrl,
		authProbeUrl,
		runningTaskCount,
		maxConcurrentRunningTasks: MAX_CONCURRENT_RUNNING_TASKS,
		launchCapacityAvailable,
		backendHealthOk: backendHealth.ok,
		authProbeOk: authProbe.ok,
		backendHealthStatusCode: backendHealth.statusCode,
		authProbeStatusCode: authProbe.statusCode,
		errorMessage,
		checkedAt: new Date().toISOString(),
	}
}

function buildSingleStrictArgs(): string[] {
	const backendBaseUrl = getBackendBaseUrl()
	const backendHealthUrl = `${backendBaseUrl}/api/v1/actuator/health`
	const authProbeUrl = `${backendBaseUrl}/api/v1/auth/check-username?username=testuser`

	return [
		'--scenario',
		'demo-cockpit-deep',
		'--headless',
		'true',
		'--strict',
		'true',
		'--selector-preflight',
		'true',
		'--strict-scene-fallback',
		'false',
		'--capture-screenshots',
		'false',
		'--continue-on-error',
		'false',
		'--checkpoint-mode',
		'off',
		'--scenario-timeout-ms',
		String(STRICT_SCENARIO_TIMEOUT_MS),
		'--integrity-threshold',
		String(STRICT_INTEGRITY_THRESHOLD),
		'--preflight-backend-health-url',
		backendHealthUrl,
		'--preflight-auth-probe-url',
		authProbeUrl,
	]
}

function buildCertifyStrictArgs(): string[] {
	return [
		...buildSingleStrictArgs(),
		'--certify-runs',
		'3',
		'--certify-min-passes',
		'3',
		'--certify-max-strict-failures',
		'0',
		'--certify-max-render-anomalies',
		'0',
		'--certify-max-console-errors',
		'50',
		'--certify-max-page-errors',
		'0',
		'--certify-max-http5xx-responses',
		'2',
		'--certify-max-request-failures',
		'50',
		'--certify-max-beat-fallbacks',
		'2',
		'--certify-max-beat-scene-fallbacks',
		'2',
		'--certify-max-beat-route-fallbacks',
		'0',
		'--certify-min-beat-evidence-rate',
		'100',
		'--certify-min-demo-confidence-score',
		'85',
	]
}

function getTaskStore(): Map<string, OrchestratorTaskInternal> {
	const globalKey = '__chefkixOrchestratorTaskStore'
	const globalScope = globalThis as unknown as {
		[globalKey]?: Map<string, OrchestratorTaskInternal>
	}

	if (!globalScope[globalKey]) {
		globalScope[globalKey] = new Map<string, OrchestratorTaskInternal>()
	}

	return globalScope[globalKey]
}

function trimTaskStore(): void {
	const store = getTaskStore()
	if (store.size <= MAX_TASKS) {
		return
	}

	const sorted = [...store.values()].sort((a, b) =>
		a.startedAt.localeCompare(b.startedAt),
	)
	const removable = sorted.slice(0, Math.max(0, sorted.length - MAX_TASKS))
	for (const task of removable) {
		store.delete(task.taskId)
	}
}

function getRunningTaskCount(): number {
	enforceRunningTaskHealth()

	let count = 0
	for (const task of getTaskStore().values()) {
		if (task.status === 'running') {
			count += 1
		}
	}
	return count
}

function killTaskProcess(task: OrchestratorTaskInternal, force: boolean): void {
	if (!task.child || task.pid == null) {
		return
	}

	try {
		if (process.platform === 'win32') {
			const killArgs = ['/pid', String(task.pid), '/t']
			if (force) {
				killArgs.push('/f')
			}
			const killer = spawn('taskkill', killArgs, {
				windowsHide: true,
				stdio: 'ignore',
			})
			killer.unref()
			return
		}

		task.child.kill(force ? 'SIGKILL' : 'SIGTERM')
	} catch {
		// Best effort kill. Runtime state is still updated for operator visibility.
	}
}

function markTaskStopped(
	task: OrchestratorTaskInternal,
	exitCodeFallback = -1,
): OrchestratorTask {
	task.status = 'stopped'
	task.exitCode = task.exitCode ?? exitCodeFallback
	task.child = null
	task.pid = null
	task.endedAt = task.endedAt ?? new Date().toISOString()
	task.updatedAt = new Date().toISOString()

	return toPublicTask(task)
}

function pushOutput(task: OrchestratorTaskInternal, chunk: string): void {
	const lines = chunk
		.split(/\r?\n/)
		.map(line => line.trimEnd())
		.filter(Boolean)

	if (lines.length === 0) {
		return
	}

	task.recentOutput = [...task.recentOutput, ...lines].slice(-MAX_OUTPUT_LINES)
	task.updatedAt = new Date().toISOString()
	task.lastOutputAt = task.updatedAt

	for (const line of lines) {
		const match = line.match(/Run artifacts written:\s*(.+)$/i)
		if (!match) {
			continue
		}
		const artifactPath = match[1].trim()
		task.artifactDir = artifactPath
		const runIdMatch = artifactPath.match(/run-[^\\/]+$/i)
		task.runId = runIdMatch ? runIdMatch[0] : task.runId
	}
}

function enforceRunningTaskHealth(): void {
	const now = Date.now()

	for (const task of getTaskStore().values()) {
		if (task.status !== 'running' || !task.child) {
			continue
		}

		const lastOutputAtMs = Date.parse(task.lastOutputAt)
		if (!Number.isFinite(lastOutputAtMs)) {
			continue
		}

		const silenceMs = now - lastOutputAtMs
		if (silenceMs <= RUNNING_TASK_SILENCE_TIMEOUT_MS) {
			const startedAtMs = Date.parse(task.startedAt)
			if (Number.isFinite(startedAtMs)) {
				const runtimeMs = now - startedAtMs
				if (runtimeMs > task.maxRuntimeMs) {
					killTaskProcess(task, true)
					task.status = 'failed'
					task.exitCode = task.exitCode ?? 1
					task.errorMessage = `Task watchdog timeout: runtime ${Math.round(
						runtimeMs / 1000,
					)}s exceeded limit ${Math.round(task.maxRuntimeMs / 1000)}s`
					task.recentOutput = [
						...task.recentOutput,
						`[runtime][error] ${task.errorMessage}`,
					].slice(-MAX_OUTPUT_LINES)
					task.child = null
					task.pid = null
					task.endedAt = task.endedAt ?? new Date().toISOString()
					task.updatedAt = new Date().toISOString()
				}
			}

			continue
		}

		killTaskProcess(task, true)
		task.status = 'failed'
		task.exitCode = task.exitCode ?? 1
		task.errorMessage = `Task watchdog timeout: no output for ${Math.round(
			silenceMs / 1000,
		)}s`
		task.recentOutput = [
			...task.recentOutput,
			`[runtime][error] ${task.errorMessage}`,
		].slice(-MAX_OUTPUT_LINES)
		task.child = null
		task.pid = null
		task.endedAt = task.endedAt ?? new Date().toISOString()
		task.updatedAt = new Date().toISOString()
	}
}

function buildArgs(mode: OrchestratorLaunchMode): string[] {
	if (mode === 'certify-strict') {
		return buildCertifyStrictArgs()
	}
	return buildSingleStrictArgs()
}

export function launchOrchestratorTask(
	mode: OrchestratorLaunchMode,
	hostFailover: boolean,
): OrchestratorTask {
	if (getRunningTaskCount() >= MAX_CONCURRENT_RUNNING_TASKS) {
		throw new Error(
			`Too many running tasks. Stop a task before launching a new run (max ${MAX_CONCURRENT_RUNNING_TASKS}).`,
		)
	}

	const taskId = crypto.randomUUID()
	const now = new Date().toISOString()
	const args = ['scripts/live-demo-orchestrator.mjs', ...buildArgs(mode)]
	const command = `node ${args.join(' ')}`

	const task: OrchestratorTaskInternal = {
		taskId,
		mode,
		startedAt: now,
		endedAt: null,
		status: 'running',
		exitCode: null,
		command,
		artifactDir: null,
		runId: null,
		recentOutput: [],
		errorMessage: null,
		runtimeAgeSec: 0,
		lastOutputAgeSec: 0,
		maxRuntimeSec: Math.round(getTaskMaxRuntimeMs(mode) / 1000),
		watchdogRisk: 'healthy',
		pid: null,
		updatedAt: now,
		lastOutputAt: now,
		maxRuntimeMs: getTaskMaxRuntimeMs(mode),
		child: null,
	}

	const store = getTaskStore()
	store.set(taskId, task)
	trimTaskStore()

	const env = { ...process.env }
	if (hostFailover) {
		env.ORCH_ENABLE_HOST_FAILOVER = '1'
	}

	const child = spawn('node', args, {
		cwd: process.cwd(),
		env,
		windowsHide: true,
	})

	task.pid = child.pid ?? null
	task.child = child

	child.stdout.on('data', chunk => {
		pushOutput(task, String(chunk))
	})

	child.stderr.on('data', chunk => {
		pushOutput(task, String(chunk))
	})

	child.on('error', error => {
		task.status = 'failed'
		task.exitCode = 1
		task.errorMessage = error.message
		task.child = null
		task.pid = null
		task.endedAt = new Date().toISOString()
		task.updatedAt = new Date().toISOString()
	})

	child.on('exit', code => {
		if (task.status !== 'stopped') {
			task.exitCode = code ?? 1
			task.status = code === 0 ? 'passed' : 'failed'
			task.endedAt = new Date().toISOString()
		}
		task.child = null
		task.pid = null
		task.updatedAt = new Date().toISOString()
	})

	return {
		taskId: task.taskId,
		mode: task.mode,
		startedAt: task.startedAt,
		endedAt: task.endedAt,
		status: task.status,
		exitCode: task.exitCode,
		command: task.command,
		artifactDir: task.artifactDir,
		runId: task.runId,
		recentOutput: task.recentOutput,
		errorMessage: task.errorMessage,
		runtimeAgeSec: 0,
		lastOutputAgeSec: 0,
		maxRuntimeSec: Math.round(task.maxRuntimeMs / 1000),
		watchdogRisk: 'healthy',
	}
}

function toPublicTask(task: OrchestratorTaskInternal): OrchestratorTask {
	const now = Date.now()
	const startedAtMs = Date.parse(task.startedAt)
	const lastOutputAtMs = Date.parse(task.lastOutputAt)
	const runtimeAgeSec = Number.isFinite(startedAtMs)
		? Math.max(0, Math.round((now - startedAtMs) / 1000))
		: 0
	const lastOutputAgeSec = Number.isFinite(lastOutputAtMs)
		? Math.max(0, Math.round((now - lastOutputAtMs) / 1000))
		: 0
	const silenceRatio = RUNNING_TASK_SILENCE_TIMEOUT_MS > 0
		? (lastOutputAgeSec * 1000) / RUNNING_TASK_SILENCE_TIMEOUT_MS
		: 0
	const runtimeRatio = task.maxRuntimeMs > 0
		? (runtimeAgeSec * 1000) / task.maxRuntimeMs
		: 0
	const riskRatio = Math.max(silenceRatio, runtimeRatio)
	const watchdogRisk: OrchestratorTask['watchdogRisk'] =
		riskRatio >= 0.9 ? 'critical' : riskRatio >= 0.75 ? 'warning' : 'healthy'

	return {
		taskId: task.taskId,
		mode: task.mode,
		startedAt: task.startedAt,
		endedAt: task.endedAt,
		status: task.status,
		exitCode: task.exitCode,
		command: task.command,
		artifactDir: task.artifactDir,
		runId: task.runId,
		recentOutput: task.recentOutput,
		errorMessage: task.errorMessage,
		runtimeAgeSec,
		lastOutputAgeSec,
		maxRuntimeSec: Math.round(task.maxRuntimeMs / 1000),
		watchdogRisk,
	}
}

export function listOrchestratorTasks(): OrchestratorTask[] {
	enforceRunningTaskHealth()

	const tasks = [...getTaskStore().values()].sort((a, b) =>
		b.startedAt.localeCompare(a.startedAt),
	)
	return tasks.map(toPublicTask)
}

export function stopOrchestratorTask(taskId: string): OrchestratorTask | null {
	const task = getTaskStore().get(taskId)
	if (!task) {
		return null
	}

	if (task.status === 'running') {
		killTaskProcess(task, true)
	}

	return markTaskStopped(task)
}

export function stopAllOrchestratorTasks(): {
	stoppedTaskIds: string[]
	alreadyFinishedTaskIds: string[]
} {
	const stoppedTaskIds: string[] = []
	const alreadyFinishedTaskIds: string[] = []

	for (const task of getTaskStore().values()) {
		if (task.status === 'running') {
			killTaskProcess(task, true)
			markTaskStopped(task)
			stoppedTaskIds.push(task.taskId)
			continue
		}

		alreadyFinishedTaskIds.push(task.taskId)
	}

	return {
		stoppedTaskIds,
		alreadyFinishedTaskIds,
	}
}

export function cleanupOrchestratorTasks(keepLatest = 10): {
	removedTaskIds: string[]
	keptTaskIds: string[]
} {
	const boundedKeepLatest = Math.max(0, keepLatest)
	const tasks = [...getTaskStore().values()].sort((a, b) =>
		b.startedAt.localeCompare(a.startedAt),
	)
	const removable = tasks.slice(boundedKeepLatest).filter(task => task.status !== 'running')

	for (const task of removable) {
		getTaskStore().delete(task.taskId)
	}

	return {
		removedTaskIds: removable.map(task => task.taskId),
		keptTaskIds: [...getTaskStore().keys()],
	}
}

async function readProgressSummary(
	artifactDir: string | null,
): Promise<OrchestratorProgressSummary | null> {
	if (!artifactDir) {
		return null
	}

	const progressPath = path.join(artifactDir, 'run-progress.json')
	try {
		const raw = await readFile(progressPath, 'utf8')
		const parsed = JSON.parse(raw) as {
			scenarioResults?: Array<{ status?: string }>
			forensics?: {
				strictAssertionFailures?: number
				renderAnomalies?: number
				beatsWithEvidence?: number
				beatsWithValueArc?: number
				beatsWithPhaseCoverage?: number
				beatFallbacks?: number
				beatSceneFallbacks?: number
				beatRouteFallbacks?: number
				consoleErrors?: number
				pageErrors?: number
				requestFailures?: number
				http5xxResponses?: number
			}
			warnings?: string[]
			errors?: string[]
			preflight?: {
				core?: string
			}
		}
		const latestScenario = parsed.scenarioResults?.[parsed.scenarioResults.length - 1]
		const expectedBeats = DEMO_COCKPIT_EXPECTED_BEATS
		const beatsWithEvidence =
			typeof parsed.forensics?.beatsWithEvidence === 'number'
				? parsed.forensics.beatsWithEvidence
				: null
		const beatsWithValueArc =
			typeof parsed.forensics?.beatsWithValueArc === 'number'
				? parsed.forensics.beatsWithValueArc
				: null
		const beatsWithPhaseCoverage =
			typeof parsed.forensics?.beatsWithPhaseCoverage === 'number'
				? parsed.forensics.beatsWithPhaseCoverage
				: null
		const strictAssertionFailures =
			typeof parsed.forensics?.strictAssertionFailures === 'number'
				? parsed.forensics.strictAssertionFailures
				: null
		const renderAnomalies =
			typeof parsed.forensics?.renderAnomalies === 'number'
				? parsed.forensics.renderAnomalies
				: null
		const beatFallbacks =
			typeof parsed.forensics?.beatFallbacks === 'number'
				? parsed.forensics.beatFallbacks
				: null
		const beatSceneFallbacks =
			typeof parsed.forensics?.beatSceneFallbacks === 'number'
				? parsed.forensics.beatSceneFallbacks
				: null
		const beatRouteFallbacks =
			typeof parsed.forensics?.beatRouteFallbacks === 'number'
				? parsed.forensics.beatRouteFallbacks
				: null
		const consoleErrors =
			typeof parsed.forensics?.consoleErrors === 'number'
				? parsed.forensics.consoleErrors
				: null
		const pageErrors =
			typeof parsed.forensics?.pageErrors === 'number'
				? parsed.forensics.pageErrors
				: null
		const requestFailures =
			typeof parsed.forensics?.requestFailures === 'number'
				? parsed.forensics.requestFailures
				: null
		const http5xxResponses =
			typeof parsed.forensics?.http5xxResponses === 'number'
				? parsed.forensics.http5xxResponses
				: null
		const warningCount = Array.isArray(parsed.warnings) ? parsed.warnings.length : null
		const errorCount = Array.isArray(parsed.errors) ? parsed.errors.length : null
		const preflightCoreStatus =
			typeof parsed.preflight?.core === 'string' ? parsed.preflight.core : null

		const computeRate = (value: number | null): number | null => {
			if (value == null || expectedBeats <= 0) {
				return null
			}
			return Math.round((value / expectedBeats) * 100)
		}

		const criticalFindings: string[] = []
		if ((strictAssertionFailures ?? 0) > 0) {
			criticalFindings.push(`strict assertion failures: ${strictAssertionFailures}`)
		}
		if ((renderAnomalies ?? 0) > 0) {
			criticalFindings.push(`render anomalies: ${renderAnomalies}`)
		}
		if (beatsWithEvidence != null && beatsWithEvidence < expectedBeats) {
			criticalFindings.push(
				`beat evidence incomplete: ${beatsWithEvidence}/${expectedBeats}`,
			)
		}
		if (beatsWithValueArc != null && beatsWithValueArc < expectedBeats) {
			criticalFindings.push(
				`value arcs incomplete: ${beatsWithValueArc}/${expectedBeats}`,
			)
		}
		if (beatsWithPhaseCoverage != null && beatsWithPhaseCoverage < expectedBeats) {
			criticalFindings.push(
				`phase coverage incomplete: ${beatsWithPhaseCoverage}/${expectedBeats}`,
			)
		}
		if ((beatRouteFallbacks ?? 0) > 0) {
			criticalFindings.push(`route fallbacks detected: ${beatRouteFallbacks}`)
		}
		if ((pageErrors ?? 0) > 0) {
			criticalFindings.push(`page errors: ${pageErrors}`)
		}
		if ((http5xxResponses ?? 0) > 0) {
			criticalFindings.push(`http 5xx responses: ${http5xxResponses}`)
		}
		if (preflightCoreStatus && preflightCoreStatus !== 'passed') {
			criticalFindings.push(`preflight core status: ${preflightCoreStatus}`)
		}

		return {
			status: latestScenario?.status ?? null,
			strictAssertionFailures,
			renderAnomalies,
			beatsWithEvidence,
			beatsWithValueArc,
			beatsWithPhaseCoverage,
			expectedBeats,
			beatFallbacks,
			beatSceneFallbacks,
			beatRouteFallbacks,
			consoleErrors,
			pageErrors,
			requestFailures,
			http5xxResponses,
			warningCount,
			errorCount,
			preflightCoreStatus,
			beatEvidenceRate: computeRate(beatsWithEvidence),
			beatValueArcRate: computeRate(beatsWithValueArc),
			beatPhaseCoverageRate: computeRate(beatsWithPhaseCoverage),
			criticalFindings,
		}
	} catch {
		return null
	}
}

export async function getOrchestratorTask(taskId: string): Promise<
	| {
		task: OrchestratorTask
		progress: OrchestratorProgressSummary | null
	  }
	| null
> {
	enforceRunningTaskHealth()

	const task = getTaskStore().get(taskId)
	if (!task) {
		return null
	}

	const progress = await readProgressSummary(task.artifactDir)
	return {
		task: toPublicTask(task),
		progress,
	}
}
