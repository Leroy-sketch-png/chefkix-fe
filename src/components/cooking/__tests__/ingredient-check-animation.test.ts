import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(
	join(process.cwd(), 'src/components/cooking/IngredientCheck.tsx'),
	'utf8',
)

describe('IngredientCheck animation colors', () => {
	it('leaves semantic color transitions to complete CSS utilities', () => {
		expect(source).toContain("'border-success bg-success'")
		expect(source).toContain("'border-border-medium bg-transparent'")
		expect(source).toContain('transition-colors')
		expect(source).not.toContain('backgroundColor:')
		expect(source).not.toContain('borderColor:')
	})
})
