import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { IngredientScanner } from '@/components/scan/IngredientScanner'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('@/services/ingredient-detection', () => ({
	detectIngredients: jest.fn(),
}))

describe('IngredientScanner camera controls', () => {
	const originalMediaDevices = Object.getOwnPropertyDescriptor(
		navigator,
		'mediaDevices',
	)
	const getUserMedia = jest.fn()
	const stream = {
		getTracks: () => [{ stop: jest.fn() }],
	} as unknown as MediaStream

	beforeEach(() => {
		getUserMedia.mockReset().mockResolvedValue(stream)
		Object.defineProperty(navigator, 'mediaDevices', {
			configurable: true,
			value: { getUserMedia },
		})
		jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
	})

	afterEach(() => {
		if (originalMediaDevices) {
			Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices)
		} else {
			Reflect.deleteProperty(navigator, 'mediaDevices')
		}
		jest.restoreAllMocks()
	})

	it('switches from the back camera to the front camera', async () => {
		render(<IngredientScanner />)

		fireEvent.click(screen.getByRole('button', { name: 'scanUseCamera' }))
		await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1))
		expect(getUserMedia).toHaveBeenLastCalledWith(
			expect.objectContaining({
				video: expect.objectContaining({
					facingMode: { ideal: 'environment' },
				}),
			}),
		)

		fireEvent.playing(screen.getByLabelText('scanCameraPreview'))
		await waitFor(() => screen.getByRole('button', { name: 'scanFlipCamera' }))
		fireEvent.click(screen.getByRole('button', { name: 'scanFlipCamera' }))

		await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2))
		expect(getUserMedia).toHaveBeenLastCalledWith(
			expect.objectContaining({
				video: expect.objectContaining({
					facingMode: { ideal: 'user' },
				}),
			}),
		)
	})
})
