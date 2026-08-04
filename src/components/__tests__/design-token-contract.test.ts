import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

function productionComponentSources(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const path = join(directory, entry.name)
		if (entry.isDirectory()) {
			return entry.name === '__tests__' ? [] : productionComponentSources(path)
		}
		return /\.(ts|tsx)$/.test(entry.name) ? [path] : []
	})
}

describe('component design-token contract', () => {
	it('does not use the invalid utility-color-token construction', () => {
		const componentRoot = join(process.cwd(), 'src/components')
		for (const sourcePath of productionComponentSources(componentRoot)) {
			const source = readFileSync(sourcePath, 'utf8')
			expect(source).not.toMatch(/\b(?:bg|border|fill|from|text|to)-color-/)
		}
	})

	it('registers progression colors in the active Tailwind theme', () => {
		const globals = readFileSync(
			join(process.cwd(), 'src/app/globals.css'),
			'utf8',
		)
		const theme = globals.slice(globals.indexOf('@theme inline'))
		const progressionTokens = [
			'--color-rare:',
			'--color-medal-bronze:',
			'--color-medal-bronze-glow:',
			'--color-medal-silver:',
			'--color-medal-silver-glow:',
			'--color-medal-gold:',
			'--color-medal-gold-glow:',
		]

		for (const token of progressionTokens) {
			expect(theme).toContain(token)
		}
	})
})
