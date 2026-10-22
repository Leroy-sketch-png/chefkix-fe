import { act, renderHook } from '@testing-library/react'
import { usePostDraftAutosave } from '../usePostDraftAutosave'

function deferred() {
	let resolve!: () => void
	let reject!: (error: Error) => void
	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

describe('usePostDraftAutosave', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it('debounces a changed snapshot and reports it saved only after persistence', async () => {
		const repository = {
			save: jest.fn().mockResolvedValue(undefined),
			clear: jest.fn().mockResolvedValue(undefined),
		}
		const { result, rerender } = renderHook(
			({ content }) =>
				usePostDraftAutosave({
					ownerId: 'user-1',
					content,
					photos: [],
					enabled: true,
					initiallyPersisted: false,
					repository,
				}),
			{ initialProps: { content: '' } },
		)

		rerender({ content: 'Dinner is ready' })
		expect(result.current.state).toBe('unsaved')

		await act(async () => {
			jest.advanceTimersByTime(1499)
		})
		expect(repository.save).not.toHaveBeenCalled()

		await act(async () => {
			jest.advanceTimersByTime(1)
			await Promise.resolve()
		})

		expect(repository.save).toHaveBeenCalledWith({
			ownerId: 'user-1',
			sessionId: undefined,
			content: 'Dinner is ready',
			photos: [],
		})
		expect(result.current.state).toBe('saved')
	})

	it('treats a recovered snapshot as saved without writing it again', async () => {
		const repository = {
			save: jest.fn().mockResolvedValue(undefined),
			clear: jest.fn().mockResolvedValue(undefined),
		}
		const { result } = renderHook(() =>
			usePostDraftAutosave({
				ownerId: 'user-1',
				content: 'Recovered draft',
				photos: [],
				enabled: true,
				initiallyPersisted: true,
				repository,
			}),
		)

		await act(async () => {
			jest.runAllTimers()
		})

		expect(result.current.state).toBe('saved')
		expect(repository.save).not.toHaveBeenCalled()
	})

	it('never marks a newer edit saved when an older write finishes', async () => {
		const firstSave = deferred()
		const secondSave = deferred()
		const repository = {
			save: jest
				.fn()
				.mockReturnValueOnce(firstSave.promise)
				.mockReturnValueOnce(secondSave.promise),
			clear: jest.fn().mockResolvedValue(undefined),
		}
		const { result, rerender } = renderHook(
			({ content }) =>
				usePostDraftAutosave({
					ownerId: 'user-1',
					content,
					photos: [],
					enabled: true,
					initiallyPersisted: false,
					delayMs: 10,
					repository,
				}),
			{ initialProps: { content: '' } },
		)

		rerender({ content: 'First' })
		await act(async () => jest.advanceTimersByTime(10))
		expect(result.current.state).toBe('saving')

		rerender({ content: 'Second' })
		await act(async () => jest.advanceTimersByTime(10))
		expect(repository.save).toHaveBeenCalledTimes(2)

		await act(async () => firstSave.resolve())
		expect(result.current.state).not.toBe('saved')

		await act(async () => secondSave.resolve())
		expect(result.current.state).toBe('saved')
	})

	it('exposes a failed write and retries the current snapshot immediately', async () => {
		const repository = {
			save: jest
				.fn()
				.mockRejectedValueOnce(new Error('storage unavailable'))
				.mockResolvedValueOnce(undefined),
			clear: jest.fn().mockResolvedValue(undefined),
		}
		const { result, rerender } = renderHook(
			({ content }) =>
				usePostDraftAutosave({
					ownerId: 'user-1',
					content,
					photos: [],
					enabled: true,
					initiallyPersisted: false,
					delayMs: 10,
					repository,
				}),
			{ initialProps: { content: '' } },
		)

		rerender({ content: 'Keep this' })
		await act(async () => {
			jest.advanceTimersByTime(10)
			await Promise.resolve()
		})
		expect(result.current.state).toBe('error')
		expect(result.current.hasUnresolvedChanges).toBe(true)

		await act(async () => {
			expect(await result.current.retry()).toBe(true)
		})
		expect(result.current.state).toBe('saved')
	})

	it('clears persisted storage when the current draft becomes empty', async () => {
		const repository = {
			save: jest.fn().mockResolvedValue(undefined),
			clear: jest.fn().mockResolvedValue(undefined),
		}
		const { result, rerender } = renderHook(
			({ content }) =>
				usePostDraftAutosave({
					ownerId: 'user-1',
					content,
					photos: [],
					enabled: true,
					initiallyPersisted: true,
					delayMs: 10,
					repository,
				}),
			{ initialProps: { content: 'Persisted' } },
		)

		rerender({ content: '' })
		await act(async () => {
			jest.advanceTimersByTime(10)
			await Promise.resolve()
		})

		expect(repository.clear).toHaveBeenCalledWith('user-1', undefined)
		expect(result.current.state).toBe('idle')
	})
})
