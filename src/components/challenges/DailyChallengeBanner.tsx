'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	ChefHat,
	Clock,
	Calendar,
	ChevronUp,
	ChevronDown,
	ChevronRight,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	STAT_ITEM_HOVER,
	LIST_ITEM_HOVER,
	LIST_ITEM_TAP,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

interface MatchingRecipe {
	id: string
	title: string
	imageUrl: string
}

interface ChallengeBase {
	id: string
	title: string
	description: string
	icon: string
	bonusXp: number
	endsAt: Date
	matchingRecipes?: MatchingRecipe[]
}

interface ActiveChallengeProps {
	variant: 'active'
	challenge: ChallengeBase
	onFindRecipe?: () => void
	onMinimize?: () => void
}

interface CompletedChallengeProps {
	variant: 'completed'
	challenge: ChallengeBase
	completedWith: {
		recipeId: string
		recipeTitle: string
		recipeImageUrl: string
	}
	streakCount: number
	onViewHistory?: () => void
}

interface CompactChallengeProps {
	variant: 'compact'
	challenge: ChallengeBase
	onExpand?: () => void
}

interface FeaturedChallengeProps {
	variant: 'featured'
	challenge: ChallengeBase & {
		backgroundImageUrl: string
		participants: number
		completedCount: number
		eventLabel?: string
	}
	onBrowseRecipes?: () => void
}

type DailyChallengeBannerProps =
	| ActiveChallengeProps
	| CompletedChallengeProps
	| CompactChallengeProps
	| FeaturedChallengeProps

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatTimeRemaining = (date: Date): string => {
	const now = new Date()
	const diffMs = date.getTime() - now.getTime()

	if (diffMs <= 0) return 'Expired'

	const hours = Math.floor(diffMs / 3600000)
	const mins = Math.floor((diffMs % 3600000) / 60000)

	if (hours >= 24) {
		const days = Math.floor(hours / 24)
		return `${days} day${days > 1 ? 's' : ''}`
	}

	return `${hours}h ${mins}m`
}

// ============================================
// SHARED COMPONENTS
// ============================================

const GlowBar = ({ isComplete = false }: { isComplete?: boolean }) => (
	<motion.div
		className={cn(
			'absolute left-0 right-0 top-0 h-0.5',
			isComplete
				? 'bg-gradient-to-r from-success via-emerald-500 to-success'
				: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
		)}
		style={{ backgroundSize: '200% 100%' }}
		animate={{ backgroundPosition: ['0% 0', '200% 0'] }}
		transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
	/>
)

const ChallengeIcon = ({
	icon,
	isComplete = false,
	size = 'default',
}: {
	icon: string
	isComplete?: boolean
	size?: 'default' | 'large'
}) => (
	<div className='relative'>
		<div
			className={cn(
				'flex items-center justify-center',
				isComplete
					? 'bg-gradient-to-br from-success to-emerald-500'
					: 'bg-gradient-to-br from-indigo-500 to-purple-500',
				size === 'large'
					? 'h-16 w-16 rounded-2xl'
					: 'size-thumbnail-sm rounded-radius',
			)}
		>
			<span className={size === 'large' ? 'text-4xl' : 'text-icon-lg'}>
				{icon}
			</span>
		</div>
		{!isComplete && (
			<motion.div
				className='absolute -inset-1 rounded-xl border-2 border-dashed border-indigo-500/40'
				animate={{ rotate: 360 }}
				transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
			/>
		)}
		{isComplete && (
			<div className='absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-panel-bg bg-success text-sm text-white'>
				✓
			</div>
		)}
	</div>
)

// ============================================
// VARIANT: ACTIVE CHALLENGE
// ============================================

const ActiveChallengeBanner = ({
	challenge,
	onFindRecipe,
	onMinimize,
}: ActiveChallengeProps) => {
	const timeRemaining = formatTimeRemaining(challenge.endsAt)

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className='relative mb-5 overflow-hidden rounded-2xl bg-panel-bg shadow-lg'
		>
			<GlowBar />

			<div className='p-5'>
				{/* Header */}
				<div className='mb-3 flex items-center gap-3.5'>
					<ChallengeIcon icon={challenge.icon} />
					<div className='flex-1'>
						<span className='text-xs font-bold uppercase tracking-wide text-indigo-500'>
							Daily Challenge
						</span>
						<h3 className='text-xl font-extrabold'>{challenge.title}</h3>
					</div>
				</div>

				{/* Description */}
				<p className='mb-4 text-sm leading-relaxed text-text-muted'>
					{challenge.description}
				</p>

				{/* Meta Row */}
				<div className='mb-4 flex gap-6'>
					<div className='flex items-center gap-1.5 rounded-full bg-success/10 px-3.5 py-2'>
						<span>⚡</span>
						<span className='text-base font-extrabold text-success'>
							+{challenge.bonusXp} XP
						</span>
						<span className='text-xs text-text-muted'>bonus</span>
					</div>
					<div className='flex items-center gap-1.5 text-sm text-text-muted'>
						<Clock className='h-4 w-4' />
						<span className='font-semibold text-text'>{timeRemaining}</span>
						<span>remaining</span>
					</div>
				</div>

				{/* Matching Recipes */}
				{challenge.matchingRecipes && challenge.matchingRecipes.length > 0 && (
					<div className='mb-1'>
						<span className='mb-2 block text-xs text-text-muted'>
							Try these:
						</span>
						<div className='-mr-5 flex gap-2 overflow-x-auto pb-1 pr-5'>
							{challenge.matchingRecipes.slice(0, 2).map(recipe => (
								<Link
									key={recipe.id}
									href={`/recipes/${recipe.id}`}
									className='flex flex-shrink-0 items-center gap-2 rounded-full border border-border bg-bg-elevated py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors hover:border-brand hover:bg-border'
								>
									<Image
										src={recipe.imageUrl}
										alt={recipe.title}
										width={28}
										height={28}
										className='h-7 w-7 rounded-full object-cover'
									/>
									<span>{recipe.title}</span>
								</Link>
							))}
							<Link
								href='/recipes?challenge=today'
								className='flex flex-shrink-0 items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-sm font-medium text-indigo-500 transition-colors hover:bg-indigo-500/20'
							>
								+{challenge.matchingRecipes.length - 2} more
							</Link>
						</div>
					</div>
				)}
			</div>

			{/* CTA */}
			<div className='px-5 pb-5'>
				<motion.button
					onClick={onFindRecipe}
					whileHover={STAT_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					className='flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/30'
				>
					<ChefHat className='h-5 w-5' />
					Find Recipe
				</motion.button>
			</div>

			{/* Minimize Button */}
			<button
				onClick={onMinimize}
				className='absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:bg-border'
			>
				<ChevronUp className='h-4 w-4' />
			</button>
		</motion.div>
	)
}

// ============================================
// VARIANT: COMPLETED CHALLENGE
// ============================================

const CompletedChallengeBanner = ({
	challenge,
	completedWith,
	streakCount,
	onViewHistory,
}: CompletedChallengeProps) => (
	<motion.div
		initial={{ opacity: 0, y: -10 }}
		animate={{ opacity: 1, y: 0 }}
		className='relative mb-5 overflow-hidden rounded-2xl border-2 border-success/30 bg-gradient-to-r from-success/10 to-emerald-500/5 shadow-lg'
	>
		<GlowBar isComplete />

		{/* Confetti */}
		<div className='pointer-events-none absolute inset-0 overflow-hidden'>
			{['🎉', '✨'].map((emoji, i) => (
				<motion.span
					key={i}
					className='absolute text-2xl'
					style={{ left: i === 0 ? '20%' : '80%' }}
					initial={{ y: -20, opacity: 0, rotate: 0 }}
					animate={{ y: 100, opacity: [0, 1, 0], rotate: 360 }}
					transition={{ duration: 2, delay: i * 0.3 }}
				>
					{emoji}
				</motion.span>
			))}
		</div>

		<div className='p-5'>
			{/* Header */}
			<div className='mb-4 flex items-center gap-3.5'>
				<ChallengeIcon icon='✅' isComplete />
				<div className='flex-1'>
					<span className='text-xs font-bold uppercase tracking-wide text-success'>
						Challenge Complete!
					</span>
					<h3 className='text-xl font-extrabold'>{challenge.title}</h3>
				</div>
			</div>

			{/* Completed With */}
			<div className='mb-3 flex items-center justify-between rounded-xl bg-panel-bg p-3.5'>
				<div className='flex items-center gap-3'>
					<Image
						src={completedWith.recipeImageUrl}
						alt={completedWith.recipeTitle}
						width={48}
						height={48}
						className='h-12 w-12 rounded-lg object-cover'
					/>
					<div className='flex flex-col'>
						<span className='text-xs text-text-muted'>Completed with</span>
						<span className='text-sm font-semibold'>
							{completedWith.recipeTitle}
						</span>
					</div>
				</div>
				<div className='text-right'>
					<span className='block text-xl font-extrabold text-success'>
						+{challenge.bonusXp} XP
					</span>
					<span className='text-xs text-text-muted'>bonus earned</span>
				</div>
			</div>

			{/* Streak Teaser */}
			{streakCount > 0 && (
				<div className='flex items-center justify-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2.5'>
					<span className='text-lg'>🔥</span>
					<span className='text-sm font-semibold text-orange-500'>
						{streakCount} day challenge streak!
					</span>
				</div>
			)}
		</div>

		{/* View History */}
		<button
			onClick={onViewHistory}
			className='absolute right-4 top-4 flex items-center gap-1 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
		>
			View History
			<ChevronRight className='h-4 w-4' />
		</button>
	</motion.div>
)

// ============================================
// VARIANT: COMPACT CHALLENGE
// ============================================

const CompactChallengeBanner = ({
	challenge,
	onExpand,
}: CompactChallengeProps) => {
	const timeRemaining = formatTimeRemaining(challenge.endsAt)

	return (
		<motion.div
			initial={{ opacity: 0, y: -5 }}
			animate={{ opacity: 1, y: 0 }}
			className='mb-5 flex items-center justify-between rounded-2xl bg-panel-bg p-3 shadow-md'
		>
			<div className='flex items-center gap-3'>
				<span className='text-2xl'>{challenge.icon}</span>
				<div className='flex flex-col'>
					<span className='text-sm font-semibold'>
						Daily: {challenge.title}
					</span>
					<span className='text-xs font-semibold text-success'>
						+{challenge.bonusXp} XP bonus
					</span>
				</div>
			</div>
			<div className='flex items-center gap-3'>
				<span className='text-sm font-medium text-text-muted'>
					{timeRemaining}
				</span>
				<button
					onClick={onExpand}
					className='flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-bg-elevated'
				>
					<ChevronDown className='h-4 w-4' />
				</button>
			</div>
		</motion.div>
	)
}

// ============================================
// VARIANT: FEATURED CHALLENGE
// ============================================

const FeaturedChallengeBanner = ({
	challenge,
	onBrowseRecipes,
}: FeaturedChallengeProps) => {
	const timeRemaining = formatTimeRemaining(challenge.endsAt)

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			className='relative mb-5 min-h-banner overflow-hidden rounded-3xl shadow-2xl'
		>
			{/* Background Image */}
			<div className='absolute inset-0'>
				<Image
					src={challenge.backgroundImageUrl}
					alt={challenge.title}
					className='h-full w-full object-cover'
				/>
				<div className='absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90' />
			</div>

			{/* Event Badge */}
			{challenge.eventLabel && (
				<div className='absolute left-4 top-4 z-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 px-3.5 py-2 text-xs font-bold text-white'>
					🌟 {challenge.eventLabel}
				</div>
			)}

			{/* Content */}
			<div className='relative z-10 flex h-full flex-col justify-end p-6 pt-16'>
				{/* Header */}
				<div className='mb-3 flex items-center gap-3.5'>
					<div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-lg'>
						<span className='text-3xl'>{challenge.icon}</span>
					</div>
					<div>
						<span className='text-xs font-bold uppercase tracking-wide text-white/70'>
							Weekend Challenge
						</span>
						<h2 className='text-2xl font-extrabold text-white'>
							{challenge.title}
						</h2>
					</div>
				</div>

				{/* Description */}
				<p className='mb-5 text-base text-white/80'>{challenge.description}</p>

				{/* Meta Row */}
				<div className='mb-5 flex gap-6'>
					<div className='flex items-center gap-1.5 rounded-full bg-success/20 px-4 py-2.5'>
						<span>⚡</span>
						<span className='text-xl font-extrabold text-success'>
							+{challenge.bonusXp} XP
						</span>
						<span className='text-xs text-white/70'>bonus</span>
					</div>
					<div className='flex items-center gap-1.5 text-sm text-white/70'>
						<Calendar className='h-4 w-4' />
						<span className='font-semibold text-white'>{timeRemaining}</span>
						<span>remaining</span>
					</div>
				</div>

				{/* Stats */}
				<div className='mb-5 flex gap-6'>
					<div className='flex flex-col'>
						<span className='text-lg font-bold text-white'>
							{challenge.participants >= 1000
								? `${(challenge.participants / 1000).toFixed(1)}k`
								: challenge.participants}
						</span>
						<span className='text-xs text-white/60'>participants</span>
					</div>
					<div className='flex flex-col'>
						<span className='text-lg font-bold text-white'>
							{challenge.completedCount}
						</span>
						<span className='text-xs text-white/60'>completed</span>
					</div>
				</div>

				{/* CTA */}
				<motion.button
					onClick={onBrowseRecipes}
					whileHover={LIST_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					className='inline-flex w-fit items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-bold text-indigo-500 shadow-xl'
				>
					<ChefHat className='h-5 w-5' />
					Browse Italian Recipes
				</motion.button>
			</div>
		</motion.div>
	)
}

// ============================================
// MAIN EXPORT
// ============================================

export const DailyChallengeBanner = (props: DailyChallengeBannerProps) => {
	switch (props.variant) {
		case 'active':
			return <ActiveChallengeBanner {...props} />
		case 'completed':
			return <CompletedChallengeBanner {...props} />
		case 'compact':
			return <CompactChallengeBanner {...props} />
		case 'featured':
			return <FeaturedChallengeBanner {...props} />
		default:
			return null
	}
}

// ============================================
// STATEFUL WRAPPER (Expandable Banner)
// ============================================

interface ExpandableBannerProps {
	challenge: ChallengeBase
	onFindRecipe?: () => void
}

export const ExpandableDailyChallengeBanner = ({
	challenge,
	onFindRecipe,
}: ExpandableBannerProps) => {
	const [isExpanded, setIsExpanded] = useState(true)

	return (
		<AnimatePresence mode='wait'>
			{isExpanded ? (
				<DailyChallengeBanner
					key='expanded'
					variant='active'
					challenge={challenge}
					onFindRecipe={onFindRecipe}
					onMinimize={() => setIsExpanded(false)}
				/>
			) : (
				<DailyChallengeBanner
					key='compact'
					variant='compact'
					challenge={challenge}
					onExpand={() => setIsExpanded(true)}
				/>
			)}
		</AnimatePresence>
	)
}

// Export individual variants
export {
	ActiveChallengeBanner,
	CompletedChallengeBanner,
	CompactChallengeBanner,
	FeaturedChallengeBanner,
}
