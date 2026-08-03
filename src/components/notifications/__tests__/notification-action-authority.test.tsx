import fs from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { NotificationItemGamified } from '../NotificationItemsGamified'

jest.mock('next-intl', () => {
	const translate = (key: string) => key
	translate.rich = (key: string) => key
	return { useTranslations: () => translate }
})

jest.mock('framer-motion', () => ({
	motion: {
		button: ({
			children,
			whileHover: _whileHover,
			whileTap: _whileTap,
			...props
		}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
			whileHover?: unknown
			whileTap?: unknown
		}) => <button {...props}>{children}</button>,
		div: ({
			children,
			initial: _initial,
			animate: _animate,
			transition: _transition,
			...props
		}: React.HTMLAttributes<HTMLDivElement> & {
			initial?: unknown
			animate?: unknown
			transition?: unknown
		}) => <div {...props}>{children}</div>,
	},
}))

const streakLost = {
	id: 'streak-lost-1',
	type: 'streak_lost' as const,
	timestamp: new Date('2026-07-31T08:00:00.000Z'),
	isRead: false,
	lostStreakCount: 4,
	bestStreak: 7,
}

describe('notification action authority', () => {
	it('does not render a streak recovery command without an owner', () => {
		render(<NotificationItemGamified {...streakLost} />)

		expect(screen.queryByRole('button', { name: 'startNewStreak' })).toBeNull()
	})

	it('renders and invokes streak recovery when an owner is supplied', () => {
		const onStartNewStreak = jest.fn()
		render(
			<NotificationItemGamified
				{...streakLost}
				onStartNewStreak={onStartNewStreak}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'startNewStreak' }))
		expect(onStartNewStreak).toHaveBeenCalledTimes(1)
	})

	it('keeps the action and row affordance policy systemic', () => {
		const root = process.cwd()
		const items = fs.readFileSync(
			path.join(
				root,
				'src/components/notifications/NotificationItemsGamified.tsx',
			),
			'utf8',
		)
		const page = fs.readFileSync(
			path.join(root, 'src/app/(main)/notifications/page.tsx'),
			'utf8',
		)
		const popup = fs.readFileSync(
			path.join(root, 'src/components/layout/NotificationsPopup.tsx'),
			'utf8',
		)
		const actions = fs.readFileSync(
			path.join(root, 'src/lib/notifications/actions.ts'),
			'utf8',
		)

		expect(items).not.toContain('whileHover={LIST_ITEM_HOVER}')
		expect(items).toContain('onClick: () => void')
		for (const callback of [
			'onViewBadge',
			'onFindRecipe',
			'onStartNewStreak',
			'onSeeRecipes',
			'onExplore',
			'onViewPantry',
		]) {
			expect(items).toContain(`{${callback} && (`)
		}
		expect(actions).toContain("case 'streak_lost':")
		expect(actions).toContain('onStartNewStreak')
		expect(page).toContain('getGamifiedNotificationCallbacks(')
		expect(page).not.toContain("notif.type === 'streak_lost'")
		expect(page).not.toContain("t('navigationUnavailable')")
		expect(page).toContain('const avatarNode = user ?')
		expect(page).toContain("t('openNotification')")
		expect(page).not.toContain("role={destinationPath ? 'link'")
		expect(popup).toContain('getGamifiedNotificationCallbacks(')
		expect(popup).not.toContain("notif.type === 'streak_lost'")
		expect(popup).toContain('{notif.user ? (')
		expect(popup).toContain("t('openNotification')")
		expect(popup).toContain("t('markRead')")
	})
})
