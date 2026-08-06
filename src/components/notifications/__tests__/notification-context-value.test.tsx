import fs from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { NotificationsCommandDeck } from '../NotificationsCommandDeck'
import { NotificationsContextRail } from '../NotificationsContextRail'

const labels: Record<string, string> = {
	cmdEyebrow: 'Notifications',
	cmdTitle: 'Your attention',
	cmdFilterAll: 'All',
	filterActivity: 'Activity',
	filterSocial: 'Social',
	filterUnread: 'Unread',
	noUnread: 'All caught up',
	markAllRead: 'Mark all as read',
	markingAllRead: 'Marking as read',
	railQuickMoves: 'Quick moves',
	railExploreRecipes: 'Explore recipes',
	railOpenChallenges: 'Open challenges',
	railVisitCommunity: 'Visit community',
}

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => labels[key] ?? key,
}))

jest.mock('framer-motion', () => ({
	motion: {
		section: ({
			children,
			initial: _initial,
			animate: _animate,
			transition: _transition,
			...props
		}: React.HTMLAttributes<HTMLElement> & {
			initial?: unknown
			animate?: unknown
			transition?: unknown
		}) => <section {...props}>{children}</section>,
		aside: ({
			children,
			initial: _initial,
			animate: _animate,
			transition: _transition,
			...props
		}: React.HTMLAttributes<HTMLElement> & {
			initial?: unknown
			animate?: unknown
			transition?: unknown
		}) => <aside {...props}>{children}</aside>,
	},
}))

const renderDeck = (unreadCount: number | null, onMarkAllRead = jest.fn()) =>
	render(
		<NotificationsCommandDeck
			unreadCount={unreadCount}
			activeFilter='all'
			onFilterChange={jest.fn()}
			onMarkAllRead={onMarkAllRead}
			isMarkingAllRead={false}
		/>,
	)

describe('notification context value', () => {
	it('stays silent while the authoritative unread request is unresolved', () => {
		renderDeck(null)

		expect(screen.queryByText('All caught up')).toBeNull()
		expect(
			screen.queryByRole('button', { name: 'Mark all as read' }),
		).toBeNull()
		for (const filter of ['All', 'Activity', 'Social', 'Unread']) {
			expect(screen.getByRole('button', { name: filter })).toBeTruthy()
		}
	})

	it('renders settled zero and positive unread states without slice totals', () => {
		const { unmount } = renderDeck(0)

		expect(screen.getByText('All caught up')).toBeTruthy()
		expect(
			(
				screen.getByRole('button', {
					name: 'Mark all as read',
				}) as HTMLButtonElement
			).disabled,
		).toBe(true)
		unmount()

		const onMarkAllRead = jest.fn()
		renderDeck(7, onMarkAllRead)
		expect(screen.getByText('7 unread')).toBeTruthy()
		fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
		expect(onMarkAllRead).toHaveBeenCalledTimes(1)
		expect(screen.queryByText('50')).toBeNull()
	})

	it('retains navigation value after removing the telemetry rail', () => {
		render(<NotificationsContextRail />)

		expect(
			screen
				.getByRole('link', { name: /Explore recipes/ })
				.getAttribute('href'),
		).toBe('/explore')
		expect(
			screen
				.getByRole('link', { name: /Open challenges/ })
				.getAttribute('href'),
		).toBe('/challenges')
		expect(
			screen
				.getByRole('link', { name: /Visit community/ })
				.getAttribute('href'),
		).toBe('/community')
		expect(screen.queryByText(/health/i)).toBeNull()
	})

	it('pins the loaded-slice telemetry pattern out of every live owner', () => {
		const root = process.cwd()
		const page = fs.readFileSync(
			path.join(root, 'src/app/(main)/notifications/page.tsx'),
			'utf8',
		)
		const deck = fs.readFileSync(
			path.join(
				root,
				'src/components/notifications/NotificationsCommandDeck.tsx',
			),
			'utf8',
		)
		const rail = fs.readFileSync(
			path.join(
				root,
				'src/components/notifications/NotificationsContextRail.tsx',
			),
			'utf8',
		)

		expect(page).not.toContain('const counts =')
		expect(page).toContain('settledUnreadCount !== null')
		expect(page).toContain('isUnreadCountReady ? unreadCount : null')
		expect(deck).not.toContain('counts.')
		expect(deck).toContain('unreadCount !== null')
		expect(rail).not.toMatch(/counts\.|Percent|RailStat|railHeading/)
		expect(rail).toContain("href='/explore'")
		expect(rail).toContain("href='/challenges'")
		expect(rail).toContain("href='/community'")
	})
})
