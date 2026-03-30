'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Copy,
	Check,
	Share2,
	Gift,
	Users,
	Sparkles,
	Loader2,
	Trophy,
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_HOVER,
} from '@/lib/motion'
import {
	getMyReferralCode,
	getReferralStats,
	redeemReferralCode,
} from '@/services/referral'
import type {
	ReferralCodeResponse,
	ReferralStatsResponse,
} from '@/lib/types/referral'

export default function ReferralCard() {
	const [codeData, setCodeData] = useState<ReferralCodeResponse | null>(null)
	const [stats, setStats] = useState<ReferralStatsResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [copied, setCopied] = useState(false)
	const [redeemInput, setRedeemInput] = useState('')
	const [isRedeeming, setIsRedeeming] = useState(false)
	const redeemLockRef = useRef(false)

	const loadData = useCallback(async () => {
		try {
			const [code, referralStats] = await Promise.all([
				getMyReferralCode(),
				getReferralStats(),
			])
			setCodeData(code)
			setStats(referralStats)
		} catch {
			toast.error('Failed to load referral data')
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleCopy = useCallback(async () => {
		if (!codeData) return
		try {
			await navigator.clipboard.writeText(codeData.code)
			setCopied(true)
			toast.success('Referral code copied!')
			setTimeout(() => setCopied(false), 2000)
		} catch {
			toast.error('Failed to copy code')
		}
	}, [codeData])

	const handleShare = useCallback(async () => {
		if (!codeData) return
		const shareData = {
			title: 'Join me on ChefKix!',
			text: `Use my referral code ${codeData.code} to get +100 XP when you sign up!`,
			url: codeData.shareUrl,
		}
		try {
			if (navigator.share) {
				await navigator.share(shareData)
			} else {
				await navigator.clipboard.writeText(
					`${shareData.text}\n${shareData.url}`,
				)
				toast.success('Invite link copied to clipboard!')
			}
		} catch (e) {
			if ((e as Error).name !== 'AbortError') {
				toast.error('Failed to share')
			}
		}
	}, [codeData])

	const handleRedeem = useCallback(async () => {
		const code = redeemInput.trim().toUpperCase()
		if (!code || redeemLockRef.current) return
		redeemLockRef.current = true
		setIsRedeeming(true)
		try {
			const result = await redeemReferralCode({ code })
			if (result) {
				toast.success('Referral code redeemed! +100 XP awarded 🎉')
				setRedeemInput('')
				loadData()
			} else {
				toast.error('Failed to redeem code')
			}
		} catch {
			toast.error('Failed to redeem code')
		} finally {
			redeemLockRef.current = false
			setIsRedeeming(false)
		}
	}, [redeemInput, loadData])

	if (isLoading) {
		return (
			<div className='flex items-center justify-center rounded-xl border border-border-subtle bg-bg-card p-8 shadow-card'>
				<Loader2 className='size-6 animate-spin text-brand' />
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className='space-y-5'
		>
			{/* Your Referral Code */}
			<div className='rounded-xl border border-border-subtle bg-bg-card p-5 shadow-card'>
				<div className='mb-4 flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-lg bg-brand/10'>
						<Gift className='size-4 text-brand' />
					</div>
					<h3 className='text-lg font-semibold text-text'>
						Your Referral Code
					</h3>
				</div>

				<p className='mb-4 text-sm text-text-secondary'>
					Share your code with friends. You both get{' '}
					<span className='font-semibold text-xp'>+100 XP</span> when they join!
				</p>

				{codeData && (
					<div className='flex items-center gap-3'>
						<motion.div
							whileHover={CARD_HOVER}
							className='flex-1 rounded-lg border-2 border-dashed border-brand/30 bg-brand/5 px-4 py-3 text-center'
						>
							<span className='font-mono text-xl font-bold tracking-widest text-brand'>
								{codeData.code}
							</span>
						</motion.div>
						<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
							<Button
								variant='outline'
								size='icon'
								onClick={handleCopy}
								className='size-11'
							>
								<AnimatePresence mode='wait'>
									{copied ? (
										<motion.div
											key='check'
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											exit={{ scale: 0 }}
										>
											<Check className='size-4 text-success' />
										</motion.div>
									) : (
										<motion.div
											key='copy'
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											exit={{ scale: 0 }}
										>
											<Copy className='size-4' />
										</motion.div>
									)}
								</AnimatePresence>
							</Button>
						</motion.div>
						<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
							<Button
								variant='outline'
								size='icon'
								onClick={handleShare}
								className='size-11'
							>
								<Share2 className='size-4' />
							</Button>
						</motion.div>
					</div>
				)}
			</div>

			{/* Referral Stats */}
			{stats && (
				<div className='rounded-xl border border-border-subtle bg-bg-card p-5 shadow-card'>
					<div className='mb-4 flex items-center gap-2'>
						<div className='flex size-8 items-center justify-center rounded-lg bg-xp/10'>
							<Trophy className='size-4 text-xp' />
						</div>
						<h3 className='text-lg font-semibold text-text'>Referral Stats</h3>
					</div>

					<div className='mb-4 grid grid-cols-2 gap-3'>
						<div className='rounded-lg bg-bg-elevated p-3 text-center'>
							<p className='text-2xl font-bold text-text'>
								{stats.totalReferrals}
							</p>
							<p className='text-xs text-text-secondary'>
								<Users className='mr-1 inline size-3' />
								Friends Invited
							</p>
						</div>
						<div className='rounded-lg bg-bg-elevated p-3 text-center'>
							<p className='text-2xl font-bold text-xp'>
								{stats.totalXpEarned}
							</p>
							<p className='text-xs text-text-secondary'>
								<Sparkles className='mr-1 inline size-3' />
								XP Earned
							</p>
						</div>
					</div>

					{/* Referred Users List */}
					{stats.referrals.length > 0 && (
						<div className='space-y-2'>
							<p className='text-sm font-medium text-text-secondary'>
								Recent Referrals
							</p>
							{stats.referrals.map((r, i) => (
								<motion.div
									key={`${r.referredUsername}-${i}`}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ ...TRANSITION_SPRING, delay: i * 0.05 }}
									className='flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2'
								>
									<div className='flex items-center gap-2'>
										{r.referredAvatar ? (
											<Image
												src={r.referredAvatar}
												alt={r.referredUsername}
												width={28}
												height={28}
												className='rounded-full'
											/>
										) : (
											<div className='flex size-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand'>
												{r.referredUsername.charAt(0).toUpperCase()}
											</div>
										)}
										<span className='text-sm font-medium text-text'>
											{r.referredUsername}
										</span>
									</div>
									<span className='text-sm font-semibold text-xp'>
										+{r.xpAwarded} XP
									</span>
								</motion.div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Redeem Code */}
			<div className='rounded-xl border border-border-subtle bg-bg-card p-5 shadow-card'>
				<div className='mb-4 flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-lg bg-streak/10'>
						<Sparkles className='size-4 text-streak' />
					</div>
					<h3 className='text-lg font-semibold text-text'>
						Have a Referral Code?
					</h3>
				</div>
				<p className='mb-3 text-sm text-text-secondary'>
					Enter a friend&apos;s referral code to claim your welcome bonus.
				</p>
				<div className='flex gap-2'>
					<Input
						placeholder='Enter code (e.g. ABCD1234)'
						value={redeemInput}
						onChange={e =>
							setRedeemInput(e.target.value.toUpperCase().slice(0, 8))
						}
						className={cn(
							'flex-1 font-mono uppercase tracking-wider',
							'bg-bg-elevated text-text placeholder:text-text-muted',
						)}
						maxLength={8}
						onKeyDown={e => {
							if (e.key === 'Enter' && redeemInput.trim()) handleRedeem()
						}}
					/>
					<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
						<Button
							onClick={handleRedeem}
							disabled={!redeemInput.trim() || isRedeeming}
							className='bg-brand text-white hover:bg-brand/90'
						>
							{isRedeeming ? (
								<Loader2 className='size-4 animate-spin' />
							) : (
								'Redeem'
							)}
						</Button>
					</motion.div>
				</div>
			</div>
		</motion.div>
	)
}
