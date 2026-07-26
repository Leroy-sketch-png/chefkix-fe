import React from 'react'
import { render, screen } from '@testing-library/react'
import RepliedStoryPreview from '../RepliedStoryPreview'

const translations: Record<string, string> = {
	'messages.storyReplyOwn': 'You replied to this story',
	'messages.storyReplyReceived': 'Replied to your story',
	'messages.storyReplyUnavailable': 'Story no longer available',
	'messages.tapToView': 'Tap to view',
	'story.storyMediaAlt': 'Story photo',
}

jest.mock('next-intl', () => ({
	useTranslations: (namespace: string) => (key: string) =>
		translations[`${namespace}.${key}`] ?? key,
}))

jest.mock('next/link', () => ({
	__esModule: true,
	default: ({
		children,
		href,
		...props
	}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
		<a href={typeof href === 'string' ? href : '#'} {...props}>
			{children}
		</a>
	),
}))

describe('RepliedStoryPreview', () => {
	it('links a current Story reply using its persisted owner and Story id', () => {
		render(
			<RepliedStoryPreview
				storyId='story/one'
				storyOwnerId='owner one'
				thumbnailUrl='/story.jpg'
				isOwn={false}
			/>,
		)

		const link = screen.getByRole('link', {
			name: 'Replied to your story. Tap to view',
		})
		expect(link.getAttribute('href')).toBe(
			'/story/view/owner%20one?startAt=story%2Fone',
		)
		expect(screen.getByAltText('Story photo')).toBeTruthy()
	})

	it('keeps a legacy ownerless reply readable without creating a broken link', () => {
		render(
			<RepliedStoryPreview
				storyId='legacy-story'
				thumbnailUrl='/legacy-story.jpg'
				isOwn
			/>,
		)

		expect(screen.queryByRole('link')).toBeNull()
		expect(screen.getByText('You replied to this story')).toBeTruthy()
		expect(screen.getByText('Story no longer available')).toBeTruthy()
	})
})
