'use client'

import { useState, useEffect, Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Share2, ChefHat, Lock } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import {
	TRANSITION_SPRING,
	TRANSITION_BOUNCY,
	CELEBRATION_MODAL,
	BADGE_REVEAL_VARIANTS,
	STAT_ITEM_HOVER,
	LIST_ITEM_TAP,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

interface UnlockItem {
	id: string
	emoji: string
	name: string
	description: string
	glowColor: string
}

interface JourneyNode {
	id: string
	label: string
	status: 'done' | 'upcoming' | 'locked'
	statusText: string
}

interface FirstCookCelebrationProps {
	isOpen: boolean
	onClose: () => void
	recipeName: string
	recipeImageUrl?: string
	immediateXp: number
	pendingXp: number
	postDeadlineDays: number
	onPostNow: () => void
	onShareAchievement: () => void
	onContinueCooking: () => void
}

const buildUnlocks = (
	immediateXp: number,
	pendingXp: number,
	postDeadlineDays: number,
	t: (key: string, values?: Record<string, unknown>) => string,
): UnlockItem[] => [
	{
		id: 'badge',
		emoji: '🎖ï¸',
		name: t('firstDishBadge'),
		description: t('yourFirstOfMany'),
		glowColor: 'rgba(255, 215, 0, 0.3)',
	},
	{
		id: 'xp',
		emoji: '⚡',
		name: t('plusXp', { amount: Math.round(immediateXp) }),
		description: t('earnedImmediately'),
		glowColor: 'rgba(0, 212, 255, 0.3)',
	},
	{
		id: 'share-bonus',
		emoji: '📸',
		name: t('xpWaiting', { amount: Math.round(pendingXp) }),
		description: t('postToClaimDays', { days: postDeadlineDays }),
		glowColor: 'rgba(52, 211, 153, 0.3)',
	},
	{
		id: 'challenges',
		emoji: '🎯',
		name: t('dailyChallenges'),
		description: t('bonusXpRotates'),
		glowColor: 'rgba(168, 85, 247, 0.3)',
	},
]

const buildJourney = (
	pendingXp: number,
	t: (key: string, values?: Record<string, unknown>) => string,
): JourneyNode[] => [
	{
		id: '1',
		label: t('firstDish'),
		status: 'done',
		statusText: t('completedLabel'),
	},
	{
		id: '2',
		label: t('shareYourDishNode'),
		status: 'upcoming',
		statusText: t('plusXp', { amount: Math.round(pendingXp) }),
	},
	{
		id: '3',
		label: t('keepCooking'),
		status: 'locked',
		statusText: t('buildYourStreak'),
	},
	{
		id: '4',
		label: t('moreBadges'),
		status: 'locked',
		statusText: t('cookAndPostMore'),
	},
]

// ============================================
// CONSTANTS
// ============================================

// ============================================
// SUB-COMPONENTS
// ============================================

// Sparkle particles
const Sparkle = ({ x, y, delay }: { x: string; y: string; delay: number }) => (
	<motion.div
		initial={{ scale: 0, opacity: 0 }}
		animate={{
			scale: [0, 1, 0],
			opacity: [0, 1, 0],
		}}
		transition={{
			duration: 2,
			repeat: Infinity,
			delay,
			ease: 'easeInOut',
		}}
		className='absolute h-1.5 w-1.5 rounded-full bg-white'
		style={{ left: x, top: y }}
	/>
)

// Burst rings animation
const BurstRings = () => (
	<>
		{[0, 1, 2].map(i => (
			<motion.div
				key={i}
				initial={{ scale: 0.5, opacity: 1 }}
				animate={{ scale: 2, opacity: 0 }}
				transition={{
					duration: 1.5,
					repeat: Infinity,
					delay: i * 0.2,
					ease: 'easeOut',
				}}
				className={cn(
					'absolute inset-0 rounded-full border-3',
					i === 0 && 'border-warning/40',
					i === 1 && 'border-streak',
					i === 2 && 'border-streak-urgent',
				)}
			/>
		))}
	</>
)

// Unlock item card
const UnlockCard = ({ item, index }: { item: UnlockItem; index: number }) => (
	<motion.div
		initial={{ opacity: 0, scale: 0.8 }}
		animate={{ opacity: 1, scale: 1 }}
		transition={{
			...TRANSITION_BOUNCY,
			delay: 0.4 + index * 0.1,
		}}
		className='flex items-center gap-3 rounded-2xl border border-border bg-bg-elevated p-3.5'
	>
		{/* Icon with glow */}
		<div className='relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg-card'>
			<span className='relative z-10 text-2xl'>{item.emoji}</span>
			<motion.div
				animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
				transition={{ duration: 2, repeat: Infinity }}
				className='absolute inset-0 rounded-xl'
				style={{ backgroundColor: item.glowColor }}
			/>
		</div>

		{/* Info */}
		<div className='min-w-0 flex-1'>
			<span
				className={cn('block text-sm font-bold', item.id === 'xp' && 'text-xp')}
			>
				{item.name}
			</span>
			<span className='block text-xs text-text-muted'>{item.description}</span>
		</div>
	</motion.div>
)

// Journey node
const JourneyNodeComponent = ({ node }: { node: JourneyNode }) => (
	<div className='flex shrink-0 flex-col items-center gap-2'>
		{/* Marker */}
		<div
			className={cn(
				'flex size-11 items-center justify-center rounded-full border-3 text-lg font-display font-extrabold',
				node.status === 'done' &&
					'border-success bg-gradient-to-br from-success to-success/80 text-white shadow-lg shadow-success/40',
				node.status === 'upcoming' &&
					'border-dashed border-success bg-bg-card text-success',
				node.status === 'locked' &&
					'border-border bg-bg-elevated text-text-muted opacity-50',
			)}
		>
			{node.status === 'locked' ? (
				<Lock className='size-4' />
			) : node.id === '4' ? (
				'?'
			) : (
				node.id
			)}
		</div>

		{/* Label */}
		<span className='text-center text-xs font-semibold'>{node.label}</span>

		{/* Status */}
		<span
			className={cn(
				'rounded-md bg-bg-elevated px-2 py-0.5 text-2xs',
				node.status === 'done' && 'bg-success/15 text-success',
				node.status === 'upcoming' && 'text-success',
				node.status === 'locked' && 'text-text-muted',
			)}
		>
			{node.statusText}
		</span>
	</div>
)

// ============================================
// MAIN COMPONENT
// ============================================

export const FirstCookCelebration = ({
	isOpen,
	onClose,
	recipeName,
	recipeImageUrl,
	immediateXp,
	pendingXp,
	postDeadlineDays,
	onPostNow,
	onShareAchievement,
	onContinueCooking,
}: FirstCookCelebrationProps) => {
	const t = useTranslations('completion')
	useEscapeKey(isOpen, onClose)
	const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen)
	const unlocks = buildUnlocks(immediateXp, pendingXp, postDeadlineDays, t)
	const journey = buildJourney(pendingXp, t)

	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					<motion.div
						ref={focusTrapRef}
						role='alertdialog'
						aria-live='assertive'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center overflow-hidden p-5'
					>
						{/* Animated background */}
						<div className='pointer-events-none absolute inset-0 overflow-hidden'>
							<motion.div
								animate={{
									backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
								}}
								transition={{ duration: 10, repeat: Infinity }}
								className='absolute inset-0 bg-gradient-celebration'
							/>
							{/* Sparkles */}
							<Sparkle x='10%' y='20%' delay={0} />
							<Sparkle x='85%' y='15%' delay={0.3} />
							<Sparkle x='20%' y='70%' delay={0.5} />
							<Sparkle x='75%' y='80%' delay={0.2} />
							<Sparkle x='50%' y='10%' delay={0.4} />
							<Sparkle x='30%' y='50%' delay={0.6} />
							<Sparkle x='90%' y='45%' delay={0.1} />
						</div>

						{/* Card */}
						<motion.div
							variants={CELEBRATION_MODAL}
							initial='hidden'
							animate='visible'
							exit='exit'
							className='relative z-10 w-full max-w-xl overflow-y-auto rounded-2xl bg-bg-card p-10 shadow-2xl max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-sheet-full max-md:rounded-b-none max-md:p-6'
						>
							{/* Burst animation + badge */}
							<div className='relative mx-auto mb-6 size-28 max-md:h-24 max-md:w-24'>
								<BurstRings />
								<motion.div
									initial={{ scale: 0, rotate: -180 }}
									animate={{ scale: 1, rotate: 0 }}
									transition={{ ...TRANSITION_BOUNCY, delay: 0.3 }}
									className='absolute inset-0 flex items-center justify-center rounded-full bg-gradient-gold shadow-lg shadow-gold/40'
								>
									<span className='text-5xl max-md:text-4xl'>👨‍🍳</span>
								</motion.div>
							</div>

							{/* Title */}
							<div className='mb-7 text-center'>
								<h1 className='mb-2 bg-gradient-gold bg-clip-text text-3xl font-display font-extrabold text-transparent max-md:text-2xl'>
									{t('youreAChefNow')}
								</h1>
								<p className='text-text-muted'>{t('firstDishComplete')}</p>
							</div>

							{/* Dish showcase */}
							<div className='mb-6 flex items-center gap-4 rounded-2xl bg-bg-elevated p-4'>
								<div className='relative'>
									<Image
										src={recipeImageUrl || '/placeholder-recipe.svg'}
										alt={recipeName}
										width={80}
										height={80}
										className='h-thumbnail-lg w-thumbnail-lg rounded-xl object-cover'
									/>
									<div className='pointer-events-none absolute -inset-1 rounded-2xl border-2 border-gold' />
								</div>
								<div>
									<span className='block text-xs uppercase tracking-wide text-text-muted'>
										{t('yourFirstCreation')}
									</span>
									<span className='block text-lg font-bold'>{recipeName}</span>
								</div>
							</div>

							{/* Unlocked section */}
							<div className='mb-6'>
								<h3 className='mb-4 text-xs font-bold uppercase tracking-wide text-text-muted'>
									{t('youJustUnlocked')}
								</h3>
								<div className='grid grid-cols-2 gap-3 max-md:grid-cols-1'>
									{unlocks.map((item, i) => (
										<UnlockCard key={item.id} item={item} index={i} />
									))}
								</div>
							</div>

							{/* Pending XP teaser */}
							<div className='mb-6 flex items-center gap-3.5 rounded-2xl border border-xp/30 bg-gradient-to-r from-xp/10 to-bonus/10 p-4'>
								<div className='flex size-10 items-center justify-center rounded-lg bg-bg-card text-xp'>
									<Lock className='size-5' />
								</div>
								<div className='flex-1'>
									<span className='block text-sm font-bold text-xp'>
										{t('xpWaiting', { amount: Math.round(pendingXp) })}
									</span>
									<span className='block text-xs text-text-muted'>
										{t('postPhotoToUnlock')}
									</span>
								</div>
								<span className='whitespace-nowrap text-xs text-text-muted'>
									{t('daysToPost', { days: postDeadlineDays })}
								</span>
							</div>

							{/* Journey preview */}
							<div className='mb-7'>
								<h3 className='mb-4 text-xs font-bold uppercase tracking-wide text-text-muted'>
									{t('yourChefJourney')}
								</h3>
								<div className='-mx-6 flex items-start gap-0 overflow-x-auto scrollbar-hide px-6 py-2 max-md:-mx-6'>
									{journey.map((node, i) => (
										<Fragment key={node.id}>
											<JourneyNodeComponent node={node} />
											{i < journey.length - 1 && (
												<div className='mt-5 h-0.5 min-w-5 flex-1 bg-border' />
											)}
										</Fragment>
									))}
								</div>
							</div>

							{/* Actions */}
							<div className='mb-5'>
								<motion.button
									type='button'
									onClick={onPostNow}
									whileHover={STAT_ITEM_HOVER}
									whileTap={LIST_ITEM_TAP}
									className='mb-3.5 flex w-full items-center justify-center gap-3.5 rounded-2xl bg-gradient-to-r from-brand to-brand/85 px-7 py-5 text-white shadow-lg shadow-brand/30 transition-shadow hover:shadow-xl hover:shadow-brand/40 focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									<Camera className='size-7' />
									<div className='flex flex-col items-start gap-0.5'>
										<span className='text-lg font-bold'>
											{t('shareYourCreation')}
										</span>
										<span className='text-xs opacity-85'>
											{t('unlockXp', { amount: Math.round(pendingXp) })}
										</span>
									</div>
								</motion.button>{' '}
								<div className='flex gap-2.5'>
									<button
										type='button'
										onClick={onShareAchievement}
										className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-bg-hover'
									>
										<Share2 className='size-4' />
										{t('shareAchievement')}
									</button>
									<button
										type='button'
										onClick={onContinueCooking}
										className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-bg-hover'
									>
										{t('continueCooking')}
									</button>
								</div>
							</div>

							{/* Motivational footer */}
							<div className='rounded-xl bg-warning/10 p-3.5 text-center text-sm'>
								{t('firstCookTip')}
							</div>
						</motion.div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
