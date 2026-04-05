'use client'

import { useTranslations } from 'next-intl'

import { motion } from 'framer-motion'
import {
	ArrowLeft,
	TrendingUp,
	TrendingDown,
	ArrowRight,
	Lock,
	Plus,
	Clock,
	Signal,
	ArrowUpDown,
	Edit3,
	BarChart3,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	staggerContainer,
	staggerItem,
	LIST_ITEM_HOVER,
	LIST_ITEM_TAP,
	STAT_ITEM_HOVER,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'
import { AnimatedNumber } from '@/components/ui/animated-number'

// ============================================================================
// TYPES
// ============================================================================

export interface WeekHighlight {
	newCooks: number
	newCooksChange?: number // Phase 2: percentage change vs last week
	xpEarned: number
	xpEarnedChange?: number // Phase 2: percentage change vs last week
	dateRange: string // e.g., "Jan 6 - 12"
}

export interface LifetimeStats {
	recipesPublished: number
	totalCooks: number
	creatorXpEarned: number
	avgRating: number | null
}

export interface CreatorBadge {
	id: string
	icon: string
	name: string
	description: string // Recipe title or achievement description
	isEarned: boolean
}

export interface TopRecipe {
	id: string
	title: string
	imageUrl: string
	cookTime: number
	difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
	cookCount: number
	xpGenerated: number
	rating: number
}

export interface RecipePerformance {
	id: string
	rank: number
	title: string
	imageUrl: string
	cookCount: number
	xpGenerated: number
	badge?: {
		type: 'milestone' | 'trending' | 'attention'
		label: string
	}
	needsAttention?: boolean
}

export interface RecentCook {
	id: string
	userId: string
	userName: string
	userAvatar: string
	recipeTitle: string
	xpEarned: number
	timeAgo: string
}

export interface CreatorDashboardProps {
	weekHighlight: WeekHighlight
	lifetimeStats: LifetimeStats
	creatorBadges: CreatorBadge[]
	topRecipe: TopRecipe | null
	recipePerformance: RecipePerformance[]
	recentCooks: RecentCook[]
	onBack?: () => void
	onViewAllRecipes?: () => void
	onViewAllCooks?: () => void
	onCreateRecipe?: () => void
	onImproveRecipe?: (recipeId: string) => void
	onRecipeClick?: (recipeId: string) => void
	onViewStepAnalytics?: (recipeId: string) => void
	className?: string
}

// ============================================================================
// WEEK HIGHLIGHT
// ============================================================================

function WeekHighlightSection({ data }: { data: WeekHighlight }) {
	const hasNewCooksChange = data.newCooksChange !== undefined
	const hasXpEarnedChange = data.xpEarnedChange !== undefined

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'bg-gradient-to-r from-success/10 to-brand/5',
				'border-2 border-success/20 rounded-xl p-5 mb-6',
			)}
		>
			{/* Header */}
			<div className='flex justify-between mb-4'>
				<span className='text-sm font-bold text-success'>This Week</span>
				<span className='text-sm text-text-secondary'>{data.dateRange}</span>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
				{/* New Cooks */}
				<div className='flex items-center gap-3 p-3.5 bg-bg-card/50 rounded-xl'>
					<span className='text-icon-lg'>ðŸ‘¨â€ðŸ³</span>
					<div className='flex-1 flex flex-col'>
						<span className='text-2xl font-display font-extrabold text-success'>
							+<AnimatedNumber value={data.newCooks} className='tabular-nums' />
						</span>
						<span className='text-xs text-text-secondary'>New Cooks</span>
					</div>
					{hasNewCooksChange && (
						<div
							className={cn(
								'flex items-center gap-1 text-xs font-semibold',
								data.newCooksChange! >= 0 ? 'text-success' : 'text-error',
							)}
						>
							{data.newCooksChange! >= 0 ? (
								<TrendingUp className='w-3.5 h-3.5' />
							) : (
								<TrendingDown className='w-3.5 h-3.5' />
							)}
							{data.newCooksChange! >= 0 ? '+' : ''}
							{data.newCooksChange}%
						</div>
					)}
				</div>

				{/* XP Earned */}
				<div className='flex items-center gap-3 p-3.5 bg-bg-card/50 rounded-xl'>
					<span className='text-icon-lg'>âš¡</span>
					<div className='flex-1 flex flex-col'>
						<span className='text-2xl font-display font-extrabold text-text'>
							+<AnimatedNumber value={data.xpEarned} className='tabular-nums' />
						</span>
						<span className='text-xs text-text-secondary'>XP Earned</span>
					</div>
					{hasXpEarnedChange && (
						<div
							className={cn(
								'flex items-center gap-1 text-xs font-semibold',
								data.xpEarnedChange! >= 0 ? 'text-success' : 'text-error',
							)}
						>
							{data.xpEarnedChange! >= 0 ? (
								<TrendingUp className='w-3.5 h-3.5' />
							) : (
								<TrendingDown className='w-3.5 h-3.5' />
							)}
							{data.xpEarnedChange! >= 0 ? '+' : ''}
							{data.xpEarnedChange}%
						</div>
					)}
				</div>
			</div>
		</motion.div>
	)
}

// ============================================================================
// LIFETIME STATS
// ============================================================================

function LifetimeStatsSection({ stats }: { stats: LifetimeStats }) {
	const t = useTranslations('creator')
	return (
		<div className='bg-bg-card rounded-xl p-6 mb-6'>
			<h3 className='text-lg font-bold text-text mb-4'>{t('lifetimeStats')}</h3>
			<div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
				{/* Recipes Published - Large */}
				<div className='col-span-2 sm:col-span-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-6 bg-bg rounded-xl text-center'>
					<div className='flex items-center gap-2'>
						<span className='text-4xl font-black text-brand'>
						<AnimatedNumber value={stats.recipesPublished} duration={0.8} />
						</span>
						<span className='text-icon-lg'>ðŸ“–</span>
					</div>
					<span className='text-sm text-text-secondary'>{t('recipesPublished')}</span>
				</div>

				<StatCard
					icon='👨‍🍳'
					value={stats.totalCooks.toLocaleString()}
					label={t('totalCooks')}
				/>

				{/* Creator XP */}
				<StatCard
					icon='⚡'
					value={stats.creatorXpEarned.toLocaleString()}
					label={t('creatorXpEarned')}
				/>

				{/* Avg Rating */}
				<StatCard
					icon='⭐'
					value={stats.avgRating !== null ? stats.avgRating.toFixed(1) : '—'}
					label={t('avgRating')}
				/>
			</div>
		</div>
	)
}

function StatCard({
	icon,
	value,
	label,
}: {
	icon: string
	value: string
	label: string
}) {
	return (
		<div className='flex items-center gap-2.5 p-4 bg-bg rounded-xl'>
			<span className='text-2xl'>{icon}</span>
			<div className='flex flex-col'>
				<span className='text-xl font-display font-extrabold text-text'>{value}</span>
				<span className='text-xs text-text-secondary'>{label}</span>
			</div>
		</div>
	)
}

// ============================================================================
// CREATOR BADGES
// ============================================================================

function CreatorBadgesSection({ badges }: { badges: CreatorBadge[] }) {
	const t = useTranslations('creator')
	const earnedCount = badges.filter(b => b.isEarned).length

	return (
		<div className='mb-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-bold text-text'>Creator Badges</h3>
				<span className='text-sm text-text-secondary'>
					{earnedCount} earned
				</span>
			</div>

			<div className='flex gap-3 overflow-x-auto pb-1 scrollbar-hide'>
				{badges.map((badge, index) => (
					<motion.div
						key={badge.id || `creator-badge-${index}`}
						whileHover={
							badge.isEarned
								? { ...LIST_ITEM_HOVER, ...STAT_ITEM_HOVER }
								: undefined
						}
						transition={TRANSITION_SPRING}
						className={cn(
							'flex-shrink-0 flex flex-col items-center gap-2 w-thumbnail-2xl p-5 rounded-2xl text-center relative',
							badge.isEarned
								? 'bg-xp/10 border-2 border-xp/20'
								: 'bg-bg-card opacity-60',
						)}
					>
						<span className='text-icon-xl'>{badge.icon}</span>
						<span className='text-xs font-bold text-text'>{badge.name}</span>
						<span className='text-2xs text-text-secondary line-clamp-2'>
							{badge.description}
						</span>

						{!badge.isEarned && (
							<div className='absolute inset-0 flex items-center justify-center bg-black/40 rounded-radius'>
								<Lock className='size-6 text-white' />
							</div>
						)}
					</motion.div>
				))}
			</div>
		</div>
	)
}

// ============================================================================
// TOP RECIPE SPOTLIGHT
// ============================================================================

function TopRecipeSection({
	recipe,
	onViewAllRecipes,
	onRecipeClick,
}: {
	recipe: TopRecipe
	onViewAllRecipes?: () => void
	onRecipeClick?: (id: string) => void
}) {
	return (
		<div className='bg-bg-card rounded-xl p-6 mb-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-bold text-text'>ðŸ† Top Recipe</h3>
				{onViewAllRecipes && (
					<button
						type='button'
						onClick={onViewAllRecipes}
						className='text-sm font-semibold text-brand'
					>
						View All Recipes
					</button>
				)}
			</div>

			<motion.div
				whileHover={{ ...LIST_ITEM_HOVER, scale: 1.01 }}
				transition={TRANSITION_SPRING}
				onClick={() => onRecipeClick?.(recipe.id)}
				className='flex flex-col sm:flex-row gap-5 cursor-pointer'
			>
				<Image
					src={recipe.imageUrl || '/placeholder-recipe.svg'}
					alt={recipe.title}
					width={120}
					height={120}
					className='w-full sm:size-thumbnail-2xl rounded-2xl object-cover mx-auto sm:mx-0'
				/>{' '}
				<div className='flex-1 flex flex-col gap-2 items-center sm:items-start text-center sm:text-left'>
					<h4 className='text-xl font-display font-extrabold text-text'>{recipe.title}</h4>
					<div className='flex gap-3'>
						<span className='flex items-center gap-1 text-sm text-text-secondary'>
							<Clock className='w-3.5 h-3.5' />
							{recipe.cookTime} min
						</span>
						<span className='flex items-center gap-1 text-sm text-text-secondary'>
							<Signal className='w-3.5 h-3.5' />
							{recipe.difficulty}
						</span>
					</div>
					<div className='flex gap-6 mt-auto justify-center sm:justify-start'>
						<div className='flex flex-col'>
							<span className='text-xl font-display font-extrabold text-brand'>
								<AnimatedNumber value={recipe.cookCount} className='tabular-nums' />
							</span>
							<span className='text-xs text-text-secondary'>Cooks</span>
						</div>
						<div className='flex flex-col'>
							<span className='text-xl font-display font-extrabold text-brand'>
								<AnimatedNumber value={recipe.xpGenerated} format={n => n.toLocaleString()} className='tabular-nums' />
							</span>
							<span className='text-xs text-text-secondary'>XP Generated</span>
						</div>
						<div className='flex flex-col'>
							<span className='text-xl font-display font-extrabold text-brand'>
								{recipe.rating.toFixed(1)}
							</span>
							<span className='text-xs text-text-secondary'>Rating</span>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	)
}

// ============================================================================
// RECIPE PERFORMANCE LIST
// ============================================================================

function RecipePerformanceSection({
	recipes,
	onImproveRecipe,
	onRecipeClick,
	onViewStepAnalytics,
}: {
	recipes: RecipePerformance[]
	onImproveRecipe?: (id: string) => void
	onRecipeClick?: (id: string) => void
	onViewStepAnalytics?: (id: string) => void
}) {
	return (
		<div className='bg-bg-card rounded-xl p-6 mb-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-bold text-text'>Recipe Performance</h3>
				<button
					type='button'
					className='flex items-center gap-1.5 py-2 px-3 bg-bg border border-border-subtle rounded-lg text-sm text-text'
				>
					<ArrowUpDown className='w-3.5 h-3.5 text-text-secondary' />
					Most Cooked
				</button>
			</div>

			{recipes.length === 0 ? (
				<div className='flex flex-col items-center gap-3 py-10 text-center'>
					<span className='text-4xl'>ðŸ“Š</span>
					<p className='text-base font-semibold text-text'>
						No performance data yet
					</p>
					<p className='text-sm text-text-secondary max-w-xs'>
						Publish recipes and watch them get cooked â€” your analytics will
						appear here.
					</p>
				</div>
			) : (
				<motion.div
					variants={staggerContainer}
					initial='hidden'
					animate='visible'
					className='flex flex-col gap-2'
				>
					{recipes.map(recipe => (
						<motion.div
							key={recipe.id}
							variants={staggerItem}
							whileHover={{ backgroundColor: 'var(--border-color)' }}
							onClick={() => onRecipeClick?.(recipe.id)}
							className={cn(
								'flex items-center gap-3.5 p-3.5 bg-bg rounded-xl cursor-pointer transition-colors',
								recipe.needsAttention && 'border-l-3 border-l-amber-500',
							)}
						>
							<span className='w-7 text-base font-display font-extrabold text-text-secondary text-center'>
								{recipe.rank}
							</span>{' '}
							<Image
								src={recipe.imageUrl || '/placeholder-recipe.svg'}
								alt={recipe.title}
								width={56}
								height={56}
								className='size-14 rounded-xl object-cover'
							/>
							<div className='flex-1 flex flex-col gap-1.5'>
								<span className='text-base font-bold text-text'>
									{recipe.title}
								</span>
								{recipe.badge && (
									<span
										className={cn(
											'inline-flex w-fit px-2 py-0.5 rounded-lg text-xs font-semibold',
											recipe.badge.type === 'milestone' &&
												'bg-info/10 text-info',
											recipe.badge.type === 'trending' &&
												'bg-streak/10 text-streak',
											recipe.badge.type === 'attention' &&
												'bg-warning/10 text-warning',
										)}
									>
										{recipe.badge.label}
									</span>
								)}
							</div>
							<div className='flex flex-col sm:flex-row gap-1 sm:gap-5 text-right'>
								<div className='flex flex-row sm:flex-col items-center sm:items-end gap-1'>
									<span className='text-base font-display font-extrabold text-text'>
									<AnimatedNumber value={recipe.cookCount} className='tabular-nums' />
								</span>
								<span className='text-2xs text-text-secondary'>Cooks</span>
							</div>
							<div className='flex flex-row sm:flex-col items-center sm:items-end gap-1'>
								<span className='text-base font-display font-extrabold text-text'>
									+<AnimatedNumber value={recipe.xpGenerated} className='tabular-nums' />
									</span>
									<span className='text-2xs text-text-secondary'>XP</span>
								</div>
							</div>
							{onViewStepAnalytics && recipe.cookCount > 0 && (
								<motion.button
									whileHover={BUTTON_SUBTLE_HOVER}
									whileTap={BUTTON_SUBTLE_TAP}
									onClick={e => {
										e.stopPropagation()
										onViewStepAnalytics(recipe.id)
									}}
									className='size-9 flex items-center justify-center border border-border-subtle rounded-lg text-text-secondary hover:text-brand'
									title='View step analytics'
								>
									<BarChart3 className='size-4' />
								</motion.button>
							)}
							{recipe.needsAttention && onImproveRecipe && (
								<motion.button
									whileHover={BUTTON_SUBTLE_HOVER}
									whileTap={BUTTON_SUBTLE_TAP}
									onClick={e => {
										e.stopPropagation()
										onImproveRecipe(recipe.id)
									}}
									className='size-9 flex items-center justify-center border border-border-subtle rounded-lg text-text-secondary hover:text-text'
									aria-label='Improve recipe'
								>
									<Edit3 className='size-4' />
								</motion.button>
							)}
						</motion.div>
					))}
				</motion.div>
			)}
		</div>
	)
}

// ============================================================================
// RECENT COOKS FEED
// ============================================================================

function RecentCooksSection({
	cooks,
	onViewAll,
}: {
	cooks: RecentCook[]
	onViewAll?: () => void
}) {
	return (
		<div className='bg-bg-card rounded-xl p-6 mb-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-bold text-text'>Recent Cooks</h3>
				{onViewAll && (
					<button
						type='button'
						onClick={onViewAll}
						className='text-sm font-semibold text-brand'
					>
						See All
					</button>
				)}
			</div>

			{cooks.length === 0 ? (
				<div className='flex flex-col items-center gap-3 py-10 text-center'>
					<span className='text-4xl'>ðŸ‘¨â€ðŸ³</span>
					<p className='text-base font-semibold text-text'>
						No one has cooked your recipes yet
					</p>
					<p className='text-sm text-text-secondary max-w-xs'>
						Share your recipes with friends â€” you earn XP every time someone
						cooks them.
					</p>
				</div>
			) : (
				<motion.div
					variants={staggerContainer}
					initial='hidden'
					animate='visible'
					className='flex flex-col gap-3'
				>
					{cooks.map(cook => (
						<motion.div
							key={cook.id}
							variants={staggerItem}
							className='flex items-center gap-3 p-3 bg-bg rounded-xl'
						>
							<Image
								src={cook.userAvatar || '/placeholder-avatar.svg'}
								alt={cook.userName}
								width={40}
								height={40}
								className='size-10 rounded-full object-cover'
							/>
							<div className='flex-1 flex flex-col'>
								<span className='text-sm text-text'>
									<strong className='font-bold'>{cook.userName}</strong> cooked
									your <strong className='font-bold'>{cook.recipeTitle}</strong>
								</span>
								<span className='text-xs text-text-secondary'>
									{cook.timeAgo}
								</span>
							</div>
							<div className='text-right'>
								<span className='block text-base font-display font-extrabold text-success'>
									+<AnimatedNumber value={cook.xpEarned} className='tabular-nums' />
								</span>
								<span className='text-2xs text-text-secondary'>XP</span>
							</div>
						</motion.div>
					))}
				</motion.div>
			)}
		</div>
	)
}

// ============================================================================
// CREATE CTA
// ============================================================================

function CreateCTA({ onCreateRecipe }: { onCreateRecipe?: () => void }) {
	const t = useTranslations('creator')
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'flex flex-col sm:flex-row items-center justify-between gap-4 p-5',
				'bg-xp/10',
				'border-2 border-xp/20 rounded-xl',
			)}
		>
			<div className='flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left'>
				<span className='text-icon-xl'>âœ¨</span>
				<div className='flex flex-col'>
					<strong className='text-base text-text'>
						Share your next masterpiece
					</strong>
					<span className='text-sm text-text-secondary'>
						Every cook of your recipe earns you 4% XP
					</span>
				</div>
			</div>

			<motion.button
				whileHover={{ ...LIST_ITEM_HOVER, ...STAT_ITEM_HOVER }}
				whileTap={LIST_ITEM_TAP}
				onClick={onCreateRecipe}
				className={cn(
					'flex items-center justify-center gap-2 py-3 px-5',
					'bg-gradient-hero',
					'rounded-xl text-sm font-bold text-white w-full sm:w-auto',
					'shadow-card shadow-brand/20',
				)}
			>
				<Plus className='size-icon-sm' />
				Create Recipe
			</motion.button>
		</motion.div>
	)
}

// ============================================================================
// CREATOR DASHBOARD COMPONENT
// ============================================================================

export function CreatorDashboard({
	weekHighlight,
	lifetimeStats,
	creatorBadges,
	topRecipe,
	recipePerformance,
	recentCooks,
	onBack,
	onViewAllRecipes,
	onViewAllCooks,
	onCreateRecipe,
	onImproveRecipe,
	onRecipeClick,
	onViewStepAnalytics,
	className,
}: CreatorDashboardProps) {
	return (
		<div className={cn('max-w-container-lg mx-auto p-5', className)}>
			{/* Header */}
			<div className='flex items-center gap-4 mb-6'>
				{onBack && (
					<motion.button
						whileHover={BUTTON_SUBTLE_HOVER}
						whileTap={BUTTON_SUBTLE_TAP}
						onClick={onBack}
						className='size-10 flex items-center justify-center bg-bg-card border border-border-subtle rounded-xl text-text'
						aria-label='Go back'
					>
						<ArrowLeft className='size-5' />
					</motion.button>
				)}
				<div className='flex-1 flex items-center gap-3 flex-wrap'>
					<h1 className='text-2xl font-display font-extrabold text-text'>
						Creator Dashboard
					</h1>
					<span className='py-1 px-2.5 bg-xp/20 border border-xp/30 rounded-xl text-xs font-semibold text-xp'>
						ðŸ“ Recipe Creator
					</span>
				</div>
			</div>

			{/* Week Highlight */}
			<WeekHighlightSection data={weekHighlight} />

			{/* Lifetime Stats */}
			<LifetimeStatsSection stats={lifetimeStats} />

			{/* Creator Badges */}
			<CreatorBadgesSection badges={creatorBadges} />

			{/* Top Recipe Spotlight */}
			{topRecipe && (
				<TopRecipeSection
					recipe={topRecipe}
					onViewAllRecipes={onViewAllRecipes}
					onRecipeClick={onRecipeClick}
				/>
			)}

			{/* Recipe Performance */}
			<RecipePerformanceSection
				recipes={recipePerformance}
				onImproveRecipe={onImproveRecipe}
				onRecipeClick={onRecipeClick}
				onViewStepAnalytics={onViewStepAnalytics}
			/>

			{/* Recent Cooks */}
			<RecentCooksSection cooks={recentCooks} onViewAll={onViewAllCooks} />

			{/* Create CTA */}
			<CreateCTA onCreateRecipe={onCreateRecipe} />
		</div>
	)
}

export default CreatorDashboard
