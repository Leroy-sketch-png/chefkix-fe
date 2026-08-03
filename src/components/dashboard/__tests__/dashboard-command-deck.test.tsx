import React from 'react'
import { render, screen } from '@testing-library/react'
import { DashboardCommandDeck } from '@/components/dashboard/DashboardCommandDeck'
import type { Statistics } from '@/lib/types/profile'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string, params?: Record<string, unknown>) =>
		params ? `${key}:${JSON.stringify(params)}` : key,
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
					({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
						React.createElement(tag, props, children),
			},
		),
	}
})

const stats: Statistics = {
	followerCount: 0,
	followingCount: 0,
	recipeCount: 0,
	postCount: 0,
	favouriteCount: 0,
	currentLevel: 3,
	currentXP: 120,
	currentXPGoal: 200,
	title: 'AMATEUR',
	streakCount: 4,
	challengeStreak: 0,
	completionCount: 0,
	reputation: 0,
}

describe('DashboardCommandDeck', () => {
	it('does not turn unresolved pending data into a zero-state claim', () => {
		render(<DashboardCommandDeck stats={stats} />)

		expect(screen.getByText('cmdLeadDefault')).toBeTruthy()
		expect(screen.queryByText(/cmdStatPending/)).toBeNull()
		expect(screen.getByText('120 XP')).toBeTruthy()
	})

	it('prioritizes a real completed-cook signal', () => {
		render(<DashboardCommandDeck stats={stats} pendingSessionCount={2} />)

		expect(screen.getByText('cmdLeadPending:{"count":2}')).toBeTruthy()
		expect(screen.getByText('cmdStatPending')).toBeTruthy()
		expect(screen.getByText('cmdPendingValue:{"count":2}')).toBeTruthy()
	})

	it('presents backend-derived streak urgency without losing commands', () => {
		render(
			<DashboardCommandDeck
				stats={stats}
				hasStreakAtRisk
				pendingSessionCount={2}
			/>,
		)

		expect(screen.getByText('cmdStreakRiskSubtitle')).toBeTruthy()
		expect(screen.getByRole('status').textContent).toContain('cmdStreakRisk')
		expect(
			screen
				.getByRole('link', { name: /cmdBtnQuickCook/ })
				.getAttribute('href'),
		).toBe('/cook')
		expect(
			screen
				.getByRole('link', { name: /cmdBtnCreatePost/ })
				.getAttribute('href'),
		).toBe('/create')
		expect(
			screen
				.getByRole('link', { name: /cmdBtnCommunity/ })
				.getAttribute('href'),
		).toBe('/community')
	})

	it('exposes level progress with native progress semantics', () => {
		render(<DashboardCommandDeck stats={stats} />)

		expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
			'120',
		)
		expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe(
			'200',
		)
	})
})
