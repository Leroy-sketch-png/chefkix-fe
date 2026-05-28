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
}

interface OrchestratorTaskInternal extends OrchestratorTask {
	pid: number | null
	updatedAt: string
	child: ChildProcessWithoutNullStreams | null
}

const MAX_OUTPUT_LINES = 120
const MAX_TASKS = 20
const MAX_CONCURRENT_RUNNING_TASKS = 2

const singleStrictArgs = [
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
	'360000',
	'--integrity-threshold',
	'95',
]

const certifyStrictArgs = [
	...singleStrictArgs,
	'--certify-runs',
	'3',
	'--certify-min-passes',
	'3',
	'--certify-max-strict-failures',
	'0',
	'--certify-max-render-anomalies',
	'0',
	'--certify-max-console-errors',
	'0',
	'--certify-max-page-errors',
	'0',
	'--certify-max-http5xx-responses',
	'0',
	'--certify-max-request-failures',
	'0',
	'--certify-max-beat-fallbacks',
	'1',
	'--certify-max-beat-scene-fallbacks',
	'1',
	'--certify-max-beat-route-fallbacks',
	'0',
	'--certify-min-beat-evidence-rate',
	'1',
	'--certify-min-demo-confidence-score',
	'95',
]

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

function buildArgs(mode: OrchestratorLaunchMode): string[] {
	if (mode === 'certify-strict') {
		return certifyStrictArgs
	}
	return singleStrictArgs
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
		pid: null,
		updatedAt: now,
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
	}
}

function toPublicTask(task: OrchestratorTaskInternal): OrchestratorTask {
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
	}
}

export function listOrchestratorTasks(): OrchestratorTask[] {
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

async function readProgressSummary(artifactDir: string | null): Promise<
	| {
		status: string | null
		strictAssertionFailures: number | null
		renderAnomalies: number | null
		beatsWithEvidence: number | null
		beatsWithValueArc: number | null
	  }
	| null
> {
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
			}
		}
		const latestScenario = parsed.scenarioResults?.[parsed.scenarioResults.length - 1]
		return {
			status: latestScenario?.status ?? null,
			strictAssertionFailures:
				typeof parsed.forensics?.strictAssertionFailures === 'number'
					? parsed.forensics.strictAssertionFailures
					: null,
			renderAnomalies:
				typeof parsed.forensics?.renderAnomalies === 'number'
					? parsed.forensics.renderAnomalies
					: null,
			beatsWithEvidence:
				typeof parsed.forensics?.beatsWithEvidence === 'number'
					? parsed.forensics.beatsWithEvidence
					: null,
			beatsWithValueArc:
				typeof parsed.forensics?.beatsWithValueArc === 'number'
					? parsed.forensics.beatsWithValueArc
					: null,
		}
	} catch {
		return null
	}
}

export async function getOrchestratorTask(taskId: string): Promise<
	| {
		task: OrchestratorTask
		progress: {
			status: string | null
			strictAssertionFailures: number | null
			renderAnomalies: number | null
			beatsWithEvidence: number | null
			beatsWithValueArc: number | null
		} | null
	  }
	| null
> {
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
