'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { signIn } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { logDevError } from '@/lib/dev-log'
import { finalizeAuthSession } from '@/lib/auth-session'

function responseStatusLabel(statusCode: number): string {
	return statusCode > 0 ? `HTTP ${statusCode}` : 'no HTTP response'
}

function signInFailureMessage(statusCode: number): string {
	if (statusCode === 0) {
		return 'The sign-in service returned no HTTP response. Check the configured API URL and local backend availability.'
	}
	if (statusCode === 401) {
		return 'The sign-in service rejected this attempt (HTTP 401). Check the existing demo credential and active identity-provider configuration; this does not establish that the account is absent.'
	}
	if (statusCode === 429) {
		return 'The sign-in service is rate-limiting attempts (HTTP 429). Wait before trying again.'
	}
	if (statusCode >= 500) {
		return `The sign-in service returned ${responseStatusLabel(statusCode)}. Check the local auth service and identity-provider health.`
	}
	return `The sign-in service returned ${responseStatusLabel(statusCode)}. Check the local auth route and response contract.`
}

function profileFailureMessage(statusCode: number): string {
	if (statusCode === 0) {
		return 'Sign-in responded, but profile validation received no HTTP response. Check the API URL and /api/v1/auth/me route; no browser session was committed.'
	}
	if (statusCode === 401 || statusCode === 403) {
		return `Sign-in responded, but profile validation returned HTTP ${statusCode}. Check token, realm, client, and API alignment; no browser session was committed.`
	}
	if (statusCode === 404) {
		return 'Sign-in responded, but profile lookup returned HTTP 404. Check the /api/v1/auth/me route and profile service; no browser session was committed.'
	}
	return `Sign-in responded, but profile validation returned ${responseStatusLabel(statusCode)}. Check the profile service; no browser session was committed.`
}

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
 * Development/test-only quick login widget. The sign-in page adds a separate
 * build-time flag, so demo-account access is never enabled implicitly.
 */
export function DevQuickLogin() {
	const [expanded, setExpanded] = useState(false)
	const [loadingUser, setLoadingUser] = useState<string | null>(null)
	const loginInFlight = useRef(false)
	const { login, setUser } = useAuth()
	const router = useRouter()

	if (
		process.env.NODE_ENV !== 'development' &&
		process.env.NODE_ENV !== 'test'
	) {
		return null
	}

	async function quickLogin(username: string) {
		if (loginInFlight.current) return
		loginInFlight.current = true
		setLoadingUser(username)
		let phase: 'sign-in' | 'profile-validation' | 'navigation' = 'sign-in'
		let navigationStarted = false

		try {
			const response = await signIn({
				emailOrUsername: username,
				password: 'test123',
			})

			if (!response.success) {
				toast.error(signInFailureMessage(response.statusCode ?? 0))
				return
			}
			if (!response.data?.accessToken) {
				toast.error(
					'Sign-in returned no access token. Check the auth response contract; no profile request or browser session was started.',
				)
				return
			}

			phase = 'profile-validation'
			const profileResponse = await finalizeAuthSession(
				response.data.accessToken,
				{
					login,
					setUser,
				},
			)
			if (profileResponse.success && profileResponse.data) {
				phase = 'navigation'
				toast.success('Demo sign-in complete')
				router.push('/dashboard')
				navigationStarted = true
			} else {
				toast.error(profileFailureMessage(profileResponse.statusCode ?? 0))
			}
		} catch {
			logDevError(`Dev quick login failed during ${phase}; details omitted`)
			if (phase === 'profile-validation') {
				toast.error(
					'Profile validation did not complete. Check the API URL and /api/v1/auth/me route; browser auth state was not committed.',
				)
			} else if (phase === 'navigation') {
				toast.error(
					'Sign-in completed, but the dashboard did not open. The authenticated session may now be active; navigate to Dashboard or sign out.',
				)
			} else {
				toast.error(
					'The sign-in request did not complete. Check the local API connection and retry; no account or profile change is implied.',
				)
			}
		} finally {
			if (!navigationStarted) {
				loginInFlight.current = false
				setLoadingUser(null)
			}
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
										<div className='truncate text-sm font-medium text-text-primary'>
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
