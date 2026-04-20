'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Users, Eye, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getFriendsActiveRooms } from '@/services/cookingRoom'
import { getFriendsActiveCooking } from '@/services/heartbeat'
import type { FriendsActiveRoom } from '@/lib/types/room'
import type { ActiveFriend } from '@/lib/types/heartbeat'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from 'next-intl'

interface FriendsCookingNowProps {
	className?: string
	/** Poll interval in ms (default: 30000 = 30s) */
	pollInterval?: number
}

/**
 * "Friends Cooking Now" widget for the dashboard.
 * Shows active rooms where followed users are currently cooking.
 * Per spec: 24-advanced-multiplayer.txt §5
 */
export function FriendsCookingNow({
	className,
	pollInterval = 30000,
}: FriendsCookingNowProps) {
	const t = useTranslations('cooking')
	const router = useRouter()
	const [rooms, setRooms] = useState<FriendsActiveRoom[]>([])
	const [soloFriends, setSoloFriends] = useState<ActiveFriend[]>([])
	const [isLoading, setIsLoading] = useState(true)

	const fetchAll = useCallback(async () => {
		try {
			const [roomsRes, soloRes] = await Promise.all([
				getFriendsActiveRooms(),
				getFriendsActiveCooking(),
			])
			if (roomsRes.success && roomsRes.data) setRooms(roomsRes.data)
			if (soloRes.success && soloRes.data) {
				// Filter out friends who are already in rooms to avoid duplicates
				const roomUserIds = new Set(
					(roomsRes.data ?? []).flatMap(r => r.participantNames.map(n => n)),
				)
				// Solo friends: those not in a room (roomCode is null)
				setSoloFriends(soloRes.data.friends.filter(f => !f.roomCode))
			}
		} catch (error) {
			logDevError('[FriendsCookingNow] fetch failed:', error)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		let cancelled = false
		const safeFetch = () => {
			if (!cancelled) fetchAll()
		}
		safeFetch()
		const interval = setInterval(() => {
			if (!document.hidden && !cancelled) fetchAll()
		}, pollInterval)
		return () => {
			cancelled = true
			clearInterval(interval)
		}
	}, [fetchAll, pollInterval])

	const totalActive = rooms.length + soloFriends.length

	// Don't render anything if nobody is cooking
	if (!isLoading && totalActive === 0) return null

	// Loading skeleton
	if (isLoading) return null // Don't show skeleton for this widget — it appears asynchronously

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card md:p-5',
				className,
			)}
		>
			<div className='mb-3 flex items-center gap-2'>
				<div className='flex size-8 items-center justify-center rounded-xl bg-success/20'>
					<ChefHat className='size-4 text-success' />
				</div>
				<h3 className='text-sm font-bold text-text'>
					{t('friendsCookingNow')}
				</h3>
				<span className='ml-auto flex size-5 items-center justify-center rounded-full bg-brand/15 text-2xs font-bold text-brand'>
					{totalActive}
				</span>
			</div>

			<div className='space-y-2'>
				<AnimatePresence mode='popLayout'>
					{rooms.map(room => (
						<motion.div
							key={room.roomCode}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 10 }}
							transition={TRANSITION_SPRING}
							className='group flex items-center gap-3 rounded-xl bg-bg-elevated/50 p-3 transition-colors hover:bg-bg-elevated'
						>
							<div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-success/10'>
								<span className='relative flex size-2'>
									<span className='absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75' />
									<span className='relative inline-flex size-2 rounded-full bg-success' />
								</span>
							</div>

							<div className='min-w-0 flex-1'>
								<p className='truncate text-sm font-semibold text-text'>
									{formatParticipantNames(room.participantNames)}
								</p>
								<p className='truncate text-xs text-text-secondary'>
									{t('friendCooking', { recipe: room.recipeTitle })}
								</p>
								<p className='text-2xs text-text-muted'>
									Started {formatMinutesAgo(room.startedMinutesAgo, t)} ago
									{' · '}
									<Users className='mb-0.5 inline size-3' />{' '}
									{room.participantCount}
								</p>
							</div>

							<div className='flex shrink-0 gap-1'>
								<button
									type='button'
									onClick={() =>
										router.push(
											`/cook-together?roomCode=${room.roomCode}&role=SPECTATOR`,
										)
									}
									className='flex items-center gap-1 rounded-lg bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-elevated/80 hover:text-text'
									title={t('friendWatch')}
									aria-label={t('friendWatchAria', {
										names: formatParticipantNames(room.participantNames),
									})}
								>
									<Eye className='size-3' />
									{t('friendWatch')}
								</button>
								<button
									type='button'
									onClick={() =>
										router.push(`/cook-together?roomCode=${room.roomCode}`)
									}
									className='flex items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20'
									title={t('friendJoin')}
									aria-label={t('friendJoinAria', {
										names: formatParticipantNames(room.participantNames),
										recipe: room.recipeTitle,
									})}
								>
									<ArrowRight className='size-3' />
									{t('friendJoin')}
								</button>
							</div>
						</motion.div>
					))}
				</AnimatePresence>
			</div>

			{/* Solo cooking sessions */}
			{soloFriends.length > 0 && (
				<div className={cn('space-y-2', rooms.length > 0 && 'mt-2')}>
					<AnimatePresence mode='popLayout'>
						{soloFriends.map(friend => (
							<motion.div
								key={friend.userId}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 10 }}
								transition={TRANSITION_SPRING}
								onClick={() => router.push(`/recipes/${friend.recipeId}`)}
								className='group flex cursor-pointer items-center gap-3 rounded-xl bg-bg-elevated/50 p-3 transition-colors hover:bg-bg-elevated'
							>
								<Avatar size='sm'>
									{friend.avatarUrl && (
										<AvatarImage
											src={friend.avatarUrl}
											alt={
												friend.displayName ??
												friend.username ??
												t('friendNameFallback')
											}
										/>
									)}
									<AvatarFallback className='text-xs'>
										{(friend.displayName ?? friend.username ?? '?')
											.slice(0, 2)
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>

								<div className='min-w-0 flex-1'>
									<p className='truncate text-sm font-semibold text-text'>
										{friend.displayName ??
											friend.username ??
											t('friendNameFallback')}
									</p>
									<p className='truncate text-xs text-text-secondary'>
										{t('friendCooking', { recipe: friend.recipeTitle })}
									</p>
									<div className='mt-1 flex items-center gap-2'>
										{/* Step progress bar */}
										<div className='h-1.5 flex-1 rounded-full bg-border-subtle'>
											<div
												className='h-full rounded-full bg-success transition-all'
												style={{
													width: `${friend.totalSteps > 0 ? (friend.currentStep / friend.totalSteps) * 100 : 0}%`,
												}}
											/>
										</div>
										<span className='text-2xs text-text-muted'>
											{t('friendStep', {
												current: friend.currentStep,
												total: friend.totalSteps,
											})}
										</span>
									</div>
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}
		</motion.div>
	)
}

// ── Helpers ──

function formatParticipantNames(names: string[]): string {
	if (names.length <= 2) return names.join(' & ')
	return `${names[0]}, ${names[1]} +${names.length - 2}`
}

function formatMinutesAgo(
	minutes: number,
	t: (key: string, params?: Record<string, unknown>) => string,
): string {
	if (minutes < 1) return t('justNow')
	if (minutes < 60) return t('minutesShort', { count: minutes })
	const hours = Math.floor(minutes / 60)
	const remaining = minutes % 60
	return remaining > 0
		? t('hoursMinutesShort', { hours, minutes: remaining })
		: t('hoursShort', { hours })
}
