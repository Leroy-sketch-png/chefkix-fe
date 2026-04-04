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
					<div className='size-5 animate-pulse rounded bg-bg-elevated' />
					<div className='h-5 w-32 animate-pulse rounded bg-bg-elevated' />
				</div>
				<div className='flex gap-4 overflow-hidden'>
					{[1, 2, 3].map(i => (
						<div
							key={i}
							className='h-48 w-72 flex-shrink-0 animate-pulse rounded-2xl bg-bg-elevated'
						/>
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
			aria-label="Season's Best Collections"
		>
			{/* Section header */}
			<div className='mb-3 flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Sparkles className='size-5 text-brand' />
					<h2 className='text-lg font-bold text-text'>Season&apos;s Best</h2>
				</div>
				<Link
					href='/explore?view=collections'
					className='flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-brand'
				>
					View all
					<ArrowRight className='size-3.5' />
				</Link>
			</div>

			{/* Scrollable card strip */}
			<div
				className='-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-thin scrollbar-thumb-border-medium'
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

function FeaturedCollectionCard({ collection, index }: FeaturedCollectionCardProps) {
	const itemCount = (collection.recipeIds?.length || 0) + (collection.postIds?.length || 0)

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
				className='group block w-72 flex-shrink-0'
			>
				<div className='relative h-48 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card transition-shadow duration-300 group-hover:shadow-warm'>
					{/* Cover image or gradient fallback */}
					{collection.coverImageUrl ? (
						<Image
							src={collection.coverImageUrl}
							alt={collection.name}
							fill
							className='object-cover transition-transform duration-500 group-hover:scale-105'
							sizes='288px'
						/>
					) : (
						<div className='absolute inset-0 bg-gradient-to-br from-brand/20 via-brand/10 to-transparent' />
					)}

					{/* Gradient overlay for text readability */}
					<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

					{/* Emoji badge (top-left) */}
					{collection.emoji && (
						<div className='absolute left-3 top-3 flex size-10 items-center justify-center rounded-xl bg-white/90 text-lg shadow-sm backdrop-blur-sm'>
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
									{itemCount} {itemCount === 1 ? 'recipe' : 'recipes'}
								</span>
							)}
							{collection.totalXp && collection.totalXp > 0 && (
								<span className='flex items-center gap-1'>
									<ChefHat className='size-3' />
									{collection.totalXp} XP
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
