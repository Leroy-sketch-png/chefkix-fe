import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
	ChatMessage,
	DateDivider,
	type Message,
} from '@/components/messages/ChatMessage'
import { toast } from 'sonner'

let mockAvatarShouldThrow = false

jest.mock('sonner', () => ({
	toast: {
		error: jest.fn(),
	},
}))

const mockToastError = toast.error as jest.Mock

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		const translations: Record<string, string> = {
			somethingWentWrong: 'Something went wrong',
			tryAgain: 'Try again',
			unexpectedError: 'Unexpected error',
			ariaMoreMessageActions: 'More message actions',
			ariaReactToMessage: 'React to message',
			ariaReplyToMessage: 'Reply to message',
			ariaCopyMessage: 'Copy message',
			ariaDeleteMessage: 'Delete message',
			messageActionsLabel: 'Message actions',
			reactionPickerLabel: 'Choose a reaction',
			reactionHeart: 'Heart',
			sharedRecipe: 'Shared Recipe',
			sharedPostImageAlt: 'Shared recipe',
			tapToView: 'Tap to view',
			today: 'Today',
			yesterday: 'Yesterday',
			failedToCopy: 'Failed to copy message',
		}
		return translations[key] ?? key
	},
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
	default: ({
		fill: _fill,
		unoptimized: _unoptimized,
		...props
	}: Record<string, unknown>) => <img {...props} />,
}))

jest.mock('framer-motion', () => {
	const React = require('react')
	const motionComponents: Record<
		string,
		React.ComponentType<React.HTMLAttributes<HTMLElement>>
	> = {}

	return {
		motion: new Proxy(motionComponents, {
			get: (target, tag: string) => {
				if (!target[tag]) {
					target[tag] = ({
						children,
						initial: _initial,
						animate: _animate,
						exit: _exit,
						variants: _variants,
						transition: _transition,
						whileHover: _whileHover,
						whileTap: _whileTap,
						...props
					}: React.HTMLAttributes<HTMLElement> & {
						initial?: unknown
						animate?: unknown
						exit?: unknown
						variants?: unknown
						transition?: unknown
						whileHover?: unknown
						whileTap?: unknown
					}) => React.createElement(tag, props, children)
				}
				return target[tag]
			},
		}),
		AnimatePresence: ({ children }: { children: React.ReactNode }) => (
			<>{children}</>
		),
	}
})

jest.mock('@/components/ui/avatar', () => ({
	Avatar: ({ children }: { children: React.ReactNode }) => {
		if (mockAvatarShouldThrow) {
			throw new Error('chat-message-boom')
		}
		return <div>{children}</div>
	},
	AvatarImage: ({ alt }: { alt?: string }) => <span>{alt}</span>,
	AvatarFallback: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}))

jest.mock('@/components/shared/ConfirmDialog', () => ({
	ConfirmDialog: () => null,
}))

describe('ChatMessage', () => {
	const message: Message = {
		id: 'message-1',
		senderId: 'user-2',
		content: 'hello there',
		timestamp: new Date('2026-04-21T10:00:00.000Z'),
		status: 'sent',
		isOwn: false,
	}

	const clipboardWriteText = jest.fn().mockResolvedValue(undefined)

	beforeEach(() => {
		mockAvatarShouldThrow = false
		mockToastError.mockClear()
		clipboardWriteText.mockClear()
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { writeText: clipboardWriteText },
		})
	})

	it('shows a localized fallback when a message row crashes', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		mockAvatarShouldThrow = true

		render(
			<ChatMessage
				message={message}
				senderAvatar='/avatar.png'
				senderName='Chef Friend'
				showAvatar
				onCopy={jest.fn()}
			/>,
		)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Something went wrong')
		expect(alert.textContent).toContain('chat-message-boom')
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})

	it('exposes message commands through an explicit touch-safe trigger', () => {
		const onReply = jest.fn()
		const onReact = jest.fn()

		render(
			<ChatMessage
				message={message}
				senderName='Chef Friend'
				showAvatar={false}
				onReply={onReply}
				onReact={onReact}
				onCopy={jest.fn()}
			/>,
		)

		const trigger = screen.getByRole('button', {
			name: 'More message actions',
		})
		expect(trigger.getAttribute('aria-expanded')).toBe('false')

		fireEvent.click(trigger)

		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		expect(screen.getByRole('menu', { name: 'Message actions' })).toBeTruthy()
		expect(
			screen.getByRole('menuitem', { name: 'Reply to message' }),
		).toBeTruthy()
		expect(screen.getByRole('menuitem', { name: 'Copy message' })).toBeTruthy()

		fireEvent.click(screen.getByRole('menuitem', { name: 'React to message' }))
		fireEvent.click(screen.getByRole('menuitem', { name: 'Heart' }))

		expect(onReact).toHaveBeenCalledWith('message-1', '❤️')
		expect(trigger.getAttribute('aria-expanded')).toBe('false')
	})

	it('delegates copy to the supplied owner exactly once', () => {
		const onCopy = jest.fn().mockResolvedValue(undefined)

		render(
			<ChatMessage
				message={{ ...message, isOwn: true }}
				showAvatar={false}
				onCopy={onCopy}
			/>,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'More message actions' }),
		)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Copy message' }))

		expect(onCopy).toHaveBeenCalledTimes(1)
		expect(onCopy).toHaveBeenCalledWith('hello there')
		expect(clipboardWriteText).not.toHaveBeenCalled()
	})

	it('uses one browser clipboard write when no owner is supplied', () => {
		render(
			<ChatMessage message={{ ...message, isOwn: true }} showAvatar={false} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'More message actions' }),
		)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Copy message' }))

		expect(clipboardWriteText).toHaveBeenCalledTimes(1)
		expect(clipboardWriteText).toHaveBeenCalledWith('hello there')
	})

	it('reports a standalone clipboard failure instead of dropping it', async () => {
		clipboardWriteText.mockRejectedValueOnce(new Error('clipboard denied'))

		render(
			<ChatMessage message={{ ...message, isOwn: true }} showAvatar={false} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'More message actions' }),
		)
		fireEvent.click(screen.getByRole('menuitem', { name: 'Copy message' }))

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith('Failed to copy message')
		})
	})

	it('renders shared-post and relative-date labels through the locale owner', () => {
		render(
			<>
				<ChatMessage
					message={{
						...message,
						type: 'POST_SHARE',
						relatedId: 'post-1',
						sharedPostImage: '/recipe.jpg',
						sharedPostTitle: 'Weeknight noodles',
					}}
					showAvatar={false}
					onCopy={jest.fn()}
				/>
				<DateDivider date={new Date()} />
			</>,
		)

		expect(screen.getByText('Shared Recipe')).toBeTruthy()
		expect(screen.getByText('Tap to view', { exact: false })).toBeTruthy()
		expect(screen.getByRole('img', { name: 'Shared recipe' })).toBeTruthy()
		expect(screen.getByText('Today')).toBeTruthy()
	})
})
