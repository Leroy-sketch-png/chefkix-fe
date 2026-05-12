import { motion } from 'framer-motion'
import { Clock, Edit3, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateCommandDeckProps {
	hasLocalDraft: boolean
	isLoadingDraft: boolean
	onNewRecipe: () => void
	className?: string
}

function StatCard({
	label,
	value,
	icon: Icon,
	tone,
}: {
	label: string
	value: string
	icon: React.ComponentType<{ className?: string }>
	tone: 'brand' | 'warning' | 'muted'
}) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		warning: 'border-warning/20 bg-warning/8 text-warning',
		muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	}[tone]

	return (
		<div className='rounded-[1.15rem] border border-border-subtle bg-bg-card p-2.5 shadow-card sm:rounded-xl sm:p-3'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-base font-black text-text-primary sm:text-lg'>
						{value}
					</p>
				</div>
				<div className={cn('rounded-md border p-1 sm:p-1.5', toneClass)}>
					<Icon className='size-3 sm:size-3.5' />
				</div>
			</div>
		</div>
	)
}

export function CreateCommandDeck({
	hasLocalDraft,
	isLoadingDraft,
	onNewRecipe,
	className,
}: CreateCommandDeckProps) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-[1.75rem] border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-3 shadow-card sm:p-4 md:rounded-2xl md:p-5',
				className,
			)}
		>
			<div className='mb-3 flex flex-wrap items-center justify-between gap-3 sm:mb-4'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						Creation Command
					</p>
					<h2 className='mt-1 text-base font-black text-text-primary sm:text-lg'>
						Draft. Recover. Publish.
					</h2>
				</div>
				<button
					type='button'
					onClick={onNewRecipe}
					className='inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-brand/20 bg-brand/8 px-3.5 py-2 text-sm font-semibold text-brand transition-all hover:bg-brand/12'
				>
					<Edit3 className='size-4' />
					Start new recipe
				</button>
			</div>

			<div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
				<StatCard label='Mode' value='Studio' icon={Edit3} tone='brand' />
				<StatCard
					label='Recovery'
					value={hasLocalDraft ? 'Available' : 'Clean'}
					icon={FileText}
					tone={hasLocalDraft ? 'warning' : 'muted'}
				/>
				<StatCard
					label='Loader'
					value={isLoadingDraft ? 'Fetching' : 'Ready'}
					icon={Clock}
					tone={isLoadingDraft ? 'warning' : 'muted'}
				/>
				<StatCard
					label='Flow'
					value='AI + Manual'
					icon={Sparkles}
					tone='brand'
				/>
			</div>
		</motion.section>
	)
}
