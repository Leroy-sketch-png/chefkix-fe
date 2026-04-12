/**
 * Export and sanitize AI-safe audit images.
 *
 * Standard export:
 *   node tests/visual/export-audit.mjs
 *   node tests/visual/export-audit.mjs mobile-iphone
 *
 * Guarantees:
 *   - <= MAX_DIM in both dimensions
 *   - <= MAX_FILE_KB in file size (JPEG fallback when PNG stays too heavy)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const VISUAL_DIR = path.dirname(__filename)
const SHOTS_DIR = path.join(VISUAL_DIR, 'shots')
const MAX_DIM = 1920
const MAX_FILE_KB = 500
const JPEG_QUALITY = 82

function walkImageFiles(dirPath) {
	if (!fs.existsSync(dirPath)) return []
	const results = []
	for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
		const full = path.join(dirPath, entry.name)
		if (entry.isDirectory()) {
			results.push(...walkImageFiles(full))
		} else if (entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name)) {
			results.push(full)
		}
	}
	return results
}

function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true })
}

function getAuditOutputDir(device) {
	return path.join(VISUAL_DIR, `_audit_${device}`)
}

function listShotDevices() {
	if (!fs.existsSync(SHOTS_DIR)) return []
	return fs
		.readdirSync(SHOTS_DIR, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)
}

function listExistingAuditDevices(deviceFilter = null) {
	const devices = fs
		.readdirSync(VISUAL_DIR, { withFileTypes: true })
		.filter(entry => entry.isDirectory() && entry.name.startsWith('_audit_'))
		.map(entry => entry.name.replace(/^_audit_/, ''))

	if (deviceFilter) {
		return devices.filter(device => device === deviceFilter)
	}

	return devices
}

function removeSiblingVariants(dirPath, baseName) {
	for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
		const candidate = path.join(dirPath, `${baseName}${ext}`)
		if (fs.existsSync(candidate)) {
			fs.rmSync(candidate, { force: true })
		}
	}
}

async function writeOptimizedImage(sharpInstance, outputBasePath) {
	const pngPath = `${outputBasePath}.png`
	await sharpInstance
		.png({ compressionLevel: 9, palette: true, effort: 7 })
		.toFile(pngPath)

	const pngStats = fs.statSync(pngPath)
	if (pngStats.size / 1024 <= MAX_FILE_KB) {
		const pngMeta = await sharp(pngPath).metadata()
		return {
			outputPath: pngPath,
			format: 'png',
			sizeKB: Math.round((pngStats.size / 1024) * 10) / 10,
			width: pngMeta.width ?? 0,
			height: pngMeta.height ?? 0,
		}
	}

	const jpegPath = `${outputBasePath}.jpg`
	await sharpInstance
		.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
		.toFile(jpegPath)
	fs.rmSync(pngPath, { force: true })

	const jpegStats = fs.statSync(jpegPath)
	const jpegMeta = await sharp(jpegPath).metadata()
	return {
		outputPath: jpegPath,
		format: 'jpeg',
		sizeKB: Math.round((jpegStats.size / 1024) * 10) / 10,
		width: jpegMeta.width ?? 0,
		height: jpegMeta.height ?? 0,
	}
}

async function buildSafePipelineFromBuffer(sourceBuffer) {
	const metadata = await sharp(sourceBuffer).metadata()
	const width = metadata.width ?? 0
	const height = metadata.height ?? 0

	if (width > MAX_DIM || height > MAX_DIM) {
		return sharp(sourceBuffer).resize({
			width: MAX_DIM,
			height: MAX_DIM,
			fit: 'inside',
			withoutEnlargement: true,
		})
	}

	return sharp(sourceBuffer)
}

async function writeSafeAuditFileFromBuffer({
	sourceBuffer,
	outDir,
	baseName,
}) {
	ensureDir(outDir)
	removeSiblingVariants(outDir, baseName)
	const pipeline = await buildSafePipelineFromBuffer(sourceBuffer)
	return writeOptimizedImage(pipeline, path.join(outDir, baseName))
}

function toLatestAliasBaseName(entry) {
	return `${entry.name}-${entry.state}-latest`
}

function toArchiveAbsolutePath(relativeFile) {
	return path.join(VISUAL_DIR, relativeFile.split('/').join(path.sep))
}

function readArchiveBuffer(archiveAbsolutePath) {
	const raw = fs.readFileSync(archiveAbsolutePath)
	if (/\.gz$/i.test(archiveAbsolutePath)) {
		return gunzipSync(raw)
	}
	return raw
}

export async function exportAuditArtifacts({ deviceFilter = null } = {}) {
	const devices = deviceFilter ? [deviceFilter] : listShotDevices()
	let totalExported = 0
	let jpegFallbacks = 0
	const perDevice = []

	for (const device of devices) {
		const deviceDir = path.join(SHOTS_DIR, device)
		if (!fs.existsSync(deviceDir)) {
			continue
		}

		const outDir = getAuditOutputDir(device)
		fs.rmSync(outDir, { recursive: true, force: true })
		ensureDir(outDir)

		const images = walkImageFiles(deviceDir)
		let exported = 0
		let deviceJpegFallbacks = 0

		for (const imagePath of images) {
			const rel = path.relative(deviceDir, imagePath).replace(/\\/g, '/')
			const parts = rel.split('/')
			const route = parts[0]
			const state = parts[1]
			const rawBasename = parts[parts.length - 1].replace(
				/\.(png|jpe?g|webp)$/i,
				'',
			)
			const suffix = rawBasename === 'review' ? '' : `-${rawBasename}`
			const baseName = `${device}-${route}-${state}${suffix}`
			const result = await writeSafeAuditFileFromBuffer({
				sourceBuffer: fs.readFileSync(imagePath),
				outDir,
				baseName,
			})

			exported += 1
			if (result.format === 'jpeg') {
				deviceJpegFallbacks += 1
			}
		}

		totalExported += exported
		jpegFallbacks += deviceJpegFallbacks
		perDevice.push({
			device,
			exported,
			jpegFallbacks: deviceJpegFallbacks,
			outDir,
		})
	}

	return {
		deviceFilter,
		totalExported,
		jpegFallbacks,
		perDevice,
	}
}

export async function exportLatestAuditAliases({
	device,
	manifestEntries = [],
} = {}) {
	if (!device) {
		throw new Error('exportLatestAuditAliases requires a device')
	}

	const outDir = getAuditOutputDir(device)
	ensureDir(outDir)

	const uniqueEntries = new Map()
	for (const entry of manifestEntries) {
		if (!entry?.name || !entry?.state || !entry?.file) {
			continue
		}
		uniqueEntries.set(`${entry.name}:${entry.state}`, entry)
	}

	let exported = 0
	let jpegFallbacks = 0
	const written = []

	for (const entry of uniqueEntries.values()) {
		const archiveAbsolutePath = toArchiveAbsolutePath(entry.file)
		if (!fs.existsSync(archiveAbsolutePath)) {
			continue
		}

		const result = await writeSafeAuditFileFromBuffer({
			sourceBuffer: readArchiveBuffer(archiveAbsolutePath),
			outDir,
			baseName: toLatestAliasBaseName(entry),
		})

		exported += 1
		if (result.format === 'jpeg') {
			jpegFallbacks += 1
		}
		written.push({
			name: entry.name,
			state: entry.state,
			file: path.basename(result.outputPath),
			width: result.width,
			height: result.height,
			sizeKB: result.sizeKB,
			format: result.format,
		})
	}

	return {
		device,
		exported,
		jpegFallbacks,
		outDir,
		written,
	}
}

export async function sanitizeAuditArtifacts({ deviceFilter = null } = {}) {
	const devices = listExistingAuditDevices(deviceFilter)
	let rewritten = 0
	let jpegFallbacks = 0
	let remainingOversized = 0
	const touchedFiles = []

	for (const device of devices) {
		const outDir = getAuditOutputDir(device)
		for (const filePath of walkImageFiles(outDir)) {
			const metadata = await sharp(filePath).metadata()
			const width = metadata.width ?? 0
			const height = metadata.height ?? 0
			const sizeKB = fs.statSync(filePath).size / 1024

			if (width <= MAX_DIM && height <= MAX_DIM && sizeKB <= MAX_FILE_KB) {
				continue
			}

			const baseName = path.basename(filePath, path.extname(filePath))
			const result = await writeSafeAuditFileFromBuffer({
				sourceBuffer: fs.readFileSync(filePath),
				outDir,
				baseName,
			})

			rewritten += 1
			if (result.format === 'jpeg') {
				jpegFallbacks += 1
			}
			touchedFiles.push({
				device,
				baseName,
				file: path.basename(result.outputPath),
				width: result.width,
				height: result.height,
				sizeKB: result.sizeKB,
				format: result.format,
			})
		}

		for (const filePath of walkImageFiles(outDir)) {
			const metadata = await sharp(filePath).metadata()
			const width = metadata.width ?? 0
			const height = metadata.height ?? 0
			if (width > MAX_DIM || height > MAX_DIM) {
				remainingOversized += 1
			}
		}
	}

	return {
		deviceFilter,
		rewritten,
		jpegFallbacks,
		remainingOversized,
		touchedFiles,
	}
}

async function main() {
	const deviceFilter = process.argv[2] ?? null
	const result = await exportAuditArtifacts({ deviceFilter })
	for (const deviceResult of result.perDevice) {
		console.log(
			`[export-audit] ${deviceResult.device}: ${deviceResult.exported} images (${deviceResult.jpegFallbacks} -> JPEG) -> ${deviceResult.outDir}`,
		)
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
	main().catch(err => {
		console.error('[export-audit] Failed:', err.message)
		process.exitCode = 1
	})
}
