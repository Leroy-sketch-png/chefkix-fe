import { render, screen } from '@testing-library/react'
import { CompoundExplanation, CompoundComparison } from '../CompoundExplanation'

const candidate = {
	name: 'olive oil',
	ratio: '1:1',
	notes: '',
	confidenceScore: 0.7,
	compoundExplanation: { explanation: 'Presence only', isGrounded: false },
}
it('shows unavailable metrics and no independent safety or grounded claim', () => {
	render(
		<>
			<CompoundExplanation
				originalIngredient='butter'
				substitution={candidate}
			/>
			<CompoundComparison
				originalIngredient='butter'
				substitutions={[candidate, { ...candidate, name: 'canola oil' }]}
			/>
		</>,
	)
	expect(screen.getByText('Compound overlap unavailable')).toBeInTheDocument()
	expect(screen.getAllByText(/Unavailable/).length).toBeGreaterThan(2)
	expect(
		screen.queryByText(
			/0% shared|Chemistry-grounded|Allergen profile compatible/,
		),
	).toBeNull()
})
