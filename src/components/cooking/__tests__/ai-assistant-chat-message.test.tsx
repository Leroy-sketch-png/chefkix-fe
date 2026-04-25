import React from 'react'
import { render, screen } from '@testing-library/react'
import { AiAssistantChatMessage } from '@/components/cooking/AiAssistantChatMessage'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string, values?: Record<string, string>) => {
		const messages: Record<string, string> = {
			somethingWentWrong: 'Something went wrong',
			unexpectedError: 'Unexpected error',
			tryAgain: 'Try again',
			aiWarning: 'Warning',
			aiProTip: 'Pro Tip',
			aiRatio: values?.ratio ?? 'ratio',
		}

		return messages[key] ?? key
	},
}))

describe('AiAssistantChatMessage', () => {
	it('shows a localized fallback when an assistant message crashes', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(
			<AiAssistantChatMessage
				message={{
					id: 'msg-1',
					role: 'assistant',
					type: 'text',
					content: { broken: true } as unknown as string,
					timestamp: new Date('2026-04-21T10:00:00.000Z'),
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
