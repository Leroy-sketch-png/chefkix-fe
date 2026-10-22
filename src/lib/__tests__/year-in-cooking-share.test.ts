import {
	generateYearInCookingShareCanvas,
	getYearInCookingShareLayout,
} from '@/lib/year-in-cooking-share'

describe('Year in Cooking share layout', () => {
	it('preserves the standard artifact size for up to six highlights', () => {
		for (const cardCount of [1, 2, 5, 6]) {
			const layout = getYearInCookingShareLayout(cardCount)

			expect(layout.width).toBe(600)
			expect(layout.height).toBe(800)
			expect(layout.cardPositions).toHaveLength(cardCount)
		}
	})

	it('expands to render every earned highlight beyond six', () => {
		const layout = getYearInCookingShareLayout(8)

		expect(layout.rows).toBe(4)
		expect(layout.height).toBeGreaterThan(800)
		expect(layout.cardPositions).toHaveLength(8)
		expect(layout.cardPositions[7]).toEqual({ x: 310, y: 606 })
	})

	it('keeps every card above the footer with non-overlapping rows', () => {
		const layout = getYearInCookingShareLayout(8)
		const footerTop = layout.height - 100

		for (let index = 0; index < layout.cardPositions.length; index += 1) {
			const position = layout.cardPositions[index]
			expect(position.y + layout.cellHeight).toBeLessThanOrEqual(footerTop)
			if (index >= layout.columns) {
				const previousRow = layout.cardPositions[index - layout.columns]
				expect(position.y).toBeGreaterThanOrEqual(
					previousRow.y + layout.cellHeight + layout.gapY,
				)
			}
		}
	})

	it('normalizes invalid counts instead of creating phantom cards', () => {
		expect(getYearInCookingShareLayout(-4).cardPositions).toHaveLength(0)
		expect(getYearInCookingShareLayout(2.9).cardPositions).toHaveLength(2)
	})

	it('draws the final card instead of silently truncating the artifact', () => {
		const fillText = jest.fn()
		const context = {
			scale: jest.fn(),
			fillRect: jest.fn(),
			createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
			beginPath: jest.fn(),
			moveTo: jest.fn(),
			lineTo: jest.fn(),
			quadraticCurveTo: jest.fn(),
			closePath: jest.fn(),
			fill: jest.fn(),
			stroke: jest.fn(),
			roundRect: jest.fn(),
			fillText,
			measureText: jest.fn((text: string) => ({ width: text.length * 6 })),
		}
		const canvas = {
			width: 0,
			height: 0,
			getContext: jest.fn(() => context),
		}
		const createElement = jest
			.spyOn(document, 'createElement')
			.mockReturnValue(canvas as unknown as HTMLCanvasElement)
		const cards = Array.from({ length: 8 }, (_, index) => ({
			emoji: `emoji-${index + 1}`,
			title: `title-${index + 1}`,
			value: `value-${index + 1}`,
			subtitle: `subtitle-${index + 1}`,
		}))

		try {
			const result = generateYearInCookingShareCanvas(cards, 'Header', 'Footer')

			expect(result).toBe(canvas)
			expect(canvas.width).toBe(1200)
			expect(canvas.height).toBe(1712)
			expect(fillText).toHaveBeenCalledWith('value-8', 440, 678)
		} finally {
			createElement.mockRestore()
		}
	})
})
