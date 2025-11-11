'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface RangeSliderProps {
	min: number
	max: number
	step?: number
	value?: number
	defaultValue?: number
	onChange?: (value: number) => void
	formatLabel?: (value: number) => string
	className?: string
}

export const RangeSlider = ({
	min,
	max,
	step = 1,
	value: controlledValue,
	defaultValue = min,
	onChange,
	formatLabel = val => `${val}`,
	className,
}: RangeSliderProps) => {
	const [internalValue, setInternalValue] = useState(defaultValue)
	const value = controlledValue ?? internalValue
	const trackRef = useRef<HTMLDivElement>(null)

	const percentage = ((value - min) / (max - min)) * 100

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = parseInt(e.target.value, 10)
		setInternalValue(newValue)
		onChange?.(newValue)
	}

	return (
		<div className={cn('w-full', className)}>
			{/* Labels */}
			<div className='mb-3 flex items-center justify-between text-xs text-text-secondary'>
				<span>{formatLabel(min)}</span>
				<span>{formatLabel(max)}</span>
			</div>

			{/* Slider Track */}
			<div className='relative'>
				<div
					ref={trackRef}
					className='h-2 w-full rounded-full bg-bg-hover'
					style={{
						background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--bg-hover) ${percentage}%, var(--bg-hover) 100%)`,
					}}
				/>
				<input
					type='range'
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={handleChange}
					className='absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent focus:outline-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-bg-card [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-bg-card [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110'
				/>
			</div>

			{/* Current Value */}
			<div className='mt-3 text-center text-sm font-semibold text-text-primary'>
				{formatLabel(value)}
			</div>
		</div>
	)
}
