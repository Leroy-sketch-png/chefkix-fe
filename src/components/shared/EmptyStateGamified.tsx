'use client'

import { motion } from 'framer-motion'
import {
	Compass,
	BookOpen,
	ChefHat,
	Check,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'

// ============================================================================
// TYPES
// ============================================================================

export type EmptyStateVariant =
	| 'feed'
	| 'cooking'
	| 'search'
	| 'saved'
	| 'challenges'
	| 'pending'
	| 'notifications'
	| 'custom'

export interface QuickAction {
	label: string
	href?: string
	onClick?: () => void
	emoji?: string
}

export interface EmptyStateProps {
	variant?: EmptyStateVariant
	title: string
	description: string
	illustration?: React.ReactNode
	emoji?: string
	primaryAction?: {
		label: string
		onClick?: () => void
		href?: string
		icon?: React.ReactNode
	}
	secondaryActions?: {
		label: string
		onClick?: () => void
		href?: string
		icon?: React.ReactNode
	}[]
	quickActions?: QuickAction[]
	fomoStats?: {
		label: string
		value: string
	}[]
	searchSuggestions?: string[]
	onSuggestionClick?: (suggestion: string) => void
	isPositive?: boolean
	children?: React.ReactNode
	className?: string
}

// ============================================================================
// ANIMATED ILLUSTRATIONS
// ============================================================================

function PlateIllustration() {
	return (
		<div className='relative inline-flex items-center justify-center'>
			{/* Ambient glow ring */}
			<motion.div
				className='absolute size-28 rounded-full bg-brand/8'
				animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
				transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
			/>
			<svg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg' className='relative z-10'>
				{/* Plate shadow */}
				<ellipse cx='50' cy='78' rx='38' ry='8' fill='currentColor' className='text-border-subtle' opacity='0.4' />
				{/* Plate body */}
				<ellipse cx='50' cy='60' rx='36' ry='22' fill='#fdfbf8' stroke='currentColor' strokeWidth='1.5' className='text-border-medium' />
				<ellipse cx='50' cy='58' rx='28' ry='16' fill='none' stroke='currentColor' strokeWidth='0.8' className='text-border-subtle' opacity='0.6' />
				{/* Fork */}
				<g transform='translate(18, 30) rotate(-20)'>
					<rect x='2' y='0' width='2' height='35' rx='1' className='fill-text-muted' opacity='0.5' />
					<rect x='0' y='0' width='1.2' height='10' rx='0.6' className='fill-text-muted' opacity='0.5' />
					<rect x='2.4' y='0' width='1.2' height='11' rx='0.6' className='fill-text-muted' opacity='0.5' />
					<rect x='4.8' y='0' width='1.2' height='10' rx='0.6' className='fill-text-muted' opacity='0.5' />
				</g>
				{/* Knife */}
				<g transform='translate(76, 32) rotate(20)'>
					<rect x='0' y='0' width='2.5' height='34' rx='1.2' className='fill-text-muted' opacity='0.5' />
					<path d='M0 0 Q-2 -5 0 -12 Q2.5 -5 2.5 0 Z' className='fill-text-muted' opacity='0.4' />
				</g>
			</svg>
			{/* Animated steam wisps */}
			{[0, 1, 2].map(i => (
				<motion.div
					key={i}
					className='absolute rounded-full bg-brand/15'
					style={{
						width: 4 + i * 2,
						height: 4 + i * 2,
						left: `${42 + i * 8}%`,
						top: '15%',
					}}
					animate={{
						y: [0, -20, -35],
						opacity: [0, 0.6, 0],
						scale: [0.5, 1.2, 0.8],
					}}
					transition={{
						duration: 2.5,
						delay: i * 0.5,
						repeat: Infinity,
						ease: 'easeOut',
					}}
				/>
			))}
		</div>
	)
}

function ChefWaitingIllustration() {
	return (
		<div className='relative inline-flex items-center justify-center'>
			{/* Ambient pulse */}
			<motion.div
				className='absolute size-24 rounded-full bg-brand/6'
				animate={{ scale: [1, 1.2, 1] }}
				transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
			/>
			<svg width='80' height='90' viewBox='0 0 80 90' fill='none' xmlns='http://www.w3.org/2000/svg' className='relative z-10'>
				{/* Chef hat */}
				<ellipse cx='28' cy='22' rx='10' ry='12' fill='#fdfbf8' stroke='currentColor' strokeWidth='1.5' className='text-brand' opacity='0.7' />
				<ellipse cx='40' cy='18' rx='11' ry='13' fill='#fdfbf8' stroke='currentColor' strokeWidth='1.5' className='text-brand' opacity='0.7' />
				<ellipse cx='52' cy='22' rx='10' ry='12' fill='#fdfbf8' stroke='currentColor' strokeWidth='1.5' className='text-brand' opacity='0.7' />
				<rect x='26' y='28' width='28' height='6' rx='2' fill='#fdfbf8' stroke='currentColor' strokeWidth='1.5' className='text-brand' opacity='0.7' />
				{/* Face */}
				<circle cx='40' cy='48' r='14' fill='#fff5f3' stroke='currentColor' strokeWidth='1.5' className='text-brand' opacity='0.6' />
				{/* Eyes */}
				<circle cx='35' cy='46' r='1.8' className='fill-brand' opacity='0.6' />
				<circle cx='45' cy='46' r='1.8' className='fill-brand' opacity='0.6' />
				{/* Smile */}
				<path d='M35 53 Q40 57 45 53' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' fill='none' className='text-brand' opacity='0.5' />
				{/* Spatula in hand */}
				<g transform='translate(58, 38) rotate(15)'>
					<rect x='0' y='0' width='2' height='22' rx='1' className='fill-text-muted' opacity='0.4' />
					<rect x='-2' y='20' width='6' height='8' rx='2' className='fill-text-muted' opacity='0.3' />
				</g>
			</svg>
			{/* Waiting dots */}
			<div className='absolute bottom-0 flex gap-1'>
				{[0, 1, 2].map(i => (
					<motion.div
						key={i}
						className='size-1.5 rounded-full bg-text-muted'
						animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -3, 0] }}
						transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
					/>
				))}
			</div>
		</div>
	)
}

function SearchIllustration() {
	return (
		<div className='relative inline-flex items-center justify-center'>
			<motion.div
				className='absolute size-24 rounded-full bg-brand/6'
				animate={{ scale: [1, 1.1, 1] }}
				transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
			/>
			<svg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg' className='relative z-10'>
				{/* Magnifying glass body */}
				<circle cx='34' cy='34' r='18' fill='#fdfbf8' stroke='currentColor' strokeWidth='2.5' className='text-text-muted' opacity='0.6' />
				<circle cx='34' cy='34' r='12' fill='none' stroke='currentColor' strokeWidth='1' className='text-border-subtle' opacity='0.5' />
				{/* Handle */}
				<line x1='48' y1='48' x2='62' y2='62' stroke='currentColor' strokeWidth='3' strokeLinecap='round' className='text-text-muted' opacity='0.5' />
				{/* Sparkle accent */}
				<circle cx='30' cy='28' r='2' className='fill-brand' opacity='0.3' />
				<circle cx='38' cy='32' r='1.2' className='fill-brand' opacity='0.2' />
			</svg>
			{/* Animated search sweep */}
			<motion.div
				className='absolute left-1/2 top-1/2 size-3 rounded-full bg-brand/20'
				animate={{
					x: [-12, 12, -12],
					y: [-8, 8, -8],
					opacity: [0.3, 0.6, 0.3],
				}}
				transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
			/>
		</div>
	)
}

function BookmarkIllustration() {
	return (
		<div className='relative inline-flex items-center justify-center'>
			<motion.div
				className='absolute size-28 rounded-full bg-brand/5'
				animate={{ scale: [1, 1.08, 1] }}
				transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
			/>
			<div className='relative z-10 flex items-end gap-1.5'>
				{[0, 1, 2].map(i => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: i === 2 ? 1 : 0.4 + i * 0.2, y: 0 }}
						transition={{ delay: i * 0.15 }}
					>
						<svg width={i === 2 ? '44' : '36'} height={i === 2 ? '56' : '46'} viewBox='0 0 44 56' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<rect x='2' y='2' width='40' height='52' rx='6' fill='#fdfbf8' stroke='currentColor' strokeWidth='1.5' className='text-border-medium' />
							{/* Page lines */}
							<line x1='10' y1='16' x2='34' y2='16' stroke='currentColor' strokeWidth='1' className='text-border-subtle' opacity='0.4' />
							<line x1='10' y1='22' x2='28' y2='22' stroke='currentColor' strokeWidth='1' className='text-border-subtle' opacity='0.3' />
							<line x1='10' y1='28' x2='32' y2='28' stroke='currentColor' strokeWidth='1' className='text-border-subtle' opacity='0.3' />
							{/* Bookmark tab */}
							{i === 2 && (
								<path d='M28 2 L28 14 L34 10 L40 14 L40 2' className='fill-brand' opacity='0.6' />
							)}
						</svg>
					</motion.div>
				))}
			</div>
		</div>
	)
}

function TargetIllustration() {
	return (
		<div className='relative inline-flex items-center justify-center'>
			{/* Pulse ring */}
			<motion.div
				className='absolute size-28 rounded-full border-2 border-brand/20'
				animate={{ scale: [0.8, 1.6], opacity: [0.6, 0] }}
				transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
			/>
			<svg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg' className='relative z-10'>
				{/* Target rings */}
				<circle cx='40' cy='40' r='30' fill='none' stroke='currentColor' strokeWidth='2' className='text-border-medium' opacity='0.4' />
				<circle cx='40' cy='40' r='20' fill='none' stroke='currentColor' strokeWidth='2' className='text-brand' opacity='0.3' />
				<circle cx='40' cy='40' r='10' fill='none' stroke='currentColor' strokeWidth='2' className='text-brand' opacity='0.5' />
				{/* Bullseye */}
				<circle cx='40' cy='40' r='4' className='fill-brand' opacity='0.7' />
				{/* Arrow */}
				<g transform='translate(52, 16) rotate(45)'>
					<line x1='0' y1='0' x2='20' y2='0' stroke='currentColor' strokeWidth='2' strokeLinecap='round' className='text-brand' opacity='0.5' />
					<path d='M16 -4 L22 0 L16 4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' fill='none' className='text-brand' opacity='0.5' />
				</g>
			</svg>
		</div>
	)
}

function CheckmarkIllustration() {
	return (
		<div className='relative inline-flex items-center justify-center'>
			{/* Success glow */}
			<motion.div
				className='absolute size-24 rounded-full bg-success/10'
				initial={{ scale: 0 }}
				animate={{ scale: [0, 1.3, 1] }}
				transition={{ duration: 0.8, ease: 'easeOut' }}
			/>
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={TRANSITION_SPRING}
				className='relative z-10 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30'
			>
				<Check className='size-8 text-white' strokeWidth={3} />
			</motion.div>
			{/* Confetti particles */}
			{[0, 1, 2, 3].map(i => (
				<motion.div
					key={i}
					className='absolute size-1.5 rounded-full'
					style={{
						background: ['#FF5A36', '#10b981', '#a855f7', '#f59e0b'][i],
					}}
					initial={{ scale: 0, x: 0, y: 0 }}
					animate={{
						scale: [0, 1, 0],
						x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 8)],
						y: [0, -(15 + i * 5)],
					}}
					transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
				/>
			))}
		</div>
	)
}

function BellIllustration() {
	return (
		<div className='relative inline-flex items-center justify-center'>
			<motion.div
				className='absolute size-24 rounded-full bg-brand/5'
				animate={{ scale: [1, 1.1, 1] }}
				transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
			/>
			<svg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg' className='relative z-10'>
				{/* Bell body */}
				<path d='M28 35 C28 22 52 22 52 35 L54 52 L26 52 Z' fill='#fdfbf8' stroke='currentColor' strokeWidth='1.8' className='text-text-muted' opacity='0.5' />
				{/* Bell bottom rim */}
				<rect x='22' y='52' width='36' height='5' rx='2.5' fill='#fdfbf8' stroke='currentColor' strokeWidth='1.5' className='text-text-muted' opacity='0.4' />
				{/* Clapper */}
				<circle cx='40' cy='61' r='3' className='fill-text-muted' opacity='0.4' />
				{/* Bell top */}
				<circle cx='40' cy='22' r='2.5' className='fill-text-muted' opacity='0.3' />
			</svg>
			{/* Sleep particles */}
			{[0, 1, 2].map(i => (
				<motion.span
					key={i}
					className='absolute text-text-muted font-medium'
					style={{
						fontSize: 10 + i * 2,
						right: 8 + i * 6,
						top: 8 + i * 4,
					}}
					animate={{
						y: [0, -(6 + i * 3)],
						opacity: [0, 0.5, 0],
						x: [0, 4 + i * 2],
					}}
					transition={{
						duration: 2.5,
						delay: i * 0.4,
						repeat: Infinity,
						ease: 'easeOut',
					}}
				>
					z
				</motion.span>
			))}
		</div>
	)
}

// ============================================================================
// ILLUSTRATION MAP
// ============================================================================

const illustrationMap: Record<EmptyStateVariant, React.ReactNode> = {
	feed: <PlateIllustration />,
	cooking: <ChefWaitingIllustration />,
	search: <SearchIllustration />,
	saved: <BookmarkIllustration />,
	challenges: <TargetIllustration />,
	pending: <CheckmarkIllustration />,
	notifications: <BellIllustration />,
	custom: null,
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

export function EmptyState({
	variant = 'custom',
	title,
	description,
	illustration,
	emoji,
	primaryAction,
	secondaryActions,
	quickActions,
	fomoStats,
	searchSuggestions,
	onSuggestionClick,
	isPositive = false,
	children,
	className,
}: EmptyStateProps) {
	const defaultIllustration =
		variant !== 'custom' ? illustrationMap[variant] : null
	const displayIllustration =
		illustration ??
		(emoji ? (
			<span className='text-icon-emoji-xl'>{emoji}</span>
		) : (
			defaultIllustration
		))

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'text-center py-12 px-6 bg-panel-bg rounded-xl border border-border my-6',
				isPositive &&
					'bg-gradient-to-b from-success/5 to-brand/2 border-success/20',
				className,
			)}
		>
			{/* Illustration */}
			{displayIllustration && <div className='mb-6'>{displayIllustration}</div>}

			{/* Title & Description */}
			<h3 className='text-xl font-extrabold text-text mb-2'>{title}</h3>
			<p className='text-base text-text-muted mb-6 max-w-xs mx-auto leading-relaxed'>
				{description}
			</p>

			{/* FOMO Stats */}
			{fomoStats && fomoStats.length > 0 && (
				<div className='inline-block bg-bg rounded-xl py-4 px-5 mb-6'>
					<span className='block text-xs text-text-muted mb-3'>
						People you might like are sharing:
					</span>
					<div className='flex gap-6 justify-center'>
						{fomoStats.map((stat, index) => (
							<div key={index} className='flex flex-col items-center'>
								<span className='text-xl font-extrabold text-primary'>
									{stat.value}
								</span>
								<span className='text-xs text-text-muted'>{stat.label}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Search Suggestions */}
			{searchSuggestions && searchSuggestions.length > 0 && (
				<div className='mb-5'>
					<span className='block text-xs text-text-muted mb-2.5'>
						Did you mean:
					</span>
					<div className='flex gap-2 justify-center flex-wrap'>
						{searchSuggestions.map((suggestion, index) => (
							<button
								key={index}
								onClick={() => onSuggestionClick?.(suggestion)}
								className='py-2 px-4 bg-bg border border-border rounded-full text-sm text-text hover:bg-primary hover:border-primary hover:text-white transition-colors'
							>
								{suggestion}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Primary Action */}
			{primaryAction && (
				<motion.div className='mb-4'>
					{primaryAction.href ? (
						<Link
							href={primaryAction.href}
							className={cn(
								'inline-flex items-center gap-2 py-3.5 px-7 rounded-xl',
								'bg-primary text-white text-base font-bold',
								'hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30 transition-all',
							)}
						>
							{primaryAction.icon}
							{primaryAction.label}
						</Link>
					) : (
						<button
							onClick={primaryAction.onClick}
							className={cn(
								'inline-flex items-center gap-2 py-3.5 px-7 rounded-xl',
								'bg-primary text-white text-base font-bold',
								'hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30 transition-all',
								isPositive && 'animate-pulse',
							)}
						>
							{primaryAction.icon}
							{primaryAction.label}
						</button>
					)}
				</motion.div>
			)}

			{/* Secondary Actions */}
			{secondaryActions && secondaryActions.length > 0 && (
				<div className='flex gap-3 justify-center mt-4'>
					{secondaryActions.map((action, index) =>
						action.href ? (
							<Link
								key={index}
								href={action.href}
								className='inline-flex items-center gap-2 py-3 px-5 bg-bg border border-border rounded-xl text-sm font-semibold text-text hover:bg-border transition-colors'
							>
								{action.icon}
								{action.label}
							</Link>
						) : (
							<button
								key={index}
								onClick={action.onClick}
								className='inline-flex items-center gap-2 py-3 px-5 bg-bg border border-border rounded-xl text-sm font-semibold text-text hover:bg-border transition-colors'
							>
								{action.icon}
								{action.label}
							</button>
						),
					)}
				</div>
			)}

			{/* Quick Actions */}
			{quickActions && quickActions.length > 0 && (
				<div className='flex items-center justify-center gap-2.5 mt-5 flex-wrap'>
					<span className='text-xs text-text-muted'>Quick start:</span>
					{quickActions.map((action, index) => {
						const className =
							'py-2 px-3.5 bg-bg border border-border rounded-full text-sm text-text hover:border-primary transition-colors'
						const content = (
							<>
								{action.emoji && <span className='mr-1'>{action.emoji}</span>}
								{action.label}
							</>
						)

						if (action.href) {
							return (
								<Link key={index} href={action.href} className={className}>
									{content}
								</Link>
							)
						}

						return (
							<button
								key={index}
								onClick={action.onClick}
								className={className}
							>
								{content}
							</button>
						)
					})}
				</div>
			)}

			{/* Custom Children */}
			{children}
		</motion.div>
	)
}

// ============================================================================
// PRESET EMPTY STATES
// ============================================================================

export function EmptyFeed({
	onDiscoverChefs,
	className,
}: {
	onDiscoverChefs?: () => void
	className?: string
}) {
	return (
		<EmptyState
			variant='feed'
			title='Your feed is hungry!'
			description='Follow chefs to fill it with delicious inspiration'
			fomoStats={[
				{ value: '847', label: 'recipes today' },
				{ value: '12.4k', label: 'XP earned' },
			]}
			primaryAction={{
				label: 'Discover Chefs',
				onClick: onDiscoverChefs,
				icon: <Compass className='size-icon-sm' />,
			}}
			quickActions={[
				{ label: 'Italian', emoji: '🇮🇹', href: '/explore?category=italian' },
				{ label: 'Asian', emoji: '🥢', href: '/explore?category=asian' },
				{ label: 'Quick Meals', emoji: '⏱️', href: '/explore?category=quick' },
			]}
			className={className}
		/>
	)
}

export function EmptyCookingHistory({
	onStartCooking,
	beginnerRecipe,
	className,
}: {
	onStartCooking?: () => void
	beginnerRecipe?: {
		title: string
		time: string
		xp: number
		href: string
		imageUrl: string
	}
	className?: string
}) {
	return (
		<EmptyState
			variant='cooking'
			title='Time to cook something!'
			description='Your cooking journey starts with a single dish'
			primaryAction={{
				label: 'Start Your First Cook',
				onClick: onStartCooking,
				icon: <ChefHat className='size-icon-sm' />,
			}}
			className={className}
		>
			{/* XP Teaser */}
			<div className='flex flex-col gap-2.5 p-4 bg-bg rounded-xl mb-6 max-w-xs mx-auto text-left'>
				<div className='flex items-center gap-2.5 text-sm text-text'>
					<span className='text-lg'>⚡</span>
					Earn <strong>30+ XP</strong> on your first cook
				</div>
				<div className='flex items-center gap-2.5 text-sm text-text'>
					<span className='text-lg'>🎖️</span>
					Unlock the <strong>First Dish</strong> badge
				</div>
				<div className='flex items-center gap-2.5 text-sm text-text'>
					<span className='text-lg'>🔥</span>
					Start your <strong>cooking streak</strong>
				</div>
			</div>

			{/* Beginner Pick */}
			{beginnerRecipe && (
				<div className='pt-6 border-t border-border'>
					<span className='block text-xs text-text-muted mb-3'>
						Great for beginners:
					</span>
					<Link
						href={beginnerRecipe.href}
						className='inline-flex items-center gap-3 py-2.5 px-4 pr-5 bg-bg border border-border rounded-xl hover:border-primary transition-all'
					>
						<Image
							src={beginnerRecipe.imageUrl}
							alt={beginnerRecipe.title}
							width={48}
							height={48}
							className='size-12 rounded-lg object-cover'
						/>
						<div className='text-left'>
							<span className='block text-sm font-semibold text-text'>
								{beginnerRecipe.title}
							</span>
							<span className='text-xs text-text-muted'>
								{beginnerRecipe.time} • +{beginnerRecipe.xp} XP
							</span>
						</div>
					</Link>
				</div>
			)}
		</EmptyState>
	)
}

export function EmptySaved({
	onBrowseRecipes,
	className,
}: {
	onBrowseRecipes?: () => void
	className?: string
}) {
	return (
		<EmptyState
			variant='saved'
			title='No saved recipes yet'
			description='Bookmark recipes you want to cook later'
			primaryAction={{
				label: 'Browse Recipes',
				onClick: onBrowseRecipes,
				icon: <BookOpen className='size-icon-sm' />,
			}}
			className={className}
		>
			{/* How To */}
			<div className='flex items-center justify-center gap-2.5 mb-6 flex-wrap'>
				{[
					'Find a recipe you like',
					'Tap the bookmark icon',
					'Cook when ready!',
				].map((step, index) => (
					<div key={index} className='flex items-center gap-2'>
						<div className='flex items-center gap-2 py-2 px-3.5 bg-bg rounded-lg'>
							<span className='size-icon-md flex items-center justify-center bg-primary text-white rounded-full text-xs font-bold'>
								{index + 1}
							</span>
							<span className='text-sm text-text'>{step}</span>
						</div>
						{index < 2 && (
							<span className='text-text-muted hidden sm:block'>→</span>
						)}
					</div>
				))}
			</div>
		</EmptyState>
	)
}

export function EmptyNotifications({ className }: { className?: string }) {
	return (
		<EmptyState
			variant='notifications'
			title='No notifications yet'
			description="When someone interacts with your content, you'll see it here"
			className={className}
		>
			<div className='flex gap-2 justify-center flex-wrap mt-2'>
				{['❤️ Likes', '💬 Comments', '👤 Follows', '🏆 Achievements'].map(
					type => (
						<span
							key={type}
							className='py-1.5 px-3 bg-bg rounded-full text-xs text-text-muted'
						>
							{type}
						</span>
					),
				)}
			</div>
		</EmptyState>
	)
}

export function AllCaughtUp({
	onCookNow,
	className,
}: {
	onCookNow?: () => void
	className?: string
}) {
	return (
		<EmptyState
			variant='pending'
			title='All caught up! 🎉'
			description="No pending posts. You've claimed all your XP!"
			isPositive
			className={className}
		>
			{/* Next Goal */}
			<div className='mt-5 max-w-xs mx-auto text-left'>
				<span className='block text-xs text-text-muted mb-2.5'>Next goal:</span>
				<div className='flex items-center gap-3 p-3.5 bg-bg border border-border rounded-xl'>
					<span className='text-icon-lg'>🍳</span>
					<div className='flex-1'>
						<span className='block text-sm font-semibold text-text'>
							Cook something new
						</span>
						<span className='text-xs text-text-muted'>
							Earn more XP to level up!
						</span>
					</div>
					<button
						onClick={onCookNow}
						className='size-10 flex items-center justify-center bg-primary rounded-lg text-white hover:scale-105 transition-transform'
					>
						<ChefHat className='size-5' />
					</button>
				</div>
			</div>
		</EmptyState>
	)
}

export default EmptyState
