'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
	X,
	Lock,
	Gift,
	Clock,
	Camera,
	Zap,
	Flame,
	Info,
	Trash2,
	Loader2,
	ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { logDevError } from '@/lib/dev-log'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import {
	TRANSITION_SPRING,
	CELEBRATION_MODAL,
	XP_COUNTER_VARIANTS,
	BADGE_REVEAL_VARIANTS,
	STAT_ITEM_HOVER,
	LIST_ITEM_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'
import { triggerRecipeCompleteConfetti } from '@/lib/confetti'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { useReducedMotionPreference } from '@/components/providers/ReducedMotionProvider'
import { hasClaimablePostXp, isNoRecipeXpRun } from '@/lib/cookingXp'
import type { Badge } from '@/lib/types/gamification'
import type { CompletedChallengeReward } from '@/services/cookingSession'

// ============================================
// TYPES
// ============================================

interface RewardRow {
	id: string
	type: 'recipe' | 'challenge' | 'co-op' | 'streak' | 'pending' | 'creator-tip'
	label: string
	description: string
	xpAmount: number
	isLocked: boolean
	icon: React.ReactNode
	creatorHandle?: string
}

interface ImmediateRewardsProps {
	isOpen: boolean
	onClose: (capturedPhotos?: File[]) => Promise<boolean>
	sessionId?: string
	recipeName: string
	recipeImageUrl?: string
	// XP breakdown
	immediateXp: number
	recipeXpAwarded: number
	coOpBonusXp: number
	pendingXp: number
	completedChallengeRewards: CompletedChallengeReward[]
	xpDeliveryStatus: 'APPLIED' | 'QUEUED'
	xpMultiplier?: number
	xpMultiplierReason?: string
	xpBreakdown?: {
		base: number
		baseReason: string
		steps: number
		stepsReason: string
		time: number
		timeReason: string
		techniques?: number
		techniquesReason?: string
		total: number
	}
	streakBonus?: number
	streakDays?: number
	creatorTipXp?: number
	creatorHandle?: string
	// Deadline
	postDeadlineHours: number
	// Achievement (if unlocked)
	unlockedAchievement?: Badge | null
	onPostNow: (capturedPhotos?: File[]) => Promise<boolean>
	onPostLater: (capturedPhotos?: File[]) => Promise<boolean>
}

const MAX_CAPTURED_PHOTOS = 3
const FULL_POST_XP_PHOTO_COUNT = 2

// ============================================
// SUB-COMPONENTS
// ============================================

interface RewardRowComponentProps {
	reward: RewardRow
	animationDelay?: number
}

const RewardRowComponent = ({
	reward,
	animationDelay = 0,
}: RewardRowComponentProps) => (
	<motion.div
		initial={{ opacity: 0, x: -20 }}
		animate={{ opacity: 1, x: 0 }}
		transition={{ ...TRANSITION_SPRING, delay: animationDelay }}
		className={cn(
			'flex items-center gap-3.5 rounded-xl p-3.5 transition-all',
			reward.isLocked && 'opacity-60',
			(reward.type === 'recipe' || reward.type === 'challenge') &&
				'bg-gradient-to-r from-success/10 to-success/5',
			reward.type === 'co-op' && 'bg-gradient-to-r from-brand/10 to-brand/5',
			reward.type === 'streak' &&
				'bg-gradient-to-r from-warning/10 to-warning/5',
		)}
	>
		{/* Icon */}
		<div className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg-card'>
			{reward.icon}
		</div>

		{/* Info */}
		<div className='min-w-0 flex-1'>
			<span className='block text-sm font-semibold'>{reward.label}</span>
			<span className='block text-xs text-text-muted'>
				{reward.description}
			</span>
		</div>

		{/* XP Value */}
		<motion.div
			variants={XP_COUNTER_VARIANTS}
			initial='hidden'
			animate='visible'
			className={cn(
				'whitespace-nowrap text-xl font-bold tabular-nums',
				reward.isLocked ? 'text-text-muted' : 'text-xp',
			)}
		>
			+<AnimatedNumber value={reward.xpAmount} duration={0.8} />{' '}
			<span className='text-sm font-semibold'>XP</span>
		</motion.div>
	</motion.div>
)

interface AchievementBannerProps {
	achievement: Badge
}

const AchievementBanner = ({ achievement }: AchievementBannerProps) => {
	const t = useTranslations('completion')
	return (
		<motion.div
			variants={BADGE_REVEAL_VARIANTS}
			initial='hidden'
			animate='visible'
			className='mb-5 flex items-center gap-3.5 rounded-2xl border border-accent-purple/30 bg-gradient-to-r from-accent-purple/10 to-accent-purple/5 p-3.5'
		>
			{/* Badge icon */}
			<div className='flex size-12 items-center justify-center rounded-full bg-gradient-xp text-2xl shadow-warm shadow-accent-purple/30'>
				{achievement.iconEmoji}
			</div>

			{/* Info */}
			<div className='flex-1'>
				<span className='block text-xs font-semibold uppercase tracking-wide text-accent-purple'>
					{t('achievementUnlocked')}
				</span>
				<span className='block text-base font-bold'>{achievement.name}</span>
			</div>
		</motion.div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export const ImmediateRewards = ({
	isOpen,
	onClose,
	sessionId,
	recipeName,
	recipeImageUrl,
	immediateXp,
	recipeXpAwarded,
	coOpBonusXp,
	pendingXp,
	completedChallengeRewards,
	xpDeliveryStatus,
	xpMultiplier,
	xpMultiplierReason,
	xpBreakdown,
	streakBonus = 0,
	streakDays = 0,
	creatorTipXp = 0,
	creatorHandle,
	postDeadlineHours,
	unlockedAchievement,
	onPostNow,
	onPostLater,
}: ImmediateRewardsProps) => {
	const t = useTranslations('completion')
	const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen)
	const [capturedPhotos, setCapturedPhotos] = useState<File[]>([])
	const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
	const [activeAction, setActiveAction] = useState<
		'postNow' | 'postLater' | null
	>(null)
	const actionLockRef = useRef(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { shouldReduceMotion } = useReducedMotionPreference()

	// Trigger canvas-confetti on mount (respects reduced motion internally)
	useEffect(() => {
		if (isOpen) {
			triggerRecipeCompleteConfetti()
		}
		// Reset photos when modal closes
		if (!isOpen) {
			setCapturedPhotos([])
			setPhotoPreviewUrls([])
		}
	}, [isOpen])

	// Handle photo selection/capture
	const handlePhotoCapture = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || [])
			if (files.length === 0) return

			// Validate file sizes (max 10MB each)
			const MAX_PHOTO_SIZE = 10 * 1024 * 1024
			const validFiles = files.filter(f => f.size <= MAX_PHOTO_SIZE)

			const newFiles = validFiles.slice(
				0,
				MAX_CAPTURED_PHOTOS - capturedPhotos.length,
			)
			if (newFiles.length === 0) return

			setCapturedPhotos(prev => [...prev, ...newFiles])

			// Generate preview URLs
			newFiles.forEach(file => {
				const reader = new FileReader()
				reader.onloadend = () => {
					setPhotoPreviewUrls(prev => [...prev, reader.result as string])
				}
				reader.readAsDataURL(file)
			})

			// Reset input for re-selection
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		},
		[capturedPhotos.length],
	)

	const removePhoto = useCallback((index: number) => {
		setCapturedPhotos(prev => prev.filter((_, i) => i !== index))
		setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index))
	}, [])

	const runAction = useCallback(
		async (
			action: 'postNow' | 'postLater',
			callback: (capturedPhotos?: File[]) => Promise<boolean>,
		) => {
			if (actionLockRef.current) return
			actionLockRef.current = true
			setActiveAction(action)
			try {
				const didNavigate = await callback(
					capturedPhotos.length > 0 ? capturedPhotos : undefined,
				)
				if (!didNavigate) {
					actionLockRef.current = false
					setActiveAction(null)
				}
			} catch (error) {
				logDevError('Completion action failed:', error)
				actionLockRef.current = false
				setActiveAction(null)
			}
		},
		[capturedPhotos],
	)

	const handlePostNowClick = useCallback(() => {
		void runAction('postNow', onPostNow)
	}, [onPostNow, runAction])

	const handlePostLaterClick = useCallback(() => {
		void runAction('postLater', onPostLater)
	}, [onPostLater, runAction])

	const handleDismiss = useCallback(() => {
		void runAction('postLater', onClose)
	}, [onClose, runAction])

	useEscapeKey(isOpen, handleDismiss)

	// Calculate totals
	const earnedNow = immediateXp + streakBonus
	const pendingTotal = pendingXp + creatorTipXp
	const canUnlockPostXp = hasClaimablePostXp(pendingXp, creatorTipXp)
	const noRecipeXpThisRun = isNoRecipeXpRun(recipeXpAwarded, pendingXp)

	// Build reward rows
	const rewards: RewardRow[] = [
		{
			id: 'recipe',
			type: 'recipe',
			label: t('recipeCompletionXp'),
			description: t('earnedForCompleting'),
			xpAmount: recipeXpAwarded,
			isLocked: false,
			icon: <Zap className='size-6 text-success' />,
		},
	]

	completedChallengeRewards.forEach(reward => {
		rewards.push({
			id: `challenge-${reward.challengeKind}-${reward.challengeId}`,
			type: 'challenge',
			label: reward.challengeTitle,
			description: t('challengeCompleted', {
				kind: t(`challengeKind${reward.challengeKind}`),
			}),
			xpAmount: reward.bonusXp,
			isLocked: false,
			icon: <Gift className='size-5 text-xp' />,
		})
	})

	if (coOpBonusXp > 0) {
		const coOpDescriptionKey =
			xpMultiplierReason === 'CO_OP_DUO'
				? 'coCookingDuoBonusPercent'
				: 'coCookingGroupBonusPercent'
		rewards.push({
			id: 'co-op',
			type: 'co-op',
			label: t('coCookingBonus'),
			description: t(coOpDescriptionKey, {
				percent: Math.round(((xpMultiplier ?? 1) - 1) * 100),
			}),
			xpAmount: coOpBonusXp,
			isLocked: false,
			icon: <Flame className='size-5 text-brand' />,
		})
	}

	if (streakBonus > 0) {
		rewards.push({
			id: 'streak',
			type: 'streak',
			label: t('dayStreak', { days: streakDays }),
			description: t('cookingStreakBonus'),
			xpAmount: streakBonus,
			isLocked: false,
			icon: <Flame className='size-6 text-warning' />,
		})
	}

	// Locked rewards
	if (pendingXp > 0) {
		rewards.push({
			id: 'pending',
			type: 'pending',
			label: t('postReward'),
			description: t('shareToUnlock'),
			xpAmount: pendingXp,
			isLocked: true,
			icon: <Lock className='size-5 text-text-muted' />,
		})
	}

	if (creatorTipXp > 0 && creatorHandle) {
		rewards.push({
			id: 'creator-tip',
			type: 'creator-tip',
			label: t('creatorTip'),
			description: t('creatorTipPercent', { handle: creatorHandle }),
			xpAmount: creatorTipXp,
			isLocked: true,
			icon: <Gift className='size-5 text-text-muted' />,
		})
	}

	const unlockedRewards = rewards.filter(reward => !reward.isLocked)
	const lockedRewards = rewards.filter(reward => reward.isLocked)

	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					{/* Overlay */}
					<motion.div
						ref={focusTrapRef}
						role='dialog'
						aria-modal='true'
						aria-label={t('ariaCookingRewards')}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-6'
					>
						{/* Card */}
						<motion.div
							variants={CELEBRATION_MODAL}
							initial='hidden'
							animate='visible'
							exit='exit'
							className='relative w-full max-w-md overflow-hidden rounded-2xl bg-bg-card p-8 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-modal max-md:overflow-y-auto max-md:rounded-b-none max-md:p-6'
						>
							{/* Close button */}
							<button
								type='button'
								onClick={handleDismiss}
								disabled={activeAction !== null}
								aria-label={t('ariaClose')}
								className='absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-bg-elevated text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary'
							>
								<X className='size-5' />
							</button>

							{/* Header */}
							<div className='mb-7 text-center'>
								<motion.div
									animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
									transition={
										shouldReduceMotion
											? undefined
											: { duration: 0.6, repeat: Infinity }
									}
									className='mb-4 inline-block text-6xl max-md:text-5xl'
								>
									👨‍🍳
								</motion.div>
								<h1 className='mb-2 bg-gradient-to-r from-success to-success/80 bg-clip-text text-3xl font-bold tracking-tight text-transparent max-md:text-2xl'>
									{t('niceWorkChef')}
								</h1>
								<p className='text-text-muted'>
									{t('youCompleted', { recipeName })}
								</p>
							</div>

							{!canUnlockPostXp && (
								<motion.div
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.25, ...TRANSITION_SPRING }}
									className='mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3'
								>
									<span className='block text-sm font-semibold text-warning'>
										{noRecipeXpThisRun
											? t('masteryExhaustedTitle')
											: t('noPostBonusTitle')}
									</span>
									<span className='mt-1 block text-xs text-text-secondary'>
										{noRecipeXpThisRun
											? t('masteryExhaustedBody')
											: t('noPostBonusBody')}
									</span>
								</motion.div>
							)}

							{/* Rewards Stack */}
							<div className='mb-4 space-y-1 rounded-2xl bg-bg-elevated p-2'>
								{/* Unlocked rewards */}
								{unlockedRewards.map((reward, i) => (
									<RewardRowComponent
										key={reward.id}
										reward={reward}
										animationDelay={0.2 + i * 0.1}
									/>
								))}

								{/* XP Breakdown (how immediate XP was calculated) */}
								{xpBreakdown && !noRecipeXpThisRun && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										transition={{ delay: 0.4, ...TRANSITION_SPRING }}
										className='mx-2 mb-1 rounded-xl bg-bg px-3 py-2'
									>
										<span className='mb-1.5 block text-2xs font-medium uppercase tracking-wider text-text-muted'>
											{t('recipeXpBreakdown')}
										</span>
										<div className='space-y-1'>
											{[
												xpBreakdown.base > 0 && {
													label: xpBreakdown.baseReason || t('xpBase'),
													value: xpBreakdown.base,
												},
												xpBreakdown.steps > 0 && {
													label: xpBreakdown.stepsReason || t('xpSteps'),
													value: xpBreakdown.steps,
												},
												xpBreakdown.time > 0 && {
													label: xpBreakdown.timeReason || t('xpTime'),
													value: xpBreakdown.time,
												},
												xpBreakdown.techniques != null &&
													xpBreakdown.techniques > 0 && {
														label:
															xpBreakdown.techniquesReason || t('xpTechniques'),
														value: xpBreakdown.techniques,
													},
											]
												.filter(Boolean)
												.map((item, i) => (
													<motion.div
														key={(item as { label: string }).label}
														initial={{ opacity: 0, x: -8 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{
															delay: 0.5 + i * 0.08,
															...TRANSITION_SPRING,
														}}
														className='flex items-center justify-between text-xs'
													>
														<span className='text-text-secondary'>
															{(item as { label: string }).label}
														</span>
														<span className='font-semibold text-xp'>
															+{(item as { value: number }).value}
														</span>
													</motion.div>
												))}
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 0.8, ...TRANSITION_SPRING }}
												className='mt-1 flex items-center justify-between border-t border-border-subtle pt-1 text-xs'
											>
												<span className='font-medium text-text-muted'>
													{t('totalRecipeXp')}
												</span>
												<span className='font-bold text-text-primary'>
													{xpBreakdown.total}
												</span>
											</motion.div>
										</div>
									</motion.div>
								)}

								{lockedRewards.length > 0 && (
									<>
										{/* Divider with XP split explainer */}
										<div className='flex items-center gap-3 px-3.5 py-2'>
											<div className='h-px flex-1 bg-border' />
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<span className='flex cursor-help items-center gap-1 text-xs uppercase tracking-wide text-text-muted'>
															{t('postToUnlockMore')}
															<Info className='size-3' />
														</span>
													</TooltipTrigger>
													<TooltipContent
														side='bottom'
														className='max-w-xs text-center'
													>
														<p className='text-sm'>
															<strong>{t('whyLocked')}</strong>
															<br />
															{t('whyLockedExplain')}
														</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											<div className='h-px flex-1 bg-border' />
										</div>

										{/* Locked rewards */}
										{lockedRewards.map((reward, i) => (
											<RewardRowComponent
												key={reward.type}
												reward={reward}
												animationDelay={0.5 + i * 0.1}
											/>
										))}
									</>
								)}
							</div>

							{/* Totals */}
							<div className='mb-4 grid grid-cols-2 gap-3'>
								<motion.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.6, ...TRANSITION_SPRING }}
									className='rounded-xl border-2 border-success bg-bg-elevated p-4 text-center'
								>
									<span className='block text-xs uppercase tracking-wide text-text-muted'>
										{xpDeliveryStatus === 'APPLIED'
											? t('earnedNow')
											: t('xpProcessing')}
									</span>
									<span className='block text-2xl font-bold tracking-tight tabular-nums text-success'>
										<AnimatedNumber value={earnedNow} duration={1.2} /> XP
									</span>
								</motion.div>
								<motion.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.7, ...TRANSITION_SPRING }}
									className='rounded-xl border-2 border-brand/30 bg-brand/5 p-4 text-center'
								>
									<span className='block text-xs uppercase tracking-wide text-text-muted'>
										{t('maximumPostXp')}
									</span>
									<span className='block text-2xl font-bold tracking-tight tabular-nums text-brand/70'>
										<AnimatedNumber value={pendingTotal} duration={1.2} /> XP
									</span>
								</motion.div>
							</div>

							{/* Deadline warning */}
							{canUnlockPostXp && (
								<motion.div
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.8, ...TRANSITION_SPRING }}
									className='mb-4 flex items-center justify-center gap-2 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning'
								>
									<Clock className='size-4' />
									<span>
										{postDeadlineHours >= 24
											? t('postRewardPolicyDays', {
													count: Math.floor(postDeadlineHours / 24),
												})
											: t('postRewardPolicyHours', {
													count: postDeadlineHours,
												})}
									</span>
								</motion.div>
							)}

							{/* Achievement banner */}
							{unlockedAchievement && (
								<AchievementBanner achievement={unlockedAchievement} />
							)}

							{/* Photo Capture Section */}
							<div className='mb-4'>
								<div className='mb-2 flex items-center justify-between'>
									<span className='flex items-center gap-1.5 text-sm font-medium text-text-primary'>
										<Camera className='size-4' aria-hidden='true' />
										{t('captureYourDish')}
									</span>
									<span className='text-xs text-text-muted'>
										{t('photosCount', {
											count: capturedPhotos.length,
											max: MAX_CAPTURED_PHOTOS,
										})}
									</span>
								</div>

								{/* Photo previews + add button */}
								<div className='flex gap-2'>
									{/* Existing photo previews */}
									{photoPreviewUrls.map((url, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											className='group relative size-20 flex-shrink-0 overflow-hidden rounded-xl'
										>
											<Image
												src={url}
												alt={t('capturedPhotoAlt', { number: index + 1 })}
												fill
												sizes='80px'
												className='object-cover'
											/>
											<button
												type='button'
												onClick={() => removePhoto(index)}
												aria-label={t('removeCapturedPhoto', {
													number: index + 1,
												})}
												className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-70 transition-opacity hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
											>
												<Trash2 className='size-5 text-white' />
											</button>
										</motion.div>
									))}

									{/* Add photo button */}
									{capturedPhotos.length < MAX_CAPTURED_PHOTOS && (
										<label className='flex size-20 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-elevated transition-colors hover:border-brand hover:bg-bg-hover'>
											<div className='flex flex-col items-center gap-1'>
												<Camera className='size-5 text-text-muted' />
												<span className='text-xs text-text-muted'>
													{t('addPhoto')}
												</span>
											</div>
											<input
												ref={fileInputRef}
												type='file'
												accept='image/*'
												capture='environment'
												multiple
												onChange={handlePhotoCapture}
												className='hidden'
											/>
										</label>
									)}
								</div>

								{capturedPhotos.length === 0 && (
									<p className='mt-2 text-xs text-text-muted'>
										{canUnlockPostXp ? t('photoHintZero') : t('photoHintNoXp')}
									</p>
								)}
								{capturedPhotos.length === 1 && (
									<p className='mt-2 text-xs text-warning'>
										{t('photoHintOne')}
									</p>
								)}
								{capturedPhotos.length >= FULL_POST_XP_PHOTO_COUNT &&
									canUnlockPostXp && (
										<p className='mt-2 text-xs text-success'>
											{t('photoHintFull')}
										</p>
									)}
							</div>

							{/* Cook Card CTA */}
							{sessionId && (
								<motion.a
									href={`/cook-card?session=${sessionId}`}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ ...TRANSITION_SPRING, delay: 0.6 }}
									className='mb-4 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-medium text-brand transition-colors hover:bg-brand/10'
								>
									<ImageIcon className='size-5 shrink-0' />
									<div className='flex-1'>
										<span className='block font-semibold'>
											{t('viewCookCard')}
										</span>
										<span className='block text-xs text-text-muted'>
											{t('cookCardDesc')}
										</span>
									</div>
									<span className='text-xs text-text-muted'>&rarr;</span>
								</motion.a>
							)}

							{/* Actions */}
							<div className='space-y-2.5'>
								<motion.button
									type='button'
									onClick={handlePostNowClick}
									disabled={activeAction !== null}
									whileHover={activeAction ? undefined : STAT_ITEM_HOVER}
									whileTap={activeAction ? undefined : LIST_ITEM_TAP}
									className={cn(
										'flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand to-brand/90 px-6 py-4 text-white shadow-warm shadow-brand/30 transition-shadow focus-visible:ring-2 focus-visible:ring-brand/50',
										activeAction
											? 'cursor-wait opacity-80'
											: 'hover:shadow-warm hover:shadow-brand/40',
									)}
								>
									<div className='flex items-center gap-2.5'>
										{activeAction === 'postNow' ? (
											<Loader2 className='size-5 shrink-0 animate-spin' />
										) : (
											<Camera className='size-5 shrink-0' />
										)}
										<span className='text-lg font-bold'>
											{activeAction === 'postNow'
												? t('preparingPost')
												: capturedPhotos.length > 0
													? capturedPhotos.length > 1
														? t('sharePhotosPlural', {
																count: capturedPhotos.length,
															})
														: t('sharePhotos', { count: capturedPhotos.length })
													: t('shareYourCreation')}
										</span>
									</div>
									{!activeAction && canUnlockPostXp && (
										<span className='shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold'>
											{t('upToXp', { amount: pendingTotal })}
										</span>
									)}
								</motion.button>
								<motion.button
									type='button'
									onClick={handlePostLaterClick}
									disabled={activeAction !== null}
									whileHover={activeAction ? undefined : BUTTON_SUBTLE_HOVER}
									whileTap={activeAction ? undefined : BUTTON_SUBTLE_TAP}
									className='w-full py-3 text-text-muted transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									{activeAction === 'postLater' ? (
										<span className='inline-flex items-center gap-2'>
											<Loader2 className='size-4 animate-spin' />
											{t('savingDraft')}
										</span>
									) : (
										t('postLater')
									)}
								</motion.button>
							</div>
						</motion.div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}

// ============================================
// TOAST VERSION (for quick dismissal)
// ============================================

interface RewardsToastProps {
	earnedXp: number
	pendingXp: number
	onPostNow: () => void
	onDismiss: () => void
}

export const RewardsToast = ({
	earnedXp,
	pendingXp,
	onPostNow,
	onDismiss,
}: RewardsToastProps) => {
	const t = useTranslations('completion')
	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 20, scale: 0.95 }}
			transition={TRANSITION_SPRING}
			className='fixed bottom-24 left-1/2 z-modal -translate-x-1/2 rounded-2xl bg-bg-card p-1 shadow-warm md:bottom-6'
		>
			<div className='flex items-center gap-3 px-4 py-3'>
				<span className='text-xl'>✅</span>
				<span className='text-sm font-semibold'>
					{t('toastEarned', {
						earned: Math.round(earnedXp),
						pending: Math.round(pendingXp),
					})}
				</span>
				<motion.button
					type='button'
					onClick={onPostNow}
					whileHover={BUTTON_SUBTLE_HOVER}
					whileTap={BUTTON_SUBTLE_TAP}
					className='rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					{t('postNow')}
				</motion.button>
			</div>
		</motion.div>
	)
}
