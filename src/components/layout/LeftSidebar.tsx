'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
	Home,
	Compass,
	Target,
	PlusSquare,
	Users,
	MessageCircle,
	Settings,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { TRANSITION_SPRING } from '@/lib/motion'

const navItems = [
	{ href: '/dashboard', icon: Home, label: 'Home' },
	{ href: '/explore', icon: Compass, label: 'Explore' },
	{ href: '/challenges', icon: Target, label: 'Challenges' },
	{ href: '/community', icon: Users, label: 'Community' },
	{ href: '/create', icon: PlusSquare, label: 'Create' },
	{ href: '/settings', icon: Settings, label: 'Settings' },
	{ href: '/messages', icon: MessageCircle, label: 'Messages' },
]

export const LeftSidebar = () => {
	const pathname = usePathname()
	const { user } = useAuth()

	const isActive = (href: string) => {
		if (href === '/dashboard') return pathname === href || pathname === '/'
		return pathname.startsWith(href)
	}

	return (
		<nav
			className='hidden border-r border-border-subtle bg-bg-card px-3 py-6 md:flex md:w-nav md:flex-col md:items-center md:gap-4'
			aria-label='Main navigation'
		>
			{navItems.map(item => {
				const active = isActive(item.href)
				const Icon = item.icon
				return (
					<Link
						key={item.href}
						href={item.href}
						className='group relative flex h-11 w-full flex-col items-center justify-center gap-1 rounded-radius px-1.5 text-xs font-semibold uppercase leading-tight tracking-[0.6px] text-text-secondary transition-colors duration-300 hover:text-text-primary data-[active=true]:text-primary'
						data-active={active}
						title={item.label}
					>
						{/* Active indicator bar */}
						<motion.div
							className='absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-[3px] bg-gradient-primary'
							initial={false}
							animate={{
								height: active ? '70%' : '0%',
							}}
							transition={TRANSITION_SPRING}
						/>{' '}
						{/* Background glow on active */}
						<motion.div
							className='absolute inset-0 rounded-radius bg-gradient-to-r from-primary/10 to-transparent opacity-0'
							initial={false}
							animate={{
								opacity: active ? 1 : 0,
							}}
							transition={{
								duration: 0.3,
							}}
						/>
						{/* Icon with hover animation */}
						<motion.div
							whileHover={{
								scale: 1.15,
								rotate: 5,
							}}
							whileTap={{
								scale: 0.95,
							}}
							transition={TRANSITION_SPRING}
							className='relative'
						>
							<Icon className='h-6 w-6 transition-all duration-300 group-data-[active=true]:drop-shadow-glow' />
						</motion.div>
						<div>{item.label}</div>
					</Link>
				)
			})}
		</nav>
	)
}
