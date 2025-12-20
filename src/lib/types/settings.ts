/**
 * Settings types - matches BE UserSettings entity
 * @see chefkix-be/src/main/java/com/chefkix/entity/UserSettings.java
 * @see vision_and_spec/16-settings-preferences.txt
 */

// ================================
// PRIVACY SETTINGS
// ================================

export type ProfileVisibility = 'public' | 'friends_only' | 'private'
export type AllowMessagesFrom = 'everyone' | 'friends' | 'nobody'

export interface PrivacySettings {
	/** public | friends_only | private */
	profileVisibility: ProfileVisibility
	/** (Future) Show "cooking now" status to friends */
	showCookingActivity: boolean
	/** Appear in global rankings */
	showOnLeaderboard: boolean
	/** Anyone can follow you */
	allowFollowers: boolean
	/** everyone | friends | nobody */
	allowMessagesFrom: AllowMessagesFrom
}

// ================================
// NOTIFICATION SETTINGS
// ================================

export interface EmailNotificationSettings {
	/** Weekly activity summary */
	weeklyDigest: boolean
	/** Email on new follower */
	newFollower: boolean
	/** When your recipe hits milestones (10/50/100 cooks) */
	recipeMilestone: boolean
}

export interface InAppNotificationSettings {
	/** XP and level up notifications */
	xpAndLevelUps: boolean
	/** Badge unlock notifications */
	badges: boolean
	/** Likes and comments on posts */
	social: boolean
	/** New follower notifications */
	followers: boolean
	/** "Post your attempt!" reminders */
	postDeadline: boolean
	/** "Cook to keep streak!" warnings */
	streakWarning: boolean
	/** Today's challenge notification */
	dailyChallenge: boolean
}

export interface PushNotificationSettings {
	/** Enable push notifications */
	enabled: boolean
	/** Timer completion alerts */
	timerAlerts: boolean
}

export interface NotificationSettings {
	email: EmailNotificationSettings
	inApp: InAppNotificationSettings
	push: PushNotificationSettings
}

// ================================
// COOKING PREFERENCES
// ================================

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type MeasurementUnits = 'metric' | 'imperial'

export interface CookingPreferences {
	/** beginner | intermediate | advanced | expert */
	skillLevel: SkillLevel
	/** e.g., ['vegetarian', 'vegan', 'gluten-free'] */
	dietaryRestrictions: string[]
	/** e.g., ['nuts', 'dairy', 'shellfish'] */
	allergies: string[]
	/** e.g., ['cilantro', 'olives'] */
	dislikedIngredients: string[]
	/** e.g., ['Italian', 'Japanese', 'Mexican'] */
	preferredCuisines: string[]
	/** Max cooking time in minutes, null = no limit */
	maxCookingTimeMinutes: number | null
	/** Default servings for scaling */
	defaultServings: number
	/** metric | imperial */
	measurementUnits: MeasurementUnits
}

// ================================
// APP PREFERENCES
// ================================

export type Theme = 'light' | 'dark' | 'system'

export interface AppPreferences {
	/** light | dark | system */
	theme: Theme
	/** e.g., 'en', 'vi' */
	language: string
	/** Auto-play recipe step videos */
	autoPlayVideos: boolean
	/** Disable animations for accessibility */
	reducedMotion: boolean
	/** Timer dings, XP sounds */
	soundEffects: boolean
	/** Prevent sleep during cooking session */
	keepScreenOn: boolean
}

// ================================
// COMBINED USER SETTINGS
// ================================

export interface UserSettings {
	id?: string
	userId: string
	privacy: PrivacySettings
	notifications: NotificationSettings
	cooking: CookingPreferences
	app: AppPreferences
}

// ================================
// DEFAULT VALUES (for client-side initialization)
// ================================

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
	profileVisibility: 'public',
	showCookingActivity: true,
	showOnLeaderboard: true,
	allowFollowers: true,
	allowMessagesFrom: 'friends',
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
	email: {
		weeklyDigest: true,
		newFollower: false,
		recipeMilestone: true,
	},
	inApp: {
		xpAndLevelUps: true,
		badges: true,
		social: true,
		followers: true,
		postDeadline: true,
		streakWarning: true,
		dailyChallenge: true,
	},
	push: {
		enabled: false,
		timerAlerts: true,
	},
}

export const DEFAULT_COOKING_PREFERENCES: CookingPreferences = {
	skillLevel: 'beginner',
	dietaryRestrictions: [],
	allergies: [],
	dislikedIngredients: [],
	preferredCuisines: [],
	maxCookingTimeMinutes: null,
	defaultServings: 2,
	measurementUnits: 'metric',
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
	theme: 'system',
	language: 'en',
	autoPlayVideos: true,
	reducedMotion: false,
	soundEffects: true,
	keepScreenOn: true,
}

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'userId'> = {
	privacy: DEFAULT_PRIVACY_SETTINGS,
	notifications: DEFAULT_NOTIFICATION_SETTINGS,
	cooking: DEFAULT_COOKING_PREFERENCES,
	app: DEFAULT_APP_PREFERENCES,
}
