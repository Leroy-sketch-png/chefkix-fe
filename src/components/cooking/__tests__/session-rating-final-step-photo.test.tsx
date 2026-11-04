import { fireEvent, render, screen } from '@testing-library/react'
import { SessionRatingForm } from '../SessionRatingForm'

jest.mock('next-intl', () => ({
	useTranslations:
		() => (key: string, values?: Record<string, string | number>) => {
			if (key === 'captureFinalStepPhoto')
				return `Add a photo of step ${values?.step}`
			if (key === 'stepPhotoCount')
				return `${values?.count}/${values?.max} photos`
			return key
		},
}))

describe('SessionRatingForm final-step photo action', () => {
	const baseProps = {
		xpEarned: 10,
		recipeTitle: 'Test recipe',
		onSubmit: jest.fn(),
	}

	it('offers final-step capture with remaining capacity', () => {
		const onCapture = jest.fn()
		render(
			<SessionRatingForm
				{...baseProps}
				onCaptureFinalStepPhoto={onCapture}
				finalStepNumber={4}
				finalStepPhotoCount={2}
				maxStepPhotos={3}
			/>,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'Add a photo of step 4' }),
		)

		expect(onCapture).toHaveBeenCalledTimes(1)
		expect(screen.getByText('2/3 photos')).toBeTruthy()
	})

	it('hides capture when the photo limit is reached', () => {
		render(
			<SessionRatingForm
				{...baseProps}
				onCaptureFinalStepPhoto={jest.fn()}
				finalStepNumber={4}
				finalStepPhotoCount={3}
				maxStepPhotos={3}
			/>,
		)

		expect(
			screen.queryByRole('button', { name: 'Add a photo of step 4' }),
		).toBeNull()
	})
})
