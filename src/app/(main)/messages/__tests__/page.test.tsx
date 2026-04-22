import React from 'react'
import { render, screen } from '@testing-library/react'
import { MessagesConversationListItem } from '@/app/(main)/messages/MessagesConversationListItem'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		switch (key) {
			case 'somethingWentWrong':
				return 'Something went wrong'
			case 'tryAgain':
				return 'Try again'
			case 'unexpectedError':
				return 'Unexpected error'
			case 'unknownUser':
				return 'Unknown user'
			case 'yesterday':
				return 'Yesterday'
			default:
				return key
		}
	},
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: () => {
		throw new Error('messages-conversation-boom')
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

jest.mock('next/navigation', () => ({
	useSearchParams: () => ({ get: () => null }),
}))

jest.mock('@/components/ui/portal', () => ({
	Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/layout/PageHeader', () => ({
	PageHeader: () => <div />,
}))

jest.mock('@/components/layout/PageTransition', () => ({
	PageTransition: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}))

jest.mock('@/components/ui/button', () => ({
	Button: ({
		children,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button type='button' {...props}>
			{children}
		</button>
	),
}))

jest.mock('@/components/ui/input', () => ({
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} />
	),
}))

jest.mock('@/components/shared/MentionInput', () => ({
	MentionInput: React.forwardRef(function MentionInputMock(
		props: React.InputHTMLAttributes<HTMLInputElement>,
		_ref: React.ForwardedRef<{ focus: () => void }>,
	) {
		return <input {...props} />
	}),
}))

jest.mock('@/components/chat/VideoCall', () => () => null)

jest.mock('@/components/messages/ChatMessage', () => ({
	ChatMessage: () => <div />,
}))

jest.mock('@/components/ui/skeleton', () => ({
	Skeleton: () => <div />,
}))

jest.mock('@/components/shared/EmptyStateGamified', () => ({
	EmptyState: () => <div />,
}))

jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => ({ user: { userId: 'user-1' } }),
}))

jest.mock('@/hooks/useChatWebSocket', () => ({
	useChatWebSocket: () => ({
		sendMessage: jest.fn(),
		isConnected: false,
		error: null,
	}),
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

jest.mock('sonner', () => ({
	toast: {
		error: jest.fn(),
		success: jest.fn(),
		warning: jest.fn(),
	},
}))

jest.mock('@/services/chat', () => ({
	getMyConversations: jest.fn(),
	getMessages: jest.fn(),
	sendMessage: jest.fn(),
	createConversation: jest.fn(),
	mapChatMessageToMessage: jest.fn(),
	reactToMessage: jest.fn(),
	deleteMessage: jest.fn(),
}))

describe('MessagesConversationListItem', () => {
	it('shows a localized fallback when a conversation row crashes', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(
			<MessagesConversationListItem
				conversation={{
					id: 'conv-1',
					type: 'DIRECT',
					participantsHash: 'user-1:user-2',
					conversationName: '',
					conversationAvatar: '',
					createdDate: '2026-04-21T10:00:00.000Z',
					modifiedDate: '2026-04-21T10:00:00.000Z',
					unreadCount: 1,
					participants: [
						{
							userId: 'user-1',
							firstName: 'Me',
							lastName: 'User',
							username: 'me',
							avatar: '/me.png',
						},
						{
							userId: 'user-2',
							firstName: 'Chef',
							lastName: 'Friend',
							username: 'chefriend',
							avatar: '/avatar.png',
						},
					],
					lastMessage: {
						id: 'msg-1',
						conversationId: 'conv-1',
						me: false,
						message: 'hello',
						sender: {
							userId: 'user-2',
							firstName: 'Chef',
							lastName: 'Friend',
							username: 'chefriend',
							avatar: '/avatar.png',
						},
						createdDate: '2026-04-21T10:00:00.000Z',
					},
				}}
				isSelected={false}
				currentUserId='user-1'
				onClick={jest.fn()}
			/>,
		)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Something went wrong')
		expect(alert.textContent).toContain('messages-conversation-boom')

		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
