import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const VISUAL_DIR = path.dirname(__filename)
const RUN_STATE_PATH = path.join(VISUAL_DIR, '.run-state.json')
const AUDIT_DIRS_TO_RESET = fs
	.readdirSync(VISUAL_DIR, { withFileTypes: true })
	.filter(entry => entry.isDirectory() && entry.name.startsWith('_audit_'))
	.map(entry => path.join(VISUAL_DIR, entry.name))
const DIRS_TO_RESET = [
	path.join(VISUAL_DIR, 'raw-captures'),
	path.join(VISUAL_DIR, 'raw-archive'),
	path.join(VISUAL_DIR, 'shots'),
	path.join(VISUAL_DIR, 'ai-review'),
	path.join(VISUAL_DIR, 'test-results'),
	path.join(VISUAL_DIR, 'report'),
	...AUDIT_DIRS_TO_RESET,
]

function writeJson(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true })
	fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function main() {
	const runState = {
		runId: new Date().toISOString().replace(/[:.]/g, '-'),
		preparedAt: new Date().toISOString(),
	}

	for (const dirPath of DIRS_TO_RESET) {
		fs.rmSync(dirPath, { recursive: true, force: true })
	}

	writeJson(RUN_STATE_PATH, runState)

	console.log(`[visual-prepare] Prepared clean visual run: ${runState.runId}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
	main()
}
