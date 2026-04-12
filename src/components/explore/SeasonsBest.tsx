'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChefHat, ArrowRight, BookOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Collection } from '@/lib/types/collection'
import { getFeaturedCollections } from '@/services/collection'
import { TRANSITION_SPRING, CARD_FEED_HOVER } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'

interface SeasonsBestProps {
	className?: string
}

/**
 * "Season's Best" — Featured curated collections on Explore.
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

	useEffect(() => {
		const fetchFeatured = async () => {
			try {
				const res = await getFeaturedCollections()
				if (res.success && res.data && res.data.length > 0) {
					setCollections(res.data)
				}
			} catch (err) {
				logDevError('Failed to fetch featured collections:', err)
			} finally {
				setIsLoading(false)
			}
		}
		fetchFeatured()
	}, [])

	// Graceful degradation: nothing to show = render nothing
	if (!isLoading && collections.length === 0) return null

	// Skeleton while loading
	if (isLoading) {
		return (
			<div className={cn('mb-6', className)}>
				<div className='mb-3 flex items-center gap-2'>
					<Skeleton className='size-5 rounded' />
					<Skeleton className='h-5 w-32 rounded' />
				</div>
				<div className='flex gap-4 overflow-hidden'>
					{[1, 2, 3].map(i => (
						<Skeleton key={i} className='h-48 w-72 flex-shrink-0 rounded-2xl' />
					))}
				</div>
			</div>
		)
	}

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn('mb-6', className)}
			aria-label={t('seasonsBestTitle')}
		>
			{/* Section header */}
			<div className='mb-3 flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Sparkles className='size-5 text-brand' />
					<h2 className='text-lg font-bold text-text'>
						{t('seasonsBestTitle')}
					</h2>
				</div>
				<Link
					href='/explore?view=collections'
					className='flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-brand'
				>
					{t('seasonsBestViewAll')}
					<ArrowRight className='size-3.5' />
				</Link>
			</div>

			{/* Scrollable card strip */}
			<div
				className='flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-1 scrollbar-thin scrollbar-thumb-border-medium'
				role='list'
			>
				<AnimatePresence>
					{collections.map((collection, index) => (
						<FeaturedCollectionCard
							key={collection.id}
							collection={collection}
							index={index}
						/>
					))}
				</AnimatePresence>
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
}

function FeaturedCollectionCard({
	collection,
	index,
}: FeaturedCollectionCardProps) {
	const t = useTranslations('explore')
	const [imgError, setImgError] = useState(false)
	const itemCount =
		(collection.recipeIds?.length || 0) + (collection.postIds?.length || 0)

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: index * 0.08, ...TRANSITION_SPRING }}
			whileHover={CARD_FEED_HOVER}
			role='listitem'
		>
			<Link
				href={`/collections/${collection.id}`}
				className='group block w-72 snap-start flex-shrink-0'
			>
				<div className='relative h-48 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card text-transparent shadow-card transition-shadow duration-300 group-hover:shadow-warm'>
					{/* Cover image or gradient fallback — text-transparent hides alt text on slow/broken images */}
					{collection.coverImageUrl && !imgError ? (
						<Image
							src={collection.coverImageUrl}
							alt={collection.name}
							fill
							className='object-cover transition-transform duration-500 group-hover:scale-105'
							sizes='288px'
							onError={() => setImgError(true)}
						/>
					) : (
						<div className='absolute inset-0 bg-gradient-to-br from-brand/20 via-brand/10 to-transparent' />
					)}

					{/* Gradient overlay for text readability */}
					<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

					{/* Emoji badge (top-left) */}
					{collection.emoji && (
						<div className='absolute left-3 top-3 flex size-10 items-center justify-center rounded-xl bg-bg-card/90 text-lg shadow-sm backdrop-blur-sm'>
							{collection.emoji}
						</div>
					)}

					{/* Season tag (top-right) */}
					{collection.seasonTag && (
						<span className='absolute right-3 top-3 rounded-full bg-brand/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm'>
							{formatSeasonTag(collection.seasonTag)}
						</span>
					)}

					{/* Content (bottom) */}
					<div className='absolute bottom-0 left-0 right-0 p-4'>
						<h3 className='line-clamp-1 text-base font-bold text-white'>
							{collection.name}
						</h3>
						{collection.tagline && (
							<p className='mt-0.5 line-clamp-1 text-sm text-white/80'>
								{collection.tagline}
							</p>
						)}
						<div className='mt-2 flex items-center gap-3 text-xs text-white/70'>
							{itemCount > 0 && (
								<span className='flex items-center gap-1'>
									<BookOpen className='size-3' />
									<span className='tabular-nums'>{itemCount}</span>{' '}
									{itemCount === 1
										? t('recipeCountSingle')
										: t('recipeCountPlural')}
								</span>
							)}
							{collection.totalXp && collection.totalXp > 0 && (
								<span className='flex items-center gap-1 tabular-nums'>
									<ChefHat className='size-3' />
									{t('xpLabel', { xp: collection.totalXp })}
								</span>
							)}
						</div>
					</div>
				</div>
			</Link>
		</motion.div>
	)
}

// ============================================
// HELPERS
// ============================================

function formatSeasonTag(tag: string): string {
	// "summer-2025" → "Summer 2025", "holiday-baking" → "Holiday Baking"
	return tag
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}
