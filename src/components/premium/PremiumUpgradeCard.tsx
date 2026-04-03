'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Crown,
	Sparkles,
	Check,
	X,
	Shield,
	Palette,
	Volume2,
	BarChart3,
	HeadphonesIcon,
	Bookmark,
	Zap,
	Trophy,
	Gem,
	Loader2,
	AlertTriangle,
	ChefHat,
	Users,
	BookOpen,
	Camera,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	TRANSITION_SPRING,
	FADE_IN_VARIANTS,
	staggerContainer,
} from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { SubscriptionResponse } from '@/lib/types/subscription'
import {
	getMySubscription,
	startTrial,
	cancelSubscription,
} from '@/services/subscription'

// ============================================
// FEATURE CONFIG
// ============================================

interface FeatureConfig {
	icon: typeof Crown
	label: string
	description: string
	free: boolean
	premium: boolean
}

const FEATURES: FeatureConfig[] = [
	{
		icon: ChefHat,
		label: 'Cooking Sessions & XP',
		description: 'Cook recipes and earn experience points',
		free: true,
		premium: true,
	},
	{
		icon: Camera,
		label: 'Post Your Creations',
		description: 'Share cooking photos with the community',
		free: true,
		premium: true,
	},
	{
		icon: BookOpen,
		label: 'Browse All Recipes',
		description: 'Access the full recipe library',
		free: true,
		premium: true,
	},
	{
		icon: Users,
		label: 'Social Features',
		description: 'Follow friends, like, comment, and chat',
		free: true,
		premium: true,
	},
	{
		icon: Bookmark,
		label: 'Saved Recipes',
		description: 'Save your favorite recipes for quick access',
		free: true,
		premium: true,
	},
	{
		icon: Shield,
		label: 'Ad-Free Experience',
		description: 'Browse without interruptions',
		free: false,
		premium: true,
	},
	{
		icon: Gem,
		label: 'Premium Badges',
		description: 'Exclusive badges to show off your status',
		free: false,
		premium: true,
	},
	{
		icon: Palette,
		label: 'Custom Profile Themes',
		description: 'Stand out with unique profile designs',
		free: false,
		premium: true,
	},
	{
		icon: Volume2,
		label: 'Custom Timer Sounds',
		description: 'Personalize your cooking timer alerts',
		free: false,
		premium: true,
	},
	{
		icon: BarChart3,
		label: 'Advanced Analytics',
		description: 'Deep insights into your cooking journey',
		free: false,
		premium: true,
	},
	{
		icon: HeadphonesIcon,
		label: 'Priority Support',
		description: 'Get help faster when you need it',
		free: false,
		premium: true,
	},
	{
		icon: Zap,
		label: 'Early Access',
		description: 'Try new features before everyone else',
		free: false,
		premium: true,
	},
	{
		icon: Trophy,
		label: 'Exclusive Challenges',
		description: 'Premium-only challenges with rare badges',
		free: false,
		premium: true,
	},
	{
		icon: Sparkles,
		label: 'Premium Cosmetics',
		description: 'Unique visual effects and profile flair',
		free: false,
		premium: true,
	},
]

// ============================================
// COMPONENT
// ============================================

export default function PremiumUpgradeCard() {
	const [subscription, setSubscription] = useState<SubscriptionResponse | null>(
		null,
	)
	const [isLoading, setIsLoading] = useState(true)
	const [isActioning, setIsActioning] = useState(false)
	const [showCancelConfirm, setShowCancelConfirm] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchSubscription = useCallback(async () => {
		try {
			setError(null)
			const response = await getMySubscription()
			if (response.success && response.data) {
				setSubscription(response.data)
			}
		} catch {
			setError('Failed to load subscription info')
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchSubscription()
	}, [fetchSubscription])

	const handleStartTrial = async () => {
		setIsActioning(true)
		try {
			const response = await startTrial()
			if (response.success && response.data) {
				setSubscription(response.data)
				toast.success('Welcome to Premium! Your 7-day trial has started.')
			}
		} catch {
			toast.error('Failed to start trial. Please try again.')
		} finally {
			setIsActioning(false)
		}
	}

	const handleCancel = async () => {
		setIsActioning(true)
		try {
			const response = await cancelSubscription()
			if (response.success && response.data) {
				setSubscription(response.data)
				setShowCancelConfirm(false)
				toast.success(
					"Subscription cancelled. You'll retain access until the end of your billing period.",
				)
			}
		} catch {
			toast.error('Failed to cancel subscription. Please try again.')
		} finally {
			setIsActioning(false)
		}
	}

	// Loading skeleton
	if (isLoading) {
		return (
			<div className='space-y-6'>
				<div className='h-8 w-48 animate-pulse rounded-lg bg-bg-elevated' />
				<div className='h-32 animate-pulse rounded-xl bg-bg-elevated' />
				<div className='grid gap-3'>
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className='h-16 animate-pulse rounded-lg bg-bg-elevated'
						/>
					))}
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className='flex flex-col items-center gap-4 py-12 text-center'>
				<AlertTriangle className='size-8 text-text-muted' />
				<p className='text-text-secondary'>{error}</p>
				<Button variant='outline' onClick={fetchSubscription}>
					Try Again
				</Button>
			</div>
		)
	}

	const isPremium = subscription?.premium ?? false
	const isTrialActive = subscription?.trialActive ?? false
	const trialUsed = subscription?.trialUsed ?? false
	const cancelledAtPeriodEnd = subscription?.cancelledAtPeriodEnd ?? false

	return (
		<motion.div
			variants={staggerContainer}
			initial='hidden'
			animate='visible'
			className='space-y-6'
		>
			{/* Current Plan Banner */}
			<motion.div
				variants={FADE_IN_VARIANTS}
				className={cn(
					'relative overflow-hidden rounded-xl border p-6',
					isPremium
						? 'border-level/30 bg-gradient-to-br from-level/10 via-level/5 to-transparent'
						: 'border-border-subtle bg-bg-card',
				)}
			>
				<div className='relative z-10 flex items-start justify-between'>
					<div>
						<div className='flex items-center gap-2'>
							{isPremium ? (
								<Crown className='size-6 text-level' />
							) : (
								<Sparkles className='size-6 text-text-muted' />
							)}
							<h3 className='text-lg font-bold text-text'>
								{isPremium ? 'ChefKix Premium' : 'ChefKix Free'}
							</h3>
						</div>
						<p className='mt-1 text-sm text-text-secondary'>
							{isPremium
								? isTrialActive
									? 'Trial active — enjoying all premium features!'
									: cancelledAtPeriodEnd
										? `Cancelled — access until ${subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'end of period'}`
										: 'Full premium access — thank you for your support!'
								: 'Upgrade to unlock exclusive features and enhance your cooking journey.'}
						</p>
					</div>
					{isPremium && (
						<motion.div
							animate={{ rotate: [0, 5, -5, 0] }}
							transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
						>
							<Crown className='size-10 text-level' />
						</motion.div>
					)}
				</div>

				{/* Subtle shimmer for premium */}
				{isPremium && (
					<div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent' />
				)}
			</motion.div>

			{/* Feature Comparison Grid */}
			<motion.div variants={FADE_IN_VARIANTS} className='space-y-3'>
				<h4 className='text-sm font-semibold uppercase tracking-wider text-text-muted'>
					Free vs Premium
				</h4>

				{/* Column headers */}
				<div className='flex items-center gap-3 px-4 py-2'>
					<div className='flex-1' />
					<span className='w-14 shrink-0 text-center text-xs font-semibold uppercase text-text-muted'>
						Free
					</span>
					<span className='w-14 shrink-0 text-center text-xs font-semibold uppercase text-level'>
						Pro
					</span>
				</div>

				<div className='grid gap-1.5'>
					{FEATURES.map(feature => {
						const Icon = feature.icon
						const isPremiumOnly = !feature.free && feature.premium
						return (
							<motion.div
								key={feature.label}
								variants={FADE_IN_VARIANTS}
								className={cn(
									'flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors',
									isPremiumOnly
										? 'border-level/20 bg-level/5'
										: 'border-border-subtle bg-bg-card',
								)}
							>
								<div
									className={cn(
										'flex size-7 shrink-0 items-center justify-center rounded-lg',
										isPremiumOnly
											? 'bg-level/10 text-level'
											: 'bg-bg-elevated text-text-muted',
									)}
								>
									<Icon className='size-3.5' />
								</div>
								<div className='min-w-0 flex-1'>
									<p className='text-sm font-medium text-text'>
										{feature.label}
									</p>
								</div>
								<div className='w-14 shrink-0 flex justify-center'>
									{feature.free ? (
										<Check className='size-4 text-success' />
									) : (
										<X className='size-4 text-text-muted/30' />
									)}
								</div>
								<div className='w-14 shrink-0 flex justify-center'>
									{feature.premium ? (
										<Check className='size-4 text-success' />
									) : (
										<X className='size-4 text-text-muted/30' />
									)}
								</div>
							</motion.div>
						)
					})}
				</div>
			</motion.div>

			{/* Action Buttons */}
			<motion.div variants={FADE_IN_VARIANTS} className='space-y-3 pt-2'>
				{!isPremium && (
					<>
						{!trialUsed && (
							<Button
								onClick={handleStartTrial}
								disabled={isActioning}
								className='w-full bg-gradient-gold text-white shadow-warm hover:opacity-90'
								size='lg'
							>
								{isActioning ? (
									<Loader2 className='mr-2 size-4 animate-spin' />
								) : (
									<Crown className='mr-2 size-4' />
								)}
								Start 7-Day Free Trial
							</Button>
						)}
						<p className='text-center text-xs text-text-muted'>
							{trialUsed
								? 'Your free trial has been used. Subscribe to access premium features.'
								: 'No credit card required. Cancel anytime during trial.'}
						</p>
					</>
				)}

				{isPremium && !cancelledAtPeriodEnd && (
					<>
						{!showCancelConfirm ? (
							<button
								onClick={() => setShowCancelConfirm(true)}
								className='w-full text-center text-sm text-text-muted underline-offset-2 hover:text-text-secondary hover:underline'
							>
								Cancel subscription
							</button>
						) : (
							<AnimatePresence>
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={TRANSITION_SPRING}
									className='overflow-hidden rounded-lg border border-error/20 bg-error/5 p-4'
								>
									<p className='text-sm font-medium text-error'>
										Are you sure you want to cancel?
									</p>
									<p className='mt-1 text-xs text-error/70'>
										You&apos;ll retain premium access until the end of your
										current billing period.
									</p>
									<div className='mt-3 flex gap-2'>
										<Button
											variant='destructive'
											size='sm'
											onClick={handleCancel}
											disabled={isActioning}
										>
											{isActioning ? (
												<Loader2 className='mr-1 size-3 animate-spin' />
											) : null}
											Yes, Cancel
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() => setShowCancelConfirm(false)}
										>
											Keep Premium
										</Button>
									</div>
								</motion.div>
							</AnimatePresence>
						)}
					</>
				)}

				{isPremium && cancelledAtPeriodEnd && (
					<p className='text-center text-sm text-warning'>
						Your subscription is cancelled but active until{' '}
						{subscription?.endDate
							? new Date(subscription.endDate).toLocaleDateString()
							: 'end of period'}
						.
					</p>
				)}
			</motion.div>
		</motion.div>
	)
}
