'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
	AlertCircle,
	Check,
	Copy,
	Gift,
	Loader2,
	RefreshCw,
	Share2,
	Sparkles,
	Trophy,
	Users,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from '@/i18n/hooks'
import { parseError } from '@/lib/error-utils'
import { normalizeReferralCode } from '@/lib/referral-intent'
import {
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_HOVER,
	TRANSITION_SPRING,
} from '@/lib/motion'
import type {
	ReferralCodeResponse,
	ReferralStatsResponse,
} from '@/lib/types/referral'
import { cn, getInitials } from '@/lib/utils'
import {
	getMyReferralCode,
	getReferralStats,
	redeemReferralCode,
} from '@/services/referral'

type LoadState = 'loading' | 'ready' | 'error'
type RedeemErrorKey =
	| 'toastRedeemFailed'
	| 'redeemNotFound'
	| 'redeemOwnCode'
	| 'redeemAlreadyUsed'
	| 'redeemExhausted'

const REDEEM_ERROR_KEYS: Record<string, RedeemErrorKey> = {
	'Referral code not found': 'redeemNotFound',
	'Cannot redeem your own referral code': 'redeemOwnCode',
	'You have already redeemed a referral code': 'redeemAlreadyUsed',
	'This referral code has reached its maximum uses': 'redeemExhausted',
}

function getRedeemErrorKey(error: unknown): RedeemErrorKey {
	return REDEEM_ERROR_KEYS[parseError(error).message] ?? 'toastRedeemFailed'
}

interface SectionFailureProps {
	message: string
	retryLabel: string
	onRetry: () => void
}

function SectionFailure({ message, retryLabel, onRetry }: SectionFailureProps) {
	return (
		<div
			className='rounded-lg border border-error/25 bg-error/5 p-4'
			role='alert'
		>
			<div className='flex items-start gap-3'>
				<AlertCircle className='mt-0.5 size-4 shrink-0 text-error' />
				<div className='min-w-0 flex-1'>
					<p className='text-sm text-text-secondary'>{message}</p>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={onRetry}
						className='mt-3'
					>
						<RefreshCw className='size-4' />
						{retryLabel}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default function ReferralCard() {
	const t = useTranslations('referral')
	const router = useRouter()
	const searchParams = useSearchParams()
	const inviteCode = normalizeReferralCode(searchParams.get('ref'))
	const [codeData, setCodeData] = useState<ReferralCodeResponse | null>(null)
	const [stats, setStats] = useState<ReferralStatsResponse | null>(null)
	const [codeState, setCodeState] = useState<LoadState>('loading')
	const [statsState, setStatsState] = useState<LoadState>('loading')
	const [copied, setCopied] = useState(false)
	const [redeemInput, setRedeemInput] = useState(inviteCode ?? '')
	const [isRedeeming, setIsRedeeming] = useState(false)
	const codeRequestRef = useRef(0)
	const statsRequestRef = useRef(0)
	const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const redeemLockRef = useRef(false)
	const mountedRef = useRef(false)

	const loadCode = useCallback(async () => {
		const requestId = ++codeRequestRef.current
		setCodeState('loading')
		try {
			const code = await getMyReferralCode()
			if (!mountedRef.current || requestId !== codeRequestRef.current) return
			setCodeData(code)
			setCodeState('ready')
		} catch {
			if (!mountedRef.current || requestId !== codeRequestRef.current) return
			setCodeState('error')
		}
	}, [])

	const loadStats = useCallback(async () => {
		const requestId = ++statsRequestRef.current
		setStatsState('loading')
		try {
			const referralStats = await getReferralStats()
			if (!mountedRef.current || requestId !== statsRequestRef.current) return
			setStats(referralStats)
			setStatsState('ready')
		} catch {
			if (!mountedRef.current || requestId !== statsRequestRef.current) return
			setStatsState('error')
		}
	}, [])

	useEffect(() => {
		mountedRef.current = true
		void loadCode()
		void loadStats()

		return () => {
			mountedRef.current = false
			codeRequestRef.current += 1
			statsRequestRef.current += 1
			if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
		}
	}, [loadCode, loadStats])

	useEffect(() => {
		if (inviteCode) setRedeemInput(current => current || inviteCode)
	}, [inviteCode])

	const canShareCode =
		codeData != null &&
		codeData.active &&
		codeData.usageCount < codeData.maxUses

	const handleCopy = useCallback(async () => {
		if (!codeData || !canShareCode) return
		try {
			await navigator.clipboard.writeText(codeData.code)
			if (!mountedRef.current) return
			setCopied(true)
			toast.success(t('toastCodeCopied'))
			if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
			copiedTimeoutRef.current = setTimeout(() => {
				if (mountedRef.current) setCopied(false)
			}, 2000)
		} catch {
			toast.error(t('toastCopyFailed'))
		}
	}, [canShareCode, codeData, t])

	const handleShare = useCallback(async () => {
		if (!codeData || !canShareCode) return
		const shareUrl = new URL(
			`${PATHS.JOIN}?ref=${encodeURIComponent(codeData.code)}`,
			window.location.origin,
		).toString()
		const shareData = {
			title: t('shareTitle'),
			text: t('shareBody', { code: codeData.code }),
			url: shareUrl,
		}
		try {
			if (navigator.share) {
				await navigator.share(shareData)
			} else {
				await navigator.clipboard.writeText(
					`${shareData.text}\n${shareData.url}`,
				)
				toast.success(t('toastInviteCopied'))
			}
		} catch (error) {
			if ((error as Error).name !== 'AbortError') {
				toast.error(t('toastShareFailed'))
			}
		}
	}, [canShareCode, codeData, t])

	const handleRedeem = useCallback(async () => {
		const code = normalizeReferralCode(redeemInput)
		if (!code || redeemLockRef.current) return
		redeemLockRef.current = true
		setIsRedeeming(true)
		try {
			await redeemReferralCode({ code })
			if (!mountedRef.current) return
			toast.success(t('toastRedeemed'))
			setRedeemInput('')
			router.replace(`${PATHS.SETTINGS}?tab=referral`, { scroll: false })
		} catch (error) {
			if (mountedRef.current) toast.error(t(getRedeemErrorKey(error)))
		} finally {
			redeemLockRef.current = false
			if (mountedRef.current) setIsRedeeming(false)
		}
	}, [redeemInput, router, t])

	const redeemCode = normalizeReferralCode(redeemInput)

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className='space-y-5'
		>
			<section className='rounded-xl border border-border-subtle/80 bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/60 p-5 shadow-card'>
				<div className='mb-4 flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-xl bg-brand/10'>
						<Gift className='size-4 text-brand' />
					</div>
					<h3 className='text-lg font-semibold text-text-primary'>
						{t('yourCodeTitle')}
					</h3>
				</div>

				{codeState === 'loading' && (
					<div className='space-y-3' aria-label={t('loadingCode')}>
						<Skeleton className='h-5 w-4/5 rounded-lg' />
						<Skeleton className='h-12 w-full rounded-lg' />
					</div>
				)}

				{codeState === 'error' && (
					<SectionFailure
						message={t('codeLoadFailed')}
						retryLabel={t('retry')}
						onRetry={() => void loadCode()}
					/>
				)}

				{codeState === 'ready' && codeData && (
					<>
						<p className='mb-4 text-sm text-text-secondary'>
							{t('yourCodeSubtitle')}
						</p>
						<div className='flex items-center gap-3'>
							<motion.div
								whileHover={canShareCode ? CARD_HOVER : undefined}
								className='min-w-0 flex-1 rounded-xl border-2 border-brand/30 bg-brand/5 px-4 py-3 text-center'
							>
								<span className='break-all font-mono text-xl font-bold tracking-widest text-brand'>
									{codeData.code}
								</span>
							</motion.div>
							<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
								<Button
									type='button'
									variant='outline'
									size='icon'
									aria-label={t('copyCodeLabel')}
									onClick={handleCopy}
									disabled={!canShareCode}
									className='size-11'
								>
									<AnimatePresence mode='wait'>
										{copied ? (
											<motion.span
												key='check'
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												exit={{ scale: 0 }}
											>
												<Check className='size-4 text-success' />
											</motion.span>
										) : (
											<motion.span
												key='copy'
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												exit={{ scale: 0 }}
											>
												<Copy className='size-4' />
											</motion.span>
										)}
									</AnimatePresence>
								</Button>
							</motion.div>
							<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
								<Button
									type='button'
									variant='outline'
									size='icon'
									aria-label={t('shareCodeLabel')}
									onClick={handleShare}
									disabled={!canShareCode}
									className='size-11'
								>
									<Share2 className='size-4' />
								</Button>
							</motion.div>
						</div>
						{!canShareCode && (
							<p className='mt-3 text-sm text-text-secondary' role='status'>
								{t('codeUnavailable')}
							</p>
						)}
					</>
				)}
			</section>

			<section className='rounded-xl border border-border-subtle/80 bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/60 p-5 shadow-card'>
				<div className='mb-4 flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-xl bg-xp/10'>
						<Trophy className='size-4 text-xp' />
					</div>
					<h3 className='text-lg font-semibold text-text-primary'>
						{t('referralStats')}
					</h3>
				</div>

				{statsState === 'loading' && (
					<div
						className='grid grid-cols-2 gap-3'
						aria-label={t('loadingStats')}
					>
						<Skeleton className='h-20 w-full rounded-lg' />
						<Skeleton className='h-20 w-full rounded-lg' />
					</div>
				)}

				{statsState === 'error' && (
					<SectionFailure
						message={t('statsLoadFailed')}
						retryLabel={t('retry')}
						onRetry={() => void loadStats()}
					/>
				)}

				{statsState === 'ready' && stats && (
					<>
						<div className='mb-4 grid grid-cols-2 gap-3'>
							<div className='rounded-xl bg-bg-elevated p-3 text-center'>
								<p className='text-2xl font-bold text-text-primary'>
									{stats.totalReferrals}
								</p>
								<p className='text-xs text-text-secondary'>
									<Users className='mr-1 inline size-3' />
									{t('friendsInvited')}
								</p>
							</div>
							<div className='rounded-xl bg-bg-elevated p-3 text-center'>
								<p className='text-2xl font-bold text-xp'>
									{stats.totalXpEarned}
								</p>
								<p className='text-xs text-text-secondary'>
									<Sparkles className='mr-1 inline size-3' />
									{t('xpEarned')}
								</p>
							</div>
						</div>

						{stats.referrals.length > 0 && (
							<div className='space-y-2'>
								<p className='text-sm font-medium text-text-secondary'>
									{t('recentReferrals')}
								</p>
								{stats.referrals.map(referral => (
									<motion.div
										key={`${referral.referredUsername}-${referral.redeemedAt}`}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={TRANSITION_SPRING}
										className='flex items-center justify-between rounded-xl bg-bg-elevated px-3 py-2'
									>
										<div className='flex min-w-0 items-center gap-2'>
											{referral.referredAvatar ? (
												<Image
													src={referral.referredAvatar}
													alt={referral.referredUsername}
													width={28}
													height={28}
													className='rounded-full'
												/>
											) : (
												<div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand'>
													{getInitials(referral.referredUsername, 1)}
												</div>
											)}
											<span className='truncate text-sm font-medium text-text-primary'>
												{referral.referredUsername}
											</span>
										</div>
										<span className='ml-3 shrink-0 text-sm font-semibold text-xp'>
											{t('xpAmount', { xp: referral.xpAwarded })}
										</span>
									</motion.div>
								))}
							</div>
						)}
					</>
				)}
			</section>

			<section className='rounded-xl border border-border-subtle/80 bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/60 p-5 shadow-card'>
				<div className='mb-4 flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-xl bg-streak/10'>
						<Sparkles className='size-4 text-streak' />
					</div>
					<h3 className='text-lg font-semibold text-text-primary'>
						{t('haveCodeTitle')}
					</h3>
				</div>
				<p className='mb-3 text-sm text-text-secondary'>
					{t('haveCodeSubtitle')}
				</p>
				{inviteCode && (
					<p className='mb-3 text-sm font-medium text-success' role='status'>
						{t('inviteCodeReady')}
					</p>
				)}
				<div className='flex gap-2'>
					<Input
						aria-label={t('enterCodeLabel')}
						placeholder={t('enterCodePlaceholder')}
						value={redeemInput}
						onChange={event => {
							const normalized = event.target.value
								.toUpperCase()
								.replace(/[^A-HJ-NP-Z2-9]/g, '')
								.slice(0, 8)
							setRedeemInput(normalized)
						}}
						className={cn(
							'min-w-0 flex-1 font-mono uppercase tracking-wider',
							'bg-bg-elevated text-text-primary placeholder:text-text-muted',
						)}
						maxLength={8}
						onKeyDown={event => {
							if (event.key === 'Enter' && redeemCode) {
								void handleRedeem()
							}
						}}
					/>
					<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
						<Button
							type='button'
							onClick={() => void handleRedeem()}
							disabled={!redeemCode || isRedeeming}
							aria-label={t('redeem')}
							className='bg-brand text-white hover:bg-brand/90'
						>
							{isRedeeming ? (
								<Loader2 className='size-4 animate-spin' />
							) : (
								t('redeem')
							)}
						</Button>
					</motion.div>
				</div>
			</section>
		</motion.div>
	)
}
