import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import StoryInteractionBar from '../StoryInteractionBar'

jest.mock('@/i18n/hooks', () => ({
	useTranslations: () => (key: string) => key,
}))

const deferred = <T,>() => {
	let resolve!: (value: T | PromiseLike<T>) => void
	let reject!: (reason?: unknown) => void
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise
		reject = rejectPromise
	})
	return { promise, resolve, reject }
}

describe('StoryInteractionBar', () => {
	it('keeps reply text until delivery succeeds and blocks duplicate sends', async () => {
		const delivery = deferred<void>()
		const onReply = jest.fn(() => delivery.promise)

		render(<StoryInteractionBar onReact={jest.fn()} onReply={onReply} />)

		const input = screen.getByRole('textbox', { name: 'replyPlaceholder' })
		const send = screen.getByRole('button', { name: 'replySend' })
		fireEvent.change(input, { target: { value: 'Looks delicious' } })
		fireEvent.click(send)
		fireEvent.submit(input.closest('form')!)

		expect(onReply).toHaveBeenCalledTimes(1)
		expect(onReply).toHaveBeenCalledWith('Looks delicious')
		expect((input as HTMLInputElement).value).toBe('Looks delicious')
		expect(
			(screen.getByRole('button', {
				name: 'replySending',
			}) as HTMLButtonElement).disabled,
		).toBe(true)

		await act(async () => delivery.resolve())

		await waitFor(() => expect((input as HTMLInputElement).value).toBe(''))
	})

	it('preserves a failed reply and gives an actionable error', async () => {
		const onReply = jest.fn().mockRejectedValue(new Error('offline'))

		render(<StoryInteractionBar onReact={jest.fn()} onReply={onReply} />)

		const input = screen.getByRole('textbox', { name: 'replyPlaceholder' })
		fireEvent.change(input, { target: { value: 'Try again later' } })
		fireEvent.click(screen.getByRole('button', { name: 'replySend' }))

		expect((await screen.findByRole('alert')).textContent).toContain('replyFailed')
		expect((input as HTMLInputElement).value).toBe('Try again later')
		expect(
			(screen.getByRole('button', {
				name: 'replySend',
			}) as HTMLButtonElement).disabled,
		).toBe(false)
	})

	it('pauses for the full composing focus and exposes labelled reactions', () => {
		const onComposingChange = jest.fn()
		const onReact = jest.fn()

		render(
			<StoryInteractionBar
				onReact={onReact}
				onReply={jest.fn().mockResolvedValue(undefined)}
				onComposingChange={onComposingChange}
			/>,
		)

		const input = screen.getByRole('textbox', { name: 'replyPlaceholder' })
		fireEvent.focus(input)
		fireEvent.blur(input)
		expect(onComposingChange.mock.calls).toEqual([[true], [false]])

		fireEvent.click(screen.getByRole('button', { name: 'reactionLove' }))
		expect(onReact).toHaveBeenCalledWith(expect.anything(), 'LOVE')
	})
})
