'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DURATION_S } from '@/lib/motion'
import { ChefHat, MessageSquare, Star, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { getRecipeSocialProof } from '@/services/heartbeat'
import type { RecipeSocialProofResponse } from '@/lib/types/heartbeat'
import { useTranslations } from 'next-intl'
import { formatShortTimeAgo, getInitials } from '@/lib/utils'

interface SocialProofProps {
	recipeId: string
}

export function SocialProof({ recipeId }: SocialProofProps) {
	const [data, setData] = useState<RecipeSocialProofResponse | null>(null)
	const t = useTranslations('recipe')

	useEffect(() => {
		let cancelled = false
		getRecipeSocialProof(recipeId)
			.then(res => {
				if (!cancelled && res.success && res.data) {
					setData(res.data)
				}
			})
			.catch(() => {
				/* social proof is non-critical */
			})
		return () => {
			cancelled = true
		}
	}, [recipeId])

	// Don't render anything if no social proof data or zero engagement
	if (!data || (data.cookCount === 0 && data.postCount === 0)) return null

	const maxVisible = 5
	const visibleCookers = data.recentCookers.slice(0, maxVisible)
	const overflowCount = data.cookCount - maxVisible

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.55, duration: DURATION_S.smooth }}
			className='mb-8 rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/5 via-transparent to-success/5 p-5 shadow-card'
		>
			{/* Header */}
			<div className='mb-4 flex items-center gap-2'>
				<TrendingUp className='size-5 text-brand' />
				<h3 className='text-lg font-bold text-text'>
					{t('communityActivity')}
				</h3>
			</div>

			{/* Stats row */}
			<div className='mb-4 flex flex-wrap items-center gap-5'>
				{data.cookCount > 0 && (
					<div className='flex items-center gap-2'>
						<div className='grid size-9 place-items-center rounded-xl bg-success/10'>
							<ChefHat className='size-4 text-success' />
						</div>
						<div>
							<p className='text-lg font-bold leading-tight text-text tabular-nums'>
								{data.cookCount}
							</p>
							<p className='text-xs text-text-muted'>
								{data.cookCount === 1
									? t('personCookedThis', { count: 1 })
									: t('personCookedThis', { count: data.cookCount })}
							</p>
						</div>
					</div>
				)}
				{data.postCount > 0 && (
					<div className='flex items-center gap-2'>
						<div className='grid size-9 place-items-center rounded-xl bg-brand/10'>
							<MessageSquare className='size-4 text-brand' />
						</div>
						<div>
							<p className='text-lg font-bold leading-tight text-text tabular-nums'>
								{data.postCount}
							</p>
							<p className='text-xs text-text-muted'>
								{data.postCount === 1
									? t('postShared', { count: 1 })
									: t('postShared', { count: data.postCount })}
							</p>
						</div>
					</div>
				)}
				{data.averageRating != null && data.averageRating > 0 && (
					<div className='flex items-center gap-2'>
						<div className='grid size-9 place-items-center rounded-xl bg-xp/10'>
							<Star className='size-4 text-xp' />
						</div>
						<div>
							<p className='text-lg font-bold leading-tight text-text tabular-nums'>
								{data.averageRating.toFixed(1)}
							</p>
							<p className='text-xs text-text-muted'>{t('avgRating')}</p>
						</div>
					</div>
				)}
			</div>

			{/* Avatar stack of recent cookers */}
			{visibleCookers.length > 0 && (
				<div className='flex items-center gap-3'>
					<div className='flex -space-x-2'>
						{visibleCookers.map((cooker, i) => (
							<TooltipProvider key={cooker.userId} delayDuration={200}>
								<Tooltip>
									<TooltipTrigger asChild>
										<motion.div
											initial={{ opacity: 0, scale: 0.6 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: 0.6 + i * 0.08 }}
											className='relative'
											style={{ zIndex: maxVisible - i }}
										>
											<Avatar size='sm' className='ring-2 ring-bg-card'>
												{cooker.avatarUrl && (
													<AvatarImage
														src={cooker.avatarUrl}
														alt={
															cooker.displayName ??
															cooker.username ??
															t('cookerFallback')
														}
													/>
												)}
												<AvatarFallback className='text-xs'>
													{getInitials(
														cooker.displayName ?? cooker.username ?? '?',
													)}
												</AvatarFallback>
											</Avatar>
										</motion.div>
									</TooltipTrigger>
									<TooltipContent side='bottom' className='p-2'>
										<p className='text-sm font-medium'>
											{cooker.displayName ??
												cooker.username ??
												t('chefFallback')}
										</p>
										<p className='text-xs text-text-muted'>
											{t('cookedTimeAgo', {
												time: formatShortTimeAgo(cooker.completedAt),
											})}
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						))}
						{overflowCount > 0 && (
							<motion.div
								initial={{ opacity: 0, scale: 0.6 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.6 + visibleCookers.length * 0.08 }}
								className='relative grid size-8 place-items-center rounded-full bg-bg-elevated ring-2 ring-bg-card'
								style={{ zIndex: 0 }}
							>
								<span className='text-xs font-semibold text-text-secondary'>
									+{overflowCount > 99 ? '99' : overflowCount}
								</span>
							</motion.div>
						)}
					</div>
					<p className='text-sm text-text-secondary'>
						<span className='font-medium text-text'>
							{visibleCookers[0]?.displayName ??
								visibleCookers[0]?.username ??
								t('someoneFallback')}
						</span>
						{visibleCookers.length > 1 && (
							<> {t('andOthers', { count: data.cookCount - 1 })}</>
						)}{' '}
						{t('cookedThis')}
					</p>
				</div>
			)}
		</motion.div>
	)
}
