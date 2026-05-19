import { motion } from 'framer-motion'
import Link from 'next/link'
import { Compass, Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TonightsPick } from '@/components/dashboard/TonightsPick'
import { SeasonsBest } from '@/components/explore/SeasonsBest'
import { BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'

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
			className='hidden 2xl:flex 2xl:flex-col 2xl:gap-6 2xl:self-start 2xl:sticky 2xl:top-24'
		>
			{showDiscoveryWidgets && (
				<>
					<TonightsPick className='mb-0' />
					<SeasonsBest className='mb-0' />
				</>
			)}

			<div className='rounded-2xl border border-border-subtle/80 bg-gradient-to-br from-bg-card via-bg-card to-brand/5 p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					{t('railSearchMomentum')}
				</p>
				<h3 className='mt-1 text-lg font-black leading-tight text-text-primary'>
					{t('railHotQueries')}
				</h3>
				<p className='mt-1 text-xs font-medium leading-relaxed text-text-secondary'>
					{t('railSearchMomentumDesc')}
				</p>
				<div className='mt-3 flex flex-wrap gap-2'>
					{quickTerms.map(term => (
						<motion.button
							type='button'
							key={term}
							onClick={() => onQuickSearch(term)}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand'
						>
							<TrendingUp className='size-3' />
							{term}
						</motion.button>
					))}
				</div>
			</div>

			<div className='rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					{t('railQuickMoves')}
				</p>
				<h3 className='mt-1 text-base font-bold text-text-primary'>
					{t('railQuickMovesHeading')}
				</h3>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/create'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Sparkles className='size-3.5' />
							{t('railCreateRecipe')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
					<Link
						href='/dashboard'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Compass className='size-3.5' />
							{t('railBackToDashboard')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
