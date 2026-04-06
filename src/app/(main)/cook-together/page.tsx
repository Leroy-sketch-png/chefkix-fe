'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from '@/i18n/hooks'
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
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { TRANSITION_SPRING } from '@/lib/motion'
import { useCookingStore } from '@/store/cookingStore'
import { toast } from 'sonner'

function CookTogetherContent() {
	const router = useRouter()
	const t = useTranslations('cooking')
	const searchParams = useSearchParams()
	const [roomCodeInput, setRoomCodeInput] = useState('')
	const [isJoining, setIsJoining] = useState(false)
	const [copied, setCopied] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const { roomCode, isInRoom, joinRoom } = useCookingStore()

	// Clean up copy timer on unmount
	useEffect(() => {
		return () => {
			if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
		}
	}, [])

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
			let cancelled = false
			const autoJoin = async () => {
				setIsJoining(true)
				try {
					const success = await joinRoom(
						urlRoomCode.toUpperCase(),
						urlRole || undefined,
					)
					if (cancelled) return
					if (success) {
						toast.success(
							urlRole === 'SPECTATOR'
								? t('ctWatching')
								: t('toastJoinedRoom'),
						)
						router.push('/cook-together/room')
					} else {
						toast.error(t('toastJoinRoomFull'))
					}
				} catch {
					if (!cancelled) toast.error(t('toastJoinRoomFailed'))
				} finally {
					if (!cancelled) setIsJoining(false)
				}
			}
			autoJoin()
			return () => {
				cancelled = true
			}
		}
	}, [searchParams, isInRoom, isJoining, joinRoom, router, t])

	// Auto-focus the input on mount
	useEffect(() => {
		if (!searchParams.get('roomCode')) {
			inputRef.current?.focus()
		}
	}, [searchParams])

	const handleJoin = useCallback(async () => {
		const code = roomCodeInput.trim().toUpperCase()
		if (!code || code.length < 6) {
			toast.error(t('toastInvalidRoomCode'))
			return
		}

		setIsJoining(true)
		try {
			const success = await joinRoom(code)
			if (success) {
				toast.success(t('toastJoinedRoom'))
				router.push('/cook-together/room')
			} else {
				toast.error(t('toastJoinCheckCode'))
			}
		} catch {
			toast.error(t('toastJoinRoomFailed'))
		} finally {
			setIsJoining(false)
		}
	}, [roomCodeInput, joinRoom, router, t])

	const handleCopyRoomCode = useCallback(async () => {
		if (!roomCode) return
		try {
			await navigator.clipboard.writeText(roomCode)
			setCopied(true)
			toast.success(t('toastRoomCodeCopied'))
			copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
		} catch {
			toast.error(t('toastCopyFailed'))
		}
	}, [roomCode, t])

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
				<PageHeader
					icon={Users}
					title={t('ctTitle')}
					subtitle={t('ctSubtitle')}
					gradient='orange'
				/>

				<AnimatePresence>
					{roomCode && (
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
										type='button'
										onClick={handleCopyRoomCode}
										className='flex items-center gap-2 rounded-xl bg-bg-card px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-bg-elevated'
									>
										{copied ? (
											<Check className='size-4 text-success' />
										) : (
											<Copy className='size-4' />
										)}
										{copied ? t('ctCopied') : t('ctShareCode')}
									</button>
									<button
										type='button'
										onClick={() => router.push('/cook-together/room')}
										className='flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90'
									>
									{t('ctReturnToRoom')}
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
						<div className='flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-info to-accent-purple'>
							<Share2 className='size-5 text-white' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-text'>
								{t('ctJoinRoom')}
							</h2>
							<p className='text-sm text-text-secondary'>
								{t('ctJoinRoomDesc')}
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
							placeholder={t('ctRoomCodePlaceholder')}
							maxLength={6}
							aria-label={t('ctRoomCodeLabel')}
							className='flex-1 rounded-xl border border-border-subtle bg-bg px-4 py-3 font-mono text-xl tracking-widest text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
							disabled={isJoining}
						/>
						<button
							type='button'
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
							{isJoining ? t('ctJoining') : t('ctJoin')}
						</button>
					</div>

					<p className='mt-3 text-xs text-text-muted'>
						{t('ctRoomCodeHint')}
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
						<div className='flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning to-streak'>
							<Sparkles className='size-5 text-white' />
						</div>
						<h2 className='text-xl font-bold text-text'>{t('ctHowItWorks')}</h2>
					</div>

					<div className='grid gap-4 md:grid-cols-3'>
						{[
							{
								step: '1',
								title: t('ctStep1Title'),
								desc: t('ctStep1Desc'),
							},
							{
								step: '2',
								title: t('ctStep2Title'),
								desc: t('ctStep2Desc'),
							},
							{
								step: '3',
								title: t('ctStep3Title'),
							desc: t('ctStep3Desc'),
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

function CookTogetherSkeleton() {
	return (
		<PageContainer maxWidth='lg'>
			<div className='space-y-6'>
				{/* Header */}
				<div className='text-center space-y-2'>
					<Skeleton className='mx-auto h-8 w-48' />
					<Skeleton className='mx-auto h-5 w-72' />
				</div>
				{/* Create room card */}
				<Skeleton className='h-32 w-full rounded-2xl' />
				{/* Room cards */}
				<div className='grid gap-4 sm:grid-cols-2'>
					{[1, 2, 3, 4].map(i => (
						<div
							key={i}
							className='rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3'
						>
							<div className='flex items-center gap-3'>
								<Skeleton className='size-10 rounded-full' />
								<Skeleton className='h-5 w-32' />
							</div>
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-10 w-full rounded-xl' />
						</div>
					))}
				</div>
			</div>
		</PageContainer>
	)
}

export default function CookTogetherPage() {
	return (
		<Suspense fallback={<CookTogetherSkeleton />}>
			<CookTogetherContent />
		</Suspense>
	)
}
