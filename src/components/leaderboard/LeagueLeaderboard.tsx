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
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'
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
		gradient: 'from-amber-700/15 to-amber-600/8',
		borderColor: 'border-amber-700/40',
		textColor: 'text-amber-700',
	},
	silver: {
		icon: '🥈',
		gradient: 'from-gray-400/15 to-gray-300/8',
		borderColor: 'border-gray-400/40',
		textColor: 'text-gray-400',
	},
	gold: {
		icon: '🏆',
		gradient: 'from-amber-400/15 to-amber-500/8',
		borderColor: 'border-amber-400/40',
		textColor: 'text-amber-500',
	},
	diamond: {
		icon: '💎',
		gradient: 'from-cyan-400/15 to-blue-400/8',
		borderColor: 'border-cyan-400/40',
		textColor: 'text-cyan-400',
	},
	legendary: {
		icon: '👑',
		gradient: 'from-purple-500/15 to-pink-500/8',
		borderColor: 'border-purple-500/40',
		textColor: 'text-purple-500',
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
					<span className='text-xs text-muted-foreground'>
						Week {leagueInfo.week}
					</span>
				</div>
			</motion.div>

			{onLeagueInfo && (
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={onLeagueInfo}
					className='w-10 h-10 flex items-center justify-center bg-panel-bg border border-border rounded-xl text-muted-foreground'
				>
					<Info className='w-5 h-5' />
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
				<div className='flex-1 flex items-center gap-1.5 py-2.5 px-3 bg-emerald-500/10 rounded-lg text-xs font-semibold text-emerald-500'>
					<ChevronUp className='w-3.5 h-3.5' />
					<span>
						Top {leagueInfo.promotionRanks} promote to {leagueInfo.nextTier}
					</span>
				</div>
			)}
			<div className='flex-1 flex items-center gap-1.5 py-2.5 px-3 bg-indigo-500/10 rounded-lg text-xs font-semibold text-indigo-500'>
				<Shield className='w-3.5 h-3.5' />
				<span>Safe zone</span>
			</div>
			{leagueInfo.prevTier && (
				<div className='flex-1 flex items-center gap-1.5 py-2.5 px-3 bg-red-500/10 rounded-lg text-xs font-semibold text-red-500'>
					<ChevronDown className='w-3.5 h-3.5' />
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
			bg: 'bg-emerald-500/10',
			text: 'text-emerald-500',
			icon: <ChevronUp className='w-4 h-4' />,
		},
		safe: {
			bg: 'bg-indigo-500/10',
			text: 'text-indigo-500',
			icon: <Shield className='w-4 h-4' />,
		},
		demotion: {
			bg: 'bg-red-500/10',
			text: 'text-red-500',
			icon: <ChevronDown className='w-4 h-4' />,
		},
	}

	const style = zoneStyles[type]

	return (
		<div className='bg-panel-bg rounded-2xl p-4 mb-3'>
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
			className='flex items-center justify-center gap-2 py-3 bg-red-500/10 rounded-lg text-sm text-red-500'
		>
			<AlertTriangle className='w-4 h-4' />
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
				<div className='text-center py-3 text-xs text-muted-foreground'>
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
