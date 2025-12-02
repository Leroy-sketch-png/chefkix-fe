'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
	CalendarCheck,
	ChevronRight,
	ChevronLeft,
	Check,
	X,
	ArrowRight,
	ArrowLeft,
	ChevronDown,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'

// ============================================
// TYPES
// ============================================

type DayStatus = 'completed' | 'missed' | 'today' | 'upcoming' | 'future'

interface ChallengeDay {
	date: Date
	status: DayStatus
	challenge?: {
		title: string
		emoji: string
		xp: number
	}
	recipeCooked?: {
		id: string
		title: string
		imageUrl: string
	}
}

interface ChallengeHistoryStats {
	currentStreak: number
	completedThisWeek: number
	totalDays: number
	bonusXpEarned: number
	bestStreak: number
}

interface ChallengeHistorySectionProps {
	days: ChallengeDay[]
	stats: ChallengeHistoryStats
	onViewAll?: () => void
	onPreviewTomorrow?: () => void
	className?: string
}

interface ChallengeHistoryPageProps {
	days: ChallengeDay[]
	stats: ChallengeHistoryStats & {
		totalCompleted: number
		totalBonusXp: number
	}
	currentMonth: Date
	onMonthChange?: (direction: 'prev' | 'next') => void
	onBack?: () => void
	onLoadMore?: () => void
	isLoadingMore?: boolean
	className?: string
}

// ============================================
// UTILITIES
// ============================================

const formatDate = (date: Date) => {
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getDayName = (date: Date) => {
	return date.toLocaleDateString('en-US', { weekday: 'short' })
}

const isToday = (date: Date) => {
	const today = new Date()
	return date.toDateString() === today.toDateString()
}

// ============================================
// STAT CARD
// ============================================

const StatCard = ({
	icon,
	value,
	label,
	colorClass,
}: {
	icon: string
	value: string
	label: string
	colorClass?: string
}) => (
	<div className='flex items-center gap-2.5 rounded-xl bg-bg p-3.5'>
		<span className='text-xl'>{icon}</span>
		<div className='flex flex-col'>
			<span className={cn('text-lg font-extrabold text-text', colorClass)}>
				{value}
			</span>
			<span className='text-2xs text-muted-foreground'>{label}</span>
		</div>
	</div>
)

// ============================================
// DAY COLUMN (Week View)
// ============================================

const DayColumn = ({ day }: { day: ChallengeDay }) => {
	const isCurrentDay = isToday(day.date)
	const statusConfig = {
		completed: {
			badgeBg: 'bg-gradient-to-br from-success to-emerald-600',
			indicator: <Check className='size-3' />,
			indicatorBg: 'bg-success',
			xpClass: 'text-success',
		},
		missed: {
			badgeBg: 'bg-red-500/20',
			indicator: <X className='size-3' />,
			indicatorBg: 'bg-red-500',
			xpClass: 'text-muted-foreground',
		},
		today: {
			badgeBg: 'bg-gradient-brand',
			indicator: <Check className='size-3' />,
			indicatorBg: 'bg-success',
			xpClass: 'text-success',
		},
		upcoming: {
			badgeBg: 'border-2 border-dashed border-primary/30 bg-primary/10',
			indicator: null,
			indicatorBg: '',
			xpClass: 'text-primary',
		},
		future: {
			badgeBg: 'bg-muted/30',
			indicator: null,
			indicatorBg: '',
			xpClass: 'text-muted-foreground',
		},
	}

	const config = statusConfig[day.status]

	return (
		<div
			className={cn(
				'relative flex flex-col items-center gap-1.5 rounded-xl p-3 text-center',
				isCurrentDay && 'border-2 border-primary/30 bg-primary/10',
				!isCurrentDay && 'bg-bg',
			)}
		>
			{isCurrentDay && (
				<span className='absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary px-2 py-0.5 text-2xs font-bold text-white'>
					Today
				</span>
			)}
			<span className='text-xs font-semibold text-muted-foreground'>
				{getDayName(day.date)}
			</span>
			<span className='text-2xs text-muted-foreground'>
				{formatDate(day.date)}
			</span>

			{/* Badge */}
			<div
				className={cn(
					'relative my-1 flex size-12 items-center justify-center rounded-xl',
					config.badgeBg,
					day.status === 'missed' && 'opacity-60',
				)}
			>
				<span
					className={cn('text-xl', day.status === 'missed' && 'opacity-50')}
				>
					{day.challenge?.emoji ?? '🍳'}
				</span>
				{config.indicator && (
					<div
						className={cn(
							'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-bg text-white',
							config.indicatorBg,
						)}
					>
						{config.indicator}
					</div>
				)}
				{day.status === 'upcoming' && (
					<span className='absolute -bottom-2 whitespace-nowrap text-2xs font-semibold text-muted-foreground'>
						Tomorrow
					</span>
				)}
			</div>

			<span className='max-w-full truncate text-2xs font-semibold text-text'>
				{day.challenge?.title ?? '—'}
			</span>
			<span className={cn('text-2xs font-bold', config.xpClass)}>
				{day.status === 'missed'
					? 'Missed'
					: day.status === 'upcoming' || day.status === 'future'
						? `+${day.challenge?.xp ?? 0} XP`
						: `+${day.challenge?.xp ?? 0} XP`}
			</span>
		</div>
	)
}

// ============================================
// CHALLENGE HISTORY SECTION (Widget)
// ============================================

export const ChallengeHistorySection = ({
	days,
	stats,
	onViewAll,
	onPreviewTomorrow,
	className,
}: ChallengeHistorySectionProps) => {
	// Show last 7 days
	const weekDays = days.slice(0, 7)
	const daysToNextBadge = 7 - stats.currentStreak

	return (
		<div className={cn('rounded-2xl bg-panel-bg p-6', className)}>
			{/* Header */}
			<div className='mb-5 flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<h3 className='flex items-center gap-2 text-lg font-bold text-text'>
						<CalendarCheck className='size-5 text-primary' />
						Challenge History
					</h3>
					<span className='rounded-xl bg-bg px-2.5 py-1 text-xs text-muted-foreground'>
						Last 7 Days
					</span>
				</div>
				{onViewAll && (
					<button
						onClick={onViewAll}
						className='flex items-center gap-1 text-xs font-semibold text-primary hover:underline'
					>
						View All
						<ChevronRight className='size-4' />
					</button>
				)}
			</div>

			{/* Stats Summary */}
			<div className='mb-6 grid grid-cols-2 gap-3 md:grid-cols-4'>
				<StatCard
					icon='🔥'
					value={String(stats.currentStreak)}
					label='Current Streak'
					colorClass='text-streak'
				/>
				<StatCard
					icon='✅'
					value={`${stats.completedThisWeek}/${stats.totalDays}`}
					label='Completed'
					colorClass='text-success'
				/>
				<StatCard
					icon='⚡'
					value={`+${stats.bonusXpEarned}`}
					label='Bonus XP'
					colorClass='text-primary'
				/>
				<StatCard
					icon='🏆'
					value={String(stats.bestStreak)}
					label='Best Streak'
					colorClass='text-amber-500'
				/>
			</div>

			{/* Week Calendar */}
			<div className='mb-6 grid grid-cols-7 gap-2'>
				{weekDays.map((day, i) => (
					<DayColumn key={i} day={day} />
				))}
			</div>

			{/* Streak Motivation */}
			{stats.currentStreak > 0 && daysToNextBadge > 0 && (
				<div className='flex items-center justify-between rounded-xl border border-streak/20 bg-gradient-to-r from-streak/10 to-transparent px-5 py-4'>
					<div className='flex items-center gap-3.5'>
						<span className='text-3xl'>🎯</span>
						<div className='text-sm text-text'>
							<strong className='text-streak'>
								{daysToNextBadge} more day{daysToNextBadge > 1 ? 's' : ''}
							</strong>{' '}
							to unlock &quot;Weekly Champion&quot; badge!
							<span className='mt-0.5 block text-xs text-muted-foreground'>
								Complete tomorrow&apos;s challenge to continue your streak
							</span>
						</div>
					</div>
					{onPreviewTomorrow && (
						<motion.button
							onClick={onPreviewTomorrow}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex items-center gap-1.5 rounded-lg bg-streak px-4 py-2.5 text-xs font-semibold text-white'
						>
							Preview Tomorrow
							<ArrowRight className='size-4' />
						</motion.button>
					)}
				</div>
			)}
		</div>
	)
}

// ============================================
// HISTORY ITEM (List View)
// ============================================

const HistoryItem = ({
	day,
	showTodayBadge,
}: {
	day: ChallengeDay
	showTodayBadge?: boolean
}) => {
	const isCompleted = day.status === 'completed' || day.status === 'today'

	return (
		<div className='flex gap-4 border-b border-border py-4 last:border-b-0'>
			{/* Date */}
			<div className='flex min-w-thumbnail-sm flex-col items-center'>
				<span className='text-xl font-extrabold leading-none text-text'>
					{day.date.getDate()}
				</span>
				<span className='text-xs text-muted-foreground'>
					{day.date.toLocaleDateString('en-US', { month: 'short' })}
				</span>
				{showTodayBadge && (
					<span className='mt-1 rounded-md bg-primary px-1.5 py-0.5 text-2xs font-bold text-white'>
						Today
					</span>
				)}
			</div>

			{/* Content */}
			<div className='flex flex-1 items-center gap-3.5'>
				<div
					className={cn(
						'flex size-12 items-center justify-center rounded-xl',
						isCompleted
							? 'bg-gradient-to-br from-success to-emerald-600'
							: 'bg-red-500/20',
					)}
				>
					<span className={cn('text-2xl', !isCompleted && 'opacity-50')}>
						{day.challenge?.emoji ?? '🍳'}
					</span>
				</div>

				<div className='flex flex-1 flex-col gap-1'>
					<span className='text-sm font-bold text-text'>
						{day.challenge?.title ?? 'No Challenge'}
					</span>
					<span className='text-xs text-muted-foreground'>
						{day.challenge?.title
							? `Complete the ${day.challenge.title.toLowerCase()} challenge`
							: '—'}
					</span>
					{day.recipeCooked && (
						<div className='mt-1 flex items-center gap-2'>
							<Image
								src={day.recipeCooked.imageUrl}
								alt={day.recipeCooked.title}
								width={24}
								height={24}
								className='size-6 rounded-md object-cover'
							/>
							<span className='text-xs font-semibold text-primary'>
								{day.recipeCooked.title}
							</span>
						</div>
					)}
				</div>

				<div className='flex flex-col items-end gap-0.5'>
					<span className='text-xl'>{isCompleted ? '✅' : '❌'}</span>
					<span
						className={cn(
							'text-sm font-bold',
							isCompleted ? 'text-success' : 'text-muted-foreground',
						)}
					>
						{isCompleted ? `+${day.challenge?.xp ?? 0} XP` : 'Missed'}
					</span>
				</div>
			</div>
		</div>
	)
}

// ============================================
// CHALLENGE HISTORY PAGE (Full Page)
// ============================================

export const ChallengeHistoryPage = ({
	days,
	stats,
	currentMonth,
	onMonthChange,
	onBack,
	onLoadMore,
	isLoadingMore,
	className,
}: ChallengeHistoryPageProps) => {
	const completionRate = Math.round(
		(stats.completedThisWeek / stats.totalDays) * 100,
	)

	// Group days by "recent" (last 7) and rest
	const recentDays = days.filter(d => d.status !== 'future').slice(0, 10)

	return (
		<div className={cn('mx-auto max-w-3xl space-y-6 p-6', className)}>
			{/* Header */}
			<div className='flex items-center gap-4'>
				{onBack && (
					<button
						onClick={onBack}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-panel-bg text-text'
					>
						<ArrowLeft className='size-5' />
					</button>
				)}
				<h1 className='flex-1 text-2xl font-extrabold text-text'>
					Challenge History
				</h1>
			</div>

			{/* Lifetime Stats */}
			<div className='rounded-2xl bg-panel-bg p-6'>
				<div className='mb-5 grid gap-5 md:grid-cols-[1fr_2fr]'>
					{/* Big Stat */}
					<div className='flex flex-col items-center justify-center rounded-2xl bg-primary/10 p-6'>
						<span className='text-6xl font-black leading-none text-primary'>
							{stats.totalCompleted}
						</span>
						<span className='mt-2 text-sm text-muted-foreground'>
							Challenges Completed
						</span>
					</div>

					{/* Small Stats Grid */}
					<div className='grid grid-cols-3 gap-3'>
						<div className='flex flex-col items-center gap-2 rounded-xl bg-bg p-4'>
							<span className='text-xl'>🔥</span>
							<span className='text-xl font-extrabold text-text'>
								{stats.currentStreak}
							</span>
							<span className='text-xs text-muted-foreground'>
								Current Streak
							</span>
						</div>
						<div className='flex flex-col items-center gap-2 rounded-xl bg-bg p-4'>
							<span className='text-xl'>🏆</span>
							<span className='text-xl font-extrabold text-text'>
								{stats.bestStreak}
							</span>
							<span className='text-xs text-muted-foreground'>Best Streak</span>
						</div>
						<div className='flex flex-col items-center gap-2 rounded-xl bg-bg p-4'>
							<span className='text-xl'>⚡</span>
							<span className='text-xl font-extrabold text-text'>
								{stats.totalBonusXp.toLocaleString()}
							</span>
							<span className='text-xs text-muted-foreground'>
								Total Bonus XP
							</span>
						</div>
					</div>
				</div>

				{/* Completion Rate */}
				<div className='border-t border-border pt-4'>
					<div className='mb-2.5 flex justify-between'>
						<span className='text-xs text-muted-foreground'>
							This Week&apos;s Completion
						</span>
						<span className='text-sm font-bold text-success'>
							{stats.completedThisWeek}/{stats.totalDays} ({completionRate}%)
						</span>
					</div>
					<div className='h-2.5 overflow-hidden rounded-full bg-bg'>
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${completionRate}%` }}
							transition={{ duration: 0.5, ease: 'easeOut' }}
							className='h-full rounded-full bg-gradient-to-r from-success to-emerald-600'
						/>
					</div>
				</div>
			</div>

			{/* Month View */}
			<div className='rounded-2xl bg-panel-bg p-6'>
				<div className='mb-5 flex items-center justify-center gap-6'>
					<button
						onClick={() => onMonthChange?.('prev')}
						className='flex size-8 items-center justify-center rounded-lg border border-border bg-bg text-text'
					>
						<ChevronLeft className='size-4' />
					</button>
					<span className='text-lg font-bold text-text'>
						{currentMonth.toLocaleDateString('en-US', {
							month: 'long',
							year: 'numeric',
						})}
					</span>
					<button
						onClick={() => onMonthChange?.('next')}
						className='flex size-8 items-center justify-center rounded-lg border border-border bg-bg text-text'
					>
						<ChevronRight className='size-4' />
					</button>
				</div>

				{/* Simple calendar grid placeholder - would be expanded for full implementation */}
				<div className='grid grid-cols-7 gap-1'>
					{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
						<div
							key={day}
							className='py-2 text-center text-xs font-semibold text-muted-foreground'
						>
							{day}
						</div>
					))}
				</div>
			</div>

			{/* Recent History List */}
			<div className='rounded-2xl bg-panel-bg p-6'>
				<h3 className='mb-5 text-base font-bold text-text'>
					Recent Challenges
				</h3>
				<div>
					{recentDays.map((day, i) => (
						<HistoryItem key={i} day={day} showTodayBadge={isToday(day.date)} />
					))}
				</div>

				{onLoadMore && (
					<motion.button
						onClick={onLoadMore}
						disabled={isLoadingMore}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-bg py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/30'
					>
						{isLoadingMore ? 'Loading...' : 'Load More'}
						<ChevronDown className='size-4' />
					</motion.button>
				)}
			</div>
		</div>
	)
}

// ============================================
// EXPORTS
// ============================================

export type {
	ChallengeDay,
	ChallengeHistoryStats,
	ChallengeHistorySectionProps,
	ChallengeHistoryPageProps,
	DayStatus,
}
