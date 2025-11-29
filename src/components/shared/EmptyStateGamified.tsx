'use client'

import { motion } from 'framer-motion'
import {
	Search,
	Compass,
	BookOpen,
	ChefHat,
	Bell,
	Check,
	Target,
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
	href: string
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
		<div className='relative inline-block'>
			<span className='text-[64px] block'>🍽️</span>
			{/* Steam */}
			{[0, 1, 2].map(i => (
				<motion.div
					key={i}
					className='absolute w-2 rounded bg-gradient-to-t from-transparent to-muted'
					style={{
						left: `${20 + i * 30}%`,
						top: -20,
						height: 20,
					}}
					animate={{
						y: [0, -15],
						scaleY: [1, 1.5],
						opacity: [0.4, 0.1],
					}}
					transition={{
						duration: 2,
						delay: i * 0.3,
						repeat: Infinity,
					}}
				/>
			))}
		</div>
	)
}

function ChefWaitingIllustration() {
	return (
		<div className='flex items-center justify-center gap-2'>
			<span className='text-[64px]'>👨‍🍳</span>
			<div className='flex'>
				{[0, 1, 2].map(i => (
					<motion.span
						key={i}
						className='text-[32px] text-muted'
						animate={{ opacity: [0.3, 1, 0.3] }}
						transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
					>
						.
					</motion.span>
				))}
			</div>
		</div>
	)
}

function SearchIllustration() {
	return (
		<div className='relative inline-block'>
			<Search className='w-14 h-14 text-muted' />
			<motion.span
				className='absolute -top-2 -right-2 text-2xl text-primary'
				animate={{ y: [0, -5, 0] }}
				transition={{ duration: 1, repeat: Infinity }}
			>
				?
			</motion.span>
		</div>
	)
}

function BookmarkIllustration() {
	return (
		<div className='relative w-[100px] h-[80px] mx-auto'>
			{[0, 1, 2].map(i => (
				<div
					key={i}
					className={cn(
						'absolute w-[60px] h-[50px] bg-bg border-2 border-border rounded-lg flex items-center justify-center',
						i === 0 && 'left-0 top-2.5 -rotate-[10deg] opacity-50',
						i === 1 && 'left-5 top-1.5 -rotate-3 opacity-70',
						i === 2 && 'left-10 top-0 rotate-[5deg]',
					)}
				>
					{i === 2 && <BookOpen className='w-6 h-6 text-muted' />}
				</div>
			))}
		</div>
	)
}

function TargetIllustration() {
	return (
		<div className='relative inline-block'>
			<span className='text-[64px] block relative z-10'>🎯</span>
			<motion.div
				className='absolute -inset-5 border-[3px] border-primary rounded-full opacity-30'
				animate={{
					scale: [0.8, 1.5],
					opacity: [0.5, 0],
				}}
				transition={{ duration: 2, repeat: Infinity }}
			/>
		</div>
	)
}

function CheckmarkIllustration() {
	return (
		<motion.div
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={TRANSITION_SPRING}
			className='w-[72px] h-[72px] flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30'
		>
			<Check className='w-9 h-9 text-white' />
		</motion.div>
	)
}

function BellIllustration() {
	return (
		<div className='relative inline-block'>
			<Bell className='w-14 h-14 text-muted' />
			<motion.span
				className='absolute -top-2.5 -right-5 text-base text-muted italic'
				animate={{ y: [0, -5], opacity: [0.5, 1] }}
				transition={{ duration: 2, repeat: Infinity }}
			>
				z z z
			</motion.span>
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
		(emoji ? <span className='text-[64px]'>{emoji}</span> : defaultIllustration)

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'text-center py-12 px-6 bg-panel-bg rounded-[20px] border border-border my-6',
				isPositive &&
					'bg-gradient-to-b from-emerald-500/5 to-teal-500/2 border-emerald-500/20',
				className,
			)}
		>
			{/* Illustration */}
			{displayIllustration && <div className='mb-6'>{displayIllustration}</div>}

			{/* Title & Description */}
			<h3 className='text-[22px] font-extrabold text-text mb-2'>{title}</h3>
			<p className='text-[15px] text-muted mb-6 max-w-[320px] mx-auto leading-relaxed'>
				{description}
			</p>

			{/* FOMO Stats */}
			{fomoStats && fomoStats.length > 0 && (
				<div className='inline-block bg-bg rounded-xl py-4 px-5 mb-6'>
					<span className='block text-xs text-muted mb-3'>
						People you might like are sharing:
					</span>
					<div className='flex gap-6 justify-center'>
						{fomoStats.map((stat, index) => (
							<div key={index} className='flex flex-col items-center'>
								<span className='text-[22px] font-extrabold text-primary'>
									{stat.value}
								</span>
								<span className='text-[11px] text-muted'>{stat.label}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Search Suggestions */}
			{searchSuggestions && searchSuggestions.length > 0 && (
				<div className='mb-5'>
					<span className='block text-xs text-muted mb-2.5'>Did you mean:</span>
					<div className='flex gap-2 justify-center flex-wrap'>
						{searchSuggestions.map((suggestion, index) => (
							<button
								key={index}
								onClick={() => onSuggestionClick?.(suggestion)}
								className='py-2 px-4 bg-bg border border-border rounded-full text-[13px] text-text hover:bg-primary hover:border-primary hover:text-white transition-colors'
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
								'bg-primary text-white text-[15px] font-bold',
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
								'bg-primary text-white text-[15px] font-bold',
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
					<span className='text-xs text-muted'>Quick start:</span>
					{quickActions.map((action, index) => (
						<Link
							key={index}
							href={action.href}
							className='py-2 px-3.5 bg-bg border border-border rounded-full text-[13px] text-text hover:border-primary transition-colors'
						>
							{action.emoji && <span className='mr-1'>{action.emoji}</span>}
							{action.label}
						</Link>
					))}
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
				icon: <Compass className='w-[18px] h-[18px]' />,
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
				icon: <ChefHat className='w-[18px] h-[18px]' />,
			}}
			className={className}
		>
			{/* XP Teaser */}
			<div className='flex flex-col gap-2.5 p-4 bg-bg rounded-xl mb-6 max-w-[300px] mx-auto text-left'>
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
					<span className='block text-xs text-muted mb-3'>
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
							className='w-12 h-12 rounded-lg object-cover'
						/>
						<div className='text-left'>
							<span className='block text-sm font-semibold text-text'>
								{beginnerRecipe.title}
							</span>
							<span className='text-xs text-muted'>
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
				icon: <BookOpen className='w-[18px] h-[18px]' />,
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
							<span className='w-[22px] h-[22px] flex items-center justify-center bg-primary text-white rounded-full text-xs font-bold'>
								{index + 1}
							</span>
							<span className='text-[13px] text-text'>{step}</span>
						</div>
						{index < 2 && <span className='text-muted hidden sm:block'>→</span>}
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
							className='py-1.5 px-3 bg-bg rounded-full text-xs text-muted'
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
			<div className='mt-5 max-w-[320px] mx-auto text-left'>
				<span className='block text-xs text-muted mb-2.5'>Next goal:</span>
				<div className='flex items-center gap-3 p-3.5 bg-bg border border-border rounded-xl'>
					<span className='text-[28px]'>🍳</span>
					<div className='flex-1'>
						<span className='block text-sm font-semibold text-text'>
							Cook something new
						</span>
						<span className='text-xs text-muted'>
							Earn more XP to level up!
						</span>
					</div>
					<button
						onClick={onCookNow}
						className='w-10 h-10 flex items-center justify-center bg-primary rounded-lg text-white hover:scale-105 transition-transform'
					>
						<ChefHat className='w-5 h-5' />
					</button>
				</div>
			</div>
		</EmptyState>
	)
}

export default EmptyState
