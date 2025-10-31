'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	Home,
	Compass,
	Award,
	PlusSquare,
	Users,
	User,
	Settings,
	Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
	{ href: '/dashboard', icon: Home, label: 'Home' },
	{ href: '/discover', icon: Search, label: 'Discover' },
	{ href: '/explore', icon: Compass, label: 'Explore' },
	{ href: '/challenges', icon: Award, label: 'Challenges' },
	{ href: '/create', icon: PlusSquare, label: 'Create' },
	{ href: '/community', icon: Users, label: 'Community' },
	// Note: Profile link is dynamic based on username
	{ href: '/settings', icon: Settings, label: 'Settings' },
]

export const LeftSidebar = () => {
	const pathname = usePathname()
	const { user } = useAuth()

	return (
		<div className='hidden border-r bg-muted/40 md:block'>
			<div className='flex h-full max-h-screen flex-col gap-2'>
				<div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
					<Link
						href='/dashboard'
						className='flex items-center gap-2 font-semibold'
					>
						<span className=''>Chefkix</span>
					</Link>
				</div>
				<div className='flex-1'>
					<nav className='grid items-start px-2 text-sm font-medium lg:px-4'>
						{navItems.map(item => (
							<Link
								key={item.label}
								href={item.href}
								className={cn(
									'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
									{ 'bg-muted text-primary': pathname === item.href },
								)}
							>
								<item.icon className='h-4 w-4' />
								{item.label}
							</Link>
						))}
						{/* Dynamic Profile Link */}
						{user && (
							<Link
								href={`/${user.username}`}
								className={cn(
									'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
									{ 'bg-muted text-primary': pathname === `/${user.username}` },
								)}
							>
								<User className='h-4 w-4' />
								Profile
							</Link>
						)}
					</nav>
				</div>
			</div>
		</div>
	)
}
