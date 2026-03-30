'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Users,
	ChefHat,
	Copy,
	Check,
	ArrowRight,
	Sparkles,
	Share2,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { TRANSITION_SPRING } from '@/lib/motion'
import { useCookingStore } from '@/store/cookingStore'
import { toast } from 'sonner'

export default function CookTogetherPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [roomCodeInput, setRoomCodeInput] = useState('')
	const [isJoining, setIsJoining] = useState(false)
	const [copied, setCopied] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	const { roomCode, isInRoom, joinRoom } = useCookingStore()

	// Auto-fill room code from URL params (invite deep link / Watch button)
	useEffect(() => {
		const urlRoomCode = searchParams.get('roomCode')
		if (urlRoomCode) {
			setRoomCodeInput(urlRoomCode.toUpperCase())
		}
	}, [searchParams])

	// Auto-join if roomCode param provided (from invite notification or Watch/Join button)
	useEffect(() => {
		const urlRoomCode = searchParams.get('roomCode')
		const urlRole = searchParams.get('role')
		if (urlRoomCode && !isInRoom && !isJoining) {
			const autoJoin = async () => {
				setIsJoining(true)
				try {
					const success = await joinRoom(
						urlRoomCode.toUpperCase(),
						urlRole || undefined,
					)
					if (success) {
						toast.success(
							urlRole === 'SPECTATOR'
								? 'Watching the cooking room!'
								: 'Joined the cooking room!',
						)
						router.push('/cook-together/room')
					} else {
						toast.error('Could not join room. It may be full or dissolved.')
					}
				} catch {
					toast.error('Failed to join room')
				} finally {
					setIsJoining(false)
				}
			}
			autoJoin()
		}
	}, [searchParams, isInRoom, isJoining, joinRoom, router])

	// Auto-focus the input on mount
	useEffect(() => {
		if (!searchParams.get('roomCode')) {
			inputRef.current?.focus()
		}
	}, [searchParams])

	const handleJoin = useCallback(async () => {
		const code = roomCodeInput.trim().toUpperCase()
		if (!code || code.length < 6) {
			toast.error('Please enter a valid 6-character room code')
			return
		}

		setIsJoining(true)
		try {
			const success = await joinRoom(code)
			if (success) {
				toast.success('Joined the cooking room!')
				router.push('/cook-together/room')
			} else {
				toast.error('Could not join room. Check the code and try again.')
			}
		} catch {
			toast.error('Failed to join room')
		} finally {
			setIsJoining(false)
		}
	}, [roomCodeInput, joinRoom, router])

	const handleCopyRoomCode = useCallback(async () => {
		if (!roomCode) return
		try {
			await navigator.clipboard.writeText(roomCode)
			setCopied(true)
			toast.success('Room code copied!')
			setTimeout(() => setCopied(false), 2000)
		} catch {
			toast.error('Failed to copy room code')
		}
	}, [roomCode])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter') {
				handleJoin()
			}
		},
		[handleJoin],
	)

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
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-orange-500 shadow-card'
						>
							<Users className='size-6 text-white' />
						</motion.div>
						<div>
							<h1 className='text-3xl font-bold text-text'>Cook Together</h1>
							<p className='text-text-secondary'>
								Cook the same recipe with friends in real-time
							</p>
						</div>
					</div>
				</motion.div>

				{/* Active Room Banner (if in a room) */}
				<AnimatePresence>
					{isInRoom && roomCode && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={TRANSITION_SPRING}
							className='mb-6 rounded-radius border border-brand/20 bg-brand/5 p-4 shadow-card md:p-6'
						>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<div className='flex size-10 items-center justify-center rounded-xl bg-brand/10'>
										<ChefHat className='size-5 text-brand' />
									</div>
									<div>
										<p className='text-sm font-medium text-text-secondary'>
											Your Active Room
										</p>
										<p className='font-mono text-2xl font-bold tracking-widest text-brand'>
											{roomCode}
										</p>
									</div>
								</div>
								<div className='flex gap-2'>
									<button
										onClick={handleCopyRoomCode}
										className='flex items-center gap-2 rounded-xl bg-bg-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-bg-elevated'
									>
										{copied ? (
											<Check className='size-4 text-success' />
										) : (
											<Copy className='size-4' />
										)}
										{copied ? 'Copied' : 'Share Code'}
									</button>
									<button
										onClick={() => router.push('/cook-together/room')}
										className='flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90'
									>
										Return to Room
										<ArrowRight className='size-4' />
									</button>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Join a Room Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, ...TRANSITION_SPRING }}
					className='group rounded-radius border border-border-subtle bg-bg-card p-6 shadow-card md:p-8'
				>
					<div className='mb-6 flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500'>
							<Share2 className='size-5 text-white' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-text'>
								Join a Cooking Room
							</h2>
							<p className='text-sm text-text-secondary'>
								Enter a room code shared by your friend
							</p>
						</div>
					</div>

					<div className='flex gap-3'>
						<input
							ref={inputRef}
							type='text'
							value={roomCodeInput}
							onChange={e =>
								setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))
							}
							onKeyDown={handleKeyDown}
							placeholder='ABCDEF'
							maxLength={6}
							aria-label='Room code'
							className='flex-1 rounded-xl border border-border-subtle bg-bg px-4 py-3 font-mono text-xl tracking-widest text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
							disabled={isJoining}
						/>
						<button
							onClick={handleJoin}
							disabled={isJoining || roomCodeInput.trim().length < 6}
							className='flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-medium text-white transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{isJoining ? (
								<motion.div
									animate={{ rotate: 360 }}
									transition={{
										duration: 1,
										repeat: Infinity,
										ease: 'linear',
									}}
								>
									<ChefHat className='size-5' />
								</motion.div>
							) : (
								<ArrowRight className='size-5' />
							)}
							{isJoining ? 'Joining...' : 'Join'}
						</button>
					</div>

					<p className='mt-3 text-xs text-text-muted'>
						Room codes are 6 characters. Ask your friend to share theirs from
						the cooking page.
					</p>
				</motion.div>

				{/* How It Works */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, ...TRANSITION_SPRING }}
					className='mt-6 rounded-radius border border-border-subtle bg-bg-card p-6 shadow-card md:p-8'
				>
					<div className='mb-6 flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500'>
							<Sparkles className='size-5 text-white' />
						</div>
						<h2 className='text-xl font-bold text-text'>How It Works</h2>
					</div>

					<div className='grid gap-4 md:grid-cols-3'>
						{[
							{
								step: '1',
								title: 'Start a Room',
								desc: 'Open any recipe and tap "Cook Together" to create a room with a unique code.',
							},
							{
								step: '2',
								title: 'Invite Friends',
								desc: 'Share the 6-character room code. Up to 6 people can join and cook the same recipe.',
							},
							{
								step: '3',
								title: 'Cook in Sync',
								desc: "See each other's progress, share reactions, and complete steps together in real-time.",
							},
						].map((item, i) => (
							<motion.div
								key={item.step}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: 0.3 + i * 0.1,
									...TRANSITION_SPRING,
								}}
								className='rounded-xl border border-border-subtle/50 bg-bg p-4'
							>
								<div className='mb-3 flex size-8 items-center justify-center rounded-lg bg-brand/10 font-bold text-brand'>
									{item.step}
								</div>
								<h3 className='mb-1 font-semibold text-text'>{item.title}</h3>
								<p className='text-sm text-text-secondary'>{item.desc}</p>
							</motion.div>
						))}
					</div>
				</motion.div>
			</PageContainer>
		</PageTransition>
	)
}
