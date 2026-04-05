'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield, FileWarning, Ban, Scale, BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

const adminNavItems = [
	{ href: '/admin/reports', labelKey: 'navReports', icon: FileWarning },
	{ href: '/admin/bans', labelKey: 'navBans', icon: Ban },
	{ href: '/admin/appeals', labelKey: 'navAppeals', icon: Scale },
	{ href: '/admin/verification', labelKey: 'navVerification', icon: BadgeCheck },
]

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { user } = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const t = useTranslations('admin')
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
					<p className='mt-4 text-sm text-text-muted'>{t('checkingAccess')}</p>
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
					<h1 className='text-xl font-bold text-text'>{t('dashboardTitle')}</h1>
					<p className='text-sm text-text-muted'>
						{t('dashboardSubtitle')}
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
							{t(item.labelKey)}
						</Link>
					)
				})}
			</nav>

			{/* Page content */}
			{children}
		</div>
	)
}
