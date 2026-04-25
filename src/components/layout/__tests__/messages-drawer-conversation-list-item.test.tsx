import React from 'react'
import { render, screen } from '@testing-library/react'
import { MessagesDrawerConversationListItem } from '@/components/layout/MessagesDrawerConversationListItem'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		const messages: Record<string, string> = {
			somethingWentWrong: 'Something went wrong',
			unexpectedError: 'Unexpected error',
			tryAgain: 'Try again',
		}

		return messages[key] ?? key
	},
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: () => {
		throw new Error('messages-drawer-conversation-boom')
	},
}))

describe('MessagesDrawerConversationListItem', () => {
	it('shows a localized fallback when a drawer conversation row crashes', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(
			<MessagesDrawerConversationListItem
				name='Chef Friend'
				avatar='/avatar.png'
				previewText='hello there'
				unreadCount={2}
				onClick={jest.fn()}
			/>,
		)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Something went wrong')
		expect(alert.textContent).toContain('messages-drawer-conversation-boom')
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
