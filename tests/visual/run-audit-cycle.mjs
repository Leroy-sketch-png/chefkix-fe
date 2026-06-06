import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const VISUAL_DIR = path.dirname(__filename)
const FE_ROOT = path.resolve(VISUAL_DIR, '..', '..')

function runNodeScript(scriptName, args = []) {
	const result = spawnSync(
		process.execPath,
		[path.join(VISUAL_DIR, scriptName), ...args],
		{
			stdio: 'inherit',
			cwd: FE_ROOT,
			env: process.env,
		},
	)

	if (typeof result.status === 'number') {
		return result.status
	}

	if (result.error) {
		throw result.error
	}

	return 1
}

function parseArgs(argv) {
	const passthrough = []
	let skipAiReview = false
	let jsonStatus = false

	for (const arg of argv) {
		if (arg === '--no-ai-review') {
			skipAiReview = true
			continue
		}

		if (arg === '--status-json') {
			jsonStatus = true
			continue
		}

		passthrough.push(arg)
	}

	return { passthrough, skipAiReview, jsonStatus }
}

function main() {
	const { passthrough, skipAiReview, jsonStatus } = parseArgs(
		process.argv.slice(2),
	)

	console.log('[visual:audit] Running focused visual capture...')
	const focusExitCode = runNodeScript('run-focused.mjs', passthrough)
	if (focusExitCode !== 0) {
		process.exit(focusExitCode)
	}

	if (!skipAiReview) {
		console.log('[visual:audit] Building AI-review artifacts...')
		const aiReviewExitCode = runNodeScript('ai-review.mjs', ['build'])
		if (aiReviewExitCode !== 0) {
			process.exit(aiReviewExitCode)
		}
	}

	console.log('[visual:audit] Visual status summary:')
	const statusArgs = jsonStatus ? ['--json'] : []
	const statusExitCode = runNodeScript('status.mjs', statusArgs)
	process.exit(statusExitCode)
}

main()
