/** @jest-environment node */

import { POST } from '@/app/api/ingredient-detection/route'

describe('ingredient detection mock endpoint', () => {
	const originalBackendEndpoint = process.env.INGREDIENT_DETECTION_BACKEND_URL

	afterEach(() => {
		if (originalBackendEndpoint === undefined) {
			delete process.env.INGREDIENT_DETECTION_BACKEND_URL
		} else {
			process.env.INGREDIENT_DETECTION_BACKEND_URL = originalBackendEndpoint
		}
		jest.restoreAllMocks()
	})

	it('returns four normalized mock detections for a valid image', async () => {
		const formData = new FormData()
		formData.append(
			'image',
			new File(['image'], 'ingredients.jpg', { type: 'image/jpeg' }),
		)

		const response = await POST({ formData: async () => formData } as Request)
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

	it('rejects requests without an image file', async () => {
		const response = await POST({
			formData: async () => new FormData(),
		} as Request)

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

		const response = await POST({ formData: async () => formData } as Request)
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
})
