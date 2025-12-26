'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
	Trophy,
	ChevronLeft,
	Search,
	Filter,
	Sparkles,
	Lock,
	CheckCircle2,
	Star,
	Flame,
	ChefHat,
	Award,
	Utensils,
	Globe,
	Users,
	Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
	getAllBadges,
	getBadgesByCategory,
	resolveBadgesWithFallback,
} from '@/lib/data/badgeRegistry'
import type {
	Badge,
	BadgeCategory,
	BadgeRarity,
} from '@/lib/types/gamification'
import { TRANSITION_SPRING, CARD_HOVER } from '@/lib/motion'

// ============================================
// BADGE CATALOG PAGE
// ============================================
// Shows ALL badges in the system, highlighting which
// the user has earned vs which are still locked.

// Category display config
const CATEGORY_CONFIG: Record<
	BadgeCategory,
	{ label: string; icon: React.ReactNode; color: string }
> = {
	COOKING: {
		label: 'Cooking',
		icon: <ChefHat className='size-4' />,
		color: 'text-brand',
	},
	CUISINE: {
		label: 'Cuisine',
		icon: <Globe className='size-4' />,
		color: 'text-blue-500',
	},
	STREAK: {
		label: 'Streaks',
		icon: <Flame className='size-4' />,
		color: 'text-streak',
	},
	SPECIAL: {
		label: 'Special',
		icon: <Sparkles className='size-4' />,
		color: 'text-xp',
	},
	SOCIAL: {
		label: 'Social',
		icon: <Users className='size-4' />,
		color: 'text-success',
	},
	CHALLENGE: {
		label: 'Challenges',
		icon: <Target className='size-4' />,
		color: 'text-amber-500',
	},
	CREATOR: {
		label: 'Creator',
		icon: <Award className='size-4' />,
		color: 'text-pink-500',
	},
}

// Rarity display config
const RARITY_CONFIG: Record<
	BadgeRarity,
	{ label: string; bgClass: string; textClass: string; borderClass: string }
> = {
	COMMON: {
		label: 'Common',
		bgClass: 'bg-slate-100 dark:bg-slate-800',
		textClass: 'text-slate-600 dark:text-slate-400',
		borderClass: 'border-slate-300 dark:border-slate-600',
	},
	UNCOMMON: {
		label: 'Uncommon',
		bgClass: 'bg-green-50 dark:bg-green-900/20',
		textClass: 'text-green-600 dark:text-green-400',
		borderClass: 'border-green-300 dark:border-green-700',
	},
	RARE: {
		label: 'Rare',
		bgClass: 'bg-blue-50 dark:bg-blue-900/20',
		textClass: 'text-blue-600 dark:text-blue-400',
		borderClass: 'border-blue-300 dark:border-blue-700',
	},
	EPIC: {
		label: 'Epic',
		bgClass: 'bg-purple-50 dark:bg-purple-900/20',
		textClass: 'text-purple-600 dark:text-purple-400',
		borderClass: 'border-purple-300 dark:border-purple-700',
	},
	LEGENDARY: {
		label: 'Legendary',
		bgClass:
			'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
		textClass: 'text-amber-600 dark:text-amber-400',
		borderClass: 'border-amber-400 dark:border-amber-600',
	},
}

// Order for rarity filtering
const RARITY_ORDER: BadgeRarity[] = [
	'COMMON',
	'UNCOMMON',
	'RARE',
	'EPIC',
	'LEGENDARY',
]

// ============================================
// BADGE CARD COMPONENT
// ============================================

interface BadgeCardProps {
	badge: Badge
	isEarned: boolean
	earnedAt?: string
}

const BadgeCard = ({ badge, isEarned, earnedAt }: BadgeCardProps) => {
	const rarityConfig = RARITY_CONFIG[badge.rarity]
	const isHidden = badge.isHidden && !isEarned

	return (
		<motion.div
			whileHover={CARD_HOVER}
			transition={TRANSITION_SPRING}
			className={cn(
				'group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-300',
				isEarned
					? `${rarityConfig.bgClass} ${rarityConfig.borderClass} shadow-md`
					: 'border-border-subtle bg-bg-elevated/50 opacity-60 hover:opacity-80',
				isHidden && 'cursor-help',
			)}
		>
			{/* Earned checkmark */}
			{isEarned && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					className='absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-success text-white shadow-md'
				>
					<CheckCircle2 className='size-4' />
				</motion.div>
			)}

			{/* Hidden badge mystery */}
			{isHidden ? (
				<>
					<div className='grid size-14 place-items-center rounded-xl bg-bg-hover'>
						<Lock className='size-6 text-text-muted' />
					</div>
					<div className='text-center'>
						<p className='text-sm font-semibold text-text-muted'>
							Hidden Badge
						</p>
						<p className='mt-1 text-xs text-text-muted/70'>
							Discover how to unlock!
						</p>
					</div>
				</>
			) : (
				<>
					{/* Badge Icon */}
					<div
						className={cn(
							'grid size-14 place-items-center rounded-xl text-3xl transition-transform duration-300 group-hover:scale-110',
							isEarned ? 'bg-white/80 shadow-sm' : 'bg-bg-hover',
						)}
					>
						{badge.icon}
					</div>

					{/* Badge Info */}
					<div className='text-center'>
						<p
							className={cn(
								'text-sm font-bold',
								isEarned ? 'text-text' : 'text-text-muted',
							)}
						>
							{badge.name}
						</p>
						<p
							className={cn(
								'mt-1 line-clamp-2 text-xs',
								isEarned ? 'text-text-secondary' : 'text-text-muted/70',
							)}
						>
							{badge.description}
						</p>
					</div>

					{/* Rarity Tag */}
					<span
						className={cn(
							'rounded-full px-2.5 py-0.5 text-2xs font-semibold',
							rarityConfig.bgClass,
							rarityConfig.textClass,
						)}
					>
						{rarityConfig.label}
					</span>

					{/* Unlock criteria (for locked badges) */}
					{!isEarned && badge.unlockCriteria && (
						<p className='mt-1 text-center text-2xs text-text-muted'>
							{badge.unlockCriteria}
						</p>
					)}

					{/* Earned date (for earned badges) */}
					{isEarned && earnedAt && (
						<p className='text-2xs text-text-muted'>
							Earned{' '}
							{new Date(earnedAt).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
							})}
						</p>
					)}
				</>
			)}
		</motion.div>
	)
}

// ============================================
// MAIN PAGE
// ============================================

export default function BadgeCatalogPage() {
	const { user } = useAuth()
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<
		BadgeCategory | 'ALL'
	>('ALL')
	const [selectedRarity, setSelectedRarity] = useState<BadgeRarity | 'ALL'>(
		'ALL',
	)
	const [showEarnedOnly, setShowEarnedOnly] = useState(false)

	// Get all badges from registry
	const allBadges = useMemo(() => getAllBadges(), [])

	// Get user's earned badges from their statistics
	const earnedBadgeIds = useMemo(() => {
		return new Set(user?.statistics?.badges ?? [])
	}, [user?.statistics?.badges])

	// Resolve earned badges with timestamps (if available)
	const earnedBadges = useMemo(() => {
		const ids = user?.statistics?.badges ?? []
		return resolveBadgesWithFallback(ids)
	}, [user?.statistics?.badges])

	// Filter and sort badges
	const filteredBadges = useMemo(() => {
		let badges = allBadges

		// Category filter
		if (selectedCategory !== 'ALL') {
			badges = badges.filter(b => b.category === selectedCategory)
		}

		// Rarity filter
		if (selectedRarity !== 'ALL') {
			badges = badges.filter(b => b.rarity === selectedRarity)
		}

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			badges = badges.filter(
				b =>
					b.name.toLowerCase().includes(query) ||
					b.description.toLowerCase().includes(query) ||
					(b.unlockCriteria && b.unlockCriteria.toLowerCase().includes(query)),
			)
		}

		// Earned only filter
		if (showEarnedOnly) {
			badges = badges.filter(
				b => earnedBadgeIds.has(b.id) || earnedBadgeIds.has(b.name),
			)
		}

		// Sort: earned first, then by rarity (legendary → common), then alphabetically
		return badges.sort((a, b) => {
			const aEarned = earnedBadgeIds.has(a.id) || earnedBadgeIds.has(a.name)
			const bEarned = earnedBadgeIds.has(b.id) || earnedBadgeIds.has(b.name)

			if (aEarned !== bEarned) return bEarned ? 1 : -1

			const aRarityIdx = RARITY_ORDER.indexOf(a.rarity)
			const bRarityIdx = RARITY_ORDER.indexOf(b.rarity)
			if (aRarityIdx !== bRarityIdx) return bRarityIdx - aRarityIdx

			return a.name.localeCompare(b.name)
		})
	}, [
		allBadges,
		selectedCategory,
		selectedRarity,
		searchQuery,
		showEarnedOnly,
		earnedBadgeIds,
	])

	// Stats
	const totalBadges = allBadges.length
	const earnedCount = earnedBadges.length
	const progressPercent =
		totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0

	// Category counts
	const categoryCounts = useMemo(() => {
		const counts: Record<string, { total: number; earned: number }> = {}
		for (const badge of allBadges) {
			if (!counts[badge.category]) {
				counts[badge.category] = { total: 0, earned: 0 }
			}
			counts[badge.category].total++
			if (earnedBadgeIds.has(badge.id) || earnedBadgeIds.has(badge.name)) {
				counts[badge.category].earned++
			}
		}
		return counts
	}, [allBadges, earnedBadgeIds])

	return (
		<div className='min-h-screen bg-bg pb-20'>
			{/* Header */}
			<div className='sticky top-0 z-sticky border-b border-border-subtle bg-bg-card/95 backdrop-blur-sm'>
				<div className='mx-auto max-w-6xl px-4 py-4'>
					{/* Back + Title */}
					<div className='flex items-center gap-3'>
						<Link
							href='/profile'
							className='grid size-10 place-items-center rounded-full bg-bg-hover text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
						>
							<ChevronLeft className='size-5' />
						</Link>
						<div className='flex-1'>
							<h1 className='text-xl font-bold text-text'>Badge Collection</h1>
							<p className='text-sm text-text-muted'>
								{earnedCount} of {totalBadges} badges earned ({progressPercent}
								%)
							</p>
						</div>
						<div className='grid size-12 place-items-center rounded-xl bg-gradient-gold text-2xl shadow-md'>
							<Trophy className='size-6 text-amber-900' />
						</div>
					</div>

					{/* Progress Bar */}
					<div className='mt-4 h-2 overflow-hidden rounded-full bg-bg-hover'>
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${progressPercent}%` }}
							transition={{ duration: 1, ease: 'easeOut' }}
							className='h-full rounded-full bg-gradient-to-r from-xp to-brand'
						/>
					</div>

					{/* Search + Filters */}
					<div className='mt-4 flex flex-wrap items-center gap-2'>
						{/* Search */}
						<div className='relative flex-1 min-w-search'>
							<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
							<input
								type='text'
								placeholder='Search badges...'
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className='w-full rounded-lg border border-border-subtle bg-bg-input py-2 pl-9 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20'
							/>
						</div>

						{/* Category Filter */}
						<select
							value={selectedCategory}
							onChange={e =>
								setSelectedCategory(e.target.value as BadgeCategory | 'ALL')
							}
							className='rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20'
						>
							<option value='ALL'>All Categories</option>
							{Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
								<option key={key} value={key}>
									{config.label} ({categoryCounts[key]?.earned ?? 0}/
									{categoryCounts[key]?.total ?? 0})
								</option>
							))}
						</select>

						{/* Rarity Filter */}
						<select
							value={selectedRarity}
							onChange={e =>
								setSelectedRarity(e.target.value as BadgeRarity | 'ALL')
							}
							className='rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20'
						>
							<option value='ALL'>All Rarities</option>
							{RARITY_ORDER.map(rarity => (
								<option key={rarity} value={rarity}>
									{RARITY_CONFIG[rarity].label}
								</option>
							))}
						</select>

						{/* Earned Only Toggle */}
						<button
							onClick={() => setShowEarnedOnly(!showEarnedOnly)}
							className={cn(
								'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
								showEarnedOnly
									? 'border-success bg-success/10 text-success'
									: 'border-border-subtle bg-bg-input text-text-muted hover:text-text',
							)}
						>
							<CheckCircle2 className='size-4' />
							Earned Only
						</button>
					</div>
				</div>
			</div>

			{/* Badge Grid */}
			<div className='mx-auto max-w-6xl px-4 py-6'>
				<AnimatePresence mode='popLayout'>
					{filteredBadges.length === 0 ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='flex flex-col items-center justify-center py-20 text-center'
						>
							<div className='grid size-16 place-items-center rounded-2xl bg-bg-hover'>
								<Search className='size-8 text-text-muted' />
							</div>
							<p className='mt-4 font-semibold text-text'>No badges found</p>
							<p className='mt-1 text-sm text-text-muted'>
								Try adjusting your filters or search query
							</p>
						</motion.div>
					) : (
						<motion.div
							layout
							className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
						>
							{filteredBadges.map((badge, index) => {
								const isEarned =
									earnedBadgeIds.has(badge.id) ||
									earnedBadgeIds.has(badge.name) ||
									earnedBadgeIds.has(badge.name.toLowerCase())
								return (
									<motion.div
										key={badge.id || `badge-${index}`}
										layout
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{ delay: Math.min(index * 0.02, 0.3) }}
									>
										<BadgeCard
											badge={badge}
											isEarned={isEarned}
											earnedAt={undefined} // TODO: Track earnedAt in user statistics
										/>
									</motion.div>
								)
							})}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Rarity Legend */}
			<div className='mx-auto max-w-6xl px-4 pb-8'>
				<div className='rounded-2xl border border-border-subtle bg-bg-card p-4'>
					<h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-text'>
						<Star className='size-4 text-xp' />
						Rarity Guide
					</h3>
					<div className='flex flex-wrap gap-2'>
						{RARITY_ORDER.map(rarity => {
							const config = RARITY_CONFIG[rarity]
							return (
								<div
									key={rarity}
									className={cn(
										'flex items-center gap-2 rounded-lg border px-3 py-1.5',
										config.bgClass,
										config.borderClass,
									)}
								>
									<span
										className={cn('text-xs font-semibold', config.textClass)}
									>
										{config.label}
									</span>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</div>
	)
}
