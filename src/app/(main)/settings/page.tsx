'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	User,
	Shield,
	Bell,
	ChefHat,
	Palette,
	Settings,
	Save,
	Check,
	AlertTriangle,
	Loader2,
	LogOut,
	Globe,
	EyeOff,
	Users,
	MessageSquare,
	Trophy,
	Mail,
	Smartphone,
	Volume2,
	Timer,
	Sparkles,
	Moon,
	Sun,
	Monitor,
	Clock,
	Eye,
	ImagePlus,
	Camera,
	BadgeCheck,
	Crown,
	Gift,
} from 'lucide-react'
import Image from 'next/image'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { PATHS } from '@/constants'
import { logout as logoutService } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logDevError } from '@/lib/dev-log'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	staggerContainer,
} from '@/lib/motion'
import ReferralCard from '@/components/referral/ReferralCard'
import PremiumUpgradeCard from '@/components/premium/PremiumUpgradeCard'
import {
	getAllSettings,
	updatePrivacySettings,
	updateNotificationSettings,
	updateCookingPreferences,
	updateAppPreferences,
} from '@/services/settings'
import { updateProfile } from '@/services/profile'
import { uploadRecipeImages } from '@/services/recipe'
import {
	applyForVerification,
	getVerificationStatus,
	type VerificationStatus,
} from '@/services/verification'
import { playTimerChime } from '@/hooks/useTimerNotifications'
import {
	requestNotificationPermission,
	isNotificationSupported,
	getNotificationPermission,
	setTimerAlertsEnabled,
} from '@/lib/pushNotifications'
import {
	UserSettings,
	PrivacySettings,
	NotificationSettings,
	CookingPreferences,
	AppPreferences,
	DEFAULT_USER_SETTINGS,
	ProfileVisibility,
	AllowMessagesFrom,
	SkillLevel,
	MeasurementUnits,
	Theme,
} from '@/lib/types/settings'

// ============================================
// TYPES
// ============================================

type SettingsTab =
	| 'account'
	| 'privacy'
	| 'notifications'
	| 'cooking'
	| 'appearance'
	| 'referral'
	| 'premium'
	| 'verification'

interface TabConfig {
	id: SettingsTab
	label: string
	icon: typeof User
	description: string
}

// ============================================
// CONSTANTS
// ============================================

const TABS: TabConfig[] = [
	{
		id: 'account',
		label: 'Account',
		icon: User,
		description: 'Profile and account info',
	},
	{
		id: 'privacy',
		label: 'Privacy',
		icon: Shield,
		description: 'Control who sees your content',
	},
	{
		id: 'notifications',
		label: 'Notifications',
		icon: Bell,
		description: 'Email, in-app, and push alerts',
	},
	{
		id: 'cooking',
		label: 'Cooking',
		icon: ChefHat,
		description: 'Dietary and cooking preferences',
	},
	{
		id: 'appearance',
		label: 'Appearance',
		icon: Palette,
		description: 'Theme, sounds, and accessibility',
	},
	{
		id: 'premium',
		label: 'Premium',
		icon: Crown,
		description: 'Upgrade to ChefKix Premium',
	},
	{
		id: 'referral',
		label: 'Referral',
		icon: Gift,
		description: 'Invite friends and earn XP',
	},
	{
		id: 'verification',
		label: 'Verification',
		icon: BadgeCheck,
		description: 'Get the verified creator badge',
	},
]

const VISIBILITY_OPTIONS: {
	value: ProfileVisibility
	label: string
	icon: typeof Globe
}[] = [
	{ value: 'public', label: 'Public', icon: Globe },
	{ value: 'friends_only', label: 'Friends Only', icon: Users },
	{ value: 'private', label: 'Private', icon: EyeOff },
]

const MESSAGE_OPTIONS: { value: AllowMessagesFrom; label: string }[] = [
	{ value: 'everyone', label: 'Everyone' },
	{ value: 'friends', label: 'Friends only' },
	{ value: 'nobody', label: 'Nobody' },
]

const SKILL_LEVELS: { value: SkillLevel; label: string; emoji: string }[] = [
	{ value: 'beginner', label: 'Beginner', emoji: '🥄' },
	{ value: 'intermediate', label: 'Intermediate', emoji: '🍳' },
	{ value: 'advanced', label: 'Advanced', emoji: '👨‍🍳' },
	{ value: 'expert', label: 'Expert', emoji: '⭐' },
]

const DIETARY_OPTIONS = [
	'vegetarian',
	'vegan',
	'gluten-free',
	'dairy-free',
	'keto',
	'paleo',
	'halal',
	'kosher',
]

const ALLERGY_OPTIONS = [
	'nuts',
	'peanuts',
	'dairy',
	'eggs',
	'shellfish',
	'fish',
	'soy',
	'wheat',
	'sesame',
]

const CUISINE_OPTIONS = [
	'Italian',
	'Japanese',
	'Mexican',
	'Chinese',
	'Indian',
	'Thai',
	'Vietnamese',
	'French',
	'Korean',
	'Mediterranean',
	'American',
	'Middle Eastern',
]

const THEME_OPTIONS: {
	value: Theme
	label: string
	icon: typeof Sun
	disabled?: boolean
}[] = [
	{ value: 'light', label: 'Light', icon: Sun },
	{ value: 'dark', label: 'Dark', icon: Moon, disabled: true },
	{ value: 'system', label: 'System', icon: Monitor, disabled: true },
]

// ============================================
// ANIMATION VARIANTS
// ============================================

const tabContentVariants = {
	hidden: { opacity: 0, x: 20 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
	},
	exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
}

const cardVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
	},
}

// ============================================
// COMPONENTS
// ============================================

const SettingsCard = ({
	title,
	description,
	children,
	className,
}: {
	title: string
	description?: string
	children: React.ReactNode
	className?: string
}) => (
	<motion.div
		variants={cardVariants}
		className={cn(
			'rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card md:p-6',
			className,
		)}
	>
		<div className='mb-4'>
			<h3 className='text-lg font-semibold text-text'>{title}</h3>
			{description && (
				<p className='mt-1 text-sm text-text-secondary'>{description}</p>
			)}
		</div>
		{children}
	</motion.div>
)

const ToggleRow = ({
	label,
	description,
	checked,
	onCheckedChange,
	icon: Icon,
	disabled,
}: {
	label: string
	description?: string
	checked: boolean
	onCheckedChange: (checked: boolean) => void
	icon?: typeof Bell
	disabled?: boolean
}) => (
	<div
		className={cn(
			'flex items-center justify-between py-3 border-b border-border-subtle last:border-0',
			disabled && 'opacity-50',
		)}
	>
		<div className='flex items-center gap-3'>
			{Icon && <Icon className='size-4 text-text-secondary' />}
			<div>
				<p className='text-sm font-medium text-text'>{label}</p>
				{description && (
					<p className='text-xs text-text-secondary'>{description}</p>
				)}
			</div>
		</div>
		<Switch
			checked={checked}
			onCheckedChange={onCheckedChange}
			disabled={disabled}
		/>
	</div>
)

const ChipSelect = ({
	options,
	selected,
	onToggle,
	className,
}: {
	options: string[]
	selected: string[]
	onToggle: (option: string) => void
	className?: string
}) => (
	<div className={cn('flex flex-wrap gap-2', className)}>
		{options.map(option => {
			const isSelected = selected.includes(option)
			return (
				<motion.button
					key={option}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={() => onToggle(option)}
					className={cn(
						'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
						isSelected
							? 'bg-primary text-white shadow-card'
							: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover',
					)}
				>
					{isSelected && <Check className='mr-1 inline size-3' />}
					{option}
				</motion.button>
			)
		})}
	</div>
)

const ButtonGroup = <T extends string>({
	options,
	value,
	onChange,
}: {
	options: {
		value: T
		label: string
		icon?: typeof Sun
		emoji?: string
		disabled?: boolean
	}[]
	value: T
	onChange: (value: T) => void
}) => (
	<div className='flex gap-2 flex-wrap'>
		{options.map(option => {
			const Icon = option.icon
			return (
				<motion.button
					key={option.value}
					whileHover={option.disabled ? undefined : BUTTON_HOVER}
					whileTap={option.disabled ? undefined : BUTTON_TAP}
					onClick={() => !option.disabled && onChange(option.value)}
					className={cn(
						'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
						option.disabled
							? 'cursor-not-allowed opacity-40 bg-bg-elevated text-text-secondary'
							: value === option.value
								? 'bg-primary text-white shadow-card'
								: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover',
					)}
				>
					{Icon && <Icon className='size-4' />}
					{option.emoji && <span>{option.emoji}</span>}
					{option.label}
					{option.disabled && (
						<span className='text-xs opacity-70'>(Soon)</span>
					)}
				</motion.button>
			)
		})}
	</div>
)

// ============================================
// MAIN COMPONENT
// ============================================

export default function SettingsPage() {
	const { user, setUser, logout } = useAuth()
	const router = useRouter()
	const [activeTab, setActiveTab] = useState<SettingsTab>('account')
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const [settings, setSettings] = useState<UserSettings | null>(null)

	const [displayName, setDisplayName] = useState('')
	const [bio, setBio] = useState('')
	const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>()
	const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
	const [isUploadingCover, setIsUploadingCover] = useState(false)
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
	const [verificationStatus, setVerificationStatus] =
		useState<VerificationStatus | null>(null)
	const [verificationLoading, setVerificationLoading] = useState(false)
	const [verificationReason, setVerificationReason] = useState('')
	const coverInputRef = useRef<HTMLInputElement>(null)
	const avatarInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const response = await getAllSettings()
				if (response.success && response.data) {
					setSettings(response.data)
					// Sync push timerAlerts preference to localStorage for use outside settings page
					setTimerAlertsEnabled(
						response.data.notifications?.push?.timerAlerts ?? true,
					)
				} else {
					setSettings({
						userId: user?.userId || '',
						...DEFAULT_USER_SETTINGS,
					} as UserSettings)
				}
			} catch (error) {
				logDevError('Failed to load settings:', error)
				toast.error('Failed to load settings')
			} finally {
				setIsLoading(false)
			}
		}

		if (user) {
			setDisplayName(user.displayName || '')
			setBio(user.bio || '')
			setCoverImageUrl(user.coverImageUrl)
			setAvatarUrl(user.avatarUrl)
			loadSettings()
		}
	}, [user])

	// Fetch verification status when verification tab is opened
	useEffect(() => {
		if (activeTab !== 'verification' || verificationStatus) return
		const fetchVerification = async () => {
			try {
				const res = await getVerificationStatus()
				if (res.success && res.data) {
					setVerificationStatus(res.data)
				}
			} catch {
				// No existing application — show apply form
			}
		}
		fetchVerification()
	}, [activeTab, verificationStatus])

	const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const previousCoverImageUrl = user?.coverImageUrl

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file')
			return
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image must be less than 5MB')
			return
		}

		setIsUploadingCover(true)
		let localPreviewUrl: string | null = null
		try {
			// Show local preview immediately
			localPreviewUrl = URL.createObjectURL(file)
			setCoverImageUrl(localPreviewUrl)

			// Upload to server
			const response = await uploadRecipeImages([file])
			if (response.success && response.data?.[0]) {
				const uploadedUrl = response.data[0]
				setCoverImageUrl(uploadedUrl)

				// Save to profile
				const updateResponse = await updateProfile({
					coverImageUrl: uploadedUrl,
				})
				if (updateResponse.success) {
					if (user) {
						setUser({ ...user, coverImageUrl: uploadedUrl })
					}
					toast.success('Cover photo updated!')
				} else {
					toast.error('Failed to save cover photo')
					setCoverImageUrl(previousCoverImageUrl)
				}
			} else {
				toast.error('Failed to upload image')
				setCoverImageUrl(previousCoverImageUrl)
			}
		} catch (error) {
			logDevError('Cover upload error:', error)
			toast.error('Failed to upload cover photo')
			setCoverImageUrl(previousCoverImageUrl)
		} finally {
			// Revoke the local blob URL to prevent memory leak
			if (localPreviewUrl) {
				URL.revokeObjectURL(localPreviewUrl)
			}
			setIsUploadingCover(false)
			if (coverInputRef.current) {
				coverInputRef.current.value = ''
			}
		}
	}

	const handleSaveProfile = async () => {
		if (isSaving || isUploadingAvatar || isUploadingCover) return
		setIsSaving(true)
		try {
			const response = await updateProfile({ displayName, bio })
			if (response.success) {
				// Update auth store so navbar/sidebar reflect changes immediately
				if (user) {
					setUser({ ...user, displayName, bio })
				}
				toast.success('Profile updated!')
			} else {
				toast.error(response.message || 'Failed to update profile')
			}
		} catch (error) {
			logDevError('Failed to update profile:', error)
			toast.error('Failed to update profile')
		} finally {
			setIsSaving(false)
		}
	}

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const previousAvatarUrl = user?.avatarUrl

		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file')
			return
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image must be less than 5MB')
			return
		}

		setIsUploadingAvatar(true)
		let localPreviewUrl: string | null = null
		try {
			localPreviewUrl = URL.createObjectURL(file)
			setAvatarUrl(localPreviewUrl)

			const response = await uploadRecipeImages([file])
			if (response.success && response.data?.[0]) {
				const uploadedUrl = response.data[0]
				setAvatarUrl(uploadedUrl)

				const updateResponse = await updateProfile({ avatarUrl: uploadedUrl })
				if (updateResponse.success) {
					// Update auth store so navbar avatar reflects change immediately
					if (user) {
						setUser({ ...user, avatarUrl: uploadedUrl })
					}
					toast.success('Avatar updated!')
				} else {
					toast.error('Failed to save avatar')
					setAvatarUrl(previousAvatarUrl)
				}
			} else {
				toast.error('Failed to upload image')
				setAvatarUrl(previousAvatarUrl)
			}
		} catch (error) {
			logDevError('Avatar upload error:', error)
			toast.error('Failed to upload avatar')
			setAvatarUrl(previousAvatarUrl)
		} finally {
			// Revoke the local blob URL to prevent memory leak
			if (localPreviewUrl) {
				URL.revokeObjectURL(localPreviewUrl)
			}
			setIsUploadingAvatar(false)
			if (avatarInputRef.current) {
				avatarInputRef.current.value = ''
			}
		}
	}

	const handleUpdatePrivacy = useCallback(
		async (updates: Partial<PrivacySettings>) => {
			if (!settings) return
			const previousSettings = settings
			const newPrivacy = { ...settings.privacy, ...updates }
			setSettings({ ...settings, privacy: newPrivacy })

			try {
				const response = await updatePrivacySettings(updates)
				if (response.success) {
					toast.success('Privacy settings updated')
				} else {
					setSettings(previousSettings)
					toast.error(response.message || 'Failed to update privacy settings')
				}
			} catch (error) {
				logDevError('Failed to update privacy settings:', error)
				setSettings(previousSettings)
				toast.error('Failed to update privacy settings')
			}
		},
		[settings],
	)

	const handleUpdateNotifications = useCallback(
		async (updates: Partial<NotificationSettings>) => {
			if (!settings) return
			const previousSettings = settings
			const newNotifications = {
				...settings.notifications,
				email: { ...settings.notifications.email, ...updates.email },
				inApp: { ...settings.notifications.inApp, ...updates.inApp },
				push: { ...settings.notifications.push, ...updates.push },
			}
			setSettings({ ...settings, notifications: newNotifications })

			try {
				const response = await updateNotificationSettings(updates)
				if (response.success) {
					toast.success('Notification settings updated')
				} else {
					setSettings(previousSettings)
					toast.error(
						response.message || 'Failed to update notification settings',
					)
				}
			} catch (error) {
				logDevError('Failed to update notification settings:', error)
				setSettings(previousSettings)
				toast.error('Failed to update notification settings')
			}
		},
		[settings],
	)

	const handleUpdateCooking = useCallback(
		async (updates: Partial<CookingPreferences>) => {
			if (!settings) return
			const previousSettings = settings
			const newCooking = { ...settings.cooking, ...updates }
			setSettings({ ...settings, cooking: newCooking })

			try {
				const response = await updateCookingPreferences(updates)
				if (response.success) {
					toast.success('Cooking preferences updated')
				} else {
					setSettings(previousSettings)
					toast.error(
						response.message || 'Failed to update cooking preferences',
					)
				}
			} catch (error) {
				logDevError('Failed to update cooking preferences:', error)
				setSettings(previousSettings)
				toast.error('Failed to update cooking preferences')
			}
		},
		[settings],
	)

	const handleUpdateApp = useCallback(
		async (updates: Partial<AppPreferences>) => {
			if (!settings) return
			const previousSettings = settings
			const newApp = { ...settings.app, ...updates }
			setSettings({ ...settings, app: newApp })

			try {
				const response = await updateAppPreferences(updates)
				if (response.success) {
					toast.success('App preferences updated')
				} else {
					setSettings(previousSettings)
					toast.error(response.message || 'Failed to update app preferences')
				}
			} catch (error) {
				logDevError('Failed to update app preferences:', error)
				setSettings(previousSettings)
				toast.error('Failed to update app preferences')
			}
		},
		[settings],
	)

	const toggleArrayItem = (arr: string[], item: string): string[] =>
		arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

	const handleLogout = async () => {
		if (isLoggingOut) return
		setIsLoggingOut(true)
		try {
			await logoutService()
		} catch (error) {
			logDevError('Logout error:', error)
			toast.error('Could not fully sign out — clearing local session')
		} finally {
			// Always clear local state and redirect (security: never leave stale session)
			logout()
			router.push(PATHS.AUTH.SIGN_IN)
		}
	}

	if (isLoading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<div className='flex min-h-content-tall items-center justify-center'>
						<Loader2 className='size-8 animate-spin text-primary' />
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Header - Unified icon-box pattern */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-8'
				>
					<div className='mb-2 flex items-center gap-3'>
						<motion.div
							whileHover={{ rotate: 45 }}
							transition={TRANSITION_SPRING}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-warm shadow-card'
						>
							<Settings className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold text-text'>Settings</h1>
					</div>
					<p className='flex items-center gap-2 text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						Customize your ChefKix experience
					</p>
				</motion.div>

				<div className='grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]'>
					{/* Sidebar Tabs */}
					<motion.nav
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={TRANSITION_SPRING}
						className='flex flex-col gap-1 rounded-radius border border-border-subtle bg-bg-card p-2 shadow-card h-fit lg:sticky lg:top-24'
					>
						{TABS.map(tab => {
							const Icon = tab.icon
							const isActive = activeTab === tab.id
							return (
								<motion.button
									key={tab.id}
									whileHover={{ x: 4 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => setActiveTab(tab.id)}
									className={cn(
										'flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all',
										isActive
											? 'bg-primary/10 text-primary font-semibold'
											: 'text-text-secondary hover:bg-bg-hover hover:text-text',
									)}
								>
									<Icon
										className={cn(
											'size-5',
											isActive ? 'text-primary' : 'text-text-secondary',
										)}
									/>
									<div className='hidden lg:block'>
										<p className='text-sm'>{tab.label}</p>
									</div>
								</motion.button>
							)
						})}

						{/* Divider + Sign Out */}
						<div className='my-1 h-px bg-border-subtle' />
						<motion.button
							whileHover={isLoggingOut ? {} : { x: 4 }}
							whileTap={isLoggingOut ? {} : { scale: 0.98 }}
							onClick={handleLogout}
							disabled={isLoggingOut}
							className='flex items-center gap-3 rounded-lg px-4 py-3 text-left text-error hover:bg-error/10 transition-all w-full disabled:opacity-50'
						>
							<LogOut className='size-5 flex-shrink-0' />
							<div className='hidden lg:block'>
								<p className='text-sm font-medium'>
									{isLoggingOut ? 'Signing out...' : 'Sign Out'}
								</p>
							</div>
						</motion.button>
					</motion.nav>

					{/* Content Area */}
					<AnimatePresence mode='wait'>
						<motion.div
							key={activeTab}
							variants={tabContentVariants}
							initial='hidden'
							animate='visible'
							exit='exit'
							className='space-y-6'
						>
							{/* Account Tab */}
							{activeTab === 'account' && (
								<motion.div
									variants={staggerContainer}
									initial='hidden'
									animate='visible'
									className='space-y-6'
								>
									<SettingsCard
										title='Profile Information'
										description='This is how others see you on ChefKix'
									>
										<div className='space-y-4'>
											{/* Cover Photo Upload */}
											<div className='grid gap-2'>
												<Label id='settings-cover-label'>Cover Photo</Label>
												<div
													className='relative'
													aria-labelledby='settings-cover-label'
												>
													<div
														className={cn(
															'relative h-32 w-full overflow-hidden rounded-lg border-2 border-dashed border-border-subtle bg-gradient-to-br from-brand/20 via-amber-100/30 to-orange-50/40 transition-all',
															isUploadingCover && 'opacity-60',
														)}
													>
														{coverImageUrl ? (
															<Image
																src={coverImageUrl}
																alt='Cover'
																fill
																className='object-cover'
															/>
														) : (
															<div className='flex h-full items-center justify-center'>
																<ImagePlus className='size-8 text-text-secondary' />
															</div>
														)}
														{isUploadingCover && (
															<div className='absolute inset-0 flex items-center justify-center bg-background/50'>
																<Loader2 className='size-6 animate-spin text-primary' />
															</div>
														)}
													</div>
													<Button
														type='button'
														variant='outline'
														size='sm'
														className='absolute bottom-2 right-2 gap-1.5'
														onClick={() => coverInputRef.current?.click()}
														disabled={isUploadingCover}
													>
														<Camera className='size-4' />
														{coverImageUrl ? 'Change' : 'Upload'}
													</Button>
													<input
														ref={coverInputRef}
														type='file'
														accept='image/*'
														className='hidden'
														onChange={handleCoverUpload}
													/>
												</div>
												<p className='text-xs text-text-muted'>
													Recommended: 1200×300px, max 5MB
												</p>
											</div>

											{/* Avatar Upload */}
											<div className='grid gap-2'>
												<Label id='settings-avatar-label'>Profile Photo</Label>
												<div
													className='flex items-center gap-4'
													aria-labelledby='settings-avatar-label'
												>
													<div
														className={cn(
															'relative size-20 overflow-hidden rounded-full border-2 border-dashed border-border-subtle bg-bg-elevated transition-all',
															isUploadingAvatar && 'opacity-60',
														)}
													>
														{avatarUrl ? (
															<Image
																src={avatarUrl}
																alt='Avatar'
																fill
																className='object-cover'
															/>
														) : (
															<div className='flex size-full items-center justify-center'>
																<User className='size-8 text-text-secondary' />
															</div>
														)}
														{isUploadingAvatar && (
															<div className='absolute inset-0 flex items-center justify-center bg-background/50'>
																<Loader2 className='size-5 animate-spin text-primary' />
															</div>
														)}
													</div>
													<div className='flex flex-col gap-2'>
														<Button
															type='button'
															variant='outline'
															size='sm'
															className='gap-1.5'
															onClick={() => avatarInputRef.current?.click()}
															disabled={isUploadingAvatar}
														>
															<Camera className='size-4' />
															{avatarUrl ? 'Change Photo' : 'Upload Photo'}
														</Button>
														<p className='text-xs text-text-muted'>
															Square image, max 5MB
														</p>
													</div>
													<input
														ref={avatarInputRef}
														type='file'
														accept='image/*'
														className='hidden'
														onChange={handleAvatarUpload}
													/>
												</div>
											</div>

											<div className='grid gap-2'>
												<Label htmlFor='displayName'>Display Name</Label>
												<Input
													id='displayName'
													value={displayName}
													onChange={e => setDisplayName(e.target.value)}
													placeholder='Your display name'
												/>
											</div>
											<div className='grid gap-2'>
												<Label htmlFor='email'>Email</Label>
												<Input
													id='email'
													value={user?.email || ''}
													disabled
													className='bg-bg-elevated'
												/>
												<p className='text-xs text-text-muted'>
													Email cannot be changed in-app.
												</p>
												<a
													href='mailto:support@chefkix.com?subject=Email%20Change%20Request'
													className='inline-flex w-fit items-center text-xs font-semibold text-brand hover:underline'
												>
													Need to change it? Contact support.
												</a>
											</div>
											<div className='grid gap-2'>
												<Label htmlFor='bio'>Bio</Label>
												<Textarea
													id='bio'
													value={bio}
													onChange={e => setBio(e.target.value)}
													placeholder='Tell us about yourself...'
													maxLength={160}
												/>
												<p className='text-xs text-text-muted text-right'>
													{bio.length}/160
												</p>
											</div>
											<Button
												onClick={handleSaveProfile}
												disabled={
													isSaving || isUploadingAvatar || isUploadingCover
												}
											>
												{isSaving ? (
													<Loader2 className='mr-2 size-4 animate-spin' />
												) : (
													<Save className='mr-2 size-4' />
												)}
												{isUploadingAvatar || isUploadingCover
													? 'Uploading...'
													: 'Save Profile'}
											</Button>
										</div>
									</SettingsCard>

									<SettingsCard
										title='Account Security'
										description='Password is managed through our secure identity provider'
									>
										<div className='space-y-3'>
											<p className='text-sm text-text-secondary'>
												To change your password, use the &quot;Forgot
												Password&quot; option on the sign-in page. This ensures
												secure password resets through our identity provider.
											</p>
											<Button
												variant='outline'
												className='w-full sm:w-auto'
												onClick={() => {
													router.push('/auth/sign-in')
												}}
											>
												<Shield className='mr-2 size-4' />
												Go to Sign-In Page
											</Button>
										</div>
									</SettingsCard>
								</motion.div>
							)}

							{/* Privacy Tab */}
							{activeTab === 'privacy' && settings && (
								<motion.div
									variants={staggerContainer}
									initial='hidden'
									animate='visible'
									className='space-y-6'
								>
									<SettingsCard
										title='Profile Visibility'
										description='Control who can see your profile and content'
									>
										<div className='space-y-4'>
											<div
												role='group'
												aria-labelledby='settings-visibility-label'
											>
												<Label
													id='settings-visibility-label'
													className='mb-3 block'
												>
													Who can see your profile?
												</Label>
												<ButtonGroup
													options={VISIBILITY_OPTIONS}
													value={settings.privacy.profileVisibility}
													onChange={v =>
														handleUpdatePrivacy({ profileVisibility: v })
													}
												/>
											</div>
											<div
												role='group'
												aria-labelledby='settings-messaging-label'
											>
												<Label
													id='settings-messaging-label'
													className='mb-3 block'
												>
													Who can message you?
												</Label>
												<ButtonGroup
													options={MESSAGE_OPTIONS}
													value={settings.privacy.allowMessagesFrom}
													onChange={v =>
														handleUpdatePrivacy({ allowMessagesFrom: v })
													}
												/>
											</div>
										</div>
									</SettingsCard>

									<SettingsCard title='Privacy Toggles'>
										<div>
											<ToggleRow
												label='Show on Leaderboard'
												description='Appear in global rankings'
												icon={Trophy}
												checked={settings.privacy.showOnLeaderboard}
												onCheckedChange={checked =>
													handleUpdatePrivacy({ showOnLeaderboard: checked })
												}
											/>
											<ToggleRow
												label='Allow Followers'
												description='Let others follow your cooking journey'
												icon={Users}
												checked={settings.privacy.allowFollowers}
												onCheckedChange={checked =>
													handleUpdatePrivacy({ allowFollowers: checked })
												}
											/>
											<ToggleRow
												label='Show Cooking Activity'
												description='Auto-share when you finish cooking & show activity status'
												icon={ChefHat}
												checked={settings.privacy.showCookingActivity}
												onCheckedChange={checked =>
													handleUpdatePrivacy({ showCookingActivity: checked })
												}
											/>
										</div>
									</SettingsCard>
								</motion.div>
							)}

							{/* Notifications Tab */}
							{activeTab === 'notifications' && settings && (
								<motion.div
									variants={staggerContainer}
									initial='hidden'
									animate='visible'
									className='space-y-6'
								>
									<SettingsCard
										title='Email Notifications'
										description='Choose what emails you receive'
									>
										<div>
											<ToggleRow
												label='Weekly Digest'
												description='Summary of your activity'
												icon={Mail}
												checked={settings.notifications.email.weeklyDigest}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														email: {
															...settings.notifications.email,
															weeklyDigest: checked,
														},
													})
												}
											/>
											<ToggleRow
												label='New Follower'
												description='When someone follows you'
												icon={Users}
												checked={settings.notifications.email.newFollower}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														email: {
															...settings.notifications.email,
															newFollower: checked,
														},
													})
												}
											/>
											<ToggleRow
												label='Recipe Milestones'
												description='When your recipe hits 10/50/100 cooks'
												icon={Trophy}
												checked={settings.notifications.email.recipeMilestone}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														email: {
															...settings.notifications.email,
															recipeMilestone: checked,
														},
													})
												}
											/>
										</div>
									</SettingsCard>

									<SettingsCard
										title='In-App Notifications'
										description='Bell notifications within ChefKix'
									>
										<div>
											<ToggleRow
												label='XP & Level Ups'
												description='Progress notifications'
												icon={Sparkles}
												checked={settings.notifications.inApp.xpAndLevelUps}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														inApp: {
															...settings.notifications.inApp,
															xpAndLevelUps: checked,
														},
													})
												}
											/>
											<ToggleRow
												label='Badges'
												description='Badge unlock notifications'
												icon={Trophy}
												checked={settings.notifications.inApp.badges}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														inApp: {
															...settings.notifications.inApp,
															badges: checked,
														},
													})
												}
											/>
											<ToggleRow
												label='Social Activity'
												description='Likes and comments'
												icon={MessageSquare}
												checked={settings.notifications.inApp.social}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														inApp: {
															...settings.notifications.inApp,
															social: checked,
														},
													})
												}
											/>
											<ToggleRow
												label='New Followers'
												description='When someone follows you'
												icon={Users}
												checked={settings.notifications.inApp.followers}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														inApp: {
															...settings.notifications.inApp,
															followers: checked,
														},
													})
												}
											/>
											<ToggleRow
												label='Post Reminders'
												description='Remind to post cooking attempts'
												icon={Clock}
												checked={settings.notifications.inApp.postDeadline}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														inApp: {
															...settings.notifications.inApp,
															postDeadline: checked,
														},
													})
												}
											/>
											<ToggleRow
												label='Streak Warnings'
												description='Before your streak expires'
												icon={AlertTriangle}
												checked={settings.notifications.inApp.streakWarning}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														inApp: {
															...settings.notifications.inApp,
															streakWarning: checked,
														},
													})
												}
											/>
											<ToggleRow
												label='Daily Challenge'
												description='Todays challenge notification'
												icon={ChefHat}
												checked={settings.notifications.inApp.dailyChallenge}
												onCheckedChange={checked =>
													handleUpdateNotifications({
														inApp: {
															...settings.notifications.inApp,
															dailyChallenge: checked,
														},
													})
												}
											/>
										</div>
									</SettingsCard>

									<SettingsCard
										title='Push Notifications'
										description='Mobile and browser notifications'
									>
										<div>
											<ToggleRow
												label='Enable Push Notifications'
												description={
													!isNotificationSupported()
														? 'Not supported in this browser'
														: getNotificationPermission() === 'denied'
															? 'Blocked by browser — reset in browser settings'
															: 'Receive notifications even when not using ChefKix'
												}
												icon={Smartphone}
												checked={settings.notifications.push.enabled}
												disabled={
													!isNotificationSupported() ||
													getNotificationPermission() === 'denied'
												}
												onCheckedChange={async checked => {
													if (checked) {
														const permission =
															await requestNotificationPermission()
														if (permission !== 'granted') {
															toast.error(
																'Notification permission was not granted',
															)
															return
														}
													}
													handleUpdateNotifications({
														push: {
															...settings.notifications.push,
															enabled: checked,
														},
													})
												}}
											/>
											<ToggleRow
												label='Timer Alerts'
												description='When cooking timers complete'
												icon={Timer}
												checked={settings.notifications.push.timerAlerts}
												onCheckedChange={checked => {
													setTimerAlertsEnabled(checked)
													handleUpdateNotifications({
														push: {
															...settings.notifications.push,
															timerAlerts: checked,
														},
													})
												}}
											/>
										</div>
									</SettingsCard>
								</motion.div>
							)}

							{/* Cooking Tab */}
							{activeTab === 'cooking' && settings && (
								<motion.div
									variants={staggerContainer}
									initial='hidden'
									animate='visible'
									className='space-y-6'
								>
									<SettingsCard
										title='Skill Level'
										description='This helps us recommend appropriate recipes'
									>
										<ButtonGroup
											options={SKILL_LEVELS}
											value={settings.cooking.skillLevel}
											onChange={v => handleUpdateCooking({ skillLevel: v })}
										/>
									</SettingsCard>

									<SettingsCard
										title='Dietary Restrictions'
										description='We will filter recipes based on your diet'
									>
										<ChipSelect
											options={DIETARY_OPTIONS}
											selected={settings.cooking.dietaryRestrictions}
											onToggle={opt =>
												handleUpdateCooking({
													dietaryRestrictions: toggleArrayItem(
														settings.cooking.dietaryRestrictions,
														opt,
													),
												})
											}
										/>
									</SettingsCard>

									<SettingsCard
										title='Allergies'
										description='We will warn you about recipes containing these'
									>
										<ChipSelect
											options={ALLERGY_OPTIONS}
											selected={settings.cooking.allergies}
											onToggle={opt =>
												handleUpdateCooking({
													allergies: toggleArrayItem(
														settings.cooking.allergies,
														opt,
													),
												})
											}
										/>
										{settings.cooking.allergies.length > 0 && (
											<div className='mt-3 flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-warning'>
												<AlertTriangle className='size-4' />
												<span className='text-sm'>
													You will see warnings on recipes containing:{' '}
													{settings.cooking.allergies.join(', ')}
												</span>
											</div>
										)}
									</SettingsCard>

									<SettingsCard
										title='Preferred Cuisines'
										description='We will prioritize these in your feed'
									>
										<ChipSelect
											options={CUISINE_OPTIONS}
											selected={settings.cooking.preferredCuisines}
											onToggle={opt =>
												handleUpdateCooking({
													preferredCuisines: toggleArrayItem(
														settings.cooking.preferredCuisines,
														opt,
													),
												})
											}
										/>
									</SettingsCard>

									<SettingsCard title='Cooking Preferences'>
										<div className='space-y-6'>
											<div>
												<Label
													htmlFor='settings-default-servings'
													className='mb-3 block'
												>
													Default Servings
												</Label>
												<div className='flex items-center gap-4'>
													<Input
														id='settings-default-servings'
														type='number'
														min={1}
														max={20}
														value={settings.cooking.defaultServings}
														onChange={e =>
															handleUpdateCooking({
																defaultServings: parseInt(e.target.value) || 2,
															})
														}
														className='w-24'
													/>
													<span className='text-sm text-text-secondary'>
														servings
													</span>
												</div>
											</div>
											<div>
												<Label
													htmlFor='settings-max-cooking-time'
													className='mb-3 block'
												>
													Max Cooking Time
												</Label>
												<div className='flex items-center gap-4'>
													<Input
														id='settings-max-cooking-time'
														type='number'
														min={0}
														max={480}
														value={settings.cooking.maxCookingTimeMinutes || ''}
														onChange={e =>
															handleUpdateCooking({
																maxCookingTimeMinutes: e.target.value
																	? parseInt(e.target.value)
																	: null,
															})
														}
														placeholder='No limit'
														className='w-24'
													/>
													<span className='text-sm text-text-secondary'>
														minutes (leave empty for no limit)
													</span>
												</div>
											</div>
											<div role='group' aria-labelledby='settings-units-label'>
												<Label id='settings-units-label' className='mb-3 block'>
													Measurement Units
												</Label>
												<ButtonGroup
													options={[
														{
															value: 'metric' as MeasurementUnits,
															label: 'Metric (g, ml)',
														},
														{
															value: 'imperial' as MeasurementUnits,
															label: 'Imperial (oz, cups)',
														},
													]}
													value={settings.cooking.measurementUnits}
													onChange={v =>
														handleUpdateCooking({ measurementUnits: v })
													}
												/>
											</div>
										</div>
									</SettingsCard>
								</motion.div>
							)}

							{/* Referral Tab */}
							{activeTab === 'referral' && (
								<motion.div
									variants={staggerContainer}
									initial='hidden'
									animate='visible'
									className='space-y-6'
								>
									<ReferralCard />
								</motion.div>
							)}

							{/* Premium Tab */}
							{activeTab === 'premium' && <PremiumUpgradeCard />}

							{/* Verification Tab */}
							{activeTab === 'verification' && (
								<motion.div
									variants={staggerContainer}
									initial='hidden'
									animate='visible'
									className='space-y-6'
								>
									<SettingsCard
										title='Creator Verification'
										description='Get the verified badge next to your name'
									>
										<div className='space-y-4'>
											{verificationStatus ? (
												<div className='space-y-3'>
													<div className='flex items-center gap-2'>
														<span className='text-sm font-medium text-text-secondary'>
															Status:
														</span>
														<span
															className={cn(
																'rounded-full px-2.5 py-0.5 text-xs font-semibold',
																verificationStatus.status === 'APPROVED' &&
																	'bg-success/10 text-success',
																verificationStatus.status === 'PENDING' &&
																	'bg-warning/10 text-warning',
																verificationStatus.status === 'REJECTED' &&
																	'bg-error/10 text-error',
															)}
														>
															{verificationStatus.status}
														</span>
													</div>
													{verificationStatus.status === 'APPROVED' && (
														<div className='flex items-center gap-2 rounded-lg bg-success/5 p-3'>
															<BadgeCheck className='size-5 text-info' />
															<p className='text-sm font-medium text-success'>
																You&apos;re a verified creator!
															</p>
														</div>
													)}
													{verificationStatus.status === 'REJECTED' &&
														verificationStatus.adminNotes && (
															<p className='text-sm text-text-secondary'>
																<span className='font-medium'>Feedback:</span>{' '}
																{verificationStatus.adminNotes}
															</p>
														)}
													{verificationStatus.status === 'PENDING' && (
														<p className='text-sm text-text-muted'>
															Your application is being reviewed. This usually
															takes 1-3 business days.
														</p>
													)}
												</div>
											) : (
												<div className='space-y-4'>
													<p className='text-sm leading-relaxed text-text-secondary'>
														The verified badge shows you&apos;re a recognized
														creator. Share recipes, build your following, and
														apply when you&apos;re ready.
													</p>
													<div>
														<Label className='mb-1.5 block text-sm font-medium'>
															Why should you be verified? (optional)
														</Label>
														<Textarea
															value={verificationReason}
															onChange={e =>
																setVerificationReason(e.target.value)
															}
															placeholder='Tell us about your cooking journey, content, or community presence...'
															className='min-h-[80px] resize-none'
															maxLength={500}
														/>
														<p className='mt-1 text-right text-xs text-text-muted'>
															{verificationReason.length}/500
														</p>
													</div>
													<Button
														onClick={async () => {
															setVerificationLoading(true)
															try {
																const res = await applyForVerification(
																	verificationReason || undefined,
																)
																if (res.success && res.data) {
																	setVerificationStatus(res.data)
																	toast.success('Application submitted!')
																} else {
																	toast.error(
																		res.message ||
																			'Failed to submit application',
																	)
																}
															} catch {
																toast.error('Something went wrong')
															} finally {
																setVerificationLoading(false)
															}
														}}
														disabled={verificationLoading}
														className='w-full'
													>
														{verificationLoading ? (
															<Loader2 className='mr-2 size-4 animate-spin' />
														) : (
															<BadgeCheck className='mr-2 size-4' />
														)}
														Apply for Verification
													</Button>
												</div>
											)}
										</div>
									</SettingsCard>
								</motion.div>
							)}

							{/* Appearance Tab */}
							{activeTab === 'appearance' && settings && (
								<motion.div
									variants={staggerContainer}
									initial='hidden'
									animate='visible'
									className='space-y-6'
								>
									<SettingsCard
										title='Theme'
										description='Light mode is active. Dark and System modes coming soon.'
									>
										<ButtonGroup
											options={THEME_OPTIONS}
											value={settings.app.theme}
											onChange={v => handleUpdateApp({ theme: v })}
										/>
									</SettingsCard>

									<SettingsCard title='Sound & Motion'>
										<div>
											<ToggleRow
												label='Sound Effects'
												description='Timer dings, XP sounds, celebrations'
												icon={Volume2}
												checked={settings.app.soundEffects}
												onCheckedChange={checked =>
													handleUpdateApp({ soundEffects: checked })
												}
											/>
											{/* Test Timer Sound Button */}
											<div className='flex items-center justify-between border-b border-border-subtle py-3'>
												<div className='flex items-center gap-3'>
													<Timer className='size-4 text-text-secondary' />
													<div>
														<p className='text-sm font-medium text-text'>
															Timer Notification Sound
														</p>
														<p className='text-xs text-text-secondary'>
															Preview the sound that plays when timers complete
														</p>
													</div>
												</div>
												<Button
													variant='outline'
													size='sm'
													onClick={() => {
														if (!settings?.app.soundEffects) {
															toast.info(
																'Sound effects are disabled. Enable them above to hear the timer.',
															)
															return
														}
														playTimerChime()
														toast.success('🔔 Timer sound played!')
													}}
													className='shrink-0'
												>
													<Volume2 className='mr-2 size-4' />
													Test Sound
												</Button>
											</div>
											<ToggleRow
												label='Reduced Motion'
												description='Disable animations for accessibility'
												icon={Eye}
												checked={settings.app.reducedMotion}
												onCheckedChange={checked =>
													handleUpdateApp({ reducedMotion: checked })
												}
											/>
											<ToggleRow
												label='Auto-play Videos'
												description='Automatically play recipe step videos'
												icon={Smartphone}
												checked={settings.app.autoPlayVideos}
												onCheckedChange={checked =>
													handleUpdateApp({ autoPlayVideos: checked })
												}
											/>
										</div>
									</SettingsCard>

									<SettingsCard title='Cooking Session'>
										<div>
											<ToggleRow
												label='Keep Screen On'
												description='Prevent screen sleep during cooking'
												icon={Smartphone}
												checked={settings.app.keepScreenOn}
												onCheckedChange={checked =>
													handleUpdateApp({ keepScreenOn: checked })
												}
											/>
										</div>
									</SettingsCard>
								</motion.div>
							)}
						</motion.div>
					</AnimatePresence>
				</div>
			</PageContainer>
		</PageTransition>
	)
}
