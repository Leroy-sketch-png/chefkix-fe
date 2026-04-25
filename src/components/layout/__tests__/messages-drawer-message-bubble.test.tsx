import React from 'react'
import { render, screen } from '@testing-library/react'
import { MessagesDrawerMessageBubble } from '@/components/layout/MessagesDrawerMessageBubble'

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

describe('MessagesDrawerMessageBubble', () => {
	it('shows a localized fallback when a drawer message bubble crashes', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(
			<MessagesDrawerMessageBubble
				message={{
					id: 'msg-1',
					conversationId: 'conv-1',
					me: false,
					message: { broken: true } as unknown as string,
					sender: {
						userId: 'user-2',
						username: 'chefriend',
						firstName: 'Chef',
						lastName: 'Friend',
						avatar: '/avatar.png',
					},
					createdDate: '2026-04-21T10:00:00.000Z',
				}}
			/>,
		)

		const alert = screen.getByRole('alert')
		expect(alert.textContent).toContain('Something went wrong')
		expect(alert.textContent).toContain(
			'Objects are not valid as a React child',
		)
		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
