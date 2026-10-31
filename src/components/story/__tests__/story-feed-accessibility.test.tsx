import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { StoryFeed } from '@/components/story/StoryFeed'
import { UserStoryFeedResponse } from '@/lib/types/story'

jest.mock('next-intl', () => {
	const messages = require(`${process.cwd()}/messages/en.json`)

	return {
		useTranslations:
			(namespace: string) => (key: string, values?: Record<string, string>) => {
				let message = messages[namespace]?.[key] ?? key
				for (const [name, value] of Object.entries(values ?? {})) {
					message = message.replaceAll(`{${name}}`, value)
				}
				return message
			},
	}
})

jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => ({ user: { userId: 'current-user', avatarUrl: '/me.png' } }),
}))

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
		const React = require('react')
		return React.createElement('img', props)
	},
}))

const stories: UserStoryFeedResponse[] = [
	{
		userId: 'alice',
		displayName: 'Alice',
		avatarUrl: '/alice.png',
		hasUnseenStory: true,
	},
	{
		userId: 'bob',
		displayName: 'Bob',
		avatarUrl: '/bob.png',
		hasUnseenStory: false,
	},
	{
		userId: 'current-user',
		displayName: 'Current User',
		avatarUrl: '/me.png',
		hasUnseenStory: false,
	},
]

describe('StoryFeed accessible entry state', () => {
	it('names new, viewed, and own stories without false toggle semantics', () => {
		const onStoryClick = jest.fn()
		render(
			<StoryFeed
				stories={stories}
				isLoading={false}
				onStoryClick={onStoryClick}
			/>,
		)

		const newStoryButton = screen.getByRole('button', {
			name: 'New story from Alice',
		})
		const viewedStoryButton = screen.getByRole('button', {
			name: 'View stories from Bob',
		})
		const ownStoryButton = screen.getByRole('button', {
			name: 'View your story',
		})

		for (const button of [newStoryButton, viewedStoryButton, ownStoryButton]) {
			expect(button.getAttribute('aria-pressed')).toBeNull()
		}

		fireEvent.click(newStoryButton)
		expect(onStoryClick).toHaveBeenCalledWith(stories[0])
	})
})
