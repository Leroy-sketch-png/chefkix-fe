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
import { TRANSITION_SPRING } from '@/lib/motion'

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
	label: string
	icon: React.ReactNode
	description?: string
}

// =============================================================================
// NAV ITEMS CONFIG
// =============================================================================

const navItems: NavItem[] = [
	{
		id: 'profile',
		label: 'Edit Profile',
		icon: <User className='h-5 w-5' />,
		description: 'Update your personal information',
	},
	{
		id: 'notifications',
		label: 'Notifications',
		icon: <Bell className='h-5 w-5' />,
		description: 'Manage notification preferences',
	},
	{
		id: 'privacy',
		label: 'Privacy',
		icon: <Shield className='h-5 w-5' />,
		description: 'Control who sees your content',
	},
	{
		id: 'account',
		label: 'Account',
		icon: <KeyRound className='h-5 w-5' />,
		description: 'Password and security settings',
	},
	{
		id: 'billing',
		label: 'Billing',
		icon: <CreditCard className='h-5 w-5' />,
		description: 'Manage subscription and payments',
	},
	{
		id: 'appearance',
		label: 'Appearance',
		icon: <Palette className='h-5 w-5' />,
		description: 'Theme and display preferences',
	},
	{
		id: 'help',
		label: 'Help & Support',
		icon: <HelpCircle className='h-5 w-5' />,
		description: 'FAQs and contact support',
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
	return (
		<motion.button
			className={cn(
				'flex items-center gap-3 w-full p-3 rounded-xl text-left',
				'transition-colors duration-200',
				isActive
					? 'bg-primary/10 text-primary'
					: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
			)}
			onClick={onClick}
			whileHover={{ x: isActive ? 0 : 4 }}
			whileTap={{ scale: 0.98 }}
			transition={TRANSITION_SPRING}
		>
			<span
				className={cn(
					'flex-shrink-0',
					isActive ? 'text-primary' : 'text-muted-foreground',
				)}
			>
				{item.icon}
			</span>
			<span className='font-medium'>{item.label}</span>
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
					className={cn(
						'flex items-center gap-3 w-full p-3 rounded-xl text-left',
						'text-error hover:bg-error/10 transition-colors duration-200',
					)}
					onClick={onLogout}
					whileHover={{ x: 4 }}
					whileTap={{ scale: 0.98 }}
					transition={TRANSITION_SPRING}
				>
					<LogOut className='h-5 w-5 flex-shrink-0' />
					<span className='font-medium'>Log Out</span>
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
	return (
		<div
			className={cn(
				'flex gap-1 overflow-x-auto pb-2 scrollbar-hide',
				className,
			)}
		>
			{navItems.map(item => (
				<motion.button
					key={item.id}
					className={cn(
						'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap',
						'text-sm font-medium transition-colors duration-200',
						activeSection === item.id
							? 'bg-primary text-primary-foreground'
							: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
					)}
					onClick={() => onSectionChange(item.id)}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					{item.icon}
					<span className='hidden sm:inline'>{item.label}</span>
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
	const item = navItems.find(i => i.id === section)
	if (!item) return null

	return (
		<div className='mb-6'>
			<h2 className='text-2xl font-bold text-foreground flex items-center gap-3'>
				{item.icon}
				{item.label}
			</h2>
			{item.description && (
				<p className='text-muted-foreground mt-1'>{item.description}</p>
			)}
		</div>
	)
}

export default SettingsNav
