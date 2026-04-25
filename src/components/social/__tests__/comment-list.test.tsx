import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { CommentList } from '@/components/social/CommentList'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => {
		switch (key) {
			case 'somethingWentWrong':
				return 'Something went wrong'
			case 'tryAgain':
				return 'Try again'
			case 'unexpectedError':
				return 'Unexpected error'
			case 'comments':
				return 'Comments'
			default:
				return key
		}
	},
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

jest.mock('@/components/social/Comment', () => ({
	Comment: () => {
		throw new Error('comment-boom')
	},
}))

jest.mock('@/components/shared/MentionInput', () => ({
	MentionInput: React.forwardRef(function MentionInputMock(
		props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		_ref: React.ForwardedRef<{ clear: () => void }>,
	) {
		return <textarea {...props} />
	}),
}))

jest.mock('@/hooks/useAuthGate', () => ({
	useAuthGate: () => ({ requireAuth: () => true }),
}))

jest.mock('@/services/comment', () => ({
	getCommentsByPostId: jest.fn().mockResolvedValue({
		success: true,
		data: [
			{
				id: 'comment-1',
				content: 'Looks great',
				likes: 0,
				replyCount: 0,
				userId: 'user-2',
			},
		],
	}),
	createComment: jest.fn(),
}))

jest.mock('@/services/ai', () => ({
	moderateContent: jest.fn(),
}))

jest.mock('sonner', () => ({
	toast: {
		error: jest.fn(),
		success: jest.fn(),
		warning: jest.fn(),
	},
}))

jest.mock('@/lib/diagnostics', () => ({
	diag: {
		action: jest.fn(),
		request: jest.fn(),
		response: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	},
}))

describe('CommentList', () => {
	it('shows a localized fallback when a comment item crashes', async () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		render(<CommentList postId='post-1' currentUserId='user-1' />)

		await waitFor(() => {
			const alert = screen.getByRole('alert')
			expect(alert.textContent).toContain('Something went wrong')
			expect(alert.textContent).toContain('comment-boom')
		})

		expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()

		consoleErrorSpy.mockRestore()
	})
})
