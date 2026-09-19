export function StatusPill({ status }: { status: string }) {
	return (
		<span
			className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${status === 'published' || status === 'complete' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700' : status === 'verified' ? 'border-sky-500/25 bg-sky-500/10 text-sky-700' : status === 'verified-negative' ? 'border-violet-500/25 bg-violet-500/10 text-violet-700' : status === 'placeholder' ? 'border-amber-500/25 bg-amber-500/10 text-amber-700' : 'border-border-subtle bg-bg-elevated text-text-muted'}`}
		>
			{status}
		</span>
	)
}
