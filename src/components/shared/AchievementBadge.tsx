'use client'

import { X, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

interface Achievement {
	id: string
	emoji: string
	name: string
	description: string
	rarity?: BadgeRarity
	unlocked: boolean
	progress?: {
		current: number
		total: number
	}
	unlockedDate?: string
	xpReward?: number
	rarityPercentage?: string
}

// ============================================================================
// Achievement Badge Component (Grid Item)
// ============================================================================

interface AchievementBadgeProps {
	achievement: Achievement
	onClick?: () => void
	className?: string
}

export const AchievementBadge = ({
	achievement,
	onClick,
	className,
}: AchievementBadgeProps) => {
	const { emoji, name, description, rarity, unlocked, progress } = achievement

	const rarityColors = {
		common: '',
		rare: 'rare',
		epic: 'epic',
		legendary: 'legendary',
	}

	return (
		<div
			onClick={unlocked ? onClick : undefined}
			className={cn(
				'relative cursor-pointer overflow-hidden rounded-[var(--radius)] border-2 border-border bg-card p-5 text-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
				unlocked && 'hover:-translate-y-1 hover:shadow-md',
				!unlocked && 'cursor-default opacity-50',
				className,
			)}
		>
			{/* Badge Icon */}
			<div
				className={cn(
					'relative mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full border-[3px] bg-muted',
					unlocked &&
						!rarity &&
						'border-primary bg-gradient-to-br from-primary to-primary/80',
					unlocked &&
						rarity === 'rare' &&
						'border-accent bg-gradient-to-br from-accent to-accent/80',
					unlocked &&
						rarity === 'epic' &&
						'border-epic bg-gradient-to-br from-[#667eea] to-epic',
					unlocked &&
						rarity === 'legendary' &&
						'border-gold bg-gradient-gold shadow-glow',
				)}
			>
				<div className='relative z-[2] text-[40px]'>{emoji}</div>

				{/* Shine Animation */}
				{unlocked && (
					<div className='absolute inset-0 animate-[badge-shine_3s_ease-in-out_infinite] bg-gradient-to-br from-transparent via-white/30 to-transparent' />
				)}

				{/* Legendary Glow */}
				{unlocked && rarity === 'legendary' && (
					<div className='absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 animate-[badge-glow-pulse_2s_ease-in-out_infinite] bg-[radial-gradient(circle,rgba(255,210,74,0.4),transparent_70%)]' />
				)}
			</div>
			{/* Badge Info */}
			<div className='mb-1 text-sm font-bold text-foreground'>{name}</div>
			{/* Rarity Tag */}
			{unlocked && rarity && rarity !== 'common' && (
				<div
					className={cn(
						'mb-1 inline-block rounded-lg px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider',
						rarity === 'rare' && 'bg-accent/20 text-accent',
						rarity === 'epic' && 'bg-epic/20 text-epic',
						rarity === 'legendary' && 'bg-gold/20 text-gold',
					)}
				>
					{rarity}
				</div>
			)}{' '}
			{/* Description or Progress */}
			<div className='text-xs leading-snug text-muted-foreground'>
				{!unlocked && progress
					? `${progress.current}/${progress.total} ${description}`
					: description}
			</div>
		</div>
	)
}

// ============================================================================
// Mini Badge Component (Inline Display)
// ============================================================================

interface MiniBadgeProps {
	emoji: string
	title: string
	unlocked?: boolean
	className?: string
	onClick?: () => void
}

export const MiniBadge = ({
	emoji,
	title,
	unlocked = true,
	className,
	onClick,
}: MiniBadgeProps) => {
	return (
		<div
			onClick={unlocked ? onClick : undefined}
			title={title}
			className={cn(
				'grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 text-lg transition-transform hover:scale-110',
				unlocked
					? 'border-primary bg-gradient-to-br from-primary to-primary/80'
					: 'cursor-default border-border bg-muted opacity-50 hover:scale-100',
				className,
			)}
		>
			{emoji}
		</div>
	)
}

// ============================================================================
// Achievement Modal Component
// ============================================================================

interface AchievementModalProps {
	achievement: Achievement
	isOpen: boolean
	onClose: () => void
	onShare?: () => void
}

export const AchievementModal = ({
	achievement,
	isOpen,
	onClose,
	onShare,
}: AchievementModalProps) => {
	const {
		emoji,
		name,
		description,
		rarity,
		unlockedDate,
		xpReward,
		rarityPercentage,
	} = achievement

	if (!isOpen) return null

	return (
		<div
			className='fixed inset-0 z-modal flex animate-fadeIn items-center justify-center bg-foreground/70 p-5 backdrop-blur-sm'
			onClick={onClose}
		>
			<div
				className='relative w-full max-w-lg animate-scaleIn overflow-hidden rounded-[var(--radius-lg)] bg-card'
				onClick={e => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className='absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-foreground/30 text-background transition-all hover:bg-foreground/50 hover:rotate-90'
				>
					<X className='h-5 w-5' />
				</button>

				{/* Hero Section */}
				<div
					className={cn(
						'relative overflow-hidden p-12 text-center',
						!rarity && 'bg-gradient-to-br from-primary to-primary/80',
						rarity === 'rare' && 'bg-gradient-to-br from-accent to-accent/80',
						rarity === 'epic' &&
							'bg-gradient-to-br from-[#667eea] to-[#764ba2]',
						rarity === 'legendary' && 'bg-gradient-gold',
					)}
				>
					{/* Background Glow */}
					<div className='absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-[badge-glow-pulse_3s_ease-in-out_infinite] bg-[radial-gradient(circle,rgba(255,255,255,0.3),transparent_70%)]' />

					{/* Badge Icon */}
					<div className='relative mx-auto grid h-30 w-30 place-items-center rounded-full bg-card shadow-glow'>
						<div className='relative z-[2] text-[60px]'>{emoji}</div>
						<div className='absolute inset-0 animate-[badge-shine_3s_ease-in-out_infinite] bg-gradient-to-br from-transparent via-white/30 to-transparent' />
					</div>
				</div>

				{/* Info Section */}
				<div className='p-8 text-center'>
					{/* Rarity */}
					{rarity && rarity !== 'common' && (
						<div className='mb-2 text-xs font-extrabold uppercase tracking-[1.5px] text-gold'>
							{rarity}
						</div>
					)}
					{/* Title */}
					<h2 className='mb-3 text-2xl font-extrabold text-foreground'>
						{name}
					</h2>
					{/* Description */}
					<p className='mb-8 text-base leading-relaxed text-muted-foreground'>
						{description}
					</p>{' '}
					{/* Stats */}
					<div className='mb-8 grid grid-cols-3 gap-5 rounded-[var(--radius)] bg-muted/20 p-6'>
						<div className='text-center'>
							<div className='mb-1 text-xs text-muted-foreground'>Unlocked</div>
							<div className='text-sm font-bold text-foreground'>
								{unlockedDate || 'Nov 4, 2024'}
							</div>
						</div>
						<div className='text-center'>
							<div className='mb-1 text-xs text-muted-foreground'>Rarity</div>
							<div className='text-sm font-bold text-foreground'>
								{rarityPercentage || '2.3%'}
							</div>
						</div>
						<div className='text-center'>
							<div className='mb-1 text-xs text-muted-foreground'>
								XP Reward
							</div>
							<div className='text-sm font-bold text-foreground'>
								+{xpReward || 100} XP
							</div>
						</div>
					</div>
					{/* Share Button */}
					<button
						onClick={onShare}
						className='flex w-full items-center justify-center gap-2 rounded-radius bg-gradient-primary px-4 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg'
					>
						<Share2 className='h-5 w-5' />
						<span>Share Achievement</span>
					</button>
				</div>
			</div>
		</div>
	)
}

// ============================================================================
// Achievement Grid Component (Container)
// ============================================================================

interface AchievementGridProps {
	achievements: Achievement[]
	onBadgeClick?: (achievement: Achievement) => void
	className?: string
}

export const AchievementGrid = ({
	achievements,
	onBadgeClick,
	className,
}: AchievementGridProps) => {
	return (
		<div
			className={cn(
				'grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4',
				className,
			)}
		>
			{achievements.map(achievement => (
				<AchievementBadge
					key={achievement.id}
					achievement={achievement}
					onClick={() => onBadgeClick?.(achievement)}
				/>
			))}
		</div>
	)
}
