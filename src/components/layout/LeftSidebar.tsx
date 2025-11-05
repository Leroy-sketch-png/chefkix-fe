'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
			className='hidden border-r border-border bg-panel-bg px-3 py-6 md:flex md:w-nav md:flex-col md:items-center md:gap-4'
			aria-label='Main navigation'
		>
			{navItems.map(item => {
				const active = isActive(item.href)
				const Icon = item.icon
				return (
					<Link
						key={item.href}
						href={item.href}
						className='group relative flex w-full flex-col items-center gap-1 rounded-radius px-1.5 py-3 text-xs font-semibold uppercase tracking-[0.6px] text-muted-foreground transition-all duration-300 hover:bg-bg hover:text-text data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/10 data-[active=true]:to-transparent data-[active=true]:text-primary data-[active=true]:shadow-sm'
						data-active={active}
						title={item.label}
					>
						{/* Active indicator bar */}
						<div className='absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r-[3px] bg-gradient-primary transition-all duration-300 group-data-[active=true]:h-[70%]' />

						<Icon className='h-6 w-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[5deg] group-data-[active=true]:drop-shadow-glow' />
						<div>{item.label}</div>
					</Link>
				)
			})}
		</nav>
	)
}
