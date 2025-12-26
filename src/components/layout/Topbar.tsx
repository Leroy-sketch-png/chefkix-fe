'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PATHS } from '@/constants'
import {
	Bell,
	MessageCircle,
	Search,
	LogOut,
	Settings,
	ChefHat,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logout as logoutService } from '@/services/auth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getNotifications } from '@/services/notification'
import { getMyConversations } from '@/services/chat'
import { CookingIndicator } from '@/components/cooking/CookingIndicator'
import { TRANSITION_SPRING } from '@/lib/motion'

export const Topbar = () => {
	const { user } = useAuth()
	const { toggleMessagesDrawer, toggleNotificationsPopup } = useUiStore()
	const [searchQuery, setSearchQuery] = useState('')
	const [showUserMenu, setShowUserMenu] = useState(false)
	const [unreadNotifications, setUnreadNotifications] = useState(0)
	const [unreadMessages, setUnreadMessages] = useState(0)
	const router = useRouter()
	const { logout } = useAuth()

	// Fetch unread counts on mount and periodically
	useEffect(() => {
		const fetchCounts = async () => {
			try {
				const [notifResponse, convResponse] = await Promise.all([
					getNotifications({ size: 1 }), // Just need unreadCount
					getMyConversations(),
				])

				if (notifResponse.success && notifResponse.data) {
					setUnreadNotifications(notifResponse.data.unreadCount)
				}

				if (convResponse.success && convResponse.data) {
					// Sum up unread counts from all conversations
					const totalUnread = convResponse.data.reduce(
						(sum, conv) => sum + (conv.unreadCount || 0),
						0,
					)
					setUnreadMessages(totalUnread)
				}
			} catch (err) {
				console.error('Failed to fetch unread counts:', err)
			}
		}

		fetchCounts()
		// Refresh every 30 seconds
		const interval = setInterval(fetchCounts, 30000)
		return () => clearInterval(interval)
	}, [])

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
			{/* Animated Logo */}
			<Link
				href='/dashboard'
				className='absolute left-4 flex items-center gap-2 md:left-6'
			>
				<motion.div
					className='flex items-center gap-2.5'
					whileHover={{ scale: 1.03 }}
					transition={TRANSITION_SPRING}
				>
					<motion.div
						className='flex size-9 items-center justify-center rounded-xl bg-gradient-hero shadow-md shadow-brand/25'
						whileHover={{ rotate: 10 }}
						transition={TRANSITION_SPRING}
					>
						<ChefHat className='size-5 text-white' />
					</motion.div>
					<div className='font-display text-2xl font-extrabold leading-none tracking-tight'>
						<span className='bg-gradient-to-r from-brand to-brand/80 bg-clip-text text-transparent'>
							Chef
						</span>
						<span className='text-text'>kix</span>
					</div>
				</motion.div>
			</Link>
			{/* Search Bar - constrained max width, with left margin to avoid overlapping the absolute logo */}
			<div className='group relative ml-20 flex min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-full border-2 border-border-medium bg-bg-input px-3 py-2 shadow-sm transition-all duration-300 focus-within:border-primary focus-within:shadow-lg focus-within:scale-[1.02] md:ml-24 md:px-4 md:py-2.5'>
				<Search className='h-5 w-5 shrink-0 text-text-secondary transition-all duration-300 group-focus-within:scale-110 group-focus-within:rotate-12 group-focus-within:text-primary' />
				<input
					type='text'
					placeholder='Search...'
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className='w-full min-w-0 border-0 bg-transparent text-sm text-text-primary caret-primary outline-none ring-0 placeholder:text-text-muted focus:border-0 focus:ring-0 md:text-base'
				/>
			</div>

			{/* 
				Mode Toggle REMOVED (Steve Jobs Audit 2024-12-20)
				
				The player/creator toggle was purely cosmetic - local state that 
				affected nothing. "A switch that switches nothing is a lie."
				
				If ChefKix needs player vs creator modes in the future, implement
				it properly with different dashboard views and stored preference.
			*/}

			{/* Cooking Indicator - Shows when actively cooking */}
			<CookingIndicator />

			{/* User Profile - Hidden on mobile, shows level badge only on larger screens */}
			{user && (
				<div className='hidden items-center gap-2 md:flex lg:gap-3'>
					{/* Level Badge with XP - only show on larger screens */}
					<motion.div
						whileHover={{ scale: 1.05 }}
						className='relative hidden overflow-hidden rounded-xl bg-gradient-gold px-4 py-2 text-sm font-bold text-amber-950 shadow-md lg:flex lg:items-center lg:gap-2'
					>
						<span className='relative z-10'>
							Lv. {user.statistics?.currentLevel || 1}
						</span>
						{/* XP Progress bar inside */}
						<div className='relative z-10 hidden h-1.5 w-16 overflow-hidden rounded-full bg-amber-950/20 xl:block'>
							<motion.div
								className='h-full rounded-full bg-amber-950/40'
								initial={{ width: 0 }}
								animate={{ width: `${xpProgress}%` }}
								transition={{ duration: 1, ease: 'easeOut' }}
							/>
						</div>
						<div className='pointer-events-none absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent' />
					</motion.div>

					{/* Avatar with XP Ring */}
					<div className='relative'>
						<motion.button
							onClick={() => setShowUserMenu(!showUserMenu)}
							whileHover={{ scale: 1.05, y: -2 }}
							whileTap={{ scale: 0.98 }}
							transition={TRANSITION_SPRING}
							className='group relative cursor-pointer'
						>
							{/* XP Progress Ring */}
							<svg className='absolute -inset-1 size-14' viewBox='0 0 56 56'>
								<circle
									cx='28'
									cy='28'
									r='26'
									fill='none'
									stroke='currentColor'
									strokeWidth='3'
									className='text-border-subtle'
								/>
								<motion.circle
									cx='28'
									cy='28'
									r='26'
									fill='none'
									stroke='url(#xpGradient)'
									strokeWidth='3'
									strokeLinecap='round'
									strokeDasharray={`${2 * Math.PI * 26}`}
									initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
									animate={{
										strokeDashoffset: 2 * Math.PI * 26 * (1 - xpProgress / 100),
									}}
									transition={{ duration: 1.5, ease: 'easeOut' }}
									style={{
										transform: 'rotate(-90deg)',
										transformOrigin: 'center',
									}}
								/>
								<defs>
									<linearGradient
										id='xpGradient'
										x1='0%'
										y1='0%'
										x2='100%'
										y2='100%'
									>
										<stop offset='0%' stopColor='#8b5cf6' />
										<stop offset='100%' stopColor='#a855f7' />
									</linearGradient>
								</defs>
							</svg>
							<Avatar size='lg' className='shadow-lg'>
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
						</motion.button>

						{/* Dropdown Menu - Profile is in LeftSidebar, not duplicated here (Twitter model) */}
						{showUserMenu && (
							<div className='absolute right-0 top-full z-dropdown mt-2 w-48 overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-lg'>
								<Link
									href={PATHS.SETTINGS}
									onClick={() => setShowUserMenu(false)}
									className='flex h-11 items-center gap-3 rounded-t-lg px-4 text-sm text-text-primary transition-colors hover:bg-bg-hover'
								>
									<Settings className='size-4' />
									<span>Settings</span>
								</Link>
								<button
									onClick={handleLogout}
									className='flex h-11 w-full items-center gap-3 rounded-b-lg px-4 text-left text-sm text-destructive transition-colors hover:bg-destructive/10'
								>
									<LogOut className='size-4' />
									<span>Sign Out</span>
								</button>
							</div>
						)}
					</div>
				</div>
			)}
			{/* Communication Icons */}
			<div className='flex gap-2 md:gap-3'>
				<motion.button
					onClick={toggleNotificationsPopup}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
					className='relative grid size-11 cursor-pointer place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-elevated hover:text-brand'
					aria-label='Notifications'
				>
					<Bell className='size-5' />
					{unreadNotifications > 0 && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={TRANSITION_SPRING}
							className='absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-xs font-bold text-white shadow-sm'
						>
							{unreadNotifications > 99 ? '99+' : unreadNotifications}
						</motion.span>
					)}
				</motion.button>
				<motion.button
					onClick={toggleMessagesDrawer}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
					className='relative grid size-11 cursor-pointer place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-elevated hover:text-xp'
					aria-label='Messages'
				>
					<MessageCircle className='size-5' />
					{unreadMessages > 0 && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={TRANSITION_SPRING}
							className='absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-xp px-1.5 py-0.5 text-xs font-bold text-white shadow-sm'
						>
							{unreadMessages > 99 ? '99+' : unreadMessages}
						</motion.span>
					)}
				</motion.button>
			</div>
		</header>
	)
}
