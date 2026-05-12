import { motion } from 'framer-motion'
import Link from 'next/link'
import { Compass, Sparkles, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TonightsPick } from '@/components/dashboard/TonightsPick'
import { SeasonsBest } from '@/components/explore/SeasonsBest'

interface ExploreContextRailProps {
	trendingSearches: string[]
	onQuickSearch: (term: string) => void
	showDiscoveryWidgets: boolean
}

export function ExploreContextRail({
	trendingSearches,
	onQuickSearch,
	showDiscoveryWidgets,
}: ExploreContextRailProps) {
	const t = useTranslations('explore')
	const quickTerms =
		trendingSearches.length > 0
			? trendingSearches.slice(0, 8)
			: ['Quick meals', 'Pasta', 'Chicken', 'Vegan', 'Desserts', 'Breakfast']

	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className='hidden xl:flex xl:flex-col xl:gap-6 xl:self-start xl:sticky xl:top-24'
		>
			{showDiscoveryWidgets && (
				<>
					<TonightsPick className='mb-0' />
					<SeasonsBest className='mb-0' />
				</>
			)}

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					{t('railSearchMomentum')}
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					{t('railHotQueries')}
				</h3>
				<div className='mt-3 flex flex-wrap gap-2'>
					{quickTerms.map(term => (
						<button
							type='button'
							key={term}
							onClick={() => onQuickSearch(term)}
							className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/30 hover:bg-brand/8 hover:text-brand'
						>
							<TrendingUp className='size-3' />
							{term}
						</button>
					))}
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					{t('railQuickMoves')}
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/create'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Sparkles className='size-3.5' />
						{t('railCreateRecipe')}
					</Link>
					<Link
						href='/dashboard'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Compass className='size-3.5' />
						{t('railBackToDashboard')}
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
