'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/i18n/hooks'
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
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import { useCookingStore } from '@/store/cookingStore'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useRoomSocket } from '@/hooks/useRoomSocket'
import type { RoomEvent } from '@/lib/types/room'
import { toast } from 'sonner'
import {
	PremiumSurface,
	SurfaceSectionHeader,
} from '@/components/layout/PremiumSurface'

interface ActivityItem {
	id: string
	text: string
	emoji: string
	timestamp: number
}

export default function CookingRoomPage() {
	const router = useRouter()
	const t = useTranslations('cooking')
	const [copied, setCopied] = useState(false)
	const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])
	const [isUpgrading, setIsUpgrading] = useState(false)
	const [storeHydrated, setStoreHydrated] = useState(() =>
		useCookingStore.persist.hasHydrated(),
	)
	const activityEndRef = useRef<HTMLDivElement>(null)
	const { openCookingPanel, expandCookingPanel } = useUiStore()
	const currentUserId = useAuthStore(s => s.user?.userId)
	const authHydrated = useAuthStore(s => s.isHydrated)

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

	useEffect(() => {
		if (storeHydrated) {
			return
		}

		const unsubscribe = useCookingStore.persist.onFinishHydration(() => {
			setStoreHydrated(true)
		})

		return unsubscribe
	}, [storeHydrated])

	// Redirect if not in a room
	useEffect(() => {
		if (!authHydrated || !storeHydrated) {
			return
		}
		if (!isInRoom || !roomCode) {
			router.replace('/cook-together')
		}
	}, [authHydrated, isInRoom, roomCode, router, storeHydrated])

	// Auto-scroll activity feed
	useEffect(() => {
		activityEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [activityFeed])

	// Map room events to activity feed items
	const eventToActivity = useCallback(
		(event: RoomEvent): ActivityItem | null => {
			if (event.userId === currentUserId) return null // Skip own events
			const name = event.displayName || t('ctSomeone')
			switch (event.type) {
				case 'STEP_NAVIGATED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: t('ctActivityStepNav', {
							name,
							step: String(event.data?.stepNumber ?? '?'),
						}),
						emoji: '👣',
						timestamp: Date.now(),
					}
				case 'STEP_COMPLETED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: t('ctActivityStepDone', {
							name,
							step: String(event.data?.stepNumber ?? '?'),
						}),
						emoji: '✅',
						timestamp: Date.now(),
					}
				case 'TIMER_STARTED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: t('ctActivityTimerStart', { name }),
						emoji: '⏱️',
						timestamp: Date.now(),
					}
				case 'TIMER_COMPLETED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: t('ctActivityTimerDone', { name }),
						emoji: '🔔',
						timestamp: Date.now(),
					}
				case 'SESSION_COMPLETED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: t('ctActivityFinished', { name }),
						emoji: '🎉',
						timestamp: Date.now(),
					}
				case 'PARTICIPANT_JOINED':
					return {
						id: `${event.type}-${Date.now()}`,
						text: t('ctActivityJoined', { name }),
						emoji: '👋',
						timestamp: Date.now(),
					}
				case 'PARTICIPANT_LEFT':
					return {
						id: `${event.type}-${Date.now()}`,
						text: t('ctActivityLeft', { name }),
						emoji: '🚪',
						timestamp: Date.now(),
					}
				case 'REACTION': {
					const emoji = (event.data?.emoji as string) || '👍'
					return {
						id: `${event.type}-${Date.now()}`,
						text: t('ctActivityReacted', { name, emoji }),
						emoji,
						timestamp: Date.now(),
					}
				}
				default:
					return null
			}
		},
		[currentUserId, t],
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
						toast.success(t('ctToastJoined', { name: event.displayName }))
					}
					break
				case 'PARTICIPANT_LEFT':
					if (event.userId !== currentUserId) {
						toast(t('ctToastLeft', { name: event.displayName }))
					}
					break
				case 'HOST_TRANSFERRED':
					if (event.data?.newHostUserId === currentUserId) {
						toast.success(t('ctToastNowHost'))
					}
					break
				case 'ROOM_DISSOLVED':
					toast(t('ctToastRoomDissolved'))
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
		[handleRoomEvent, currentUserId, router, eventToActivity, t],
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
		toast.success(t('toastRoomCodeCopied'))
		setTimeout(() => setCopied(false), 2000)
	}, [roomCode, t])

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
				toast.success(t('ctToastNowCooking'))
			} else {
				toast.error(t('toastJoinCookFailed'))
				router.replace('/cook-together')
			}
		} catch {
			toast.error(t('toastUpgradeCookFailed'))
		} finally {
			setIsUpgrading(false)
		}
	}, [roomCode, isUpgrading, leaveRoom, joinRoom, router, t])

	const handleLeave = useCallback(async () => {
		await leaveRoom()
		router.replace('/cook-together')
	}, [leaveRoom, router])

	if (!authHydrated || !storeHydrated) {
		return null
	}

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
									{t('ctWatchingBanner')}
								</span>
							</div>
							<motion.button
								type='button'
								onClick={handleUpgradeToCook}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								disabled={isUpgrading}
								className='flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-sm font-bold text-white shadow-card transition-all hover:bg-brand/90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
							>
								<ArrowUpCircle className='size-4' />
								{isUpgrading ? t('ctJoining') : t('ctJoinAsCook')}
							</motion.button>
						</motion.div>
					)}
				</AnimatePresence>

				<PremiumSurface
					eyebrow='Room Session'
					chipText={roomCode}
					tone='streak'
					className='mb-8 p-3 md:p-4'
				>
					<div className='flex flex-col gap-4'>
						<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
							<div className='flex min-w-0 items-start gap-3'>
								<motion.button
									type='button'
									onClick={() => router.push('/cook-together')}
									whileTap={BUTTON_TAP}
									className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
									aria-label={t('ctLeave')}
								>
									<LogOut className='size-4' />
								</motion.button>
								<div className='grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-[0_2px_8px_rgba(255,90,54,0.35)]'>
									<Users className='size-5' />
								</div>
								<div className='min-w-0'>
									<h1 className='truncate text-xl font-bold tracking-tight text-text-primary md:text-2xl'>
										{t('ctCookingRoom')}
									</h1>
									<p className='mt-0.5 text-sm text-text-secondary'>
										{t('ctRoomCode', { code: roomCode })}
									</p>
								</div>
							</div>

							<div className='inline-flex h-9 items-center rounded-xl border border-border-subtle bg-bg-card px-3 text-sm font-semibold text-text-primary'>
								{roomCode}
							</div>
						</div>

						<div className='flex flex-wrap items-center gap-2'>
							<span
								className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ${isConnected ? 'bg-success/12 text-success' : 'bg-bg-elevated text-text-muted'}`}
							>
								<span
									className={`inline-block size-1.5 rounded-full ${isConnected ? 'bg-success' : 'bg-text-muted'}`}
								/>
								{isConnected ? t('ctConnected') : t('ctConnecting')}
							</span>
							<span className='inline-flex h-7 items-center gap-1 rounded-full bg-brand/10 px-2.5 text-xs font-semibold text-brand'>
								<ChefHat className='size-3.5' />
								{t('ctCooksCount', { count: cookCount })}
							</span>
							{spectatorCount > 0 && (
								<span className='inline-flex h-7 items-center gap-1 rounded-full bg-info/12 px-2.5 text-xs font-semibold text-info'>
									<Eye className='size-3.5' />
									{t('ctWatchingCount', { count: spectatorCount })}
								</span>
							)}
						</div>
					</div>
				</PremiumSurface>

				<div className='grid gap-6 lg:grid-cols-3'>
					{/* Room Card — Main column */}
					<PremiumSurface
						eyebrow='Cook Controls'
						chipText={isSpectator ? 'Watching' : 'Cooking'}
						className='p-0 lg:col-span-2'
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1, ...TRANSITION_SPRING }}
							className='rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card md:p-8'
						>
							{/* Recipe Info */}
							{recipe && (
								<div className='mb-6 flex items-center gap-4'>
									<div className='flex size-14 items-center justify-center rounded-2xl bg-brand/10'>
										<ChefHat className='size-7 text-brand' />
									</div>
									<div>
										<h2 className='text-xl font-bold text-text-primary'>
											{recipe.title}
										</h2>
										<p className='text-sm text-text-secondary'>
											{t('ctRecipeInfo', {
												steps: totalSteps,
												minutes: recipe.totalTimeMinutes ?? 0,
											})}
										</p>
									</div>
								</div>
							)}

							{/* Participants */}
							<div className='mb-6'>
								<h3 className='mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted'>
									{t('ctCooksCount', { count: cookCount })}
									{spectatorCount > 0 && (
										<span className='ml-2 font-normal normal-case text-info'>
											{t('ctPlusSpectators', { count: spectatorCount })}
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
														<span className='font-medium text-text-primary'>
															{p.displayName}
														</span>
														{p.isHost && (
															<span className='rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning'>
																{t('ctHost')}
															</span>
														)}
														{pIsSpectator && (
															<span className='rounded-full bg-info/15 px-2 py-0.5 text-xs font-medium text-info'>
																{t('ctWatchingBadge')}
															</span>
														)}
														{p.userId === currentUserId && (
															<span className='rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand'>
																{t('ctYou')}
															</span>
														)}
													</div>
													<p className='text-xs text-text-muted'>
														{pIsSpectator
															? t('ctSpectating')
															: t('ctStepOf', {
																	current: p.currentStep,
																	total: totalSteps,
																})}
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
										type='button'
										onClick={handleUpgradeToCook}
										disabled={isUpgrading}
										whileHover={BUTTON_HOVER}
										whileTap={BUTTON_TAP}
										className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-info py-4 text-lg font-bold text-white shadow-[0_2px_8px_rgba(14,165,233,0.35)] transition-all hover:bg-info/90 hover:shadow-[0_4px_16px_rgba(14,165,233,0.4)] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
									>
										<ArrowUpCircle className='size-6' />
										{isUpgrading ? t('ctJoining') : t('ctJoinAsCook')}
									</motion.button>
								) : (
									<motion.button
										type='button'
										onClick={handleStartCooking}
										whileHover={BUTTON_HOVER}
										whileTap={BUTTON_TAP}
										className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-[0_2px_8px_rgba(255,90,54,0.35)] transition-all hover:bg-brand/90 hover:shadow-[0_4px_16px_rgba(255,90,54,0.4)] focus-visible:ring-2 focus-visible:ring-brand/50'
									>
										<ChefHat className='size-6' />
										{session ? t('ctContinueCooking') : t('ctStartCooking')}
									</motion.button>
								)}

								<motion.button
									type='button'
									onClick={handleCopyCode}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex items-center gap-2 rounded-xl border-2 border-border-medium px-5 py-4 font-semibold transition-all hover:border-brand hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									{copied ? (
										<Check className='size-5 text-success' />
									) : (
										<Copy className='size-5' />
									)}
									<span className='hidden sm:inline'>
										{copied ? t('ctCopied') : t('ctShare')}
									</span>
								</motion.button>

								<motion.button
									type='button'
									onClick={handleLeave}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex items-center gap-2 rounded-xl border-2 border-error/30 px-5 py-4 font-semibold text-error transition-all hover:border-error hover:bg-error/5 focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<LogOut className='size-5' />
									<span className='hidden sm:inline'>{t('ctLeave')}</span>
								</motion.button>
							</div>
						</motion.div>
					</PremiumSurface>

					{/* Live Activity Feed — Side panel */}
					<PremiumSurface
						eyebrow='Activity Feed'
						chipText={isConnected ? 'Live' : 'Reconnecting'}
						className='p-0 lg:col-span-1 lg:sticky lg:top-24 lg:self-start'
						tone='blue'
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, ...TRANSITION_SPRING }}
							className='rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card'
						>
							<SurfaceSectionHeader
								eyebrow='Room Events'
								chipText={`${activityFeed.length} events`}
								className='mb-3'
							/>
							<div className='mb-3 flex items-center gap-2'>
								<Activity className='size-4 text-brand' />
								<h3 className='text-sm font-semibold uppercase tracking-wider text-text-muted'>
									{t('ctLiveActivity')}
								</h3>
								{isConnected && (
									<span className='ml-auto inline-block size-2 animate-pulse rounded-full bg-success' />
								)}
							</div>
							<div className='max-h-80 space-y-2 overflow-y-auto pr-1 lg:max-h-[28rem]'>
								{activityFeed.length === 0 ? (
									<p className='py-8 text-center text-sm text-text-muted'>
										{t('ctWaitingActivity')}
									</p>
								) : (
									activityFeed.map(item => (
										<motion.div
											key={item.id}
											initial={{ opacity: 0, x: 10 }}
											animate={{ opacity: 1, x: 0 }}
											className='flex items-start gap-2 rounded-xl bg-bg px-3 py-2'
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
					</PremiumSurface>
				</div>

				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
