'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Lock, Unlock, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	TRANSITION_BOUNCY,
	CELEBRATION_MODAL,
	XP_COUNTER_VARIANTS,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

interface XPRow {
	id: string
	source: string
	emoji?: string
	amount: number
	isHighlight?: boolean
}

interface MasteryInfo {
	cuisineEmoji: string
	cuisineName: string
	percentComplete: number
	percentGained: number
}

interface PostPreview {
	authorAvatar: string
	authorName: string
	imageUrl: string
	caption: string
}

interface NextAction {
	id: string
	emoji: string
	label: string
	sublabel: string
	onClick: () => void
}

interface PostSuccessRewardsProps {
	isOpen: boolean
	onClose: () => void
	recipeName: string
	recipeImageUrl: string
	// XP breakdown
	xpRows: XPRow[]
	totalXp: number
	// Level progress
	currentLevel: number
	xpToNextLevel: number
	levelProgressPercent: number
	levelGainedPercent: number
	// Mastery (optional)
	mastery?: MasteryInfo
	// Post preview
	postPreview?: PostPreview
	// Actions
	onViewPost?: () => void
	onDone: () => void
	// Next actions
	nextActions: NextAction[]
}

// ============================================
// SUB-COMPONENTS
// ============================================

// Sparkle particle
const Sparkle = ({ x, y, delay }: { x: string; y: string; delay: number }) => (
	<motion.div
		initial={{ scale: 0, opacity: 0 }}
		animate={{
			scale: [0, 1, 0],
			opacity: [0, 1, 0],
		}}
		transition={{
			duration: 1.5,
			repeat: Infinity,
			delay,
			ease: 'easeInOut',
		}}
		className='absolute h-2 w-2 rounded-full bg-white'
		style={{ left: x, top: y }}
	/>
)

// XP row component
const XPRowComponent = ({ row, index }: { row: XPRow; index: number }) => (
	<motion.div
		initial={{ opacity: 0, x: -10 }}
		animate={{ opacity: 1, x: 0 }}
		transition={{ ...TRANSITION_SPRING, delay: 0.3 + index * 0.1 }}
		className={cn(
			'flex items-center justify-between rounded-lg px-3 py-2.5',
			row.isHighlight && 'border border-success/20 bg-success/10',
		)}
	>
		<span className='text-sm'>
			{row.emoji && <span className='mr-2'>{row.emoji}</span>}
			{row.source}
		</span>
		<motion.span
			variants={XP_COUNTER_VARIANTS}
			initial='hidden'
			animate='visible'
			className={cn('font-bold text-success', row.isHighlight && 'text-lg')}
		>
			+{row.amount} XP
		</motion.span>
	</motion.div>
)

// Progress bar with gained section
interface ProgressBarProps {
	fillPercent: number
	gainedPercent: number
	color: string
	gainedColor?: string
}

const ProgressBar = ({
	fillPercent,
	gainedPercent,
	color,
	gainedColor = 'bg-success',
}: ProgressBarProps) => (
	<div className='relative h-2 overflow-hidden rounded-full bg-border'>
		{/* Base fill */}
		<motion.div
			initial={{ width: 0 }}
			animate={{ width: `${fillPercent}%` }}
			transition={{ duration: 0.5 }}
			className={cn('absolute inset-y-0 left-0 rounded-full', color)}
		/>
		{/* Gained section highlight */}
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 0.8 }}
			transition={{ delay: 0.5 }}
			className={cn('absolute inset-y-0 rounded-full', gainedColor)}
			style={{
				left: `${fillPercent - gainedPercent}%`,
				width: `${gainedPercent}%`,
			}}
		/>
	</div>
)

// ============================================
// MAIN COMPONENT
// ============================================

export const PostSuccessRewards = ({
	isOpen,
	onClose,
	recipeName,
	recipeImageUrl,
	xpRows,
	totalXp,
	currentLevel,
	xpToNextLevel,
	levelProgressPercent,
	levelGainedPercent,
	mastery,
	postPreview,
	onViewPost,
	onDone,
	nextActions,
}: PostSuccessRewardsProps) => {
	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Sparkles */}
					<div className='pointer-events-none fixed inset-0 z-modal overflow-hidden'>
						<Sparkle x='20%' y='30%' delay={0} />
						<Sparkle x='80%' y='25%' delay={0.1} />
						<Sparkle x='15%' y='70%' delay={0.2} />
						<Sparkle x='85%' y='65%' delay={0.15} />
						<Sparkle x='50%' y='20%' delay={0.05} />
					</div>

					{/* Overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm'
					>
						{/* Card */}
						<motion.div
							variants={CELEBRATION_MODAL}
							initial='hidden'
							animate='visible'
							exit='exit'
							className='relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-panel-bg p-8 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85vh] max-md:rounded-b-none max-md:p-6'
						>
							{/* Close */}
							<button
								onClick={onClose}
								className='absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated text-text-muted transition-colors hover:bg-bg-hover hover:text-text'
							>
								<X className='h-5 w-5' />
							</button>

							{/* Header with posted image */}
							<div className='mb-6 text-center'>
								<div className='relative mx-auto mb-4 h-28 w-28'>
									<Image
										src={recipeImageUrl}
										alt={recipeName}
										width={112}
										height={112}
										className='h-full w-full rounded-2xl object-cover shadow-xl'
									/>
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{ ...TRANSITION_BOUNCY, delay: 0.3 }}
										className='absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-success to-success/80 shadow-lg shadow-success/40'
									>
										<Check className='h-5 w-5 text-white' />
									</motion.div>
								</div>
								<h1 className='mb-2 text-3xl font-extrabold'>Posted! 🎉</h1>
								<p className='text-text-muted'>Your {recipeName} is now live</p>
							</div>

							{/* XP unlocked section */}
							<div className='mb-5 rounded-2xl border border-success/20 bg-gradient-to-br from-success/10 to-success/5 p-5'>
								{/* Unlock animation icon */}
								<div className='relative mb-4 flex justify-center'>
									<motion.div
										initial={{ opacity: 1 }}
										animate={{ opacity: 0 }}
										transition={{ delay: 0.3 }}
										className='flex h-12 w-12 items-center justify-center rounded-full bg-panel-bg'
									>
										<Lock className='h-5 w-5 text-text-muted' />
									</motion.div>
									<motion.div
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ ...TRANSITION_BOUNCY, delay: 0.5 }}
										className='absolute flex h-12 w-12 items-center justify-center rounded-full bg-panel-bg'
									>
										<Unlock className='h-5 w-5 text-success' />
									</motion.div>
								</div>

								{/* XP breakdown */}
								<div className='space-y-1 rounded-xl bg-panel-bg p-3'>
									{xpRows.map((row, i) => (
										<XPRowComponent key={row.id} row={row} index={i} />
									))}

									{/* Total */}
									<div className='mt-2 flex items-center justify-between border-t border-border pt-3'>
										<span className='font-semibold'>Total Earned</span>
										<motion.span
											initial={{ scale: 0.5, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											transition={{ ...TRANSITION_BOUNCY, delay: 0.8 }}
											className='text-2xl font-extrabold text-success'
										>
											+{totalXp} XP
										</motion.span>
									</div>
								</div>
							</div>

							{/* Level progress */}
							<div className='mb-4 rounded-xl bg-bg-elevated p-4'>
								<div className='mb-2 flex items-center justify-between'>
									<span className='font-bold'>Level {currentLevel}</span>
									<span className='text-sm text-text-muted'>
										{xpToNextLevel} XP to Level {currentLevel + 1}
									</span>
								</div>
								<ProgressBar
									fillPercent={levelProgressPercent}
									gainedPercent={levelGainedPercent}
									color='bg-brand'
								/>
							</div>

							{/* Mastery progress (if provided) */}
							{mastery && (
								<div className='mb-4 rounded-xl bg-bg-elevated p-4'>
									<div className='mb-3 flex items-center gap-2.5'>
										<span className='text-xl'>{mastery.cuisineEmoji}</span>
										<span className='font-semibold'>
											{mastery.cuisineName} Mastery
										</span>
									</div>
									<div className='flex items-center gap-3'>
										<div className='flex-1'>
											<ProgressBar
												fillPercent={mastery.percentComplete}
												gainedPercent={mastery.percentGained}
												color='bg-purple-500'
											/>
										</div>
										<span className='font-bold text-purple-500'>
											{mastery.percentComplete}%
										</span>
									</div>
									<p className='mt-2 text-sm text-text-muted'>
										Keep cooking {mastery.cuisineName.toLowerCase()} recipes to
										master this cuisine!
									</p>
								</div>
							)}

							{/* Post preview */}
							{postPreview && (
								<div className='mb-5 rounded-xl bg-bg-elevated p-4'>
									<div className='mb-3 flex items-center justify-between'>
										<span className='font-semibold'>
											Your post is now live!
										</span>
										{onViewPost && (
											<button
												onClick={onViewPost}
												className='flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/10'
											>
												View Post
												<ArrowRight className='h-4 w-4' />
											</button>
										)}
									</div>
									<div className='overflow-hidden rounded-lg border border-border bg-panel-bg'>
										<div className='flex items-center gap-2.5 p-3'>
											<Image
												src={postPreview.authorAvatar}
												alt={postPreview.authorName}
												width={28}
												height={28}
												className='h-7 w-7 rounded-full'
											/>
											<span className='flex-1 text-sm font-semibold'>
												{postPreview.authorName}
											</span>
											<span className='text-xs text-text-muted'>Just now</span>
										</div>
										<Image
											src={postPreview.imageUrl}
											alt='Your creation'
											width={400}
											height={300}
											className='aspect-[4/3] w-full object-cover'
										/>
										<p className='p-3 text-sm'>{postPreview.caption}</p>
									</div>
								</div>
							)}

							{/* What's next */}
							<div className='mb-5'>
								<h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted'>
									What&apos;s Next?
								</h3>
								<div className='grid grid-cols-3 gap-2.5'>
									{nextActions.map(action => (
										<button
											key={action.id}
											onClick={action.onClick}
											className='flex flex-col items-center gap-1.5 rounded-xl border border-border bg-bg-elevated px-3 py-4 transition-colors hover:border-brand hover:bg-brand/5'
										>
											<span className='text-2xl'>{action.emoji}</span>
											<span className='text-sm font-semibold'>
												{action.label}
											</span>
											<span className='hidden text-xs text-text-muted md:block'>
												{action.sublabel}
											</span>
										</button>
									))}
								</div>
							</div>

							{/* Done button */}
							<button
								onClick={onDone}
								className='w-full rounded-xl bg-brand py-4 text-base font-bold text-white transition-opacity hover:opacity-90'
							>
								Done
							</button>
						</motion.div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}
