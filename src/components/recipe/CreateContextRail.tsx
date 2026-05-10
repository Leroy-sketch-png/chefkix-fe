import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Sparkles, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateContextRailProps {
	hasLocalDraft: boolean
	isLoadingDraft: boolean
	className?: string
}

function MetricRow({ label, value }: { label: string; value: string }) {
	return (
		<div className='flex items-center justify-between border-b border-border-subtle py-2 last:border-0'>
			<span className='text-xs font-medium text-text-secondary'>{label}</span>
			<span className='text-sm font-black text-text-primary'>{value}</span>
		</div>
	)
}

export function CreateContextRail({
	hasLocalDraft,
	isLoadingDraft,
	className,
}: CreateContextRailProps) {
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24',
				className,
			)}
		>
			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					Studio Pulse
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					Creation Readiness
				</h3>
				<div className='mt-3'>
					<MetricRow label='Local draft' value={hasLocalDraft ? 'Yes' : 'No'} />
					<MetricRow
						label='Draft fetch'
						value={isLoadingDraft ? 'Running' : 'Idle'}
					/>
					<MetricRow label='Authoring' value='Available' />
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					Quick Moves
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/profile?tab=recipes'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<FileText className='size-3.5' />
						My recipes
					</Link>
					<Link
						href='/explore'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Sparkles className='size-3.5' />
						Explore inspiration
					</Link>
					<Link
						href='/create'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Wand2 className='size-3.5' />
						Reset studio
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
