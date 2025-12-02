'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	CheckCircle,
	AlertCircle,
	Info,
	X,
	Zap,
	Trophy,
	Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	DURATIONS,
	STAT_ITEM_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

type ToastType = 'success' | 'error' | 'info' | 'xp' | 'achievement' | 'streak'

interface BaseToastProps {
	id: string
	type: ToastType
	title: string
	message?: string
	duration?: number
	onDismiss?: (id: string) => void
}

interface XPToastProps extends BaseToastProps {
	type: 'xp'
	xpAmount: number
	xpProgress?: number // 0-100 percentage
}

interface AchievementToastProps extends BaseToastProps {
	type: 'achievement'
	badge: string // Emoji
	onView?: () => void
}

interface StreakToastProps extends BaseToastProps {
	type: 'streak'
	streakCount: number
}

type ToastProps =
	| BaseToastProps
	| XPToastProps
	| AchievementToastProps
	| StreakToastProps

// ============================================
// ANIMATIONS
// ============================================

const toastVariants = {
	initial: {
		opacity: 0,
		x: 100,
		scale: 0.8,
	},
	animate: {
		opacity: 1,
		x: 0,
		scale: 1,
		transition: TRANSITION_SPRING,
	},
	exit: {
		opacity: 0,
		x: 100,
		scale: 0.8,
		transition: {
			duration: DURATIONS.smooth / 1000,
		},
	},
}

const achievementPulse = {
	scale: [1, 1.1, 1],
	boxShadow: [
		'0 4px 16px rgba(255, 210, 74, 0.4)',
		'0 6px 24px rgba(255, 210, 74, 0.6)',
		'0 4px 16px rgba(255, 210, 74, 0.4)',
	],
}

// ============================================
// TOAST ICON COMPONENT
// ============================================

const ToastIcon = ({
	type,
	badge,
	streakCount,
}: {
	type: ToastType
	badge?: string
	streakCount?: number
}) => {
	const iconClasses = 'h-5 w-5'

	switch (type) {
		case 'success':
			return (
				<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-success text-white'>
					<CheckCircle className={iconClasses} />
				</div>
			)
		case 'error':
			return (
				<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-error text-white'>
					<AlertCircle className={iconClasses} />
				</div>
			)
		case 'info':
			return (
				<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white'>
					<Info className={iconClasses} />
				</div>
			)
		case 'xp':
			return (
				<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-success to-success/80 text-white'>
					<span className='text-2xl'>⚡</span>
				</div>
			)
		case 'achievement':
			return (
				<motion.div
					animate={achievementPulse}
					transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
					className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-gold text-white shadow-lg'
				>
					<span className='text-2xl'>{badge || '🏆'}</span>
				</motion.div>
			)
		case 'streak':
			return (
				<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-streak text-white shadow-lg shadow-streak/40'>
					<span className='text-2xl'>🔥</span>
				</div>
			)
		default:
			return null
	}
}

// ============================================
// INDIVIDUAL TOAST COMPONENT
// ============================================

export const Toast = (props: ToastProps) => {
	const { id, type, title, message, duration = 5000, onDismiss } = props
	const [progress, setProgress] = useState(100)

	useEffect(() => {
		if (duration <= 0) return

		const startTime = Date.now()
		const interval = setInterval(() => {
			const elapsed = Date.now() - startTime
			const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
			setProgress(remaining)

			if (remaining <= 0) {
				clearInterval(interval)
				onDismiss?.(id)
			}
		}, 50)

		return () => clearInterval(interval)
	}, [id, duration, onDismiss])

	const borderColors = {
		success: 'border-l-success',
		error: 'border-l-error',
		info: 'border-l-brand',
		xp: 'border-l-gold',
		achievement: 'border-l-gold',
		streak: 'border-l-streak',
	}

	const isXP = type === 'xp' && 'xpAmount' in props
	const isAchievement = type === 'achievement' && 'badge' in props
	const isStreak = type === 'streak' && 'streakCount' in props

	return (
		<motion.div
			layout
			variants={toastVariants}
			initial='initial'
			animate='animate'
			exit='exit'
			className={cn(
				'relative flex min-w-80 max-w-modal-md items-center gap-3 rounded-radius border-l-4 bg-panel-bg p-4 shadow-lg',
				borderColors[type],
				isAchievement && 'bg-gold/10',
			)}
		>
			{/* Icon */}
			<ToastIcon
				type={type}
				badge={
					isAchievement ? (props as AchievementToastProps).badge : undefined
				}
				streakCount={
					isStreak ? (props as StreakToastProps).streakCount : undefined
				}
			/>

			{/* Content */}
			<div className='min-w-0 flex-1'>
				<div className='text-sm font-bold'>{title}</div>
				{message && (
					<div className='mt-1 text-sm leading-relaxed text-text-muted'>
						{message}
					</div>
				)}

				{/* XP Progress Bar */}
				{isXP && (props as XPToastProps).xpProgress !== undefined && (
					<div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10'>
						<motion.div
							className='h-full bg-gradient-to-r from-success to-success/80'
							initial={{ width: 0 }}
							animate={{ width: `${(props as XPToastProps).xpProgress}%` }}
							transition={{ duration: 1, delay: 0.3 }}
						/>
					</div>
				)}
			</div>

			{/* Close Button / Action Button */}
			{isAchievement && (props as AchievementToastProps).onView ? (
				<motion.button
					whileHover={STAT_ITEM_HOVER}
					whileTap={BUTTON_SUBTLE_TAP}
					onClick={(props as AchievementToastProps).onView}
					className='flex-shrink-0 rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-gold/40 transition-shadow hover:shadow-gold/60'
				>
					View
				</motion.button>
			) : (
				<button
					onClick={() => onDismiss?.(id)}
					className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
				>
					<X className='h-4 w-4' />
				</button>
			)}

			{/* Progress Bar (auto-dismiss indicator) */}
			{duration > 0 && (
				<div className='absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-radius'>
					<motion.div
						className='h-full bg-current opacity-20'
						style={{ width: `${progress}%` }}
					/>
				</div>
			)}
		</motion.div>
	)
}

// ============================================
// TOAST CONTAINER COMPONENT
// ============================================

interface ToastContainerProps {
	toasts: ToastProps[]
	onDismiss: (id: string) => void
	position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
}

export const ToastContainer = ({
	toasts,
	onDismiss,
	position = 'bottom-right',
}: ToastContainerProps) => {
	const positionClasses = {
		'top-right': 'top-6 right-6',
		'bottom-right': 'bottom-6 right-6',
		'top-left': 'top-6 left-6',
		'bottom-left': 'bottom-6 left-6',
	}

	return (
		<div
			className={cn(
				'fixed z-notification flex flex-col gap-3 pointer-events-none',
				positionClasses[position],
			)}
		>
			<AnimatePresence mode='popLayout'>
				{toasts.map(toast => (
					<div key={toast.id} className='pointer-events-auto'>
						<Toast {...toast} onDismiss={onDismiss} />
					</div>
				))}
			</AnimatePresence>
		</div>
	)
}

// ============================================
// TOAST HOOK
// ============================================

interface ToastOptions {
	duration?: number
}

type ToastFunction = {
	success: (title: string, message?: string, options?: ToastOptions) => string
	error: (title: string, message?: string, options?: ToastOptions) => string
	info: (title: string, message?: string, options?: ToastOptions) => string
	xp: (
		xpAmount: number,
		title: string,
		message?: string,
		xpProgress?: number,
	) => string
	achievement: (
		badge: string,
		title: string,
		message?: string,
		onView?: () => void,
	) => string
	streak: (streakCount: number, title: string, message?: string) => string
	dismiss: (id: string) => void
	dismissAll: () => void
}

let toastId = 0

export const useToast = (): [ToastProps[], ToastFunction] => {
	const [toasts, setToasts] = useState<ToastProps[]>([])

	const addToast = (toast: Omit<ToastProps, 'id'>): string => {
		const id = `toast-${++toastId}`
		setToasts(prev => [...prev, { ...toast, id } as ToastProps])
		return id
	}

	const dismiss = (id: string) => {
		setToasts(prev => prev.filter(t => t.id !== id))
	}

	const dismissAll = () => {
		setToasts([])
	}

	const toast: ToastFunction = {
		success: (title, message, options) =>
			addToast({ type: 'success', title, message, ...options }),
		error: (title, message, options) =>
			addToast({ type: 'error', title, message, ...options }),
		info: (title, message, options) =>
			addToast({ type: 'info', title, message, ...options }),
		xp: (xpAmount, title, message, xpProgress) =>
			addToast({ type: 'xp', xpAmount, title, message, xpProgress } as Omit<
				XPToastProps,
				'id'
			>),
		achievement: (badge, title, message, onView) =>
			addToast({ type: 'achievement', badge, title, message, onView } as Omit<
				AchievementToastProps,
				'id'
			>),
		streak: (streakCount, title, message) =>
			addToast({ type: 'streak', streakCount, title, message } as Omit<
				StreakToastProps,
				'id'
			>),
		dismiss,
		dismissAll,
	}

	return [toasts, toast]
}

// ============================================
// PRESET TOASTS (Common Use Cases)
// ============================================

export const toastPresets = {
	recipeSaved: (collectionName: string) => ({
		type: 'success' as const,
		title: 'Recipe Saved!',
		message: `Added to your "${collectionName}" collection`,
	}),

	uploadFailed: (reason: string) => ({
		type: 'error' as const,
		title: 'Upload Failed',
		message: reason,
	}),

	xpEarned: (amount: number, recipeName: string, progress?: number) => ({
		type: 'xp' as const,
		xpAmount: amount,
		title: `+${amount} XP Earned!`,
		message: `Completed "${recipeName}"`,
		xpProgress: progress,
	}),

	achievementUnlocked: (badge: string, name: string, description: string) => ({
		type: 'achievement' as const,
		badge,
		title: 'Achievement Unlocked!',
		message: `"${name}" - ${description}`,
	}),

	streakExtended: (days: number) => ({
		type: 'streak' as const,
		streakCount: days,
		title: `${days} Day Streak!`,
		message: 'Keep it up! Cook again tomorrow to continue.',
	}),

	newFeature: (featureName: string, description: string) => ({
		type: 'info' as const,
		title: `New Feature: ${featureName}`,
		message: description,
	}),
}
