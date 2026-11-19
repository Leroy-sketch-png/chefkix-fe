import React from 'react'
import { render, screen } from '@testing-library/react'
import { SlideTabs } from '@/components/ui/slide-tabs'

jest.mock('framer-motion', () => {
	const React = require('react')
	return {
		motion: new Proxy(
			{},
			{
				get:
					(_target, tag: string) =>
					({
						children,
						layoutId: _layoutId,
						transition: _transition,
						...props
					}: React.HTMLAttributes<HTMLElement> & {
						layoutId?: string
						transition?: unknown
					}) =>
						React.createElement(tag, props, children),
			},
		),
	}
})

const communityTabs = [
	{ id: 'discover', label: 'Discover' },
	{ id: 'friends', label: 'Friends' },
	{ id: 'groups', label: 'Groups' },
	{ id: 'leaderboard', label: 'Leaderboard' },
]

describe('SlideTabs responsive full-width layout', () => {
	it('keeps four community destinations available in a compact mobile grid', () => {
		render(
			<SlideTabs
				tabs={communityTabs}
				activeTab='discover'
				onTabChange={jest.fn()}
				fullWidth
			/>,
		)

		const tablist = screen.getByRole('tablist')
		expect(tablist.className).toContain('grid-cols-2')
		expect(tablist.className).toContain('sm:inline-flex')
		for (const tab of communityTabs) {
			expect(screen.getByRole('tab', { name: tab.label })).toBeTruthy()
		}
		expect(
			screen
				.getByRole('tab', { name: 'Discover' })
				.getAttribute('aria-selected'),
		).toBe('true')
	})

	it('lets a single visible destination use the full row', () => {
		render(
			<SlideTabs
				tabs={[communityTabs[0]]}
				activeTab='discover'
				onTabChange={jest.fn()}
				fullWidth
			/>,
		)

		expect(screen.getByRole('tablist').className).toContain('grid-cols-1')
	})
})
