import React from 'react'
import { render } from '@testing-library/react'
import { BorderBeam } from '@/components/ui/border-beam'

describe('BorderBeam', () => {
	it('binds animation travel and duration to the rendered SVG path', () => {
		const { container } = render(
			<BorderBeam duration={9} beamSize={64}>
				<div>Premium plan</div>
			</BorderBeam>,
		)
		const beam = container.querySelector('rect')

		expect(beam).toBeTruthy()
		expect(beam?.getAttribute('class')).toContain('animate-border-beam')
		expect(beam?.getAttribute('pathLength')).toBe('1064')
		expect((beam as SVGRectElement).style.animationDuration).toBe('9s')
		expect(
			(beam as SVGRectElement).style.getPropertyValue('--border-beam-offset'),
		).toBe('-1064')
	})
})
