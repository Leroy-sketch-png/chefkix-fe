'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Compass, Plus, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
	href: string
	icon: React.ComponentType<{ className?: string }>
	label: string
	badge?: boolean
}

const navItems: NavItem[] = [
	{
		href: '/dashboard',
		icon: Home,
		label: 'Home',
	},
	{
		href: '/discover',
		icon: Compass,
		label: 'Explore',
	},
	{
		href: '/create',
		icon: Plus,
		label: 'Create',
	},
	{
		href: '/notifications',
		icon: Bell,
		label: 'Activity',
		badge: true,
	},
	{
		href: '/profile',
		icon: User,
		label: 'Profile',
	},
]

export const MobileBottomNav = () => {
	const pathname = usePathname()

	const isActive = (href: string) => {
		if (href === '/dashboard') return pathname === '/dashboard'
		return pathname?.startsWith(href)
	}

	return (
		<nav className='fixed bottom-0 left-0 right-0 z-sticky hidden h-[72px] items-center justify-around border-t border-border bg-card/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden'>
			{navItems.map((item, index) => {
				const Icon = item.icon
				const active = isActive(item.href)

				// Special handling for the Create button (center elevated button)
				if (item.href === '/create') {
					return (
						<Link
							key={item.href}
							href={item.href}
							className='relative -mt-6 flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius)] transition-all active:bg-muted max-w-[80px]'
						>
							<div className='grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-[0_8px_24px_rgba(102,126,234,0.4)] transition-all active:scale-90'>
								<Icon className='h-7 w-7' />
							</div>
						</Link>
					)
				}

				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							'flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius)] px-3 py-2 transition-all active:bg-muted max-w-[80px]',
							active ? 'text-primary' : 'text-muted-foreground',
						)}
					>
						<div className='relative'>
							<Icon
								className={cn(
									'h-6 w-6 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
									active && 'scale-110',
								)}
							/>
							{item.badge && (
								<span className='absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full border-2 border-card bg-destructive' />
							)}
						</div>
						<span className='text-[11px] font-semibold'>{item.label}</span>
					</Link>
				)
			})}
		</nav>
	)
}

// ============================================================================
// Mobile Tab Bar Component (for category switching within pages)
// ============================================================================

interface TabItem {
	id: string
	icon: React.ComponentType<{ className?: string }>
	label: string
}

interface MobileTabBarProps {
	tabs: TabItem[]
	activeTab: string
	onTabChange: (tabId: string) => void
	className?: string
}

export const MobileTabBar = ({
	tabs,
	activeTab,
	onTabChange,
	className,
}: MobileTabBarProps) => {
	return (
		<div
			className={cn(
				'sticky top-[60px] z-[calc(var(--z-sticky)-1)] hidden flex-nowrap gap-2 overflow-x-auto border-b border-border bg-card/95 p-2 backdrop-blur-xl scrollbar-hide md:hidden',
				className,
			)}
		>
			{tabs.map(tab => {
				const Icon = tab.icon
				return (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={cn(
							'flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-95',
							activeTab === tab.id
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:bg-muted',
						)}
					>
						<Icon className='h-[18px] w-[18px]' />
						<span>{tab.label}</span>
					</button>
				)
			})}
		</div>
	)
}
