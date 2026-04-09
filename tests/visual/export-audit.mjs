/**
 * Export AI-safe flat audit images from the shots/ directory.
 *
 * Usage:
 *   node tests/visual/export-audit.mjs                 # export all
 *   node tests/visual/export-audit.mjs desktop-chrome   # export one device
 *   node tests/visual/export-audit.mjs mobile-iphone    # export one device
 *
 * Produces: tests/visual/_audit_<device>/<device>-<route>-<state>.png
 * Every exported image is guaranteed <= MAX_DIM in both dimensions.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const VISUAL_DIR = path.dirname(__filename)
const SHOTS_DIR = path.join(VISUAL_DIR, 'shots')
const MAX_DIM = 1920

function walkPngs(dirPath) {
	if (!fs.existsSync(dirPath)) return []
	const results = []
	for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
		const full = path.join(dirPath, entry.name)
		if (entry.isDirectory()) results.push(...walkPngs(full))
		else if (entry.isFile() && entry.name.endsWith('.png')) results.push(full)
	}
	return results
}

async function main() {
	const deviceFilter = process.argv[2] ?? null
	const devices = deviceFilter
		? [deviceFilter]
		: fs
				.readdirSync(SHOTS_DIR)
				.filter(d => fs.statSync(path.join(SHOTS_DIR, d)).isDirectory())

	for (const device of devices) {
		const deviceDir = path.join(SHOTS_DIR, device)
		const outDir = path.join(VISUAL_DIR, `_audit_${device}`)
		fs.rmSync(outDir, { recursive: true, force: true })
		fs.mkdirSync(outDir, { recursive: true })

		const pngs = walkPngs(deviceDir)
		let exported = 0

		for (const png of pngs) {
			// Derive a flat name: device-route-state.png
			// Input structure: shots/<device>/<route>/<state>/review.png or tile-NNN.png
			const rel = path.relative(deviceDir, png).replace(/\\/g, '/')
			const parts = rel.split('/')
			// parts: [route, state, filename] or [route, state, filename]
			const route = parts[0]
			const state = parts[1]
			const basename = parts[parts.length - 1].replace('.png', '')
			const suffix = basename === 'review' ? '' : `-${basename}`
			const outName = `${device}-${route}-${state}${suffix}.png`
			const outPath = path.join(outDir, outName)

			const meta = await sharp(png).metadata()
			const w = meta.width ?? 0
			const h = meta.height ?? 0

			if (w > MAX_DIM || h > MAX_DIM) {
				await sharp(png)
					.resize({
						width: MAX_DIM,
						height: MAX_DIM,
						fit: 'inside',
						withoutEnlargement: true,
					})
					.png()
					.toFile(outPath)
			} else {
				fs.copyFileSync(png, outPath)
			}
			exported++
		}

		console.log(`[export-audit] ${device}: ${exported} images → ${outDir}`)
	}
}

main().catch(err => {
	console.error('[export-audit] Failed:', err.message)
	process.exitCode = 1
})
