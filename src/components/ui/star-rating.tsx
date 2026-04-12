'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
	value: number
	onChange?: (rating: number) => void
	readOnly?: boolean
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

const sizeMap = {
	sm: 'size-4',
	md: 'size-5',
	lg: 'size-6',
}

export function StarRating({
	value,
	onChange,
	readOnly = false,
	size = 'md',
	className,
}: StarRatingProps) {
	const [hoverValue, setHoverValue] = useState(0)
	const displayValue = hoverValue || value

	return (
		<div className={cn('inline-flex items-center gap-0.5', className)}>
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type='button'
					disabled={readOnly}
					className={cn(
						'transition-colors duration-150',
						readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
					)}
					onClick={() => onChange?.(star)}
					onMouseEnter={() => !readOnly && setHoverValue(star)}
					onMouseLeave={() => !readOnly && setHoverValue(0)}
				>
					<Star
						className={cn(
							sizeMap[size],
							star <= displayValue
								? 'fill-level text-level'
								: 'fill-transparent text-text-muted',
						)}
					/>
				</button>
			))}
		</div>
	)
}
