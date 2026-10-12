'use client'

import {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
	Suspense,
} from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from '@/i18n/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import {
	ChefHat,
	Compass,
	Copy,
	Check,
	ArrowRight,
	Sparkles,
	Share2,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Skeleton } from '@/components/ui/skeleton'
import { TRANSITION_SPRING } from '@/lib/motion'
import { useCookingStore } from '@/store/cookingStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/clipboard'
import {
	getRoomCodeFromParams,
	isValidRoomCode,
	normalizeRoomCode,
} from '@/lib/room-code'
import {
	PremiumSurface,
	SurfaceSectionHeader,
} from '@/components/layout/PremiumSurface'

function CookTogetherContent() {
	const router = useRouter()
	const t = useTranslations('cooking')
	const searchParams = useSearchParams()
	const [roomCodeInput, setRoomCodeInput] = useState('')
	const [isJoining, setIsJoining] = useState(false)
	const [copied, setCopied] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const mountedRef = useRef(true)
	const autoJoinAttemptRef = useRef<string | null>(null)
	const inviteRoomCode = useMemo(
		() => getRoomCodeFromParams(searchParams),
		[searchParams],
	)
	const inviteRole =
		searchParams.get('role') === 'SPECTATOR' ? 'SPECTATOR' : undefined

	const { roomCode, isInRoom, joinRoom } = useCookingStore()
	const authHydrated = useAuthStore(s => s.isHydrated)

	// Clean up copy timer on unmount
	useEffect(() => {
		return () => {
			mountedRef.current = false
			if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
		}
	}, [])

	// Auto-fill room code from URL params (invite deep link / Watch button)
	useEffect(() => {
		if (inviteRoomCode) {
			setRoomCodeInput(inviteRoomCode)
		}
	}, [inviteRoomCode])

	// Auto-join if an invite code is provided (from notification or Watch/Join).
	useEffect(() => {
		const inviteKey = `${inviteRoomCode}:${inviteRole ?? 'COOK'}`
		if (!authHydrated) {
			return
		}
		if (
			isValidRoomCode(inviteRoomCode) &&
			!useCookingStore.getState().isInRoom &&
			autoJoinAttemptRef.current !== inviteKey
		) {
			autoJoinAttemptRef.current = inviteKey
			const autoJoin = async () => {
				setIsJoining(true)
				try {
					const success = await joinRoom(inviteRoomCode, inviteRole)
					if (!mountedRef.current) return
					if (success) {
						toast.success(
							inviteRole === 'SPECTATOR'
								? t('ctWatching')
								: t('toastJoinedRoom'),
						)
						router.push('/cook-together/room')
					} else {
						toast.error(t('toastJoinRoomFull'))
					}
				} catch {
					if (mountedRef.current) toast.error(t('toastJoinRoomFailed'))
				} finally {
					if (mountedRef.current) setIsJoining(false)
				}
			}
			void autoJoin()
		}
	}, [authHydrated, inviteRoomCode, inviteRole, joinRoom, router, t])

	// Auto-focus the input on mount
	useEffect(() => {
		if (!inviteRoomCode) {
			inputRef.current?.focus()
		}
	}, [inviteRoomCode])

	const handleJoin = useCallback(async () => {
		const code = normalizeRoomCode(roomCodeInput)
		if (!isValidRoomCode(code)) {
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
			if (!(await copyToClipboard(roomCode))) throw new Error('Copy failed')
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
			<PageContainer maxWidth='xl'>
				<AnimatePresence>
					{roomCode && (
						<PremiumSurface
							eyebrow={t('ctActiveRoomEyebrow')}
							chipText={roomCode}
							className='mb-6 p-3'
							tone='success'
						>
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={TRANSITION_SPRING}
								className='rounded-radius border border-brand/20 bg-brand/5 p-4 shadow-card md:p-6'
							>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className='flex size-10 items-center justify-center rounded-xl bg-brand/10'>
											<ChefHat className='size-5 text-brand' />
										</div>
										<div>
											<p className='text-sm font-medium text-text-secondary'>
												{t('ctActiveRoom')}
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
											className='flex items-center gap-2 rounded-xl bg-bg-card px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated'
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
						</PremiumSurface>
					)}
				</AnimatePresence>

				{/* Host a Room */}
				<PremiumSurface
					eyebrow={t('ctHostRoomEyebrow')}
					chipText={t('ctHostRoomChip')}
					className='mb-6 p-3'
					tone='xp'
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={TRANSITION_SPRING}
						className='flex flex-col gap-5 rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card sm:p-6 md:flex-row md:items-center md:justify-between md:p-8'
					>
						<div className='flex items-start gap-3'>
							<div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent-purple'>
								<ChefHat className='size-5 text-white' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-text-primary'>
									{t('ctHostRoom')}
								</h2>
								<p className='mt-1 max-w-2xl text-sm leading-relaxed text-text-secondary'>
									{t('ctHostRoomDesc')}
								</p>
							</div>
						</div>

						<Link
							href='/explore?from=cook-together'
							className='inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-warm transition-all hover:bg-brand/90 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 md:w-auto'
						>
							<Compass className='size-4' />
							{t('ctChooseRecipe')}
							<ArrowRight className='size-4' />
						</Link>
					</motion.div>
				</PremiumSurface>

				{/* Join a Room Card */}
				<PremiumSurface
					eyebrow={t('ctJoinRoomEyebrow')}
					chipText={t('ctJoinRoomChip')}
					className='p-3'
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, ...TRANSITION_SPRING }}
						className='group rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card sm:p-6 md:p-8'
					>
						<div className='mb-6 flex items-center gap-3'>
							<div className='flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-info to-accent-purple'>
								<Share2 className='size-5 text-white' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-text-primary'>
									{t('ctJoinRoom')}
								</h2>
								<p className='text-sm text-text-secondary'>
									{t('ctJoinRoomDesc')}
								</p>
							</div>
						</div>

						<div className='flex gap-2 sm:gap-3'>
							<input
								ref={inputRef}
								type='text'
								value={roomCodeInput}
								onChange={e =>
									setRoomCodeInput(normalizeRoomCode(e.target.value))
								}
								onKeyDown={handleKeyDown}
								placeholder={t('ctRoomCodePlaceholder')}
								aria-label={t('ctRoomCodeLabel')}
								className='min-w-0 flex-1 rounded-xl border border-border-subtle bg-bg px-3 py-2.5 font-mono text-base tracking-widest text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 sm:px-4 sm:py-3 sm:text-xl'
								disabled={isJoining}
							/>
							<button
								type='button'
								onClick={handleJoin}
								disabled={isJoining || !isValidRoomCode(roomCodeInput)}
								className='flex flex-shrink-0 items-center gap-2 rounded-xl bg-brand px-3 py-2.5 font-medium text-white transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3'
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
								{isJoining ? (
									t('ctJoining')
								) : (
									<span className='hidden sm:inline'>{t('ctJoin')}</span>
								)}
							</button>
						</div>

						<p className='mt-3 text-xs text-text-muted'>
							{t('ctRoomCodeHint')}
						</p>
					</motion.div>
				</PremiumSurface>

				{/* How It Works */}
				<PremiumSurface
					eyebrow={t('ctFlowEyebrow')}
					chipText={t('ctFlowChip')}
					className='mt-6 p-3'
					tone='blue'
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, ...TRANSITION_SPRING }}
						className='rounded-radius border border-border-subtle bg-bg-card p-6 shadow-card md:p-8'
					>
						<SurfaceSectionHeader
							eyebrow={t('ctHowItWorksEyebrow')}
							chipText={t('ctHowItWorksChip')}
							className='mb-4'
						/>
						<div className='mb-6 flex items-center gap-3'>
							<div className='flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning to-streak'>
								<Sparkles className='size-5 text-white' />
							</div>
							<h2 className='text-xl font-bold text-text-primary'>
								{t('ctHowItWorks')}
							</h2>
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
									<div className='mb-3 flex size-8 items-center justify-center rounded-xl bg-brand/10 font-bold text-brand'>
										{item.step}
									</div>
									<h3 className='mb-1 font-semibold text-text-primary'>
										{item.title}
									</h3>
									<p className='text-sm text-text-secondary'>{item.desc}</p>
								</motion.div>
							))}
						</div>
					</motion.div>
				</PremiumSurface>

				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}

function CookTogetherSkeleton() {
	return (
		<PageContainer maxWidth='xl'>
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
