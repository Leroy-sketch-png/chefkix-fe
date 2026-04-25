'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ComparisonSliderProps {
	beforeSrc: string
	afterSrc: string
	beforeAlt?: string
	afterAlt?: string
	initialPosition?: number
	className?: string
}

export function ComparisonSlider({
	beforeSrc,
	afterSrc,
	beforeAlt = 'Before',
	afterAlt = 'After',
	initialPosition = 50,
	className,
}: ComparisonSliderProps) {
	const containerRef = React.useRef<HTMLDivElement>(null)
	const [position, setPosition] = React.useState(initialPosition)
	const isDragging = React.useRef(false)

	const updatePosition = React.useCallback((clientX: number) => {
		const el = containerRef.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		const pct = ((clientX - rect.left) / rect.width) * 100
		setPosition(Math.max(0, Math.min(100, pct)))
	}, [])

	React.useEffect(() => {
		const onMove = (e: MouseEvent | TouchEvent) => {
			if (!isDragging.current) return
			e.preventDefault()
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
			updatePosition(clientX)
		}

		const onUp = () => {
			isDragging.current = false
		}

		window.addEventListener('mousemove', onMove)
		window.addEventListener('mouseup', onUp)
		window.addEventListener('touchmove', onMove, { passive: false })
		window.addEventListener('touchend', onUp)

		return () => {
			window.removeEventListener('mousemove', onMove)
			window.removeEventListener('mouseup', onUp)
			window.removeEventListener('touchmove', onMove)
			window.removeEventListener('touchend', onUp)
		}
	}, [updatePosition])

	const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
		isDragging.current = true
		const clientX =
			'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
		updatePosition(clientX)
	}

	return (
		<div
			ref={containerRef}
			className={cn(
				'group relative select-none overflow-hidden rounded-radius',
				className,
			)}
			onMouseDown={startDrag}
			onTouchStart={startDrag}
			role='slider'
			aria-valuenow={Math.round(position)}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label='Comparison slider'
			tabIndex={0}
			onKeyDown={e => {
				if (e.key === 'ArrowLeft') setPosition(p => Math.max(0, p - 2))
				if (e.key === 'ArrowRight') setPosition(p => Math.min(100, p + 2))
			}}
		>
			{/* After image (full width, background) */}
			<img
				src={afterSrc}
				alt={afterAlt}
				className='block size-full object-cover'
				draggable={false}
			/>

			{/* Before image (clipped) */}
			<div
				className='absolute inset-0 overflow-hidden'
				style={{ width: `${position}%` }}
			>
				<img
					src={beforeSrc}
					alt={beforeAlt}
					className='block size-full object-cover'
					draggable={false}
				/>
			</div>

			{/* Divider */}
			<div
				className='absolute inset-y-0 z-10 w-0.5 bg-white shadow-md'
				style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
			>
				<div className='absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-bg-card shadow-card'>
					<svg
						className='size-4 text-text'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
					>
						<path d='M8 4l-6 8 6 8M16 4l6 8-6 8' />
					</svg>
				</div>
			</div>

			{/* Labels */}
			<span className='absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs font-medium text-white'>
				Before
			</span>
			<span className='absolute right-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs font-medium text-white'>
				After
			</span>
		</div>
	)
}
