import { motion } from 'framer-motion'
import {
	Edit3,
	FileText,
	Sparkles,
	CheckCircle2,
	Circle,
	Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateCommandDeckProps {
	hasLocalDraft: boolean
	isLoadingDraft: boolean
	onNewRecipe: () => void
	className?: string
}

type PipelineStatus = 'done' | 'active' | 'upcoming'

function PipelineStep({
	step,
	label,
	description,
	status,
	icon: Icon,
}: {
	step: number
	label: string
	description: string
	status: PipelineStatus
	icon: React.ComponentType<{ className?: string }>
}) {
	return (
		<div
			className={cn(
				'flex items-start gap-3 rounded-radius border p-3 transition-all sm:rounded-xl sm:p-3.5',
				status === 'done' && 'border-success/25 bg-success/6',
				status === 'active' && 'border-brand/30 bg-brand/8',
				status === 'upcoming' && 'border-border-subtle bg-bg-elevated/60',
			)}
		>
			<div
				className={cn(
					'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black',
					status === 'done' && 'border-success/40 bg-success/15 text-success',
					status === 'active' && 'border-brand/40 bg-brand/15 text-brand',
					status === 'upcoming' &&
						'border-border-subtle bg-bg-elevated text-text-muted',
				)}
			>
				{status === 'done' ? (
					<CheckCircle2 className='size-3.5 text-success' />
				) : status === 'active' ? (
					<Icon className='size-3 text-brand' />
				) : (
					<span>{step}</span>
				)}
			</div>
			<div className='min-w-0'>
				<p
					className={cn(
						'text-[11px] font-bold leading-none',
						status === 'done' && 'text-success',
						status === 'active' && 'text-brand',
						status === 'upcoming' && 'text-text-muted',
					)}
				>
					{label}
				</p>
				<p className='mt-1 text-[10px] leading-tight text-text-muted'>
					{description}
				</p>
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
	const draftStatus: PipelineStatus = hasLocalDraft ? 'done' : 'upcoming'
	const aiStatus: PipelineStatus = isLoadingDraft
		? 'active'
		: hasLocalDraft
			? 'upcoming'
			: 'upcoming'
	const editStatus: PipelineStatus = 'upcoming'
	const publishStatus: PipelineStatus = 'upcoming'

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-3 shadow-card sm:p-4 md:rounded-2xl md:p-5',
				className,
			)}
		>
			<div className='mb-3 flex flex-wrap items-center justify-between gap-3 sm:mb-4'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						Creation Pipeline
					</p>
					<h2 className='mt-1 text-base font-black text-text-primary sm:text-lg'>
						Draft → Enhance → Publish.
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
				<PipelineStep
					step={1}
					label='Write Draft'
					description={
						hasLocalDraft ? 'Draft saved locally' : 'Start with text or paste'
					}
					status={draftStatus}
					icon={Edit3}
				/>
				<PipelineStep
					step={2}
					label='AI Enhance'
					description={
						isLoadingDraft ? 'Processing...' : 'Auto-structure + enrich'
					}
					status={isLoadingDraft ? 'active' : 'upcoming'}
					icon={Sparkles}
				/>
				<PipelineStep
					step={3}
					label='Review & Edit'
					description='Add photos, adjust steps'
					status={editStatus}
					icon={FileText}
				/>
				<PipelineStep
					step={4}
					label='Publish'
					description='Share with your community'
					status={publishStatus}
					icon={Circle}
				/>
			</div>
		</motion.section>
	)
}
