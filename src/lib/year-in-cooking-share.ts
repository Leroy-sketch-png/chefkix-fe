export interface YearInCookingShareCard {
	emoji: string
	title: string
	value: string
	subtitle: string
}

export interface YearInCookingShareLayout {
	width: number
	height: number
	columns: number
	rows: number
	cellWidth: number
	cellHeight: number
	gapX: number
	gapY: number
	startY: number
	cardPositions: Array<{ x: number; y: number }>
}

const SHARE_WIDTH = 600
const SHARE_MIN_HEIGHT = 800
const GRID_START_Y = 120
const GRID_COLUMNS = 2
const CELL_WIDTH = 260
const CELL_HEIGHT = 150
const GAP_X = 20
const GAP_Y = 12
const FOOTER_SPACE = 100

export function getYearInCookingShareLayout(
	cardCount: number,
): YearInCookingShareLayout {
	const safeCardCount = Math.max(0, Math.floor(cardCount))
	const rows = Math.ceil(safeCardCount / GRID_COLUMNS)
	const gridHeight = rows === 0 ? 0 : rows * CELL_HEIGHT + (rows - 1) * GAP_Y
	const height = Math.max(
		SHARE_MIN_HEIGHT,
		GRID_START_Y + gridHeight + FOOTER_SPACE,
	)
	const offsetX = (SHARE_WIDTH - CELL_WIDTH * GRID_COLUMNS - GAP_X) / 2

	return {
		width: SHARE_WIDTH,
		height,
		columns: GRID_COLUMNS,
		rows,
		cellWidth: CELL_WIDTH,
		cellHeight: CELL_HEIGHT,
		gapX: GAP_X,
		gapY: GAP_Y,
		startY: GRID_START_Y,
		cardPositions: Array.from({ length: safeCardCount }, (_, index) => ({
			x: offsetX + (index % GRID_COLUMNS) * (CELL_WIDTH + GAP_X),
			y:
				GRID_START_Y + Math.floor(index / GRID_COLUMNS) * (CELL_HEIGHT + GAP_Y),
		})),
	}
}

function fitCanvasText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string {
	if (ctx.measureText(text).width <= maxWidth) return text

	let fitted = text
	while (
		fitted.length > 0 &&
		ctx.measureText(`${fitted}...`).width > maxWidth
	) {
		fitted = fitted.slice(0, -1)
	}
	return fitted ? `${fitted}...` : ''
}

export function generateYearInCookingShareCanvas(
	cards: YearInCookingShareCard[],
	headerTitle: string,
	footerTitle: string,
): HTMLCanvasElement {
	const layout = getYearInCookingShareLayout(cards.length)
	const canvas = document.createElement('canvas')
	const dpr = 2
	canvas.width = layout.width * dpr
	canvas.height = layout.height * dpr
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Canvas is unavailable')
	ctx.scale(dpr, dpr)

	ctx.fillStyle = '#fdfbf8'
	ctx.fillRect(0, 0, layout.width, layout.height)

	const gradient = ctx.createLinearGradient(0, 0, layout.width, 80)
	gradient.addColorStop(0, '#ff5a36')
	gradient.addColorStop(1, '#8b5cf6')
	ctx.fillStyle = gradient
	ctx.beginPath()
	ctx.moveTo(0, 0)
	ctx.lineTo(layout.width, 0)
	ctx.lineTo(layout.width, 70)
	ctx.quadraticCurveTo(layout.width / 2, 95, 0, 70)
	ctx.closePath()
	ctx.fill()

	ctx.fillStyle = '#ffffff'
	ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
	ctx.textAlign = 'center'
	ctx.fillText(
		fitCanvasText(ctx, headerTitle, layout.width - 48),
		layout.width / 2,
		44,
	)

	cards.forEach((card, index) => {
		const { x, y } = layout.cardPositions[index]
		const centerX = x + layout.cellWidth / 2
		const textWidth = layout.cellWidth - 24

		ctx.fillStyle = '#ffffff'
		ctx.beginPath()
		ctx.roundRect(x, y, layout.cellWidth, layout.cellHeight, 12)
		ctx.fill()

		ctx.strokeStyle = 'rgba(140,126,114,0.15)'
		ctx.lineWidth = 1
		ctx.beginPath()
		ctx.roundRect(x, y, layout.cellWidth, layout.cellHeight, 12)
		ctx.stroke()

		ctx.font = '30px system-ui, -apple-system, sans-serif'
		ctx.textAlign = 'center'
		ctx.fillText(card.emoji, centerX, y + 38)

		ctx.fillStyle = '#2c2420'
		ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
		ctx.fillText(fitCanvasText(ctx, card.value, textWidth), centerX, y + 72)

		ctx.fillStyle = '#8c7e72'
		ctx.font = '13px system-ui, -apple-system, sans-serif'
		ctx.fillText(fitCanvasText(ctx, card.title, textWidth), centerX, y + 98)

		ctx.font = '11px system-ui, -apple-system, sans-serif'
		ctx.fillStyle = 'rgba(140,126,114,0.7)'
		ctx.fillText(fitCanvasText(ctx, card.subtitle, textWidth), centerX, y + 123)
	})

	const footerY = layout.height - 50
	ctx.fillStyle = '#8c7e72'
	ctx.font = '12px system-ui, -apple-system, sans-serif'
	ctx.textAlign = 'center'
	ctx.fillText(footerTitle, layout.width / 2, footerY)

	ctx.fillStyle = '#ff5a36'
	ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
	ctx.fillText('chefkix.com', layout.width / 2, footerY + 22)

	return canvas
}
