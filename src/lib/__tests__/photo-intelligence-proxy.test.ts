/** @jest-environment node */

import {
	createPhotoUpstreamSignal,
	photoUpstreamError,
} from '@/lib/photo-intelligence-proxy'

describe('photo intelligence proxy signals', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('propagates browser cancellation to the provider request', () => {
		const controller = new AbortController()
		const request = new Request('http://localhost/api/photo', {
			signal: controller.signal,
		})
		const { signal, timeoutSignal } = createPhotoUpstreamSignal(request)

		controller.abort()

		expect(signal.aborted).toBe(true)
		expect(timeoutSignal.aborted).toBe(false)
	})

	it('reports provider timeout distinctly', async () => {
		const controller = new AbortController()
		jest.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
		const request = new Request('http://localhost/api/photo')
		const { signal, timeoutSignal } = createPhotoUpstreamSignal(request)
		controller.abort()

		expect(signal.aborted).toBe(true)
		const response = photoUpstreamError(timeoutSignal, 'Provider unavailable.')
		expect(response.status).toBe(504)
		expect(await response.json()).toEqual({
			success: false,
			message: 'Provider unavailable. Timed out.',
			code: 'UPSTREAM_TIMEOUT',
		})
	})
})
