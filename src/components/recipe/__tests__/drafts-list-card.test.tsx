import React from 'react'
import { render, screen } from '@testing-library/react'
import { DraftsListCard } from '@/components/recipe/DraftsListCard'

const mockRelativeTime = jest.fn((date: Date) => {
	if (Number.isNaN(date.getTime())) throw new RangeError('Invalid time value')
	return '2 days ago'
})

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string, values?: Record<string, string>) => {
		const messages: Record<string, string> = {
			somethingWentWrong: 'Something went wrong',
			unexpectedError: 'Unexpected error',
			tryAgain: 'Try again',
			untitledRecipe: 'Untitled recipe',
			draft: 'Draft',
			duplicateDraft: 'Duplicate draft',
			deleteDraft: 'Delete draft',
			createdAgo: values?.time ?? 'created',
		}

		return messages[key] ?? key
	},
	useFormatter: () => ({ relativeTime: mockRelativeTime }),
}))

describe('DraftsListCard', () => {
	beforeEach(() => {
		mockRelativeTime.mockClear()
	})

	it('formats a valid server-draft timestamp through the active locale', () => {
		render(
			<DraftsListCard
				draft={{
					id: 'draft-1',
					createdAt: '2026-10-05T10:00:00.000Z',
					updatedAt: '2026-10-05T10:00:00.000Z',
					recipeStatus: 'DRAFT',
					title: 'Test Draft',
					description: 'Draft description',
					coverImageUrl: [],
					difficulty: 'Beginner',
					totalTimeMinutes: 10,
					servings: 2,
					cuisineType: 'Test',
					xpReward: 10,
					badges: [],
					likeCount: 0,
					saveCount: 0,
					viewCount: 0,
					author: null,
					isLiked: false,
					isSaved: false,
				}}
				isDuplicating={false}
				onSelectDraft={jest.fn()}
				onDuplicate={jest.fn()}
				onDelete={jest.fn()}
			/>,
		)

		expect(screen.getByText('2 days ago')).toBeTruthy()
		expect(mockRelativeTime).toHaveBeenCalledTimes(1)
	})

	it('shows a localized fallback when a malformed timestamp crashes the card', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(
			<DraftsListCard
				draft={{
					id: 'draft-1',
					createdAt: 'not-a-date',
					updatedAt: '2026-04-21T10:00:00.000Z',
					recipeStatus: 'DRAFT',
					title: 'Test Draft',
					description: 'Draft description',
					coverImageUrl: [],
					difficulty: 'Beginner',
					totalTimeMinutes: 10,
					servings: 2,
					cuisineType: 'Test',
					xpReward: 10,
					badges: [],
					likeCount: 0,
					saveCount: 0,
					viewCount: 0,
					author: null,
					isLiked: false,
					isSaved: false,
				}}
				isDuplicating={false}
				onSelectDraft={jest.fn()}
				onDuplicate={jest.fn()}
				onDelete={jest.fn()}
			/>,
		)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Something went wrong')
		expect(alert.textContent).toContain('Invalid time value')
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
