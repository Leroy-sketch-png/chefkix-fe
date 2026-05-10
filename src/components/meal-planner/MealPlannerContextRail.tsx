import { motion } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, ChefHat, ShoppingCart, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface MealPlannerContextRailProps {
	totalMealsPlanned: number
	checkedItems: number
	useAI: boolean
	hasReasoning: boolean
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

export function MealPlannerContextRail({
	totalMealsPlanned,
	checkedItems,
	useAI,
	hasReasoning,
	className,
}: MealPlannerContextRailProps) {
	const t = useTranslations('mealPlanner')
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
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-success'>
					{t('pulseEyebrow')}
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					{t('pulseHeading')}
				</h3>
				<div className='mt-3'>
					<MetricRow
						label={t('pulseMealsPlanned')}
						value={totalMealsPlanned.toString()}
					/>
					<MetricRow
						label={t('pulseCheckedShopping')}
						value={checkedItems.toString()}
					/>
					<MetricRow
						label={t('pulseMode')}
						value={useAI ? t('pulseModeAI') : t('pulseModeQuick')}
					/>
					<MetricRow
						label={t('pulseReasoning')}
						value={
							hasReasoning
								? t('pulseReasoningVisible')
								: t('pulseReasoningHidden')
						}
					/>
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					{t('quickMovesEyebrow')}
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/pantry'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<ShoppingCart className='size-3.5' />
						{t('quickMovesPantry')}
					</Link>
					<Link
						href='/shopping-lists'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<ChefHat className='size-3.5' />
						{t('quickMovesShopping')}
					</Link>
					<Link
						href='/explore'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Sparkles className='size-3.5' />
						{t('quickMovesExplore')}
					</Link>
					<Link
						href='/create'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<CalendarDays className='size-3.5' />
						{t('quickMovesCreate')}
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
