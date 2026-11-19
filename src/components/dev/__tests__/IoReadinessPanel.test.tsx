import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { IoReadinessPanel } from '@/components/dev/IoReadinessPanel'
import { getUserMediaBounded } from '@/lib/media/get-user-media-bounded'
import { IO_CERTIFICATION_STORAGE_KEY } from '@/components/dev/io-certification'

jest.mock('@/lib/media/get-user-media-bounded', () => ({
	getUserMediaBounded: jest.fn(),
}))

jest.mock('@/hooks/useWebRTC', () => ({
	getTurnServer: () => ({ urls: 'turn:localhost:3478?transport=udp' }),
	probeTurnRelay: jest.fn(),
}))

jest.mock('@/lib/audio', () => ({ notifyTimerComplete: jest.fn() }))
jest.mock('@/lib/voice/KitchenAudioCoordinator', () => ({
	getKitchenAudioCoordinator: jest.fn(),
}))

const mockedGetUserMedia = jest.mocked(getUserMediaBounded)

class MockAudioContext {
	static instances: MockAudioContext[] = []
	state = 'running'
	constructor() {
		MockAudioContext.instances.push(this)
	}
	close = jest.fn(async () => {
		this.state = 'closed'
	})
	createAnalyser = jest.fn(() => ({
		fftSize: 0,
		frequencyBinCount: 2,
		getByteFrequencyData: jest.fn(),
	}))
	createMediaStreamSource = jest.fn(() => ({ connect: jest.fn() }))
}

function createMediaStream() {
	const audioTrack = { kind: 'audio', stop: jest.fn() }
	const videoTrack = { kind: 'video', stop: jest.fn() }
	const tracks = [audioTrack, videoTrack]
	const stream = {
		getTracks: () => tracks,
		getAudioTracks: () => [audioTrack],
		getVideoTracks: () => [videoTrack],
	} as unknown as MediaStream
	return { stream, audioTrack, videoTrack }
}

describe('I/O readiness media preview lifecycle', () => {
	let requestFrame: jest.SpyInstance
	let cancelFrame: jest.SpyInstance
	let audioContextDescriptor: PropertyDescriptor | undefined

	beforeEach(() => {
		window.localStorage.clear()
		jest.clearAllMocks()
		MockAudioContext.instances = []
		audioContextDescriptor = Object.getOwnPropertyDescriptor(
			window,
			'AudioContext',
		)
		Object.defineProperty(window, 'AudioContext', {
			configurable: true,
			value: MockAudioContext,
		})
		requestFrame = jest
			.spyOn(window, 'requestAnimationFrame')
			.mockReturnValue(12)
		cancelFrame = jest.spyOn(window, 'cancelAnimationFrame')
	})

	afterEach(() => {
		requestFrame.mockRestore()
		cancelFrame.mockRestore()
		if (audioContextDescriptor) {
			Object.defineProperty(window, 'AudioContext', audioContextDescriptor)
		} else {
			Reflect.deleteProperty(window, 'AudioContext')
		}
	})

	it('gates clap calibration on an active microphone preview', async () => {
		const { stream } = createMediaStream()
		mockedGetUserMedia.mockResolvedValue(stream)
		render(<IoReadinessPanel />)

		const calibrate = screen.getByRole('button', { name: 'Calibrate' })
		expect((calibrate as HTMLButtonElement).disabled).toBe(true)
		expect(
			screen.getByText(
				'Start the camera and microphone preview to enable calibration.',
			),
		).toBeTruthy()

		fireEvent.click(calibrate)
		expect(
			JSON.parse(
				window.localStorage.getItem(IO_CERTIFICATION_STORAGE_KEY) || '{}',
			).clap.status,
		).toBe('idle')

		fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
		await screen.findByRole('button', { name: 'Stop preview' })
		expect(
			(screen.getByRole('button', { name: 'Calibrate' }) as HTMLButtonElement)
				.disabled,
		).toBe(false)
	})

	it('stops every track and audio resource without erasing successful evidence', async () => {
		const { stream, audioTrack, videoTrack } = createMediaStream()
		mockedGetUserMedia.mockResolvedValue(stream)
		const { container } = render(<IoReadinessPanel />)
		const video = container.querySelector('video')!
		Object.defineProperty(video, 'srcObject', {
			configurable: true,
			writable: true,
			value: null,
		})

		fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

		await screen.findByRole('button', { name: 'Stop preview' })
		expect(video.srcObject).toBe(stream)
		expect(
			screen.getByText(/1 camera and 1 microphone track ready/),
		).toBeTruthy()

		fireEvent.click(screen.getByRole('button', { name: 'Stop preview' }))

		await waitFor(() => expect(video.srcObject).toBeNull())
		expect(audioTrack.stop).toHaveBeenCalledTimes(1)
		expect(videoTrack.stop).toHaveBeenCalledTimes(1)
		expect(cancelFrame).toHaveBeenCalledWith(12)
		expect(MockAudioContext.instances[0].close).toHaveBeenCalledTimes(1)
		expect(screen.getByRole('button', { name: 'Preview' })).toBeTruthy()
		expect(
			screen.getByText(/1 camera and 1 microphone track ready/),
		).toBeTruthy()
		expect(window.localStorage.getItem(IO_CERTIFICATION_STORAGE_KEY)).toContain(
			'"status":"pass"',
		)
	})

	it('releases acquired media if audio analysis setup fails', async () => {
		const { stream, audioTrack, videoTrack } = createMediaStream()
		mockedGetUserMedia.mockResolvedValue(stream)
		const { container } = render(<IoReadinessPanel />)
		const video = container.querySelector('video')!
		Object.defineProperty(video, 'srcObject', {
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(window, 'AudioContext', {
			configurable: true,
			value: class {
				constructor() {
					throw new Error('AudioContext unavailable')
				}
			},
		})

		fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

		await screen.findByText('Media preflight failed')
		expect(audioTrack.stop).toHaveBeenCalledTimes(1)
		expect(videoTrack.stop).toHaveBeenCalledTimes(1)
		expect(video.srcObject).toBeNull()
		expect(screen.queryByRole('button', { name: 'Stop preview' })).toBeNull()
	})

	it('releases the preview when the panel unmounts', async () => {
		const { stream, audioTrack, videoTrack } = createMediaStream()
		mockedGetUserMedia.mockResolvedValue(stream)
		const { unmount } = render(<IoReadinessPanel />)

		fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
		await screen.findByRole('button', { name: 'Stop preview' })

		unmount()

		expect(audioTrack.stop).toHaveBeenCalledTimes(1)
		expect(videoTrack.stop).toHaveBeenCalledTimes(1)
		expect(cancelFrame).toHaveBeenCalledWith(12)
		expect(MockAudioContext.instances[0].close).toHaveBeenCalledTimes(1)
	})
})
