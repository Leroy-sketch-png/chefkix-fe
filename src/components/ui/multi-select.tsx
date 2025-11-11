'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Option = {
	label: string
	value: string
}

interface MultiSelectProps {
	label?: string
	options: Option[]
	value: string[]
	onChange: (values: string[]) => void
	error?: string
	showOtherOption?: boolean
	className?: string
}

export function MultiSelect({
	label,
	options,
	value,
	onChange,
	error,
	showOtherOption = false,
	className = '',
}: MultiSelectProps) {
	const toggleOption = (val: string) => {
		if (val === 'other') {
			if (value.includes('other')) {
				onChange([])
			} else {
				onChange(['other'])
			}
			return
		}

		const filtered = value.filter(v => v !== 'other')

		if (filtered.includes(val)) {
			onChange(filtered.filter(v => v !== val))
		} else {
			onChange([...filtered, val])
		}
	}

	const allOptions = showOtherOption
		? [...options, { label: 'Other', value: 'other' }]
		: options

	return (
		<div className={`flex flex-col gap-2 ${className}`}>
			{label && (
				<span className='text-sm font-medium text-text-primary'>{label}</span>
			)}
			<div className='flex flex-wrap gap-2'>
				{allOptions.map(option => {
					const isActive = value.includes(option.value)
					return (
						<Button
							key={option.value}
							variant={isActive ? 'default' : 'outline'}
							onClick={() => toggleOption(option.value)}
							className='flex cursor-pointer items-center gap-2 rounded-full'
							type='button'
							size='sm'
						>
							<span>{option.label}</span>
							{isActive && <Check className='h-4 w-4' />}
						</Button>
					)
				})}
			</div>

			{error && <p className='mt-1 text-sm text-error'>{error}</p>}
		</div>
	)
}
