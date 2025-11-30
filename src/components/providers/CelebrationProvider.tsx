'use client'

import {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
} from 'react'
import {
	LevelUpCelebration,
	LevelUpToast,
	PostSuccessRewards,
	FirstCookCelebration,
	ImmediateRewards,
} from '@/components/completion'
import type { Badge } from '@/lib/types/gamification'

// ============================================
// TYPES
// ============================================

interface XPRow {
	id: string
	source: string
	emoji?: string
	amount: number
	isHighlight?: boolean
}

interface LevelUpData {
	oldLevel: number
	newLevel: number
	stats: {
		totalXp: number
		recipesCooked: number
		postsShared: number
	}
	unlocks: {
		id: string
		emoji: string
		title: string
		description: string
	}[]
	xpToNextLevel: number
	nextLevelPerk?: string
}

interface PostSuccessData {
	recipeName: string
	recipeImageUrl: string
	xpRows: XPRow[]
	totalXp: number
	currentLevel: number
	xpToNextLevel: number
	levelProgressPercent: number
	levelGainedPercent: number
	mastery?: {
		cuisineEmoji: string
		cuisineName: string
		percentComplete: number
		percentGained: number
	}
	postPreview?: {
		authorAvatar: string
		authorName: string
		imageUrl: string
		caption: string
	}
}

interface FirstCookData {
	recipeName: string
	recipeImageUrl: string
	xpEarned: number
	badgeEarned?: Badge
}

interface ImmediateRewardsData {
	recipeName: string
	recipeImageUrl?: string
	immediateXp: number
	pendingXp: number
	streakBonus?: number
	streakDays?: number
	creatorTipXp?: number
	creatorHandle?: string
	postDeadlineHours: number
	unlockedAchievement?: Badge | null
}

interface CelebrationContextType {
	// Level up
	showLevelUp: (data: LevelUpData) => void
	showLevelUpToast: (level: number) => void
	// Post success
	showPostSuccess: (data: PostSuccessData) => void
	// First cook
	showFirstCook: (data: FirstCookData) => void
	// Immediate rewards (after cooking, before posting)
	showImmediateRewards: (data: ImmediateRewardsData) => void
}

const CelebrationContext = createContext<CelebrationContextType | null>(null)

// ============================================
// HOOK
// ============================================

export const useCelebration = () => {
	const context = useContext(CelebrationContext)
	if (!context) {
		throw new Error('useCelebration must be used within CelebrationProvider')
	}
	return context
}

// ============================================
// PROVIDER
// ============================================

interface CelebrationProviderProps {
	children: ReactNode
}

export const CelebrationProvider = ({ children }: CelebrationProviderProps) => {
	// Level Up state
	const [levelUpOpen, setLevelUpOpen] = useState(false)
	const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null)
	const [levelUpToastOpen, setLevelUpToastOpen] = useState(false)
	const [levelUpToastLevel, setLevelUpToastLevel] = useState(0)

	// Post Success state
	const [postSuccessOpen, setPostSuccessOpen] = useState(false)
	const [postSuccessData, setPostSuccessData] =
		useState<PostSuccessData | null>(null)

	// First Cook state
	const [firstCookOpen, setFirstCookOpen] = useState(false)
	const [firstCookData, setFirstCookData] = useState<FirstCookData | null>(null)

	// Immediate Rewards state
	const [immediateRewardsOpen, setImmediateRewardsOpen] = useState(false)
	const [immediateRewardsData, setImmediateRewardsData] =
		useState<ImmediateRewardsData | null>(null)

	// ============================================
	// ACTIONS
	// ============================================

	const showLevelUp = useCallback((data: LevelUpData) => {
		setLevelUpData(data)
		setLevelUpOpen(true)
	}, [])

	const showLevelUpToast = useCallback((level: number) => {
		setLevelUpToastLevel(level)
		setLevelUpToastOpen(true)
	}, [])

	const showPostSuccess = useCallback((data: PostSuccessData) => {
		setPostSuccessData(data)
		setPostSuccessOpen(true)
	}, [])

	const showFirstCook = useCallback((data: FirstCookData) => {
		setFirstCookData(data)
		setFirstCookOpen(true)
	}, [])

	const showImmediateRewards = useCallback((data: ImmediateRewardsData) => {
		setImmediateRewardsData(data)
		setImmediateRewardsOpen(true)
	}, [])

	// ============================================
	// HANDLERS
	// ============================================

	const handleLevelUpClose = () => {
		setLevelUpOpen(false)
		setLevelUpData(null)
	}

	const handleLevelUpShare = () => {
		// TODO: Implement share functionality
		if (navigator.share) {
			navigator.share({
				title: `I reached Level ${levelUpData?.newLevel}!`,
				text: `Just leveled up to Level ${levelUpData?.newLevel} on Chefkix! 🎉`,
				url: window.location.origin,
			})
		}
	}

	const handleLevelUpToastDismiss = () => {
		setLevelUpToastOpen(false)
	}

	const handleLevelUpToastView = () => {
		setLevelUpToastOpen(false)
		// Show full level up celebration if we have the data
		// Otherwise just dismiss
	}

	const handlePostSuccessClose = () => {
		setPostSuccessOpen(false)
		setPostSuccessData(null)
	}

	const handlePostSuccessViewPost = () => {
		// TODO: Navigate to the post
		handlePostSuccessClose()
	}

	const handleFirstCookClose = () => {
		setFirstCookOpen(false)
		setFirstCookData(null)
	}

	const handleImmediateRewardsClose = () => {
		setImmediateRewardsOpen(false)
		setImmediateRewardsData(null)
	}

	const handleImmediateRewardsPostNow = () => {
		// Navigate to create post screen
		handleImmediateRewardsClose()
		window.location.href = '/create'
	}

	const handleImmediateRewardsPostLater = () => {
		// Dismiss and show reminder toast
		handleImmediateRewardsClose()
	}

	// ============================================
	// RENDER
	// ============================================

	const value: CelebrationContextType = {
		showLevelUp,
		showLevelUpToast,
		showPostSuccess,
		showFirstCook,
		showImmediateRewards,
	}

	return (
		<CelebrationContext.Provider value={value}>
			{children}

			{/* Level Up Full Modal */}
			{levelUpData && (
				<LevelUpCelebration
					isOpen={levelUpOpen}
					onClose={handleLevelUpClose}
					oldLevel={levelUpData.oldLevel}
					newLevel={levelUpData.newLevel}
					stats={levelUpData.stats}
					unlocks={levelUpData.unlocks}
					xpToNextLevel={levelUpData.xpToNextLevel}
					nextLevelPerk={levelUpData.nextLevelPerk}
					onShare={handleLevelUpShare}
					onContinue={handleLevelUpClose}
				/>
			)}

			{/* Level Up Toast */}
			{levelUpToastOpen && (
				<LevelUpToast
					level={levelUpToastLevel}
					onView={handleLevelUpToastView}
					onDismiss={handleLevelUpToastDismiss}
				/>
			)}

			{/* Post Success Modal */}
			{postSuccessData && (
				<PostSuccessRewards
					isOpen={postSuccessOpen}
					onClose={handlePostSuccessClose}
					recipeName={postSuccessData.recipeName}
					recipeImageUrl={postSuccessData.recipeImageUrl}
					xpRows={postSuccessData.xpRows}
					totalXp={postSuccessData.totalXp}
					currentLevel={postSuccessData.currentLevel}
					xpToNextLevel={postSuccessData.xpToNextLevel}
					levelProgressPercent={postSuccessData.levelProgressPercent}
					levelGainedPercent={postSuccessData.levelGainedPercent}
					mastery={postSuccessData.mastery}
					postPreview={postSuccessData.postPreview}
					onViewPost={handlePostSuccessViewPost}
					onDone={handlePostSuccessClose}
					nextActions={[
						{
							id: 'cook',
							emoji: '🍳',
							label: 'Cook Again',
							sublabel: 'Try another recipe',
							onClick: () => {
								handlePostSuccessClose()
								window.location.href = '/explore'
							},
						},
						{
							id: 'challenge',
							emoji: '🎯',
							label: 'Daily Challenge',
							sublabel: 'Earn bonus XP',
							onClick: () => {
								handlePostSuccessClose()
								window.location.href = '/challenges'
							},
						},
						{
							id: 'share',
							emoji: '📤',
							label: 'Share',
							sublabel: 'Tell friends',
							onClick: () => {
								if (navigator.share) {
									navigator.share({
										title: 'Check out my creation!',
										text: `I just made ${postSuccessData.recipeName} on Chefkix!`,
										url: window.location.origin,
									})
								}
							},
						},
					]}
				/>
			)}

			{/* First Cook Modal */}
			{firstCookData && (
				<FirstCookCelebration
					isOpen={firstCookOpen}
					onClose={handleFirstCookClose}
					recipeName={firstCookData.recipeName}
					recipeImageUrl={firstCookData.recipeImageUrl}
					immediateXp={firstCookData.xpEarned}
					pendingXp={20} // Default pending XP for first cook
					postDeadlineDays={2}
					onPostNow={() => {
						handleFirstCookClose()
						window.location.href = '/create'
					}}
					onShareAchievement={() => {
						if (navigator.share) {
							navigator.share({
								title: 'I just cooked my first recipe!',
								text: `Just made ${firstCookData.recipeName} on Chefkix! 🎉`,
								url: window.location.origin,
							})
						}
					}}
					onContinueCooking={() => {
						handleFirstCookClose()
						window.location.href = '/explore'
					}}
				/>
			)}

			{/* Immediate Rewards Modal (after cooking, before posting) */}
			{immediateRewardsData && (
				<ImmediateRewards
					isOpen={immediateRewardsOpen}
					onClose={handleImmediateRewardsClose}
					recipeName={immediateRewardsData.recipeName}
					recipeImageUrl={immediateRewardsData.recipeImageUrl}
					immediateXp={immediateRewardsData.immediateXp}
					pendingXp={immediateRewardsData.pendingXp}
					streakBonus={immediateRewardsData.streakBonus}
					streakDays={immediateRewardsData.streakDays}
					creatorTipXp={immediateRewardsData.creatorTipXp}
					creatorHandle={immediateRewardsData.creatorHandle}
					postDeadlineHours={immediateRewardsData.postDeadlineHours}
					unlockedAchievement={immediateRewardsData.unlockedAchievement}
					onPostNow={handleImmediateRewardsPostNow}
					onPostLater={handleImmediateRewardsPostLater}
				/>
			)}
		</CelebrationContext.Provider>
	)
}
