import React from 'react'
import { render, screen } from '@testing-library/react'
import { PATHS } from '@/constants/paths'
import { FeedCommandDeck } from '@/components/social/FeedCommandDeck'
import type { FeedMode } from '@/components/shared/FeedTabBar'

jest.mock('next-intl', () => ({
	useTranslations: (namespace: string) => (key: string) => {
		if (namespace === 'nav' && key === 'kitchenScanner') {
			return 'Kitchen Scanner'
		}
		if (namespace === 'shared') {
			return {
				ftForYou: 'For You',
				ftTrending: 'Trending',
				ftFollowing: 'Following',
				ftLatest: 'Latest',
			}[key]
		}
		return key
	},
}))

jest.mock('framer-motion', () => {
	const React = require('react')
	const motionProps = new Set(['layoutId', 'transition', 'whileTap'])
	return {
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
						const domProps = Object.fromEntries(
							Object.entries(props).filter(([key]) => !motionProps.has(key)),
						)
						return React.createElement(tag, domProps, children)
					},
			},
		),
	}
})

const signedInModes: FeedMode[] = ['forYou', 'trending', 'following', 'latest']

describe('FeedCommandDeck scanner shortcut', () => {
	it.each(signedInModes)(
		'renders the scanner route in signed-in %s mode',
		feedMode => {
			render(
				<FeedCommandDeck
					feedMode={feedMode}
					onFeedModeChange={() => undefined}
					availableModes={signedInModes}
				/>,
			)

			expect(
				screen
					.getByRole('link', { name: 'Kitchen Scanner' })
					.getAttribute('href'),
			).toBe(PATHS.SCAN)
		},
	)
})
