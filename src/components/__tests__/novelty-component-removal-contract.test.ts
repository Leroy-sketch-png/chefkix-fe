import fs from 'fs'
import path from 'path'

const SRC = path.join(process.cwd(), 'src')
const REMOVED_MODULES = [
	'animated-gradient-text',
	'blur-fade',
	'cool-mode',
	'curtain-reveal',
	'glow-card',
	'magic-card',
	'shiny-button',
	'sparkles-effect',
	'text-loop',
]

const sourceFiles = (directory: string): string[] =>
	fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const target = path.join(directory, entry.name)
		if (entry.isDirectory()) {
			return entry.name === '__tests__' ? [] : sourceFiles(target)
		}
		return /\.(ts|tsx)$/.test(entry.name) ? [target] : []
	})

describe('novelty component removal contract', () => {
	it('keeps removed ornamental modules absent and unreferenced', () => {
		const source = sourceFiles(SRC)
			.map(file => fs.readFileSync(file, 'utf8'))
			.join('\n')

		for (const moduleName of REMOVED_MODULES) {
			expect(
				fs.existsSync(path.join(SRC, 'components', 'ui', `${moduleName}.tsx`)),
			).toBe(false)
			expect(source).not.toContain(`@/components/ui/${moduleName}`)
		}
	})

	it('preserves explicit mobile CTA focus and size contracts', () => {
		const source = fs.readFileSync(
			path.join(SRC, 'components', 'layout', 'MobileBottomNav.tsx'),
			'utf8',
		)

		expect(source).toContain('h-11 w-11')
		expect(source).toContain('h-11 w-full')
		expect(
			source.match(/focus-visible:ring-2/g)?.length,
		).toBeGreaterThanOrEqual(2)
		expect(source).toContain("aria-label={t('signUp')}")
	})

	it('does not retain particle-only completion delays or reveal state', () => {
		const source = fs.readFileSync(
			path.join(SRC, 'components', 'cooking', 'CookingPlayer.tsx'),
			'utf8',
		)

		expect(source).not.toContain('xpBurstToken')
		expect(source).not.toContain('isCurtainOpen')
		expect(source).not.toContain('setTimeout(resolve, 220)')
		expect(source).toContain('showImmediateRewards({')
	})
})
