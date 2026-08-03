import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CreateCommandDeck } from '../CreateCommandDeck'
import { DraftsList } from '../DraftsList'
import { getDraftRecipes } from '@/services/recipe'

jest.mock('@/services/recipe', () => ({
	getDraftRecipes: jest.fn(),
	discardDraft: jest.fn(),
	duplicateRecipe: jest.fn(),
}))

jest.mock('@/components/shared', () => ({
	EmptyStateGamified: ({
		title,
		description,
		primaryAction,
		children,
	}: {
		title: string
		description: string
		primaryAction?: { label: string; onClick?: () => void }
		children?: ReactNode
	}) => (
		<div>
			<h2>{title}</h2>
			<p>{description}</p>
			{primaryAction ? (
				<button type='button' onClick={primaryAction.onClick}>
					{primaryAction.label}
				</button>
			) : null}
			{children}
		</div>
	),
}))

jest.mock('../DraftsListCard', () => ({
	DraftsListCard: ({ draft }: { draft: { title: string } }) => (
		<div>{draft.title}</div>
	),
}))

jest.mock('next-intl', () => {
	const messages: Record<string, string> = {
		draftLibraryEyebrow: 'Recipe drafts',
		draftLibraryTitle: 'Your recipe drafts',
		draftLibraryDescription:
			'Continue a saved draft or start with rough notes. You review every detail before it is published.',
		noDraftsTitlePrime: 'No drafts yet',
		noDraftsDescriptionPrime:
			'Start with rough notes, copied instructions, or a recipe you know by heart. You can review every detail before publishing.',
		createRecipeNow: 'Start a recipe',
		browseRecipeInspiration: 'Browse recipe inspiration',
		createNewRecipe: 'Start a new recipe',
		startFreshSubtitle: 'Turn rough notes into a recipe you can review',
		yourDraftsCount: '1 draft',
	}
	const translate = (key: string) => messages[key] ?? key
	return { useTranslations: () => translate }
})

const mockedGetDraftRecipes = jest.mocked(getDraftRecipes)

describe('creator draft-library entry', () => {
	it('presents the draft library without fabricated pipeline status', () => {
		render(<CreateCommandDeck />)

		expect(
			screen.getByRole('heading', { name: 'Your recipe drafts' }),
		).not.toBeNull()
		expect(screen.queryByText('Creation Pipeline')).toBeNull()
		expect(screen.queryByText('AI Enhance')).toBeNull()
		expect(screen.queryByText('Review & Edit')).toBeNull()
	})

	it('opens the editor from the zero-draft primary action', async () => {
		mockedGetDraftRecipes.mockResolvedValueOnce({
			success: true,
			statusCode: 200,
			data: [],
		})
		const onNewRecipe = jest.fn()

		render(<DraftsList onSelectDraft={jest.fn()} onNewRecipe={onNewRecipe} />)

		const startButton = await screen.findByRole('button', {
			name: 'Start a recipe',
		})
		fireEvent.click(startButton)

		expect(onNewRecipe).toHaveBeenCalledTimes(1)
		expect(screen.queryByText(/Creator badge track/i)).toBeNull()
	})

	it('retains the new-recipe action when server drafts exist', async () => {
		mockedGetDraftRecipes.mockResolvedValueOnce({
			success: true,
			data: [{ id: 'draft-1', title: 'Weeknight noodles' }],
		} as Awaited<ReturnType<typeof getDraftRecipes>>)
		const onNewRecipe = jest.fn()

		render(<DraftsList onSelectDraft={jest.fn()} onNewRecipe={onNewRecipe} />)

		await waitFor(() => {
			expect(screen.getByText('Weeknight noodles')).not.toBeNull()
		})
		fireEvent.click(screen.getByRole('button', { name: /Start a new recipe/i }))

		expect(onNewRecipe).toHaveBeenCalledTimes(1)
	})
})
