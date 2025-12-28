'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
	Plus,
	Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import {
	TRANSITION_SPRING,
	TRANSITION_BOUNCY,
	CELEBRATION_MODAL,
	XP_COUNTER_VARIANTS,
	BADGE_REVEAL_VARIANTS,
	CONFETTI_BURST_VARIANTS,
	STAT_ITEM_HOVER,
	LIST_ITEM_TAP,
} from '@/lib/motion'
import type { XPReward, Badge } from '@/lib/types/gamification'

// ============================================
// TYPES
// ============================================

interface RewardRow {
	type: 'immediate' | 'streak' | 'pending' | 'creator-tip'
	label: string
	description: string
	xpAmount: number
	isLocked: boolean
	icon: React.ReactNode
	creatorHandle?: string
}

interface ImmediateRewardsProps {
	isOpen: boolean
	onClose: () => void
	recipeName: string
	recipeImageUrl?: string
	// XP breakdown
	immediateXp: number
	pendingXp: number
	streakBonus?: number
	streakDays?: number
	creatorTipXp?: number
	creatorHandle?: string
	// Deadline
	postDeadlineHours: number
	// Achievement (if unlocked)
	unlockedAchievement?: Badge | null
	// Actions - onPostNow now receives captured photos
	onPostNow: (capturedPhotos?: File[]) => void
	onPostLater: () => void
}

// ============================================
// CONFETTI COMPONENT
// ============================================

const CONFETTI_COLORS = [
	'#ff6b6b',
	'#feca57',
	'#48dbfb',
	'#ff9ff3',
	'#54a0ff',
	'#5f27cd',
	'#1dd1a1',
]

const ConfettiParticle = ({ index }: { index: number }) => {
	const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
	const delay = (index * 0.05) % 0.3
	const xPos = (index * 17) % 100

	return (
		<motion.div
			initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
			animate={{
				y: '100vh',
				rotate: 720,
				opacity: 0,
			}}
			transition={{
				duration: 3,
				delay,
				ease: 'easeOut',
			}}
			style={{
				position: 'absolute',
				left: `${xPos}%`,
				width: 10,
				height: 10,
				backgroundColor: color,
				borderRadius: 2,
			}}
		/>
	)
}

const ConfettiContainer = () => (
	<div className='pointer-events-none fixed inset-0 overflow-hidden'>
		{Array.from({ length: 20 }).map((_, i) => (
			<ConfettiParticle key={i} index={i} />
		))}
	</div>
)

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
			reward.type === 'immediate' &&
				'bg-gradient-to-r from-success/10 to-success/5',
			reward.type === 'streak' &&
				'bg-gradient-to-r from-warning/10 to-warning/5',
		)}
	>
		{/* Icon */}
		<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-panel-bg'>
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
				'whitespace-nowrap text-xl font-bold',
				reward.isLocked ? 'text-text-muted' : 'text-xp',
			)}
		>
			+{reward.xpAmount} <span className='text-sm font-semibold'>XP</span>
		</motion.div>
	</motion.div>
)

interface AchievementBannerProps {
	achievement: Badge
}

const AchievementBanner = ({ achievement }: AchievementBannerProps) => (
	<motion.div
		variants={BADGE_REVEAL_VARIANTS}
		initial='hidden'
		animate='visible'
		className='mb-5 flex items-center gap-3.5 rounded-2xl border border-accent-purple/30 bg-gradient-to-r from-accent-purple/10 to-accent-purple/5 p-3.5'
	>
		{/* Badge icon */}
		<div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-xp text-2xl shadow-lg shadow-accent-purple/30'>
			{achievement.iconEmoji}
		</div>

		{/* Info */}
		<div className='flex-1'>
			<span className='block text-xs font-semibold uppercase tracking-wide text-accent-purple'>
				Achievement Unlocked!
			</span>
			<span className='block text-base font-bold'>{achievement.name}</span>
		</div>
	</motion.div>
)

// ============================================
// MAIN COMPONENT
// ============================================

export const ImmediateRewards = ({
	isOpen,
	onClose,
	recipeName,
	recipeImageUrl,
	immediateXp,
	pendingXp,
	streakBonus = 0,
	streakDays = 0,
	creatorTipXp = 0,
	creatorHandle,
	postDeadlineHours,
	unlockedAchievement,
	onPostNow,
	onPostLater,
}: ImmediateRewardsProps) => {
	const [showConfetti, setShowConfetti] = useState(false)
	const [capturedPhotos, setCapturedPhotos] = useState<File[]>([])
	const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Trigger confetti on mount
	useEffect(() => {
		if (isOpen) {
			setShowConfetti(true)
			const timer = setTimeout(() => setShowConfetti(false), 3000)
		}
		// Reset photos when modal opens/closes
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

			// Limit to 3 photos in modal (can add more on post page)
			const newFiles = files.slice(0, 3 - capturedPhotos.length)
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

	const handlePostNowClick = useCallback(() => {
		// Pass captured photos to the callback
		onPostNow(capturedPhotos.length > 0 ? capturedPhotos : undefined)
	}, [onPostNow, capturedPhotos])

	// Calculate totals
	const earnedNow = immediateXp + streakBonus
	const pendingTotal = pendingXp + creatorTipXp

	// Build reward rows
	const rewards: RewardRow[] = [
		{
			type: 'immediate',
			label: 'Immediate XP',
			description: 'Earned for completing',
			xpAmount: immediateXp,
			isLocked: false,
			icon: <Zap className='h-6 w-6 text-success' />,
		},
	]

	if (streakBonus > 0) {
		rewards.push({
			type: 'streak',
			label: `${streakDays}-Day Streak`,
			description: 'Cooking streak bonus',
			xpAmount: streakBonus,
			isLocked: false,
			icon: <Flame className='h-6 w-6 text-warning' />,
		})
	}

	// Locked rewards
	rewards.push({
		type: 'pending',
		label: 'Post Reward',
		description: 'Share your creation to unlock',
		xpAmount: pendingXp,
		isLocked: true,
		icon: <Lock className='h-5 w-5 text-text-muted' />,
	})

	if (creatorTipXp > 0 && creatorHandle) {
		rewards.push({
			type: 'creator-tip',
			label: 'Creator Tip',
			description: `4% to @${creatorHandle}`,
			xpAmount: creatorTipXp,
			isLocked: true,
			icon: <Gift className='h-5 w-5 text-text-muted' />,
		})
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					{/* Confetti */}
					{showConfetti && <ConfettiContainer />}

					{/* Overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm'
					>
						{/* Card */}
						<motion.div
							variants={CELEBRATION_MODAL}
							initial='hidden'
							animate='visible'
							exit='exit'
							className='relative w-full max-w-md overflow-hidden rounded-3xl bg-panel-bg p-8 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-modal max-md:overflow-y-auto max-md:rounded-b-none max-md:p-6'
						>
							{/* Close button */}
							<button
								onClick={onClose}
								className='absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated text-text-muted transition-colors hover:bg-bg-hover hover:text-text'
							>
								<X className='h-5 w-5' />
							</button>

							{/* Header */}
							<div className='mb-7 text-center'>
								<motion.div
									animate={{ y: [0, -10, 0] }}
									transition={{ duration: 0.6, repeat: Infinity }}
									className='mb-4 inline-block text-6xl max-md:text-5xl'
								>
									👨‍🍳
								</motion.div>
								<h1 className='mb-2 bg-gradient-to-r from-success to-success/80 bg-clip-text text-3xl font-extrabold text-transparent max-md:text-2xl'>
									Nice Work, Chef!
								</h1>
								<p className='text-text-muted'>
									You completed{' '}
									<strong className='text-text'>{recipeName}</strong>
								</p>
							</div>

							{/* Rewards Stack */}
							<div className='mb-4 space-y-1 rounded-2xl bg-bg-elevated p-2'>
								{/* Unlocked rewards */}
								{rewards
									.filter(r => !r.isLocked)
									.map((reward, i) => (
										<RewardRowComponent
											key={reward.type}
											reward={reward}
											animationDelay={0.2 + i * 0.1}
										/>
									))}

								{/* Divider with XP split explainer */}
								<div className='flex items-center gap-3 px-3.5 py-2'>
									<div className='h-px flex-1 bg-border' />
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<span className='flex cursor-help items-center gap-1 text-xs uppercase tracking-wide text-text-muted'>
													Post to unlock more
													<Info className='size-3' />
												</span>
											</TooltipTrigger>
											<TooltipContent
												side='bottom'
												className='max-w-xs text-center'
											>
												<p className='text-sm'>
													<strong>Why 70% is locked?</strong>
													<br />
													ChefKix rewards sharing! Post your creation within 14
													days to unlock the full XP reward and inspire the
													community.
												</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
									<div className='h-px flex-1 bg-border' />
								</div>

								{/* Locked rewards */}
								{rewards
									.filter(r => r.isLocked)
									.map((reward, i) => (
										<RewardRowComponent
											key={reward.type}
											reward={reward}
											animationDelay={0.5 + i * 0.1}
										/>
									))}
							</div>

							{/* Totals */}
							<div className='mb-4 grid grid-cols-2 gap-3'>
								<div className='rounded-xl border-2 border-success bg-bg-elevated p-4 text-center'>
									<span className='block text-xs uppercase tracking-wide text-text-muted'>
										Earned Now
									</span>
									<span className='block text-2xl font-extrabold text-success'>
										{earnedNow} XP
									</span>
								</div>
								<div className='rounded-xl border-2 border-dashed border-border bg-bg-elevated p-4 text-center'>
									<span className='block text-xs uppercase tracking-wide text-text-muted'>
										Pending
									</span>
									<span className='block text-2xl font-extrabold text-text-muted'>
										{pendingTotal} XP
									</span>
								</div>
							</div>

							{/* Deadline warning */}
							<div className='mb-4 flex items-center justify-center gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning'>
								<Clock className='h-4 w-4' />
								<span>
									Post within{' '}
									<strong>
										{postDeadlineHours >= 24
											? `${Math.floor(postDeadlineHours / 24)} days`
											: `${postDeadlineHours} hours`}
									</strong>{' '}
									to unlock pending XP
								</span>
							</div>

							{/* Achievement banner */}
							{unlockedAchievement && (
								<AchievementBanner achievement={unlockedAchievement} />
							)}

							{/* Photo Capture Section */}
							<div className='mb-4'>
								<div className='mb-2 flex items-center justify-between'>
									<span className='text-sm font-medium text-text'>
										📸 Capture your dish
									</span>
									<span className='text-xs text-text-muted'>
										{capturedPhotos.length}/3 photos
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
											className='group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl'
										>
											<Image
												src={url}
												alt={`Photo ${index + 1}`}
												fill
												className='object-cover'
											/>
											<button
												onClick={() => removePhoto(index)}
												className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'
											>
												<Trash2 className='h-5 w-5 text-white' />
											</button>
										</motion.div>
									))}

									{/* Add photo button */}
									{capturedPhotos.length < 3 && (
										<label className='flex h-20 w-20 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-elevated transition-colors hover:border-primary hover:bg-bg-hover'>
											<div className='flex flex-col items-center gap-1'>
												<Camera className='h-5 w-5 text-text-muted' />
												<span className='text-xs text-text-muted'>Add</span>
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
										Snap a photo now! 2+ photos = 100% bonus XP 📷
									</p>
								)}
								{capturedPhotos.length === 1 && (
									<p className='mt-2 text-xs text-warning'>
										Add 1 more photo for full XP bonus!
									</p>
								)}
								{capturedPhotos.length >= 2 && (
									<p className='mt-2 text-xs text-success'>
										✓ Full photo bonus unlocked!
									</p>
								)}
							</div>

							{/* Actions */}
							<div className='space-y-2.5'>
								<motion.button
									onClick={handlePostNowClick}
									whileHover={STAT_ITEM_HOVER}
									whileTap={LIST_ITEM_TAP}
									className='flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand to-brand/90 px-6 py-4 text-white shadow-lg shadow-brand/30 transition-shadow hover:shadow-xl hover:shadow-brand/40'
								>
									<div className='flex items-center gap-2.5'>
										<Camera className='h-5 w-5 shrink-0' />
										<span className='text-lg font-bold'>
											{capturedPhotos.length > 0
												? `Share ${capturedPhotos.length} Photo${capturedPhotos.length > 1 ? 's' : ''}`
												: 'Share Your Creation'}
										</span>
									</div>
									<span className='shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold'>
										Unlock +{pendingTotal} XP
									</span>
								</motion.button>
								<button
									onClick={onPostLater}
									className='w-full py-3 text-text-muted transition-colors hover:text-text'
								>
									I&apos;ll Post Later
								</button>
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
}: RewardsToastProps) => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: 20 }}
		transition={TRANSITION_SPRING}
		className='fixed bottom-24 left-1/2 z-modal -translate-x-1/2 rounded-2xl bg-panel-bg p-1 shadow-xl md:bottom-6'
	>
		<div className='flex items-center gap-3 px-4 py-3'>
			<span className='text-xl'>✅</span>
			<span className='text-sm font-semibold'>
				+{earnedXp} XP earned! Post to unlock +{pendingXp} more
			</span>
			<button
				onClick={onPostNow}
				className='rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90'
			>
				Post Now
			</button>
		</div>
	</motion.div>
)
