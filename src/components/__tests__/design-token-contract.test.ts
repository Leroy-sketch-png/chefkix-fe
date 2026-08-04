import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

function productionSources(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const path = join(directory, entry.name)
		if (entry.isDirectory()) {
			return entry.name === '__tests__' ? [] : productionSources(path)
		}
		return /\.(ts|tsx)$/.test(entry.name) ? [path] : []
	})
}

describe('component design-token contract', () => {
	it('does not use the invalid utility-color-token construction', () => {
		const componentRoot = join(process.cwd(), 'src/components')
		for (const sourcePath of productionSources(componentRoot)) {
			const source = readFileSync(sourcePath, 'utf8')
			expect(source).not.toMatch(/\b(?:bg|border|fill|from|text|to)-color-/)
		}
	})

	it('registers every source-used ChefKix color in the active Tailwind theme', () => {
		const globals = readFileSync(
			join(process.cwd(), 'src/app/globals.css'),
			'utf8',
		)
		const themeStart = globals.indexOf('@theme inline')
		const root = globals.slice(0, themeStart)
		const theme = globals.slice(themeStart)
		const rootColors = new Set(
			Array.from(root.matchAll(/--color-([a-z0-9-]+)\s*:/g), match => match[1]),
		)
		const themeColors = new Set(
			Array.from(
				theme.matchAll(/--color-([a-z0-9-]+)\s*:/g),
				match => match[1],
			),
		)
		const utilityColorPattern =
			/\b(?:bg|border|fill|from|ring|shadow|stroke|text|to|via)-([a-z][a-z0-9-]*)(?=\/|\s|'|"|`|\)|\]|:|$)/g
		const source = productionSources(join(process.cwd(), 'src'))
			.map(sourcePath => readFileSync(sourcePath, 'utf8'))
			.join('\n')
		const usedChefKixColors = new Set(
			Array.from(
				source.matchAll(utilityColorPattern),
				match => match[1],
			).filter(color => rootColors.has(color)),
		)

		for (const color of usedChefKixColors) {
			expect(themeColors).toContain(color)
		}
	})
})
