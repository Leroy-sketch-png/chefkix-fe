'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Users,
	Copy,
	Check,
	LogOut,
	ChefHat,
	Eye,
	Activity,
	ArrowUpCircle,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import { useCookingStore } from '@/store/cookingStore'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useRoomSocket } from '@/hooks/useRoomSocket'
import type { RoomEvent } from '@/lib/types/room'
import { toast } from 'sonner'

interface ActivityItem {
	id: string
	text: string
	emoji: string
	timestamp: number
}

export default function CookingRoomPage() {
	const router = useRouter()
	const [copied, setCopied] = useState(false)
	const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])
	const [isUpgrading, setIsUpgrading] = useState(false)
	const activityEndRef = useRef<HTMLDivElement>(null)
	const { openCookingPanel, expandCookingPanel } = useUiStore()
	const currentUserId = useAuthStore(s => s.user?.userId)

	const {
		roomCode,
		participants,
		isInRoom,
		isHost,
		recipe,
		session,
		leaveRoom,
		handleRoomEvent,
		joinRoom,
	} = useCookingStore()

	// Derive spectator status from participants list
	const currentParticipant = participants.find(p => p.userId === currentUserId)
	const isSpectator = currentParticipant?.role === 'SPECTATOR'
	const cookCount = participants.filter(p => p.role !== 'SPECTATOR').length
	const spectatorCount = participants.filter(p => p.role === 'SPECTATOR').length

	// Redirect if not in a room
	useEffect(() => {
		if (!isInRoom || !roomCode) {
			router.replace('/cook-together')
		}
	}, [isInRoom, roomCode, router])

	// Auto-scroll activity feed
	useEffect(() => {
		activityEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [activityFeed])

	// Map room events to activity feed items
	const eventToActivity = useCallback(
		(event: RoomEvent): ActivityItem | null => {
			if (event.userId === currentUserId) return null // Skip own events
			const name = event.displayName || 'Someone'
			switch (event.type) {
				case 'STEP_NAVIGATED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: `${name} moved to step ${event.data?.stepNumber ?? '?'}`,
						emoji: '👣',
						timestamp: Date.now(),
					}
				case 'STEP_COMPLETED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: `${name} completed step ${event.data?.stepNumber ?? '?'}`,
						emoji: '✅',
						timestamp: Date.now(),
					}
				case 'TIMER_STARTED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: `${name} started a timer`,
						emoji: '⏱️',
						timestamp: Date.now(),
					}
				case 'TIMER_COMPLETED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: `${name}'s timer is done!`,
						emoji: '🔔',
						timestamp: Date.now(),
					}
				case 'SESSION_COMPLETED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: `${name} finished cooking!`,
						emoji: '🎉',
						timestamp: Date.now(),
					}
				case 'PARTICIPANT_JOINED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: `${name} joined the room`,
						emoji: '👋',
						timestamp: Date.now(),
					}
				case 'PARTICIPANT_LEFT':
					return {
						id: `${event.type}-${Date.now()}`,
						text: `${name} left the room`,
						emoji: '🚪',
						timestamp: Date.now(),
					}
				case 'REACTION': {
					const emoji = (event.data?.emoji as string) || '👍'
					return {
						id: `${event.type}-${Date.now()}`,
						text: `${name} reacted ${emoji}`,
						emoji,
						timestamp: Date.now(),
					}
				}
				default:
					return null
			}
		},
		[currentUserId],
	)

	// Handle incoming room events
	const onRoomEvent = useCallback(
		(event: RoomEvent) => {
			handleRoomEvent(event)

			// Add to activity feed
			const activity = eventToActivity(event)
			if (activity) {
				setActivityFeed(prev => [...prev.slice(-49), activity]) // Keep last 50
			}

			// Show toast for certain events
			switch (event.type) {
				case 'PARTICIPANT_JOINED':
					if (event.userId !== currentUserId) {
						toast.success(`${event.displayName} joined the room!`)
					}
					break
				case 'PARTICIPANT_LEFT':
					if (event.userId !== currentUserId) {
						toast(`${event.displayName} left the room`)
					}
					break
				case 'HOST_TRANSFERRED':
					if (event.data?.newHostUserId === currentUserId) {
						toast.success("You're now the host!")
					}
					break
				case 'ROOM_DISSOLVED':
					toast('Room has been dissolved')
					router.replace('/cook-together')
					break
				case 'REACTION': {
					const emoji = event.data?.emoji as string
					if (emoji && event.userId !== currentUserId) {
						toast(`${event.displayName}: ${emoji}`, { duration: 2000 })
					}
					break
				}
			}
		},
		[handleRoomEvent, currentUserId, router, eventToActivity],
	)

	// WebSocket connection
	const { isConnected } = useRoomSocket({
		roomCode,
		onEvent: onRoomEvent,
		enabled: isInRoom,
	})

	const handleCopyCode = useCallback(async () => {
		if (!roomCode) return
		await navigator.clipboard.writeText(roomCode)
		setCopied(true)
		toast.success('Room code copied!')
		setTimeout(() => setCopied(false), 2000)
	}, [roomCode])

	const handleStartCooking = useCallback(() => {
		const isDesktop = window.innerWidth >= 1280
		isDesktop ? openCookingPanel() : expandCookingPanel()
	}, [openCookingPanel, expandCookingPanel])

	const handleUpgradeToCook = useCallback(async () => {
		if (!roomCode || isUpgrading) return
		setIsUpgrading(true)
		try {
			// Leave as spectator and rejoin as cook
			await leaveRoom()
			const success = await joinRoom(roomCode, 'COOK')
			if (success) {
				toast.success("You're now cooking!")
			} else {
				toast.error('Failed to join as cook')
				router.replace('/cook-together')
			}
		} catch {
			toast.error('Failed to upgrade to cook')
		} finally {
			setIsUpgrading(false)
		}
	}, [roomCode, isUpgrading, leaveRoom, joinRoom, router])

	const handleLeave = useCallback(async () => {
		await leaveRoom()
		router.replace('/cook-together')
	}, [leaveRoom, router])

	if (!isInRoom || !roomCode) {
		return null // Redirect will happen via useEffect
	}

	const totalSteps = recipe?.steps?.length ?? session?.totalSteps ?? 0

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Spectator Banner */}
				<AnimatePresence>
					{isSpectator && (
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className='mb-4 flex items-center justify-between rounded-xl border border-info/20 bg-gradient-to-r from-info/10 to-bg-card px-4 py-3'
						>
							<div className='flex items-center gap-2'>
								<Eye className='size-5 text-info' />
								<span className='text-sm font-semibold text-info'>
									You&apos;re watching this session
								</span>
							</div>
							<motion.button
								onClick={handleUpgradeToCook}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								disabled={isUpgrading}
								className='flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-white shadow-card transition-all hover:bg-brand/90 disabled:opacity-50'
							>
								<ArrowUpCircle className='size-4' />
								{isUpgrading ? 'Joining...' : 'Join as Cook'}
							</motion.button>
						</motion.div>
					)}
				</AnimatePresence>

			{/* Header with PageHeader */}
				<div className='mb-8'>
					<PageHeader
						icon={Users}
						title='Cooking Room'
						subtitle={`Room ${roomCode}`}
						gradient='orange'
						marginBottom='sm'
						showSparkles={false}
						showBack
					/>
					{/* Connection status row */}
					<div className='mt-2 flex items-center gap-2 text-text-secondary'>
						<span
							className={`flex items-center gap-1 text-sm ${isConnected ? 'text-success' : 'text-text-muted'}`}
						>
							<span
								className={`inline-block size-2 rounded-full ${isConnected ? 'bg-success' : 'bg-text-muted'}`}
							/>
							{isConnected ? 'Connected' : 'Connecting...'}
						</span>
						{spectatorCount > 0 && (
							<>
								<span>•</span>
								<span className='flex items-center gap-1 text-sm text-info'>
									<Eye className='size-3.5' />
									{spectatorCount} watching
								</span>
							</>
						)}
					</div>
				</div>

				<div className='grid gap-6 lg:grid-cols-3'>
					{/* Room Card — Main column */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, ...TRANSITION_SPRING }}
						className='rounded-radius border border-border-subtle bg-bg-card p-6 shadow-card md:p-8 lg:col-span-2'
					>
						{/* Recipe Info */}
						{recipe && (
							<div className='mb-6 flex items-center gap-4'>
								<div className='flex size-14 items-center justify-center rounded-2xl bg-brand/10'>
									<ChefHat className='size-7 text-brand' />
								</div>
								<div>
									<h2 className='text-xl font-bold text-text'>
										{recipe.title}
									</h2>
									<p className='text-sm text-text-secondary'>
										{totalSteps} steps • {recipe.totalTimeMinutes ?? 0} min
									</p>
								</div>
							</div>
						)}

						{/* Participants */}
						<div className='mb-6'>
							<h3 className='mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted'>
								Cooks ({cookCount}/6)
								{spectatorCount > 0 && (
									<span className='ml-2 font-normal normal-case text-info'>
										+ {spectatorCount} spectator
										{spectatorCount > 1 ? 's' : ''}
									</span>
								)}
							</h3>
							<div className='space-y-3'>
								{participants.map(p => {
									const pIsSpectator = p.role === 'SPECTATOR'
									return (
										<motion.div
											key={p.userId}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											className={`flex items-center gap-3 rounded-xl p-3 ${
												pIsSpectator
													? 'border border-info/20 bg-info/10'
													: 'bg-bg'
											}`}
										>
											<div className='relative'>
												{p.avatarUrl ? (
													<Image
														src={p.avatarUrl}
														alt={p.displayName}
														width={40}
														height={40}
														unoptimized
														className={`size-10 rounded-full object-cover ${pIsSpectator ? 'opacity-75' : ''}`}
													/>
												) : (
													<div
														className={`flex size-10 items-center justify-center rounded-full ${
															pIsSpectator ? 'bg-info/15' : 'bg-brand/10'
														}`}
													>
														{pIsSpectator ? (
															<Eye className='size-5 text-info' />
														) : (
															<ChefHat className='size-5 text-brand' />
														)}
													</div>
												)}
											</div>
											<div className='flex-1'>
												<div className='flex items-center gap-2'>
													<span className='font-medium text-text'>
														{p.displayName}
													</span>
													{p.isHost && (
														<span className='rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning'>
															Host
														</span>
													)}
													{pIsSpectator && (
														<span className='rounded-full bg-info/15 px-2 py-0.5 text-xs font-medium text-info'>
															Watching
														</span>
													)}
													{p.userId === currentUserId && (
														<span className='rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand'>
															You
														</span>
													)}
												</div>
												<p className='text-xs text-text-muted'>
													{pIsSpectator
														? 'Spectating'
														: `Step ${p.currentStep} of ${totalSteps}`}
												</p>
											</div>
											{/* Progress — only for cooks */}
											{!pIsSpectator && (
												<div className='text-right'>
													<div className='h-1.5 w-16 overflow-hidden rounded-full bg-border-subtle'>
														<div
															className='h-full rounded-full bg-brand transition-all duration-500'
															style={{
																width: `${totalSteps > 0 ? (p.currentStep / totalSteps) * 100 : 0}%`,
															}}
														/>
													</div>
												</div>
											)}
										</motion.div>
									)
								})}
							</div>
						</div>

						{/* Actions */}
						<div className='flex gap-3'>
							{isSpectator ? (
								<motion.button
									onClick={handleUpgradeToCook}
									disabled={isUpgrading}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-info to-accent-indigo py-4 text-lg font-bold text-white shadow-lg shadow-info/30 disabled:opacity-50'
								>
									<ArrowUpCircle className='size-6' />
									{isUpgrading ? 'Joining...' : 'Join as Cook'}
								</motion.button>
							) : (
								<motion.button
									onClick={handleStartCooking}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-hero py-4 text-lg font-bold text-white shadow-lg shadow-brand/30'
								>
									<ChefHat className='size-6' />
									{session ? 'Continue Cooking' : 'Start Cooking'}
								</motion.button>
							)}

							<motion.button
								onClick={handleCopyCode}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='flex items-center gap-2 rounded-xl border-2 border-border-medium px-5 py-4 font-semibold transition-all hover:border-brand hover:bg-brand/5'
							>
								{copied ? (
									<Check className='size-5 text-success' />
								) : (
									<Copy className='size-5' />
								)}
								<span className='hidden sm:inline'>
									{copied ? 'Copied' : 'Share'}
								</span>
							</motion.button>

							<motion.button
								onClick={handleLeave}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='flex items-center gap-2 rounded-xl border-2 border-error/30 px-5 py-4 font-semibold text-error transition-all hover:border-error hover:bg-error/5'
							>
								<LogOut className='size-5' />
								<span className='hidden sm:inline'>Leave</span>
							</motion.button>
						</div>
					</motion.div>

					{/* Live Activity Feed — Side panel */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, ...TRANSITION_SPRING }}
						className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card lg:col-span-1'
					>
						<div className='mb-3 flex items-center gap-2'>
							<Activity className='size-4 text-brand' />
							<h3 className='text-sm font-semibold uppercase tracking-wider text-text-muted'>
								Live Activity
							</h3>
							{isConnected && (
								<span className='ml-auto inline-block size-2 animate-pulse rounded-full bg-success' />
							)}
						</div>
						<div className='max-h-80 space-y-2 overflow-y-auto pr-1 lg:max-h-[28rem]'>
							{activityFeed.length === 0 ? (
								<p className='py-8 text-center text-sm text-text-muted'>
									Waiting for activity...
								</p>
							) : (
								activityFeed.map(item => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, x: 10 }}
										animate={{ opacity: 1, x: 0 }}
										className='flex items-start gap-2 rounded-lg bg-bg px-3 py-2'
									>
										<span className='text-base'>{item.emoji}</span>
										<span className='text-sm text-text-secondary'>
											{item.text}
										</span>
									</motion.div>
								))
							)}
							<div ref={activityEndRef} />
						</div>
					</motion.div>
				</div>
			</PageContainer>
		</PageTransition>
	)
}
