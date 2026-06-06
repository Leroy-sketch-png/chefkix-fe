import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarDays, ChefHat, FileText, ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface ShoppingListsContextRailProps {
	variant: 'list' | 'detail'
	counts: {
		lists: number
		totalItems: number
		checkedItems: number
		progress: number
	}
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

export function ShoppingListsContextRail({
	variant,
	counts,
	className,
}: ShoppingListsContextRailProps) {
	const t = useTranslations('shoppingLists')
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
				<p className='text-2xs font-bold uppercase tracking-widest text-info'>
					{t('pulseEyebrow')}
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					{variant === 'detail'
						? t('pulseHeadingDetail')
						: t('pulseHeadingList')}
				</h3>
				<div className='mt-3'>
					<MetricRow label={t('statLists')} value={counts.lists.toString()} />
					<MetricRow
						label={t('statItems')}
						value={counts.totalItems.toString()}
					/>
					<MetricRow
						label={t('statChecked')}
						value={counts.checkedItems.toString()}
					/>
					<MetricRow label={t('statProgress')} value={`${counts.progress}%`} />
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
					{t('quickMovesEyebrow')}
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/meal-planner'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<CalendarDays className='size-3.5' />
						{t('quickMovesMealPlanner')}
					</Link>
					<Link
						href='/pantry'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<ChefHat className='size-3.5' />
						{t('quickMovesPantry')}
					</Link>
					<Link
						href='/explore'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<ShoppingCart className='size-3.5' />
						{t('quickMovesExplore')}
					</Link>
					<Link
						href='/create'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<FileText className='size-3.5' />
						{t('quickMovesCreate')}
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
