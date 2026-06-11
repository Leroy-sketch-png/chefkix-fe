import { render, screen } from '@testing-library/react'
import { AnimatedCircularProgressBar } from '../animated-circular-progress-bar'

describe('AnimatedCircularProgressBar', () => {
	it('labels its center value as a percentage', () => {
		render(
			<AnimatedCircularProgressBar
				value={39}
				max={100}
				gaugePrimaryColor='red'
				gaugeSecondaryColor='gray'
			/>,
		)

		expect(screen.getByText('39%')).not.toBeNull()
		expect(
			screen.getByRole('progressbar').getAttribute('aria-valuetext'),
		).toBe('39% complete')
	})

	it('clamps invalid ranges to a truthful percentage', () => {
		const { rerender } = render(
			<AnimatedCircularProgressBar
				value={200}
				max={100}
				gaugePrimaryColor='red'
				gaugeSecondaryColor='gray'
			/>,
		)

		expect(screen.getByText('100%')).not.toBeNull()

		rerender(
			<AnimatedCircularProgressBar
				value={-10}
				max={0}
				gaugePrimaryColor='red'
				gaugeSecondaryColor='gray'
			/>,
		)

		expect(screen.getByText('0%')).not.toBeNull()
	})
})
