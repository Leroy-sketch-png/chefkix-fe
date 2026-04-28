'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Camera,
	Clock,
	ChevronDown,
	ExternalLink,
	RefreshCw,
	AlertTriangle,
	X,
	ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import {
	TRANSITION_SPRING,
	fadeInUp,
	staggerContainer,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
	CARD_FEATURED_HOVER,
} from '@/lib/motion'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { hasClaimablePostXp } from '@/lib/cookingXp'

// =============================================================================
// TYPES
// =============================================================================

export interface PendingSession {
	id: string
	recipeId: string
	recipeName: string
	recipeImage: string
	cookedAt: Date
	duration: number // in minutes
	baseXP: number
	currentXP: number // after decay
	expiresAt: Date
	status:
		| 'urgent'
		| 'warning'
		| 'normal'
		| 'expired'
		| 'abandoned'
		| 'post_deleted'
	postId?: string
	rating?: number
	cookCount?: number
	abandonedAtStep?: number
}

interface PendingPostsSectionProps {
	sessions: PendingSession[]
	onPost: (sessionId: string) => void
	onViewPost?: (postId: string) => void
	onRetry?: (sessionId: string) => void
	onDismiss?: () => void
	onViewAll?: () => void
	className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

const getTimeLeft = (
	expiresAt: Date,
	t: (key: string, params?: Record<string, number>) => string,
): string => {
	const now = new Date()
	const diff = expiresAt.getTime() - now.getTime()

	if (diff <= 0) return t('pdExpired')

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(hours / 24)

	if (days > 0) return t('pdDaysLeft', { count: days })
	if (hours > 0) return t('pdHoursLeft', { count: hours })

	const minutes = Math.floor(diff / (1000 * 60))
	return t('pdMinutesLeft', { count: minutes })
}

const getTimeSinceCook = (
	cookedAt: Date,
	t: (key: string, params?: Record<string, number>) => string,
): string => {
	const now = new Date()
	const diff = now.getTime() - cookedAt.getTime()

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(hours / 24)

	if (days > 0) return t('pdCookedDaysAgo', { count: days })
	if (hours > 0) return t('pdCookedHoursAgo', { count: hours })
	return t('pdCookedJustNow')
}

const formatDuration = (minutes: number): string => {
	if (minutes >= 60) {
		const hours = Math.floor(minutes / 60)
		const mins = minutes % 60
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
	}
	return `${minutes}m`
}

// =============================================================================
// SINGLE PENDING POST (INLINE)
// =============================================================================

interface SinglePendingProps {
	session: PendingSession
	onPost: (id: string) => void
	onDismiss?: () => void
}

const SinglePendingPost = ({
	session,
	onPost,
	onDismiss,
}: SinglePendingProps) => {
	const t = useTranslations('pending')
	const hasClaimableXp = hasClaimablePostXp(session.currentXP)
	return (
		<motion.section
			className={cn(
				'bg-bg-card border border-border rounded-2xl overflow-hidden',
				'border-l-4 border-l-primary',
			)}
			variants={fadeInUp}
			initial='hidden'
			animate='visible'
		>
			{/* Header */}
			<div className='flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-brand/5 to-transparent'>
				<div className='flex items-center gap-2'>
					<span className='text-lg'>📸</span>
					<h3 className='text-base font-bold text-text'>
						{hasClaimableXp ? t('pdPostToUnlock') : t('pdPostToShare')}
					</h3>
				</div>
				{onDismiss && (
					<motion.button
						type='button'
						className='p-2 rounded-full bg-muted/50 hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
						onClick={onDismiss}
						whileHover={ICON_BUTTON_HOVER}
						whileTap={ICON_BUTTON_TAP}
						transition={TRANSITION_SPRING}
						aria-label={t('pdDismissLabel')}
					>
						<X className='size-4 text-text-secondary' />
					</motion.button>
				)}
			</div>

			{/* Content */}
			<div className='flex items-center gap-4 p-4'>
				<Image
					src={session.recipeImage}
					alt={session.recipeName}
					width={64}
					height={64}
					className='size-thumbnail-lg rounded-xl object-cover flex-shrink-0'
				/>

				<div className='flex-1 min-w-0'>
					<span className='block text-base font-bold text-text mb-1'>
						{session.recipeName}
					</span>
					<span className='block text-sm text-text-secondary mb-2'>
						{getTimeSinceCook(session.cookedAt, t)}
					</span>
					<div className='flex items-center gap-3'>
						{hasClaimableXp ? (
							<span className='text-sm font-bold text-success bg-success/10 px-2 py-1 rounded-lg tabular-nums'>
								+<AnimatedNumber value={session.currentXP} /> XP
							</span>
						) : (
							<span className='text-sm font-semibold text-warning bg-warning/10 px-2 py-1 rounded-lg'>
								{t('pdNoXpLeft')}
							</span>
						)}
						<span className='flex items-center gap-1 text-sm text-text-secondary'>
							<Clock className='h-3.5 w-3.5' />
							{getTimeLeft(session.expiresAt, t)}
						</span>
					</div>
				</div>

				<motion.button
					type='button'
					className={cn(
						'flex items-center gap-2 px-5 py-3 rounded-xl focus-visible:ring-2 focus-visible:ring-brand/50',
						'bg-brand text-white font-semibold',
						'shadow-warm shadow-primary/30',
					)}
					onClick={() => onPost(session.id)}
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					transition={TRANSITION_SPRING}
				>
					<Camera className='size-4' />
					{hasClaimableXp ? t('pdPostNow') : t('pdPost')}
				</motion.button>
			</div>
		</motion.section>
	)
}

// =============================================================================
// MULTIPLE PENDING POSTS (COLLAPSED PREVIEW)
// =============================================================================

interface MultiplePendingProps {
	sessions: PendingSession[]
	totalXP: number
	onPost: (id: string) => void
	onViewAll?: () => void
}

const MultiplePendingPosts = ({
	sessions,
	totalXP,
	onPost,
	onViewAll,
}: MultiplePendingProps) => {
	const t = useTranslations('pending')
	const urgentSessions = sessions.filter(
		s => s.status === 'urgent' && hasClaimablePostXp(s.currentXP),
	)
	const previewSessions = sessions.slice(0, 2)
	const remaining = sessions.length - previewSessions.length
	const hasClaimableXp = totalXP > 0

	return (
		<motion.section
			className={cn(
				'bg-bg-card border border-border rounded-2xl overflow-hidden',
				'border-l-4 border-l-warning',
			)}
			variants={fadeInUp}
			initial='hidden'
			animate='visible'
		>
			{/* Header */}
			<div className='flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-brand/5 to-transparent'>
				<div className='flex items-center gap-3'>
					<motion.span
						className='text-lg'
						animate={{ scale: [1, 1.15, 1] }}
						transition={{ repeat: Infinity, duration: 2 }}
					>
						📸
					</motion.span>
					<h3 className='text-base font-bold text-text'>
						{t('pdRecipesWaiting', { count: sessions.length })}
					</h3>
					{hasClaimableXp ? (
						<span className='text-sm font-semibold text-success bg-success/10 px-2 py-1 rounded-full tabular-nums'>
							{t('pdXpAvailable', { xp: totalXP })}
						</span>
					) : (
						<span className='text-sm font-semibold text-warning bg-warning/10 px-2 py-1 rounded-full'>
							{t('pdNoXpAvailable')}
						</span>
					)}
				</div>
				<motion.button
					type='button'
					className='flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-bg-hover rounded-lg text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand/50'
					onClick={onViewAll}
					whileHover={BUTTON_SUBTLE_HOVER}
					whileTap={BUTTON_SUBTLE_TAP}
					transition={TRANSITION_SPRING}
				>
					{t('pdViewAll')}
					<ChevronDown className='size-4' />
				</motion.button>
			</div>

			{/* Preview Items */}
			<div className='p-3'>
				{previewSessions.map(session => (
					<motion.div
						key={session.id}
						className={cn(
							'flex items-center gap-3 p-3 rounded-xl mb-1',
							'hover:bg-muted/50 transition-colors',
							session.status === 'urgent' &&
								'bg-error/5 border border-error/20',
						)}
						whileHover={{ x: 2 }}
					>
						<Image
							src={session.recipeImage}
							alt={session.recipeName}
							width={44}
							height={44}
							className='size-11 rounded-lg object-cover'
						/>
						<div className='flex-1 min-w-0'>
							<span className='block text-sm font-semibold text-text'>
								{session.recipeName}
							</span>
							<span
								className={cn(
									'text-xs',
									session.status === 'urgent' &&
										hasClaimablePostXp(session.currentXP)
										? 'text-error font-semibold'
										: 'text-text-secondary',
								)}
							>
								{getTimeLeft(session.expiresAt, t)}
							</span>
						</div>
						{hasClaimablePostXp(session.currentXP) ? (
							<span className='text-sm font-bold text-success tabular-nums'>
								+<AnimatedNumber value={session.currentXP} />
							</span>
						) : (
							<span className='text-xs font-semibold text-warning'>
								{t('pdNoXp')}
							</span>
						)}
						<motion.button
							type='button'
							className={cn(
								'px-3 py-1.5 rounded-lg text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand/50',
								session.status === 'urgent' &&
									hasClaimablePostXp(session.currentXP)
									? 'bg-error text-white'
									: 'bg-brand text-white',
							)}
							onClick={() => onPost(session.id)}
							whileHover={BUTTON_SUBTLE_HOVER}
							whileTap={BUTTON_SUBTLE_TAP}
						>
							{t('pdPost')}
						</motion.button>
					</motion.div>
				))}

				{remaining > 0 && (
					<button
						type='button'
						className='w-full text-center py-2 text-sm text-text-secondary hover:text-brand transition-colors'
						onClick={onViewAll}
					>
						{t('pdMoreRecipes', { count: remaining })}
					</button>
				)}
			</div>
		</motion.section>
	)
}

// =============================================================================
// MANY PENDING POSTS (CONDENSED SUMMARY BAR)
// =============================================================================

interface ManyPendingProps {
	sessions: PendingSession[]
	totalXP: number
	urgentCount: number
	onViewAll?: () => void
}

const ManyPendingPosts = ({
	sessions,
	totalXP,
	urgentCount,
	onViewAll,
}: ManyPendingProps) => {
	const t = useTranslations('pending')
	const hasClaimableXp = totalXP > 0
	return (
		<motion.section
			className={cn(
				'bg-bg-card border border-border rounded-2xl overflow-hidden',
				hasClaimableXp && urgentCount > 0
					? 'border-l-4 border-l-error'
					: 'border-l-4 border-l-warning',
			)}
			variants={fadeInUp}
			initial='hidden'
			animate='visible'
		>
			<div
				className={cn(
					'flex items-center gap-3 px-4 py-3',
					hasClaimableXp && urgentCount > 0
						? 'bg-gradient-to-r from-error/10 to-transparent'
						: 'bg-gradient-to-r from-warning/10 to-transparent',
				)}
			>
				{hasClaimableXp && urgentCount > 0 && (
					<div className='flex items-center gap-2'>
						<span className='text-lg'>🚨</span>
						<span className='text-sm font-semibold text-error'>
							{t('pdExpiringSoon', { count: urgentCount })}
						</span>
					</div>
				)}

				<span className='flex-1 text-sm text-text-secondary text-right'>
					{hasClaimableXp
						? t('pdPendingXp', { count: sessions.length, xp: totalXP })
						: t('pdPendingNoXp', { count: sessions.length })}
				</span>

				<motion.button
					type='button'
					className='flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand/50'
					onClick={onViewAll}
					whileHover={BUTTON_SUBTLE_HOVER}
					whileTap={BUTTON_SUBTLE_TAP}
					transition={TRANSITION_SPRING}
				>
					{t('pdViewAll')}
					<ArrowRight className='size-4' />
				</motion.button>
			</div>
		</motion.section>
	)
}

// =============================================================================
// PENDING POSTS SECTION (MAIN EXPORT)
// =============================================================================

export const PendingPostsSection = ({
	sessions,
	onPost,
	onViewPost,
	onRetry,
	onDismiss,
	onViewAll,
	className,
}: PendingPostsSectionProps) => {
	// Filter only pending sessions (not expired, not abandoned, not posted)
	const pendingSessions = sessions.filter(
		s =>
			!s.postId &&
			s.status !== 'expired' &&
			s.status !== 'abandoned' &&
			s.status !== 'post_deleted',
	)

	if (pendingSessions.length === 0) {
		return null // Don't render if no pending posts
	}

	const totalXP = pendingSessions.reduce((sum, s) => sum + s.currentXP, 0)
	const urgentCount = pendingSessions.filter(
		s => s.status === 'urgent' && hasClaimablePostXp(s.currentXP),
	).length

	// Render based on count
	if (pendingSessions.length === 1) {
		return (
			<div className={className}>
				<SinglePendingPost
					session={pendingSessions[0]}
					onPost={onPost}
					onDismiss={onDismiss}
				/>
			</div>
		)
	}

	if (pendingSessions.length <= 3) {
		return (
			<div className={className}>
				<MultiplePendingPosts
					sessions={pendingSessions}
					totalXP={totalXP}
					onPost={onPost}
					onViewAll={onViewAll}
				/>
			</div>
		)
	}

	// 4+ pending posts
	return (
		<div className={className}>
			<ManyPendingPosts
				sessions={pendingSessions}
				totalXP={totalXP}
				urgentCount={urgentCount}
				onViewAll={onViewAll}
			/>
		</div>
	)
}

// =============================================================================
// EXPANDED PENDING MODAL
// =============================================================================

interface PendingExpandedModalProps {
	isOpen: boolean
	sessions: PendingSession[]
	onClose: () => void
	onPost: (sessionId: string) => void
}

export const PendingExpandedModal = ({
	isOpen,
	sessions,
	onClose,
	onPost,
}: PendingExpandedModalProps) => {
	const t = useTranslations('pending')
	useEscapeKey(isOpen, onClose)

	const pendingSessions = sessions.filter(
		s =>
			!s.postId &&
			s.status !== 'expired' &&
			s.status !== 'abandoned' &&
			s.status !== 'post_deleted',
	)
	const totalXP = pendingSessions.reduce((sum, s) => sum + s.currentXP, 0)
	const urgentSessions = pendingSessions.filter(
		s =>
			hasClaimablePostXp(s.currentXP) &&
			(s.status === 'urgent' || s.status === 'warning'),
	)
	const hasClaimableXp = totalXP > 0

	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					<motion.div
						role='dialog'
						aria-modal='true'
						aria-label='Pending posts'
						className='fixed inset-0 z-modal bg-black/60 flex items-end justify-center'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<motion.div
							className='bg-bg-card rounded-t-3xl w-full max-w-lg max-h-sheet-mobile flex flex-col'
							initial={{ y: '100%' }}
							animate={{ y: 0 }}
							exit={{ y: '100%' }}
							transition={TRANSITION_SPRING}
						>
							{/* Header */}
							<div className='flex items-center gap-3 px-6 py-5 border-b border-border'>
								<h2 className='text-xl font-bold text-text'>
									{t('pdPendingPosts')}
								</h2>
								<span className='text-sm text-text-secondary'>
									{hasClaimableXp
										? t('pdRecipesXpAvailable', {
												count: pendingSessions.length,
												xp: totalXP,
											})
										: t('pdPendingNoXp', {
												count: pendingSessions.length,
											})}
								</span>
								<motion.button
									type='button'
									className='ml-auto p-2 rounded-full bg-muted/50 hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-brand/50'
									onClick={onClose}
									whileHover={ICON_BUTTON_HOVER}
									whileTap={ICON_BUTTON_TAP}
									transition={TRANSITION_SPRING}
									aria-label={t('pdCloseLabel')}
								>
									<X className='size-5 text-text-secondary' />
								</motion.button>
							</div>

							{/* Urgency Banner */}
							{urgentSessions.length > 0 && (
								<div className='flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-error to-error/80 text-white text-sm font-semibold'>
									<AlertTriangle className='size-4' />
									{t('pdExpireWithin24', { count: urgentSessions.length })}
								</div>
							)}

							{/* List */}
							<motion.div
								className='flex-1 overflow-y-auto p-4 space-y-3'
								variants={staggerContainer}
								initial='hidden'
								animate='visible'
							>
								{pendingSessions.map(session => (
									<motion.div
										key={session.id}
										className={cn(
											'bg-muted/30 rounded-2xl overflow-hidden',
											session.status === 'urgent' && 'border border-error/30',
											session.status === 'warning' &&
												'border border-warning/30',
										)}
										variants={fadeInUp}
									>
										{/* Urgency Tag */}
										{hasClaimablePostXp(session.currentXP) &&
											(session.status === 'urgent' ||
												session.status === 'warning') && (
												<div
													className={cn(
														'px-4 py-2 text-xs font-bold uppercase tracking-wide text-white',
														session.status === 'urgent'
															? 'bg-gradient-to-r from-error to-error/80'
															: 'bg-gradient-to-r from-warning to-warning/80',
													)}
												>
													{session.status === 'urgent'
														? t('pdExpiresIn', {
																time: getTimeLeft(session.expiresAt, t),
															})
														: getTimeLeft(session.expiresAt, t)}
												</div>
											)}

										{/* Content */}
										<div className='flex items-center gap-4 p-4'>
											<Image
												src={session.recipeImage}
												alt={session.recipeName}
												width={64}
												height={64}
												className='size-16 rounded-xl object-cover'
											/>
											<div className='flex-1 min-w-0'>
												<span className='block text-base font-bold text-text'>
													{session.recipeName}
												</span>
												<span className='block text-sm text-text-secondary'>
													{getTimeSinceCook(session.cookedAt, t)}
												</span>
												{/* Decay indicator - only shown when actual time-based decay */}
												{session.currentXP < session.baseXP &&
													session.currentXP > 0 && (
														<div className='mt-2'>
															<div className='h-1 bg-border rounded-full overflow-hidden w-32'>
																<div
																	className='h-full bg-gradient-to-r from-error to-warning rounded-full'
																	style={{
																		width: `${((session.baseXP - session.currentXP) / session.baseXP) * 100}%`,
																	}}
																/>
															</div>
															<span className='text-xs text-error font-semibold tabular-nums'>
																{t('pdTimeDecay', {
																	percent: Math.round(
																		((session.baseXP - session.currentXP) /
																			session.baseXP) *
																			100,
																	),
																})}
															</span>
														</div>
													)}
											</div>
											<div className='text-right'>
												{hasClaimablePostXp(session.currentXP) ? (
													<span
														className={cn(
															'block text-lg font-bold tabular-nums',
															session.status === 'urgent'
																? 'text-error'
																: 'text-success',
														)}
													>
														+<AnimatedNumber value={session.currentXP} /> XP
													</span>
												) : (
													<span className='block text-sm font-semibold text-warning'>
														{t('pdNoXp')}
													</span>
												)}
												{/* Only show original if there's actual decay */}
												{session.currentXP < session.baseXP &&
													session.currentXP > 0 && (
														<span className='text-xs text-text-secondary line-through'>
															{t('pdWasXp', { xp: session.baseXP })}
														</span>
													)}
											</div>
											<motion.button
												type='button'
												className={cn(
													'px-4 py-2.5 rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand/50',
													session.status === 'urgent' &&
														hasClaimablePostXp(session.currentXP)
														? 'bg-error text-white'
														: 'bg-brand text-white',
												)}
												onClick={() => onPost(session.id)}
												whileHover={BUTTON_SUBTLE_HOVER}
												whileTap={BUTTON_SUBTLE_TAP}
												transition={TRANSITION_SPRING}
											>
												{session.status === 'urgent' &&
												hasClaimablePostXp(session.currentXP)
													? t('pdPostNowUrgent')
													: t('pdPost')}
											</motion.button>
										</div>
									</motion.div>
								))}
							</motion.div>

							{/* Footer */}
							<div className='p-5 border-t border-border bg-muted/30'>
								<p className='text-sm text-text-secondary text-center mb-4'>
									{hasClaimableXp ? t('pdTipFooter') : t('pdTipFooterNoXp')}
								</p>
								<motion.button
									type='button'
									className='w-full py-3 bg-brand text-white rounded-xl font-semibold focus-visible:ring-2 focus-visible:ring-brand/50'
									onClick={onClose}
									whileHover={CARD_FEATURED_HOVER}
									whileTap={BUTTON_TAP}
									transition={TRANSITION_SPRING}
								>
									{t('pdDone')}
								</motion.button>
							</div>
						</motion.div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}

export default PendingPostsSection
