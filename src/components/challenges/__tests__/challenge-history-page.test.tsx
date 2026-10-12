import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import {
	ChallengeHistoryPage,
	type ChallengeDay,
} from '@/components/challenges/ChallengeHistory'

jest.mock('next-intl', () => ({
	useLocale: () => 'vi-VN',
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

jest.mock('next/image', () => ({
	__esModule: true,
	default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
		<img alt={alt} {...props} />
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

jest.mock('@/components/ui/number-ticker', () => ({
	NumberTicker: ({ value }: { value: number }) => <>{value}</>,
}))

const day: ChallengeDay = {
	id: 'history-1',
	date: new Date('2026-09-22T00:00:00Z'),
	status: 'completed',
	challenge: { title: 'Rescue dinner', emoji: 'target', xp: 50 },
	recipeCooked: {
		id: 'recipe-42',
		title: 'Tomato Rice',
		imageUrl: '/tomato-rice.jpg',
	},
}

const stats = {
	currentStreak: 2,
	completedThisWeek: 1,
	totalDays: 7,
	bonusXpEarned: 50,
	bestStreak: 4,
	totalCompleted: 12,
	totalBonusXp: 600,
}

describe('ChallengeHistoryPage', () => {
	it('turns an authoritative cooked recipe into a repeat-cook action', () => {
		render(<ChallengeHistoryPage days={[day]} stats={stats} />)

		expect(
			screen
				.getByRole('link', {
					name: 'cookAgainRecipe:{"title":"Tomato Rice"}',
				})
				.getAttribute('href'),
		).toBe('/recipes/recipe-42?cook=true')
	})

	it('formats visible history dates with the active locale', () => {
		const dateSpy = jest
			.spyOn(Date.prototype, 'toLocaleDateString')
			.mockReturnValue('22 thg 9')

		render(<ChallengeHistoryPage days={[day]} stats={stats} />)

		expect(dateSpy).toHaveBeenCalledWith('vi-VN', { month: 'short' })
		dateSpy.mockRestore()
	})

	it('keeps pagination manually paced and exposes partial failure recovery', () => {
		const onLoadMore = jest.fn()
		render(
			<ChallengeHistoryPage
				days={[day]}
				stats={stats}
				hasMore
				loadMoreError
				onLoadMore={onLoadMore}
			/>,
		)

		expect(screen.getByRole('alert').textContent).toBe('historyLoadMoreFailed')
		fireEvent.click(screen.getByRole('button', { name: 'retryLoadMore' }))
		expect(onLoadMore).toHaveBeenCalledTimes(1)
	})

	it('reveals buffered history before requesting another backend page', () => {
		const onLoadMore = jest.fn()
		const bufferedDays = Array.from({ length: 21 }, (_, index) => ({
			...day,
			id: `history-${index}`,
			date: new Date(Date.UTC(2026, 8, 22 - index)),
			challenge: {
				...day.challenge!,
				title: `Challenge ${index + 1}`,
			},
		}))

		render(
			<ChallengeHistoryPage
				days={bufferedDays}
				stats={stats}
				hasMore
				onLoadMore={onLoadMore}
			/>,
		)

		expect(screen.queryByText('Challenge 21')).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'loadMore' }))
		expect(screen.getByText('Challenge 21')).toBeTruthy()
		expect(onLoadMore).not.toHaveBeenCalled()
	})
})
