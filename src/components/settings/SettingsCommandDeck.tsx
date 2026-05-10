import { motion } from 'framer-motion'
import {
	BadgeCheck,
	Bell,
	ChefHat,
	Crown,
	Palette,
	Settings,
	Shield,
	User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type SettingsTabId =
	| 'account'
	| 'privacy'
	| 'notifications'
	| 'cooking'
	| 'appearance'
	| 'referral'
	| 'premium'
	| 'verification'

interface SettingsDeckTab {
	id: SettingsTabId
	label: string
	description: string
	icon: React.ComponentType<{ className?: string }>
}

interface SettingsCommandDeckProps {
	tabs: SettingsDeckTab[]
	activeTab: SettingsTabId
	onTabChange: (tab: SettingsTabId) => void
	onSignOut: () => void
	isSigningOut: boolean
	counts: {
		tabs: number
		hasDisplayName: boolean
		notificationsEnabled: boolean
		verificationReady: boolean
	}
	className?: string
}

function StatCard({
	label,
	value,
	icon: Icon,
	tone,
}: {
	label: string
	value: string
	icon: React.ComponentType<{ className?: string }>
	tone: 'brand' | 'xp' | 'social' | 'muted'
}) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		xp: 'border-xp/20 bg-xp/8 text-xp',
		social: 'border-error/20 bg-error/8 text-error',
		muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	}[tone]

	return (
		<div className='rounded-xl border border-border-subtle bg-bg-card p-3 shadow-card'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-lg font-black tabular-nums text-text-primary'>
						{value}
					</p>
				</div>
				<div className={cn('rounded-md border p-1.5', toneClass)}>
					<Icon className='size-3.5' />
				</div>
			</div>
		</div>
	)
}

export function SettingsCommandDeck({
	tabs,
	activeTab,
	onTabChange,
	onSignOut,
	isSigningOut,
	counts,
	className,
}: SettingsCommandDeckProps) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-4 shadow-card md:p-5',
				className,
			)}
		>
			<div className='mb-4 flex items-center justify-between gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						Settings Command
					</p>
					<h2 className='mt-1 text-lg font-black text-text-primary'>
						Shape Your Control Surface
					</h2>
				</div>
				<div className='inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand'>
					<Settings className='size-3.5' />
					Live preferences
				</div>
			</div>

			<div className='mb-4 grid grid-cols-2 gap-2 xl:grid-cols-4'>
				<StatCard
					label='Sections'
					value={counts.tabs.toString()}
					icon={Settings}
					tone='muted'
				/>
				<StatCard
					label='Profile'
					value={counts.hasDisplayName ? 'Ready' : 'Thin'}
					icon={User}
					tone={counts.hasDisplayName ? 'brand' : 'muted'}
				/>
				<StatCard
					label='Alerts'
					value={counts.notificationsEnabled ? 'On' : 'Off'}
					icon={Bell}
					tone={counts.notificationsEnabled ? 'social' : 'muted'}
				/>
				<StatCard
					label='Verification'
					value={counts.verificationReady ? 'Active' : 'Pending'}
					icon={BadgeCheck}
					tone={counts.verificationReady ? 'xp' : 'muted'}
				/>
			</div>

			<div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
				{tabs.map(tab => {
					const Icon = tab.icon
					const isActive = tab.id === activeTab
					return (
						<button
							type='button'
							key={tab.id}
							onClick={() => onTabChange(tab.id)}
							className={cn(
								'flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all',
								isActive
									? 'border-brand/25 bg-brand/10 text-brand shadow-card'
									: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
							)}
						>
							<Icon className='mt-0.5 size-4 shrink-0' />
							<div>
								<p className='text-sm font-semibold'>{tab.label}</p>
								<p
									className={cn(
										'mt-1 text-xs leading-relaxed',
										isActive ? 'text-brand/80' : 'text-text-muted',
									)}
								>
									{tab.description}
								</p>
							</div>
						</button>
					)
				})}
			</div>

			<div className='mt-4 flex justify-end'>
				<button
					type='button'
					onClick={onSignOut}
					disabled={isSigningOut}
					className='inline-flex min-h-10 items-center justify-center rounded-xl border border-error/20 bg-error/8 px-4 py-2 text-sm font-semibold text-error transition-all hover:bg-error/12 disabled:opacity-50'
				>
					{isSigningOut ? 'Signing out...' : 'Sign out'}
				</button>
			</div>
		</motion.section>
	)
}

export const settingsDeckIcons = {
	account: User,
	privacy: Shield,
	notifications: Bell,
	cooking: ChefHat,
	appearance: Palette,
	referral: Crown,
	premium: Crown,
	verification: BadgeCheck,
} satisfies Record<SettingsTabId, React.ComponentType<{ className?: string }>>
