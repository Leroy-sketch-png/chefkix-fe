import { motion } from 'framer-motion'
import { CalendarDays, ChefHat, ShoppingCart, Sparkles } from 'lucide-react'
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

function StatCard({
	label,
	value,
	icon: Icon,
	tone,
}: {
	label: string
	value: string
	icon: React.ComponentType<{ className?: string }>
	tone: 'brand' | 'success' | 'muted'
}) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		success: 'border-success/20 bg-success/8 text-success',
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
	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-success/8 p-4 shadow-card md:p-5',
				className,
			)}
		>
			<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-success'>
						Meal Plan Command
					</p>
					<h2 className='mt-1 text-lg font-black text-text-primary'>
						Build A Week With Intent
					</h2>
				</div>
				<div className='inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/8 px-3 py-1.5 text-xs font-semibold text-success'>
					<CalendarDays className='size-3.5' />
					Planner active
				</div>
			</div>

			<div className='mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4'>
				<StatCard
					label='Days'
					value={plannedDays.toString()}
					icon={CalendarDays}
					tone={hasPlan ? 'success' : 'muted'}
				/>
				<StatCard
					label='Meals'
					value={totalMealsPlanned.toString()}
					icon={ChefHat}
					tone={hasPlan ? 'brand' : 'muted'}
				/>
				<StatCard
					label='Generator'
					value={useAI ? 'AI' : 'Quick'}
					icon={Sparkles}
					tone='brand'
				/>
				<StatCard
					label='State'
					value={hasPlan ? 'Live' : 'Empty'}
					icon={ShoppingCart}
					tone={hasPlan ? 'success' : 'muted'}
				/>
			</div>

			<div className='flex flex-wrap gap-2'>
				{canShowShopping && (
					<button
						type='button'
						onClick={onShowShopping}
						className='inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-2 text-sm font-semibold text-text-secondary transition-all hover:bg-bg-hover hover:text-text-primary'
					>
						<ShoppingCart className='size-4' />
						Shopping list
					</button>
				)}
				{hasPlan && (
					<button
						type='button'
						onClick={onClearPlan}
						className='inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-2 text-sm font-semibold text-destructive transition-all hover:bg-destructive/12'
					>
						Clear plan
					</button>
				)}
				<button
					type='button'
					onClick={onToggleAI}
					className={cn(
						'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
						useAI
							? 'border-brand/20 bg-brand/10 text-brand'
							: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
					)}
				>
					<Sparkles className='size-4' />
					{useAI ? 'AI mode' : 'Quick mode'}
				</button>
				<button
					type='button'
					onClick={onGenerate}
					disabled={generating}
					className='inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand/90 disabled:opacity-50'
				>
					{generating
						? 'Generating...'
						: hasPlan
							? 'Regenerate plan'
							: 'Generate plan'}
				</button>
			</div>
		</motion.section>
	)
}
