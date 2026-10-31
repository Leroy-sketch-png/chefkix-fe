import type { EvidenceStatus } from '../types'

const statusLabels: Record<EvidenceStatus, string> = {
	ready: 'Ready to capture',
	'pending-data': 'Pending leader data',
	'capture-needed': 'Capture needed',
}

export function ThesisStatusPill({ status }: { status: EvidenceStatus }) {
	const color =
		status === 'ready'
			? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700'
			: status === 'pending-data'
				? 'border-amber-500/25 bg-amber-500/10 text-amber-700'
				: 'border-border-subtle bg-bg-elevated text-text-muted'
	return (
		<span
			className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${color}`}
		>
			{statusLabels[status]}
		</span>
	)
}
