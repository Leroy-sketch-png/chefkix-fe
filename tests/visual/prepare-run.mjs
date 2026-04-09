import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const VISUAL_DIR = path.dirname(__filename)
const RUN_STATE_PATH = path.join(VISUAL_DIR, '.run-state.json')
const DIRS_TO_RESET = [
	path.join(VISUAL_DIR, 'raw-captures'),
	path.join(VISUAL_DIR, 'raw-archive'),
	path.join(VISUAL_DIR, 'shots'),
	path.join(VISUAL_DIR, 'ai-review'),
	path.join(VISUAL_DIR, 'test-results'),
	path.join(VISUAL_DIR, 'report'),
]

function writeJson(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true })
	fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

const runState = {
	runId: new Date().toISOString().replace(/[:.]/g, '-'),
	preparedAt: new Date().toISOString(),
}

for (const dirPath of DIRS_TO_RESET) {
	fs.rmSync(dirPath, { recursive: true, force: true })
}

writeJson(RUN_STATE_PATH, runState)

console.log(`[visual-prepare] Prepared clean visual run: ${runState.runId}`)
