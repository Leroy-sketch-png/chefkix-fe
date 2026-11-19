import React from 'react'
import { render, screen } from '@testing-library/react'
import type { Post } from '@/lib/types/post'
import { getFeedPosts, getFollowingFeedPosts } from '@/services/post'
import FeedPage from '../page'

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: jest.fn() }),
}))

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

jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => ({ user: { userId: 'signed-in-test-user' } }),
}))

jest.mock('@/services/post', () => ({
	getFeedPosts: jest.fn(),
	getFollowingFeedPosts: jest.fn(),
}))

jest.mock('@/store/storyStore', () => {
	const state = {
		fetchStoryFeed: jest.fn().mockResolvedValue(undefined),
		storyUsers: [],
	}
	return {
		useStoryStore: (selector: (value: typeof state) => unknown) =>
			selector(state),
	}
})

jest.mock('framer-motion', () => {
	const React = require('react')
	const motionProps = new Set([
		'animate',
		'exit',
		'initial',
		'layout',
		'layoutId',
		'transition',
		'variants',
		'whileHover',
		'whileTap',
	])
	return {
		AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
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

jest.mock('@/components/layout/PageContainer', () => {
	const React = require('react')
	return {
		PageContainer: ({ children }: { children: React.ReactNode }) =>
			React.createElement('div', null, children),
	}
})

jest.mock('@/components/layout/PageTransition', () => {
	const React = require('react')
	return {
		PageTransition: ({ children }: { children: React.ReactNode }) =>
			React.createElement('div', null, children),
	}
})

jest.mock('@/components/layout/PremiumSurface', () => ({
	SurfaceSectionHeader: ({ eyebrow }: { eyebrow: string }) =>
		React.createElement('h2', null, eyebrow),
}))

jest.mock('@/components/social/PostCard', () => ({
	PostCard: ({ post }: { post: Post }) =>
		React.createElement('article', null, post.content),
}))

jest.mock('@/components/social/PostCardSkeleton', () => ({
	PostCardSkeleton: () =>
		React.createElement('div', { 'data-testid': 'post-skeleton' }),
}))

jest.mock('@/components/social/FeedContextRail', () => ({
	FeedContextRail: () => null,
}))

jest.mock('@/components/story/StoryFeed', () => ({
	StoryFeed: () => React.createElement('div', { 'data-testid': 'story-feed' }),
}))

jest.mock('@/components/onboarding/ColdStartExperience', () => ({
	ColdStartExperience: ({ children }: { children: React.ReactNode }) =>
		children,
}))

jest.mock('@/components/ui/pull-to-refresh', () => ({
	PullToRefresh: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/components/shared', () => ({
	EmptyStateGamified: ({
		title,
		primaryAction,
	}: {
		title: string
		primaryAction: { label: string; href: string }
	}) =>
		React.createElement(
			'section',
			null,
			React.createElement('h2', null, title),
			React.createElement(
				'a',
				{ href: primaryAction.href },
				primaryAction.label,
			),
		),
}))

const emptyFeedResponse = () => ({
	success: true,
	statusCode: 200,
	data: [],
})

const populatedFeedResponse = () => ({
	success: true,
	statusCode: 200,
	data: [
		{
			id: 'feed-post-1',
			userId: 'author-1',
			displayName: 'Test cook',
			content: 'A saved public feed post',
			slug: 'saved-public-feed-post',
			videoUrl: null,
			postUrl: '/post/feed-post-1',
			tags: [],
			likes: 0,
			commentCount: 0,
			createdAt: '2026-11-16T00:00:00.000Z',
			updatedAt: null,
		} satisfies Post,
	],
})

const expectScannerShortcut = async () => {
	const scannerLink = await screen.findByRole('link', {
		name: 'Kitchen Scanner',
	})
	expect(scannerLink.getAttribute('href')).toBe('/scan')
}

describe('Feed scanner entry', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		jest.mocked(getFeedPosts).mockReset().mockResolvedValue(emptyFeedResponse())
		jest
			.mocked(getFollowingFeedPosts)
			.mockReset()
			.mockResolvedValue(emptyFeedResponse())
	})

	it('stays available for a signed-in empty For You feed', async () => {
		render(<FeedPage />)

		await screen.findByText('emptyForYou')
		await expectScannerShortcut()
	})

	it('stays available for a signed-in populated For You feed', async () => {
		jest.mocked(getFeedPosts).mockResolvedValueOnce(populatedFeedResponse())
		render(<FeedPage />)

		await screen.findByText('A saved public feed post')
		await expectScannerShortcut()
	})
})
