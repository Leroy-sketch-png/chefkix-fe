'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import {
	TRANSITION_SPRING,
	TRANSITION_BOUNCY,
	CELEBRATION_MODAL,
	LEVEL_UP_VARIANTS,
	STAT_ITEM_HOVER,
	LIST_ITEM_TAP,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

interface UnlockItem {
	id: string
	emoji: string
	title: string
	description: string
}

interface UserStats {
	totalXp: number
	recipesCooked: number
	postsShared: number
}

interface LevelUpCelebrationProps {
	isOpen: boolean
	onClose: () => void
	oldLevel: number
	newLevel: number
	stats: UserStats
	unlocks: UnlockItem[]
	xpToNextLevel: number
	nextLevelPerk?: string
	onShare: () => void
	onContinue: () => void
}

// ============================================
// SUB-COMPONENTS
// ============================================

// Floating particles
const Particle = ({
	x,
	y,
	size,
	delay,
}: {
	x: string
	y: string
	size: number
	delay: number
}) => (
	<motion.div
		initial={{ y: 0, scale: 1, opacity: 0.6 }}
		animate={{
			y: [-30, 0, -30],
			scale: [1, 1.2, 1],
			opacity: [0.6, 1, 0.6],
		}}
		transition={{
			duration: 4,
			repeat: Infinity,
			delay,
			ease: 'easeInOut',
		}}
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: size,
			height: size,
			background: 'linear-gradient(135deg, #fbbf24, #f97316)',
			borderRadius: '50%',
		}}
	/>
)

// Level badge with flip animation
interface LevelBadgeProps {
	oldLevel: number
	newLevel: number
}

const LevelBadge = ({ oldLevel, newLevel }: LevelBadgeProps) => (
	<div className='relative mx-auto mb-8 h-36 w-36'>
		{/* Glow */}
		<motion.div
			animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
			transition={{ duration: 2, repeat: Infinity }}
			className='absolute -inset-5 rounded-full'
			style={{
				background:
					'radial-gradient(circle, rgba(192, 132, 252, 0.5) 0%, transparent 70%)',
			}}
		/>

		{/* Ring SVG */}
		<svg className='absolute inset-0 -rotate-90' viewBox='0 0 120 120'>
			<circle
				cx='60'
				cy='60'
				r='54'
				fill='none'
				stroke='rgba(255,255,255,0.1)'
				strokeWidth='8'
			/>
			<motion.circle
				cx='60'
				cy='60'
				r='54'
				fill='none'
				stroke='#ffd700'
				strokeWidth='8'
				strokeLinecap='round'
				strokeDasharray='339'
				initial={{ strokeDashoffset: 339 }}
				animate={{ strokeDashoffset: 0 }}
				transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
			/>
		</svg>

		{/* Inner badge */}
		<div className='absolute inset-5 flex items-center justify-center overflow-hidden rounded-full bg-gradient-celebration shadow-lg shadow-bonus/50'>
			{/* Old level (exits) */}
			<motion.span
				initial={{ y: 0, scale: 1, opacity: 1 }}
				animate={{ y: '-100%', scale: 0.5, opacity: 0 }}
				transition={{ duration: 0.5, delay: 0.5 }}
				className='absolute text-5xl font-black text-white drop-shadow-lg'
			>
				{oldLevel}
			</motion.span>

			{/* New level (enters) */}
			<motion.span
				initial={{ y: '100%', scale: 0.5, opacity: 0 }}
				animate={{ y: 0, scale: 1, opacity: 1 }}
				transition={{ ...TRANSITION_BOUNCY, delay: 0.8 }}
				className='absolute text-5xl font-black text-white drop-shadow-lg'
			>
				{newLevel}
			</motion.span>
		</div>

		{/* Stars */}
		<motion.span
			initial={{ scale: 0, rotate: -45, opacity: 0 }}
			animate={{ scale: 1, rotate: 0, opacity: 1 }}
			transition={{ ...TRANSITION_BOUNCY, delay: 1 }}
			className='absolute -left-2 -top-3 text-2xl'
		>
			⭐
		</motion.span>
		<motion.span
			initial={{ scale: 0, rotate: -45, opacity: 0 }}
			animate={{ scale: 1, rotate: 0, opacity: 1 }}
			transition={{ ...TRANSITION_BOUNCY, delay: 1.1 }}
			className='absolute -right-4 top-5 text-2xl'
		>
			✨
		</motion.span>
		<motion.span
			initial={{ scale: 0, rotate: -45, opacity: 0 }}
			animate={{ scale: 1, rotate: 0, opacity: 1 }}
			transition={{ ...TRANSITION_BOUNCY, delay: 1.2 }}
			className='absolute -left-3 bottom-3 text-2xl'
		>
			⭐
		</motion.span>
	</div>
)

// Stat card
const StatCard = ({
	emoji,
	label,
	value,
}: {
	emoji: string
	label: string
	value: string
}) => (
	<div className='flex items-center gap-2.5'>
		<span className='text-2xl'>{emoji}</span>
		<div className='flex flex-col text-left'>
			<span className='text-xs text-white/60'>{label}</span>
			<span className='font-bold text-white'>{value}</span>
		</div>
	</div>
)

// Unlock card
const UnlockCard = ({ item, index }: { item: UnlockItem; index: number }) => (
	<motion.div
		initial={{ opacity: 0, scale: 0.8, y: 10 }}
		animate={{ opacity: 1, scale: 1, y: 0 }}
		transition={{ ...TRANSITION_BOUNCY, delay: 1.3 + index * 0.1 }}
		className='flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4'
	>
		<span className='text-3xl'>{item.emoji}</span>
		<div className='flex flex-col text-left'>
			<span className='font-bold text-white'>{item.title}</span>
			<span className='text-xs text-white/60'>{item.description}</span>
		</div>
	</motion.div>
)

// ============================================
// MAIN COMPONENT
// ============================================

export const LevelUpCelebration = ({
	isOpen,
	onClose,
	oldLevel,
	newLevel,
	stats,
	unlocks,
	xpToNextLevel,
	nextLevelPerk,
	onShare,
	onContinue,
}: LevelUpCelebrationProps) => {
	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center overflow-hidden bg-gradient-celebration'
					>
						{/* Particle field */}
						<div className='pointer-events-none absolute inset-0 overflow-hidden'>
							<Particle x='5%' y='20%' size={8} delay={0} />
							<Particle x='15%' y='80%' size={6} delay={0.2} />
							<Particle x='25%' y='40%' size={10} delay={0.1} />
							<Particle x='35%' y='70%' size={5} delay={0.3} />
							<Particle x='45%' y='15%' size={7} delay={0.15} />
							<Particle x='55%' y='85%' size={9} delay={0.25} />
							<Particle x='65%' y='30%' size={6} delay={0.05} />
							<Particle x='75%' y='60%' size={8} delay={0.35} />
							<Particle x='85%' y='25%' size={5} delay={0.4} />
							<Particle x='95%' y='75%' size={7} delay={0.12} />
						</div>

						{/* Content */}
						<motion.div
							variants={CELEBRATION_MODAL}
							initial='hidden'
							animate='visible'
							exit='exit'
							className='relative z-10 max-w-lg px-10 py-10 text-center max-md:px-6'
						>
							{/* Level badge */}
							<LevelBadge oldLevel={oldLevel} newLevel={newLevel} />

							{/* Title */}
							<div className='mb-8'>
								<motion.h1
									animate={{
										filter: [
											'drop-shadow(0 0 10px rgba(251,191,36,0.5))',
											'drop-shadow(0 0 25px rgba(251,191,36,0.8))',
											'drop-shadow(0 0 10px rgba(251,191,36,0.5))',
										],
									}}
									transition={{ duration: 1.5, repeat: Infinity }}
									className='mb-3 bg-gradient-gold bg-clip-text text-4xl font-black text-transparent max-md:text-3xl'
								>
									Level Up!
								</motion.h1>
								<p className='text-lg text-white/80'>
									You&apos;re now{' '}
									<strong className='text-white'>Level {newLevel}</strong>
								</p>
							</div>

							{/* Stats */}
							<div className='mb-6 flex justify-center gap-5 rounded-2xl bg-white/5 px-5 py-5 backdrop-blur-sm max-md:flex-col max-md:items-start max-md:gap-3'>
								<StatCard
									emoji='📊'
									label='Total XP'
									value={stats.totalXp.toLocaleString()}
								/>
								<StatCard
									emoji='🍳'
									label='Recipes Cooked'
									value={stats.recipesCooked.toString()}
								/>
								<StatCard
									emoji='📸'
									label='Posts Shared'
									value={stats.postsShared.toString()}
								/>
							</div>

							{/* Unlocks */}
							{unlocks.length > 0 && (
								<div className='mb-6'>
									<h3 className='mb-4 text-xs font-bold uppercase tracking-widest text-white/60'>
										New Unlocks
									</h3>
									<div className='flex flex-wrap justify-center gap-3 max-md:flex-col'>
										{unlocks.map((item, i) => (
											<UnlockCard key={item.id} item={item} index={i} />
										))}
									</div>
								</div>
							)}

							{/* Next level preview */}
							<div className='mb-7 rounded-2xl bg-white/5 px-5 py-5'>
								<div className='mb-3'>
									<div className='mb-2 h-2 overflow-hidden rounded-full bg-white/10'>
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: '0%' }}
											transition={{ duration: 1, delay: 1.5 }}
											className='h-full rounded-full bg-gradient-to-r from-success to-success/80'
										/>
									</div>
									<span className='text-sm text-white/60'>
										{xpToNextLevel.toLocaleString()} XP to Level {newLevel + 1}
									</span>
								</div>
								{nextLevelPerk && (
									<div className='flex items-center justify-center gap-2'>
										<span className='text-xs text-white/50'>
											At Level {newLevel + 1}:
										</span>
										<span className='text-sm font-semibold text-bonus'>
											{nextLevelPerk}
										</span>
									</div>
								)}
							</div>

							{/* Actions */}
							<div className='flex justify-center gap-3 max-md:flex-col'>
								<button
									onClick={onShare}
									className='flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/15'
								>
									<Share2 className='h-5 w-5' />
									Share Achievement
								</button>
								<motion.button
									onClick={onContinue}
									whileHover={STAT_ITEM_HOVER}
									whileTap={LIST_ITEM_TAP}
									className='rounded-2xl bg-gradient-celebration px-8 py-3.5 font-bold text-white shadow-lg shadow-bonus/50 transition-shadow hover:shadow-xl hover:shadow-bonus/60'
								>
									Continue
								</motion.button>
							</div>
						</motion.div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}

// ============================================
// TOAST VERSION
// ============================================

interface LevelUpToastProps {
	level: number
	onView: () => void
	onDismiss: () => void
}

export const LevelUpToast = ({
	level,
	onView,
	onDismiss,
}: LevelUpToastProps) => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: 20 }}
		transition={TRANSITION_SPRING}
		className='fixed bottom-24 left-1/2 z-modal flex -translate-x-1/2 items-center gap-3.5 rounded-2xl border-2 border-bonus bg-panel-bg px-4 py-3 shadow-xl shadow-bonus/20 md:bottom-6'
	>
		{/* Badge */}
		<div className='flex h-11 w-11 items-center justify-center rounded-full bg-gradient-celebration'>
			<span className='text-lg font-black text-white'>{level}</span>
		</div>

		{/* Content */}
		<div className='flex flex-col'>
			<span className='text-base font-extrabold'>Level {level}!</span>
			<span className='text-sm text-text-muted'>
				You&apos;re making progress 🔥
			</span>
		</div>

		{/* Actions */}
		<button
			onClick={onView}
			className='rounded-lg bg-gradient-celebration px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90'
		>
			View
		</button>
		<button
			onClick={onDismiss}
			className='flex h-8 w-8 items-center justify-center text-text-muted hover:text-text'
		>
			<X className='h-5 w-5' />
		</button>
	</motion.div>
)
