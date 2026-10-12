import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import CreateRecipePage from '../page'
import { getRecipeById } from '@/services/recipe'
import {
	LOCAL_RECIPE_DRAFT_KEY,
	readLocalRecipeDraft,
	saveLocalRecipeDraft,
} from '@/lib/local-recipe-draft'

const replace = jest.fn()
const push = jest.fn()
let draftIdParam: string | null = null

jest.mock('next/navigation', () => ({
	useRouter: () => ({ replace, push }),
	useSearchParams: () => ({ get: () => draftIdParam }),
}))

jest.mock('@/services/recipe', () => ({
	getRecipeById: jest.fn(),
}))

jest.mock('framer-motion', () => {
	const actual = jest.requireActual('framer-motion')
	return {
		...actual,
		AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
	}
})

jest.mock('@/components/layout/PageContainer', () => ({
	PageContainer: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}))

jest.mock('@/components/layout/PageTransition', () => ({
	PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/recipe/CreateCommandDeck', () => ({
	CreateCommandDeck: () => <div>Command deck</div>,
}))

jest.mock('@/components/recipe/DraftsList', () => ({
	DraftsList: ({
		onSelectDraft,
		onNewRecipe,
	}: {
		onSelectDraft: (id: string) => void
		onNewRecipe: () => void
	}) => (
		<div>
			<span>Draft list</span>
			<button type='button' onClick={() => onSelectDraft('server-draft')}>
				Open server draft
			</button>
			<button type='button' onClick={onNewRecipe}>
				Start new recipe
			</button>
		</div>
	),
}))

jest.mock('@/components/recipe', () => ({
	RecipeCreateAiFlow: ({
		onPublishSuccess,
		initialDraft,
		initialManualDraft,
	}: {
		onPublishSuccess: (id: string) => void
		initialDraft?: { title: string }
		initialManualDraft?: { title: string }
	}) => (
		<div>
			<span>
				Editor:{' '}
				{initialDraft?.title ?? initialManualDraft?.title ?? 'New recipe'}
			</span>
			<button type='button' onClick={() => onPublishSuccess('published-id')}>
				Publish
			</button>
		</div>
	),
}))

const mockTranslate = (key: string, values?: Record<string, string>) =>
	({
		untitledRecipe: 'Untitled recipe',
		localDraft: 'Local draft',
		olderLocalDraft: 'Older local draft',
		olderDraftNotice: 'Review this older draft before continuing.',
		resumeEditing: 'Resume editing',
		discardDraftTitle: 'Discard local draft?',
		discardDraftDescription: `Delete ${values?.title ?? 'draft'}?`,
		startFreshDraftTitle: 'Start a new recipe?',
		startFreshDraftDescription: `Starting fresh deletes ${values?.title ?? 'draft'}.`,
		keepIt: 'Keep it',
		discard: 'Discard',
		discardAndStart: 'Discard and start',
		savedAgo: 'Saved recently',
		ingredientsSteps: '0 ingredients, 0 steps',
	})[key] ?? key

jest.mock('next-intl', () => ({
	useTranslations: () => mockTranslate,
	useFormatter: () => ({ relativeTime: () => 'a moment ago' }),
}))

jest.mock('sonner', () => ({
	toast: { error: jest.fn() },
}))

const mockedGetRecipeById = jest.mocked(getRecipeById)
const localDraftData = {
	title: 'Unfinished family soup',
	description: '',
	coverImageUrl: '',
	cookTimeMinutes: 30,
	difficulty: 'Easy' as const,
	servings: 4,
	category: '',
	ingredients: [],
	steps: [],
}

describe('creator draft lifecycle', () => {
	beforeEach(() => {
		draftIdParam = null
		window.localStorage.clear()
		jest.clearAllMocks()
	})

	it('preserves unrelated local recovery while a server draft is opened and published', async () => {
		saveLocalRecipeDraft(localDraftData)
		mockedGetRecipeById.mockResolvedValue({
			success: true,
			statusCode: 200,
			data: { id: 'server-draft', title: 'Saved curry' },
		} as Awaited<ReturnType<typeof getRecipeById>>)

		render(<CreateRecipePage />)
		await screen.findByText('Unfinished family soup')
		fireEvent.click(screen.getByRole('button', { name: 'Open server draft' }))
		await screen.findByText('Editor: Saved curry')

		expect(readLocalRecipeDraft().status).toBe('valid')
		fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
		expect(readLocalRecipeDraft().status).toBe('valid')
		expect(push).toHaveBeenCalledWith('/recipes/published-id')
	})

	it('requires confirmation before a fresh recipe replaces local recovery', async () => {
		saveLocalRecipeDraft(localDraftData)
		render(<CreateRecipePage />)
		await screen.findByText('Unfinished family soup')

		fireEvent.click(screen.getByRole('button', { name: 'Start new recipe' }))
		expect(screen.getByText('Start a new recipe?')).not.toBeNull()
		expect(window.localStorage.getItem(LOCAL_RECIPE_DRAFT_KEY)).not.toBeNull()

		fireEvent.click(screen.getByRole('button', { name: 'Discard and start' }))
		await screen.findByText('Editor: New recipe')
		expect(window.localStorage.getItem(LOCAL_RECIPE_DRAFT_KEY)).toBeNull()
	})

	it('keeps older recovery available while clearly distinguishing it', async () => {
		window.localStorage.setItem(
			LOCAL_RECIPE_DRAFT_KEY,
			JSON.stringify({
				type: 'manual',
				data: localDraftData,
				savedAt: '2025-01-01T00:00:00.000Z',
			}),
		)

		render(<CreateRecipePage />)

		expect(await screen.findByText('Older local draft')).not.toBeNull()
		expect(
			screen.getByText('Review this older draft before continuing.'),
		).not.toBeNull()
		expect(readLocalRecipeDraft().status).toBe('valid')
	})

	it('shows only the loading state while a deep-linked server draft is unresolved', async () => {
		draftIdParam = 'server-draft'
		let resolveDraft: (value: Awaited<ReturnType<typeof getRecipeById>>) => void
		mockedGetRecipeById.mockReturnValue(
			new Promise(resolve => {
				resolveDraft = resolve
			}),
		)

		render(<CreateRecipePage />)
		expect(screen.queryByText('Draft list')).toBeNull()
		expect(screen.queryByText(/Editor:/)).toBeNull()

		resolveDraft!({
			success: true,
			statusCode: 200,
			data: { id: 'server-draft', title: 'Saved curry' },
		} as Awaited<ReturnType<typeof getRecipeById>>)
		await waitFor(() => {
			expect(screen.getByText('Editor: Saved curry')).not.toBeNull()
		})
	})
})
