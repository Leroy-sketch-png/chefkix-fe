import fs from 'fs'
import path from 'path'

const read = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('Celebration and cooking-history icon contract', () => {
	it('uses typed icons for first-cook unlocks', () => {
		const source = read('src/components/completion/FirstCookCelebration.tsx')

		expect(source).toContain('icon: LucideIcon')
		expect(source).toContain('icon: Award')
		expect(source).toContain('icon: Zap')
		expect(source).toContain('icon: Camera')
		expect(source).toContain('icon: Target')
		expect(source).not.toContain('emoji:')
	})

	it('uses bounded decorative status icons throughout cooking history', () => {
		const source = read('src/components/pending/CookingHistoryTab.tsx')

		expect(source).toContain("<Camera aria-hidden='true'")
		expect(source).toContain("<TriangleAlert aria-hidden='true'")
		expect(source).toContain("<CircleCheck aria-hidden='true'")
		expect(source).not.toMatch(/<span>\s*[^A-Za-z0-9<{]+\s*<\/span>/)
	})

	it('contains no malformed emoji variation selector', () => {
		const malformedSelector = String.fromCharCode(0xef, 0xb8, 0x8f)
		const sources = [
			read('src/components/completion/FirstCookCelebration.tsx'),
			read('src/components/pending/CookingHistoryTab.tsx'),
		]

		for (const source of sources) {
			expect(source).not.toContain(malformedSelector)
		}
	})
})
