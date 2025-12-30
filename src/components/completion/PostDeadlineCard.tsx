'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
	Clock,
	AlertCircle,
	AlertTriangle,
	Timer,
	Upload,
	X,
	ChevronDown,
	ChevronUp,
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

type DeadlineState = 'normal' | 'warning' | 'urgent' | 'expired'

interface PendingPost {
	id: string
	recipeName: string
	recipeImageUrl?: string
	pendingXp: number
	deadlineAt: Date
	cookedAt?: Date
}

interface PostDeadlineCardProps {
	recipeName: string
	recipeImageUrl?: string
	pendingXp: number
	deadlineAt: Date
	onPost?: () => void
	onDismiss?: () => void
	className?: string
}

interface PostDeadlineStackProps {
	pendingPosts: PendingPost[]
	onPost?: (postId: string) => void
	className?: string
}

interface PostDeadlineBadgeProps {
	count: number
	totalXp: number
	onClick?: () => void
	className?: string
}

interface PostDeadlineMobileStripProps {
	recipeName: string
	pendingXp: number
	deadlineAt: Date
	onPost?: () => void
	className?: string
}

// ============================================
// UTILITIES
// ============================================

const getDeadlineState = (deadlineAt: Date): DeadlineState => {
	const now = new Date()
	const diff = deadlineAt.getTime() - now.getTime()
	const hoursLeft = diff / (1000 * 60 * 60)

	if (diff <= 0) return 'expired'
	if (hoursLeft < 2) return 'urgent'
	if (hoursLeft < 6) return 'warning'
	return 'normal'
}

const formatTimeRemaining = (deadlineAt: Date): string => {
	const now = new Date()
	const diff = deadlineAt.getTime() - now.getTime()

	if (diff <= 0) return 'Expired'

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
	const seconds = Math.floor((diff % (1000 * 60)) / 1000)

	if (hours > 0) {
		return `${hours}h ${minutes}m left`
	}
	if (minutes > 0) {
		return `${minutes}:${seconds.toString().padStart(2, '0')}`
	}
	return `${seconds}s`
}

// ============================================
// POST DEADLINE CARD (Main Component)
// ============================================

export const PostDeadlineCard = ({
	recipeName,
	recipeImageUrl,
	pendingXp,
	deadlineAt,
	onPost,
	onDismiss,
	className,
}: PostDeadlineCardProps) => {
	const [timeRemaining, setTimeRemaining] = useState(
		formatTimeRemaining(deadlineAt),
	)
	const state = useMemo(() => getDeadlineState(deadlineAt), [deadlineAt])

	// Update countdown every second for urgent state, every minute otherwise
	useEffect(() => {
		const interval = setInterval(
			() => {
				setTimeRemaining(formatTimeRemaining(deadlineAt))
			},
			state === 'urgent' ? 1000 : 60000,
		)
		return () => clearInterval(interval)
	}, [deadlineAt, state])

	const stateConfig = {
		normal: {
			icon: '📸',
			label: 'Unlock your reward!',
			borderClass: 'border-border',
			bgClass: '',
			labelClass: 'text-primary',
			deadlineClass: 'text-muted-foreground',
			xpBgClass: 'bg-success/10',
			xpTextClass: 'text-success',
			buttonClass: 'bg-primary hover:bg-primary/90',
			ClockIcon: Clock,
		},
		warning: {
			icon: '⏰',
			label: 'Time running out!',
			borderClass: 'border-gold/40',
			bgClass: 'bg-gold/5',
			labelClass: 'text-gold',
			deadlineClass: 'text-gold',
			xpBgClass: 'bg-success/10',
			xpTextClass: 'text-success',
			buttonClass: 'bg-gold hover:bg-gold/90',
			ClockIcon: AlertCircle,
		},
		urgent: {
			icon: '🚨',
			label: 'LAST CHANCE!',
			borderClass: 'border-red-500/40',
			bgClass: '',
			labelClass: 'text-red-500 animate-pulse',
			deadlineClass: 'text-red-500 font-bold',
			xpBgClass: 'bg-red-500/10',
			xpTextClass: 'text-red-500',
			buttonClass: 'bg-red-500 hover:bg-red-600',
			ClockIcon: Timer,
		},
		expired: {
			icon: '😢',
			label: 'XP Expired',
			borderClass: 'border-border',
			bgClass: 'opacity-70',
			labelClass: 'text-muted-foreground',
			deadlineClass: 'text-muted-foreground',
			xpBgClass: 'bg-red-500/10',
			xpTextClass: 'text-red-500',
			buttonClass: '',
			ClockIcon: Clock,
		},
	}

	const config = stateConfig[state]

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'overflow-hidden rounded-2xl border bg-panel-bg',
				config.borderClass,
				config.bgClass,
				state === 'urgent' && 'animate-pulse-subtle',
				className,
			)}
		>
			{/* Urgent Banner */}
			{state === 'urgent' && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className='flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white'
				>
					<AlertTriangle className='size-4' />
					<span>XP expires soon! Post now to claim.</span>
				</motion.div>
			)}

			{/* Main Content */}
			<div className='flex items-center gap-3.5 p-3.5'>
				{/* Recipe Thumbnail */}
				<div className='relative size-14 flex-shrink-0'>
					{recipeImageUrl ? (
						<Image
							src={recipeImageUrl}
							alt={recipeName}
							width={56}
							height={56}
							className='size-full rounded-xl object-cover'
						/>
					) : (
						<div className='flex size-full items-center justify-center rounded-xl bg-muted text-2xl'>
							🍳
						</div>
					)}
					<motion.span
						className={cn(
							'absolute -bottom-1 -right-1 rounded-full bg-panel-bg p-0.5 text-lg',
							state === 'warning' && 'animate-pulse',
							state === 'urgent' && 'animate-bounce',
						)}
					>
						{config.icon}
					</motion.span>
				</div>

				{/* Info */}
				<div className='min-w-0 flex-1'>
					<span
						className={cn(
							'text-xs font-semibold uppercase tracking-wider',
							config.labelClass,
						)}
					>
						{config.label}
					</span>
					<p className='truncate text-sm font-bold text-text'>{recipeName}</p>
					{state !== 'expired' && (
						<div
							className={cn(
								'flex items-center gap-1.5 text-xs',
								config.deadlineClass,
							)}
						>
							<config.ClockIcon className='size-3.5' />
							<span className={state === 'urgent' ? 'font-mono' : ''}>
								{timeRemaining}
							</span>
						</div>
					)}
					{state === 'expired' && (
						<span className='text-xs text-muted-foreground'>
							Deadline passed
						</span>
					)}
				</div>

				{/* XP Badge */}
				<div
					className={cn(
						'flex-shrink-0 rounded-lg px-3 py-2 text-center',
						config.xpBgClass,
					)}
				>
					<span
						className={cn(
							'block text-xl font-extrabold leading-none',
							config.xpTextClass,
						)}
					>
						{state === 'expired' ? '-' : '+'}
						{Math.round(pendingXp)}
					</span>
					<span className={cn('text-2xs font-semibold', config.xpTextClass)}>
						{state === 'expired' ? 'XP lost' : 'XP'}
					</span>
				</div>

				{/* Action Button */}
				{state !== 'expired' ? (
					<motion.button
						onClick={onPost}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className={cn(
							'flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors',
							config.buttonClass,
						)}
					>
						<Upload className='size-4' />
						{state === 'urgent'
							? 'POST NOW'
							: state === 'warning'
								? 'Post Now'
								: 'Post'}
					</motion.button>
				) : (
					<button
						onClick={onDismiss}
						className='flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-text'
					>
						<X className='size-4' />
					</button>
				)}
			</div>
		</motion.div>
	)
}

// ============================================
// POST DEADLINE STACK (Multiple Pending Posts)
// ============================================

export const PostDeadlineStack = ({
	pendingPosts,
	onPost,
	className,
}: PostDeadlineStackProps) => {
	const [isExpanded, setIsExpanded] = useState(false)

	const totalXp = pendingPosts.reduce((sum, p) => sum + p.pendingXp, 0)

	// Sort by deadline (most urgent first)
	const sortedPosts = [...pendingPosts].sort(
		(a, b) => a.deadlineAt.getTime() - b.deadlineAt.getTime(),
	)

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className={cn(
				'overflow-hidden rounded-2xl border border-border bg-panel-bg',
				className,
			)}
		>
			{/* Header */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className='flex w-full items-center gap-2.5 border-b border-border px-4 py-3.5 hover:bg-muted/30'
			>
				<span className='text-lg'>📸</span>
				<span className='flex-1 text-left text-sm font-semibold'>
					{pendingPosts.length} recipes waiting
				</span>
				<span className='text-sm font-bold text-success'>
					+{totalXp} XP pending
				</span>
				<div className='flex size-7 items-center justify-center rounded-full bg-muted'>
					{isExpanded ? (
						<ChevronUp className='size-4 text-muted-foreground' />
					) : (
						<ChevronDown className='size-4 text-muted-foreground' />
					)}
				</div>
			</button>

			{/* Items */}
			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className='overflow-hidden'
					>
						<div className='space-y-1 p-2'>
							{sortedPosts.map(post => {
								const state = getDeadlineState(post.deadlineAt)
								return (
									<div
										key={post.id}
										className='flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/30'
									>
										{post.recipeImageUrl ? (
											<Image
												src={post.recipeImageUrl}
												alt={post.recipeName}
												width={40}
												height={40}
												className='size-10 rounded-lg object-cover'
											/>
										) : (
											<div className='flex size-10 items-center justify-center rounded-lg bg-muted text-lg'>
												🍳
											</div>
										)}
										<span className='min-w-0 flex-1 truncate text-sm font-semibold'>
											{post.recipeName}
										</span>
										<span
											className={cn(
												'text-xs',
												state === 'urgent' && 'font-semibold text-red-500',
												state === 'warning' && 'text-amber-500',
												state === 'normal' && 'text-muted-foreground',
											)}
										>
											{formatTimeRemaining(post.deadlineAt)}
										</span>
										<span className='text-xs font-bold text-success'>
											+{Math.round(post.pendingXp)} XP
										</span>
										<motion.button
											onClick={() => onPost?.(post.id)}
											whileHover={BUTTON_SUBTLE_HOVER}
											whileTap={BUTTON_SUBTLE_TAP}
											transition={TRANSITION_SPRING}
											className='rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white'
										>
											Post
										</motion.button>
									</div>
								)
							})}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}

// ============================================
// POST DEADLINE BADGE (Mini for profile)
// ============================================

export const PostDeadlineBadge = ({
	count,
	totalXp,
	onClick,
	className,
}: PostDeadlineBadgeProps) => {
	return (
		<motion.button
			onClick={onClick}
			whileHover={BUTTON_SUBTLE_HOVER}
			whileTap={BUTTON_SUBTLE_TAP}
			transition={TRANSITION_SPRING}
			className={cn(
				'inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs hover:bg-primary/15',
				className,
			)}
		>
			<span className='size-2 animate-pulse rounded-full bg-primary' />
			<span className='font-bold text-primary'>{count}</span>
			<span className='text-muted-foreground'>pending posts</span>
			<span className='font-bold text-success'>+{Math.round(totalXp)} XP</span>
		</motion.button>
	)
}

// ============================================
// POST DEADLINE MOBILE STRIP
// ============================================

export const PostDeadlineMobileStrip = ({
	recipeName,
	pendingXp,
	deadlineAt,
	onPost,
	className,
}: PostDeadlineMobileStripProps) => {
	const [timeRemaining, setTimeRemaining] = useState(
		formatTimeRemaining(deadlineAt),
	)
	const state = useMemo(() => getDeadlineState(deadlineAt), [deadlineAt])

	useEffect(() => {
		const interval = setInterval(
			() => setTimeRemaining(formatTimeRemaining(deadlineAt)),
			state === 'urgent' ? 1000 : 60000,
		)
		return () => clearInterval(interval)
	}, [deadlineAt, state])

	return (
		<div
			className={cn(
				'flex items-center gap-2.5 border-b px-4 py-2.5',
				state === 'warning' && 'border-gold/30 bg-gold/10',
				state === 'urgent' &&
					'border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent',
				state === 'normal' && 'border-border bg-panel-bg',
				className,
			)}
		>
			<span className='text-base'>
				{state === 'urgent' ? '🚨' : state === 'warning' ? '⏰' : '📸'}
			</span>
			<span className='flex-1 truncate text-xs font-medium'>
				{recipeName}: {timeRemaining} to claim +{Math.round(pendingXp)} XP
			</span>
			<motion.button
				onClick={onPost}
				whileTap={BUTTON_SUBTLE_TAP}
				transition={TRANSITION_SPRING}
				className='rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white'
			>
				Post
			</motion.button>
		</div>
	)
}

// ============================================
// EXPORTS
// ============================================

export type {
	PostDeadlineCardProps,
	PostDeadlineStackProps,
	PostDeadlineBadgeProps,
	PostDeadlineMobileStripProps,
	PendingPost,
	DeadlineState,
}
