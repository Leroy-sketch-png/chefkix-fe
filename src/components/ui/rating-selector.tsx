'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * RatingSelector Component
 *
 * A complete rating filter group with preset options (4.5+, 4.0+, 3.5+, 3.0+)
 * Uses radio buttons internally with star icons.
 * Renamed from RatingFilter to avoid conflict with FilterSort's RatingFilter
 *
 * @example
 * ```tsx
 * const [rating, setRating] = useState<number>()
 *
 * <RatingSelector
 *   value={rating}
 *   onChange={setRating}
 *   options={[4.5, 4.0, 3.5, 3.0]}
 * />
 * ```
 */

interface RatingSelectorProps {
	value?: number
	onChange?: (rating: number) => void
	options?: number[]
	className?: string
}

export const RatingSelector = ({
	value,
	onChange,
	options = [4.5, 4.0, 3.5, 3.0],
	className,
}: RatingSelectorProps) => {
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{options.map(rating => (
				<label
					key={rating}
					className={cn(
						'flex cursor-pointer items-center gap-2 rounded-lg border border-border-subtle px-4 py-3 transition-all hover:border-primary hover:bg-primary/5',
						value === rating &&
							'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20',
					)}
				>
					<input
						type='radio'
						name='rating'
						value={rating}
						checked={value === rating}
						onChange={() => onChange?.(rating)}
						className='sr-only'
					/>
					<Star
						className={cn(
							'h-5 w-5 fill-current transition-all',
							value === rating ? 'text-gold' : 'text-text-secondary',
						)}
					/>
					<span
						className={cn(
							'text-sm font-semibold transition-colors',
							value === rating ? 'text-text-primary' : 'text-text-secondary',
						)}
					>
						{rating}+ stars
					</span>
					{value === rating && (
						<div className='ml-auto h-2 w-2 rounded-full bg-primary' />
					)}
				</label>
			))}
		</div>
	)
}
