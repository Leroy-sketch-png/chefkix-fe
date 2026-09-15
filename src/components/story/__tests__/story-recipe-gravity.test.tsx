import React, { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AsyncComboboxOption } from '@/components/ui/async-combobox'
import { StoryRecipePicker } from '@/components/story/StoryRecipePicker'
import { StoryViewer } from '@/components/story/StoryViewer'
import { autocompleteSearch } from '@/services/search'
import { getStoriesByUserId, recordStoryView } from '@/services/story'

const push = jest.fn()

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push }),
}))

jest.mock('@/i18n/hooks', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => ({ user: { userId: 'viewer' } }),
}))

jest.mock('@/services/search', () => ({
	autocompleteSearch: jest.fn(),
}))

jest.mock('@/services/story', () => ({
	getStoriesByUserId: jest.fn(),
	getStoryById: jest.fn(),
	recordStoryView: jest.fn().mockResolvedValue(undefined),
	sendStoryReaction: jest.fn(),
	sendStoryReply: jest.fn(),
}))

jest.mock('@/services/profile', () => ({
	getProfileByUserId: jest.fn().mockResolvedValue({
		success: true,
		data: { userId: 'creator', displayName: 'Mai' },
	}),
}))

jest.mock('@/components/ui/async-combobox', () => ({
	AsyncCombobox: ({
		fetchOptions,
		onSelect,
	}: {
		fetchOptions: (query: string) => Promise<AsyncComboboxOption[]>
		onSelect: (option: AsyncComboboxOption) => void
	}) => (
		<button
			type='button'
			onClick={async () => {
				const options = await fetchOptions('pho')
				onSelect(options[0])
			}}
		>
			search-recipes
		</button>
	),
}))

jest.mock('framer-motion', () => ({
	AnimatePresence: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	motion: {
		div: ({
			children,
			initial: _initial,
			animate: _animate,
			exit: _exit,
			...props
		}: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
			<div {...props}>{children}</div>
		),
	},
}))

function PickerHarness() {
	const [selected, setSelected] = useState<AsyncComboboxOption | null>(null)
	return <StoryRecipePicker selectedRecipe={selected} onChange={setSelected} />
}

describe('Story recipe gravity', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('turns a published recipe search result into a removable selection', async () => {
		jest.mocked(autocompleteSearch).mockResolvedValue({
			success: true,
			statusCode: 200,
			data: {
				recipes: {
					found: 1,
					hits: [
						{
							document: {
								id: 'recipe-1',
								title: 'Weeknight Pho',
								description: 'Fast aromatic broth',
								cuisine: 'Vietnamese',
								difficulty: 'MEDIUM',
								totalTime: 45,
								cookCount: 10,
								avgRating: 4.8,
								ingredients: [],
								tags: [],
								authorId: 'creator',
								coverImageUrl: '/pho.webp',
								createdAt: 1,
								xpReward: 100,
							},
						},
					],
				},
			},
		})

		render(<PickerHarness />)
		fireEvent.click(screen.getByRole('button', { name: 'search-recipes' }))

		expect(await screen.findByText('Weeknight Pho')).toBeTruthy()
		fireEvent.click(screen.getByRole('button', { name: 'removeLinkedRecipe' }))
		expect(screen.queryByText('Weeknight Pho')).toBeNull()
	})

	it('shows one cook-through action for a linked story and routes to it', async () => {
		jest.mocked(getStoriesByUserId).mockResolvedValue({
			data: {
				success: true,
				statusCode: 200,
				data: [
					{
						id: 'story-1',
						userId: 'creator',
						mediaUrl: '/story.webp',
						mediaType: 'IMAGE',
						linkedRecipeId: 'recipe-1',
						items: [],
						createdAt: new Date().toISOString(),
						expiresAt: new Date(Date.now() + 60_000).toISOString(),
					},
				],
			},
		} as never)

		render(<StoryViewer userId='creator' onClose={jest.fn()} />)

		const action = await screen.findByRole('button', {
			name: 'cookLinkedRecipe',
		})
		fireEvent.click(action)

		await waitFor(() => expect(push).toHaveBeenCalledWith('/recipes/recipe-1'))
	})

	it('does not fabricate a recipe action for an unlinked story', async () => {
		jest.mocked(getStoriesByUserId).mockResolvedValue({
			data: {
				success: true,
				statusCode: 200,
				data: [
					{
						id: 'story-2',
						userId: 'creator',
						mediaUrl: '/story.webp',
						mediaType: 'IMAGE',
						items: [],
						createdAt: new Date().toISOString(),
						expiresAt: new Date(Date.now() + 60_000).toISOString(),
					},
				],
			},
		} as never)

		render(<StoryViewer userId='creator' onClose={jest.fn()} />)

		await screen.findByAltText('storyMediaAlt')
		expect(
			screen.queryByRole('button', { name: 'cookLinkedRecipe' }),
		).toBeNull()
	})

	it('renders legacy image stickers instead of losing uploaded media', async () => {
		jest.mocked(getStoriesByUserId).mockResolvedValue({
			data: {
				success: true,
				statusCode: 200,
				data: [
					{
						id: 'story-with-sticker',
						userId: 'creator',
						mediaUrl: '/story.webp',
						mediaType: 'IMAGE',
						items: [
							{
								type: 'STICKER',
								x: 20,
								y: 30,
								data: { imageUrl: '/uploaded-sticker.webp' },
							},
						],
						createdAt: new Date().toISOString(),
						expiresAt: new Date(Date.now() + 60_000).toISOString(),
					},
				],
			},
		} as never)

		render(<StoryViewer userId='creator' onClose={jest.fn()} />)

		expect(
			(await screen.findByAltText('storyStickerAlt')).getAttribute('src'),
		).toBe('/uploaded-sticker.webp')
	})

	it('isolates a failed image to its story while preserving failure on return', async () => {
		jest.mocked(getStoriesByUserId).mockResolvedValue({
			data: {
				success: true,
				statusCode: 200,
				data: [
					{
						id: 'broken-story',
						userId: 'creator',
						mediaUrl: '/broken.webp',
						mediaType: 'IMAGE',
						items: [],
						createdAt: new Date().toISOString(),
						expiresAt: new Date(Date.now() + 60_000).toISOString(),
					},
					{
						id: 'healthy-story',
						userId: 'creator',
						mediaUrl: '/healthy.webp',
						mediaType: 'IMAGE',
						items: [],
						createdAt: new Date().toISOString(),
						expiresAt: new Date(Date.now() + 60_000).toISOString(),
					},
				],
			},
		} as never)

		render(<StoryViewer userId='creator' onClose={jest.fn()} />)

		fireEvent.error(await screen.findByAltText('storyMediaAlt'))
		expect(await screen.findByText('storyMediaUnavailable')).toBeTruthy()

		fireEvent.click(screen.getByRole('button', { name: 'nextStory' }))
		await waitFor(() =>
			expect(screen.getByAltText('storyMediaAlt').getAttribute('src')).toBe(
				'/healthy.webp',
			),
		)
		expect(screen.queryByText('storyMediaUnavailable')).toBeNull()

		fireEvent.click(screen.getByRole('button', { name: 'previousStory' }))
		expect(await screen.findByText('storyMediaUnavailable')).toBeTruthy()
	})

	it('records each story at most once when navigating backward', async () => {
		jest.mocked(getStoriesByUserId).mockResolvedValue({
			data: {
				success: true,
				statusCode: 200,
				data: [
					{
						id: 'story-one',
						userId: 'creator',
						mediaUrl: '/one.webp',
						mediaType: 'IMAGE',
						items: [],
						createdAt: new Date().toISOString(),
						expiresAt: new Date(Date.now() + 60_000).toISOString(),
					},
					{
						id: 'story-two',
						userId: 'creator',
						mediaUrl: '/two.webp',
						mediaType: 'IMAGE',
						items: [],
						createdAt: new Date().toISOString(),
						expiresAt: new Date(Date.now() + 60_000).toISOString(),
					},
				],
			},
		} as never)

		render(<StoryViewer userId='creator' onClose={jest.fn()} />)

		await waitFor(() =>
			expect(recordStoryView).toHaveBeenCalledWith('story-one'),
		)
		fireEvent.click(screen.getByRole('button', { name: 'nextStory' }))
		await waitFor(() =>
			expect(recordStoryView).toHaveBeenCalledWith('story-two'),
		)
		fireEvent.click(screen.getByRole('button', { name: 'previousStory' }))

		await waitFor(() => expect(recordStoryView).toHaveBeenCalledTimes(2))
	})

	it('releases a failed view reservation so returning can retry it', async () => {
		jest
			.mocked(recordStoryView)
			.mockRejectedValueOnce(new Error('temporary view failure'))
			.mockResolvedValue(undefined)
		jest.mocked(getStoriesByUserId).mockResolvedValue({
			data: {
				success: true,
				statusCode: 200,
				data: [
					{
						id: 'retry-story',
						userId: 'creator',
						mediaUrl: '/retry.webp',
						mediaType: 'IMAGE',
						items: [],
						createdAt: new Date().toISOString(),
						expiresAt: new Date(Date.now() + 60_000).toISOString(),
					},
					{
						id: 'next-story',
						userId: 'creator',
						mediaUrl: '/next.webp',
						mediaType: 'IMAGE',
						items: [],
						createdAt: new Date().toISOString(),
						expiresAt: new Date(Date.now() + 60_000).toISOString(),
					},
				],
			},
		} as never)

		render(<StoryViewer userId='creator' onClose={jest.fn()} />)

		await waitFor(() =>
			expect(recordStoryView).toHaveBeenCalledWith('retry-story'),
		)
		fireEvent.click(screen.getByRole('button', { name: 'nextStory' }))
		await waitFor(() =>
			expect(recordStoryView).toHaveBeenCalledWith('next-story'),
		)
		fireEvent.click(screen.getByRole('button', { name: 'previousStory' }))

		await waitFor(() => expect(recordStoryView).toHaveBeenCalledTimes(3))
		expect(recordStoryView).toHaveBeenLastCalledWith('retry-story')
	})
})
