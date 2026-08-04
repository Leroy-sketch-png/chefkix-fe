import React, { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MentionInput } from '@/components/shared/MentionInput'
import { getFollowing } from '@/services/social'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('@/services/social', () => ({
	getFollowing: jest.fn(),
}))

jest.mock('@/services/search', () => ({
	autocompleteSearch: jest
		.fn()
		.mockResolvedValue({ success: true, data: null }),
}))

jest.mock('@/components/ui/portal', () => ({
	Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('framer-motion', () => ({
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
}))

const mockedGetFollowing = jest.mocked(getFollowing)

function Harness({ onTags }: { onTags: (ids: string[]) => void }) {
	const [value, setValue] = useState('')
	return (
		<>
			<MentionInput
				value={value}
				onChange={setValue}
				onTaggedUsersChange={onTags}
				placeholder='Write a caption'
			/>
			<button type='button' onClick={() => setValue('')}>
				Reset
			</button>
		</>
	)
}

describe('MentionInput identity lifecycle', () => {
	beforeEach(() => {
		mockedGetFollowing.mockResolvedValue({
			success: true,
			statusCode: 200,
			message: 'ok',
			data: [
				{
					userId: 'user-1',
					profileId: 'profile-1',
					username: 'linhnguyen',
					displayName: 'Linh Nguyen',
					firstName: 'Linh',
					lastName: 'Nguyen',
					avatarUrl: '',
				} as never,
			],
		})
	})

	it('inserts the canonical username and removes its identity after deletion', async () => {
		const onTags = jest.fn()
		render(<Harness onTags={onTags} />)
		const input = screen.getByPlaceholderText('Write a caption')

		fireEvent.change(input, {
			target: { value: '@lin', selectionStart: 4 },
		})
		fireEvent.click(await screen.findByRole('button', { name: /Linh Nguyen/ }))

		expect((input as HTMLInputElement).value).toBe('@linhnguyen ')
		expect(onTags).toHaveBeenLastCalledWith(['user-1'])

		fireEvent.change(input, {
			target: { value: 'Dinner is ready', selectionStart: 15 },
		})
		expect(onTags).toHaveBeenLastCalledWith([])
	})

	it('reconciles identities when the controlled value is reset externally', async () => {
		const onTags = jest.fn()
		render(<Harness onTags={onTags} />)
		const input = screen.getByPlaceholderText('Write a caption')

		fireEvent.change(input, {
			target: { value: '@lin', selectionStart: 4 },
		})
		fireEvent.click(await screen.findByRole('button', { name: /Linh Nguyen/ }))
		fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

		await waitFor(() => expect(onTags).toHaveBeenLastCalledWith([]))
	})
})
