'use client'

import Link from 'next/link'
import { PATHS } from '@/constants'
import {
	Bell,
	MessageSquare,
	Search,
	Gamepad2,
	PlusSquare,
	LogOut,
	User,
	Settings,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import { useUiStore } from '@/store/uiStore'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export const Topbar = () => {
	const { user, logout } = useAuth()
	const { toggleMessagesDrawer, toggleNotificationsPopup } = useUiStore()
	const [searchQuery, setSearchQuery] = useState('')
	const [mode, setMode] = useState<'player' | 'creator'>('player')
	const [showUserMenu, setShowUserMenu] = useState(false)
	const router = useRouter()

	const handleLogout = () => {
		logout()
		router.push(PATHS.AUTH.SIGN_IN)
	}

	// Calculate XP progress if we have user statistics - with null safety
	const xpProgress =
		user?.statistics?.currentXP != null && user?.statistics?.currentXPGoal
			? (user.statistics.currentXP / user.statistics.currentXPGoal) * 100
			: 0

	return (
		<header
			className='sticky top-0 z-sticky flex h-18 w-full items-center gap-2 border-b border-border bg-panel-bg px-4 md:gap-4 md:px-6'
			role='banner'
		>
			{/* Logo */}
			{/* Brand / Logo */}
			<Link href='/dashboard' className='flex items-center gap-2'>
				<div className='font-display text-2xl font-extrabold leading-none tracking-tight text-primary md:text-[32px]'>
					Chefkix
				</div>
			</Link>{' '}
			{/* Search Bar - flexible, min width to prevent collapse */}
			<div className='group relative flex min-w-[120px] flex-1 items-center gap-3 rounded-full border border-border bg-bg px-3 py-2 shadow-sm transition-all duration-300 focus-within:border-primary focus-within:bg-card focus-within:shadow-md md:px-4 md:py-2.5'>
				<Search className='h-5 w-5 shrink-0 text-muted-foreground transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-primary' />
				<input
					type='text'
					placeholder='Search...'
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className='w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground md:text-base'
				/>
			</div>
			{/* Mode Toggle - Hidden on mobile and small tablets */}
			<div className='hidden items-center gap-1 rounded-lg border border-border bg-bg p-1 lg:flex'>
				<button
					onClick={() => setMode('player')}
					className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-300 ${
						mode === 'player'
							? 'bg-primary text-primary-foreground shadow-md'
							: 'text-muted-foreground hover:text-text'
					}`}
				>
					<Gamepad2 className='h-4 w-4' />
					<span className='hidden xl:inline'>Player</span>
				</button>
				<button
					onClick={() => setMode('creator')}
					className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-300 ${
						mode === 'creator'
							? 'bg-primary text-primary-foreground shadow-md'
							: 'text-muted-foreground hover:text-text'
					}`}
				>
					<PlusSquare className='h-4 w-4' />
					<span className='hidden xl:inline'>Creator</span>
				</button>
			</div>
			{/* User Profile - Hidden on mobile, shows level badge only on larger screens */}
			{user && (
				<div className='hidden items-center gap-2 md:flex lg:gap-3'>
					{/* Level Badge - only show on larger screens */}
					<div className='relative hidden overflow-hidden rounded-lg bg-gradient-gold px-3 py-1.5 text-sm font-bold text-text shadow-md lg:block'>
						Lv. {user.statistics?.currentLevel ?? 1}
						<div className='absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent' />
					</div>

					{/* Avatar with Dropdown */}
					<div className='relative'>
						<button
							onClick={() => setShowUserMenu(!showUserMenu)}
							className='group relative h-9 w-9 cursor-pointer rounded-full shadow-lg transition-all duration-300 hover:translate-y-[-3px] hover:scale-105 hover:shadow-glow md:h-11 md:w-11'
						>
							<Image
								src={user.avatarUrl || 'https://i.pravatar.cc/44'}
								alt={user.displayName || 'User'}
								fill
								className='rounded-full object-cover'
							/>
							<div className='absolute inset-[-3px] -z-10 animate-avatar-glow rounded-full bg-gradient-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
						</button>

						{/* Dropdown Menu */}
						{showUserMenu && (
							<div className='absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg'>
								<Link
									href={user.userId ? `/${user.userId}` : PATHS.DASHBOARD}
									onClick={() => setShowUserMenu(false)}
									className='flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted'
								>
									<User className='h-4 w-4' />
									<span>Profile</span>
								</Link>
								<Link
									href={PATHS.SETTINGS}
									onClick={() => setShowUserMenu(false)}
									className='flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted'
								>
									<Settings className='h-4 w-4' />
									<span>Settings</span>
								</Link>
								<button
									onClick={handleLogout}
									className='flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-destructive transition-colors hover:bg-destructive/10'
								>
									<LogOut className='h-4 w-4' />
									<span>Sign Out</span>
								</button>
							</div>
						)}
					</div>
				</div>
			)}
			{/* Communication Icons */}
			<div className='flex gap-3 md:gap-4'>
				<button
					onClick={toggleNotificationsPopup}
					className='relative cursor-pointer text-muted-foreground transition-colors hover:text-primary'
					aria-label='Notifications'
				>
					<Bell className='h-5 w-5' />
					<span className='absolute -right-2 -top-1.5 rounded-full bg-accent-strong px-1.5 py-0.5 text-xs font-bold text-accent-foreground'>
						3
					</span>
				</button>
				<button
					onClick={toggleMessagesDrawer}
					className='relative cursor-pointer text-muted-foreground transition-colors hover:text-primary'
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
