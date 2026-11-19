import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('pantry edit reconciliation wiring', () => {
	it('applies the active category filter to the authoritative edit response', () => {
		const page = readFileSync(
			join(process.cwd(), 'src/app/(main)/pantry/page.tsx'),
			'utf8',
		)

		expect(page).toContain(
			'reconcilePantryItems(prev, updated, filterCategory)',
		)
	})
})
