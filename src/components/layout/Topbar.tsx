'use client'

import Link from 'next/link'
import { Bell, MessageSquare, Search, Gamepad2, PlusSquare } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import { useUiStore } from '@/store/uiStore'
import { useState } from 'react'

export const Topbar = () => {
	const { user } = useAuth()
	const { toggleMessagesDrawer, toggleNotificationsPopup } = useUiStore()
	const [searchQuery, setSearchQuery] = useState('')
	const [mode, setMode] = useState<'player' | 'creator'>('player')

	// Calculate XP progress if we have user statistics
	const xpProgress =
		user?.statistics?.currentXP && user?.statistics?.currentXPGoal
			? (user.statistics.currentXP / user.statistics.currentXPGoal) * 100
			: 0

	return (
		<header
			className='sticky top-0 z-sticky flex h-18 items-center gap-6 border-b border-border bg-panel-bg px-6'
			role='banner'
		>
			{/* Logo */}
			<Link href='/dashboard' className='shrink-0'>
				<div className='bg-gradient-primary bg-clip-text font-display text-[32px] font-extrabold leading-none tracking-tight text-transparent'>
					Chefkix
				</div>
			</Link>
			{/* Search Bar */}
			<div className='group relative flex flex-1 items-center gap-3 rounded-full border border-border bg-bg px-4 py-2.5 shadow-sm transition-all duration-300 focus-within:border-primary focus-within:bg-card focus-within:shadow-md max-md:max-w-[300px]'>
				<Search className='h-5 w-5 shrink-0 text-muted transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-primary' />
				<input
					type='text'
					placeholder='Search recipes, chefs...'
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className='w-full bg-transparent text-base outline-none placeholder:text-muted'
				/>
			</div>
			<div className='flex-1' />
			{/* Mode Toggle - Hidden on mobile */}
			<div className='hidden items-center gap-1 rounded-lg border border-border bg-bg p-1 md:flex'>
				<button
					onClick={() => setMode('player')}
					className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-300 ${
						mode === 'player'
							? 'bg-primary text-primary-foreground shadow-md'
							: 'text-muted hover:text-text'
					}`}
				>
					<Gamepad2 className='h-4 w-4' />
					Player
				</button>
				<button
					onClick={() => setMode('creator')}
					className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-300 ${
						mode === 'creator'
							? 'bg-primary text-primary-foreground shadow-md'
							: 'text-muted hover:text-text'
					}`}
				>
					<PlusSquare className='h-4 w-4' />
					Creator
				</button>
			</div>
			{/* User Profile - Hidden on mobile */}
			{user && (
				<div className='hidden items-center gap-3 md:flex'>
					{/* Level Badge */}
					<div className='relative overflow-hidden rounded-lg bg-gradient-gold px-3 py-1.5 text-sm font-bold text-text shadow-md'>
						Lv. {user.statistics.currentLevel} {user.statistics.title || 'Chef'}
						<div className='absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent' />
					</div>

					{/* XP Bar */}
					<div className='h-2 w-20 overflow-hidden rounded-lg bg-muted/50 shadow-sm'>
						<div
							className='relative h-full bg-gradient-success shadow-glow transition-all duration-[800ms] ease-[cubic-bezier(0.25,0.8,0.25,1)]'
							style={{ width: `${Math.min(xpProgress, 100)}%` }}
						>
							<div className='absolute inset-0 animate-xp-shimmer bg-gradient-to-r from-transparent via-card/40 to-transparent' />
						</div>
					</div>

					{/* Avatar */}
					<Link href={`/${user.userId}`}>
						<div className='group relative h-11 w-11 cursor-pointer rounded-full shadow-lg transition-all duration-300 hover:translate-y-[-3px] hover:scale-105 hover:shadow-glow'>
							<Image
								src={user.avatarUrl || 'https://i.pravatar.cc/44'}
								alt={user.displayName}
								fill
								className='rounded-full object-cover'
							/>
							<div className='absolute inset-[-3px] -z-10 animate-avatar-glow rounded-full bg-gradient-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
						</div>
					</Link>
				</div>
			)}
			{/* Communication Icons */}
			<div className='flex gap-4'>
				<button
					onClick={toggleNotificationsPopup}
					className='relative cursor-pointer text-muted transition-colors hover:text-primary'
					aria-label='Notifications'
				>
					<Bell className='h-5 w-5' />
					<span className='absolute -right-2 -top-1.5 rounded-full bg-accent-strong px-1.5 py-0.5 text-xs font-bold text-accent-foreground'>
						3
					</span>
				</button>
				<button
					onClick={toggleMessagesDrawer}
					className='relative cursor-pointer text-muted transition-colors hover:text-primary'
					aria-label='Messages'
				>
					<MessageSquare className='h-5 w-5' />
					<span className='absolute -right-2 -top-1.5 rounded-full bg-accent-strong px-1.5 py-0.5 text-xs font-bold text-accent-foreground'>
						2
					</span>
				</button>
			</div>{' '}
			<div className='flex-1' />
			{/* Mode Toggle - Hidden on mobile */}
			<div className='hidden items-center gap-1 rounded-lg border border-border bg-bg p-1 md:flex'>
				<button
					onClick={() => setMode('player')}
					className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-300 ${
						mode === 'player'
							? 'bg-primary text-primary-foreground shadow-md'
							: 'text-muted hover:text-text'
					}`}
				>
					<Gamepad2 className='h-4 w-4' />
					Player
				</button>
				<button
					onClick={() => setMode('creator')}
					className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-300 ${
						mode === 'creator'
							? 'bg-primary text-primary-foreground shadow-md'
							: 'text-muted hover:text-text'
					}`}
				>
					<PlusSquare className='h-4 w-4' />
					Creator
				</button>
			</div>{' '}
			{/* User Profile - Hidden on mobile */}
			{user && (
				<div className='hidden items-center gap-3 md:flex'>
					{/* Level Badge */}
					<div className='relative overflow-hidden rounded-lg bg-gradient-gold px-3 py-1.5 text-sm font-bold text-text shadow-md'>
						Lv. {user.statistics.currentLevel} {user.statistics.title || 'Chef'}
						<div className='absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent' />
					</div>{' '}
					{/* XP Bar */}
					<div className='h-2 w-20 overflow-hidden rounded-lg bg-muted/50 shadow-sm'>
						<div
							className='relative h-full bg-gradient-success shadow-glow transition-all duration-[800ms] ease-[cubic-bezier(0.25,0.8,0.25,1)]'
							style={{ width: `${Math.min(xpProgress, 100)}%` }}
						>
							<div className='absolute inset-0 animate-xp-shimmer bg-gradient-to-r from-transparent via-card/40 to-transparent' />
						</div>
					</div>
					{/* Avatar */}
					<Link href={`/${user.userId}`}>
						<div className='group relative h-11 w-11 cursor-pointer rounded-full shadow-lg transition-all duration-300 hover:translate-y-[-3px] hover:scale-105 hover:shadow-glow'>
							<Image
								src={user.avatarUrl || 'https://i.pravatar.cc/44'}
								alt={user.displayName}
								fill
								className='rounded-full object-cover'
							/>
							<div className='absolute inset-[-3px] -z-10 animate-avatar-glow rounded-full bg-gradient-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
						</div>
					</Link>
				</div>
			)}
			{/* Communication Icons */}
			<div className='flex gap-4'>
				<button
					onClick={toggleNotificationsPopup}
					className='relative cursor-pointer text-muted transition-colors hover:text-primary'
					aria-label='Notifications'
				>
					<Bell className='h-5 w-5' />
					<span className='absolute -right-2 -top-1.5 rounded-full bg-accent-strong px-1.5 py-0.5 text-xs font-bold text-accent-foreground'>
						3
					</span>
				</button>
				<button
					onClick={toggleMessagesDrawer}
					className='relative cursor-pointer text-muted transition-colors hover:text-primary'
					aria-label='Messages'
				>
					<MessageSquare className='h-5 w-5' />
					<span className='absolute -right-2 -top-1.5 rounded-full bg-accent-strong px-1.5 py-0.5 text-xs font-bold text-accent-foreground'>
						2
					</span>
				</button>
			</div>
		</header>
	)
}
