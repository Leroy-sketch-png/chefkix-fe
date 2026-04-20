'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { signIn } from '@/services/auth'
import { getMyProfile } from '@/services/profile'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { logDevError } from '@/lib/dev-log'

const DEMO_ACCOUNTS = [
	{
		label: 'Test User',
		sub: 'Primary tester',
		username: 'testuser',
		emoji: '🧪',
	},
	{
		label: 'Chef Minh',
		sub: 'Vietnamese pro',
		username: 'chef_minh',
		emoji: '🇻🇳',
	},
	{
		label: 'Sakura Kitchen',
		sub: 'Japanese chef',
		username: 'sakura_kitchen',
		emoji: '🇯🇵',
	},
	{
		label: 'Spice Queen',
		sub: 'Indian cuisine',
		username: 'spice_queen',
		emoji: '🌶️',
	},
	{
		label: 'Pasta Paolo',
		sub: 'Italian master',
		username: 'pasta_paolo',
		emoji: '🇮🇹',
	},
	{
		label: 'Weekend Cook',
		sub: 'Casual cook',
		username: 'weekend_cook',
		emoji: '🍳',
	},
	{
		label: 'Student Eats',
		sub: 'Budget meals',
		username: 'student_eats',
		emoji: '🎓',
	},
	{
		label: 'Fitness Fuel',
		sub: 'High protein',
		username: 'fitness_fuel',
		emoji: '💪',
	},
	{
		label: 'Vegan Vibes',
		sub: 'Plant-based',
		username: 'vegan_vibes',
		emoji: '🌱',
	},
	{
		label: 'Korean Mama',
		sub: 'Korean home',
		username: 'korean_mama',
		emoji: '🇰🇷',
	},
	{
		label: 'BBQ Master',
		sub: 'Texas BBQ',
		username: 'bbq_master',
		emoji: '🔥',
	},
] as const

/**
 * Development-only quick login widget. Only renders when NODE_ENV === 'development'.
 * Provides 1-click login with any demo account for fast iteration.
 */
export function DevQuickLogin() {
	const [expanded, setExpanded] = useState(false)
	const [loadingUser, setLoadingUser] = useState<string | null>(null)
	const { login, setUser, setLoading } = useAuth()
	const router = useRouter()

	if (process.env.NODE_ENV !== 'development') return null

	async function quickLogin(username: string) {
		if (loadingUser) return
		setLoadingUser(username)

		try {
			const response = await signIn({
				emailOrUsername: username,
				password: 'test123',
			})

			if (!response.success || !response.data?.accessToken) {
				toast.error(
					`Login failed for ${username}. Run provision-keycloak-users.ps1 first.`,
				)
				setLoadingUser(null)
				return
			}

			login(response.data.accessToken)

			const profileResponse = await getMyProfile()
			if (profileResponse.success && profileResponse.data) {
				setUser(profileResponse.data)
				toast.success(`Logged in as ${username}`)
				router.push('/dashboard')
			} else {
				toast.error(`Profile fetch failed. Run: seed.bat`)
				setLoadingUser(null)
			}
		} catch (err) {
			logDevError('Dev login error:', err)
			toast.error(`Login error. Is backend running?`)
			setLoadingUser(null)
		}
	}

	return (
		<div className='fixed bottom-4 right-4 z-50 hidden md:block'>
			<motion.div
				layout
				className='overflow-hidden rounded-xl border border-brand/30 bg-bg-card shadow-warm'
				style={{ width: expanded ? 240 : 'auto' }}
			>
				{/* Toggle Header */}
				<button
					type='button'
					onClick={() => setExpanded(!expanded)}
					className='flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/5'
				>
					<Zap className='size-4' />
					<span>Quick Login</span>
					{expanded ? (
						<ChevronDown className='ml-auto size-4' />
					) : (
						<ChevronUp className='ml-auto size-4' />
					)}
				</button>

				{/* Account List */}
				<AnimatePresence>
					{expanded && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.2 }}
							className='max-h-80 overflow-y-auto border-t border-border-subtle'
						>
							{DEMO_ACCOUNTS.map(account => (
								<button
									key={account.username}
									onClick={() => quickLogin(account.username)}
									disabled={loadingUser !== null}
									className='flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-brand/5 disabled:opacity-50'
								>
									<span className='text-base'>{account.emoji}</span>
									<div className='min-w-0 flex-1'>
										<div className='truncate text-sm font-medium text-text'>
											{account.label}
										</div>
										<div className='truncate text-xs text-text-muted'>
											{account.sub}
										</div>
									</div>
									{loadingUser === account.username && (
										<div className='size-4 animate-spin rounded-full border-2 border-brand border-t-transparent' />
									)}
								</button>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	)
}
