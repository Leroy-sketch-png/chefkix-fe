import { detectIngredients } from '@/services/ingredient-detection'
import { aiApi } from '@/lib/axios'

jest.mock('@/lib/axios', () => ({
	aiApi: { post: jest.fn() },
}))

describe('ingredient detection service', () => {
	const postMock = aiApi.post as jest.Mock

	beforeEach(() => {
		postMock.mockReset()
	})

	it('sends the captured image as multipart form data', async () => {
		const response = {
			detections: [
				{
					id: 'tomato-1',
					name: 'Tomato',
					confidence: 0.97,
					boundingBox: { x: 0.1, y: 0.2, width: 0.25, height: 0.3 },
				},
			],
		}
		postMock.mockResolvedValue({
			data: { success: true, data: response },
		})

		const image = new Blob(['image'], { type: 'image/jpeg' })
		const controller = new AbortController()
		await expect(detectIngredients(image, controller.signal)).resolves.toEqual(
			response,
		)

		expect(postMock).toHaveBeenCalledWith(
			'/api/ingredient-detection',
			expect.any(FormData),
			{
				signal: controller.signal,
				headers: { 'Content-Type': 'multipart/form-data' },
			},
		)
		const body = postMock.mock.calls[0]?.[1] as FormData
		expect(body.get('image')).toBeInstanceOf(File)
	})

	it('surfaces API failures for the UI to handle', async () => {
		postMock.mockRejectedValue({
			response: {
				status: 503,
				data: { success: false, message: 'Scan unavailable' },
			},
		})

		await expect(
			detectIngredients(new Blob(['image'], { type: 'image/jpeg' })),
		).rejects.toThrow('Scan unavailable')
	})
})
