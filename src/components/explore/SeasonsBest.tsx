'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
	Sparkles,
	ChefHat,
	ArrowRight,
	BookOpen,
	CalendarDays,
	RefreshCw,
	Clock3,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { Collection } from '@/lib/types/collection'
import { getFeaturedCollections } from '@/services/collection'
import { TRANSITION_SPRING, CARD_FEED_HOVER } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { useTranslations } from 'next-intl'

interface SeasonsBestProps {
	className?: string
}

/**
 * "Season's Best" -- Featured curated collections on Explore.
 *
 * Fetches admin-curated collections (isFeatured=true) from
 * GET /api/v1/collections/featured. Each collection has:
 * - emoji + tagline for visual identity
 * - coverImageUrl for hero display
 * - recipeIds / postIds for content count
 * - seasonTag for seasonal grouping
 *
 * Renders as a horizontal scrollable card strip.
 * Degrades gracefully: if no featured collections exist, renders nothing.
 */
export const SeasonsBest = ({ className }: SeasonsBestProps) => {
	const t = useTranslations('explore')
	const [collections, setCollections] = useState<Collection[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)
	const [showAllCollections, setShowAllCollections] = useState(false)

	const loadCollections = useCallback(() => {
		let cancelled = false

		const fetchFeatured = async () => {
			setIsLoading(true)
			setHasError(false)
			try {
				const res = await getFeaturedCollections()
				if (cancelled) return
				if (res.success && res.data && res.data.length > 0) {
					setCollections(res.data)
				} else if (!res.success) {
					setHasError(true)
					setCollections([])
				} else {
					setCollections([])
				}
			} catch (err) {
				if (!cancelled) {
					setHasError(true)
					setCollections([])
				}
				logDevError('Failed to fetch featured collections:', err)
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchFeatured()
		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		const cleanup = loadCollections()
		return cleanup
	}, [loadCollections])

	if (isLoading) {
		return <SeasonsBestSkeleton className={className} />
	}

	if (hasError) {
		return (
			<section
				className={cn(
					'rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card',
					className,
				)}
			>
				<div className='flex items-start gap-3'>
					<div className='flex size-10 items-center justify-center rounded-2xl bg-brand/10 text-brand'>
						<CalendarDays className='size-5' />
					</div>
					<div className='flex-1'>
						<p className='text-2xs font-bold uppercase tracking-widest text-brand'>
							{t('seasonalEventLabel')}
						</p>
						<h3 className='mt-1 text-base font-bold text-text-primary'>
							{t('seasonsBestLoadFailedTitle')}
						</h3>
						<p className='mt-1 text-sm leading-relaxed text-text-secondary'>
							{t('seasonsBestLoadFailedBody')}
						</p>
					</div>
				</div>
				<button
					type='button'
					onClick={loadCollections}
					className='mt-4 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-brand/35 hover:bg-brand/10 hover:text-brand'
				>
					<RefreshCw className='size-3.5' />
					{t('tryAgainButton')}
				</button>
			</section>
		)
	}

	if (collections.length === 0) {
		return (
			<section
				className={cn(
					'rounded-2xl border border-dashed border-border-medium bg-gradient-to-br from-bg-card via-bg-card to-brand/5 p-4 shadow-card',
					className,
				)}
			>
				<p className='text-2xs font-bold uppercase tracking-widest text-brand'>
					{t('seasonalEventLabel')}
				</p>
				<h3 className='mt-1 text-lg font-black leading-tight text-text-primary'>
					{t('seasonsBestEmptyTitle')}
				</h3>
				<p className='mt-2 text-sm leading-relaxed text-text-secondary'>
					{t('seasonsBestEmptyBody')}
				</p>
				<Link
					href='/explore?mode=trending'
					className='mt-4 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-brand/35 hover:bg-brand/10 hover:text-brand'
				>
					<Sparkles className='size-3.5' />
					{t('commandModeTrending')}
					<ArrowRight className='size-3.5' />
				</Link>
			</section>
		)
	}

	const [featuredCollection, ...supportingCollections] = collections
	const hasOverflowCollections = supportingCollections.length > 2
	const visibleSupportingCollections = showAllCollections
		? supportingCollections
		: supportingCollections.slice(0, 2)

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card',
				className,
			)}
			aria-label={t('seasonsBestTitle')}
		>
			<div className='mb-4 flex items-start justify-between gap-3'>
				<div className='flex items-center gap-2'>
					<div className='flex size-10 items-center justify-center rounded-2xl bg-brand/10 text-brand'>
						<Sparkles className='size-5' />
					</div>
					<div>
						<p className='text-2xs font-bold uppercase tracking-widest text-brand'>
							{t('seasonalEventLabel')}
						</p>
						<h2 className='text-lg font-black leading-tight text-text-primary'>
							{t('seasonsBestTitle')}
						</h2>
						<p className='mt-1 text-xs font-medium leading-relaxed text-text-secondary'>
							{t('seasonsBestSubtitle')}
						</p>
					</div>
				</div>
				{hasOverflowCollections && (
					<button
						type='button'
						onClick={() => setShowAllCollections(current => !current)}
						className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand/30 hover:text-brand'
					>
						{showAllCollections
							? t('seasonsBestShowLess')
							: t('seasonsBestViewAll')}
						<ArrowRight className='size-3.5' />
					</button>
				)}
			</div>

			<div className='space-y-3' role='list'>
				<FeaturedCollectionCard
					collection={featuredCollection}
					index={0}
					featured
				/>
				{visibleSupportingCollections.map((collection, index) => (
					<FeaturedCollectionCard
						key={collection.id}
						collection={collection}
						index={index + 1}
					/>
				))}
			</div>
		</motion.section>
	)
}

// ============================================
// FEATURED COLLECTION CARD
// ============================================

interface FeaturedCollectionCardProps {
	collection: Collection
	index: number
	featured?: boolean
}

function FeaturedCollectionCard({
	collection,
	index,
	featured = false,
}: FeaturedCollectionCardProps) {
	const t = useTranslations('explore')
	const itemCount =
		(collection.recipeIds?.length || 0) + (collection.postIds?.length || 0)
	const stats = [
		itemCount > 0
			? {
					icon: BookOpen,
					label: t('collectionItemCount', { count: itemCount }),
				}
			: null,
		collection.totalXp && collection.totalXp > 0
			? {
					icon: ChefHat,
					label: t('xpLabel', { xp: collection.totalXp }),
				}
			: null,
		collection.estimatedTotalMinutes && collection.estimatedTotalMinutes > 0
			? {
					icon: Clock3,
					label: `${collection.estimatedTotalMinutes} ${t('unitMin')}`,
				}
			: null,
		collection.enrolledCount && collection.enrolledCount > 0
			? {
					icon: Users,
					label: `${collection.enrolledCount}`,
				}
			: null,
	].filter(Boolean) as Array<{ icon: typeof BookOpen; label: string }>

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: index * 0.08, ...TRANSITION_SPRING }}
			whileHover={CARD_FEED_HOVER}
			role='listitem'
		>
			<Link href={`/collections/${collection.id}`} className='group block'>
				<div
					className={cn(
						'relative overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card shadow-card transition-shadow duration-300 group-hover:shadow-warm',
						featured ? 'min-h-60' : 'min-h-40',
					)}
				>
					<ImageWithFallback
						src={collection.coverImageUrl}
						alt={collection.name}
						fill
						className='object-cover transition-transform duration-500 group-hover:scale-105'
						sizes={featured ? '360px' : '320px'}
						fallbackComponent={
							<div className='absolute inset-0 bg-gradient-to-br from-brand/20 via-brand/10 to-transparent' />
						}
					/>

					<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

					{collection.emoji && (
						<div className='absolute left-3 top-3 flex size-10 items-center justify-center rounded-xl bg-bg-card/90 text-lg shadow-card backdrop-blur-sm z-40'>
							{collection.emoji}
						</div>
					)}

					{collection.seasonTag && (
						<span className='absolute right-3 top-3 rounded-full bg-brand/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm z-40'>
							{formatSeasonTag(collection.seasonTag)}
						</span>
					)}

					<div
						className={cn(
							'absolute inset-x-0 bottom-0 p-4 z-40',
							featured && 'p-5',
						)}
					>
						<p className='text-2xs font-bold uppercase tracking-widest text-white/72'>
							{featured ? t('featured') : t('seasonalEventLabel')}
						</p>
						<h3
							className={cn(
								'line-clamp-2 font-bold text-white',
								featured ? 'mt-1 text-lg leading-tight' : 'mt-1 text-base',
							)}
						>
							{collection.name}
						</h3>
						{collection.tagline && (
							<p
								className={cn(
									'line-clamp-2 text-sm text-white/82',
									featured ? 'mt-1.5 leading-relaxed' : 'mt-1',
								)}
							>
								{collection.tagline}
							</p>
						)}
						<div className='mt-3 flex flex-wrap gap-2 text-xs text-white/72'>
							{stats.slice(0, featured ? 4 : 3).map(stat => {
								const Icon = stat.icon
								return (
									<span
										key={`${collection.id}-${stat.label}`}
										className='inline-flex items-center gap-1 rounded-full bg-white/14 px-2 py-1 backdrop-blur-sm'
									>
										<Icon className='size-3' />
										<span className='tabular-nums'>{stat.label}</span>
									</span>
								)
							})}
						</div>
					</div>
				</div>
			</Link>
		</motion.div>
	)
}

function SeasonsBestSkeleton({ className }: SeasonsBestProps) {
	return (
		<div
			className={cn(
				'rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card',
				className,
			)}
		>
			<div className='mb-4 flex items-center gap-3'>
				<Skeleton className='size-10 rounded-2xl' />
				<div className='space-y-2'>
					<Skeleton className='h-3 w-20 rounded-full' />
					<Skeleton className='h-5 w-32 rounded-full' />
				</div>
			</div>
			<Skeleton className='h-60 w-full rounded-2xl' />
			<div className='mt-3 grid gap-3'>
				{[1, 2].map(item => (
					<Skeleton key={item} className='h-40 w-full rounded-2xl' />
				))}
			</div>
		</div>
	)
}

// ============================================
// HELPERS
// ============================================

function formatSeasonTag(tag: string): string {
	// "summer-2025" -> "Summer 2025", "holiday-baking" -> "Holiday Baking"
	return tag
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}
