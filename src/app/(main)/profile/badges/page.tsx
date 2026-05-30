'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
	Trophy,
	Search,
	Sparkles,
	Lock,
	CheckCircle2,
	Star,
	Flame,
	ChefHat,
	Award,
	Globe,
	Users,
	Target,
	ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { MagicCard } from '@/components/ui/magic-card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	getAllBadges,
	resolveBadgesWithFallback,
} from '@/lib/data/badgeRegistry'
import type {
	Badge,
	BadgeCategory,
	BadgeRarity,
} from '@/lib/types/gamification'
import {
	TRANSITION_SPRING,
	CARD_HOVER,
	BUTTON_SUBTLE_TAP,
	DURATION_S,
} from '@/lib/motion'
import { useTranslations } from 'next-intl'
import {
	PremiumSurface,
	SurfaceSectionHeader,
} from '@/components/layout/PremiumSurface'

// ============================================
// BADGE CATALOG PAGE
// ============================================
// Shows ALL badges in the system, highlighting which
// the user has earned vs which are still locked.

// Category display config
const CATEGORY_CONFIG: Record<
	BadgeCategory,
	{ labelKey: string; icon: React.ReactNode; color: string }
> = {
	COOKING: {
		labelKey: 'catCooking',
		icon: <ChefHat className='size-4' />,
		color: 'text-brand',
	},
	CUISINE: {
		labelKey: 'catCuisine',
		icon: <Globe className='size-4' />,
		color: 'text-info',
	},
	STREAK: {
		labelKey: 'catStreaks',
		icon: <Flame className='size-4' />,
		color: 'text-streak',
	},
	SPECIAL: {
		labelKey: 'catSpecial',
		icon: <Sparkles className='size-4' />,
		color: 'text-xp',
	},
	SOCIAL: {
		labelKey: 'catSocial',
		icon: <Users className='size-4' />,
		color: 'text-success',
	},
	CHALLENGE: {
		labelKey: 'catChallenges',
		icon: <Target className='size-4' />,
		color: 'text-warning',
	},
	CREATOR: {
		labelKey: 'catCreator',
		icon: <Award className='size-4' />,
		color: 'text-combo',
	},
}

// Rarity display config
const RARITY_CONFIG: Record<
	BadgeRarity,
	{ labelKey: string; bgClass: string; textClass: string; borderClass: string }
> = {
	COMMON: {
		labelKey: 'rarCommon',
		bgClass: 'bg-text-secondary/10',
		textClass: 'text-text-secondary',
		borderClass: 'border-text-secondary/20',
	},
	UNCOMMON: {
		labelKey: 'rarUncommon',
		bgClass: 'bg-success/10',
		textClass: 'text-success',
		borderClass: 'border-success/30',
	},
	RARE: {
		labelKey: 'rarRare',
		bgClass: 'bg-info/10',
		textClass: 'text-info',
		borderClass: 'border-info/30',
	},
	EPIC: {
		labelKey: 'rarEpic',
		bgClass: 'bg-accent-purple/10',
		textClass: 'text-accent-purple',
		borderClass: 'border-accent-purple/30',
	},
	LEGENDARY: {
		labelKey: 'rarLegendary',
		bgClass: 'bg-gradient-to-r from-warning/10 to-brand/10',
		textClass: 'text-warning',
		borderClass: 'border-warning/30',
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

const getGlowColors = (rarity: BadgeRarity, isEarned: boolean) => {
	if (!isEarned) {
		return {
			from: 'var(--color-border-subtle, #e8e2db)',
			to: 'var(--color-border-subtle, #e8e2db)',
		}
	}
	switch (rarity) {
		case 'COMMON':
			return {
				from: 'var(--color-text-secondary, #6b6661)',
				to: 'var(--color-border, #d1c9bf)',
			}
		case 'UNCOMMON':
			return {
				from: 'var(--color-success, #10b981)',
				to: 'var(--color-border, #d1c9bf)',
			}
		case 'RARE':
			return {
				from: 'var(--color-info, #3b82f6)',
				to: 'var(--color-border, #d1c9bf)',
			}
		case 'EPIC':
			return {
				from: 'var(--color-xp, #6366f1)',
				to: 'var(--color-border, #d1c9bf)',
			}
		case 'LEGENDARY':
			return {
				from: 'var(--color-brand, #ff5a36)',
				to: 'var(--color-xp, #6366f1)',
			}
		default:
			return {
				from: 'var(--color-brand, #ff5a36)',
				to: 'var(--color-success, #10b981)',
			}
	}
}

// ============================================
// BADGE CARD COMPONENT
// ============================================

interface BadgeCardProps {
	badge: Badge
	isEarned: boolean
	earnedAt?: string
}

const BadgeCard = ({ badge, isEarned, earnedAt }: BadgeCardProps) => {
	const t = useTranslations('badges')
	const rarityConfig = RARITY_CONFIG[badge.rarity]
	const isHidden = badge.isHidden && !isEarned
	const glow = getGlowColors(badge.rarity, isEarned)

	return (
		<motion.div
			whileHover={CARD_HOVER}
			transition={TRANSITION_SPRING}
			className='group relative flex flex-col h-full rounded-2xl transition-all duration-300'
		>
			{/* Earned checkmark */}
			{isEarned && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					className='absolute -right-1 -top-1 z-50 grid size-6 place-items-center rounded-full bg-success text-white shadow-card'
				>
					<CheckCircle2 className='size-4' />
				</motion.div>
			)}

			<MagicCard
				mode='orb'
				glowFrom={glow.from}
				glowTo={glow.to}
				className='h-full w-full'
			>
				<div
					className={cn(
						'flex flex-col items-center gap-3 h-full w-full text-center p-4 rounded-[inherit]',
						isEarned
							? `${rarityConfig.bgClass}`
							: 'bg-bg-elevated/30 opacity-65 hover:opacity-90',
						isHidden && 'cursor-help',
					)}
				>
					{/* Hidden badge mystery */}
					{isHidden ? (
						<div className='flex flex-col items-center justify-between h-full w-full py-2'>
							<div className='grid size-14 place-items-center rounded-xl bg-bg-hover'>
								<Lock className='size-6 text-text-muted' />
							</div>
							<div className='text-center mt-2'>
								<p className='text-sm font-semibold text-text-muted'>
									{t('hiddenBadge')}
								</p>
								<p className='mt-1 text-xs text-text-muted/70'>
									{t('discoverUnlock')}
								</p>
							</div>
						</div>
					) : (
						<div className='flex flex-col items-center justify-between h-full w-full gap-2'>
							{/* Badge Icon */}
							<div
								className={cn(
									'grid size-14 place-items-center rounded-xl text-3xl transition-transform duration-300 group-hover:scale-110 shadow-card',
									isEarned
										? 'bg-bg-card/90 border border-border-subtle'
										: 'bg-bg-hover',
								)}
							>
								{badge.icon}
							</div>

							{/* Badge Info */}
							<div className='text-center flex-1 flex flex-col justify-center min-h-[4rem]'>
								<p
									className={cn(
										'text-sm font-bold tracking-tight',
										isEarned ? 'text-text-primary' : 'text-text-muted',
									)}
								>
									{badge.name}
								</p>
								<p
									className={cn(
										'mt-1 line-clamp-2 text-2xs leading-snug',
										isEarned ? 'text-text-secondary' : 'text-text-muted/70',
									)}
								>
									{badge.description}
								</p>
							</div>

							{/* Rarity Tag */}
							<span
								className={cn(
									'rounded-full px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider',
									rarityConfig.bgClass,
									rarityConfig.textClass,
									'border border-border-subtle/20',
								)}
							>
								{t(rarityConfig.labelKey)}
							</span>

							{/* Unlock criteria (for locked badges) */}
							{!isEarned && badge.unlockCriteria && (
								<p className='mt-1 text-center text-3xs text-text-muted/80 leading-tight italic'>
									{badge.unlockCriteria}
								</p>
							)}

							{/* Earned date (for earned badges) */}
							{isEarned && earnedAt && (
								<p className='text-3xs text-text-muted mt-1'>
									{t('earnedDate', {
										date: new Date(earnedAt).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
										}),
									})}
								</p>
							)}
						</div>
					)}
				</div>
			</MagicCard>
		</motion.div>
	)
}

// ============================================
// MAIN PAGE
// ============================================

export default function BadgeCatalogPage() {
	const { user } = useAuth()
	const router = useRouter()
	const t = useTranslations('badges')
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

	// Badge timestamps map for earnedAt lookup
	const badgeTimestamps = user?.statistics?.badgeTimestamps ?? {}

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
		<PageTransition>
			<div className='min-h-screen bg-bg pb-20'>
				{/* Header */}
				<div className='sticky top-0 z-sticky border-b border-border-subtle bg-bg-card/95 backdrop-blur-sm'>
					<PageContainer maxWidth='xl'>
						<PremiumSurface
							eyebrow={t('vaultEyebrow')}
							chipText={t('vaultChip', {
								earned: earnedCount,
								total: totalBadges,
							})}
							tone='xp'
							className='my-4 p-3 md:p-4'
						>
							<div className='mb-4 flex items-start gap-3'>
								<motion.button
									type='button'
									onClick={() => router.back()}
									whileTap={BUTTON_SUBTLE_TAP}
									className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
									aria-label={t('ariaGoBack')}
								>
									<ArrowLeft className='size-5' />
								</motion.button>
								<div className='flex-1 rounded-2xl overflow-hidden shadow-card'>
									<MagicCard
										mode='orb'
										glowFrom='var(--color-brand)'
										glowTo='var(--color-xp)'
										className='h-full w-full'
									>
										<div className='flex items-center gap-3 p-4 bg-bg-card'>
											<div className='grid size-10 place-items-center rounded-2xl bg-brand text-white shadow-glow'>
												<Trophy className='size-5' />
											</div>
											<div className='min-w-0'>
												<h1 className='text-3xl font-black tracking-tight text-text-primary'>
													{t('title')}
												</h1>
												<p className='mt-1 text-sm text-text-secondary'>
													{t('subtitle', {
														earned: earnedCount,
														total: totalBadges,
														percent: progressPercent,
													})}
												</p>
											</div>
										</div>
									</MagicCard>
								</div>
							</div>

							<SurfaceSectionHeader
								eyebrow={t('discoverFilterEyebrow')}
								chipText={t('discoverFilterChip')}
								className='mb-3'
							/>

							{/* Progress Bar */}
							<div className='h-2 overflow-hidden rounded-full bg-bg-hover'>
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: `${progressPercent}%` }}
									transition={{
										duration: DURATION_S.dramatic,
										ease: 'easeOut',
									}}
									className='h-full rounded-full bg-gradient-to-r from-xp to-brand'
								/>
							</div>

							{/* Search + Filters */}
							<div className='mt-4 grid grid-cols-[1fr] gap-2 sm:flex sm:flex-wrap sm:items-center'>
								{/* Search */}
								<div className='relative sm:flex-1 sm:min-w-search'>
									<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
									<input
										type='text'
										placeholder={t('searchPlaceholder')}
										value={searchQuery}
										onChange={e => setSearchQuery(e.target.value)}
										className='w-full rounded-xl border border-border-subtle bg-bg-input py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-1 focus-visible:ring-brand/20'
									/>
								</div>

								{/* Category Filter */}
								{/* Filter row */}
								<div className='flex flex-wrap items-center gap-2'>
									<Select
										value={selectedCategory}
										onValueChange={v => setSelectedCategory(v as BadgeCategory | 'ALL')}
									>
										<SelectTrigger className='min-w-0 flex-1 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus-visible:ring-1 focus-visible:ring-brand/20 sm:flex-none'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='ALL'>
												{t('allCategories')}
											</SelectItem>
											{Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
												<SelectItem key={key} value={key}>
													{t(config.labelKey)} ({categoryCounts[key]?.earned ?? 0}
													/{categoryCounts[key]?.total ?? 0})
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									{/* Rarity Filter */}
									<Select
										value={selectedRarity}
										onValueChange={v => setSelectedRarity(v as BadgeRarity | 'ALL')}
									>
										<SelectTrigger className='min-w-0 flex-1 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus-visible:ring-1 focus-visible:ring-brand/20 sm:flex-none'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='ALL'>
												{t('allRarities')}
											</SelectItem>
											{RARITY_ORDER.map(rarity => (
												<SelectItem key={rarity} value={rarity}>
													{t(RARITY_CONFIG[rarity].labelKey)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									{/* Earned Only Toggle */}
									<button
										type='button'
										onClick={() => setShowEarnedOnly(!showEarnedOnly)}
										className={cn(
											'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
											showEarnedOnly
												? 'border-success bg-success/10 text-success'
												: 'border-border-subtle bg-bg-input text-text-muted hover:text-text-primary',
										)}
									>
										<CheckCircle2 className='size-4' />
										Earned Only
									</button>
								</div>
							</div>
						</PremiumSurface>
					</PageContainer>
				</div>

				{/* Badge Grid */}
				<PageContainer maxWidth='xl' className='py-6'>
					<PremiumSurface
						eyebrow={t('collectedBadgesEyebrow')}
						chipText={t('visibleCount', { count: filteredBadges.length })}
						className='p-3 md:p-4'
					>
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
									<p className='mt-4 font-semibold text-text-primary'>
										{t('noBadgesFound')}
									</p>
									<p className='mt-1 text-sm text-text-muted'>
										{t('noBadgesHint')}
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
													earnedAt={
														badgeTimestamps[badge.id] ??
														badgeTimestamps[badge.name] ??
														undefined
													}
												/>
											</motion.div>
										)
									})}
								</motion.div>
							)}
						</AnimatePresence>
					</PremiumSurface>
				</PageContainer>

				{/* Rarity Legend */}
				<PageContainer maxWidth='xl' className='pb-8'>
					<PremiumSurface
						eyebrow={t('progressLegendEyebrow')}
						chipText={t('rarityGuide')}
						tone='streak'
						className='p-3 md:p-4'
					>
						<div className='rounded-2xl border border-border-subtle bg-bg-card p-4'>
							<h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-text-primary'>
								<Star className='size-4 text-xp' />
								{t('rarityGuide')}
							</h3>
							<div className='flex flex-wrap gap-2'>
								{RARITY_ORDER.map(rarity => {
									const config = RARITY_CONFIG[rarity]
									return (
										<div
											key={rarity}
											className={cn(
												'flex items-center gap-2 rounded-xl border px-3 py-1.5',
												config.bgClass,
												config.borderClass,
											)}
										>
											<span
												className={cn(
													'text-xs font-semibold',
													config.textClass,
												)}
											>
												{t(config.labelKey)}
											</span>
										</div>
									)
								})}
							</div>
						</div>
					</PremiumSurface>

					<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
				</PageContainer>
			</div>
		</PageTransition>
	)
}
