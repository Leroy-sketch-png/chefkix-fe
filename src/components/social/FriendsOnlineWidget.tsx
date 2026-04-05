'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChefHat } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getFriendsPresence, PresenceInfo } from '@/services/presence'
import { logDevError } from '@/lib/dev-log'
import { TRANSITION_SPRING } from '@/lib/motion'
import { Skeleton } from '@/components/ui/skeleton'

const POLL_INTERVAL_MS = 30_000 // 30s

/**
 * Shows which friends are currently online, with cooking activity highlighted.
 * Polls every 30s. Lives in RightSidebar.
 */
export function FriendsOnlineWidget() {
	const t = useTranslations('social')
	const [friends, setFriends] = useState<PresenceInfo[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true

		const fetchPresence = async () => {
			try {
				const res = await getFriendsPresence()
				if (mounted && res.success && res.data) {
					setFriends(res.data.filter(f => f.online))
				}
			} catch (err) {
				logDevError('FriendsOnlineWidget fetch failed:', err)
			} finally {
				if (mounted) setLoading(false)
			}
		}

		fetchPresence()
		const interval = setInterval(fetchPresence, POLL_INTERVAL_MS)

		return () => {
			mounted = false
			clearInterval(interval)
		}
	}, [])

	if (loading) {
		return (
			<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card'>
				<div className='mb-3 flex items-center gap-2'>
					<Skeleton className='h-4 w-24' />
				</div>
				<div className='space-y-2'>
					{[1, 2, 3].map(i => (
						<div key={i} className='flex items-center gap-2'>
							<Skeleton className='size-7 rounded-full' />
							<Skeleton className='h-3 w-20' />
						</div>
					))}
				</div>
			</div>
		)
	}

	if (friends.length === 0) {
		return (
			<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card'>
				<div className='mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-text-primary'>
					<Users className='size-4 text-text-secondary' />
					{t('friendsOnline')}
				</div>
				<p className='text-xs leading-relaxed text-text-muted'>
					{t('friendsOnlineEmpty')}
				</p>
			</div>
		)
	}

	const cooking = friends.filter(f => f.activity === 'cooking')
	const browsing = friends.filter(f => f.activity !== 'cooking')

	return (
		<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card'>
			<div className='mb-3 flex items-center justify-between'>
				<div className='flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-text-primary'>
					<Users className='size-4 text-text-secondary' />
					{t('friendsOnline')}
				</div>
				<span className='rounded-full bg-success/20 px-2 py-0.5 text-xs font-semibold tabular-nums text-success' aria-label={t('onlineCount', { count: friends.length })}>
					{friends.length}
				</span>
			</div>

			<div className='space-y-1.5'>
				<AnimatePresence mode='popLayout'>
					{/* Cooking friends first — highlighted */}
					{cooking.map(friend => (
						<motion.div
							key={friend.userId}
							initial={{ opacity: 0, x: -8 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 8 }}
							transition={TRANSITION_SPRING}
						>
							<Link
								href={`/${friend.userId}`}
								className='flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-elevated'
							>
								<div className='relative'>
									<Avatar className='size-7'>
										<AvatarImage
											src={friend.avatarUrl || undefined}
											alt={friend.displayName || friend.username}
										/>
										<AvatarFallback className='text-xs'>
											{(friend.displayName ||
												friend.username)?.[0]?.toUpperCase() || 'U'}
										</AvatarFallback>
									</Avatar>
									<span className='absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-bg-card bg-success' aria-hidden='true' />
								</div>
								<div className='min-w-0 flex-1'>
									<p className='truncate text-xs font-medium text-text-primary'>
										{friend.displayName || friend.username}
									</p>
									<p className='flex items-center gap-1 truncate text-2xs text-brand'>
										<ChefHat className='size-2.5' />
										{friend.recipeTitle
											? t('cookingRecipe', { title: friend.recipeTitle })
											: t('cookingGeneric')}
									</p>
								</div>
							</Link>
						</motion.div>
					))}

					{/* Browsing friends */}
					{browsing.map(friend => (
						<motion.div
							key={friend.userId}
							initial={{ opacity: 0, x: -8 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 8 }}
							transition={TRANSITION_SPRING}
						>
							<Link
								href={`/${friend.userId}`}
								className='flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-elevated'
							>
								<div className='relative'>
									<Avatar className='size-7'>
										<AvatarImage
											src={friend.avatarUrl || undefined}
											alt={friend.displayName || friend.username}
										/>
										<AvatarFallback className='text-xs'>
											{(friend.displayName ||
												friend.username)?.[0]?.toUpperCase() || 'U'}
										</AvatarFallback>
									</Avatar>
									<span className='absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-bg-card bg-success' aria-hidden='true' />
								</div>
								<p className='min-w-0 flex-1 truncate text-xs font-medium text-text-primary'>
									{friend.displayName || friend.username}
								</p>
							</Link>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</div>
	)
}
