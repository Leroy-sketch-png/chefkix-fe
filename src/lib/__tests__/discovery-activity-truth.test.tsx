import React from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { ExploreContextRail } from '@/components/explore/ExploreContextRail'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
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

jest.mock('framer-motion', () => {
	const React = require('react')
	return {
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					(props: React.HTMLAttributes<HTMLElement>) => {
						const domProps = { ...props } as Record<string, unknown>
						const children = domProps.children
						delete domProps.children
						delete domProps.initial
						delete domProps.animate
						delete domProps.transition
						delete domProps.whileHover
						delete domProps.whileTap
						return React.createElement(tag, domProps, children)
					},
			},
		),
	}
})

jest.mock('@/components/layout/CommandDeckBase', () => ({
	CommandDeckBase: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/components/shared/FeedTabBar', () => ({
	FeedTabBar: () => null,
}))

jest.mock('@/components/dashboard/TonightsPick', () => ({
	TonightsPick: () => null,
}))

jest.mock('@/components/explore/SeasonsBest', () => ({
	SeasonsBest: () => null,
}))

describe('discovery activity truth', () => {
	it('omits Hot Queries when no trending data exists', () => {
		render(
			<ExploreContextRail
				trendingSearches={[]}
				onQuickSearch={jest.fn()}
				showDiscoveryWidgets={false}
			/>,
		)

		expect(screen.queryByText('railHotQueries')).toBeNull()
		expect(screen.getByText('railQuickMovesHeading')).toBeTruthy()
	})

	it('renders and applies terms returned by the trending source', () => {
		const onQuickSearch = jest.fn()
		render(
			<ExploreContextRail
				trendingSearches={['Pho', 'Banh mi']}
				onQuickSearch={onQuickSearch}
				showDiscoveryWidgets={false}
			/>,
		)

		expect(screen.getByText('railHotQueries')).toBeTruthy()
		fireEvent.click(screen.getByRole('button', { name: 'Pho' }))
		expect(onQuickSearch).toHaveBeenCalledWith('Pho')
	})

	it('keeps unsupported activity copy out of public discovery sources', () => {
		const feedSource = readFileSync(
			join(process.cwd(), 'src/app/(main)/feed/page.tsx'),
			'utf8',
		)
		const exploreSource = readFileSync(
			join(process.cwd(), 'src/app/(main)/explore/ExploreClient.tsx'),
			'utf8',
		)
		const messages = readFileSync(
			join(process.cwd(), 'messages/en.json'),
			'utf8',
		)

		expect(feedSource).not.toContain('emptyProofCommunity')
		expect(feedSource).not.toContain('emptyProofRecipes')
		expect(feedSource).not.toContain('emptyProofTips')
		expect(exploreSource).not.toContain("t('featuredToday')")
		expect(messages).not.toContain('"liveFeed"')
		expect(messages).not.toContain('"featuredToday"')
	})
})
