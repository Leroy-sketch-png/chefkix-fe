import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChefHat, Package, ShoppingCart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface PantryContextRailProps {
	itemCount: number
	expiringCount: number
	expiredCount: number
	matchedRecipesCount: number
	showSuggestions: boolean
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

export function PantryContextRail({
	itemCount,
	expiringCount,
	expiredCount,
	matchedRecipesCount,
	showSuggestions,
	className,
}: PantryContextRailProps) {
	const t = useTranslations('pantry')

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
					{t('railPulseEyebrow')}
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					{t('railPulseHeading')}
				</h3>
				<div className='mt-3'>
					<MetricRow
						label={t('railStockedItems')}
						value={itemCount.toString()}
					/>
					<MetricRow
						label={t('railExpiringSoon')}
						value={expiringCount.toString()}
					/>
					<MetricRow label={t('railExpired')} value={expiredCount.toString()} />
					<MetricRow
						label={t('railRecipeMatches')}
						value={matchedRecipesCount.toString()}
					/>
					<MetricRow
						label={t('railSuggestionPanel')}
						value={showSuggestions ? t('railOpen') : t('railClosed')}
					/>
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					{t('railQuickMoves')}
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/explore'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<ChefHat className='size-3.5' />
						{t('railExploreRecipes')}
					</Link>
					<Link
						href='/shopping-lists'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<ShoppingCart className='size-3.5' />
						{t('railOpenShoppingLists')}
					</Link>
					<Link
						href='/meal-planner'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Sparkles className='size-3.5' />
						{t('railPlanMeals')}
					</Link>
					<Link
						href='/create'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Package className='size-3.5' />
						{t('railCreateRecipe')}
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
