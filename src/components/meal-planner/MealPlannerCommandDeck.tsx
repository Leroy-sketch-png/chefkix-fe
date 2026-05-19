import { motion } from 'framer-motion'
import {
	CalendarDays,
	ChefHat,
	ShoppingCart,
	Sparkles,
	Brain,
	CheckCircle2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface MealPlannerCommandDeckProps {
	hasPlan: boolean
	plannedDays: number
	totalMealsPlanned: number
	useAI: boolean
	generating: boolean
	onToggleAI: () => void
	onGenerate: () => void
	onShowShopping: () => void
	onClearPlan: () => void
	canShowShopping: boolean
	className?: string
}

function PlanStat({
	value,
	unit,
	label,
	icon: Icon,
	tone,
	empty,
}: {
	value: string | number
	unit?: string
	label: string
	icon: React.ComponentType<{ className?: string }>
	tone: 'brand' | 'success' | 'muted'
	empty?: boolean
}) {
	const toneBg = {
		brand: 'from-brand/8 to-brand/4 border-brand/20',
		success: 'from-success/8 to-success/4 border-success/20',
		muted: 'from-bg-elevated to-bg-elevated border-border-subtle',
	}[tone]
	const toneText = {
		brand: 'text-brand',
		success: 'text-success',
		muted: 'text-text-muted',
	}[tone]
	const toneIcon = {
		brand: 'border-brand/20 bg-brand/10 text-brand',
		success: 'border-success/20 bg-success/10 text-success',
		muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	}[tone]

	return (
		<div
			className={cn(
				'rounded-xl border bg-gradient-to-br p-3 shadow-card',
				toneBg,
			)}
		>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p
						className={cn(
							'mt-1 text-2xl font-black tabular-nums',
							empty ? 'text-text-muted' : 'text-text-primary',
						)}
					>
						{empty ? '—' : value}
						{!empty && unit && (
							<span className='ml-1 text-sm font-semibold text-text-secondary'>
								{unit}
							</span>
						)}
					</p>
				</div>
				<div className={cn('rounded-lg border p-1.5', toneIcon)}>
					<Icon className='size-3.5' />
				</div>
			</div>
		</div>
	)
}

export function MealPlannerCommandDeck({
	hasPlan,
	plannedDays,
	totalMealsPlanned,
	useAI,
	generating,
	onToggleAI,
	onGenerate,
	onShowShopping,
	onClearPlan,
	canShowShopping,
	className,
}: MealPlannerCommandDeckProps) {
	const t = useTranslations('mealPlanner')
	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-success/8 p-3 shadow-card sm:p-4 md:p-5',
				className,
			)}
		>
			<div className='mb-3 flex flex-wrap items-start justify-between gap-2 sm:mb-4 sm:items-center sm:gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-success'>
						{t('commandEyebrow')}
					</p>
					<h2 className='mt-1 text-base font-black text-text-primary sm:text-lg'>
						{t('subtitle')}
					</h2>
				</div>
				<div className='inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/8 px-3 py-1.5 text-xs font-semibold text-success'>
					<CalendarDays className='size-3.5' />
					{t('commandChip')}
				</div>
			</div>

			<div className='mb-3 grid grid-cols-2 gap-2 lg:mb-4 lg:grid-cols-4'>
				<PlanStat
					label={t('statDays')}
					value={plannedDays}
					unit='days'
					icon={CalendarDays}
					tone={hasPlan ? 'success' : 'muted'}
					empty={!hasPlan}
				/>
				<PlanStat
					label={t('statMeals')}
					value={totalMealsPlanned}
					unit='meals'
					icon={ChefHat}
					tone={hasPlan ? 'brand' : 'muted'}
					empty={!hasPlan}
				/>
				<PlanStat
					label='AI Mode'
					value={useAI ? 'On' : 'Off'}
					icon={Brain}
					tone={useAI ? 'brand' : 'muted'}
				/>
				<PlanStat
					label='Status'
					value={hasPlan ? 'Ready' : 'Empty'}
					icon={hasPlan ? CheckCircle2 : ShoppingCart}
					tone={hasPlan ? 'success' : 'muted'}
				/>
			</div>

			<div className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'>
				{canShowShopping && (
					<button
						type='button'
						onClick={onShowShopping}
						className='inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm font-semibold text-text-secondary transition-all hover:bg-bg-hover hover:text-text-primary sm:w-auto sm:px-4'
					>
						<ShoppingCart className='size-4' />
						{t('shoppingList')}
					</button>
				)}
				{hasPlan && (
					<button
						type='button'
						onClick={onClearPlan}
						className='inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm font-semibold text-destructive transition-all hover:bg-destructive/12 sm:w-auto sm:px-4'
					>
						{t('clear')}
					</button>
				)}
				<button
					type='button'
					onClick={onToggleAI}
					className={cn(
						'inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all sm:w-auto sm:px-4',
						useAI
							? 'border-brand/20 bg-brand/10 text-brand'
							: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
					)}
				>
					<Sparkles className='size-4' />
					{useAI ? t('aiMode') : t('quickMode')}
				</button>
				<button
					type='button'
					onClick={onGenerate}
					disabled={generating}
					className='inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-brand/90 disabled:opacity-50 sm:w-auto sm:px-4'
				>
					{generating
						? t('generating')
						: hasPlan
							? t('regenerate')
							: t('generatePlan')}
				</button>
			</div>
		</motion.section>
	)
}
