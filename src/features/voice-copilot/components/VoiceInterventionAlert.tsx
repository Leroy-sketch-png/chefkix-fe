import { AlertTriangle, Info, OctagonAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoiceIntervention } from '../types'

const SEVERITY_STYLES = {
	info: 'border-brand/20 bg-brand/8 text-brand-light',
	warning: 'border-warning/25 bg-warning/8 text-warning-vivid',
	critical: 'border-error/25 bg-error/8 text-error',
} as const

function SeverityIcon({
	severity,
}: {
	severity: VoiceIntervention['severity']
}) {
	if (severity === 'critical')
		return <OctagonAlert className='size-5 shrink-0' />
	if (severity === 'warning')
		return <AlertTriangle className='size-5 shrink-0' />
	return <Info className='size-5 shrink-0' />
}

export function VoiceInterventionAlert({
	intervention,
}: {
	intervention: VoiceIntervention
}) {
	return (
		<article
			className={cn(
				'rounded-2xl border p-4',
				SEVERITY_STYLES[intervention.severity],
			)}
			role={intervention.severity === 'critical' ? 'alert' : 'status'}
		>
			<div className='flex items-start gap-3'>
				<SeverityIcon severity={intervention.severity} />
				<div className='min-w-0'>
					<h3 className='font-semibold text-text-primary'>
						{intervention.title}
					</h3>
					<p className='mt-1 text-sm leading-6 text-text-secondary'>
						{intervention.message}
					</p>
					{intervention.suggestedAction && (
						<p className='mt-2 text-sm font-medium text-text-primary'>
							Next: {intervention.suggestedAction}
						</p>
					)}
				</div>
			</div>
		</article>
	)
}
