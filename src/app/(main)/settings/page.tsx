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
	Sun,
	Moon,
	Monitor,
	Clock,
	Eye,
	ImagePlus,
	Camera,
	BadgeCheck,
	Crown,
	Gift,
	Trash2,
	Download,
} from 'lucide-react'
import Image from 'next/image'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { PATHS } from '@/constants'
import { changePassword, logout as logoutService } from '@/services/auth'
import {
	deleteAccount,
	exportUserData,
	updateProfile,
} from '@/services/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { logDevError } from '@/lib/dev-log'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getStorageItem, setStorageItem } from '@/lib/storage'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	LIST_ITEM_HOVER,
	LIST_ITEM_TAP,
	NAV_ITEM_HOVER,
	staggerContainer,
	DURATION_S,
} from '@/lib/motion'
import ReferralCard from '@/components/referral/ReferralCard'
import PremiumUpgradeCard from '@/components/premium/PremiumUpgradeCard'
import { InterestPicker } from '@/components/onboarding/InterestPicker'
import {
	getAllSettings,
	updatePrivacySettings,
	updateNotificationSettings,
	updateCookingPreferences,
	updateAppPreferences,
} from '@/services/settings'
import { uploadRecipeImages } from '@/services/recipe'
import {
	applyForVerification,
	getVerificationStatus,
	type VerificationStatus,
} from '@/services/verification'
import { playTimerChime } from '@/hooks/useTimerNotifications'
import { setAudioEnabled } from '@/lib/audio'
import {
	requestNotificationPermission,
	isNotificationSupported,
	getNotificationPermission,
	setTimerAlertsEnabled,
} from '@/lib/pushNotifications'
import { getFCMToken } from '@/lib/firebase'
import { registerPushToken, unregisterPushToken } from '@/services/push'
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
} from '@/lib/types/settings'
import { isTrackingOptedOut, setTrackingOptOut } from '@/lib/eventTracker'
import { useReducedMotionPreference } from '@/components/providers/ReducedMotionProvider'
import { useTranslations } from '@/i18n/hooks'

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
	labelKey: string
	icon: typeof User
	descriptionKey: string
}

function isSettingsTab(value: string | null): value is SettingsTab {
	return (
		value === 'account' ||
		value === 'privacy' ||
		value === 'notifications' ||
		value === 'cooking' ||
		value === 'appearance' ||
		value === 'referral' ||
		value === 'premium' ||
		value === 'verification'
	)
}

// ============================================
// CONSTANTS
// ============================================

const TABS: TabConfig[] = [
	{
		id: 'account',
		labelKey: 'tabAccount',
		icon: User,
		descriptionKey: 'tabAccountDesc',
	},
	{
		id: 'privacy',
		labelKey: 'tabPrivacy',
		icon: Shield,
		descriptionKey: 'tabPrivacyDesc',
	},
	{
		id: 'notifications',
		labelKey: 'tabNotifications',
		icon: Bell,
		descriptionKey: 'tabNotificationsDesc',
	},
	{
		id: 'cooking',
		labelKey: 'tabCooking',
		icon: ChefHat,
		descriptionKey: 'tabCookingDesc',
	},
	{
		id: 'appearance',
		labelKey: 'tabAppearance',
		icon: Palette,
		descriptionKey: 'tabAppearanceDesc',
	},
	{
		id: 'premium',
		labelKey: 'tabPremium',
		icon: Crown,
		descriptionKey: 'tabPremiumDesc',
	},
	{
		id: 'referral',
		labelKey: 'tabReferral',
		icon: Gift,
		descriptionKey: 'tabReferralDesc',
	},
	{
		id: 'verification',
		labelKey: 'tabVerification',
		icon: BadgeCheck,
		descriptionKey: 'tabVerificationDesc',
	},
]

const VISIBILITY_OPTIONS: {
	value: ProfileVisibility
	labelKey: string
	icon: typeof Globe
}[] = [
	{ value: 'public', labelKey: 'visibilityPublic', icon: Globe },
	{ value: 'friends_only', labelKey: 'visibilityFriendsOnly', icon: Users },
	{ value: 'private', labelKey: 'visibilityPrivate', icon: EyeOff },
]

const MESSAGE_OPTIONS: { value: AllowMessagesFrom; labelKey: string }[] = [
	{ value: 'everyone', labelKey: 'messagesEveryone' },
	{ value: 'friends', labelKey: 'messagesFriendsOnly' },
	{ value: 'nobody', labelKey: 'messagesNobody' },
]

const SKILL_LEVELS: { value: SkillLevel; labelKey: string; emoji: string }[] = [
	{ value: 'beginner', labelKey: 'skillBeginner', emoji: '🥄' },
	{ value: 'intermediate', labelKey: 'skillIntermediate', emoji: '🍳' },
	{ value: 'advanced', labelKey: 'skillAdvanced', emoji: '👨‍🍳' },
	{ value: 'expert', labelKey: 'skillExpert', emoji: '⭐' },
]

const DIETARY_KEYS = [
	{ value: 'vegetarian', labelKey: 'dietVegetarian' },
	{ value: 'vegan', labelKey: 'dietVegan' },
	{ value: 'gluten-free', labelKey: 'dietGlutenFree' },
	{ value: 'dairy-free', labelKey: 'dietDairyFree' },
	{ value: 'keto', labelKey: 'dietKeto' },
	{ value: 'paleo', labelKey: 'dietPaleo' },
	{ value: 'halal', labelKey: 'dietHalal' },
	{ value: 'kosher', labelKey: 'dietKosher' },
]

const ALLERGY_KEYS = [
	{ value: 'nuts', labelKey: 'allergyNuts' },
	{ value: 'peanuts', labelKey: 'allergyPeanuts' },
	{ value: 'dairy', labelKey: 'allergyDairy' },
	{ value: 'eggs', labelKey: 'allergyEggs' },
	{ value: 'shellfish', labelKey: 'allergyShellfish' },
	{ value: 'fish', labelKey: 'allergyFish' },
	{ value: 'soy', labelKey: 'allergySoy' },
	{ value: 'wheat', labelKey: 'allergyWheat' },
	{ value: 'sesame', labelKey: 'allergySesame' },
]

const CUISINE_KEYS = [
	{ value: 'Italian', labelKey: 'cuisineItalian' },
	{ value: 'Japanese', labelKey: 'cuisineJapanese' },
	{ value: 'Mexican', labelKey: 'cuisineMexican' },
	{ value: 'Chinese', labelKey: 'cuisineChinese' },
	{ value: 'Indian', labelKey: 'cuisineIndian' },
	{ value: 'Thai', labelKey: 'cuisineThai' },
	{ value: 'Vietnamese', labelKey: 'cuisineVietnamese' },
	{ value: 'French', labelKey: 'cuisineFrench' },
	{ value: 'Korean', labelKey: 'cuisineKorean' },
	{ value: 'Mediterranean', labelKey: 'cuisineMediterranean' },
	{ value: 'American', labelKey: 'cuisineAmerican' },
	{ value: 'Middle Eastern', labelKey: 'cuisineMiddleEastern' },
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
	exit: { opacity: 0, x: -20, transition: { duration: DURATION_S.fast } },
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
			<h2 className='text-lg font-semibold text-text'>{title}</h2>
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
	options: { value: string; label: string }[]
	selected: string[]
	onToggle: (option: string) => void
	className?: string
}) => (
	<div className={cn('flex flex-wrap gap-2', className)}>
		{options.map(option => {
			const isSelected = selected.includes(option.value)
			return (
				<motion.button
					type='button'
					key={option.value}
					whileHover={LIST_ITEM_HOVER}
					whileTap={LIST_ITEM_TAP}
					onClick={() => onToggle(option.value)}
					className={cn(
						'rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand/50',
						isSelected
							? 'bg-brand text-white shadow-card'
							: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover',
					)}
				>
					{isSelected && <Check className='mr-1 inline size-3' />}
					{option.label}
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
					type='button'
					key={option.value}
					whileHover={option.disabled ? undefined : BUTTON_HOVER}
					whileTap={option.disabled ? undefined : BUTTON_TAP}
					onClick={() => !option.disabled && onChange(option.value)}
					className={cn(
						'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand/50',
						option.disabled
							? 'cursor-not-allowed opacity-40 bg-bg-elevated text-text-secondary'
							: value === option.value
								? 'bg-brand text-white shadow-card'
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
	const searchParams = useSearchParams()
	const { setMotionPreference } = useReducedMotionPreference()
	const t = useTranslations('settings')

	const dietaryOptions = DIETARY_KEYS.map(d => ({
		value: d.value,
		label: t(d.labelKey),
	}))
	const allergyOptions = ALLERGY_KEYS.map(a => ({
		value: a.value,
		label: t(a.labelKey),
	}))
	const cuisineOptions = CUISINE_KEYS.map(c => ({
		value: c.value,
		label: t(c.labelKey),
	}))
	const [activeTab, setActiveTab] = useState<SettingsTab>('account')
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState(false)
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
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [deleteConfirmText, setDeleteConfirmText] = useState('')
	const [isExportingData, setIsExportingData] = useState(false)
	const [showInterestPicker, setShowInterestPicker] = useState(false)

	// Password change state
	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isChangingPassword, setIsChangingPassword] = useState(false)
	const [showPasswordForm, setShowPasswordForm] = useState(false)
	const coverInputRef = useRef<HTMLInputElement>(null)
	const avatarInputRef = useRef<HTMLInputElement>(null)

	// Theme management
	type ThemeMode = 'light' | 'dark' | 'system'
	const [theme, setThemeState] = useState<ThemeMode>('light')

	const handleTabChange = useCallback(
		(tab: SettingsTab) => {
			setActiveTab(tab)
			const targetPath =
				tab === 'account' ? PATHS.SETTINGS : `${PATHS.SETTINGS}?tab=${tab}`
			router.replace(targetPath, { scroll: false })
		},
		[router],
	)

	useEffect(() => {
		const requestedTab = searchParams.get('tab')
		if (isSettingsTab(requestedTab) && requestedTab !== activeTab) {
			setActiveTab(requestedTab)
		}
	}, [activeTab, searchParams])

	useEffect(() => {
		const stored = getStorageItem('theme') as ThemeMode | null
		if (stored === 'dark' || stored === 'light' || stored === 'system') {
			setThemeState(stored)
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			setThemeState('system')
		}
	}, [])

	const setTheme = useCallback((mode: ThemeMode) => {
		setThemeState(mode)
		setStorageItem('theme', mode)
		const root = document.documentElement
		if (mode === 'dark') {
			root.classList.add('dark')
		} else if (mode === 'light') {
			root.classList.remove('dark')
		} else {
			// system: follow OS preference
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				root.classList.add('dark')
			} else {
				root.classList.remove('dark')
			}
		}
	}, [])

	// Listen for OS theme changes when in 'system' mode
	useEffect(() => {
		if (theme !== 'system') return
		const mq = window.matchMedia('(prefers-color-scheme: dark)')
		const handler = (e: MediaQueryListEvent) => {
			document.documentElement.classList.toggle('dark', e.matches)
		}
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [theme])

	useEffect(() => {
		if (!user) return
		let cancelled = false

		setDisplayName(user.displayName || '')
		setBio(user.bio || '')
		setCoverImageUrl(user.coverImageUrl)
		setAvatarUrl(user.avatarUrl)

		const loadSettings = async () => {
			try {
				const response = await getAllSettings()
				if (cancelled) return
				if (response.success && response.data) {
					setSettings(response.data)
					// Sync push timerAlerts preference to localStorage for use outside settings page
					setTimerAlertsEnabled(
						response.data.notifications?.push?.timerAlerts ?? true,
					)
					// Sync sound effects setting to localStorage for audio.ts
					setAudioEnabled(response.data.app?.soundEffects ?? true)
				} else {
					setSettings({
						userId: user?.userId || '',
						...DEFAULT_USER_SETTINGS,
					} as UserSettings)
				}
			} catch (error) {
				if (cancelled) return
				logDevError('Failed to load settings:', error)
				setLoadError(true)
				toast.error(t('toastLoadFailed'))
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		loadSettings()
		return () => {
			cancelled = true
		}
	}, [user, t])

	// Fetch verification status when verification tab is opened
	useEffect(() => {
		if (activeTab !== 'verification') return
		let cancelled = false
		const fetchVerification = async () => {
			try {
				const res = await getVerificationStatus()
				if (cancelled) return
				if (res.success && res.data) {
					setVerificationStatus(res.data)
				}
			} catch (error) {
				if (cancelled) return
				logDevError('Failed to fetch verification status:', error)
			}
		}
		fetchVerification()
		return () => {
			cancelled = true
		}
	}, [activeTab])

	const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const previousCoverImageUrl = user?.coverImageUrl

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error(t('toastSelectImage'))
			return
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error(t('toastImageTooLarge'))
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
					toast.success(t('toastCoverUpdated'))
				} else {
					toast.error(t('toastCoverSaveFailed'))
					setCoverImageUrl(previousCoverImageUrl)
				}
			} else {
				toast.error(t('toastUploadFailed'))
				setCoverImageUrl(previousCoverImageUrl)
			}
		} catch (error) {
			logDevError('Cover upload error:', error)
			toast.error(t('toastCoverUploadFailed'))
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
				toast.success(t('toastProfileUpdated'))
			} else {
				toast.error(t('toastProfileUpdateFailed'))
			}
		} catch (error) {
			logDevError('Failed to update profile:', error)
			toast.error(t('toastProfileUpdateFailed'))
		} finally {
			setIsSaving(false)
		}
	}

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const previousAvatarUrl = user?.avatarUrl

		if (!file.type.startsWith('image/')) {
			toast.error(t('toastSelectImage'))
			return
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error(t('toastImageTooLarge'))
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
					toast.success(t('toastAvatarUpdated'))
				} else {
					toast.error(t('toastAvatarSaveFailed'))
					setAvatarUrl(previousAvatarUrl)
				}
			} else {
				toast.error(t('toastUploadFailed'))
				setAvatarUrl(previousAvatarUrl)
			}
		} catch (error) {
			logDevError('Avatar upload error:', error)
			toast.error(t('toastAvatarUploadFailed'))
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
					toast.success(t('toastPrivacyUpdated'))
				} else {
					setSettings(previousSettings)
					toast.error(t('toastPrivacyFailed'))
				}
			} catch (error) {
				logDevError('Failed to update privacy settings:', error)
				setSettings(previousSettings)
				toast.error(t('toastPrivacyFailed'))
			}
		},
		[settings, t],
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
					toast.success(t('toastNotificationsUpdated'))
				} else {
					setSettings(previousSettings)
					toast.error(t('toastNotificationsFailed'))
				}
			} catch (error) {
				logDevError('Failed to update notification settings:', error)
				setSettings(previousSettings)
				toast.error(t('toastNotificationsFailed'))
			}
		},
		[settings, t],
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
					toast.success(t('toastCookingPrefsUpdated'))
				} else {
					setSettings(previousSettings)
					toast.error(t('toastCookingPrefsFailed'))
				}
			} catch (error) {
				logDevError('Failed to update cooking preferences:', error)
				setSettings(previousSettings)
				toast.error(t('toastCookingPrefsFailed'))
			}
		},
		[settings, t],
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
					toast.success(t('toastAppPrefsUpdated'))
				} else {
					setSettings(previousSettings)
					toast.error(t('toastAppPrefsFailed'))
				}
			} catch (error) {
				logDevError('Failed to update app preferences:', error)
				setSettings(previousSettings)
				toast.error(t('toastAppPrefsFailed'))
			}
		},
		[settings, t],
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
			toast.error(t('toastSignOutFailed'))
		} finally {
			// Always clear local state and redirect (security: never leave stale session)
			logout()
			router.push(PATHS.AUTH.SIGN_IN)
		}
	}

	const handleDeleteAccount = async () => {
		if (deleteConfirmText !== 'DELETE') return
		try {
			const res = await deleteAccount()
			if (res.success) {
				toast.success(t('toastAccountDeleted'))
				logout()
				router.push(PATHS.AUTH.SIGN_IN)
			} else {
				toast.error(res.message || t('toastDeleteFailed'))
			}
		} catch {
			toast.error(t('toastDeleteFailed'))
		}
	}

	const handleExportData = async () => {
		setIsExportingData(true)
		try {
			const res = await exportUserData()
			if (res.success && res.data) {
				const blob = new Blob([JSON.stringify(res.data, null, 2)], {
					type: 'application/json',
				})
				const url = URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = `chefkix-data-export-${new Date().toISOString().slice(0, 10)}.json`
				document.body.appendChild(a)
				a.click()
				document.body.removeChild(a)
				URL.revokeObjectURL(url)
				toast.success(t('toastDataExported'))
			} else {
				toast.error(res.message || t('toastExportFailed'))
			}
		} catch {
			toast.error(t('toastExportFailed'))
		} finally {
			setIsExportingData(false)
		}
	}

	if (isLoading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					{/* Settings skeleton */}
					<div className='mb-8 flex items-center gap-3'>
						<Skeleton className='size-12 rounded-2xl' />
						<Skeleton className='h-7 w-28' />
					</div>
					{/* Tab bar skeleton */}
					<div className='mb-6 flex gap-2'>
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className='h-10 w-24 rounded-xl' />
						))}
					</div>
					{/* Settings cards skeleton */}
					<div className='space-y-6'>
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className='rounded-2xl border border-border-subtle bg-bg-card p-6'
							>
								<Skeleton className='mb-4 h-5 w-1/4' />
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<Skeleton className='h-4 w-1/3' />
										<Skeleton className='h-6 w-11 rounded-full' />
									</div>
									<div className='flex items-center justify-between'>
										<Skeleton className='h-4 w-2/5' />
										<Skeleton className='h-6 w-11 rounded-full' />
									</div>
								</div>
							</div>
						))}
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	if (loadError) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<ErrorState
						title={t('toastLoadFailed')}
						message={t('toastLoadFailedDesc')}
						onRetry={() => {
							setLoadError(false)
							setIsLoading(true)
						}}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Header - Unified icon-box pattern */}
				<PageHeader
					icon={Settings}
					title={t('title')}
					subtitle={t('subtitle')}
					gradient='gray'
					iconAnimation={{ rotate: 45 }}
				/>

				<div className='grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]'>
					{/* Sidebar Tabs */}
					<motion.nav
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={TRANSITION_SPRING}
						className='relative'
					>
						<div
							role='tablist'
							aria-label={t('title')}
							className='flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 lg:flex-col rounded-radius border border-border-subtle bg-bg-card p-1.5 shadow-card h-fit lg:sticky lg:top-24 scrollbar-hide lg:p-2 lg:gap-2'
						>
							{TABS.map(tab => {
								const Icon = tab.icon
								const isActive = activeTab === tab.id
								return (
									<motion.button
										type='button'
										key={tab.id}
										role='tab'
										aria-selected={isActive}
										aria-controls={`tabpanel-${tab.id}`}
										whileHover={NAV_ITEM_HOVER}
										whileTap={LIST_ITEM_TAP}
										onClick={() => handleTabChange(tab.id)}
										title={t(tab.labelKey)}
										className={cn(
											'flex min-w-[4.25rem] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center transition-all focus-visible:ring-2 focus-visible:ring-brand/50 lg:min-w-0 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-lg lg:px-4 lg:py-3 lg:text-left',
											isActive
												? 'bg-brand/10 text-brand font-semibold'
												: 'text-text-secondary hover:bg-bg-hover hover:text-text',
										)}
									>
										<Icon
											className={cn(
												'size-5 flex-shrink-0',
												isActive ? 'text-brand' : 'text-text-secondary',
											)}
										/>
										<p className='text-xs font-medium leading-tight lg:text-sm'>
											{t(tab.labelKey)}
										</p>
									</motion.button>
								)
							})}

							{/* Divider + Sign Out */}
							<div className='hidden lg:block my-1 h-px bg-border-subtle' />
							<div className='lg:hidden my-1 w-px bg-border-subtle' />
							<motion.button
								type='button'
								whileHover={isLoggingOut ? {} : NAV_ITEM_HOVER}
								whileTap={isLoggingOut ? {} : LIST_ITEM_TAP}
								onClick={handleLogout}
								disabled={isLoggingOut}
								className='flex min-w-[4.25rem] flex-shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-2 text-center text-error transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50 hover:bg-error/10 lg:min-w-0 lg:flex-row lg:gap-3 lg:rounded-lg lg:px-4 lg:py-3 lg:text-left'
							>
								{isLoggingOut ? (
									<Loader2 className='size-5 flex-shrink-0 animate-spin' />
								) : (
									<LogOut className='size-5 flex-shrink-0' />
								)}
								<p className='text-xs font-medium leading-tight lg:text-sm'>
									{isLoggingOut ? t('signingOut') : t('signOut')}
								</p>
							</motion.button>
						</div>
						{/* Scroll fade indicator (mobile only) */}
						<div className='pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-bg-card to-transparent lg:hidden' />
					</motion.nav>

					{/* Content Area */}
					<AnimatePresence mode='wait'>
						<motion.div
							key={activeTab}
							id={`tabpanel-${activeTab}`}
							role='tabpanel'
							aria-labelledby={activeTab}
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
										title={t('profileInfo')}
										description={t('profileInfoDesc')}
									>
										<div className='space-y-4'>
											{/* Cover Photo Upload */}
											<div className='grid gap-2'>
												<Label id='settings-cover-label'>
													{t('coverPhoto')}
												</Label>
												<div
													className='relative'
													aria-labelledby='settings-cover-label'
												>
													<div
														className={cn(
															'relative h-28 w-full overflow-hidden rounded-lg border-2 bg-gradient-warm transition-all sm:h-32',
															coverImageUrl
																? 'border-border-subtle'
																: 'border-dashed border-border-subtle',
															isUploadingCover && 'opacity-60',
														)}
													>
														{coverImageUrl ? (
															<Image
																src={coverImageUrl}
																alt='Cover'
																fill
																sizes='100vw'
																className='object-cover'
																onError={e => {
																	;(e.target as HTMLImageElement).src =
																		'/default-cover.svg'
																}}
															/>
														) : (
															<div className='flex h-full items-center justify-center'>
																<ImagePlus className='size-8 text-text-secondary' />
															</div>
														)}
														{isUploadingCover && (
															<div className='absolute inset-0 flex items-center justify-center bg-bg/50'>
																<Loader2 className='size-6 animate-spin text-brand' />
															</div>
														)}
													</div>
													<Button
														type='button'
														variant='outline'
														size='sm'
														className='absolute bottom-2 right-2 hidden gap-1.5 sm:inline-flex'
														onClick={() => coverInputRef.current?.click()}
														disabled={isUploadingCover}
													>
														<Camera className='size-4' />
														{coverImageUrl
															? t('changeCover')
															: t('uploadCover')}
													</Button>
													<input
														ref={coverInputRef}
														type='file'
														accept='image/*'
														aria-label={
															coverImageUrl
																? t('changeCover')
																: t('uploadCover')
														}
														className='hidden'
														onChange={handleCoverUpload}
													/>
												</div>
												<Button
													type='button'
													variant='outline'
													size='sm'
													className='w-full gap-1.5 sm:hidden'
													onClick={() => coverInputRef.current?.click()}
													disabled={isUploadingCover}
												>
													<Camera className='size-4' />
													{coverImageUrl
														? t('changeCoverMobile')
														: t('uploadCoverMobile')}
												</Button>
												<p className='text-xs text-text-muted'>
													{t('coverPhotoHint')}
												</p>
											</div>

											{/* Avatar Upload */}
											<div className='grid gap-2'>
												<Label id='settings-avatar-label'>
													{t('profilePhoto')}
												</Label>
												<div
													className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4'
													aria-labelledby='settings-avatar-label'
												>
													<div
														className={cn(
															'relative size-20 overflow-hidden rounded-full border-2 border-border-subtle bg-bg-elevated transition-all',
															!avatarUrl && 'border-dashed',
															isUploadingAvatar && 'opacity-60',
														)}
													>
														{avatarUrl ? (
															<Image
																src={avatarUrl}
																alt='Avatar'
																fill
																sizes='80px'
																className='object-cover'
																onError={e => {
																	;(e.target as HTMLImageElement).src =
																		'/placeholder-avatar.svg'
																}}
															/>
														) : (
															<div className='flex size-full items-center justify-center'>
																<User className='size-8 text-text-secondary' />
															</div>
														)}
														{isUploadingAvatar && (
															<div className='absolute inset-0 flex items-center justify-center bg-bg/50'>
																<Loader2 className='size-5 animate-spin text-brand' />
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
															{avatarUrl ? t('changePhoto') : t('uploadPhoto')}
														</Button>
														<p className='text-xs text-text-muted'>
															{t('photoHint')}
														</p>
													</div>
													<input
														ref={avatarInputRef}
														type='file'
														accept='image/*'
														aria-label={
															avatarUrl ? t('changePhoto') : t('uploadPhoto')
														}
														className='hidden'
														onChange={handleAvatarUpload}
													/>
												</div>
											</div>

											<div className='grid gap-2'>
												<Label htmlFor='displayName'>{t('displayName')}</Label>
												<Input
													id='displayName'
													value={displayName}
													onChange={e => setDisplayName(e.target.value)}
													placeholder={t('displayNamePlaceholder')}
													maxLength={50}
												/>
											</div>
											<div className='grid gap-2'>
												<Label htmlFor='email'>{t('emailLabel')}</Label>
												<Input
													id='email'
													value={user?.email || ''}
													disabled
													className='bg-bg-elevated'
												/>
												<p className='text-xs text-text-muted'>
													{t('emailCannotChange')}
												</p>
												<a
													href='mailto:support@chefkix.com?subject=Email%20Change%20Request'
													className='inline-flex w-fit items-center text-xs font-semibold text-brand hover:underline'
												>
													{t('contactSupport')}
												</a>
											</div>
											<div className='grid gap-2'>
												<Label htmlFor='bio'>{t('bio')}</Label>
												<Textarea
													id='bio'
													value={bio}
													onChange={e => setBio(e.target.value)}
													placeholder={t('bioPlaceholder')}
													maxLength={160}
												/>
												<p
													className={cn(
														'tabular-nums text-xs text-right',
														bio.length >= 160
															? 'font-semibold text-error'
															: bio.length > 128
																? 'text-warning'
																: 'text-text-muted',
													)}
												>
													{bio.length}/160
												</p>
											</div>
											<Button
												onClick={handleSaveProfile}
												disabled={
													isSaving || isUploadingAvatar || isUploadingCover
												}
												className='w-full sm:w-auto'
											>
												{isSaving ? (
													<Loader2 className='mr-2 size-4 animate-spin' />
												) : (
													<Save className='mr-2 size-4' />
												)}
												{isUploadingAvatar || isUploadingCover
													? t('uploading')
													: t('saveProfile')}
											</Button>
										</div>
									</SettingsCard>

									<SettingsCard
										title={t('accountSecurity')}
										description={t('accountSecurityDesc')}
									>
										{!showPasswordForm ? (
											<Button
												variant='outline'
												className='w-full sm:w-auto'
												onClick={() => setShowPasswordForm(true)}
											>
												<Shield className='mr-2 size-4' />
												{t('changePassword')}
											</Button>
										) : (
											<div className='space-y-4'>
												<div className='space-y-2'>
													<Label htmlFor='oldPassword'>
														{t('currentPassword')}
													</Label>
													<Input
														id='oldPassword'
														type='password'
														value={oldPassword}
														onChange={e => setOldPassword(e.target.value)}
														placeholder={t('currentPasswordPlaceholder')}
														autoComplete='current-password'
													/>
												</div>
												<div className='space-y-2'>
													<Label htmlFor='newPassword'>
														{t('newPasswordLabel')}
													</Label>
													<Input
														id='newPassword'
														type='password'
														value={newPassword}
														onChange={e => setNewPassword(e.target.value)}
														placeholder={t('newPasswordPlaceholder')}
														autoComplete='new-password'
													/>
												</div>
												<div className='space-y-2'>
													<Label htmlFor='confirmPassword'>
														{t('confirmPasswordLabel')}
													</Label>
													<Input
														id='confirmPassword'
														type='password'
														value={confirmPassword}
														onChange={e => setConfirmPassword(e.target.value)}
														placeholder={t('confirmPasswordPlaceholder')}
														autoComplete='new-password'
													/>
												</div>
												{newPassword &&
													confirmPassword &&
													newPassword !== confirmPassword && (
														<p className='text-xs text-destructive'>
															{t('passwordsDoNotMatch')}
														</p>
													)}
												<div className='flex gap-2'>
													<Button
														disabled={
															isChangingPassword ||
															!oldPassword ||
															!newPassword ||
															newPassword.length < 8 ||
															newPassword !== confirmPassword
														}
														onClick={async () => {
															setIsChangingPassword(true)
															try {
																const res = await changePassword({
																	oldPassword,
																	newPassword,
																})
																if (res.success) {
																	toast.success(t('toastPasswordChanged'))
																	setOldPassword('')
																	setNewPassword('')
																	setConfirmPassword('')
																	setShowPasswordForm(false)
																} else {
																	toast.error(
																		res.message || t('toastPasswordFailed'),
																	)
																}
															} catch {
																toast.error(t('toastPasswordFailed'))
															} finally {
																setIsChangingPassword(false)
															}
														}}
													>
														{isChangingPassword ? (
															<Loader2 className='mr-2 size-4 animate-spin' />
														) : (
															<Save className='mr-2 size-4' />
														)}
														{isChangingPassword
															? t('changingPassword')
															: t('updatePassword')}
													</Button>
													<Button
														variant='outline'
														onClick={() => {
															setShowPasswordForm(false)
															setOldPassword('')
															setNewPassword('')
															setConfirmPassword('')
														}}
													>
														Cancel
													</Button>
												</div>
											</div>
										)}
									</SettingsCard>

									{/* Data & Account Management */}
									<SettingsCard
										title={t('yourData')}
										description={t('yourDataDesc')}
									>
										<div className='space-y-4'>
											<div className='flex items-center justify-between'>
												<div>
													<p className='text-sm font-medium text-text'>
														{t('exportYourData')}
													</p>
													<p className='text-xs text-text-secondary'>
														{t('exportDataDesc')}
													</p>
												</div>
												<Button
													variant='outline'
													size='sm'
													onClick={handleExportData}
													disabled={isExportingData}
												>
													{isExportingData ? (
														<Loader2 className='mr-2 size-4 animate-spin' />
													) : (
														<Download className='mr-2 size-4' />
													)}
													{isExportingData ? t('exporting') : t('exportData')}
												</Button>
											</div>
										</div>
									</SettingsCard>

									{/* Danger Zone */}
									<SettingsCard
										title={t('dangerZone')}
										description={t('dangerZoneDesc')}
										className='border-error/30'
									>
										<div className='space-y-4'>
											<p className='text-sm text-text-secondary'>
												{t('deleteWarning')}
											</p>
											{!showDeleteConfirm ? (
												<Button
													variant='outline'
													className='border-error/50 text-error hover:bg-error/10'
													onClick={() => setShowDeleteConfirm(true)}
												>
													<Trash2 className='mr-2 size-4' />
													{t('deleteAccount')}
												</Button>
											) : (
												<div className='space-y-3 rounded-radius border border-error/30 bg-error/5 p-4'>
													<p className='text-sm font-medium text-error'>
														{t('deleteConfirmInstruction')}
													</p>
													<Input
														value={deleteConfirmText}
														onChange={e => setDeleteConfirmText(e.target.value)}
														placeholder={t('deleteConfirmPlaceholder')}
														aria-label={t('deleteConfirmInstruction')}
														className='max-w-xs'
													/>
													<div className='flex gap-2'>
														<Button
															variant='outline'
															size='sm'
															onClick={() => {
																setShowDeleteConfirm(false)
																setDeleteConfirmText('')
															}}
														>
															{t('cancelEdit')}
														</Button>
														<Button
															size='sm'
															disabled={deleteConfirmText !== 'DELETE'}
															onClick={handleDeleteAccount}
															title={
																deleteConfirmText !== 'DELETE'
																	? t('deleteConfirmInstruction')
																	: undefined
															}
															className='bg-error text-white hover:bg-error/90 disabled:opacity-50'
														>
															<Trash2 className='mr-2 size-4' />
															{t('permanentlyDelete')}
														</Button>
													</div>
												</div>
											)}
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
										title={t('profileVisibility')}
										description={t('profileVisibilityDesc')}
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
													{t('whoCanSeeProfile')}
												</Label>
												<ButtonGroup
													options={VISIBILITY_OPTIONS.map(o => ({
														...o,
														label: t(o.labelKey),
													}))}
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
													{t('whoCanMessage')}
												</Label>
												<ButtonGroup
													options={MESSAGE_OPTIONS.map(o => ({
														...o,
														label: t(o.labelKey),
													}))}
													value={settings.privacy.allowMessagesFrom}
													onChange={v =>
														handleUpdatePrivacy({ allowMessagesFrom: v })
													}
												/>
											</div>
										</div>
									</SettingsCard>

									<SettingsCard title={t('privacyToggles')}>
										<div>
											<ToggleRow
												label={t('showOnLeaderboard')}
												description={t('showOnLeaderboardDesc')}
												icon={Trophy}
												checked={settings.privacy.showOnLeaderboard}
												onCheckedChange={checked =>
													handleUpdatePrivacy({ showOnLeaderboard: checked })
												}
											/>
											<ToggleRow
												label={t('allowFollowers')}
												description={t('allowFollowersDesc')}
												icon={Users}
												checked={settings.privacy.allowFollowers}
												onCheckedChange={checked =>
													handleUpdatePrivacy({ allowFollowers: checked })
												}
											/>
											<ToggleRow
												label={t('showCookingActivity')}
												description={t('showCookingActivityDesc')}
												icon={ChefHat}
												checked={settings.privacy.showCookingActivity}
												onCheckedChange={checked =>
													handleUpdatePrivacy({ showCookingActivity: checked })
												}
											/>
										</div>
									</SettingsCard>

									{/* Data & Analytics Card */}
									<SettingsCard
										title={t('dataAndAnalytics')}
										description={t('dataAndAnalyticsDesc')}
									>
										<div>
											<ToggleRow
												label={t('usageAnalytics')}
												description={t('usageAnalyticsDesc')}
												icon={Eye}
												checked={!isTrackingOptedOut()}
												onCheckedChange={checked => {
													setTrackingOptOut(!checked)
													// Force re-render
													setSettings(prev => (prev ? { ...prev } : prev))
												}}
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
										title={t('emailNotifications')}
										description={t('emailNotificationsDesc')}
									>
										<div>
											<ToggleRow
												label={t('weeklyDigest')}
												description={t('weeklyDigestDesc')}
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
												label={t('newFollower')}
												description={t('newFollowerDesc')}
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
												label={t('recipeMilestones')}
												description={t('recipeMilestonesDesc')}
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
										title={t('inAppNotifications')}
										description={t('inAppNotificationsDesc')}
									>
										<div>
											<ToggleRow
												label={t('xpAndLevelUps')}
												description={t('xpAndLevelUpsDesc')}
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
												label={t('badges')}
												description={t('badgesDesc')}
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
												label={t('socialActivity')}
												description={t('socialActivityDesc')}
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
												label={t('newFollowers')}
												description={t('newFollowerDesc')}
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
												label={t('postReminders')}
												description={t('postRemindersDesc')}
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
												label={t('streakWarnings')}
												description={t('streakWarningsDesc')}
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
												label={t('dailyChallenge')}
												description={t('dailyChallengeDesc')}
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
										title={t('pushNotifications')}
										description={t('pushNotificationsDesc')}
									>
										<div>
											<ToggleRow
												label={t('enablePush')}
												description={
													!isNotificationSupported()
														? t('pushNotSupported')
														: getNotificationPermission() === 'denied'
															? t('pushBlocked')
															: t('pushDefault')
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
															toast.error(t('pushPermissionDenied'))
															return
														}
														// Register FCM token with backend for real push delivery
														const fcmToken = await getFCMToken()
														if (fcmToken) {
															await registerPushToken(fcmToken)
														}
													} else {
														// Unregister FCM token when disabling push
														await unregisterPushToken()
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
												label={t('timerAlerts')}
												description={t('timerAlertsDesc')}
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
										title={t('skillLevel')}
										description={t('skillLevelDesc')}
									>
										<ButtonGroup
											options={SKILL_LEVELS.map(o => ({
												...o,
												label: t(o.labelKey),
											}))}
											value={settings.cooking.skillLevel}
											onChange={v => handleUpdateCooking({ skillLevel: v })}
										/>
									</SettingsCard>

									<SettingsCard
										title={t('dietaryRestrictions')}
										description={t('dietaryRestrictionsDesc')}
									>
										<ChipSelect
											options={dietaryOptions}
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
										title={t('allergies')}
										description={t('allergiesDesc')}
									>
										<ChipSelect
											options={allergyOptions}
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
													{t('allergyWarning', {
														allergies: settings.cooking.allergies.join(', '),
													})}
												</span>
											</div>
										)}
									</SettingsCard>

									<SettingsCard
										title={t('preferredCuisines')}
										description={t('preferredCuisinesDesc')}
									>
										<ChipSelect
											options={cuisineOptions}
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

									<SettingsCard title={t('cuisinePreferences')}>
										<div className='space-y-4'>
											<p className='text-sm text-text-secondary'>
												{t('cuisinePreferencesInfo')}
											</p>
											{user?.preferences && user.preferences.length > 0 ? (
												<div className='flex flex-wrap gap-2'>
													{user.preferences.map(pref => (
														<span
															key={pref}
															className='rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand'
														>
															{pref}
														</span>
													))}
												</div>
											) : (
												<p className='text-sm text-text-muted italic'>
													{t('noPreferencesYet')}
												</p>
											)}
											<motion.button
												type='button'
												onClick={() => setShowInterestPicker(true)}
												whileHover={LIST_ITEM_HOVER}
												whileTap={LIST_ITEM_TAP}
												className='flex items-center gap-2 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-brand/50'
											>
												<Sparkles className='size-4' />
												{user?.preferences && user.preferences.length > 0
													? t('editCuisinePreferences')
													: t('setCuisinePreferences')}
											</motion.button>
										</div>
									</SettingsCard>

									<SettingsCard title={t('cookingPreferences')}>
										<div className='space-y-6'>
											<div>
												<Label
													htmlFor='settings-default-servings'
													className='mb-3 block'
												>
													{t('defaultServings')}
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
													{t('maxCookingTime')}
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
														placeholder={t('noLimit')}
														className='w-24'
													/>
													<span className='text-sm text-text-secondary'>
														{t('maxCookingTimeHint')}
													</span>
												</div>
											</div>
											<div role='group' aria-labelledby='settings-units-label'>
												<Label id='settings-units-label' className='mb-3 block'>
													{t('measurementUnits')}
												</Label>
												<ButtonGroup
													options={[
														{
															value: 'metric' as MeasurementUnits,
															label: t('metric'),
														},
														{
															value: 'imperial' as MeasurementUnits,
															label: t('imperial'),
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
										title={t('creatorVerification')}
										description={t('creatorVerificationDesc')}
									>
										<div className='space-y-4'>
											{verificationStatus ? (
												<div className='space-y-3'>
													<div className='flex items-center gap-2'>
														<span className='text-sm font-medium text-text-secondary'>
															{t('statusLabel')}
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
																{t('verifiedSuccess')}
															</p>
														</div>
													)}
													{verificationStatus.status === 'REJECTED' &&
														verificationStatus.adminNotes && (
															<p className='text-sm text-text-secondary'>
																<span className='font-medium'>
																	{t('feedbackLabel')}
																</span>{' '}
																{verificationStatus.adminNotes}
															</p>
														)}
													{verificationStatus.status === 'PENDING' && (
														<p className='text-sm text-text-muted'>
															{t('verificationPending')}
														</p>
													)}
												</div>
											) : (
												<div className='space-y-4'>
													<p className='text-sm leading-relaxed text-text-secondary'>
														{t('verificationInfo')}
														creator. Share recipes, build your following, and
														apply when you&apos;re ready.
													</p>
													<div>
														<Label className='mb-1.5 block text-sm font-medium'>
															{t('whyVerified')}
														</Label>
														<Textarea
															value={verificationReason}
															onChange={e =>
																setVerificationReason(e.target.value)
															}
															placeholder={t('whyVerifiedPlaceholder')}
															className='min-h-20 resize-none'
															maxLength={500}
														/>
														<p
															className={cn(
																'mt-1 tabular-nums text-right text-xs',
																verificationReason.length >= 500
																	? 'font-semibold text-error'
																	: verificationReason.length > 400
																		? 'text-warning'
																		: 'text-text-muted',
															)}
														>
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
																	toast.success(t('applicationSubmitted'))
																} else {
																	toast.error(
																		res.message ||
																			'Failed to submit application',
																	)
																}
															} catch {
																toast.error(t('verificationFailed'))
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
														{t('applyForVerification')}
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
									<SettingsCard title={t('theme')} description={t('themeDesc')}>
										<div className='flex gap-3'>
											{(
												[
													{
														mode: 'light' as ThemeMode,
														icon: Sun,
														label: t('themeLight'),
													},
													{
														mode: 'dark' as ThemeMode,
														icon: Moon,
														label: t('themeDark'),
													},
													{
														mode: 'system' as ThemeMode,
														icon: Monitor,
														label: t('themeSystem'),
													},
												] as const
											).map(({ mode, icon: ThemeIcon, label }) => (
												<button
													type='button'
													key={mode}
													onClick={() => setTheme(mode)}
													className={cn(
														'flex flex-1 flex-col items-center gap-2 rounded-radius border p-3 transition-all',
														theme === mode
															? 'border-brand bg-brand/10 text-brand shadow-card'
															: 'border-border-subtle bg-bg text-text-secondary hover:border-border hover:bg-bg-elevated',
													)}
												>
													<ThemeIcon className='size-5' />
													<span className='text-xs font-medium'>{label}</span>
												</button>
											))}
										</div>
									</SettingsCard>

									<SettingsCard title={t('soundAndMotion')}>
										<div>
											<ToggleRow
												label={t('soundEffects')}
												description={t('soundEffectsDesc')}
												icon={Volume2}
												checked={settings.app.soundEffects}
												onCheckedChange={checked => {
													setAudioEnabled(checked)
													handleUpdateApp({ soundEffects: checked })
												}}
											/>
											{/* Test Timer Sound Button */}
											<div className='flex items-center justify-between border-b border-border-subtle py-3'>
												<div className='flex items-center gap-3'>
													<Timer className='size-4 text-text-secondary' />
													<div>
														<p className='text-sm font-medium text-text'>
															{t('timerNotificationSound')}
														</p>
														<p className='text-xs text-text-secondary'>
															{t('timerNotificationSoundDesc')}
														</p>
													</div>
												</div>
												<Button
													variant='outline'
													size='sm'
													onClick={() => {
														if (!settings?.app.soundEffects) {
															toast.info(t('soundDisabledHint'))
															return
														}
														playTimerChime()
														toast.success(t('timerSoundPlayed'))
													}}
													className='shrink-0'
												>
													<Volume2 className='mr-2 size-4' />
													Test Sound
												</Button>
											</div>
											<ToggleRow
												label={t('reducedMotion')}
												description={t('reducedMotionDesc')}
												icon={Eye}
												checked={settings.app.reducedMotion}
												onCheckedChange={checked => {
													setMotionPreference(checked ? 'reduced' : 'auto')
													handleUpdateApp({ reducedMotion: checked })
												}}
											/>
											<ToggleRow
												label={t('autoPlayVideos')}
												description={t('autoPlayVideosDesc')}
												icon={Smartphone}
												checked={settings.app.autoPlayVideos}
												onCheckedChange={checked =>
													handleUpdateApp({ autoPlayVideos: checked })
												}
											/>
										</div>
									</SettingsCard>

									<SettingsCard title={t('cookingSession')}>
										<div>
											<ToggleRow
												label={t('keepScreenOn')}
												description={t('keepScreenOnDesc')}
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

				<div className='pb-40 md:pb-8' />
			</PageContainer>

			{/* Interest Picker Modal */}
			<AnimatePresence>
				{showInterestPicker && (
					<InterestPicker
						onComplete={() => setShowInterestPicker(false)}
						dismissible={true}
						editMode={true}
					/>
				)}
			</AnimatePresence>
		</PageTransition>
	)
}
