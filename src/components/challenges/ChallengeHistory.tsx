'use client'

import { useTranslations, useLocale } from 'next-intl'

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
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	DURATION_S,
} from '@/lib/motion'

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

const formatDateUtil = (date: Date, format: 'short' | 'long' = 'short') => {
	if (format === 'short') {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	}
	return date.toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})
}

const isTodayUtil = (date: Date) => {
	const today = new Date()
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	)
}

const formatDateShort = (date: Date) => {
	return formatDateUtil(date, 'short')
}

const getDayName = (date: Date, locale = 'en-US') => {
	return date.toLocaleDateString(locale, { weekday: 'short' })
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
			<span
				className={cn(
					'text-lg font-display font-extrabold text-text',
					colorClass,
				)}
			>
				{value}
			</span>
			<span className='text-2xs text-text-secondary'>{label}</span>
		</div>
	</div>
)

// ============================================
// DAY COLUMN (Week View)
// ============================================

const DayColumn = ({ day }: { day: ChallengeDay }) => {
	const t = useTranslations('challenge')
	const locale = useLocale()
	const isCurrentDay = isTodayUtil(day.date)
	const statusConfig = {
		completed: {
			badgeBg: 'bg-gradient-to-br from-success to-success',
			indicator: <Check className='size-3' />,
			indicatorBg: 'bg-success',
			xpClass: 'text-success',
		},
		missed: {
			badgeBg: 'bg-error/20',
			indicator: <X className='size-3' />,
			indicatorBg: 'bg-error',
			xpClass: 'text-text-secondary',
		},
		today: {
			badgeBg: 'bg-gradient-brand',
			indicator: <Check className='size-3' />,
			indicatorBg: 'bg-success',
			xpClass: 'text-success',
		},
		upcoming: {
			badgeBg: 'border-2 border-dashed border-brand/30 bg-brand/10',
			indicator: null,
			indicatorBg: '',
			xpClass: 'text-brand',
		},
		future: {
			badgeBg: 'bg-muted/30',
			indicator: null,
			indicatorBg: '',
			xpClass: 'text-text-secondary',
		},
	}

	const config = statusConfig[day.status]

	return (
		<div
			className={cn(
				'relative flex flex-col items-center gap-1.5 rounded-xl p-3 text-center',
				isCurrentDay && 'border-2 border-brand/30 bg-brand/10',
				!isCurrentDay && 'bg-bg',
			)}
		>
			{isCurrentDay && (
				<span className='absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand px-2 py-0.5 text-2xs font-bold text-white'>
					{t('today')}
				</span>
			)}
			<span className='text-xs font-semibold text-text-secondary'>
				{getDayName(day.date, locale)}
			</span>
			<span className='text-2xs text-text-secondary'>
				{formatDateShort(day.date)}
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
					<span className='absolute -bottom-2 whitespace-nowrap text-2xs font-semibold text-text-secondary'>
						{t('tomorrow')}
					</span>
				)}
			</div>

			<span className='max-w-full truncate text-2xs font-semibold text-text'>
				{day.challenge?.title ?? '—'}
			</span>
			<span className={cn('text-2xs font-bold', config.xpClass)}>
				{day.status === 'missed'
					? t('missed')
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
	const t = useTranslations('challenge')

	return (
		<div className={cn('rounded-2xl bg-bg-card p-6', className)}>
			{/* Header */}
			<div className='mb-5 flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<h3 className='flex items-center gap-2 text-lg font-bold text-text'>
						<CalendarCheck className='size-5 text-brand' />
						{t('challengeHistory')}
					</h3>
					<span className='rounded-xl bg-bg px-2.5 py-1 text-xs text-text-secondary'>
						{t('last7Days')}
					</span>
				</div>
				{onViewAll && (
					<button
						type='button'
						onClick={onViewAll}
						className='flex items-center gap-1 text-xs font-semibold text-brand hover:underline'
					>
						{t('viewAll')}
						<ChevronRight className='size-4' />
					</button>
				)}
			</div>

			{/* Stats Summary */}
			<div className='mb-6 grid grid-cols-2 gap-3 md:grid-cols-4'>
				<StatCard
					icon='🔥'
					value={String(stats.currentStreak)}
					label={t('currentStreak')}
					colorClass='text-streak'
				/>
				<StatCard
					icon='✅'
					value={`${stats.completedThisWeek}/${stats.totalDays}`}
					label={t('completedStat')}
					colorClass='text-success'
				/>
				<StatCard
					icon='⚡'
					value={`+${stats.bonusXpEarned}`}
					label={t('bonusXP')}
					colorClass='text-brand'
				/>
				<StatCard
					icon='🏆'
					value={String(stats.bestStreak)}
					label={t('bestStreak')}
					colorClass='text-warning'
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
								{daysToNextBadge > 1
									? t('unlockBadgePlural', { n: daysToNextBadge })
									: t('unlockBadgeSingle', { n: daysToNextBadge })}
							</strong>
							<span className='mt-0.5 block text-xs text-text-secondary'>
								{t('completeTomorrowStreak')}
							</span>
						</div>
					</div>
					{onPreviewTomorrow && (
						<motion.button
							type='button'
							onClick={onPreviewTomorrow}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex items-center gap-1.5 rounded-lg bg-streak px-4 py-2.5 text-xs font-semibold text-white focus-visible:ring-2 focus-visible:ring-brand/50'
						>
							{t('previewTomorrow')}
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
	const t = useTranslations('challenge')
	const locale = useLocale()

	return (
		<div className='flex gap-4 border-b border-border py-4 last:border-b-0'>
			{/* Date */}
			<div className='flex min-w-thumbnail-sm flex-col items-center'>
				<span className='text-xl font-display font-extrabold leading-none text-text'>
					{day.date.getDate()}
				</span>
				<span className='text-xs text-text-secondary'>
					{day.date.toLocaleDateString(locale, { month: 'short' })}
				</span>
				{showTodayBadge && (
					<span className='mt-1 rounded-md bg-brand px-1.5 py-0.5 text-2xs font-bold text-white'>
						{t('today')}
					</span>
				)}
			</div>

			{/* Content */}
			<div className='flex flex-1 items-center gap-3.5'>
				<div
					className={cn(
						'flex size-12 items-center justify-center rounded-xl',
						isCompleted
							? 'bg-gradient-to-br from-success to-brand'
							: 'bg-error/20',
					)}
				>
					<span className={cn('text-2xl', !isCompleted && 'opacity-50')}>
						{day.challenge?.emoji ?? '🍳'}
					</span>
				</div>

				<div className='flex flex-1 flex-col gap-1'>
					<span className='text-sm font-bold text-text'>
						{day.challenge?.title ?? t('noChallenge')}
					</span>
					<span className='text-xs text-text-secondary'>
						{day.challenge?.title
							? t('completeChallenge', {
									title: day.challenge.title.toLowerCase(),
								})
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
							<span className='text-xs font-semibold text-brand'>
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
							isCompleted ? 'text-success' : 'text-text-secondary',
						)}
					>
						{isCompleted ? `+${day.challenge?.xp ?? 0} XP` : t('missed')}
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
	const t = useTranslations('challenge')
	const locale = useLocale()

	return (
		<div className={cn('mx-auto max-w-3xl space-y-6 p-6', className)}>
			{/* Header */}
			<div className='flex items-center gap-4'>
				{onBack && (
					<button
						type='button'
						onClick={onBack}
						aria-label={t('goBack')}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text'
					>
						<ArrowLeft className='size-5' />
					</button>
				)}
				<h1 className='flex-1 text-2xl font-display font-extrabold text-text'>
					{t('challengeHistory')}
				</h1>
			</div>

			{/* Lifetime Stats */}
			<div className='rounded-2xl bg-bg-card p-6'>
				<div className='mb-5 grid gap-5 md:grid-cols-[1fr_2fr]'>
					{/* Big Stat */}
					<div className='flex flex-col items-center justify-center rounded-2xl bg-brand/10 p-6'>
						<span className='text-6xl font-black leading-none text-brand'>
							{stats.totalCompleted}
						</span>
						<span className='mt-2 text-sm text-text-secondary'>
							{t('challengesCompleted')}
						</span>
					</div>

					{/* Small Stats Grid */}
					<div className='grid grid-cols-3 gap-3'>
						<div className='flex flex-col items-center gap-2 rounded-xl bg-bg p-4'>
							<span className='text-xl'>🔥</span>
							<span className='text-xl font-display font-extrabold text-text'>
								{stats.currentStreak}
							</span>
							<span className='text-xs text-text-secondary'>
								{t('currentStreak')}
							</span>
						</div>
						<div className='flex flex-col items-center gap-2 rounded-xl bg-bg p-4'>
							<span className='text-xl'>🏆</span>
							<span className='text-xl font-display font-extrabold text-text'>
								{stats.bestStreak}
							</span>
							<span className='text-xs text-text-secondary'>
								{t('bestStreak')}
							</span>
						</div>
						<div className='flex flex-col items-center gap-2 rounded-xl bg-bg p-4'>
							<span className='text-xl'>⚡</span>
							<span className='text-xl font-display font-extrabold text-text'>
								{stats.totalBonusXp.toLocaleString()}
							</span>
							<span className='text-xs text-text-secondary'>
								{t('totalBonusXP')}
							</span>
						</div>
					</div>
				</div>

				{/* Completion Rate */}
				<div className='border-t border-border pt-4'>
					<div className='mb-2.5 flex justify-between'>
						<span className='text-xs text-text-secondary'>
							{t('thisWeekCompletion')}
						</span>
						<span className='text-sm font-bold text-success'>
							{stats.completedThisWeek}/{stats.totalDays} ({completionRate}%)
						</span>
					</div>
					<div className='h-2.5 overflow-hidden rounded-full bg-bg'>
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${completionRate}%` }}
							transition={{ duration: DURATION_S.slow, ease: 'easeOut' }}
							className='h-full rounded-full bg-gradient-to-r from-success to-success'
						/>
					</div>
				</div>
			</div>

			{/* Month View */}
			<div className='rounded-2xl bg-bg-card p-6'>
				<div className='mb-5 flex items-center justify-center gap-6'>
					<button
						type='button'
						onClick={() => onMonthChange?.('prev')}
						className='flex size-8 items-center justify-center rounded-lg border border-border bg-bg text-text'
					>
						<ChevronLeft className='size-4' />
					</button>
					<span className='text-lg font-bold text-text'>
						{currentMonth.toLocaleDateString(locale, {
							month: 'long',
							year: 'numeric',
						})}
					</span>
					<button
						type='button'
						onClick={() => onMonthChange?.('next')}
						className='flex size-8 items-center justify-center rounded-lg border border-border bg-bg text-text'
					>
						<ChevronRight className='size-4' />
					</button>
				</div>

				{/* Simple calendar grid placeholder - would be expanded for full implementation */}
				<div className='grid grid-cols-7 gap-1'>
					{(
						[
							{ key: 'dayMon', label: t('dayMon') },
							{ key: 'dayTue', label: t('dayTue') },
							{ key: 'dayWed', label: t('dayWed') },
							{ key: 'dayThu', label: t('dayThu') },
							{ key: 'dayFri', label: t('dayFri') },
							{ key: 'daySat', label: t('daySat') },
							{ key: 'daySun', label: t('daySun') },
						] as Array<{ key: string; label: string }>
					).map(({ key, label }) => (
						<div
							key={key}
							className='py-2 text-center text-xs font-semibold text-text-secondary'
						>
							{label}
						</div>
					))}
				</div>
			</div>

			{/* Recent History List */}
			<div className='rounded-2xl bg-bg-card p-6'>
				<h3 className='mb-5 text-base font-bold text-text'>
					{t('recentChallenges')}
				</h3>
				<div>
					{recentDays.map((day, i) => (
						<HistoryItem
							key={i}
							day={day}
							showTodayBadge={isTodayUtil(day.date)}
						/>
					))}
				</div>

				{onLoadMore && (
					<motion.button
						type='button'
						onClick={onLoadMore}
						disabled={isLoadingMore}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-bg py-3.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{isLoadingMore ? t('loading') : t('loadMore')}
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
