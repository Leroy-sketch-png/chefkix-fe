'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Share2, ChefHat, Lock } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
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

// ============================================
// CONSTANTS
// ============================================

const UNLOCKS: UnlockItem[] = [
	{
		id: 'badge',
		emoji: '🎖️',
		name: 'First Dish Badge',
		description: 'Your first of many!',
		glowColor: 'rgba(255, 215, 0, 0.3)', // bonus gold
	},
	{
		id: 'xp',
		emoji: '⚡',
		name: '+30 XP',
		description: 'Your first XP ever!',
		glowColor: 'rgba(0, 212, 255, 0.3)', // xp cyan
	},
	{
		id: 'level',
		emoji: '📈',
		name: 'Level 1 Started',
		description: '70 more XP to Level 2',
		glowColor: 'rgba(52, 211, 153, 0.3)', // level emerald
	},
	{
		id: 'challenges',
		emoji: '🎯',
		name: 'Daily Challenges',
		description: 'New challenge every day!',
		glowColor: 'rgba(168, 85, 247, 0.3)', // rare purple
	},
]

const JOURNEY: JourneyNode[] = [
	{ id: '1', label: 'First Dish', status: 'done', statusText: '✓ Done' },
	{ id: '2', label: 'First Post', status: 'upcoming', statusText: '+70 XP' },
	{ id: '3', label: 'Level 2', status: 'locked', statusText: 'Coming soon' },
	{ id: '4', label: 'First Badge', status: 'locked', statusText: 'Mystery' },
]

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
					i === 0 && 'border-amber-400',
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
		<div className='relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-panel-bg'>
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
				'flex h-11 w-11 items-center justify-center rounded-full border-3 text-lg font-extrabold',
				node.status === 'done' &&
					'border-success bg-gradient-to-br from-success to-success/80 text-white shadow-lg shadow-success/40',
				node.status === 'upcoming' &&
					'border-dashed border-success bg-panel-bg text-success',
				node.status === 'locked' &&
					'border-border bg-bg-elevated text-text-muted opacity-50',
			)}
		>
			{node.status === 'locked' ? (
				<Lock className='h-4 w-4' />
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
	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center overflow-hidden p-5'
					>
						{/* Animated background */}
						<div className='absolute inset-0 overflow-hidden'>
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
							className='relative z-10 w-full max-w-xl overflow-y-auto rounded-3xl bg-panel-bg p-10 shadow-2xl max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-sheet-full max-md:rounded-b-none max-md:p-6'
						>
							{/* Burst animation + badge */}
							<div className='relative mx-auto mb-6 h-28 w-28 max-md:h-24 max-md:w-24'>
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
								<h1 className='mb-2 bg-gradient-gold bg-clip-text text-3xl font-extrabold text-transparent max-md:text-2xl'>
									You&apos;re a Chef Now!
								</h1>
								<p className='text-text-muted'>
									Your first dish is complete. The journey begins.
								</p>
							</div>

							{/* Dish showcase */}
							<div className='mb-6 flex items-center gap-4 rounded-2xl bg-bg-elevated p-4'>
								<div className='relative'>
									<Image
										src={recipeImageUrl || '/placeholder-recipe.jpg'}
										alt={recipeName}
										width={80}
										height={80}
										className='h-thumbnail-lg w-thumbnail-lg rounded-xl object-cover'
									/>
									<div className='pointer-events-none absolute -inset-1 rounded-2xl border-2 border-gold' />
								</div>
								<div>
									<span className='block text-xs uppercase tracking-wide text-text-muted'>
										Your First Creation
									</span>
									<span className='block text-lg font-bold'>{recipeName}</span>
								</div>
							</div>

							{/* Unlocked section */}
							<div className='mb-6'>
								<h3 className='mb-4 text-xs font-bold uppercase tracking-wide text-text-muted'>
									You just unlocked:
								</h3>
								<div className='grid grid-cols-2 gap-3 max-md:grid-cols-1'>
									{UNLOCKS.map((item, i) => (
										<UnlockCard key={item.id} item={item} index={i} />
									))}
								</div>
							</div>

							{/* Pending XP teaser */}
							<div className='mb-6 flex items-center gap-3.5 rounded-2xl border border-dashed border-xp/40 bg-gradient-to-r from-xp/10 to-bonus/10 p-4'>
								<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-panel-bg text-xp'>
									<Lock className='h-5 w-5' />
								</div>
								<div className='flex-1'>
									<span className='block text-sm font-bold text-xp'>
										+{Math.round(pendingXp)} XP waiting
									</span>
									<span className='block text-xs text-text-muted'>
										Post a photo of your dish to unlock
									</span>
								</div>
								<span className='whitespace-nowrap text-xs text-text-muted'>
									{postDeadlineDays} days to post
								</span>
							</div>

							{/* Journey preview */}
							<div className='mb-7'>
								<h3 className='mb-4 text-xs font-bold uppercase tracking-wide text-text-muted'>
									Your Chef Journey:
								</h3>
								<div className='-mx-6 flex items-start gap-0 overflow-x-auto px-6 py-2 max-md:-mx-6'>
									{JOURNEY.map((node, i) => (
										<>
											<JourneyNodeComponent key={node.id} node={node} />
											{i < JOURNEY.length - 1 && (
												<div className='mt-5 h-0.5 min-w-5 flex-1 bg-border' />
											)}
										</>
									))}
								</div>
							</div>

							{/* Actions */}
							<div className='mb-5'>
								<motion.button
									onClick={onPostNow}
									whileHover={STAT_ITEM_HOVER}
									whileTap={LIST_ITEM_TAP}
									className='mb-3.5 flex w-full items-center justify-center gap-3.5 rounded-2xl bg-gradient-to-r from-brand to-brand/85 px-7 py-5 text-white shadow-lg shadow-brand/30 transition-shadow hover:shadow-xl hover:shadow-brand/40'
								>
									<Camera className='h-7 w-7' />
									<div className='flex flex-col items-start gap-0.5'>
										<span className='text-lg font-bold'>
											Share Your Creation
										</span>
										<span className='text-xs opacity-85'>
											Unlock +{Math.round(pendingXp)} XP
										</span>
									</div>
								</motion.button>{' '}
								<div className='flex gap-2.5'>
									<button
										onClick={onShareAchievement}
										className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-bg-hover'
									>
										<Share2 className='h-4 w-4' />
										Share Achievement
									</button>
									<button
										onClick={onContinueCooking}
										className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-bg-hover'
									>
										Continue Cooking
									</button>
								</div>
							</div>

							{/* Motivational footer */}
							<div className='rounded-xl bg-amber-500/10 p-3.5 text-center text-sm'>
								🍳 <strong>Tip:</strong> Complete a challenge today for bonus
								XP!
							</div>
						</motion.div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
