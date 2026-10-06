import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import AllergenSafetyDemoPage from '@/app/(main)/demo/allergen-safety/page'

it('presents fixed examples without fabricated provider responses or a fake prompt runner', () => {
	render(<AllergenSafetyDemoPage />)
	expect(screen.getByText('Guarded interface example')).toBeInTheDocument()
	expect(screen.getByText('Unfiltered interface example')).toBeInTheDocument()
	expect(screen.queryByText('GPT-4o response')).not.toBeInTheDocument()
	expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
	expect(
		screen.queryByRole('button', { name: /run comparison/i }),
	).not.toBeInTheDocument()
	expect(screen.getByText(/No provider was called/)).toBeInTheDocument()
})
