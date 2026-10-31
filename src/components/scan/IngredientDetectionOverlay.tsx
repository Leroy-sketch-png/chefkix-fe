import type { IngredientDetection } from '@/lib/types/ingredient-detection'

interface IngredientDetectionOverlayProps {
	detections: IngredientDetection[]
}

export function IngredientDetectionOverlay({
	detections,
}: IngredientDetectionOverlayProps) {
	return (
		<div className='pointer-events-none absolute inset-0' aria-hidden='true'>
			<svg
				className='absolute inset-0 size-full overflow-visible'
				viewBox='0 0 100 100'
				preserveAspectRatio='none'
				role='presentation'
			>
				{detections.map(detection => {
					const { x, y, width, height } = detection.boundingBox
					return (
						<rect
							key={detection.id}
							x={x * 100}
							y={y * 100}
							width={width * 100}
							height={height * 100}
							fill='rgba(255, 106, 76, 0.12)'
							stroke='var(--color-brand)'
							strokeWidth='0.65'
							vectorEffect='non-scaling-stroke'
						/>
					)
				})}
			</svg>
			{detections.map(detection => (
				<span
					key={`${detection.id}-label`}
					className='absolute rounded-full bg-brand px-2 py-1 text-xs font-bold text-white shadow-warm'
					style={{
						left: `${detection.boundingBox.x * 100}%`,
						top: `${detection.boundingBox.y * 100}%`,
						transform: 'translateY(-100%)',
					}}
				>
					{detection.name}
				</span>
			))}
		</div>
	)
}
