'use client'

import { motion } from 'framer-motion'
import {
	User,
	Bell,
	Shield,
	KeyRound,
	CreditCard,
	Palette,
	HelpCircle,
	LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import {
	TRANSITION_SPRING,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
	NAV_ITEM_HOVER,
	LIST_ITEM_TAP,
} from '@/lib/motion'

// =============================================================================
// TYPES
// =============================================================================

type SettingSection =
	| 'profile'
	| 'notifications'
	| 'privacy'
	| 'account'
	| 'billing'
	| 'appearance'
	| 'help'

interface SettingsNavProps {
	activeSection: SettingSection
	onSectionChange: (section: SettingSection) => void
	onLogout?: () => void
	className?: string
}

interface NavItem {
	id: SettingSection
	labelKey: string
	icon: React.ReactNode
	descKey?: string
}

// =============================================================================
// NAV ITEMS CONFIG
// =============================================================================

const navItems: NavItem[] = [
	{
		id: 'profile',
		labelKey: 'snProfile',
		icon: <User className='size-5' />,
		descKey: 'snProfileDesc',
	},
	{
		id: 'notifications',
		labelKey: 'snNotifications',
		icon: <Bell className='size-5' />,
		descKey: 'snNotificationsDesc',
	},
	{
		id: 'privacy',
		labelKey: 'snPrivacy',
		icon: <Shield className='size-5' />,
		descKey: 'snPrivacyDesc',
	},
	{
		id: 'account',
		labelKey: 'snAccount',
		icon: <KeyRound className='size-5' />,
		descKey: 'snAccountDesc',
	},
	{
		id: 'billing',
		labelKey: 'snBilling',
		icon: <CreditCard className='size-5' />,
		descKey: 'snBillingDesc',
	},
	{
		id: 'appearance',
		labelKey: 'snAppearance',
		icon: <Palette className='size-5' />,
		descKey: 'snAppearanceDesc',
	},
	{
		id: 'help',
		labelKey: 'snHelp',
		icon: <HelpCircle className='size-5' />,
		descKey: 'snHelpDesc',
	},
]

// =============================================================================
// SETTINGS NAV ITEM
// =============================================================================

interface SettingsNavItemProps {
	item: NavItem
	isActive: boolean
	onClick: () => void
}

const SettingsNavItem = ({ item, isActive, onClick }: SettingsNavItemProps) => {
	const t = useTranslations('settings')
	return (
		<motion.button
			type='button'
			className={cn(
				'flex items-center gap-3 w-full p-3 rounded-xl text-left focus-visible:ring-2 focus-visible:ring-brand/50',
				isActive
					? 'bg-brand/10 text-brand'
					: 'text-text-secondary hover:bg-muted/50 hover:text-foreground',
			)}
			onClick={onClick}
			whileHover={{ x: isActive ? 0 : 4 }}
			whileTap={LIST_ITEM_TAP}
			transition={TRANSITION_SPRING}
		>
			<span
				className={cn(
					'flex-shrink-0',
					isActive ? 'text-brand' : 'text-text-secondary',
				)}
			>
				{item.icon}
			</span>
			<span className='font-medium'>{t(item.labelKey)}</span>
		</motion.button>
	)
}

// =============================================================================
// SETTINGS NAV (MAIN EXPORT)
// =============================================================================

export const SettingsNav = ({
	activeSection,
	onSectionChange,
	onLogout,
	className,
}: SettingsNavProps) => {
	const t = useTranslations('settings')
	return (
		<nav className={cn('flex flex-col gap-2', className)}>
			{navItems.map(item => (
				<SettingsNavItem
					key={item.id}
					item={item}
					isActive={activeSection === item.id}
					onClick={() => onSectionChange(item.id)}
				/>
			))}

			{/* Divider */}
			<div className='h-px bg-border my-2' />

			{/* Logout Button */}
			{onLogout && (
				<motion.button
					type='button'
					className={cn(
						'flex items-center gap-3 w-full p-3 rounded-xl text-left focus-visible:ring-2 focus-visible:ring-brand/50',
						'text-error hover:bg-error/10',
					)}
					onClick={onLogout}
					whileHover={NAV_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					transition={TRANSITION_SPRING}
				>
					<LogOut className='size-5 flex-shrink-0' />
					<span className='font-medium'>{t('snLogOut')}</span>
				</motion.button>
			)}
		</nav>
	)
}

// =============================================================================
// SETTINGS NAV (COMPACT - FOR MOBILE)
// =============================================================================

interface SettingsNavCompactProps {
	activeSection: SettingSection
	onSectionChange: (section: SettingSection) => void
	className?: string
}

export const SettingsNavCompact = ({
	activeSection,
	onSectionChange,
	className,
}: SettingsNavCompactProps) => {
	const t = useTranslations('settings')
	return (
		<div
			className={cn(
				'flex gap-1 overflow-x-auto pb-2 scrollbar-hide',
				className,
			)}
		>
			{navItems.map(item => (
				<motion.button
					type='button'
					key={item.id}
					className={cn(
						'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand/50',
						'text-sm font-medium',
						activeSection === item.id
							? 'bg-brand text-white'
							: 'bg-muted/50 text-text-secondary hover:bg-bg-hover hover:text-foreground',
					)}
					onClick={() => onSectionChange(item.id)}
					whileHover={BUTTON_SUBTLE_HOVER}
					whileTap={BUTTON_SUBTLE_TAP}
					transition={TRANSITION_SPRING}
				>
					{item.icon}
					<span className='hidden sm:inline'>{t(item.labelKey)}</span>
				</motion.button>
			))}
		</div>
	)
}

// =============================================================================
// SETTINGS SECTION HEADER
// =============================================================================

interface SettingsSectionHeaderProps {
	section: SettingSection
}

export const SettingsSectionHeader = ({
	section,
}: SettingsSectionHeaderProps) => {
	const t = useTranslations('settings')
	const item = navItems.find(i => i.id === section)
	if (!item) return null

	return (
		<div className='mb-6'>
			<h2 className='text-2xl font-bold text-foreground flex items-center gap-3'>
				{item.icon}
				{t(item.labelKey)}
			</h2>
			{item.descKey && (
				<p className='text-text-secondary mt-1'>{t(item.descKey)}</p>
			)}
		</div>
	)
}

export default SettingsNav
