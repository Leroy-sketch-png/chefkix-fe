import React from 'react'
import { render, screen } from '@testing-library/react'
import {
	LeaderboardItem,
	type LeaderboardEntry,
} from '@/components/leaderboard/LeaderboardItem'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		switch (key) {
			case 'somethingWentWrong':
				return 'Something went wrong'
			case 'tryAgain':
				return 'Try again'
			case 'unexpectedError':
				return 'Unexpected error'
			case 'you':
				return 'You'
			case 'xp':
				return 'XP'
			default:
				return key
		}
	},
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: () => {
		throw new Error('leaderboard-item-boom')
	},
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

jest.mock('@/components/ui/animated-number', () => ({
	AnimatedNumber: ({ value }: { value: number }) => <span>{value}</span>,
}))

describe('LeaderboardItem', () => {
	it('shows a localized fallback when a leaderboard row crashes', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		const entry: LeaderboardEntry = {
			rank: 1,
			userId: 'user-1',
			username: 'stoveking',
			displayName: 'Stove King',
			avatarUrl: '/avatar.png',
			level: 7,
			xpThisWeek: 420,
			recipesCooked: 9,
			streak: 5,
		}

		render(<LeaderboardItem entry={entry} />)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Something went wrong')
		expect(alert.textContent).toContain('leaderboard-item-boom')
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
