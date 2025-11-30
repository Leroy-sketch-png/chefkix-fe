'use client'

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
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'

// ============================================================================
// TYPES
// ============================================================================

export interface WeekHighlight {
	newCooks: number
	newCooksChange: number // percentage change
	xpEarned: number
	xpEarnedChange: number
	dateRange: string // e.g., "Jan 6 - 12"
}

export interface LifetimeStats {
	recipesPublished: number
	totalCooks: number
	creatorXpEarned: number
	avgRating: number
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
	difficulty: 'Easy' | 'Medium' | 'Hard'
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
	topRecipe: TopRecipe
	recipePerformance: RecipePerformance[]
	recentCooks: RecentCook[]
	onBack?: () => void
	onViewAllRecipes?: () => void
	onViewAllCooks?: () => void
	onCreateRecipe?: () => void
	onImproveRecipe?: (recipeId: string) => void
	onRecipeClick?: (recipeId: string) => void
	className?: string
}

// ============================================================================
// WEEK HIGHLIGHT
// ============================================================================

function WeekHighlightSection({ data }: { data: WeekHighlight }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'bg-gradient-to-r from-emerald-500/10 to-teal-500/5',
				'border-2 border-emerald-500/20 rounded-xl p-5 mb-6',
			)}
		>
			{/* Header */}
			<div className='flex justify-between mb-4'>
				<span className='text-sm font-bold text-emerald-500'>This Week</span>
				<span className='text-sm text-muted'>{data.dateRange}</span>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
				{/* New Cooks */}
				<div className='flex items-center gap-3 p-3.5 bg-white/50 rounded-xl'>
					<span className='text-icon-lg'>👨‍🍳</span>
					<div className='flex-1 flex flex-col'>
						<span
							className={cn(
								'text-2xl font-extrabold',
								data.newCooksChange >= 0 ? 'text-emerald-500' : 'text-text',
							)}
						>
							+{data.newCooks}
						</span>
						<span className='text-xs text-muted'>New Cooks</span>
					</div>
					<div
						className={cn(
							'flex items-center gap-1 text-xs font-semibold',
							data.newCooksChange >= 0 ? 'text-emerald-500' : 'text-red-500',
						)}
					>
						{data.newCooksChange >= 0 ? (
							<TrendingUp className='w-3.5 h-3.5' />
						) : (
							<TrendingDown className='w-3.5 h-3.5' />
						)}
						{data.newCooksChange >= 0 ? '+' : ''}
						{data.newCooksChange}%
					</div>
				</div>

				{/* XP Earned */}
				<div className='flex items-center gap-3 p-3.5 bg-white/50 rounded-xl'>
					<span className='text-icon-lg'>⚡</span>
					<div className='flex-1 flex flex-col'>
						<span className='text-2xl font-extrabold text-text'>
							+{data.xpEarned}
						</span>
						<span className='text-xs text-muted'>XP Earned</span>
					</div>
					<div
						className={cn(
							'flex items-center gap-1 text-xs font-semibold',
							data.xpEarnedChange >= 0 ? 'text-emerald-500' : 'text-red-500',
						)}
					>
						{data.xpEarnedChange >= 0 ? (
							<TrendingUp className='w-3.5 h-3.5' />
						) : (
							<TrendingDown className='w-3.5 h-3.5' />
						)}
						{data.xpEarnedChange >= 0 ? '+' : ''}
						{data.xpEarnedChange}%
					</div>
				</div>
			</div>
		</motion.div>
	)
}

// ============================================================================
// LIFETIME STATS
// ============================================================================

function LifetimeStatsSection({ stats }: { stats: LifetimeStats }) {
	return (
		<div className='bg-panel-bg rounded-xl p-6 mb-6'>
			<h3 className='text-lg font-bold text-text mb-4'>Lifetime Stats</h3>
			<div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
				{/* Recipes Published - Large */}
				<div className='col-span-2 sm:col-span-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-6 bg-bg rounded-xl text-center'>
					<div className='flex items-center gap-2'>
						<span className='text-4xl font-black text-primary'>
							{stats.recipesPublished}
						</span>
						<span className='text-icon-lg'>📖</span>
					</div>
					<span className='text-sm text-muted'>Recipes Published</span>
				</div>

				{/* Total Cooks */}
				<StatCard
					icon='👨‍🍳'
					value={stats.totalCooks.toLocaleString()}
					label='Total Cooks'
				/>

				{/* Creator XP */}
				<StatCard
					icon='⚡'
					value={stats.creatorXpEarned.toLocaleString()}
					label='Creator XP Earned'
				/>

				{/* Avg Rating */}
				<StatCard
					icon='⭐'
					value={stats.avgRating.toFixed(1)}
					label='Avg Rating'
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
				<span className='text-xl font-extrabold text-text'>{value}</span>
				<span className='text-xs text-muted'>{label}</span>
			</div>
		</div>
	)
}

// ============================================================================
// CREATOR BADGES
// ============================================================================

function CreatorBadgesSection({ badges }: { badges: CreatorBadge[] }) {
	const earnedCount = badges.filter(b => b.isEarned).length

	return (
		<div className='mb-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-bold text-text'>Creator Badges</h3>
				<span className='text-sm text-muted'>{earnedCount} earned</span>
			</div>

			<div className='flex gap-3 overflow-x-auto pb-1 scrollbar-hide'>
				{badges.map(badge => (
					<motion.div
						key={badge.id}
						whileHover={badge.isEarned ? { scale: 1.02, y: -2 } : undefined}
						transition={TRANSITION_SPRING}
						className={cn(
							'flex-shrink-0 flex flex-col items-center gap-2 w-thumbnail-2xl p-5 rounded-2xl text-center relative',
							badge.isEarned
								? 'bg-gradient-to-b from-indigo-500/10 to-purple-500/5 border-2 border-indigo-500/20'
								: 'bg-panel-bg opacity-60',
						)}
					>
						<span className='text-icon-xl'>{badge.icon}</span>
						<span className='text-xs font-bold text-text'>{badge.name}</span>
						<span className='text-2xs text-muted line-clamp-2'>
							{badge.description}
						</span>

						{!badge.isEarned && (
							<div className='absolute inset-0 flex items-center justify-center bg-black/40 rounded-radius'>
								<Lock className='w-6 h-6 text-white' />
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
		<div className='bg-panel-bg rounded-xl p-6 mb-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-bold text-text'>🏆 Top Recipe</h3>
				{onViewAllRecipes && (
					<button
						onClick={onViewAllRecipes}
						className='text-sm font-semibold text-primary'
					>
						View All Recipes
					</button>
				)}
			</div>

			<motion.div
				whileHover={{ scale: 1.01 }}
				transition={TRANSITION_SPRING}
				onClick={() => onRecipeClick?.(recipe.id)}
				className='flex flex-col sm:flex-row gap-5 cursor-pointer'
			>
				<Image
					src={recipe.imageUrl || '/images/recipe-placeholder.jpg'}
					alt={recipe.title}
					width={120}
					height={120}
					className='w-full sm:size-thumbnail-2xl rounded-2xl object-cover mx-auto sm:mx-0'
				/>{' '}
				<div className='flex-1 flex flex-col gap-2 items-center sm:items-start text-center sm:text-left'>
					<h4 className='text-xl font-extrabold text-text'>{recipe.title}</h4>
					<div className='flex gap-3'>
						<span className='flex items-center gap-1 text-sm text-muted'>
							<Clock className='w-3.5 h-3.5' />
							{recipe.cookTime} min
						</span>
						<span className='flex items-center gap-1 text-sm text-muted'>
							<Signal className='w-3.5 h-3.5' />
							{recipe.difficulty}
						</span>
					</div>
					<div className='flex gap-6 mt-auto justify-center sm:justify-start'>
						<div className='flex flex-col'>
							<span className='text-xl font-extrabold text-primary'>
								{recipe.cookCount}
							</span>
							<span className='text-xs text-muted'>Cooks</span>
						</div>
						<div className='flex flex-col'>
							<span className='text-xl font-extrabold text-primary'>
								{recipe.xpGenerated.toLocaleString()}
							</span>
							<span className='text-xs text-muted'>XP Generated</span>
						</div>
						<div className='flex flex-col'>
							<span className='text-xl font-extrabold text-primary'>
								{recipe.rating.toFixed(1)}
							</span>
							<span className='text-xs text-muted'>Rating</span>
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
}: {
	recipes: RecipePerformance[]
	onImproveRecipe?: (id: string) => void
	onRecipeClick?: (id: string) => void
}) {
	return (
		<div className='bg-panel-bg rounded-xl p-6 mb-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-bold text-text'>Recipe Performance</h3>
				<button className='flex items-center gap-1.5 py-2 px-3 bg-bg border border-border rounded-lg text-sm text-text'>
					<ArrowUpDown className='w-3.5 h-3.5 text-muted' />
					Most Cooked
				</button>
			</div>

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
						<span className='w-7 text-base font-extrabold text-muted text-center'>
							{recipe.rank}
						</span>

						<Image
							src={recipe.imageUrl || '/images/recipe-placeholder.jpg'}
							alt={recipe.title}
							width={56}
							height={56}
							className='w-14 h-14 rounded-xl object-cover'
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
											'bg-indigo-500/10 text-indigo-500',
										recipe.badge.type === 'trending' &&
											'bg-orange-500/10 text-orange-500',
										recipe.badge.type === 'attention' &&
											'bg-amber-500/10 text-amber-500',
									)}
								>
									{recipe.badge.label}
								</span>
							)}
						</div>

						<div className='flex flex-col sm:flex-row gap-1 sm:gap-5 text-right'>
							<div className='flex flex-row sm:flex-col items-center sm:items-end gap-1'>
								<span className='text-base font-extrabold text-text'>
									{recipe.cookCount}
								</span>
								<span className='text-2xs text-muted'>Cooks</span>
							</div>
							<div className='flex flex-row sm:flex-col items-center sm:items-end gap-1'>
								<span className='text-base font-extrabold text-text'>
									+{recipe.xpGenerated}
								</span>
								<span className='text-2xs text-muted'>XP</span>
							</div>
						</div>

						{recipe.needsAttention && onImproveRecipe && (
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={e => {
									e.stopPropagation()
									onImproveRecipe(recipe.id)
								}}
								className='w-9 h-9 flex items-center justify-center border border-border rounded-lg text-muted hover:text-text'
							>
								<Edit3 className='w-4 h-4' />
							</motion.button>
						)}
					</motion.div>
				))}
			</motion.div>
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
		<div className='bg-panel-bg rounded-xl p-6 mb-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-bold text-text'>Recent Cooks</h3>
				{onViewAll && (
					<button
						onClick={onViewAll}
						className='text-sm font-semibold text-primary'
					>
						See All
					</button>
				)}
			</div>

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
							src={cook.userAvatar || '/images/default-avatar.png'}
							alt={cook.userName}
							width={40}
							height={40}
							className='w-10 h-10 rounded-full object-cover'
						/>
						<div className='flex-1 flex flex-col'>
							<span className='text-sm text-text'>
								<strong className='font-bold'>{cook.userName}</strong> cooked
								your <strong className='font-bold'>{cook.recipeTitle}</strong>
							</span>
							<span className='text-xs text-muted'>{cook.timeAgo}</span>
						</div>
						<div className='text-right'>
							<span className='block text-base font-extrabold text-emerald-500'>
								+{cook.xpEarned}
							</span>
							<span className='text-2xs text-muted'>XP</span>
						</div>
					</motion.div>
				))}
			</motion.div>
		</div>
	)
}

// ============================================================================
// CREATE CTA
// ============================================================================

function CreateCTA({ onCreateRecipe }: { onCreateRecipe?: () => void }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'flex flex-col sm:flex-row items-center justify-between gap-4 p-5',
				'bg-gradient-to-r from-indigo-500/10 to-purple-500/5',
				'border-2 border-indigo-500/20 rounded-xl',
			)}
		>
			<div className='flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left'>
				<span className='text-icon-xl'>✨</span>
				<div className='flex flex-col'>
					<strong className='text-base text-text'>
						Share your next masterpiece
					</strong>
					<span className='text-sm text-muted'>
						Every cook of your recipe earns you 4% XP
					</span>
				</div>
			</div>

			<motion.button
				whileHover={{ scale: 1.02, y: -2 }}
				whileTap={{ scale: 0.98 }}
				onClick={onCreateRecipe}
				className={cn(
					'flex items-center justify-center gap-2 py-3 px-5',
					'bg-gradient-to-r from-indigo-500 to-purple-500',
					'rounded-xl text-sm font-bold text-white w-full sm:w-auto',
					'shadow-lg shadow-indigo-500/20',
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
	className,
}: CreatorDashboardProps) {
	return (
		<div className={cn('max-w-container-lg mx-auto p-5', className)}>
			{/* Header */}
			<div className='flex items-center gap-4 mb-6'>
				{onBack && (
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={onBack}
						className='w-10 h-10 flex items-center justify-center bg-panel-bg border border-border rounded-xl text-text'
					>
						<ArrowLeft className='w-5 h-5' />
					</motion.button>
				)}
				<div className='flex-1 flex items-center gap-3 flex-wrap'>
					<h1 className='text-2xl font-extrabold text-text'>
						Creator Dashboard
					</h1>
					<span className='py-1 px-2.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/10 border border-purple-500/30 rounded-xl text-xs font-semibold text-purple-500'>
						📝 Recipe Creator
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
			<TopRecipeSection
				recipe={topRecipe}
				onViewAllRecipes={onViewAllRecipes}
				onRecipeClick={onRecipeClick}
			/>

			{/* Recipe Performance */}
			<RecipePerformanceSection
				recipes={recipePerformance}
				onImproveRecipe={onImproveRecipe}
				onRecipeClick={onRecipeClick}
			/>

			{/* Recent Cooks */}
			<RecentCooksSection cooks={recentCooks} onViewAll={onViewAllCooks} />

			{/* Create CTA */}
			<CreateCTA onCreateRecipe={onCreateRecipe} />
		</div>
	)
}

export default CreatorDashboard
