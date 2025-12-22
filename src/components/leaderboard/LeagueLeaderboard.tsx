'use client'

import { motion } from 'framer-motion'
import {
	ChevronUp,
	ChevronDown,
	Shield,
	Info,
	AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	staggerContainer,
	staggerItem,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'
import { LeaderboardItem, type LeaderboardEntry } from './LeaderboardItem'

// ============================================================================
// TYPES
// ============================================================================

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary'

export interface LeagueInfo {
	tier: LeagueTier
	week: number
	promotionRanks: number // Top N promote
	demotionRanks: number // Bottom N demote
	nextTier: LeagueTier | null
	prevTier: LeagueTier | null
}

export interface LeagueLeaderboardProps {
	entries: LeaderboardEntry[]
	leagueInfo: LeagueInfo
	currentUserRank?: number
	isLoading?: boolean
	onUserClick?: (entry: LeaderboardEntry) => void
	onLeagueInfo?: () => void
	className?: string
}

// ============================================================================
// LEAGUE CONFIG
// ============================================================================

const leagueConfig: Record<
	LeagueTier,
	{ icon: string; gradient: string; borderColor: string; textColor: string }
> = {
	bronze: {
		icon: '🥉',
		gradient: 'from-medal-bronze/20 to-medal-bronze/8',
		borderColor: 'border-medal-bronze/40',
		textColor: 'text-medal-bronze',
	},
	silver: {
		icon: '🥈',
		gradient: 'from-medal-silver/25 to-medal-silver/10',
		borderColor: 'border-medal-silver/50',
		textColor: 'text-medal-silver',
	},
	gold: {
		icon: '🏆',
		gradient: 'from-medal-gold/20 to-medal-gold/8',
		borderColor: 'border-medal-gold/40',
		textColor: 'text-medal-gold',
	},
	diamond: {
		icon: '💎',
		gradient: 'from-rare/20 to-rare/8',
		borderColor: 'border-rare/40',
		textColor: 'text-rare',
	},
	legendary: {
		icon: '👑',
		gradient: 'from-xp/20 to-xp/8',
		borderColor: 'border-xp/40',
		textColor: 'text-xp',
	},
}

// ============================================================================
// LEAGUE HEADER
// ============================================================================

function LeagueHeader({
	leagueInfo,
	onLeagueInfo,
}: {
	leagueInfo: LeagueInfo
	onLeagueInfo?: () => void
}) {
	const config = leagueConfig[leagueInfo.tier]

	return (
		<div className='flex items-center justify-between mb-5'>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className={cn(
					'flex items-center gap-3.5 py-3.5 px-5',
					'bg-gradient-to-r rounded-2xl border-2',
					config.gradient,
					config.borderColor,
				)}
			>
				<span className='text-3xl'>{config.icon}</span>
				<div className='flex flex-col'>
					<span
						className={cn(
							'text-lg font-extrabold capitalize',
							config.textColor,
						)}
					>
						{leagueInfo.tier} League
					</span>
					<span className='text-xs text-text-tertiary'>
						Week {leagueInfo.week}
					</span>
				</div>
			</motion.div>

			{onLeagueInfo && (
				<motion.button
					whileHover={BUTTON_SUBTLE_HOVER}
					whileTap={BUTTON_SUBTLE_TAP}
					onClick={onLeagueInfo}
					className='size-10 flex items-center justify-center bg-bg-card border border-border rounded-xl text-text-tertiary'
				>
					<Info className='size-5' />
				</motion.button>
			)}
		</div>
	)
}

// ============================================================================
// ZONE INDICATOR
// ============================================================================

function ZoneIndicator({ leagueInfo }: { leagueInfo: LeagueInfo }) {
	const config = leagueConfig[leagueInfo.tier]

	return (
		<div className='flex flex-col sm:flex-row gap-2 mb-5'>
			{leagueInfo.nextTier && (
				<div className='flex-1 flex items-center gap-1.5 py-2.5 px-3 bg-success/10 rounded-lg text-xs font-semibold text-success'>
					<ChevronUp className='size-3.5' />
					<span>
						Top {leagueInfo.promotionRanks} promote to {leagueInfo.nextTier}
					</span>
				</div>
			)}
			<div className='flex-1 flex items-center gap-1.5 py-2.5 px-3 bg-info/10 rounded-lg text-xs font-semibold text-info'>
				<Shield className='size-3.5' />
				<span>Safe zone</span>
			</div>
			{leagueInfo.prevTier && (
				<div className='flex-1 flex items-center gap-1.5 py-2.5 px-3 bg-error/10 rounded-lg text-xs font-semibold text-error'>
					<ChevronDown className='size-3.5' />
					<span>
						Bottom {leagueInfo.demotionRanks} demote to {leagueInfo.prevTier}
					</span>
				</div>
			)}
		</div>
	)
}

// ============================================================================
// ZONE SECTION
// ============================================================================

function ZoneSection({
	type,
	label,
	destination,
	entries,
	onUserClick,
}: {
	type: 'promotion' | 'safe' | 'demotion'
	label: string
	destination?: string
	entries: LeaderboardEntry[]
	onUserClick?: (entry: LeaderboardEntry) => void
}) {
	const zoneStyles = {
		promotion: {
			bg: 'bg-success/10',
			text: 'text-success',
			icon: <ChevronUp className='size-4' />,
		},
		safe: {
			bg: 'bg-info/10',
			text: 'text-info',
			icon: <Shield className='size-4' />,
		},
		demotion: {
			bg: 'bg-error/10',
			text: 'text-error',
			icon: <ChevronDown className='size-4' />,
		},
	}

	const style = zoneStyles[type]

	return (
		<div className='bg-bg-card rounded-2xl p-4 mb-3'>
			{/* Zone Label */}
			<div
				className={cn(
					'flex items-center gap-2 py-2 px-3 rounded-lg mb-3 text-sm font-bold',
					style.bg,
					style.text,
				)}
			>
				{style.icon}
				<span>{label}</span>
				{destination && (
					<span className='ml-auto font-normal opacity-80'>
						→ {destination}
					</span>
				)}
			</div>

			{/* Entries */}
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
			>
				{entries.map(entry => (
					<motion.div key={entry.userId} variants={staggerItem}>
						<LeaderboardItem
							entry={entry}
							variant={type === 'safe' ? 'default' : type}
							showStats={false}
							onClick={onUserClick}
						/>
					</motion.div>
				))}
			</motion.div>
		</div>
	)
}

// ============================================================================
// DEMOTION WARNING
// ============================================================================

function DemotionWarning({ xpNeeded }: { xpNeeded: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className='flex items-center justify-center gap-2 py-3 bg-error/10 rounded-lg text-sm text-error'
		>
			<AlertTriangle className='size-4' />
			<span>+{xpNeeded} XP needed to leave demotion zone</span>
		</motion.div>
	)
}

// ============================================================================
// LEAGUE LEADERBOARD COMPONENT
// ============================================================================

export function LeagueLeaderboard({
	entries,
	leagueInfo,
	currentUserRank,
	isLoading = false,
	onUserClick,
	onLeagueInfo,
	className,
}: LeagueLeaderboardProps) {
	const totalEntries = entries.length
	const promotionThreshold = leagueInfo.promotionRanks
	const demotionThreshold = totalEntries - leagueInfo.demotionRanks

	// Split entries into zones
	const promotionEntries = entries.filter(e => e.rank <= promotionThreshold)
	const safeEntries = entries.filter(
		e => e.rank > promotionThreshold && e.rank <= demotionThreshold,
	)
	const demotionEntries = entries.filter(e => e.rank > demotionThreshold)

	// Check if current user is in demotion zone
	const userInDemotion = currentUserRank && currentUserRank > demotionThreshold

	// Calculate XP needed to leave demotion zone (simplified)
	const safeZoneLowestXp = safeEntries[safeEntries.length - 1]?.xpThisWeek ?? 0
	const userEntry = entries.find(e => e.isCurrentUser)
	const xpNeeded = userEntry
		? Math.max(0, safeZoneLowestXp - userEntry.xpThisWeek + 1)
		: 0

	return (
		<div className={cn('max-w-modal-xl mx-auto p-4', className)}>
			{/* League Header */}
			<LeagueHeader leagueInfo={leagueInfo} onLeagueInfo={onLeagueInfo} />

			{/* Zone Indicator */}
			<ZoneIndicator leagueInfo={leagueInfo} />

			{/* Promotion Zone */}
			{promotionEntries.length > 0 && leagueInfo.nextTier && (
				<ZoneSection
					type='promotion'
					label='Promotion Zone'
					destination={`${leagueInfo.nextTier.charAt(0).toUpperCase()}${leagueInfo.nextTier.slice(1)}`}
					entries={promotionEntries}
					onUserClick={onUserClick}
				/>
			)}

			{/* Safe Zone (abbreviated) */}
			{safeEntries.length > 0 && (
				<ZoneSection
					type='safe'
					label='Safe Zone'
					entries={safeEntries.slice(0, 3)} // Only show first few
					onUserClick={onUserClick}
				/>
			)}

			{/* Abbreviated indicator for safe zone */}
			{safeEntries.length > 3 && (
				<div className='text-center py-3 text-xs text-text-muted'>
					Ranks {promotionThreshold + 4}-{demotionThreshold} •{' '}
					{safeEntries[3]?.xpThisWeek?.toLocaleString()}-
					{safeEntries[safeEntries.length - 1]?.xpThisWeek?.toLocaleString()} XP
				</div>
			)}

			{/* Demotion Zone */}
			{demotionEntries.length > 0 && leagueInfo.prevTier && (
				<>
					<ZoneSection
						type='demotion'
						label='Demotion Zone'
						destination={`${leagueInfo.prevTier.charAt(0).toUpperCase()}${leagueInfo.prevTier.slice(1)}`}
						entries={demotionEntries}
						onUserClick={onUserClick}
					/>
					{userInDemotion && xpNeeded > 0 && (
						<DemotionWarning xpNeeded={xpNeeded} />
					)}
				</>
			)}
		</div>
	)
}

export default LeagueLeaderboard
