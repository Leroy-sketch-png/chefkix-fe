import React from 'react'
import { render, screen } from '@testing-library/react'
import { ChatMessage, type Message } from '@/components/messages/ChatMessage'

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
		AnimatePresence: ({ children }: { children: React.ReactNode }) => (
			<>{children}</>
		),
	}
})

jest.mock('@/components/ui/avatar', () => ({
	Avatar: () => {
		throw new Error('chat-message-boom')
	},
	AvatarImage: () => null,
	AvatarFallback: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}))

jest.mock('@/components/shared/ConfirmDialog', () => ({
	ConfirmDialog: () => null,
}))

describe('ChatMessage', () => {
	it('shows a localized fallback when a message row crashes', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		const message: Message = {
			id: 'message-1',
			senderId: 'user-2',
			content: 'hello there',
			timestamp: new Date('2026-04-21T10:00:00.000Z'),
			status: 'sent',
			isOwn: false,
		}

		render(
			<ChatMessage
				message={message}
				senderAvatar='/avatar.png'
				senderName='Chef Friend'
				showAvatar
			/>,
		)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Something went wrong')
		expect(alert.textContent).toContain('chat-message-boom')
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
