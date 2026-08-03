import fs from 'fs'
import path from 'path'

interface MessageCatalog {
	common?: {
		eyebrows?: Record<string, string>
	}
}

const SOURCE_ROOT = path.resolve(process.cwd(), 'src')
const MESSAGE_PATH = path.resolve(process.cwd(), 'messages', 'en.json')
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])

function collectSourceFiles(directory: string): string[] {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const entryPath = path.join(directory, entry.name)
		if (entry.isDirectory()) return collectSourceFiles(entryPath)
		return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : []
	})
}

function collectReferencedEyebrows(): string[] {
	const references = new Set<string>()
	const keyPattern = /\btc\(\s*['"]eyebrows\.([^'"]+)['"]/g

	for (const file of collectSourceFiles(SOURCE_ROOT)) {
		const source = fs.readFileSync(file, 'utf8')
		for (const match of source.matchAll(keyPattern)) references.add(match[1])
	}

	return [...references].sort()
}

describe('common eyebrow translations', () => {
	it('keeps every source reference and catalog entry in sync', () => {
		const messages = JSON.parse(
			fs.readFileSync(MESSAGE_PATH, 'utf8'),
		) as MessageCatalog
		const catalog = messages.common?.eyebrows ?? {}
		const referenced = collectReferencedEyebrows()
		const catalogKeys = Object.keys(catalog).sort()

		expect(referenced.length).toBeGreaterThan(0)
		expect(catalogKeys).toEqual(referenced)
		expect(Object.values(catalog).every(value => value.trim().length > 0)).toBe(
			true,
		)
	})

	it('retains interpolation parameters used by count labels', () => {
		const messages = JSON.parse(
			fs.readFileSync(MESSAGE_PATH, 'utf8'),
		) as MessageCatalog
		const catalog = messages.common?.eyebrows ?? {}

		for (const key of ['nLoggedDays', 'nProfiles', 'nTrending', 'totalLinks']) {
			expect(catalog[key]).toContain('{n}')
		}
	})
})
