'use client'

import { useTranslations } from 'next-intl'

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
import { formatVerboseTimeRemaining } from '@/lib/challenge-time'
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
// SHARED COMPONENTS
// ============================================

const GlowBar = ({ isComplete = false }: { isComplete?: boolean }) => (
	<motion.div
		className={cn(
			'absolute left-0 right-0 top-0 h-0.5',
			isComplete
				? 'bg-gradient-to-r from-success via-success to-success'
				: 'bg-gradient-party',
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
					? 'bg-gradient-to-br from-success to-success'
					: 'bg-gradient-xp',
				size === 'large'
					? 'size-16 rounded-2xl'
					: 'size-thumbnail-sm rounded-radius',
			)}
		>
			<span className={size === 'large' ? 'text-4xl' : 'text-icon-lg'}>
				{icon}
			</span>
		</div>
		{!isComplete && (
			<div className='absolute -inset-1 rounded-xl border-2 border-xp/30' />
		)}
		{isComplete && (
			<div className='absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full border-4 border-bg-card bg-success text-sm text-white'>
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
	const t = useTranslations('challenge')
	const timeRemaining = formatVerboseTimeRemaining(challenge.endsAt, t)

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className='relative mb-5 overflow-hidden rounded-2xl bg-bg-card shadow-lg'
		>
			<GlowBar />

			<div className='p-5'>
				{/* Header */}
				<div className='mb-3 flex items-center gap-3.5'>
					<ChallengeIcon icon={challenge.icon} />
					<div className='flex-1'>
						<span className='text-xs font-bold uppercase tracking-wide text-accent-purple'>
							{t('dailyChallenge')}
						</span>
						<h3 className='text-xl font-display font-extrabold'>
							{challenge.title}
						</h3>
					</div>
				</div>

				{/* Description */}
				<p className='mb-4 text-sm leading-relaxed text-text-muted'>
					{challenge.description}
				</p>

				{/* Meta Row */}
				<div className='mb-4 flex gap-6'>
					<div className='flex items-center gap-1.5 rounded-full bg-gradient-to-r from-bonus/20 to-xp/20 px-3.5 py-2 shadow-card shadow-bonus/20'>
						<span>⚡</span>
						<span className='tabular-nums text-base font-display font-extrabold text-xp'>
							+{challenge.bonusXp || 0} XP
						</span>
						<span className='text-xs text-bonus'>bonus</span>
					</div>
					<div className='flex items-center gap-1.5 text-sm text-text-muted'>
						<Clock className='size-4' />
						<span className='font-semibold text-text'>{timeRemaining}</span>
						{timeRemaining !== t('expired') && <span>{t('remaining')}</span>}
					</div>
				</div>

				{/* Matching Recipes */}
				{challenge.matchingRecipes && challenge.matchingRecipes.length > 0 && (
					<div className='mb-1'>
						<span className='mb-2 block text-xs text-text-muted'>
							{t('tryThese')}
						</span>
						<div className='-mr-5 flex gap-2 overflow-x-auto scrollbar-hide pb-1 pr-5'>
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
										className='size-7 rounded-full object-cover'
									/>
									<span>{recipe.title}</span>
								</Link>
							))}
							<Link
								href='/recipes?challenge=today'
								className='flex flex-shrink-0 items-center rounded-full border border-accent-purple/30 bg-accent-purple/10 px-3.5 py-2 text-sm font-medium text-accent-purple transition-colors hover:bg-accent-purple/20'
							>
								{t('plusMore', { count: challenge.matchingRecipes.length - 2 })}
							</Link>
						</div>
					</div>
				)}
			</div>

			{/* CTA */}
			<div className='px-5 pb-5'>
				<motion.button
					type='button'
					onClick={onFindRecipe}
					whileHover={STAT_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					className='flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-xp py-3.5 text-base font-bold text-white shadow-lg shadow-xp/40 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
				>
					<ChefHat className='size-5' />
					{t('findRecipe')}
				</motion.button>
			</div>

			{/* Minimize Button */}
			<button
				type='button'
				onClick={onMinimize}
				aria-label={t('minimize')}
				className='absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:bg-border'
			>
				<ChevronUp className='size-4' />
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
}: CompletedChallengeProps) => {
	const t = useTranslations('challenge')
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className='relative mb-5 overflow-hidden rounded-2xl border-2 border-success/30 bg-gradient-to-r from-success/10 to-success/5 shadow-lg'
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
							{t('challengeComplete')}
						</span>
						<h3 className='text-xl font-display font-extrabold'>
							{challenge.title}
						</h3>
					</div>
				</div>

				{/* Completed With */}
				<div className='mb-3 flex items-center justify-between rounded-xl bg-bg-card p-3.5'>
					<div className='flex items-center gap-3'>
						<Image
							src={completedWith.recipeImageUrl}
							alt={completedWith.recipeTitle}
							width={48}
							height={48}
							className='size-12 rounded-lg object-cover'
						/>
						<div className='flex flex-col'>
							<span className='text-xs text-text-muted'>
								{t('completedWith')}
							</span>
							<span className='text-sm font-semibold'>
								{completedWith.recipeTitle}
							</span>
						</div>
					</div>
					<div className='text-right'>
						<span className='block tabular-nums text-xl font-display font-extrabold text-xp'>
							+{challenge.bonusXp} XP
						</span>
						<span className='text-xs text-text-muted'>{t('bonusEarned')}</span>
					</div>
				</div>

				{/* Streak Teaser */}
				{streakCount > 0 && (
					<div className='flex items-center justify-center gap-2 rounded-lg bg-streak/10 px-3 py-2.5'>
						<span className='text-lg'>🔥</span>
						<span className='text-sm font-semibold text-streak'>
							{t('streakDays', { n: streakCount })}
						</span>
					</div>
				)}
			</div>

			{/* View History */}
			<button
				type='button'
				onClick={onViewHistory}
				className='absolute right-4 top-4 flex items-center gap-1 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
			>
				{t('viewHistory')}
				<ChevronRight className='size-4' />
			</button>
		</motion.div>
	)
}

// ============================================
// VARIANT: COMPACT CHALLENGE
// ============================================

const CompactChallengeBanner = ({
	challenge,
	onExpand,
}: CompactChallengeProps) => {
	const t = useTranslations('challenge')
	const timeRemaining = formatVerboseTimeRemaining(challenge.endsAt, t)

	return (
		<motion.div
			initial={{ opacity: 0, y: -5 }}
			animate={{ opacity: 1, y: 0 }}
			className='mb-5 flex items-center justify-between rounded-2xl bg-bg-card p-3 shadow-card'
		>
			<div className='flex items-center gap-3'>
				<span className='text-2xl'>{challenge.icon}</span>
				<div className='flex flex-col'>
					<span className='text-sm font-semibold'>
						{t('dailyCompact', { title: challenge.title })}
					</span>
					<span className='text-xs font-semibold text-xp'>
						{t('xpBonus', { n: challenge.bonusXp })}
					</span>
				</div>
			</div>
			<div className='flex items-center gap-3'>
				<span className='text-sm font-medium text-text-muted'>
					{timeRemaining}
				</span>
				<button
					type='button'
					onClick={onExpand}
					aria-label={t('expand')}
					className='flex size-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-bg-elevated'
				>
					<ChevronDown className='size-4' />
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
	const t = useTranslations('challenge')
	const timeRemaining = formatVerboseTimeRemaining(challenge.endsAt, t)

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			className='relative mb-5 min-h-banner overflow-hidden rounded-2xl shadow-2xl'
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
				<div className='absolute left-4 top-4 z-10 rounded-full bg-gradient-gold px-3.5 py-2 text-xs font-bold text-white'>
					🌟 {challenge.eventLabel}
				</div>
			)}

			{/* Content */}
			<div className='relative z-10 flex h-full flex-col justify-end p-6 pt-16'>
				{/* Header */}
				<div className='mb-3 flex items-center gap-3.5'>
					<div className='flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-lg'>
						<span className='text-3xl'>{challenge.icon}</span>
					</div>
					<div>
						<span className='text-xs font-bold uppercase tracking-wide text-white/70'>
							{challenge.eventLabel ?? t('weekendChallenge')}
						</span>
						<h2 className='text-2xl font-display font-extrabold text-white'>
							{challenge.title}
						</h2>
					</div>
				</div>

				{/* Description */}
				<p className='mb-5 text-base text-white/80'>{challenge.description}</p>

				{/* Meta Row */}
				<div className='mb-5 flex gap-6'>
					<div className='flex items-center gap-1.5 rounded-full bg-gradient-to-r from-bonus/30 to-xp/30 px-4 py-2.5 shadow-card shadow-bonus/30'>
						<span>⚡</span>
						<span className='tabular-nums text-xl font-display font-extrabold text-xp drop-shadow-glow'>
							+{challenge.bonusXp || 0} XP
						</span>
						<span className='text-xs text-bonus'>bonus</span>
					</div>
					<div className='flex items-center gap-1.5 text-sm text-white/70'>
						<Calendar className='size-4' />
						<span className='font-semibold text-white'>{timeRemaining}</span>
						{timeRemaining !== t('expired') && <span>{t('remaining')}</span>}
					</div>
				</div>

				{/* Stats */}
				<div className='mb-5 flex gap-6'>
					<div className='flex flex-col'>
						<span className='tabular-nums text-lg font-bold text-white'>
							{challenge.participants >= 1000
								? `${(challenge.participants / 1000).toFixed(1)}k`
								: challenge.participants}
						</span>
						<span className='text-xs text-white/60'>
							{t('participantsLabel')}
						</span>
					</div>
					<div className='flex flex-col'>
						<span className='tabular-nums text-lg font-bold text-white'>
							{challenge.completedCount}
						</span>
						<span className='text-xs text-white/60'>{t('completedLabel')}</span>
					</div>
				</div>

				{/* CTA */}
				<motion.button
					type='button'
					onClick={onBrowseRecipes}
					whileHover={LIST_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					className='inline-flex w-fit items-center gap-2 rounded-xl bg-bg-card px-7 py-4 text-base font-bold text-accent-purple shadow-xl focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
				>
					<ChefHat className='size-5' />
					{t('browseRecipes', { category: challenge.title })}
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
