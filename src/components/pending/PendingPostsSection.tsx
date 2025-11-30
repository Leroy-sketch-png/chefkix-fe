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
import { TRANSITION_SPRING, fadeInUp, staggerContainer } from '@/lib/motion'

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
	status: 'urgent' | 'warning' | 'normal' | 'expired' | 'abandoned'
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

const getTimeLeft = (expiresAt: Date): string => {
	const now = new Date()
	const diff = expiresAt.getTime() - now.getTime()

	if (diff <= 0) return 'Expired'

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(hours / 24)

	if (days > 0) return `${days}d left`
	if (hours > 0) return `${hours}h left`

	const minutes = Math.floor(diff / (1000 * 60))
	return `${minutes}m left`
}

const getTimeSinceCook = (cookedAt: Date): string => {
	const now = new Date()
	const diff = now.getTime() - cookedAt.getTime()

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(hours / 24)

	if (days > 0) return `Cooked ${days} day${days > 1 ? 's' : ''} ago`
	if (hours > 0) return `Cooked ${hours} hour${hours > 1 ? 's' : ''} ago`
	return 'Cooked just now'
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
	return (
		<motion.section
			className={cn(
				'bg-panel-bg border border-border rounded-2xl overflow-hidden',
				'border-l-4 border-l-primary',
			)}
			variants={fadeInUp}
			initial='hidden'
			animate='visible'
		>
			{/* Header */}
			<div className='flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent'>
				<div className='flex items-center gap-2'>
					<span className='text-lg'>📸</span>
					<h3 className='text-base font-bold text-foreground'>
						Post to unlock XP
					</h3>
				</div>
				{onDismiss && (
					<motion.button
						className='p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors'
						onClick={onDismiss}
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
					>
						<X className='h-4 w-4 text-muted-foreground' />
					</motion.button>
				)}
			</div>

			{/* Content */}
			<div className='flex items-center gap-4 p-4'>
				<Image
					src={session.recipeImage}
					alt={session.recipeName}
					className='size-thumbnail-lg rounded-xl object-cover flex-shrink-0'
				/>

				<div className='flex-1 min-w-0'>
					<span className='block text-base font-bold text-foreground mb-1'>
						{session.recipeName}
					</span>
					<span className='block text-sm text-muted-foreground mb-2'>
						{getTimeSinceCook(session.cookedAt)}
					</span>
					<div className='flex items-center gap-3'>
						<span className='text-sm font-bold text-success bg-success/10 px-2 py-1 rounded-lg'>
							+{session.currentXP} XP
						</span>
						<span className='flex items-center gap-1 text-sm text-muted-foreground'>
							<Clock className='h-3.5 w-3.5' />
							{getTimeLeft(session.expiresAt)}
						</span>
					</div>
				</div>

				<motion.button
					className={cn(
						'flex items-center gap-2 px-5 py-3 rounded-xl',
						'bg-primary text-primary-foreground font-semibold',
						'shadow-lg shadow-primary/30',
					)}
					onClick={() => onPost(session.id)}
					whileHover={{ scale: 1.02, y: -2 }}
					whileTap={{ scale: 0.98 }}
				>
					<Camera className='h-4 w-4' />
					Post Now
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
	const urgentSessions = sessions.filter(s => s.status === 'urgent')
	const previewSessions = sessions.slice(0, 2)
	const remaining = sessions.length - previewSessions.length

	return (
		<motion.section
			className={cn(
				'bg-panel-bg border border-border rounded-2xl overflow-hidden',
				'border-l-4 border-l-warning',
			)}
			variants={fadeInUp}
			initial='hidden'
			animate='visible'
		>
			{/* Header */}
			<div className='flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent'>
				<div className='flex items-center gap-3'>
					<motion.span
						className='text-lg'
						animate={{ scale: [1, 1.15, 1] }}
						transition={{ repeat: Infinity, duration: 2 }}
					>
						📸
					</motion.span>
					<h3 className='text-base font-bold text-foreground'>
						{sessions.length} recipes waiting
					</h3>
					<span className='text-sm font-semibold text-success bg-success/10 px-2 py-1 rounded-full'>
						+{totalXP} XP available
					</span>
				</div>
				<motion.button
					className='flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg text-sm font-semibold transition-colors'
					onClick={onViewAll}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					View All
					<ChevronDown className='h-4 w-4' />
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
							className='w-11 h-11 rounded-lg object-cover'
						/>
						<div className='flex-1 min-w-0'>
							<span className='block text-sm font-semibold text-foreground'>
								{session.recipeName}
							</span>
							<span
								className={cn(
									'text-xs',
									session.status === 'urgent'
										? 'text-error font-semibold'
										: 'text-muted-foreground',
								)}
							>
								{getTimeLeft(session.expiresAt)}
							</span>
						</div>
						<span className='text-sm font-bold text-success'>
							+{session.currentXP}
						</span>
						<motion.button
							className={cn(
								'px-3 py-1.5 rounded-lg text-sm font-semibold',
								session.status === 'urgent'
									? 'bg-error text-white'
									: 'bg-primary text-primary-foreground',
							)}
							onClick={() => onPost(session.id)}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							Post
						</motion.button>
					</motion.div>
				))}

				{remaining > 0 && (
					<button
						className='w-full text-center py-2 text-sm text-muted-foreground hover:text-primary transition-colors'
						onClick={onViewAll}
					>
						+{remaining} more recipe{remaining > 1 ? 's' : ''} • Tap to see all
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
	return (
		<motion.section
			className={cn(
				'bg-panel-bg border border-border rounded-2xl overflow-hidden',
				urgentCount > 0
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
					urgentCount > 0
						? 'bg-gradient-to-r from-error/10 to-transparent'
						: 'bg-gradient-to-r from-warning/10 to-transparent',
				)}
			>
				{urgentCount > 0 && (
					<div className='flex items-center gap-2'>
						<span className='text-lg'>🚨</span>
						<span className='text-sm font-semibold text-error'>
							{urgentCount} recipe{urgentCount > 1 ? 's' : ''} expiring soon!
						</span>
					</div>
				)}

				<span className='flex-1 text-sm text-muted-foreground text-right'>
					{sessions.length} pending • +{totalXP} XP
				</span>

				<motion.button
					className='flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold'
					onClick={onViewAll}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					View All
					<ArrowRight className='h-4 w-4' />
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
		s => !s.postId && s.status !== 'expired' && s.status !== 'abandoned',
	)

	if (pendingSessions.length === 0) {
		return null // Don't render if no pending posts
	}

	const totalXP = pendingSessions.reduce((sum, s) => sum + s.currentXP, 0)
	const urgentCount = pendingSessions.filter(s => s.status === 'urgent').length

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
	const pendingSessions = sessions.filter(
		s => !s.postId && s.status !== 'expired' && s.status !== 'abandoned',
	)
	const totalXP = pendingSessions.reduce((sum, s) => sum + s.currentXP, 0)
	const urgentSessions = pendingSessions.filter(
		s => s.status === 'urgent' || s.status === 'warning',
	)

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						className='bg-panel-bg rounded-t-3xl w-full max-w-lg max-h-[85vh] flex flex-col'
						initial={{ y: '100%' }}
						animate={{ y: 0 }}
						exit={{ y: '100%' }}
						transition={TRANSITION_SPRING}
					>
						{/* Header */}
						<div className='flex items-center gap-3 px-6 py-5 border-b border-border'>
							<h2 className='text-xl font-bold text-foreground'>
								Pending Posts
							</h2>
							<span className='text-sm text-muted-foreground'>
								{pendingSessions.length} recipes • +{totalXP} XP available
							</span>
							<motion.button
								className='ml-auto p-2 rounded-full bg-muted/50 hover:bg-muted'
								onClick={onClose}
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
							>
								<X className='h-5 w-5 text-muted-foreground' />
							</motion.button>
						</div>

						{/* Urgency Banner */}
						{urgentSessions.length > 0 && (
							<div className='flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-error to-error/80 text-white text-sm font-semibold'>
								<AlertTriangle className='h-4 w-4' />
								{urgentSessions.length} recipe
								{urgentSessions.length > 1 ? 's' : ''} expire within 24 hours.
								Post now to claim XP!
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
										session.status === 'warning' && 'border border-warning/30',
									)}
									variants={fadeInUp}
								>
									{/* Urgency Tag */}
									{(session.status === 'urgent' ||
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
												? `Expires in ${getTimeLeft(session.expiresAt)}`
												: getTimeLeft(session.expiresAt)}
										</div>
									)}

									{/* Content */}
									<div className='flex items-center gap-4 p-4'>
										<Image
											src={session.recipeImage}
											alt={session.recipeName}
											className='w-16 h-16 rounded-xl object-cover'
										/>
										<div className='flex-1 min-w-0'>
											<span className='block text-base font-bold text-foreground'>
												{session.recipeName}
											</span>
											<span className='block text-sm text-muted-foreground'>
												{getTimeSinceCook(session.cookedAt)}
											</span>
											{session.status === 'urgent' &&
												session.currentXP < session.baseXP && (
													<div className='mt-2'>
														<div className='h-1 bg-border rounded-full overflow-hidden w-32'>
															<div
																className='h-full bg-gradient-to-r from-error to-warning rounded-full'
																style={{
																	width: `${((session.baseXP - session.currentXP) / session.baseXP) * 100}%`,
																}}
															/>
														</div>
														<span className='text-xs text-error font-semibold'>
															XP decaying
														</span>
													</div>
												)}
										</div>
										<div className='text-right'>
											<span
												className={cn(
													'block text-lg font-bold',
													session.status === 'urgent'
														? 'text-error'
														: 'text-success',
												)}
											>
												+{session.currentXP} XP
											</span>
											{session.currentXP < session.baseXP && (
												<span className='text-xs text-muted-foreground line-through'>
													was +{session.baseXP}
												</span>
											)}
										</div>
										<motion.button
											className={cn(
												'px-4 py-2.5 rounded-xl text-sm font-semibold',
												session.status === 'urgent'
													? 'bg-error text-white'
													: 'bg-primary text-primary-foreground',
											)}
											onClick={() => onPost(session.id)}
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
										>
											{session.status === 'urgent' ? 'POST NOW' : 'Post'}
										</motion.button>
									</div>
								</motion.div>
							))}
						</motion.div>

						{/* Footer */}
						<div className='p-5 border-t border-border bg-muted/30'>
							<p className='text-sm text-muted-foreground text-center mb-4'>
								💡 Post photos of your creations to unlock XP and badges!
							</p>
							<motion.button
								className='w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold'
								onClick={onClose}
								whileHover={{ scale: 1.01 }}
								whileTap={{ scale: 0.99 }}
							>
								Done
							</motion.button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default PendingPostsSection
