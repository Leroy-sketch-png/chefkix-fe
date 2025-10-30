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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
	{ href: '/dashboard', icon: Home, label: 'Home' },
	{ href: '/discover', icon: Compass, label: 'Explore' },
	{ href: '/challenges', icon: Award, label: 'Challenges' },
	{ href: '/create', icon: PlusSquare, label: 'Create' },
	{ href: '/community', icon: Users, label: 'Community' },
	{ href: '/profile', icon: User, label: 'Profile' },
	{ href: '/settings', icon: Settings, label: 'Settings' },
]

export const LeftSidebar = () => {
	const pathname = usePathname()

	return (
		<div className='hidden border-r bg-muted/40 md:block'>
			<div className='flex h-full max-h-screen flex-col gap-2'>
				<div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
					<Link href='/' className='flex items-center gap-2 font-semibold'>
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
					</nav>
				</div>
			</div>
		</div>
	)
}
