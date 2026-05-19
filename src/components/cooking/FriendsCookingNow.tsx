'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Users, Eye, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFriendsActiveRooms } from '@/services/cookingRoom'
import { getFriendsActiveCooking } from '@/services/heartbeat'
import type { FriendsActiveRoom } from '@/lib/types/room'
import type { ActiveFriend } from '@/lib/types/heartbeat'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from 'next-intl'
import { MagicCard } from '@/components/ui/magic-card'

interface FriendsCookingNowProps {
	className?: string
	/** Poll interval in ms (default: 30000 = 30s) */
	pollInterval?: number
}

const FRIENDS_COOKING_TIMEOUT_MS = 8000

/**
 * "Friends Cooking Now" widget for the dashboard.
 * Shows active rooms where followed users are currently cooking.
 * Per spec: 24-advanced-multiplayer.txt Section 5
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
				getFriendsActiveRooms({ timeoutMs: FRIENDS_COOKING_TIMEOUT_MS }),
				getFriendsActiveCooking({ timeoutMs: FRIENDS_COOKING_TIMEOUT_MS }),
			])
			if (roomsRes.success && roomsRes.data) setRooms(roomsRes.data)
			if (soloRes.success && soloRes.data) {
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

	return (
		<MagicCard
			mode='gradient'
			className={cn(
				'overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card/75 backdrop-blur-md shadow-card p-0',
				className,
			)}
		>
			<div className='p-4 md:p-5'>
				<div className='mb-3 flex items-center gap-2'>
					<div className='grid size-8 place-items-center rounded-xl bg-success/20'>
						<ChefHat className='size-4 text-success' />
					</div>
					<h3 className='text-sm font-bold text-text-primary'>
						{t('friendsCookingNow')}
					</h3>
					<span className='ml-auto inline-flex h-6 items-center rounded-full border border-brand/20 bg-brand/10 px-2 text-xs font-bold tabular-nums text-brand'>
						{totalActive}
					</span>
				</div>

				{isLoading && (
					<div className='space-y-2'>
						<div className='h-16 animate-pulse rounded-xl border border-border-subtle/70 bg-bg-elevated/60' />
						<div className='h-16 animate-pulse rounded-xl border border-border-subtle/70 bg-bg-elevated/60' />
					</div>
				)}

				{!isLoading && totalActive === 0 && (
					<div className='rounded-xl border border-border-subtle/70 bg-bg-elevated/50 p-3'>
						<p className='text-sm font-semibold text-text-primary'>
							{t('friendsCookingEmptyTitle')}
						</p>
						<p className='mt-1 text-xs text-text-secondary'>
							{t('friendsCookingEmptyDesc')}
						</p>
						<div className='mt-3 flex gap-2'>
							<Link
								href='/community'
								className='inline-flex items-center rounded-xl border border-border-subtle bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary'
							>
								{t('friendsCookingDiscoverFriends')}
							</Link>
							<Link
								href='/cook-together'
								className='inline-flex items-center rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand/90'
							>
								{t('friendsCookingStartCocooking')}
							</Link>
						</div>
					</div>
				)}

				{!isLoading && rooms.length > 0 && (
					<div className='mb-2 space-y-2'>
						<p className='text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted'>
							{t('friendsCookingLiveRooms')}
						</p>
						<AnimatePresence mode='popLayout'>
							{rooms.map(room => (
								<motion.div
									key={room.roomCode}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 10 }}
									transition={TRANSITION_SPRING}
									className='group rounded-xl border border-border-subtle bg-bg-elevated/60 p-3 transition-all hover:border-border-medium hover:bg-bg-elevated'
								>
									<div className='flex items-start gap-3'>
										<div className='grid size-9 shrink-0 place-items-center rounded-xl bg-success/10'>
											<span className='relative flex size-2'>
												<span className='absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75' />
												<span className='relative inline-flex size-2 rounded-full bg-success' />
											</span>
										</div>

										<div className='min-w-0 flex-1'>
											<p className='truncate text-sm font-semibold text-text-primary'>
												{formatParticipantNames(room.participantNames)}
											</p>
											<p className='truncate text-xs text-text-secondary'>
												{t('friendCooking', { recipe: room.recipeTitle })}
											</p>
											<p className='mt-1 text-2xs text-text-muted'>
												{formatMinutesAgo(room.startedMinutesAgo, t)} {' · '}
												<Users className='mb-0.5 inline size-3' />{' '}
												{room.participantCount}
											</p>
										</div>
									</div>

									<div className='mt-2 flex gap-1.5'>
										<button
											type='button'
											onClick={() =>
												router.push(
													`/cook-together?roomCode=${room.roomCode}&role=SPECTATOR`,
												)
											}
											className='inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-border-subtle bg-bg-card px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary'
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
											className='inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-brand px-2.5 py-1.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(255,90,54,0.35)] transition-all hover:bg-brand/90 hover:shadow-[0_4px_12px_rgba(255,90,54,0.4)]'
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
				)}

				{!isLoading && soloFriends.length > 0 && (
					<div className='space-y-2'>
						<p className='text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted'>
							{t('friendsCookingSoloSessions')}
						</p>
						<AnimatePresence mode='popLayout'>
							{soloFriends.map(friend => (
								<motion.div
									key={friend.userId}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 10 }}
									transition={TRANSITION_SPRING}
									onClick={() => router.push(`/recipes/${friend.recipeId}`)}
									className='group flex cursor-pointer items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated/60 p-3 transition-all hover:border-border-medium hover:bg-bg-elevated'
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
										<p className='truncate text-sm font-semibold text-text-primary'>
											{friend.displayName ??
												friend.username ??
												t('friendNameFallback')}
										</p>
										<p className='truncate text-xs text-text-secondary'>
											{t('friendCooking', { recipe: friend.recipeTitle })}
										</p>
										<div className='mt-1 flex items-center gap-2'>
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
			</div>
		</MagicCard>
	)
}

// Helpers

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
		: t('hoursShort', { count: hours })
}
