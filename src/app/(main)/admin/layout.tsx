'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield, FileWarning, Ban, Scale, BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const adminNavItems = [
	{ href: '/admin/reports', label: 'Reports', icon: FileWarning },
	{ href: '/admin/bans', label: 'Bans', icon: Ban },
	{ href: '/admin/appeals', label: 'Appeals', icon: Scale },
	{ href: '/admin/verification', label: 'Verification', icon: BadgeCheck },
]

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { user } = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const [authorized, setAuthorized] = useState(false)

	useEffect(() => {
		if (!user) return
		if (user.accountType !== 'admin') {
			router.replace('/dashboard')
			return
		}
		setAuthorized(true)
	}, [user, router])

	if (!authorized) {
		return (
			<div className='flex h-full items-center justify-center'>
				<div className='text-center'>
					<Shield className='mx-auto size-12 text-text-muted' />
					<p className='mt-4 text-sm text-text-muted'>Checking access...</p>
				</div>
			</div>
		)
	}

	return (
		<div className='mx-auto w-full max-w-6xl px-4 py-6'>
			{/* Admin header */}
			<div className='mb-6 flex items-center gap-3'>
				<div className='grid size-10 place-items-center rounded-xl bg-destructive/10'>
					<Shield className='size-5 text-destructive' />
				</div>
				<div>
					<h1 className='text-xl font-bold text-text'>Moderation Dashboard</h1>
					<p className='text-sm text-text-muted'>
						Review reports, manage bans, and handle appeals
					</p>
				</div>
			</div>

			{/* Admin sub-navigation */}
			<nav className='mb-6 flex gap-1 rounded-xl border border-border-subtle bg-bg-elevated p-1'>
				{adminNavItems.map(item => {
					const isActive = pathname.startsWith(item.href)
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
								isActive
									? 'bg-bg-card text-text shadow-card'
									: 'text-text-muted hover:text-text',
							)}
						>
							<item.icon className='size-4' />
							{item.label}
						</Link>
					)
				})}
			</nav>

			{/* Page content */}
			{children}
		</div>
	)
}
