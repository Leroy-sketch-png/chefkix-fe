import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(
	join(process.cwd(), 'src/app/(main)/recipes/[id]/page.tsx'),
	'utf8',
)

describe('recipe difficulty badge styles', () => {
	it('owns every difficulty fill as a complete Tailwind token', () => {
		for (const className of [
			'bg-success/80',
			'bg-warning/80',
			'bg-error/80',
			'bg-xp/80',
		]) {
			expect(source).toContain(className)
		}

		expect(source).toContain(
			'const DIFFICULTY_BADGE_CLASSES: Record<Difficulty, string>',
		)
		expect(source).toContain('DIFFICULTY_BADGE_CLASSES.Beginner')
	})

	it('does not construct Tailwind background tokens at runtime', () => {
		expect(source).not.toContain("replace('bg-', 'bg-')")
		expect(source).not.toContain("concat('/80')")
	})
})
