/** @jest-environment node */

import { POST } from '@/app/api/ingredient-detection/route'

describe('ingredient detection mock endpoint', () => {
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
})
