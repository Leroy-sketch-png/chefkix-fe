import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const VISUAL_DIR = path.dirname(__filename)
const RUN_STATE_PATH = path.join(VISUAL_DIR, '.run-state.json')
const RAW_CAPTURES_DIR = path.join(VISUAL_DIR, 'raw-captures')
const AI_REVIEW_DIR = path.join(VISUAL_DIR, 'ai-review')
const TEST_RESULTS_DIR = path.join(VISUAL_DIR, 'test-results')

function readJson(filePath) {
	if (!fs.existsSync(filePath)) return null
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'))
	} catch {
		return null
	}
}

function walkFiles(dirPath) {
	if (!fs.existsSync(dirPath)) return []

	const files = []
	for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
		const fullPath = path.join(dirPath, entry.name)
		if (entry.isDirectory()) {
			files.push(...walkFiles(fullPath))
			continue
		}

		if (entry.isFile()) {
			files.push(fullPath)
		}
	}

	return files
}

function listAuditDevices() {
	if (!fs.existsSync(VISUAL_DIR)) return []
	return fs
		.readdirSync(VISUAL_DIR, { withFileTypes: true })
		.filter(entry => entry.isDirectory() && entry.name.startsWith('_audit_'))
		.map(entry => entry.name.replace(/^_audit_/, ''))
		.sort()
}

function summarizeAuditAliases(device) {
	const dirPath = path.join(VISUAL_DIR, `_audit_${device}`)
	if (!fs.existsSync(dirPath)) {
		return { device, totalImages: 0, latestImages: [] }
	}

	const files = fs
		.readdirSync(dirPath, { withFileTypes: true })
		.filter(entry => entry.isFile())
		.map(entry => entry.name)
		.filter(name => /\.(png|jpe?g|webp)$/i.test(name))
		.sort()

	return {
		device,
		totalImages: files.length,
		latestImages: files.slice(0, 6),
	}
}

function summarizeRawCaptureDevices() {
	if (!fs.existsSync(RAW_CAPTURES_DIR)) return []
	return fs
		.readdirSync(RAW_CAPTURES_DIR, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)
		.sort()
		.map(device => {
			const manifest = readJson(
				path.join(RAW_CAPTURES_DIR, device, 'manifest.json'),
			)
			const entries = Array.isArray(manifest?.entries) ? manifest.entries : []
			const latestEntries = entries
				.slice()
				.sort((left, right) =>
					String(right.timestamp ?? '').localeCompare(
						String(left.timestamp ?? ''),
					),
				)
				.slice(0, 6)
				.map(entry => ({
					name: entry.name,
					state: entry.state,
					durationMs: entry.durationMs,
					timestamp: entry.timestamp,
				}))

			return {
				device,
				runId: manifest?.runId ?? null,
				generatedAt: manifest?.generatedAt ?? null,
				totalScreenshots: manifest?.totalScreenshots ?? entries.length,
				latestEntries,
			}
		})
}

function summarizeAiReview() {
	const manifest = readJson(path.join(AI_REVIEW_DIR, 'manifest.json'))
	const nextBatch = readJson(path.join(AI_REVIEW_DIR, 'next-batch.json'))
	const batches = readJson(path.join(AI_REVIEW_DIR, 'batches.json'))
	const nextBatchRecord = nextBatch?.batch ?? nextBatch

	return {
		hasManifest: Boolean(manifest),
		totalReviewImages:
			manifest?.totals?.reviewImages ??
			manifest?.verification?.totalReviewImages ??
			0,
		batchCount:
			manifest?.totals?.reviewBatches ??
			(Array.isArray(batches?.batches) ? batches.batches.length : 0),
		nextBatch:
			nextBatchRecord && Array.isArray(nextBatchRecord.images)
				? {
						label: nextBatchRecord.label ?? nextBatchRecord.id ?? null,
						device: nextBatchRecord.device ?? null,
						imageCount: nextBatchRecord.images.length,
						totalPayloadKB:
							nextBatchRecord.totalPayloadKB ??
							nextBatchRecord.payloadKB ??
							null,
					}
				: null,
	}
}

function summarizeFailures() {
	const lastRun = readJson(path.join(TEST_RESULTS_DIR, '.last-run.json'))
	const failedTests = Array.isArray(lastRun?.failedTests)
		? lastRun.failedTests
		: []
	const errorContexts = walkFiles(TEST_RESULTS_DIR)
		.filter(
			filePath => path.basename(filePath).toLowerCase() === 'error-context.md',
		)
		.sort()
		.map(filePath => path.relative(VISUAL_DIR, filePath).replace(/\\/g, '/'))

	return {
		status: lastRun?.status ?? null,
		failedTests,
		errorContexts,
	}
}

function buildSummary() {
	const runState = readJson(RUN_STATE_PATH)
	const rawCaptureDevices = summarizeRawCaptureDevices()
	const auditDevices = listAuditDevices().map(summarizeAuditAliases)
	const aiReview = summarizeAiReview()
	const failures = summarizeFailures()

	return {
		runId: runState?.runId ?? null,
		preparedAt: runState?.preparedAt ?? null,
		rawCaptureDevices,
		auditDevices,
		aiReview,
		failures,
	}
}

function printHumanSummary(summary) {
	console.log(
		`[visual:status] runId=${summary.runId ?? 'none'} preparedAt=${summary.preparedAt ?? 'unknown'}`,
	)

	if (summary.rawCaptureDevices.length === 0) {
		console.log('[visual:status] No raw capture manifests found.')
	} else {
		for (const device of summary.rawCaptureDevices) {
			console.log(
				`[visual:status] ${device.device}: ${device.totalScreenshots} screenshots${device.generatedAt ? ` (generated ${device.generatedAt})` : ''}`,
			)
			for (const entry of device.latestEntries) {
				console.log(
					`  - ${entry.name} [${entry.state}]${typeof entry.durationMs === 'number' ? ` ${entry.durationMs}ms` : ''}`,
				)
			}
		}
	}

	for (const device of summary.auditDevices) {
		console.log(
			`[visual:status] _audit_${device.device}: ${device.totalImages} images${device.latestImages.length > 0 ? ` (${device.latestImages.join(', ')})` : ''}`,
		)
	}

	console.log(
		`[visual:status] ai-review: ${summary.aiReview.totalReviewImages} images across ${summary.aiReview.batchCount} batches`,
	)
	if (summary.aiReview.nextBatch) {
		console.log(
			`[visual:status] next batch: ${summary.aiReview.nextBatch.label ?? 'unnamed'} (${summary.aiReview.nextBatch.imageCount} images, ${summary.aiReview.nextBatch.totalPayloadKB ?? 'unknown'}KB payload)`,
		)
	}

	if (summary.failures.status && summary.failures.status !== 'passed') {
		console.log(
			`[visual:status] last run status: ${summary.failures.status} (${summary.failures.failedTests.length} failed test(s))`,
		)
		for (const errorContext of summary.failures.errorContexts.slice(0, 6)) {
			console.log(`  - error context: ${errorContext}`)
		}
	}
}

function main() {
	const jsonMode = process.argv.slice(2).includes('--json')
	const summary = buildSummary()

	if (jsonMode) {
		console.log(JSON.stringify(summary, null, 2))
		return
	}

	printHumanSummary(summary)
}

main()
