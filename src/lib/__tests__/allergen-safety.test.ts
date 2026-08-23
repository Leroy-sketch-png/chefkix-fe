import {
	findRecipeAllergenConflicts,
	resolveAllergenSafety,
} from '@/lib/allergen-safety'

const substitution = (name: string, extra: Record<string, unknown> = {}) => ({
	name,
	ratio: '1:1',
	notes: '',
	confidenceScore: 0.9,
	...extra,
})
describe('allergen safety contract', () => {
	it('blocks a known profile conflict with a specific allergen reason', () => {
		const result = resolveAllergenSafety(substitution('peanut flour'), [
			'peanuts',
		])

		expect(result).toMatchObject({
			status: 'blocked',
			flaggedAllergens: ['peanuts'],
			source: 'profile',
		})
		expect(result.reason).toContain('Peanuts')
	})

	it('returns check when ingredient evidence is not specific enough', () => {
		const result = resolveAllergenSafety(substitution('artisan sauce'), [
			'peanuts',
		])

		expect(result.status).toBe('check')
	})

	it('honors backend safety decisions when the Lead contract is present', () => {
		const result = resolveAllergenSafety(
			substitution('sunflower seed butter', {
				allergenSafety: {
					status: 'safe',
					flaggedAllergens: [],
					reason: 'Validated by the allergen guard.',
				},
			}),
			['peanuts'],
		)

		expect(result).toEqual({
			status: 'safe',
			flaggedAllergens: [],
			reason: 'Validated by the allergen guard.',
			source: 'backend',
		})
	})

	it('finds recipe ingredient conflicts for the detail-page banner', () => {
		const conflicts = findRecipeAllergenConflicts(
			['olive oil', 'peanut butter', 'cinnamon'],
			['peanuts'],
		)

		expect(conflicts).toEqual([
			expect.objectContaining({
				ingredient: 'peanut butter',
				flaggedAllergens: ['peanuts'],
			}),
		])
	})
})
