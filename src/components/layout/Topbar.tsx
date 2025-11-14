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
import { useUiStore } from '@/store/uiStore'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout as logoutService } from '@/services/auth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export const Topbar = () => {
	const { user, logout } = useAuth()
	const { toggleMessagesDrawer, toggleNotificationsPopup } = useUiStore()
	const [searchQuery, setSearchQuery] = useState('')
	const [mode, setMode] = useState<'player' | 'creator'>('player')
	const [showUserMenu, setShowUserMenu] = useState(false)
	const router = useRouter()

	const handleLogout = async () => {
		try {
			// Call backend logout to invalidate session/cookies
			await logoutService()
		} catch (error) {
			console.error('Logout error:', error)
			// Continue with local logout even if backend call fails
		} finally {
			// Always clear local state and redirect
			logout()
			router.push(PATHS.AUTH.SIGN_IN)
		}
	}

	// Calculate XP progress if we have user statistics - with null safety
	const xpProgress =
		user?.statistics?.currentXP != null && user?.statistics?.currentXPGoal
			? (user.statistics.currentXP / user.statistics.currentXPGoal) * 100
			: 0

	return (
		<header
			className='relative flex h-18 w-full flex-shrink-0 items-center justify-center gap-2 border-b border-border-subtle bg-bg-card px-4 md:gap-4 md:px-6'
			role='banner'
		>
			{/* Logo - Absolutely positioned to stay left while content centers */}
			<Link
				href='/dashboard'
				className='absolute left-4 flex items-center gap-2 md:left-6'
			>
				<div className='font-display text-2xl font-extrabold leading-none tracking-tight text-primary md:text-2xl'>
					Chefkix
				</div>
			</Link>
			{/* Search Bar - constrained max width for better proportions */}
			<div className='group relative flex min-w-search max-w-2xl flex-1 items-center gap-3 rounded-full border-2 border-border-medium bg-bg-input px-3 py-2 shadow-sm transition-all duration-300 focus-within:border-primary focus-within:shadow-lg focus-within:scale-[1.02] md:px-4 md:py-2.5'>
				<Search className='h-5 w-5 shrink-0 text-text-secondary transition-all duration-300 group-focus-within:scale-110 group-focus-within:rotate-12 group-focus-within:text-primary' />
				<input
					type='text'
					placeholder='Search...'
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className='w-full min-w-0 border-0 bg-transparent text-sm text-text-primary caret-primary outline-none ring-0 placeholder:text-text-muted focus:border-0 focus:ring-0 md:text-base'
				/>
			</div>
			{/* Mode Toggle - Hidden on mobile and small tablets */}
			<div className='hidden items-center gap-1 rounded-lg border border-border-subtle bg-bg p-1 lg:flex'>
				<button
					onClick={() => setMode('player')}
					className={`flex h-11 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ${
						mode === 'player'
							? 'bg-primary text-primary-foreground shadow-md'
							: 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
					}`}
				>
					<Gamepad2 className='h-4 w-4' />
					<span className='hidden xl:inline'>Player</span>
				</button>
				<button
					onClick={() => setMode('creator')}
					className={`flex h-11 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ${
						mode === 'creator'
							? 'bg-primary text-primary-foreground shadow-md'
							: 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
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
					<div className='relative hidden overflow-hidden rounded-lg bg-gradient-gold px-3 py-1.5 text-sm font-bold text-text-primary shadow-md lg:block'>
						Lv. {user.statistics?.currentLevel ?? 1}
						<div className='absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent' />
					</div>

					{/* Avatar with Dropdown */}
					<div className='relative'>
						<button
							onClick={() => setShowUserMenu(!showUserMenu)}
							className='group relative cursor-pointer transition-all duration-300 hover:translate-y-[-3px] hover:scale-105'
						>
							<Avatar size='lg' className='shadow-lg hover:shadow-glow'>
								<AvatarImage
									src={user.avatarUrl || 'https://i.pravatar.cc/44'}
									alt={user.displayName || 'User'}
								/>
								<AvatarFallback>
									{user.displayName
										?.split(' ')
										.map(n => n[0])
										.join('')
										.toUpperCase()
										.slice(0, 2) || 'U'}
								</AvatarFallback>
							</Avatar>
							<div className='absolute inset-[-3px] -z-10 animate-avatar-glow rounded-full bg-gradient-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
						</button>

						{/* Dropdown Menu */}
						{showUserMenu && (
							<div className='absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-lg'>
								<Link
									href={user.userId ? `/${user.userId}` : PATHS.DASHBOARD}
									onClick={() => setShowUserMenu(false)}
									className='flex h-11 items-center gap-3 rounded-t-lg px-4 text-sm text-text-primary transition-colors hover:bg-bg-hover'
								>
									<User className='h-4 w-4' />
									<span>Profile</span>
								</Link>
								<Link
									href={PATHS.SETTINGS}
									onClick={() => setShowUserMenu(false)}
									className='flex h-11 items-center gap-3 px-4 text-sm text-text-primary transition-colors hover:bg-bg-hover'
								>
									<Settings className='h-4 w-4' />
									<span>Settings</span>
								</Link>
								<button
									onClick={handleLogout}
									className='flex h-11 w-full items-center gap-3 rounded-b-lg px-4 text-left text-sm text-destructive transition-colors hover:bg-destructive/10'
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
					className='relative h-11 w-11 cursor-pointer text-text-secondary transition-colors hover:text-primary'
					aria-label='Notifications'
				>
					<Bell className='mx-auto h-5 w-5' />
					<span className='absolute -right-2 -top-1.5 rounded-full bg-accent-strong px-1.5 py-0.5 text-xs font-bold text-accent-foreground'>
						3
					</span>
				</button>
				<button
					onClick={toggleMessagesDrawer}
					className='relative h-11 w-11 cursor-pointer text-text-secondary transition-colors hover:text-primary'
					aria-label='Messages'
				>
					<MessageSquare className='mx-auto h-5 w-5' />
					<span className='absolute -right-2 -top-1.5 rounded-full bg-accent-strong px-1.5 py-0.5 text-xs font-bold text-accent-foreground'>
						2
					</span>
				</button>
			</div>
		</header>
	)
}
