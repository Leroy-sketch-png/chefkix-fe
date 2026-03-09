'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Users, Eye, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getFriendsActiveRooms } from '@/services/cookingRoom'
import type { FriendsActiveRoom } from '@/lib/types/room'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

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
	const router = useRouter()
	const [rooms, setRooms] = useState<FriendsActiveRoom[]>([])
	const [isLoading, setIsLoading] = useState(true)

	const fetchRooms = useCallback(async () => {
		try {
			const response = await getFriendsActiveRooms()
			if (response.success && response.data) {
				setRooms(response.data)
			}
		} catch {
			// Silently fail — this is a non-critical widget
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchRooms()
		const interval = setInterval(() => {
			// Don't poll when tab is hidden
			if (!document.hidden) fetchRooms()
		}, pollInterval)
		return () => clearInterval(interval)
	}, [fetchRooms, pollInterval])

	// Don't render anything if no friends are cooking
	if (!isLoading && rooms.length === 0) return null

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
				<h3 className='text-sm font-bold text-text'>Friends Cooking Now</h3>
				<span className='ml-auto flex size-5 items-center justify-center rounded-full bg-brand/15 text-[10px] font-bold text-brand'>
					{rooms.length}
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
									Cooking{' '}
									<span className='font-medium text-text'>
										{room.recipeTitle}
									</span>
								</p>
								<p className='text-[10px] text-text-muted'>
									Started {formatMinutesAgo(room.startedMinutesAgo)} ago
									{' · '}
									<Users className='mb-0.5 inline size-3' />{' '}
									{room.participantCount}
								</p>
							</div>

							<div className='flex shrink-0 gap-1'>
								<button
									onClick={() =>
										router.push(
											`/cook-together?roomCode=${room.roomCode}&role=SPECTATOR`,
										)
									}
									className='flex items-center gap-1 rounded-lg bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-elevated/80 hover:text-text'
									title='Watch'
									aria-label={`Watch ${formatParticipantNames(room.participantNames)} cook`}
								>
									<Eye className='size-3' />
									Watch
								</button>
								<button
									onClick={() =>
										router.push(`/cook-together?roomCode=${room.roomCode}`)
									}
									className='flex items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20'
									title='Join as cook'
									aria-label={`Join ${formatParticipantNames(room.participantNames)} to cook ${room.recipeTitle}`}
								>
									<ArrowRight className='size-3' />
									Join
								</button>
							</div>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</motion.div>
	)
}

// ── Helpers ──

function formatParticipantNames(names: string[]): string {
	if (names.length <= 2) return names.join(' & ')
	return `${names[0]}, ${names[1]} +${names.length - 2}`
}

function formatMinutesAgo(minutes: number): string {
	if (minutes < 1) return 'just now'
	if (minutes < 60) return `${minutes}m`
	const hours = Math.floor(minutes / 60)
	const remaining = minutes % 60
	return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}
