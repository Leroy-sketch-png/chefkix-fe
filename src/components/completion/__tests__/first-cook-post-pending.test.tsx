import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { FirstCookCelebration } from '../FirstCookCelebration'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('framer-motion', () => {
	const React = require('react')
	const motionElements: Record<string, React.ComponentType<any>> = {}
	return {
		AnimatePresence: ({ children }: { children: React.ReactNode }) => (
			<>{children}</>
		),
		motion: new Proxy(
			{},
			{
				get: (_target, tag: string) => {
					if (!motionElements[tag]) {
						motionElements[tag] = ({
							children,
							initial: _initial,
							animate: _animate,
							exit: _exit,
							transition: _transition,
							variants: _variants,
							whileHover: _whileHover,
							whileTap: _whileTap,
							...props
						}: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) =>
							React.createElement(tag, props, children)
					}
					return motionElements[tag]
				},
			},
		),
	}
})

jest.mock('next/image', () => ({
	__esModule: true,
	default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
		<img {...props} />
	),
}))

jest.mock('@/components/ui/portal', () => ({
	Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/hooks/useFocusTrap', () => ({
	useFocusTrap: () => ({ current: null }),
}))

describe('First Cook post action', () => {
	it('holds the saving state and blocks repeat activation until async persistence settles', async () => {
		let resolveSave!: () => void
		const pendingSave = new Promise<void>(resolve => {
			resolveSave = resolve
		})
		const onPostNow = jest.fn(() => pendingSave)
		const onShareAchievement = jest.fn()
		const onClose = jest.fn()

		render(
			<FirstCookCelebration
				isOpen
				onClose={onClose}
				recipeName='Noodle Soup'
				immediateXp={10}
				xpDeliveryStatus='APPLIED'
				pendingXp={20}
				postDeadlineDays={2}
				onPostNow={onPostNow}
				onShareAchievement={onShareAchievement}
				onContinueCooking={jest.fn()}
			/>,
		)
		expect(screen.getByText('earnedImmediately')).not.toBeNull()

		const postButton = screen.getByRole('button', {
			name: /shareYourCreation/,
		})
		const shareAchievementButton = screen.getByRole('button', {
			name: 'shareAchievement',
		})
		fireEvent.click(postButton)

		expect(onPostNow).toHaveBeenCalledTimes(1)
		expect(onPostNow.mock.results[0].value).toBe(pendingSave)
		expect(postButton).toHaveProperty('disabled', true)
		expect(postButton.getAttribute('aria-busy')).toBe('true')
		expect(screen.getByText('savingDraft').textContent).toBe('savingDraft')
		expect(
			screen.getByRole('button', { name: 'continueCooking' }),
		).toHaveProperty('disabled', true)
		expect(shareAchievementButton).toHaveProperty('disabled', true)
		fireEvent.click(shareAchievementButton)
		expect(onShareAchievement).not.toHaveBeenCalled()
		fireEvent.keyDown(window, { key: 'Escape' })
		expect(onClose).not.toHaveBeenCalled()
		fireEvent.click(postButton)
		expect(onPostNow).toHaveBeenCalledTimes(1)

		await act(async () => {
			resolveSave()
		})

		expect(postButton).toHaveProperty('disabled', false)
		expect(postButton.getAttribute('aria-busy')).toBe('false')
		expect(
			screen.getByRole('button', { name: 'continueCooking' }),
		).toHaveProperty('disabled', false)
		expect(shareAchievementButton).toHaveProperty('disabled', false)
		expect(screen.getByText('shareYourCreation').textContent).toBe(
			'shareYourCreation',
		)
		fireEvent.click(shareAchievementButton)
		expect(onShareAchievement).toHaveBeenCalledTimes(1)
		fireEvent.keyDown(window, { key: 'Escape' })
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('labels queued completion XP as processing, not already earned', () => {
		render(
			<FirstCookCelebration
				isOpen
				onClose={jest.fn()}
				recipeName='Noodle Soup'
				immediateXp={48}
				xpDeliveryStatus='QUEUED'
				pendingXp={84}
				postDeadlineDays={14}
				onPostNow={jest.fn()}
				onShareAchievement={jest.fn()}
				onContinueCooking={jest.fn()}
			/>,
		)

		expect(screen.getByText('xpProcessing')).not.toBeNull()
		expect(screen.queryByText('earnedImmediately')).toBeNull()
	})

	it('keeps sharing available but removes XP claims when no XP is claimable', () => {
		render(
			<FirstCookCelebration
				isOpen
				onClose={jest.fn()}
				recipeName='Noodle Soup'
				immediateXp={0}
				xpDeliveryStatus='APPLIED'
				pendingXp={0}
				postDeadlineDays={14}
				onPostNow={jest.fn()}
				onShareAchievement={jest.fn()}
				onContinueCooking={jest.fn()}
			/>,
		)

		expect(
			screen.getByRole('button', { name: /shareYourCreation/ }),
		).not.toBeNull()
		expect(screen.queryByText('earnedImmediately')).toBeNull()
		expect(screen.queryByText('xpProcessing')).toBeNull()
		expect(screen.queryByText('xpWaiting')).toBeNull()
		expect(screen.queryByText('postPhotoToUnlock')).toBeNull()
		expect(screen.queryByText('upToXp')).toBeNull()
	})

	it('does not invent a deadline when the timestamp pair is unavailable', () => {
		render(
			<FirstCookCelebration
				isOpen
				onClose={jest.fn()}
				recipeName='Noodle Soup'
				immediateXp={48}
				xpDeliveryStatus='APPLIED'
				pendingXp={84}
				postDeadlineDays={null}
				onPostNow={jest.fn()}
				onShareAchievement={jest.fn()}
				onContinueCooking={jest.fn()}
			/>,
		)

		expect(screen.getAllByText('xpWaiting').length).toBeGreaterThan(0)
		expect(screen.queryByText('postToClaimDays')).toBeNull()
		expect(screen.queryByText('daysToPost')).toBeNull()
	})
})
