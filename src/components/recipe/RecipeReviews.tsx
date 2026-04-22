'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	BUTTON_SUBTLE_HOVER,
	BUTTON_TAP,
	TRANSITION_SPRING,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import {
	Star,
	MessageSquare,
	ChevronDown,
	Loader2,
	AlertCircle,
} from 'lucide-react'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from '@/components/ui/star-rating'
import { getReviewsForRecipe, getRecipeReviewStats } from '@/services/post'
import { Post, RecipeReviewStatsResponse } from '@/lib/types/post'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from 'next-intl'

interface RecipeReviewsProps {
	recipeId: string
}

function RecipeReviewErrorFallback({
	error,
	onReset,
}: {
	error?: Error
	onReset: () => void
}) {
	const tCommon = useTranslations('common')

	return (
		<div
			role='alert'
			className='rounded-xl border border-destructive/20 bg-bg-elevated/50 p-4'
		>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div className='flex items-start gap-3'>
					<div className='rounded-full bg-destructive/10 p-2 text-destructive'>
						<AlertCircle className='size-4' />
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-text-primary'>
							{tCommon('somethingWentWrong')}
						</p>
						<p className='mt-1 text-sm text-text-secondary'>
							{error?.message || tCommon('unexpectedError')}
						</p>
					</div>
				</div>
				<button
					type='button'
					onClick={onReset}
					className='inline-flex h-10 w-fit items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg-card'
				>
					{tCommon('tryAgain')}
				</button>
			</div>
		</div>
	)
}

export function RecipeReviews({ recipeId }: RecipeReviewsProps) {
	const t = useTranslations('recipe')
	const [stats, setStats] = useState<RecipeReviewStatsResponse | null>(null)
	const [reviews, setReviews] = useState<Post[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [page, setPage] = useState(0)
	const [hasMore, setHasMore] = useState(false)

	const loadReviews = useCallback(
		async (pageNum: number) => {
			try {
				const response = await getReviewsForRecipe(recipeId, pageNum, 5)
				if (response.success && response.data) {
					const items = response.data
					if (pageNum === 0) {
						setReviews(items)
					} else {
						setReviews(prev => [...prev, ...items])
					}
					// If we got fewer than requested, no more pages
					setHasMore(items.length >= 5)
				}
			} catch (error) {
				logDevError('Failed to load reviews:', error)
			}
		},
		[recipeId],
	)

	useEffect(() => {
		let cancelled = false

		const load = async () => {
			setIsLoading(true)
			try {
				const [statsRes] = await Promise.all([
					getRecipeReviewStats(recipeId),
					loadReviews(0),
				])
				if (cancelled) return
				if (statsRes.success && statsRes.data) {
					setStats(statsRes.data)
				}
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		load()
		return () => {
			cancelled = true
		}
	}, [recipeId, loadReviews])

	const handleLoadMore = async () => {
		const nextPage = page + 1
		setIsLoadingMore(true)
		setPage(nextPage)
		await loadReviews(nextPage)
		setIsLoadingMore(false)
	}

	// Don't render if no reviews and not loading
	if (!isLoading && (!stats || stats.totalReviews === 0)) {
		return null
	}

	if (isLoading) {
		return (
			<div className='mb-8 rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'>
				<div className='flex items-center gap-3'>
					<div className='size-6 animate-pulse rounded bg-bg-elevated' />
					<div className='h-6 w-40 animate-pulse rounded bg-bg-elevated' />
				</div>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.6 }}
			className='mb-8 rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'
		>
			{/* Header with aggregate stats */}
			<div className='mb-6 flex items-center justify-between'>
				<h2 className='flex items-center gap-2 text-xl font-bold text-text'>
					<Star className='size-5 text-warning' />
					{t('reviewsHeading')}
				</h2>
				{stats && (
					<div className='flex items-center gap-3'>
						<StarRating
							value={Math.round(stats.averageRating)}
							readOnly
							size='sm'
						/>
						<span className='text-sm font-medium text-text-secondary'>
							{stats.averageRating.toFixed(1)} ({stats.totalReviews}{' '}
							{stats.totalReviews === 1
								? t('reviewSingular')
								: t('reviewPlural')}
							)
						</span>
					</div>
				)}
			</div>

			{/* Review list */}
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
				className='space-y-4'
			>
				<AnimatePresence>
					{reviews.map(review => (
						<motion.div key={review.id} variants={staggerItem}>
							<ErrorBoundary
								fallbackRender={({ error, onReset }) => (
									<RecipeReviewErrorFallback error={error} onReset={onReset} />
								)}
							>
								<div className='rounded-xl border border-border-subtle bg-bg-elevated/50 p-4'>
									<div className='mb-2 flex items-start justify-between'>
										<Link
											href={`/${review.userId}`}
											className='flex items-center gap-2 transition-colors hover:text-brand'
										>
											<Avatar className='size-8'>
												<AvatarImage
													src={review.avatarUrl}
													alt={review.displayName}
												/>
												<AvatarFallback>
													{review.displayName
														?.split(' ')
														.map(n => n[0])
														.join('')
														.toUpperCase()
														.slice(0, 2) || '??'}
												</AvatarFallback>
											</Avatar>
											<span className='text-sm font-semibold text-text'>
												{review.displayName || t('reviewUserFallback')}
											</span>
										</Link>
										<div className='flex items-center gap-2'>
											{review.reviewRating != null && (
												<StarRating
													value={review.reviewRating}
													readOnly
													size='sm'
												/>
											)}
											<span className='text-xs text-text-muted'>
												{formatDistanceToNow(new Date(review.createdAt), {
													addSuffix: true,
												})}
											</span>
										</div>
									</div>
									{review.content && (
										<p className='text-sm leading-relaxed text-text-secondary'>
											{review.content}
										</p>
									)}
									{review.likes != null && review.likes > 0 && (
										<div className='mt-2 flex items-center gap-1 text-xs text-text-muted'>
											<MessageSquare className='size-3' />
											{review.commentCount ?? 0} {t('commentsLabel')}
										</div>
									)}
								</div>
							</ErrorBoundary>
						</motion.div>
					))}
				</AnimatePresence>
			</motion.div>

			{/* Load more */}
			{hasMore && (
				<motion.button
					type='button'
					onClick={handleLoadMore}
					disabled={isLoadingMore}
					whileHover={BUTTON_SUBTLE_HOVER}
					whileTap={BUTTON_TAP}
					className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					{isLoadingMore ? (
						<Loader2 className='size-4 animate-spin' />
					) : (
						<ChevronDown className='size-4' />
					)}
					{isLoadingMore ? t('loadingMore') : t('showMoreReviews')}
				</motion.button>
			)}
		</motion.div>
	)
}
