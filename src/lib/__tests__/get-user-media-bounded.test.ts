import { getUserMediaBounded } from '@/lib/media/get-user-media-bounded'

describe('bounded media acquisition', () => {
	const originalMediaDevices = Object.getOwnPropertyDescriptor(
		navigator,
		'mediaDevices',
	)

	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		if (originalMediaDevices) {
			Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices)
		} else {
			Reflect.deleteProperty(navigator, 'mediaDevices')
		}
		jest.useRealTimers()
		jest.restoreAllMocks()
	})

	it('rejects unsupported media devices', async () => {
		Object.defineProperty(navigator, 'mediaDevices', {
			configurable: true,
			value: undefined,
		})
		await expect(
			getUserMediaBounded({ audio: true }, 10),
		).rejects.toMatchObject({ name: 'NotSupportedError' })
	})

	it('returns a stream that resolves before the bound', async () => {
		const stream = { getTracks: jest.fn(() => []) } as unknown as MediaStream
		Object.defineProperty(navigator, 'mediaDevices', {
			configurable: true,
			value: { getUserMedia: jest.fn().mockResolvedValue(stream) },
		})
		await expect(getUserMediaBounded({ audio: true }, 10)).resolves.toBe(stream)
	})

	it('times out and stops every track that arrives late', async () => {
		let resolveMedia!: (stream: MediaStream) => void
		const request = new Promise<MediaStream>(resolve => {
			resolveMedia = resolve
		})
		Object.defineProperty(navigator, 'mediaDevices', {
			configurable: true,
			value: { getUserMedia: jest.fn(() => request) },
		})
		const pending = getUserMediaBounded({ audio: true }, 10)
		jest.advanceTimersByTime(10)
		await expect(pending).rejects.toMatchObject({ name: 'TimeoutError' })

		const stop = jest.fn()
		resolveMedia({ getTracks: () => [{ stop }] } as unknown as MediaStream)
		await Promise.resolve()
		expect(stop).toHaveBeenCalledTimes(1)
	})
})
