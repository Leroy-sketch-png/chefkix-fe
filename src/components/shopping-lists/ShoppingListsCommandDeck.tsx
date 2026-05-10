import { motion } from 'framer-motion'
import { CalendarDays, FileText, ShoppingCart, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface ShoppingListsCommandDeckProps {
	variant: 'list' | 'detail'
	counts: {
		lists: number
		totalItems: number
		checkedItems: number
		progress: number
	}
	onPrimaryAction: () => void
	primaryActionLabel: string
	onSecondaryAction?: () => void
	secondaryActionLabel?: string
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
	tone: 'brand' | 'info' | 'muted'
}) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		info: 'border-info/20 bg-info/8 text-info',
		muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	}[tone]

	return (
		<div className='rounded-xl border border-border-subtle bg-bg-card p-3 shadow-card'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-lg font-black tabular-nums text-text-primary'>
						{value}
					</p>
				</div>
				<div className={cn('rounded-md border p-1.5', toneClass)}>
					<Icon className='size-3.5' />
				</div>
			</div>
		</div>
	)
}

export function ShoppingListsCommandDeck({
	variant,
	counts,
	onPrimaryAction,
	primaryActionLabel,
	onSecondaryAction,
	secondaryActionLabel,
	className,
}: ShoppingListsCommandDeckProps) {
	const t = useTranslations('shoppingLists')
	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-info/8 p-4 shadow-card md:p-5',
				className,
			)}
		>
			<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-info'>
						{t('commandEyebrow')}
					</p>
					<h2 className='mt-1 text-lg font-black text-text-primary'>
						{variant === 'detail'
							? t('commandHeadingDetail')
							: t('commandHeadingList')}
					</h2>
				</div>
				<div className='flex flex-wrap gap-2'>
					{onSecondaryAction && secondaryActionLabel && (
						<button
							type='button'
							onClick={onSecondaryAction}
							className='inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-2 text-sm font-semibold text-text-secondary transition-all hover:bg-bg-hover hover:text-text-primary'
						>
							<FileText className='size-4' />
							{secondaryActionLabel}
						</button>
					)}
					<button
						type='button'
						onClick={onPrimaryAction}
						className='inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand/90'
					>
						<ShoppingCart className='size-4' />
						{primaryActionLabel}
					</button>
				</div>
			</div>

			<div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
				<StatCard
					label={t('statLists')}
					value={counts.lists.toString()}
					icon={ShoppingCart}
					tone='info'
				/>
				<StatCard
					label={t('statItems')}
					value={counts.totalItems.toString()}
					icon={FileText}
					tone='muted'
				/>
				<StatCard
					label={t('statChecked')}
					value={counts.checkedItems.toString()}
					icon={CalendarDays}
					tone='brand'
				/>
				<StatCard
					label={t('statProgress')}
					value={`${counts.progress}%`}
					icon={Sparkles}
					tone={counts.progress > 0 ? 'brand' : 'muted'}
				/>
			</div>
		</motion.section>
	)
}
