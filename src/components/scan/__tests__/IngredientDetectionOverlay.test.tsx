import { render, screen } from '@testing-library/react'
import { IngredientDetectionOverlay } from '@/components/scan/IngredientDetectionOverlay'

describe('IngredientDetectionOverlay', () => {
	it('renders each detection using normalized bounding-box coordinates', () => {
		render(
			<IngredientDetectionOverlay
				detections={[
					{
						id: 'tomato-1',
						name: 'Tomato',
						confidence: 0.97,
						boundingBox: { x: 0.1, y: 0.2, width: 0.25, height: 0.3 },
					},
				]}
			/>,
		)

		const label = screen.getByText('Tomato')
		expect(label.style.left).toBe('10%')
		expect(label.style.top).toBe('20%')
		const rect = document.querySelector('svg rect')
		expect(rect).not.toBeNull()
		expect(rect?.getAttribute('x')).toBe('10')
	})
})
