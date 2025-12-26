'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
	Clock,
	ChefHat,
	Star,
	Play,
	Bookmark,
	TrendingUp,
	Users,
	RefreshCw,
	History,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
	CARD_FEED_HOVER,
	CARD_GRID_HOVER,
	CARD_FEATURED_HOVER,
	CARD_HOVER,
	IMAGE_ZOOM_HOVER,
	IMAGE_ZOOM_LARGE_HOVER,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

import type { Difficulty } from '@/lib/types/gamification'
import { resolveBadgesWithFallback } from '@/lib/data/badgeRegistry'

interface RecipeAuthor {
	id: string
	name: string
	avatarUrl: string
	title?: string
	isVerified?: boolean
}

interface RecipeCardBase {
	id: string
	title: string
	description?: string
	imageUrl: string
	author?: RecipeAuthor // Optional - hide if data is unavailable
	cookTimeMinutes: number
	difficulty: Difficulty
	xpReward: number
	cookCount: number
	rating: number
	// Gamification fields
	skillTags?: string[] // Skills you'll learn (e.g., "Knife Skills", "Sauté")
	badges?: string[] // Badges you can earn (e.g., "First Pasta", "Spice Master")
}

interface RecipeCardMastery {
	personalCookCount: number
	masteryLevel: 'novice' | 'apprentice' | 'expert' | 'master'
	masteryPercent: number
	cooksToNextMilestone: number
	totalXpEarned: number
	nextCookXp: number
	nextCookPercent: number
}

interface FeedCardProps extends RecipeCardBase {
	variant: 'feed'
	onCookNow?: () => void
}

interface GridCardProps extends RecipeCardBase {
	variant: 'grid'
	onCook?: () => void
	onSave?: () => void
	isSaved?: boolean
}

interface FeaturedCardProps extends RecipeCardBase {
	variant: 'featured'
	isTrending?: boolean
	onCook?: () => void
}

interface CookedCardProps extends RecipeCardBase {
	variant: 'cooked'
	mastery: RecipeCardMastery
	onCookAgain?: () => void
	onViewHistory?: () => void
}

interface MiniCardProps extends RecipeCardBase {
	variant: 'mini'
	onCook?: () => void
}

type RecipeCardEnhancedProps =
	| FeedCardProps
	| GridCardProps
	| FeaturedCardProps
	| CookedCardProps
	| MiniCardProps

// ============================================
// HELPER COMPONENTS
// ============================================

// XP Badge
const XPBadge = ({
	xp,
	size = 'default',
}: {
	xp: number
	size?: 'default' | 'large'
}) => (
	<div
		className={cn(
			'absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-gradient-to-br from-success to-success/80 font-bold text-white shadow-lg shadow-success/40',
			size === 'large' ? 'px-4 py-2.5 text-base' : 'px-3 py-1.5 text-sm',
		)}
	>
		<span className={size === 'large' ? 'text-lg' : 'text-sm'}>⚡</span>
		<span>{xp} XP</span>
	</div>
)

// Difficulty colors (using backend Title Case keys)
const difficultyConfig: Record<
	Difficulty,
	{ color: string; bgColor: string; filledDots: number; label: string }
> = {
	Beginner: {
		color: 'text-success',
		bgColor: 'bg-success',
		filledDots: 1,
		label: 'Easy',
	},
	Intermediate: {
		color: 'text-amber-500',
		bgColor: 'bg-amber-500',
		filledDots: 2,
		label: 'Medium',
	},
	Advanced: {
		color: 'text-error',
		bgColor: 'bg-error',
		filledDots: 3,
		label: 'Hard',
	},
	Expert: {
		color: 'text-xp',
		bgColor: 'bg-xp',
		filledDots: 4,
		label: 'Expert',
	},
}

// Difficulty indicator with dots
const DifficultyIndicator = ({
	difficulty,
	showLabel = true,
}: {
	difficulty: Difficulty
	showLabel?: boolean
}) => {
	const config = difficultyConfig[difficulty] ?? difficultyConfig.Beginner

	return (
		<div className='absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm'>
			<div className='flex gap-0.5'>
				{[1, 2, 3, 4].map(dot => (
					<span
						key={dot}
						className={cn(
							'h-2 w-2 rounded-full',
							dot <= config.filledDots ? config.bgColor : 'bg-white/30',
						)}
					/>
				))}
			</div>
			{showLabel && (
				<span className='capitalize'>{difficulty || 'Beginner'}</span>
			)}
		</div>
	)
}

// Difficulty ribbon (for grid card)
const DifficultyRibbon = ({ difficulty }: { difficulty: Difficulty }) => {
	const config = difficultyConfig[difficulty] ?? difficultyConfig.Beginner

	return (
		<div
			className={cn(
				'absolute -right-8 top-3 rotate-45 px-10 py-1.5 text-2xs font-bold uppercase tracking-wide text-white',
				config.bgColor,
			)}
		>
			{difficulty || 'Beginner'}
		</div>
	)
}

// Cook count badge
const CookCountBadge = ({
	count,
	position = 'bottom-right',
}: {
	count: number
	position?: 'bottom-right' | 'bottom-left'
}) => {
	const formatted =
		count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString()

	return (
		<div
			className={cn(
				'absolute flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm',
				position === 'bottom-right' ? 'bottom-3 right-3' : 'bottom-3 left-3',
			)}
		>
			<Users className='h-3.5 w-3.5' />
			<span>{formatted}</span>
		</div>
	)
}

// Mastery badge
const MasteryBadge = ({
	level,
}: {
	level: 'novice' | 'apprentice' | 'expert' | 'master'
}) => {
	const config = {
		novice: { emoji: '🥉', gradient: 'from-slate-500 to-slate-600' },
		apprentice: { emoji: '🥈', gradient: 'from-blue-500 to-blue-600' },
		expert: { emoji: '🥇', gradient: 'from-gold to-level' },
		master: { emoji: '👑', gradient: 'from-xp to-bonus' },
	}

	return (
		<div
			className={cn(
				'absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-gradient-to-br px-3 py-2 text-xs font-bold text-white shadow-lg',
				`${config[level].gradient}`,
			)}
		>
			<span className='text-base'>{config[level].emoji}</span>
			<span className='capitalize'>{level}</span>
		</div>
	)
}

// Skill tags row - shows skills you'll learn
const SkillTagsRow = ({
	skills,
	maxVisible = 2,
	size = 'default',
}: {
	skills?: string[]
	maxVisible?: number
	size?: 'default' | 'small'
}) => {
	if (!skills || skills.length === 0) return null

	const visibleSkills = skills.slice(0, maxVisible)
	const remaining = skills.length - maxVisible

	return (
		<div className='flex flex-wrap items-center gap-1.5'>
			{visibleSkills.map(skill => (
				<span
					key={skill}
					className={cn(
						'rounded-full bg-info/15 font-medium text-info',
						size === 'small' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
					)}
				>
					{skill}
				</span>
			))}
			{remaining > 0 && (
				<span
					className={cn(
						'rounded-full bg-border font-medium text-text-muted',
						size === 'small' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
					)}
				>
					+{remaining} more
				</span>
			)}
		</div>
	)
}

// Rarity-based badge styling (matches design system)
const RARITY_STYLES: Record<string, string> = {
	COMMON: 'bg-border/50 text-text-secondary',
	UNCOMMON: 'bg-success/15 text-success',
	RARE: 'bg-info/15 text-info',
	EPIC: 'bg-purple-500/15 text-purple-500',
	LEGENDARY: 'bg-gold/20 text-gold',
}

// Badge preview - shows badges you can unlock (uses proper badge registry)
const BadgePreview = ({
	badges,
	maxVisible = 2,
}: {
	badges?: string[]
	maxVisible?: number
}) => {
	if (!badges || badges.length === 0) return null

	// Resolve badge names to full badge objects with metadata
	const resolvedBadges = resolveBadgesWithFallback(badges)
	const visibleBadges = resolvedBadges.slice(0, maxVisible)
	const remaining = resolvedBadges.length - maxVisible

	return (
		<div className='flex items-center gap-1'>
			<span className='text-2xs'>🏆</span>
			<div className='flex items-center gap-1'>
				{visibleBadges.map(badge => (
					<span
						key={badge.id}
						className={cn(
							'flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium',
							RARITY_STYLES[badge.rarity] || RARITY_STYLES.COMMON,
						)}
						title={`${badge.name} (${badge.rarity})`}
					>
						<span>{badge.icon}</span>
						<span className='max-w-16 truncate'>{badge.name}</span>
					</span>
				))}
				{remaining > 0 && (
					<span className='rounded-full bg-border px-1.5 py-0.5 text-2xs font-medium text-text-muted'>
						+{remaining}
					</span>
				)}
			</div>
		</div>
	)
}

// ============================================
// VARIANT: FEED CARD
// ============================================

const FeedCard = ({
	id,
	title,
	imageUrl,
	author,
	cookTimeMinutes,
	difficulty,
	xpReward,
	cookCount,
	rating,
	skillTags,
	badges,
	onCookNow,
}: FeedCardProps) => (
	<motion.article
		whileHover={CARD_FEED_HOVER}
		transition={TRANSITION_SPRING}
		className='relative overflow-hidden rounded-2xl bg-panel-bg shadow-md hover:shadow-xl'
	>
		<Link href={`/recipes/${id}`} className='block'>
			{/* Image - using Next.js Image wrapped in motion.div for optimization */}
			<motion.div
				className='relative aspect-video overflow-hidden'
				whileHover={IMAGE_ZOOM_HOVER}
				transition={TRANSITION_SPRING}
			>
				<Image
					src={imageUrl}
					alt={title}
					fill
					className='object-cover'
					sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
				/>
				<XPBadge xp={xpReward} />
				<DifficultyIndicator difficulty={difficulty} />
			</motion.div>

			{/* Content */}
			<div className='p-4'>
				<h3 className='mb-2 text-lg font-bold'>{title}</h3>

				{/* Skills you'll learn */}
				{skillTags && skillTags.length > 0 && (
					<div className='mb-2'>
						<SkillTagsRow skills={skillTags} maxVisible={3} size='small' />
					</div>
				)}

				<div className='mb-3 flex items-center gap-2.5 text-sm text-text-muted'>
					{author && (
						<>
							<span className='flex items-center gap-1.5'>
								<Image
									src={author.avatarUrl}
									alt={author.name}
									width={24}
									height={24}
									className='h-6 w-6 rounded-full'
								/>
								{author.name}
							</span>
							<span className='text-border'>•</span>
						</>
					)}
					<span className='flex items-center gap-1'>
						<Clock className='h-3.5 w-3.5' />
						{cookTimeMinutes} min
					</span>
				</div>

				<div className='flex items-center justify-between gap-4'>
					<div className='flex gap-4'>
						<span className='flex items-center gap-1.5 text-sm text-success'>
							<ChefHat className='h-4 w-4' />
							{cookCount >= 1000
								? `${(cookCount / 1000).toFixed(1)}k`
								: cookCount}{' '}
							cooked
						</span>
						{rating > 0 && (
							<span className='flex items-center gap-1.5 text-sm text-amber-500'>
								<Star className='h-4 w-4' />
								{rating.toFixed(1)}
							</span>
						)}
					</div>
					{/* Badges you can unlock */}
					{badges && badges.length > 0 && (
						<BadgePreview badges={badges} maxVisible={1} />
					)}
				</div>
			</div>
		</Link>

		{/* Cook now button */}
		<motion.button
			onClick={onCookNow}
			whileHover={BUTTON_HOVER}
			whileTap={BUTTON_TAP}
			className='absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white'
		>
			<Play className='h-4 w-4' />
			Cook Now
		</motion.button>
	</motion.article>
)

// ============================================
// VARIANT: GRID CARD
// ============================================

const GridCard = ({
	id,
	title,
	description,
	imageUrl,
	author,
	cookTimeMinutes,
	difficulty,
	xpReward,
	cookCount,
	rating,
	skillTags,
	badges,
	onCook,
	onSave,
	isSaved,
}: GridCardProps) => (
	<motion.article
		whileHover={CARD_GRID_HOVER}
		transition={TRANSITION_SPRING}
		className='overflow-hidden rounded-2xl bg-panel-bg shadow-md hover:shadow-xl'
	>
		<Link href={`/recipes/${id}`} className='block'>
			{/* Image - using Next.js Image wrapped in motion.div for optimization */}
			<motion.div
				className='relative aspect-[4/3] overflow-hidden'
				whileHover={IMAGE_ZOOM_LARGE_HOVER}
				transition={TRANSITION_SPRING}
			>
				<Image
					src={imageUrl}
					alt={title}
					fill
					className='object-cover'
					sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
				/>
				<XPBadge xp={xpReward} />
				{/* Difficulty indicator - subtle pill instead of ribbon per design feedback */}
				<DifficultyIndicator difficulty={difficulty} showLabel />
			</motion.div>

			{/* Content */}
			<div className='p-4'>
				<h3 className='mb-1.5 text-base font-bold'>{title}</h3>
				{description && (
					<p className='mb-2 line-clamp-2 text-sm leading-relaxed text-text-muted'>
						{description}
					</p>
				)}

				{/* Skills & Badges - compact row to reduce vertical space */}
				{(skillTags?.length || badges?.length) && (
					<div className='mb-2 flex flex-wrap items-center gap-x-3 gap-y-1'>
						{skillTags && skillTags.length > 0 && (
							<SkillTagsRow skills={skillTags} maxVisible={2} size='small' />
						)}
						{badges && badges.length > 0 && (
							<BadgePreview badges={badges} maxVisible={1} />
						)}
					</div>
				)}

				{/* Stats row with cook count */}
				<div className='mb-3 flex items-center justify-between text-sm text-text-muted'>
					<div className='flex items-center gap-3'>
						<span className='flex items-center gap-1'>
							<Clock className='h-3.5 w-3.5' />
							{cookTimeMinutes} min
						</span>
						{cookCount > 0 && (
							<span className='flex items-center gap-1 text-success'>
								<ChefHat className='h-3.5 w-3.5' />
								{cookCount >= 1000
									? `${(cookCount / 1000).toFixed(1)}k`
									: cookCount}
							</span>
						)}
					</div>
					{/* Only show rating if it exists and > 0 */}
					{rating > 0 && (
						<span className='flex items-center gap-1 text-amber-500'>
							⭐ {rating.toFixed(1)}
						</span>
					)}
				</div>

				{/* Author - only show if valid author data exists */}
				{author && (
					<div className='mb-4 flex items-center gap-2 text-sm'>
						<Image
							src={author.avatarUrl}
							alt={author.name}
							width={28}
							height={28}
							className='h-7 w-7 rounded-full'
						/>
						<span>{author.name}</span>
						{author.isVerified && (
							<span className='rounded-full bg-success px-1.5 py-0.5 text-2xs text-white'>
								✓
							</span>
						)}
					</div>
				)}
			</div>
		</Link>

		{/* Actions - more subtle, card is already clickable */}
		<div className='flex gap-2 px-4 pb-4'>
			<motion.button
				onClick={e => {
					e.preventDefault()
					e.stopPropagation()
					onCook?.()
				}}
				whileHover={BUTTON_HOVER}
				whileTap={BUTTON_TAP}
				className='flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white'
			>
				<Play className='h-4 w-4' />
				Start Cooking
			</motion.button>
			<motion.button
				onClick={e => {
					e.preventDefault()
					e.stopPropagation()
					onSave?.()
				}}
				whileHover={BUTTON_SUBTLE_HOVER}
				whileTap={BUTTON_SUBTLE_TAP}
				transition={TRANSITION_SPRING}
				className={cn(
					'flex h-10 w-10 items-center justify-center rounded-lg border',
					isSaved
						? 'border-brand bg-brand/10 text-brand'
						: 'border-border bg-bg-elevated text-text-muted hover:border-brand hover:bg-brand/10 hover:text-brand',
				)}
			>
				<Bookmark className={cn('h-5 w-5', isSaved && 'fill-current')} />
			</motion.button>
		</div>
	</motion.article>
)

// ============================================
// VARIANT: FEATURED CARD
// ============================================

const FeaturedCard = ({
	id,
	title,
	description,
	imageUrl,
	author,
	cookTimeMinutes,
	difficulty,
	xpReward,
	cookCount,
	rating,
	skillTags,
	badges,
	isTrending,
	onCook,
}: FeaturedCardProps) => (
	<motion.article
		whileHover={CARD_FEATURED_HOVER}
		transition={TRANSITION_SPRING}
		className='overflow-hidden rounded-3xl shadow-2xl'
	>
		<Link href={`/recipes/${id}`} className='block'>
			<div className='relative aspect-video min-h-panel-md'>
				<Image src={imageUrl} alt={title} fill className='object-cover' />
				{/* Gradient overlay */}
				<div className='absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent' />

				{/* Trending badge */}
				{isTrending && (
					<div className='absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-gradient-to-br from-error to-error/80 px-4 py-2.5 text-sm font-bold text-white'>
						<TrendingUp className='h-4 w-4' />
						Trending
					</div>
				)}

				{/* XP + Difficulty badges */}
				<div className='absolute right-5 top-5 flex flex-col items-end gap-2.5'>
					<div className='flex items-center gap-1.5 rounded-full bg-gradient-to-br from-success to-success/80 px-4 py-2.5 text-base font-bold text-white shadow-lg shadow-success/40'>
						<span className='text-lg'>⚡</span>
						<span>{xpReward} XP</span>
					</div>
					<div
						className={cn(
							'rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white',
							(difficultyConfig[difficulty] ?? difficultyConfig.Beginner)
								.bgColor,
						)}
					>
						{difficulty || 'Beginner'} Challenge
					</div>
				</div>

				{/* Content overlay */}
				<div className='absolute inset-x-0 bottom-0 z-10 p-6 md:p-8'>
					<h3 className='mb-3 text-2xl font-extrabold text-white drop-shadow-md md:text-3xl'>
						{title}
					</h3>
					{description && (
						<p className='mb-4 max-w-lg text-sm text-white/80 md:text-base'>
							{description}
						</p>
					)}

					{/* Skills you'll learn */}
					{skillTags && skillTags.length > 0 && (
						<div className='mb-4 flex flex-wrap gap-2'>
							{skillTags.slice(0, 4).map(skill => (
								<span
									key={skill}
									className='rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'
								>
									{skill}
								</span>
							))}
						</div>
					)}

					{/* Badges you can unlock */}
					{badges && badges.length > 0 && (
						<div className='mb-4 flex items-center gap-2'>
							<span className='text-sm'>🏆</span>
							<div className='flex gap-1.5'>
								{badges.slice(0, 2).map(badge => (
									<span
										key={badge}
										className='rounded-full bg-gold/30 px-2.5 py-1 text-xs font-medium text-gold backdrop-blur-sm'
									>
										{badge}
									</span>
								))}
								{badges.length > 2 && (
									<span className='rounded-full bg-white/20 px-2 py-1 text-xs font-medium text-white/70'>
										+{badges.length - 2}
									</span>
								)}
							</div>
						</div>
					)}

					{/* Stats */}
					<div className='mb-5 flex flex-wrap gap-4 md:gap-6'>
						<span className='flex items-center gap-1.5 text-sm text-white/90'>
							<ChefHat className='h-4 w-4' />
							{cookCount >= 1000
								? `${(cookCount / 1000).toFixed(1)}k`
								: cookCount}{' '}
							cooked
						</span>
						{rating > 0 && (
							<span className='flex items-center gap-1.5 text-sm text-white/90'>
								<Star className='h-4 w-4' />
								{rating.toFixed(1)}
							</span>
						)}
						<span className='flex items-center gap-1.5 text-sm text-white/90'>
							<Clock className='h-4 w-4' />
							{cookTimeMinutes >= 60
								? `${Math.floor(cookTimeMinutes / 60)}h ${cookTimeMinutes % 60}min`
								: `${cookTimeMinutes} min`}
						</span>
					</div>

					{/* Author - only show if valid author data */}
					{author && (
						<div className='mb-6 flex items-center gap-3.5'>
							<Image
								src={author.avatarUrl}
								alt={author.name}
								width={48}
								height={48}
								className='h-12 w-12 rounded-full border-2 border-white/30'
							/>
							<div className='flex flex-col'>
								<span className='font-bold text-white'>{author.name}</span>
								{author.title && (
									<span className='text-sm text-white/70'>{author.title}</span>
								)}
							</div>
						</div>
					)}

					{/* CTA */}
					<motion.button
						onClick={e => {
							e.preventDefault()
							onCook?.()
						}}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						transition={TRANSITION_SPRING}
						className='inline-flex items-center gap-2.5 rounded-2xl bg-brand px-6 py-4 text-base font-bold text-white shadow-xl shadow-brand/40 md:px-8 md:text-lg'
					>
						<Play className='h-5 w-5 md:h-6 md:w-6' />
						Start Cooking
						<span className='rounded-full bg-white/20 px-3 py-1 text-sm font-semibold max-md:hidden'>
							Earn {xpReward} XP
						</span>
					</motion.button>
				</div>
			</div>
		</Link>
	</motion.article>
)

// ============================================
// VARIANT: COOKED CARD (With Mastery)
// ============================================

const CookedCard = ({
	id,
	title,
	imageUrl,
	mastery,
	onCookAgain,
	onViewHistory,
}: CookedCardProps) => (
	<motion.article
		whileHover={CARD_FEATURED_HOVER}
		transition={TRANSITION_SPRING}
		className='overflow-hidden rounded-2xl border-2 border-xp/30 bg-panel-bg shadow-md hover:border-xp/50 hover:shadow-xp/15'
	>
		<Link href={`/recipes/${id}`} className='block'>
			{/* Image */}
			<div className='relative aspect-video overflow-hidden'>
				<Image src={imageUrl} alt={title} fill className='object-cover' />
				<MasteryBadge level={mastery.masteryLevel} />
				<div className='absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm'>
					{mastery.personalCookCount}× cooked
				</div>
			</div>

			{/* Content */}
			<div className='p-4'>
				<h3 className='mb-4 text-lg font-bold'>{title}</h3>

				{/* Mastery progress */}
				<div className='mb-4'>
					<div className='mb-2 flex items-center justify-between text-xs'>
						<span className='font-semibold text-xp'>Mastery</span>
						<span className='text-text-muted'>
							{mastery.cooksToNextMilestone} more to next milestone
						</span>
					</div>
					<div className='relative mb-2 h-2 overflow-hidden rounded-full bg-border'>
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${mastery.masteryPercent}%` }}
							transition={{ duration: 0.5 }}
							className='h-full rounded-full bg-gradient-xp'
						/>
					</div>
					<div className='flex justify-between text-xs'>
						{[1, 3, 7, 25].map(milestone => (
							<span
								key={milestone}
								className={cn(
									'rounded-full px-2 py-0.5',
									mastery.personalCookCount >= milestone
										? 'bg-xp/20 text-xp'
										: mastery.personalCookCount === milestone - 1
											? 'bg-xp text-white'
											: 'bg-border text-text-muted',
								)}
							>
								{milestone}
							</span>
						))}
					</div>
				</div>

				{/* XP summary */}
				<div className='mb-4 flex items-center justify-between rounded-lg bg-success/10 px-3 py-2.5 text-sm'>
					<span className='font-bold text-success'>
						+{mastery.totalXpEarned} XP earned
					</span>
					<span className='text-text-muted'>
						Next cook: +{mastery.nextCookXp} XP ({mastery.nextCookPercent}%)
					</span>
				</div>
			</div>
		</Link>

		{/* Actions */}
		<div className='flex gap-2 px-4 pb-4'>
			<motion.button
				onClick={onCookAgain}
				whileHover={BUTTON_HOVER}
				whileTap={BUTTON_TAP}
				className='flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-xp py-3 text-sm font-semibold text-white'
			>
				<RefreshCw className='h-4 w-4' />
				Cook Again
			</motion.button>
			<motion.button
				onClick={onViewHistory}
				whileHover={BUTTON_SUBTLE_HOVER}
				whileTap={BUTTON_SUBTLE_TAP}
				transition={TRANSITION_SPRING}
				className='flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted hover:border-xp/30 hover:bg-xp/10 hover:text-xp'
			>
				<History className='h-5 w-5' />
			</motion.button>
		</div>
	</motion.article>
)

// ============================================
// VARIANT: MINI CARD (Horizontal)
// ============================================

const MiniCard = ({
	id,
	title,
	imageUrl,
	xpReward,
	cookTimeMinutes,
	difficulty,
	onCook,
}: MiniCardProps) => (
	<motion.article
		whileHover={CARD_HOVER}
		transition={TRANSITION_SPRING}
		className='flex items-center gap-3.5 rounded-xl border border-border bg-panel-bg p-3 hover:border-brand'
	>
		<Link href={`/recipes/${id}`} className='flex flex-1 items-center gap-3.5'>
			<Image
				src={imageUrl}
				alt={title}
				width={56}
				height={56}
				className='h-14 w-14 flex-shrink-0 rounded-lg object-cover'
			/>
			<div className='min-w-0 flex-1'>
				<h4 className='mb-1 truncate text-sm font-semibold'>{title}</h4>
				<div className='flex items-center gap-2.5 text-xs'>
					<span className='font-semibold text-success'>⚡ {xpReward} XP</span>
					<span className='text-text-muted'>{cookTimeMinutes} min</span>
					<span
						className={cn(
							'rounded-lg px-2 py-0.5 font-semibold',
							difficulty === 'Beginner' && 'bg-success/10 text-success',
							difficulty === 'Intermediate' && 'bg-amber-500/10 text-amber-500',
							difficulty === 'Advanced' && 'bg-error/10 text-error',
							difficulty === 'Expert' && 'bg-xp/10 text-xp',
						)}
					>
						{(difficultyConfig[difficulty] ?? difficultyConfig.Beginner).label}
					</span>
				</div>
			</div>
		</Link>
		<motion.button
			onClick={onCook}
			whileHover={ICON_BUTTON_HOVER}
			whileTap={ICON_BUTTON_TAP}
			transition={TRANSITION_SPRING}
			className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-white'
		>
			<Play className='h-4 w-4' />
		</motion.button>
	</motion.article>
)

// ============================================
// MAIN EXPORT
// ============================================

export const RecipeCardEnhanced = (props: RecipeCardEnhancedProps) => {
	switch (props.variant) {
		case 'feed':
			return <FeedCard {...props} />
		case 'grid':
			return <GridCard {...props} />
		case 'featured':
			return <FeaturedCard {...props} />
		case 'cooked':
			return <CookedCard {...props} />
		case 'mini':
			return <MiniCard {...props} />
		default:
			return null
	}
}

// Export individual variants for direct use
export { FeedCard, GridCard, FeaturedCard, CookedCard, MiniCard }
