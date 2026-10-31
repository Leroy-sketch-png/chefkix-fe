'use client'

import { useState } from 'react'
import { Plus, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
	allergenLabel,
	EU14_ALLERGENS,
	FDA_TOP_9_ALLERGENS,
	normalizeAllergenFlags,
} from '@/lib/allergen-profile'

interface AllergenProfileSelectorProps {
	selected: string[]
	onChange: (next: string[]) => void
	disabled?: boolean
}

const toggleFlag = (selected: string[], flag: string) =>
	normalizeAllergenFlags(
		selected.includes(flag)
			? selected.filter(value => value !== flag)
			: [...selected, flag],
	)

export function AllergenProfileSelector({
	selected,
	onChange,
	disabled = false,
}: AllergenProfileSelectorProps) {
	const [customAllergen, setCustomAllergen] = useState('')
	const customFlags = selected.filter(flag => flag.startsWith('custom:'))

	const addCustomAllergen = () => {
		const value = customAllergen.trim().slice(0, 100)
		if (!value) return
		const flag = `custom:${value}`
		if (
			!selected.some(existing => existing.toLowerCase() === flag.toLowerCase())
		) {
			onChange(normalizeAllergenFlags([...selected, flag]))
		}
		setCustomAllergen('')
	}

	const renderOptions = (options: typeof EU14_ALLERGENS) => (
		<div className='flex flex-wrap gap-2'>
			{options.map(option => {
				const isSelected = selected.includes(option.value)
				return (
					<button
						type='button'
						key={option.value}
						aria-pressed={isSelected}
						disabled={disabled}
						onClick={() => onChange(toggleFlag(selected, option.value))}
						className={cn(
							'rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
							isSelected
								? 'border-brand bg-brand text-white shadow-sm'
								: 'border-border bg-bg-elevated text-text-secondary hover:border-brand/50 hover:text-text-primary',
							disabled && 'cursor-not-allowed opacity-50',
						)}
					>
						{option.label}
					</button>
				)
			})}
		</div>
	)

	return (
		<div className='space-y-5'>
			<div className='flex items-start gap-3 rounded-2xl border border-success/20 bg-success/5 p-4'>
				<ShieldCheck className='mt-0.5 size-5 shrink-0 text-success' />
				<div>
					<p className='font-medium text-text-primary'>Safety profile</p>
					<p className='mt-1 text-sm text-text-secondary'>
						These preferences are sent with substitution requests so unsafe
						suggestions can be filtered before you see them. Always verify
						product labels.
					</p>
				</div>
			</div>

			<section aria-labelledby='eu-allergens-heading' className='space-y-3'>
				<div>
					<h3
						id='eu-allergens-heading'
						className='font-medium text-text-primary'
					>
						EU 14 allergens
					</h3>
					<p className='text-sm text-text-secondary'>
						Select every allergen you need to avoid.
					</p>
				</div>
				{renderOptions(EU14_ALLERGENS)}
			</section>

			<section aria-labelledby='fda-allergens-heading' className='space-y-3'>
				<div>
					<h3
						id='fda-allergens-heading'
						className='font-medium text-text-primary'
					>
						FDA Top 9
					</h3>
					<p className='text-sm text-text-secondary'>
						Overlapping choices stay linked to the same profile flag.
					</p>
				</div>
				{renderOptions(FDA_TOP_9_ALLERGENS)}
			</section>

			<section aria-labelledby='custom-allergens-heading' className='space-y-3'>
				<div>
					<h3
						id='custom-allergens-heading'
						className='font-medium text-text-primary'
					>
						Other / custom
					</h3>
					<p className='text-sm text-text-secondary'>
						Add an allergen that is not in the standard lists.
					</p>
				</div>
				<div className='flex gap-2'>
					<Input
						value={customAllergen}
						disabled={disabled}
						maxLength={100}
						placeholder='e.g. kiwi'
						onChange={event => setCustomAllergen(event.target.value)}
						onKeyDown={event => {
							if (event.key === 'Enter') {
								event.preventDefault()
								addCustomAllergen()
							}
						}}
					/>
					<Button
						type='button'
						variant='outline'
						disabled={disabled || !customAllergen.trim()}
						onClick={addCustomAllergen}
					>
						<Plus className='mr-2 size-4' /> Add
					</Button>
				</div>
				{customFlags.length > 0 && (
					<div className='flex flex-wrap gap-2'>
						{customFlags.map(flag => (
							<span
								key={flag}
								className='inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5 text-sm text-brand'
							>
								{allergenLabel(flag)}
								<button
									type='button'
									aria-label={`Remove ${allergenLabel(flag)}`}
									disabled={disabled}
									onClick={() =>
										onChange(selected.filter(value => value !== flag))
									}
								>
									<X className='size-3.5' />
								</button>
							</span>
						))}
					</div>
				)}
			</section>
		</div>
	)
}
