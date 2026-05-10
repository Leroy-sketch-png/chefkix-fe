import Link from 'next/link'
import { motion } from 'framer-motion'
import {
	BadgeCheck,
	Bell,
	ChefHat,
	Crown,
	Palette,
	Shield,
	User,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { SettingsTabId } from '@/components/settings/SettingsCommandDeck'

interface SettingsContextRailProps {
	activeTab: SettingsTabId
	activeLabel: string
	activeDescription: string
	counts: {
		profileStrength: string
		privacyMode: string
		alertsMode: string
	}
	className?: string
}

const tabIcons = {
	account: User,
	privacy: Shield,
	notifications: Bell,
	cooking: ChefHat,
	appearance: Palette,
	referral: Crown,
	premium: Crown,
	verification: BadgeCheck,
} satisfies Record<SettingsTabId, React.ComponentType<{ className?: string }>>

function MetricRow({ label, value }: { label: string; value: string }) {
	return (
		<div className='flex items-center justify-between border-b border-border-subtle py-2 last:border-0'>
			<span className='text-xs font-medium text-text-secondary'>{label}</span>
			<span className='text-sm font-black text-text-primary'>{value}</span>
		</div>
	)
}

export function SettingsContextRail({
	activeTab,
	activeLabel,
	activeDescription,
	counts,
	className,
}: SettingsContextRailProps) {
	const t = useTranslations('settings')
	const ActiveIcon = tabIcons[activeTab]

	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24',
				className,
			)}
		>
			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					{t('railCurrentSection')}
				</p>
				<div className='mt-3 flex items-start gap-3'>
					<div className='rounded-xl border border-brand/20 bg-brand/8 p-2 text-brand'>
						<ActiveIcon className='size-4' />
					</div>
					<div>
						<h3 className='text-base font-black text-text-primary'>
							{activeLabel}
						</h3>
						<p className='mt-1 text-xs leading-relaxed text-text-secondary'>
							{activeDescription}
						</p>
					</div>
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					{t('railProfileHealth')}
				</p>
				<div className='mt-3'>
					<MetricRow
						label={t('railMetricProfile')}
						value={counts.profileStrength}
					/>
					<MetricRow
						label={t('railMetricPrivacy')}
						value={counts.privacyMode}
					/>
					<MetricRow label={t('railMetricAlerts')} value={counts.alertsMode} />
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					{t('railQuickMoves')}
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/profile'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<User className='size-3.5' />
						{t('railOpenProfile')}
					</Link>
					<Link
						href='/notifications'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Bell className='size-3.5' />
						{t('railReviewNotifications')}
					</Link>
					<Link
						href='/cooking'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<ChefHat className='size-3.5' />
						{t('railOpenCooking')}
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
