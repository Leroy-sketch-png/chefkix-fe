import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react'
import { IngredientScanner } from '@/components/scan/IngredientScanner'
import { detectIngredients } from '@/services/ingredient-detection'

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

	it('retains returned tofu and searches only confirmed detections without inventing a recipe', async () => {
		const onConfirmedIngredientsChange = jest.fn()
		const create = URL.createObjectURL
		const revoke = URL.revokeObjectURL
		URL.createObjectURL = jest.fn(() => 'blob:test-scan')
		URL.revokeObjectURL = jest.fn()
		jest.mocked(detectIngredients).mockResolvedValue({
			source: 'backend',
			detections: [
				{
					id: 'fixture-carrot',
					name: 'Carrot',
					confidence: 0.5,
					boundingBox: { x: 0, y: 0, width: 0.2, height: 0.2 },
				},
				{
					id: 'fixture-tofu',
					name: 'Tofu',
					confidence: 0.33,
					boundingBox: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
				},
			],
		})
		try {
			render(
				<IngredientScanner
					onConfirmedIngredientsChange={onConfirmedIngredientsChange}
				/>,
			)
			fireEvent.change(screen.getByTestId('ingredient-scanner-file-input'), {
				target: {
					files: [new File(['fixture'], 'fixture.jpg', { type: 'image/jpeg' })],
				},
			})
			await screen.findByRole('checkbox', { name: 'Use Tofu in recipe search' })
			expect(
				screen.getByRole('button', { name: 'Search recipes' }),
			).toBeDisabled()
			expect(
				screen.queryByText(/96%|ZERO-ALLERGEN|Instant Recipe/),
			).not.toBeInTheDocument()
			fireEvent.click(
				screen.getByRole('checkbox', { name: 'Use Carrot in recipe search' }),
			)
			await waitFor(() =>
				expect(onConfirmedIngredientsChange).toHaveBeenLastCalledWith([
					'Carrot',
				]),
			)
			expect(
				screen.getByRole('link', { name: 'Search recipes' }),
			).toHaveAttribute('href', '/search?q=Carrot')
		} finally {
			cleanup()
			URL.createObjectURL = create
			URL.revokeObjectURL = revoke
		}
	})
})
