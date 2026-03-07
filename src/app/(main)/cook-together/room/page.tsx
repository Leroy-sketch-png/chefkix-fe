'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Copy, Check, LogOut, ChefHat, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import { useCookingStore } from '@/store/cookingStore'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useRoomSocket } from '@/hooks/useRoomSocket'
import { RoomParticipantsBar } from '@/components/cooking/RoomParticipantsBar'
import type { RoomEvent } from '@/lib/types/room'
import { toast } from 'sonner'

export default function CookingRoomPage() {
	const router = useRouter()
	const [copied, setCopied] = useState(false)
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
	} = useCookingStore()

	// Redirect if not in a room
	useEffect(() => {
		if (!isInRoom || !roomCode) {
			router.replace('/cook-together')
		}
	}, [isInRoom, roomCode, router])

	// Handle incoming room events
	const onRoomEvent = useCallback(
		(event: RoomEvent) => {
			handleRoomEvent(event)

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
		[handleRoomEvent, currentUserId, router],
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
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-8'
				>
					<div className='mb-2 flex items-center gap-3'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, ...TRANSITION_SPRING }}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-orange-500 shadow-md'
						>
							<Users className='size-6 text-white' />
						</motion.div>
						<div>
							<h1 className='text-3xl font-bold text-text'>Cooking Room</h1>
							<div className='flex items-center gap-2 text-text-secondary'>
								<span className='font-mono text-lg font-bold tracking-widest text-brand'>
									{roomCode}
								</span>
								<span>•</span>
								<span
									className={`flex items-center gap-1 text-sm ${isConnected ? 'text-success' : 'text-text-muted'}`}
								>
									<span
										className={`inline-block size-2 rounded-full ${isConnected ? 'bg-success' : 'bg-text-muted'}`}
									/>
									{isConnected ? 'Connected' : 'Connecting...'}
								</span>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Room Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, ...TRANSITION_SPRING }}
					className='rounded-radius border border-border-subtle bg-bg-card p-6 shadow-card md:p-8'
				>
					{/* Recipe Info */}
					{recipe && (
						<div className='mb-6 flex items-center gap-4'>
							<div className='flex size-14 items-center justify-center rounded-2xl bg-brand/10'>
								<ChefHat className='size-7 text-brand' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-text'>{recipe.title}</h2>
								<p className='text-sm text-text-secondary'>
									{totalSteps} steps • {recipe.totalTimeMinutes ?? 0} min
								</p>
							</div>
						</div>
					)}

					{/* Participants */}
					<div className='mb-6'>
						<h3 className='mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted'>
							Participants ({participants.length}/6)
						</h3>
						<div className='space-y-3'>
							{participants.map(p => (
								<motion.div
									key={p.userId}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									className='flex items-center gap-3 rounded-xl bg-bg p-3'
								>
									{p.avatarUrl ? (
										<img
											src={p.avatarUrl}
											alt={p.displayName}
											className='size-10 rounded-full object-cover'
										/>
									) : (
										<div className='flex size-10 items-center justify-center rounded-full bg-brand/10'>
											<ChefHat className='size-5 text-brand' />
										</div>
									)}
									<div className='flex-1'>
										<div className='flex items-center gap-2'>
											<span className='font-medium text-text'>
												{p.displayName}
											</span>
											{p.isHost && (
												<span className='rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700'>
													Host
												</span>
											)}
											{p.userId === currentUserId && (
												<span className='rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand'>
													You
												</span>
											)}
										</div>
										<p className='text-xs text-text-muted'>
											Step {p.currentStep} of {totalSteps}
										</p>
									</div>
									{/* Progress */}
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
								</motion.div>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className='flex gap-3'>
						<motion.button
							onClick={handleStartCooking}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-hero py-4 text-lg font-bold text-white shadow-lg shadow-brand/30'
						>
							<ChefHat className='size-6' />
							{session ? 'Continue Cooking' : 'Start Cooking'}
						</motion.button>

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
			</PageContainer>
		</PageTransition>
	)
}
