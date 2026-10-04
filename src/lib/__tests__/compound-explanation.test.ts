import {
	parseCompoundExplanation,
	getCompoundExplanation,
} from '@/lib/compound-explanation'

describe('compound evidence contract', () => {
	it('preserves measured zero and leaves missing or invalid nutrition unavailable', () => {
		const result = parseCompoundExplanation({
			explanation: 'Presence data',
			overlapPercent: 0,
			originalNutrition: { calories: 0, fat: '', protein: false },
		})
		expect(result?.overlapPercent).toBe(0)
		expect(result?.originalNutrition).toEqual({
			calories: 0,
			fat: null,
			protein: null,
		})
		expect(result?.substituteNutrition).toEqual({
			calories: null,
			fat: null,
			protein: null,
		})
		expect(
			parseCompoundExplanation({ explanation: 'No numeric evidence' })
				?.overlapPercent,
		).toBeNull()
	})
	it('uses producer units, including exactly one percent and full fractional overlap', () => {
		expect(
			parseCompoundExplanation({ overlapPercent: 1 })?.overlapPercent,
		).toBe(1)
		expect(
			parseCompoundExplanation({ overlap_percentage: 1 })?.overlapPercent,
		).toBe(100)
		expect(
			parseCompoundExplanation({ overlap_percentage: 0.73 })?.overlapPercent,
		).toBe(73)
		expect(
			parseCompoundExplanation({ explanation: 'invalid', overlapPercent: 101 })
				?.overlapPercent,
		).toBeNull()
	})
	it('unwraps official evidence and requires an explicit grounding assertion', () => {
		const result = parseCompoundExplanation({
			data: {
				compound_explanation: {
					overlap_percentage: 0.5,
					shared_compounds: [' A ', '', { compound_name: 'B' }],
					is_compound_grounded: true,
				},
			},
		})
		expect(result).toMatchObject({
			overlapPercent: 50,
			isGrounded: true,
			source: 'chemistry',
			sharedCompounds: [{ name: 'A' }, { name: 'B' }],
		})
		expect(
			parseCompoundExplanation({ explanation: 'Claim', source: 'chemistry' })
				?.isGrounded,
		).toBe(false)
	})
	it.each([{ degraded: true }, { success: false }, { isMock: true }])(
		'does not show evidence from a degraded or illustrative envelope: %j',
		state => {
			const result = parseCompoundExplanation({
				...state,
				data: {
					overlapPercent: 90,
					isGrounded: true,
					sharedCompounds: ['A'],
					originalNutrition: { calories: 100 },
				},
			})
			expect(result).toMatchObject({
				overlapPercent: null,
				isGrounded: false,
				sharedCompounds: [],
				originalNutrition: { calories: null },
			})
		},
	)
	it('does not fabricate demo chemistry, even under the retired mock flag', () => {
		process.env.NEXT_PUBLIC_COMPOUND_EXPLANATION_MOCK = 'true'
		expect(getCompoundExplanation('Butter', { name: 'Coconut Oil' })).toBeNull()
		delete process.env.NEXT_PUBLIC_COMPOUND_EXPLANATION_MOCK
	})
})
