export interface SubstitutionDialogPosition {
	top: number
	left: number
}

export function calculateSubstitutionDialogPosition(
	trigger: Pick<DOMRect, 'top' | 'bottom' | 'left'>,
	panel: Pick<DOMRect, 'width' | 'height'>,
	viewport: { width: number; height: number },
): SubstitutionDialogPosition {
	const margin = 8
	const gap = 8
	const maxHeight = Math.max(0, viewport.height - margin * 2)
	const panelHeight = Math.min(panel.height, maxHeight)
	const belowTop = trigger.bottom + gap
	const availableBelow = viewport.height - margin - belowTop
	const availableAbove = trigger.top - gap - margin

	let top: number
	if (panelHeight <= availableBelow) {
		top = belowTop
	} else if (panelHeight <= availableAbove) {
		top = trigger.top - gap - panelHeight
	} else {
		top = Math.max(
			margin,
			Math.min(belowTop, viewport.height - margin - panelHeight),
		)
	}

	const maxLeft = Math.max(margin, viewport.width - panel.width - margin)
	const left = Math.max(margin, Math.min(trigger.left, maxLeft))
	return { top, left }
}
