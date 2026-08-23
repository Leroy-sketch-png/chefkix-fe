'use client'

import { AlertTriangle, Ban, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { allergenLabel } from '@/lib/allergen-profile'
import {
	safetyStatusLabel,
	type AllergenSafetyResult,
} from '@/lib/allergen-safety'

interface AllergenSafetyIndicatorProps {
	safety: AllergenSafetyResult
	compact?: boolean
}

const STATUS_STYLES = {
	safe: {
		icon: ShieldCheck,
		container: 'border-success/20 bg-success/5 text-success',
		label: 'Safe',
	},
	check: {
		icon: AlertTriangle,
		container: 'border-warning/25 bg-warning/5 text-warning',
		label: 'Check',
	},
	blocked: {
		icon: Ban,
		container: 'border-destructive/25 bg-destructive/5 text-destructive',
		label: 'Blocked',
	},
} as const

export function AllergenSafetyIndicator({
	safety,
	compact = false,
}: AllergenSafetyIndicatorProps) {
	const style = STATUS_STYLES[safety.status]
	const Icon = style.icon
	const label = safetyStatusLabel(safety.status)

	return (
		<div
			className={cn(
				'rounded-lg border',
				style.container,
				compact ? 'px-2 py-1.5' : 'px-3 py-2.5',
			)}
			data-testid={`allergen-safety-${safety.status}`}
			role='status'
		>
			<div className='flex items-start gap-2'>
				<Icon
					className={cn('mt-0.5 shrink-0', compact ? 'size-3.5' : 'size-4')}
				/>
				<div className='min-w-0'>
					<p className={cn('font-semibold', compact ? 'text-2xs' : 'text-xs')}>
						{label}
						{!compact && safety.source === 'profile' && ' · profile checked'}
					</p>
					{!compact && (
						<p className='mt-0.5 text-2xs leading-relaxed opacity-85'>
							{safety.reason}
						</p>
					)}
					{!compact && safety.flaggedAllergens.length > 0 && (
						<p className='mt-1 text-2xs font-medium'>
							Flagged: {safety.flaggedAllergens.map(allergenLabel).join(', ')}
						</p>
					)}
				</div>
			</div>
		</div>
	)
}
