import React from 'react'
import { render, screen } from '@testing-library/react'
import {
	LeaderboardPodium,
	type PodiumEntry,
} from '@/components/leaderboard/LeaderboardPodium'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		switch (key) {
			case 'somethingWentWrong':
				return 'Something went wrong'
			case 'tryAgain':
				return 'Try again'
			case 'unexpectedError':
				return 'Unexpected error'
			default:
				return key
		}
	},
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: () => {
		throw new Error('leaderboard-podium-boom')
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

describe('LeaderboardPodium', () => {
	it('shows a localized fallback when a podium spot crashes', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		const entries: PodiumEntry[] = [
			{
				rank: 1,
				userId: 'user-1',
				username: 'chef-1',
				displayName: 'Chef One',
				avatarUrl: '/avatar-1.png',
				level: 8,
				xp: 500,
			},
			{
				rank: 2,
				userId: 'user-2',
				username: 'chef-2',
				displayName: 'Chef Two',
				avatarUrl: '/avatar-2.png',
				level: 6,
				xp: 430,
			},
			{
				rank: 3,
				userId: 'user-3',
				username: 'chef-3',
				displayName: 'Chef Three',
				avatarUrl: '/avatar-3.png',
				level: 5,
				xp: 390,
			},
		]

		render(<LeaderboardPodium entries={entries} />)

		const alerts = screen.getAllByRole('alert')
		expect(alerts[0].textContent).toContain('Something went wrong')
		expect(alerts[0].textContent).toContain('leaderboard-podium-boom')
		expect(screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(3)

		consoleErrorSpy.mockRestore()
	})
})
