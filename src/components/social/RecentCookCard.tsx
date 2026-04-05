'use client'

import { Post } from '@/lib/types'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ChefHat, Clock, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import Image from 'next/image'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { TRANSITION_SPRING, CARD_FEED_HOVER } from '@/lib/motion'

interface RecentCookCardProps {
	post: Post
}

export const RecentCookCard = ({ post }: RecentCookCardProps) => {
	const t = useTranslations('social')
	// Extract duration from content (format: "Name cooked Title 🍳 X min")
	const durationMatch = post.content?.match(/(\d+)\s*min/)
	const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : null

	const coverImage = post.photoUrls?.[0] ?? null

	return (
		<motion.div
			layout
			className='group -mx-4 sm:mx-0 sm:rounded-radius border-y sm:border border-border-medium bg-bg-card transition-all duration-300'
		>
			<div className='flex items-center gap-3 p-3 md:p-4'>
				{/* Cover image thumbnail */}
				{coverImage && (
					<Link
						href={`/recipes/${post.recipeId}`}
						className='relative size-14 flex-shrink-0 overflow-hidden rounded-lg md:size-16'
					>
						<Image
							src={coverImage}
							alt={post.recipeTitle ?? t('recipeFallback')}
							fill
							className='object-cover transition-transform duration-300 group-hover:scale-105'
							sizes='64px'
						/>
					</Link>
				)}

				{/* ChefHat icon if no cover */}
				{!coverImage && (
					<div className='flex size-14 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 md:size-16'>
						<ChefHat className='size-6 text-brand' />
					</div>
				)}

				{/* Content */}
				<div className='flex min-w-0 flex-1 flex-col gap-1'>
					{/* User + time */}
					<div className='flex items-center gap-2'>
						<UserHoverCard userId={post.userId}>
							<Link
								href={`/profile/${post.userId}`}
								className='flex items-center gap-1.5'
							>
								<Avatar className='size-5'>
									<AvatarImage src={post.avatarUrl ?? undefined} />
									<AvatarFallback className='text-xs'>
										{post.displayName?.charAt(0) ?? '?'}
									</AvatarFallback>
								</Avatar>
								<span className='text-sm font-medium text-text hover:underline'>
									{post.displayName}
								</span>
							</Link>
						</UserHoverCard>
						<span className='text-xs text-text-muted'>
							{post.createdAt &&
								formatDistanceToNow(new Date(post.createdAt), {
									addSuffix: true,
								})}
						</span>
					</div>

					{/* Recipe title + duration */}
					<div className='flex items-center gap-2'>
						<Link
							href={`/recipes/${post.recipeId}`}
							className='truncate text-sm font-semibold text-text hover:text-brand'
						>
							{post.recipeTitle ?? t('unknownRecipe')}
						</Link>
						{durationMinutes != null && (
							<span className='flex flex-shrink-0 items-center gap-1 rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-secondary'>
								<Clock className='size-3' />
								{durationMinutes}m
							</span>
						)}
					</div>

					{/* Activity label */}
					<span className='text-xs text-text-muted'>🍳 {t('cookedThisRecipe')}</span>
				</div>

				{/* Arrow link to recipe */}
				<Link
					href={`/recipes/${post.recipeId}`}
					className='flex flex-shrink-0 items-center justify-center rounded-full p-2 text-text-muted transition-colors hover:bg-bg-elevated hover:text-brand'
				>
					<ArrowRight className='size-4' />
				</Link>
			</div>
		</motion.div>
	)
}
