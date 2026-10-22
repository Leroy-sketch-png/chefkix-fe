import { fireEvent, render, screen } from '@testing-library/react'
import { CookingSubstitutionButton } from '@/components/cooking/CookingSubstitutionButton'
import { SubstitutionButton } from '../SubstitutionButton'
import { suggestSubstitutions } from '@/services/ai'

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => ({ user: { allergenFlags: ['peanuts', 'custom:kiwi'] } }),
}))
jest.mock('@/hooks/useAuthActionGuard', () => ({
	useAuthActionGuard: () => ({ requireAuth: () => true }),
}))
jest.mock('@/services/ai', () => ({ suggestSubstitutions: jest.fn() }))
jest.mock('@/services/cookingSession', () => ({
	submitSubstitutionFeedback: jest.fn(),
}))
beforeEach(() => {
	jest.clearAllMocks()
	jest.mocked(suggestSubstitutions).mockResolvedValue({
		success: true,
		message: 'ok',
		statusCode: 200,
		data: {
			originalIngredient: 'butter',
			reason: 'unavailable',
			substitutions: [
				{
					name: 'peanut oil',
					ratio: '1:1',
					notes: '',
					confidenceScore: 0.9,
					allergenSafety: { status: 'SAFE' },
					suggestionId: '1',
					candidateReceipt: 'receipt',
				},
			],
		},
	})
})
it.each(['recipe', 'cooking'])(
	'forwards the saved profile and excludes blocked primary actions in %s',
	async surface => {
		const onChoice = jest.fn()
		render(
			surface === 'recipe' ? (
				<SubstitutionButton ingredientName='butter' sessionId='session' />
			) : (
				<CookingSubstitutionButton
					ingredientName='butter'
					recipeTitle='Pasta'
					onChoice={onChoice}
				/>
			),
		)
		fireEvent.click(
			screen.getByRole('button', {
				name:
					surface === 'recipe'
						? 'findSubstituteFor'
						: 'findSubstituteForIngredient',
			}),
		)
		const accept = await screen.findByRole('button', {
			name: surface === 'recipe' ? 'substitutionWorks' : 'useSubstitute',
		})
		expect(jest.mocked(suggestSubstitutions).mock.calls[0][4]).toEqual([
			'peanuts',
			'custom:kiwi',
		])
		expect(accept).toBeDisabled()
		fireEvent.click(accept)
		expect(onChoice).not.toHaveBeenCalled()
		expect(screen.getByTestId('allergen-safety-blocked')).toBeInTheDocument()
	},
)
