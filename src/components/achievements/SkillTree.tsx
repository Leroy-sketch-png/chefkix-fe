'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Trophy,
	Lock,
	Crown,
	Star,
	ChevronRight,
	Sparkles,
	AlertTriangle,
	RefreshCw,
} from 'lucide-react'
import {
	FADE_IN_VARIANTS,
	STAGGER_CONFIG,
	TRANSITION_SPRING,
	CARD_HOVER,
} from '@/lib/motion'
import type {
	SkillTreeResponse,
	SkillPath,
	AchievementNode,
	AchievementCategory,
} from '@/lib/types/achievement'
import { getMySkillTree, getUserSkillTree } from '@/services/achievement'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ============================================
// CATEGORY META
// ============================================

const CATEGORY_META: Record<
	AchievementCategory,
	{ color: string; bgColor: string; borderColor: string; icon: string }
> = {
	Cuisine: {
		color: 'text-brand',
		bgColor: 'bg-brand/10',
		borderColor: 'border-brand/30',
		icon: 'ðŸ³',
	},
	Technique: {
		color: 'text-info',
		bgColor: 'bg-info/10',
		borderColor: 'border-info/30',
		icon: 'ðŸ”ª',
	},
	Social: {
		color: 'text-accent-purple',
		bgColor: 'bg-accent-purple/10',
		borderColor: 'border-accent-purple/30',
		icon: 'ðŸ‘¥',
	},
	Hidden: {
		color: 'text-warning',
		bgColor: 'bg-warning/10',
		borderColor: 'border-warning/30',
		icon: 'ðŸ”®',
	},
	Seasonal: {
		color: 'text-success',
		bgColor: 'bg-success/10',
		borderColor: 'border-success/30',
		icon: 'ðŸŒ¸',
	},
}

const TIER_LABELS = ['', 'Bronze', 'Silver', 'Gold', 'Diamond'] as const

const TIER_COLORS: Record<number, string> = {
	1: 'from-warning to-warning',
	2: 'from-text-muted to-text-muted',
	3: 'from-warning to-warning',
	4: 'from-accent-teal to-info',
}

// ============================================
// MAIN COMPONENT
// ============================================

interface SkillTreeProps {
	userId?: string // If provided, show another user's tree; else show own
	isOwnProfile?: boolean
}

export function SkillTree({ userId, isOwnProfile = false }: SkillTreeProps) {
	const [data, setData] = useState<SkillTreeResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)
	const [expandedPath, setExpandedPath] = useState<string | null>(null)
	const [filterCategory, setFilterCategory] =
		useState<AchievementCategory | null>(null)

	useEffect(() => {
		const load = async () => {
			setIsLoading(true)
			setHasError(false)
			try {
				const result = userId
					? await getUserSkillTree(userId)
					: await getMySkillTree()
				setData(result)
			} catch {
				setHasError(true)
				toast.error('Failed to load skill tree')
			} finally {
				setIsLoading(false)
			}
		}
		load()
	}, [userId])

	if (isLoading) return <SkillTreeSkeleton />

	if (hasError) {
		return (
			<div className='flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border'>
				<AlertTriangle className='size-8 text-color-error' />
				<p className='mt-2 text-text-muted'>Failed to load achievements</p>
				<button
					onClick={() => {
						setIsLoading(true)
						setHasError(false)
						const load = async () => {
							try {
								const result = userId
									? await getUserSkillTree(userId)
									: await getMySkillTree()
								setData(result)
							} catch {
								setHasError(true)
								toast.error('Failed to load skill tree')
							} finally {
								setIsLoading(false)
							}
						}
						load()
					}}
					className='mt-2 flex items-center gap-1 text-sm text-brand hover:underline'
				>
					<RefreshCw className='size-3' />
					Retry
				</button>
			</div>
		)
	}

	if (!data || data.paths.length === 0) {
		return (
			<div className='flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border'>
				<Trophy className='size-8 text-text-muted' />
				<p className='mt-2 text-text-muted'>
					{isOwnProfile
						? 'Start cooking to unlock achievements!'
						: 'No achievements yet.'}
				</p>
			</div>
		)
	}

	const filteredPaths = filterCategory
		? data.paths.filter(p => p.category === filterCategory)
		: data.paths

	// Group paths by category for section rendering
	const categories = Array.from(new Set(data.paths.map(p => p.category)))

	return (
		<div className='space-y-6'>
			{/* Summary Bar */}
			<div className='flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<div className='flex items-center gap-3'>
					<div className='flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-xp to-accent-purple text-xl text-white shadow-card'>
						<Trophy className='size-6' />
					</div>
					<div>
						<p className='text-2xl font-display font-extrabold text-text'>
							{data.totalUnlocked}
							<span className='text-base font-normal text-text-muted'>
								{' '}
								/ {data.totalAchievements}
							</span>
						</p>
						<p className='text-xs text-text-muted'>Achievements Unlocked</p>
					</div>
				</div>
				<div className='flex items-center gap-1'>
					{/* Overall progress */}
					<div className='h-2.5 w-32 overflow-hidden rounded-full bg-bg-elevated'>
						<motion.div
							className='h-full rounded-full bg-gradient-to-r from-xp to-accent-purple'
							initial={{ width: 0 }}
							animate={{
								width: `${data.totalAchievements > 0 ? (data.totalUnlocked / data.totalAchievements) * 100 : 0}%`,
							}}
							transition={{ duration: 0.8, ease: 'easeOut' }}
						/>
					</div>
				</div>
			</div>

			{/* Category Filter Chips */}
			<div className='flex flex-wrap gap-2'>
				<button
					onClick={() => setFilterCategory(null)}
					className={cn(
						'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
						!filterCategory
							? 'bg-brand text-white shadow-card'
							: 'bg-bg-elevated text-text-secondary hover:bg-bg-card',
					)}
				>
					All ({data.paths.length})
				</button>
				{categories.map(cat => {
					const meta = CATEGORY_META[cat]
					const count = data.paths.filter(p => p.category === cat).length
					return (
						<button
							key={cat}
							onClick={() =>
								setFilterCategory(filterCategory === cat ? null : cat)
							}
							className={cn(
								'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
								filterCategory === cat
									? `${meta.bgColor} ${meta.color} shadow-card`
									: 'bg-bg-elevated text-text-secondary hover:bg-bg-card',
							)}
						>
							{meta.icon} {cat} ({count})
						</button>
					)
				})}
			</div>

			{/* Skill Paths */}
			<div className='space-y-3'>
				<AnimatePresence mode='popLayout'>
					{filteredPaths.map((path, i) => (
						<motion.div
							key={path.pathId}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -12 }}
							transition={{ delay: i * STAGGER_CONFIG.fast }}
						>
							<SkillPathCard
								path={path}
								isExpanded={expandedPath === path.pathId}
								onToggle={() =>
									setExpandedPath(
										expandedPath === path.pathId ? null : path.pathId,
									)
								}
							/>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</div>
	)
}

// ============================================
// SKILL PATH CARD
// ============================================

function SkillPathCard({
	path,
	isExpanded,
	onToggle,
}: {
	path: SkillPath
	isExpanded: boolean
	onToggle: () => void
}) {
	const meta = CATEGORY_META[path.category]
	const progressPercent =
		path.totalCount > 0
			? Math.round((path.unlockedCount / path.totalCount) * 100)
			: 0
	const isComplete = path.unlockedCount === path.totalCount

	return (
		<motion.div
			className={cn(
				'overflow-hidden rounded-xl border bg-bg-card shadow-card transition-colors',
				isComplete ? 'border-success/40' : `${meta.borderColor}`,
			)}
			whileHover={CARD_HOVER}
			transition={TRANSITION_SPRING}
		>
			{/* Header - always visible */}
			<button
				onClick={onToggle}
				className='flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-bg-elevated/50'
			>
				{/* Category Icon */}
				<div
					className={cn(
						'flex size-10 items-center justify-center rounded-lg text-lg',
						meta.bgColor,
					)}
				>
					{meta.icon}
				</div>

				{/* Name & Progress */}
				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<h4 className='truncate text-sm font-bold text-text'>
							{path.pathName}
						</h4>
						{isComplete && (
							<span className='flex items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-2xs font-bold text-success'>
								<Crown className='size-3' />
								Complete
							</span>
						)}
					</div>
					<div className='mt-1 flex items-center gap-2'>
						<div className='h-1.5 flex-1 overflow-hidden rounded-full bg-bg-elevated'>
							<motion.div
								className={cn(
									'h-full rounded-full',
									isComplete
										? 'bg-success'
										: 'bg-gradient-to-r from-xp to-accent-purple',
								)}
								initial={{ width: 0 }}
								animate={{ width: `${progressPercent}%` }}
								transition={{ duration: 0.6, ease: 'easeOut' }}
							/>
						</div>
						<span className='shrink-0 text-2xs font-semibold text-text-muted'>
							{path.unlockedCount}/{path.totalCount}
						</span>
					</div>
				</div>

				{/* Expand Arrow */}
				<motion.div
					animate={{ rotate: isExpanded ? 90 : 0 }}
					transition={{ duration: 0.2 }}
				>
					<ChevronRight className='size-4 text-text-muted' />
				</motion.div>
			</button>

			{/* Expanded Nodes */}
			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: 'easeInOut' }}
						className='overflow-hidden'
					>
						<div className='border-t border-border-subtle px-4 pb-4 pt-3'>
							<div className='space-y-2'>
								{path.nodes.map((node, i) => (
									<AchievementNodeCard
										key={node.code}
										node={node}
										index={i}
										isLast={i === path.nodes.length - 1}
									/>
								))}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}

// ============================================
// ACHIEVEMENT NODE CARD
// ============================================

function AchievementNodeCard({
	node,
	index,
	isLast,
}: {
	node: AchievementNode
	index: number
	isLast: boolean
}) {
	const isLocked = !node.unlocked && !node.prerequisiteMet
	const isInProgress = !node.unlocked && node.prerequisiteMet
	const progressPercent =
		node.requiredProgress > 0
			? Math.min(
					100,
					Math.round((node.currentProgress / node.requiredProgress) * 100),
				)
			: 0

	// Hidden achievements show ??? until unlocked
	if (node.hidden && !node.unlocked) {
		return (
			<div className='flex items-center gap-3 rounded-lg border border-dashed border-border bg-bg-elevated/50 p-3'>
				<div className='flex size-9 items-center justify-center rounded-lg bg-bg text-text-muted'>
					<Lock className='size-4' />
				</div>
				<div>
					<p className='text-sm font-semibold text-text-muted'>???</p>
					<p className='text-xs text-text-muted'>Hidden achievement</p>
				</div>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, x: -8 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: index * 0.05 }}
			className='flex items-center gap-3'
		>
			{/* Connection Line */}
			<div className='relative flex flex-col items-center'>
				<div
					className={cn(
						'flex size-9 items-center justify-center rounded-lg text-lg shadow-card',
						node.unlocked
							? `bg-gradient-to-br ${TIER_COLORS[node.tier] || TIER_COLORS[1]} text-white`
							: isInProgress
								? 'border-2 border-dashed border-xp bg-bg-elevated'
								: 'border border-border bg-bg-elevated',
					)}
				>
					{node.unlocked ? (
						<span className='text-base'>{node.icon}</span>
					) : isLocked ? (
						<Lock className='size-3.5 text-text-muted' />
					) : (
						<Star className='size-3.5 text-xp' />
					)}
				</div>
				{/* Vertical connector */}
				{!isLast && (
					<div className='absolute top-9 h-3 w-px bg-border-subtle' />
				)}
			</div>

			{/* Content */}
			<div className='min-w-0 flex-1'>
				<div className='flex items-center gap-2'>
					<p
						className={cn(
							'truncate text-sm font-semibold',
							node.unlocked
								? 'text-text'
								: isLocked
									? 'text-text-muted'
									: 'text-text',
						)}
					>
						{node.name}
					</p>
					{node.premium && (
						<Sparkles className='size-3 shrink-0 text-warning' />
					)}
					{node.tier > 1 && (
						<span className='shrink-0 text-2xs font-bold text-text-muted'>
							{TIER_LABELS[node.tier]}
						</span>
					)}
				</div>
				<p
					className={cn(
						'text-xs',
						node.unlocked ? 'text-text-secondary' : 'text-text-muted',
					)}
				>
					{node.description}
				</p>

				{/* Progress Bar (only for in-progress / not-yet-unlocked with progress) */}
				{!node.unlocked && node.currentProgress > 0 && (
					<div className='mt-1.5 flex items-center gap-2'>
						<div className='h-1.5 flex-1 overflow-hidden rounded-full bg-bg-elevated'>
							<motion.div
								className='h-full rounded-full bg-gradient-to-r from-xp to-accent-purple'
								initial={{ width: 0 }}
								animate={{ width: `${progressPercent}%` }}
								transition={{ duration: 0.5, ease: 'easeOut' }}
							/>
						</div>
						<span className='shrink-0 text-2xs font-semibold text-text-muted'>
							{node.currentProgress}/{node.requiredProgress}
						</span>
					</div>
				)}

				{/* Unlocked date */}
				{node.unlocked && node.unlockedAt && (
					<p className='mt-0.5 text-2xs text-text-muted'>
						Unlocked{' '}
						{new Date(node.unlockedAt).toLocaleDateString(undefined, {
							month: 'short',
							day: 'numeric',
							year: 'numeric',
						})}
					</p>
				)}
			</div>
		</motion.div>
	)
}

// ============================================
// SKELETON
// ============================================

function SkillTreeSkeleton() {
	return (
		<div className='space-y-6'>
			{/* Summary skeleton */}
			<div className='flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card p-4'>
				<div className='flex items-center gap-3'>
					<Skeleton className='size-12 rounded-xl' />
					<div>
						<Skeleton className='h-7 w-20' />
						<Skeleton className='mt-1 h-3 w-32' />
					</div>
				</div>
				<Skeleton className='h-2.5 w-32 rounded-full' />
			</div>
			{/* Filter chips skeleton */}
			<div className='flex gap-2'>
				{[1, 2, 3, 4].map(i => (
					<Skeleton key={i} className='h-7 w-20 rounded-full' />
				))}
			</div>
			{/* Path skeletons */}
			{[1, 2, 3].map(i => (
				<div
					key={i}
					className='rounded-xl border border-border-subtle bg-bg-card p-4'
				>
					<div className='flex items-center gap-3'>
						<Skeleton className='size-10 rounded-lg' />
						<div className='flex-1'>
							<Skeleton className='h-4 w-40' />
							<Skeleton className='mt-2 h-1.5 w-full rounded-full' />
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
