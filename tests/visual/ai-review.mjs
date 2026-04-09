import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync, gzipSync } from 'node:zlib'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const VISUAL_DIR = path.dirname(__filename)
const RUN_STATE_PATH = path.join(VISUAL_DIR, '.run-state.json')
const RAW_CAPTURES_DIR = path.join(VISUAL_DIR, 'raw-captures')
const RAW_ARCHIVE_DIR = path.join(VISUAL_DIR, 'raw-archive')
const SHOTS_DIR = path.join(VISUAL_DIR, 'shots')
const AI_REVIEW_DIR = path.join(VISUAL_DIR, 'ai-review')
const SHOTS_MANIFEST_PATH = path.join(SHOTS_DIR, 'manifest.json')
const AI_REVIEW_MANIFEST_PATH = path.join(AI_REVIEW_DIR, 'manifest.json')
const AI_REVIEW_BATCHES_PATH = path.join(AI_REVIEW_DIR, 'batches.json')
const AI_REVIEW_NEXT_BATCH_PATH = path.join(AI_REVIEW_DIR, 'next-batch.json')

const DEFAULT_CONFIG = {
	// Copilot Vision rejects images >= 2000px in multi-image requests.
	// Keep a safety margin (1920) so we never hit the server-side limit.
	maxDimension: 1920,
	tileSize: 1536,
	tileOverlap: 128,
	resizeToleranceRatio: 1.12,
	maxBatchImages: 6,
}

function parseNumberOption(value, fallback) {
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

function resolveConfig(overrides = {}) {
	const maxDimension = Math.max(
		1,
		Math.round(
			overrides.maxDimension ??
				parseNumberOption(
					process.env.VISUAL_AI_REVIEW_MAX_DIMENSION,
					DEFAULT_CONFIG.maxDimension,
				),
		),
	)
	const tileSize = Math.min(
		maxDimension,
		Math.max(
			1,
			Math.round(
				overrides.tileSize ??
					parseNumberOption(
						process.env.VISUAL_AI_REVIEW_TILE_SIZE,
						DEFAULT_CONFIG.tileSize,
					),
			),
		),
	)
	const tileOverlap = Math.min(
		tileSize - 1,
		Math.max(
			0,
			Math.round(
				overrides.tileOverlap ??
					parseNumberOption(
						process.env.VISUAL_AI_REVIEW_TILE_OVERLAP,
						DEFAULT_CONFIG.tileOverlap,
					),
			),
		),
	)
	const resizeToleranceRatio = Math.max(
		1,
		overrides.resizeToleranceRatio ??
			parseNumberOption(
				process.env.VISUAL_AI_REVIEW_RESIZE_TOLERANCE_RATIO,
				DEFAULT_CONFIG.resizeToleranceRatio,
			),
	)
	const maxBatchImages = Math.max(
		1,
		Math.round(
			overrides.maxBatchImages ??
				parseNumberOption(
					process.env.VISUAL_AI_REVIEW_MAX_BATCH_IMAGES,
					DEFAULT_CONFIG.maxBatchImages,
				),
		),
	)

	return {
		maxDimension,
		tileSize,
		tileOverlap,
		resizeToleranceRatio,
		maxBatchImages,
	}
}

function toPosixPath(value) {
	return value.split(path.sep).join('/')
}

function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true })
}

function readJson(filePath) {
	if (!fs.existsSync(filePath)) {
		return null
	}

	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'))
	} catch {
		return null
	}
}

function writeJson(filePath, value) {
	ensureDir(path.dirname(filePath))
	fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function walkFiles(dirPath) {
	if (!fs.existsSync(dirPath)) {
		return []
	}

	const children = fs.readdirSync(dirPath, { withFileTypes: true })
	const filePaths = []

	for (const child of children) {
		const childPath = path.join(dirPath, child.name)
		if (child.isDirectory()) {
			filePaths.push(...walkFiles(childPath))
			continue
		}

		if (child.isFile()) {
			filePaths.push(childPath)
		}
	}

	return filePaths
}

function purgeRawCapturePngs() {
	for (const filePath of walkFiles(RAW_CAPTURES_DIR)) {
		if (filePath.toLowerCase().endsWith('.png')) {
			fs.rmSync(filePath, { force: true })
		}
	}
}

function loadRunState() {
	const state = readJson(RUN_STATE_PATH)
	if (!state || typeof state.runId !== 'string') {
		return null
	}

	return state
}

function parseCaptureFromRelative(relativePath, sourceType) {
	const normalizedRelativePath = toPosixPath(relativePath)
	const segments = normalizedRelativePath.split('/')
	if (segments.length !== 3) {
		return null
	}

	const [device, routeName, stateFile] = segments
	const state = stateFile.replace(/\.png(?:\.gz)?$/i, '')

	return {
		key: `${device}/${routeName}/${state}`,
		device,
		routeName,
		state,
		sourceType,
		relativePath: normalizedRelativePath,
	}
}

function loadManifestIndex(runState) {
	const manifestIndex = new Map()
	const manifestFiles = walkFiles(RAW_CAPTURES_DIR).filter(filePath => {
		return path.basename(filePath).toLowerCase() === 'manifest.json'
	})

	for (const manifestFile of manifestFiles) {
		const parsed = readJson(manifestFile)
		if (!parsed || !Array.isArray(parsed.entries)) {
			continue
		}

		if (runState?.runId && parsed.runId && parsed.runId !== runState.runId) {
			continue
		}

		for (const entry of parsed.entries) {
			if (
				typeof entry?.device !== 'string' ||
				typeof entry?.name !== 'string' ||
				typeof entry?.state !== 'string'
			) {
				continue
			}

			manifestIndex.set(`${entry.device}/${entry.name}/${entry.state}`, entry)
		}
	}

	if (manifestIndex.size === 0 && !runState) {
		const legacyManifest = readJson(path.join(SHOTS_DIR, 'manifest.json'))
		for (const entry of legacyManifest?.entries ?? []) {
			if (
				typeof entry?.device !== 'string' ||
				typeof entry?.name !== 'string' ||
				typeof entry?.state !== 'string'
			) {
				continue
			}

			manifestIndex.set(`${entry.device}/${entry.name}/${entry.state}`, entry)
		}
	}

	return manifestIndex
}

function collectCaptureSources(manifestIndex, runState) {
	const manifestKeys = new Set(manifestIndex.keys())
	const captures = new Map()
	const sourcePriority = {
		archive: 0,
		raw: 1,
		legacy: 2,
	}

	const appendSource = (absolutePath, baseDir, sourceType, matcher) => {
		const relativePath = toPosixPath(path.relative(baseDir, absolutePath))
		if (!matcher(relativePath)) {
			return
		}

		const parsed = parseCaptureFromRelative(relativePath, sourceType)
		if (!parsed) {
			return
		}

		if (manifestKeys.size > 0 && !manifestKeys.has(parsed.key)) {
			return
		}

		const existing = captures.get(parsed.key)
		if (
			existing &&
			sourcePriority[existing.sourceType] <= sourcePriority[sourceType]
		) {
			return
		}

		captures.set(parsed.key, {
			...parsed,
			absolutePath,
		})
	}

	for (const absolutePath of walkFiles(RAW_ARCHIVE_DIR)) {
		appendSource(absolutePath, RAW_ARCHIVE_DIR, 'archive', relativePath =>
			relativePath.toLowerCase().endsWith('.png.gz'),
		)
	}

	for (const absolutePath of walkFiles(RAW_CAPTURES_DIR)) {
		appendSource(absolutePath, RAW_CAPTURES_DIR, 'raw', relativePath => {
			return (
				relativePath.toLowerCase().endsWith('.png') &&
				!relativePath.toLowerCase().endsWith('manifest.json')
			)
		})
	}

	if (!runState || manifestKeys.size === 0) {
		for (const absolutePath of walkFiles(SHOTS_DIR)) {
			appendSource(absolutePath, SHOTS_DIR, 'legacy', relativePath => {
				return (
					relativePath.toLowerCase().endsWith('.png') &&
					relativePath.split('/').length === 3
				)
			})
		}
	}

	return [...captures.values()].sort((left, right) =>
		left.key.localeCompare(right.key),
	)
}

function archivePathFor(capture) {
	return path.join(
		RAW_ARCHIVE_DIR,
		capture.device,
		capture.routeName,
		`${capture.state}.png.gz`,
	)
}

function archiveRelativePathFor(capture) {
	return toPosixPath(
		path.join(
			'raw-archive',
			capture.device,
			capture.routeName,
			`${capture.state}.png.gz`,
		),
	)
}

function readCaptureBuffer(capture) {
	if (capture.sourceType === 'archive') {
		return gunzipSync(fs.readFileSync(capture.absolutePath))
	}

	return fs.readFileSync(capture.absolutePath)
}

function prepareCanonicalCapture(capture) {
	if (capture.sourceType === 'archive') {
		return {
			...capture,
			archivePath: capture.absolutePath,
			archiveRelativePath: archiveRelativePathFor(capture),
		}
	}

	const archivePath = archivePathFor(capture)
	const archiveRelativePath = archiveRelativePathFor(capture)
	ensureDir(path.dirname(archivePath))
	fs.writeFileSync(archivePath, gzipSync(fs.readFileSync(capture.absolutePath)))
	fs.rmSync(capture.absolutePath, { force: true })

	return {
		...capture,
		sourceType: 'archive',
		absolutePath: archivePath,
		archivePath,
		archiveRelativePath,
	}
}

function pickReviewStrategy(width, height, config) {
	if (width <= config.maxDimension && height <= config.maxDimension) {
		return 'copy'
	}

	const oversizeRatio = Math.max(
		width / config.maxDimension,
		height / config.maxDimension,
	)

	if (oversizeRatio <= config.resizeToleranceRatio) {
		return 'resize'
	}

	return 'tile'
}

function buildAxisPositions(totalLength, tileLength, overlap) {
	if (totalLength <= tileLength) {
		return [0]
	}

	const positions = []
	const step = Math.max(1, tileLength - overlap)
	let offset = 0

	while (offset + tileLength < totalLength) {
		positions.push(offset)
		offset += step
	}

	const finalOffset = Math.max(0, totalLength - tileLength)
	if (positions[positions.length - 1] !== finalOffset) {
		positions.push(finalOffset)
	}

	return [...new Set(positions)]
}

function getSafeOutputDir(capture) {
	return path.join(SHOTS_DIR, capture.device, capture.routeName, capture.state)
}

function getSafeRelativeFile(capture, fileName) {
	return toPosixPath(
		path.join(
			'shots',
			capture.device,
			capture.routeName,
			capture.state,
			fileName,
		),
	)
}

async function buildCopiedReview(capture, sourceBuffer, originalMeta) {
	const outputDir = getSafeOutputDir(capture)
	ensureDir(outputDir)

	const fileName = 'review.png'
	const outputPath = path.join(outputDir, fileName)
	await sharp(sourceBuffer).png().toFile(outputPath)

	return [
		{
			file: getSafeRelativeFile(capture, fileName),
			width: originalMeta.width,
			height: originalMeta.height,
			order: 1,
			variant: 'copy',
			tile: null,
		},
	]
}

async function buildResizedReview(capture, sourceBuffer, config) {
	const outputDir = getSafeOutputDir(capture)
	ensureDir(outputDir)

	const fileName = 'review.png'
	const outputPath = path.join(outputDir, fileName)
	await sharp(sourceBuffer)
		.resize({
			width: config.maxDimension,
			height: config.maxDimension,
			fit: 'inside',
			withoutEnlargement: true,
		})
		.png()
		.toFile(outputPath)

	const metadata = await sharp(outputPath).metadata()

	return [
		{
			file: getSafeRelativeFile(capture, fileName),
			width: metadata.width,
			height: metadata.height,
			order: 1,
			variant: 'resize',
			tile: null,
		},
	]
}

async function buildTiledReview(capture, sourceBuffer, originalMeta, config) {
	const outputDir = getSafeOutputDir(capture)
	ensureDir(outputDir)

	const tileWidth = Math.min(config.tileSize, originalMeta.width)
	const tileHeight = Math.min(config.tileSize, originalMeta.height)
	const xPositions = buildAxisPositions(
		originalMeta.width,
		tileWidth,
		config.tileOverlap,
	)
	const yPositions = buildAxisPositions(
		originalMeta.height,
		tileHeight,
		config.tileOverlap,
	)
	const reviewImages = []
	let order = 1

	for (const top of yPositions) {
		for (const left of xPositions) {
			const extractedWidth = Math.min(tileWidth, originalMeta.width - left)
			const extractedHeight = Math.min(tileHeight, originalMeta.height - top)
			const fileName = `tile-${String(order).padStart(3, '0')}.png`
			const outputPath = path.join(outputDir, fileName)

			await sharp(sourceBuffer)
				.extract({
					left,
					top,
					width: extractedWidth,
					height: extractedHeight,
				})
				.png()
				.toFile(outputPath)

			reviewImages.push({
				file: getSafeRelativeFile(capture, fileName),
				width: extractedWidth,
				height: extractedHeight,
				order,
				variant: 'tile',
				tile: {
					left,
					top,
					width: extractedWidth,
					height: extractedHeight,
					overlap: config.tileOverlap,
				},
			})
			order += 1
		}
	}

	return reviewImages
}

async function processCapture(capture, manifestIndex, config) {
	const sourceBuffer = readCaptureBuffer(capture)
	const originalMetadata = await sharp(sourceBuffer).metadata()
	if (!originalMetadata.width || !originalMetadata.height) {
		throw new Error(`Could not read image metadata for ${capture.archivePath}`)
	}

	const manifestEntry = manifestIndex.get(capture.key)
	const archiveStat = fs.statSync(capture.archivePath)
	const reviewStrategy = pickReviewStrategy(
		originalMetadata.width,
		originalMetadata.height,
		config,
	)

	let reviewImages = []
	if (reviewStrategy === 'copy') {
		reviewImages = await buildCopiedReview(
			capture,
			sourceBuffer,
			originalMetadata,
		)
	} else if (reviewStrategy === 'resize') {
		reviewImages = await buildResizedReview(capture, sourceBuffer, config)
	} else {
		reviewImages = await buildTiledReview(
			capture,
			sourceBuffer,
			originalMetadata,
			config,
		)
	}

	return {
		id: capture.key,
		routePath: manifestEntry?.route ?? null,
		routeName: capture.routeName,
		state: capture.state,
		device: capture.device,
		original: {
			archiveFile: capture.archiveRelativePath,
			width: originalMetadata.width,
			height: originalMetadata.height,
			capturedAt: manifestEntry?.timestamp ?? archiveStat.mtime.toISOString(),
			durationMs: manifestEntry?.durationMs ?? 0,
			sourceType: capture.sourceType,
		},
		reviewStrategy,
		reviewImages,
	}
}

async function verifyReviewImages(entries, config) {
	const violations = []
	let totalReviewImages = 0
	let maxWidth = 0
	let maxHeight = 0

	for (const entry of entries) {
		for (const image of entry.reviewImages) {
			totalReviewImages += 1
			const metadata = await sharp(path.join(VISUAL_DIR, image.file)).metadata()
			const width = metadata.width ?? 0
			const height = metadata.height ?? 0

			maxWidth = Math.max(maxWidth, width)
			maxHeight = Math.max(maxHeight, height)

			if (width > config.maxDimension || height > config.maxDimension) {
				violations.push({ file: image.file, width, height })
			}
		}
	}

	if (violations.length > 0) {
		throw new Error(
			`AI review image limit violated: ${JSON.stringify(violations, null, 2)}`,
		)
	}

	return {
		allAiReviewImagesWithinLimit: true,
		violationCount: 0,
		totalReviewImages,
		maxWidth,
		maxHeight,
	}
}

async function scanOversizedVisualImages(rootDir, maxDimension) {
	const oversizedFiles = []
	const candidates = walkFiles(rootDir).filter(filePath =>
		/\.(png|jpg|jpeg|webp)$/i.test(filePath),
	)

	for (const filePath of candidates) {
		try {
			const metadata = await sharp(filePath).metadata()
			const width = metadata.width ?? 0
			const height = metadata.height ?? 0
			if (width > maxDimension || height > maxDimension) {
				oversizedFiles.push({
					file: toPosixPath(path.relative(VISUAL_DIR, filePath)),
					width,
					height,
				})
			}
		} catch {
			// Ignore unreadable files.
		}
	}

	return oversizedFiles.sort((left, right) =>
		left.file.localeCompare(right.file),
	)
}

function sortEntriesForBatching(entries) {
	const strategyOrder = { tile: 0, resize: 1, copy: 2 }

	return [...entries].sort((left, right) => {
		if (left.device !== right.device) {
			return left.device.localeCompare(right.device)
		}

		if (
			strategyOrder[left.reviewStrategy] !== strategyOrder[right.reviewStrategy]
		) {
			return (
				strategyOrder[left.reviewStrategy] - strategyOrder[right.reviewStrategy]
			)
		}

		if (left.original.height !== right.original.height) {
			return right.original.height - left.original.height
		}

		if (left.routeName !== right.routeName) {
			return left.routeName.localeCompare(right.routeName)
		}

		return left.state.localeCompare(right.state)
	})
}

function createEntrySegments(entry, maxBatchImages) {
	const totalSegments = Math.ceil(entry.reviewImages.length / maxBatchImages)
	const segments = []

	for (let index = 0; index < totalSegments; index += 1) {
		const images = entry.reviewImages.slice(
			index * maxBatchImages,
			(index + 1) * maxBatchImages,
		)
		segments.push({
			entryId: entry.id,
			device: entry.device,
			routeName: entry.routeName,
			routePath: entry.routePath,
			state: entry.state,
			reviewStrategy: entry.reviewStrategy,
			segmentIndex: index + 1,
			totalSegments,
			imageCount: images.length,
			images,
		})
	}

	return segments
}

function createBatch(device, index, maxBatchImages) {
	return {
		id: `${device}-batch-${String(index).padStart(3, '0')}`,
		index,
		device,
		maxBatchImages,
		imageCount: 0,
		routes: new Set(),
		segments: [],
		images: [],
	}
}

function finalizeBatch(batch) {
	return {
		id: batch.id,
		index: batch.index,
		device: batch.device,
		maxBatchImages: batch.maxBatchImages,
		imageCount: batch.imageCount,
		routeCount: batch.routes.size,
		routes: [...batch.routes],
		segments: batch.segments,
		images: batch.images,
	}
}

function buildReviewBatches(entries, config) {
	const batches = []
	let currentBatch = null

	for (const entry of sortEntriesForBatching(entries)) {
		for (const segment of createEntrySegments(entry, config.maxBatchImages)) {
			if (
				!currentBatch ||
				currentBatch.device !== segment.device ||
				currentBatch.imageCount + segment.imageCount > config.maxBatchImages
			) {
				if (currentBatch) {
					batches.push(finalizeBatch(currentBatch))
				}

				currentBatch = createBatch(
					segment.device,
					batches.length + 1,
					config.maxBatchImages,
				)
			}

			currentBatch.imageCount += segment.imageCount
			currentBatch.routes.add(`${segment.routeName}:${segment.state}`)
			currentBatch.segments.push(segment)
			currentBatch.images.push(
				...segment.images.map(image => ({
					file: image.file,
					width: image.width,
					height: image.height,
					order: image.order,
					routeName: segment.routeName,
					state: segment.state,
					segmentIndex: segment.segmentIndex,
					totalSegments: segment.totalSegments,
				})),
			)
		}
	}

	if (currentBatch) {
		batches.push(finalizeBatch(currentBatch))
	}

	return batches
}

function getNextReviewBatch({ batches, batchIndex = 1, device }) {
	const filteredBatches = device
		? batches.filter(batch => batch.device === device)
		: batches
	const resolvedIndex = Math.max(1, batchIndex) - 1
	return filteredBatches[resolvedIndex] ?? null
}

function isBatchAiSafe(batch, config) {
	if (!batch) {
		return true
	}

	return batch.images.every(
		image =>
			image.width <= config.maxDimension && image.height <= config.maxDimension,
	)
}

export function formatBatchSummary(batch) {
	if (!batch) {
		return 'No AI review batch available.'
	}

	const lines = [
		`\n   Next AI review batch: ${batch.id} [${batch.device}] (${batch.imageCount} image(s))`,
	]
	for (const image of batch.images) {
		lines.push(
			`      - ${image.file} (${image.width}x${image.height}) [${image.routeName}/${image.state}]`,
		)
	}

	return lines.join('\n')
}

export async function buildAiReviewArtifacts(overrides = {}) {
	const config = resolveConfig(overrides)
	const runState = loadRunState()
	const device =
		typeof overrides.device === 'string' ? overrides.device : undefined
	const batchIndex = Number.isFinite(Number(overrides.batchIndex))
		? Number(overrides.batchIndex)
		: 1

	const manifestIndex = loadManifestIndex(runState)
	const sourceCaptures = collectCaptureSources(manifestIndex, runState)
	const canonicalCaptures = sourceCaptures.map(prepareCanonicalCapture)
	purgeRawCapturePngs()

	fs.rmSync(SHOTS_DIR, { recursive: true, force: true })
	fs.rmSync(AI_REVIEW_DIR, { recursive: true, force: true })
	ensureDir(SHOTS_DIR)
	ensureDir(AI_REVIEW_DIR)

	const entries = []
	for (const capture of canonicalCaptures) {
		entries.push(await processCapture(capture, manifestIndex, config))
	}

	const verification = await verifyReviewImages(entries, config)
	// Only verify the AI-safe output directory — raw-captures and raw-archive
	// intentionally contain full-fidelity originals that exceed the limit.
	const remainingOversizedFiles = await scanOversizedVisualImages(
		SHOTS_DIR,
		config.maxDimension,
	)
	if (remainingOversizedFiles.length > 0) {
		throw new Error(
			`Oversized visual images still exist: ${JSON.stringify(remainingOversizedFiles, null, 2)}`,
		)
	}

	const batches = buildReviewBatches(entries, config)
	const nextBatch = getNextReviewBatch({ batches, batchIndex, device })
	const generatedAt = new Date().toISOString()
	const baseDocument = {
		runId: runState?.runId ?? null,
		generatedAt,
		config,
		totals: {
			originalScreenshots: canonicalCaptures.length,
			reviewImages: verification.totalReviewImages,
			reviewBatches: batches.length,
		},
		verification: {
			...verification,
			allVisualImagesWithinLimit: true,
			remainingOversizedFiles,
		},
		recommendedNextBatchId: nextBatch?.id ?? null,
		entries,
	}
	const batchesDocument = {
		runId: runState?.runId ?? null,
		generatedAt,
		config: {
			maxBatchImages: config.maxBatchImages,
		},
		totalBatches: batches.length,
		batches,
	}
	const nextBatchDocument = {
		runId: runState?.runId ?? null,
		generatedAt,
		config: {
			maxBatchImages: config.maxBatchImages,
			maxDimension: config.maxDimension,
		},
		allImagesAiSafe: isBatchAiSafe(nextBatch, config),
		batch: nextBatch,
	}

	writeJson(SHOTS_MANIFEST_PATH, baseDocument)
	writeJson(AI_REVIEW_MANIFEST_PATH, baseDocument)
	writeJson(AI_REVIEW_BATCHES_PATH, batchesDocument)
	writeJson(AI_REVIEW_NEXT_BATCH_PATH, nextBatchDocument)

	return {
		config,
		entries,
		batches,
		nextBatch,
		verification,
		remainingOversizedFiles,
		remainingOversizedImages: remainingOversizedFiles.length,
		totalOriginals: canonicalCaptures.length,
		totalReviewImages: verification.totalReviewImages,
		totalBatches: batches.length,
		shotsManifestPath: SHOTS_MANIFEST_PATH,
		reviewManifestPath: AI_REVIEW_MANIFEST_PATH,
		batchesPath: AI_REVIEW_BATCHES_PATH,
		nextBatchPath: AI_REVIEW_NEXT_BATCH_PATH,
	}
}

function parseCliArgs(argv) {
	const positional = []
	const options = {}

	for (const arg of argv) {
		if (!arg.startsWith('--')) {
			positional.push(arg)
			continue
		}

		const [rawKey, rawValue] = arg.slice(2).split('=')
		options[rawKey] = rawValue ?? true
	}

	return {
		command: positional[0] ?? 'build',
		options,
	}
}

async function main() {
	const { command, options } = parseCliArgs(process.argv.slice(2))
	const result = await buildAiReviewArtifacts(options)

	if (command === 'build' || command === 'verify') {
		console.log(`[ai-review] Originals: ${result.totalOriginals}`)
		console.log(
			`[ai-review] AI-safe images: ${result.totalReviewImages} (max ${result.verification.maxWidth}x${result.verification.maxHeight})`,
		)
		console.log(
			`[ai-review] Oversized images remaining: ${result.remainingOversizedImages}`,
		)
		console.log(`[ai-review] Safe shots manifest: ${result.shotsManifestPath}`)
		console.log(`[ai-review] Review manifest: ${result.reviewManifestPath}`)
		console.log(`[ai-review] Batches: ${result.batchesPath}`)
		console.log(`[ai-review] Next batch: ${result.nextBatchPath}`)
		if (result.nextBatch) {
			console.log(formatBatchSummary(result.nextBatch))
		}
		return
	}

	if (command === 'next-batch') {
		if (!result.nextBatch) {
			console.log(
				'No AI review batches are available yet. Run npm run visual first.',
			)
			process.exitCode = 1
			return
		}

		console.log(formatBatchSummary(result.nextBatch))
		console.log(`\n   Batch JSON: ${result.nextBatchPath}`)
		return
	}

	throw new Error(`Unsupported ai-review command: ${command}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
	main().catch(error => {
		console.error('[ai-review] Failed to build AI review assets.')
		console.error(error instanceof Error ? error.stack || error.message : error)
		process.exitCode = 1
	})
}
