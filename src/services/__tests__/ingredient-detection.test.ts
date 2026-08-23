import { detectIngredients } from '@/services/ingredient-detection'

describe('ingredient detection service', () => {
	const fetchMock = jest.fn()

	beforeEach(() => {
		fetchMock.mockReset()
		global.fetch = fetchMock as unknown as typeof fetch
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
		fetchMock.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true, data: response }),
		})

		const image = new Blob(['image'], { type: 'image/jpeg' })
		await expect(detectIngredients(image)).resolves.toEqual(response)

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/ingredient-detection',
			expect.objectContaining({ method: 'POST' }),
		)
		const request = fetchMock.mock.calls[0]?.[1]
		expect(request?.body).toBeInstanceOf(FormData)
		expect((request?.body as FormData).get('image')).toBeInstanceOf(File)
	})

	it('surfaces API failures for the UI to handle', async () => {
		fetchMock.mockResolvedValue({
			ok: false,
			status: 503,
			json: async () => ({ success: false, message: 'Scan unavailable' }),
		})

		await expect(
			detectIngredients(new Blob(['image'], { type: 'image/jpeg' })),
		).rejects.toThrow('Scan unavailable')
	})
})
