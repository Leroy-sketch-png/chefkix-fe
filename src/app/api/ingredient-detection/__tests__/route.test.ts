/** @jest-environment node */

import { POST } from '@/app/api/ingredient-detection/route'
import { authenticateAiProxyCaller } from '@/lib/ai-proxy-auth'

jest.mock('@/lib/ai-proxy-auth', () => ({
	authenticateAiProxyCaller: jest.fn(),
}))

describe('ingredient detection endpoint', () => {
	const originalBackendEndpoint = process.env.INGREDIENT_DETECTION_BACKEND_URL
	const originalMockFlag = process.env.NEXT_PUBLIC_INGREDIENT_DETECTION_MOCK

	afterEach(() => {
		if (originalBackendEndpoint === undefined) {
			delete process.env.INGREDIENT_DETECTION_BACKEND_URL
		} else {
			process.env.INGREDIENT_DETECTION_BACKEND_URL = originalBackendEndpoint
		}
		if (originalMockFlag === undefined) {
			delete process.env.NEXT_PUBLIC_INGREDIENT_DETECTION_MOCK
		} else {
			process.env.NEXT_PUBLIC_INGREDIENT_DETECTION_MOCK = originalMockFlag
		}
		jest.restoreAllMocks()
	})

	beforeEach(() => {
		jest.mocked(authenticateAiProxyCaller).mockResolvedValue({
			authenticated: true,
			userId: 'test-user',
		})
	})

	it('returns mock detections only when explicitly enabled', async () => {
		process.env.NEXT_PUBLIC_INGREDIENT_DETECTION_MOCK = 'true'
		const formData = new FormData()
		formData.append(
			'image',
			new File(['image'], 'ingredients.jpg', { type: 'image/jpeg' }),
		)

		const response = await POST(
			new Request('http://localhost/api/ingredient-detection', {
				method: 'POST',
				body: formData,
				headers: { Authorization: 'Bearer user-token' },
			}),
		)
		const payload = await response.json()

		expect(response.status).toBe(200)
		expect(payload.success).toBe(true)
		expect(payload.data.detections).toHaveLength(4)
		expect(payload.data.detections[0]).toEqual(
			expect.objectContaining({
				name: 'Tomato',
				boundingBox: { x: 0.12, y: 0.2, width: 0.24, height: 0.28 },
			}),
		)
		expect(payload.meta).toEqual({
			source: 'mock',
			replaceWith: 'YOLOv8 ingredient detector',
		})
	})

	it('returns an integration-pending response when no detector is configured', async () => {
		const formData = new FormData()
		formData.append(
			'image',
			new File(['image'], 'ingredients.jpg', { type: 'image/jpeg' }),
		)

		const response = await POST(
			new Request('http://localhost/api/ingredient-detection', {
				method: 'POST',
				body: formData,
				headers: { Authorization: 'Bearer user-token' },
			}),
		)
		const payload = await response.json()

		expect(response.status).toBe(503)
		expect(payload).toEqual(
			expect.objectContaining({
				success: false,
				code: 'INTEGRATION_PENDING',
			}),
		)
	})

	it('rejects requests without an image file', async () => {
		const response = await POST(
			new Request('http://localhost/api/ingredient-detection', {
				method: 'POST',
				body: new FormData(),
				headers: { Authorization: 'Bearer user-token' },
			}),
		)

		expect(response.status).toBe(400)
		expect((await response.json()).success).toBe(false)
	})

	it('proxies the same contract when the real detector endpoint is configured', async () => {
		process.env.INGREDIENT_DETECTION_BACKEND_URL =
			'http://detector.test/v1/scan'
		const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				detections: [
					{
						id: 'real-tomato',
						name: 'Tomato',
						confidence: 0.99,
						boundingBox: { x: 0.1, y: 0.2, width: 0.2, height: 0.2 },
					},
				],
			}),
		} as Response)
		const formData = new FormData()
		formData.append(
			'image',
			new File(['image'], 'ingredients.jpg', { type: 'image/jpeg' }),
		)

		const response = await POST(
			new Request('http://localhost/api/ingredient-detection', {
				method: 'POST',
				body: formData,
				headers: { Authorization: 'Bearer user-token' },
			}),
		)
		const payload = await response.json()

		expect(fetchMock).toHaveBeenCalledWith(
			'http://detector.test/v1/scan',
			expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
		)
		expect(payload).toEqual(
			expect.objectContaining({
				success: true,
				data: expect.objectContaining({ detections: expect.any(Array) }),
				meta: { source: 'real' },
			}),
		)
	})

	it('rejects unauthenticated scans before calling the detector', async () => {
		jest.mocked(authenticateAiProxyCaller).mockResolvedValue({
			authenticated: false,
			status: 401,
			message: 'Authentication required for AI features.',
		})
		const fetchMock = jest.spyOn(global, 'fetch')
		const response = await POST(
			new Request('http://localhost/api/ingredient-detection', {
				method: 'POST',
				body: new FormData(),
			}),
		)

		expect(response.status).toBe(401)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('rejects an oversized upload before parsing its body', async () => {
		const formData = jest.fn()
		const response = await POST({
			headers: new Headers({
				Authorization: 'Bearer user-token',
				'content-length': String(11 * 1024 * 1024),
			}),
			formData,
		} as unknown as Request)

		expect(response.status).toBe(413)
		expect(formData).not.toHaveBeenCalled()
	})
})
