'use client'

import {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
} from 'react'
import { toast } from 'sonner'
import {
	LevelUpCelebration,
	LevelUpToast,
	PostSuccessRewards,
	FirstCookCelebration,
	ImmediateRewards,
} from '@/components/completion'
import {
	playCelebrationSound,
	playLevelUpSound,
	playXpSound,
	playAchievementSound,
} from '@/lib/audio'
import {
	StreakSavedToast,
	StreakMilestoneCard,
	StreakBrokenModal,
} from '@/components/streak'
import { ChallengeComplete } from '@/components/challenges'
import { Portal } from '@/components/ui/portal'
import type { Badge } from '@/lib/types/gamification'

// ============================================
// SHARE HELPER
// ============================================

/**
 * Cross-browser share with clipboard fallback
 */
async function shareWithFallback(data: {
	title: string
	text: string
	url: string
}) {
	// Try native share API first
	if (navigator.share) {
		try {
			await navigator.share(data)
			return
		} catch {
			// User cancelled or share failed, fall through to clipboard
		}
	}

	// Fallback: copy to clipboard
	const shareText = `${data.text} ${data.url}`
	try {
		await navigator.clipboard.writeText(shareText)
		toast.success('Link copied to clipboard!')
	} catch {
		toast.error('Could not share. Try copying the link manually.')
	}
}

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
	stats?: {
		totalXp: number
		recipesCooked: number
		postsShared: number
	}
	unlocks?: {
		id: string
		emoji: string
		title: string
		description: string
	}[]
	xpToNextLevel?: number
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
	sessionId: string
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

interface StreakSavedData {
	newStreak: number
	bonusXp: number
	isNewStreak?: boolean
}

interface StreakMilestoneData {
	days: number
	badgeName: string
	badgeEmoji: string
	nextMilestone?: { days: number; badgeName: string }
}

interface StreakBrokenData {
	lostStreak: number
	totalBonusXpEarned: number
	bestStreak?: number
}

interface StreakDay {
	label: string
	isCompleted: boolean
	isToday?: boolean
	isMilestone?: boolean
}

interface ChallengeCompleteData {
	challengeTitle: string
	challengeIcon: string
	recipeName: string
	bonusXp: number
	streakDays: StreakDay[]
	daysToMilestone: number
	milestoneReward: string
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
	// Streak celebrations
	showStreakSaved: (data: StreakSavedData) => void
	showStreakMilestone: (data: StreakMilestoneData) => void
	showStreakBroken: (data: StreakBrokenData) => void
	// Challenge celebrations
	showChallengeComplete: (data: ChallengeCompleteData) => void
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

	// Streak Saved state
	const [streakSavedVisible, setStreakSavedVisible] = useState(false)
	const [streakSavedData, setStreakSavedData] =
		useState<StreakSavedData | null>(null)

	// Streak Milestone state
	const [streakMilestoneOpen, setStreakMilestoneOpen] = useState(false)
	const [streakMilestoneData, setStreakMilestoneData] =
		useState<StreakMilestoneData | null>(null)

	// Streak Broken state
	const [streakBrokenOpen, setStreakBrokenOpen] = useState(false)
	const [streakBrokenData, setStreakBrokenData] =
		useState<StreakBrokenData | null>(null)

	// Challenge Complete state
	const [challengeCompleteOpen, setChallengeCompleteOpen] = useState(false)
	const [challengeCompleteData, setChallengeCompleteData] =
		useState<ChallengeCompleteData | null>(null)

	// ============================================
	// ACTIONS
	// ============================================

	const showLevelUp = useCallback((data: LevelUpData) => {
		setLevelUpData(data)
		setLevelUpOpen(true)
		// Play majestic fanfare for level up
		playLevelUpSound()
	}, [])

	const showLevelUpToast = useCallback((level: number) => {
		setLevelUpToastLevel(level)
		setLevelUpToastOpen(true)
		// Play fanfare for toast variant too
		playLevelUpSound()
	}, [])

	const showPostSuccess = useCallback((data: PostSuccessData) => {
		setPostSuccessData(data)
		setPostSuccessOpen(true)
		// Play XP sound for post success (XP-focused modal)
		playXpSound()
	}, [])

	const showFirstCook = useCallback((data: FirstCookData) => {
		setFirstCookData(data)
		setFirstCookOpen(true)
		// Play achievement sound for first cook milestone
		playAchievementSound()
	}, [])

	const showImmediateRewards = useCallback((data: ImmediateRewardsData) => {
		setImmediateRewardsData(data)
		setImmediateRewardsOpen(true)
		// Play celebration sound for cooking completion
		playCelebrationSound()
		// If there's an unlocked achievement, play achievement sound after a delay
		if (data.unlockedAchievement) {
			setTimeout(() => playAchievementSound(), 800)
		}
	}, [])

	const showStreakSaved = useCallback((data: StreakSavedData) => {
		setStreakSavedData(data)
		setStreakSavedVisible(true)
		// Play XP sound for streak bonus
		playXpSound()
		// Auto-hide after 4 seconds
		setTimeout(() => setStreakSavedVisible(false), 4000)
	}, [])

	const showStreakMilestone = useCallback((data: StreakMilestoneData) => {
		setStreakMilestoneData(data)
		setStreakMilestoneOpen(true)
		// Play achievement sound for streak milestone
		playAchievementSound()
	}, [])

	const showStreakBroken = useCallback((data: StreakBrokenData) => {
		setStreakBrokenData(data)
		setStreakBrokenOpen(true)
		// No sound for streak broken - it's a sad moment
	}, [])

	const showChallengeComplete = useCallback((data: ChallengeCompleteData) => {
		setChallengeCompleteData(data)
		setChallengeCompleteOpen(true)
		// Play celebration sound for challenge completion
		playCelebrationSound()
	}, [])

	// ============================================
	// HANDLERS
	// ============================================

	const handleLevelUpClose = () => {
		setLevelUpOpen(false)
		setLevelUpData(null)
	}

	const handleLevelUpShare = () => {
		shareWithFallback({
			title: `I reached Level ${levelUpData?.newLevel}!`,
			text: `Just leveled up to Level ${levelUpData?.newLevel} on ChefKix! 🎉`,
			url: window.location.origin,
		})
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

	const handleImmediateRewardsPostNow = async (capturedPhotos?: File[]) => {
		// Navigate to create post screen with session data for XP linking
		const sessionId = immediateRewardsData?.sessionId

		// Store captured photos in sessionStorage as base64 for post page to retrieve
		if (capturedPhotos && capturedPhotos.length > 0) {
			try {
				const photoData = await Promise.all(
					capturedPhotos.map(async file => {
						return new Promise<{ name: string; type: string; data: string }>(
							resolve => {
								const reader = new FileReader()
								reader.onloadend = () => {
									resolve({
										name: file.name,
										type: file.type,
										data: reader.result as string,
									})
								}
								reader.readAsDataURL(file)
							},
						)
					}),
				)
				sessionStorage.setItem('pendingPostPhotos', JSON.stringify(photoData))
			} catch (e) {
				console.error('Failed to store photos:', e)
			}
		}

		handleImmediateRewardsClose()
		window.location.href = sessionId
			? `/post/new?session=${sessionId}`
			: '/post/new'
	}

	const handleImmediateRewardsPostLater = () => {
		// Dismiss and show reminder toast
		handleImmediateRewardsClose()
	}

	const handleStreakSavedClose = () => {
		setStreakSavedVisible(false)
	}

	const handleStreakMilestoneClose = () => {
		setStreakMilestoneOpen(false)
		setStreakMilestoneData(null)
	}

	const handleStreakMilestoneShare = () => {
		if (streakMilestoneData) {
			shareWithFallback({
				title: `${streakMilestoneData.days}-Day Streak!`,
				text: `I just hit a ${streakMilestoneData.days}-day cooking streak on ChefKix! 🔥`,
				url: window.location.origin,
			})
		}
	}

	const handleStreakBrokenClose = () => {
		setStreakBrokenOpen(false)
		setStreakBrokenData(null)
	}

	const handleStartNewStreak = () => {
		handleStreakBrokenClose()
		window.location.href = '/explore'
	}

	const handleChallengeCompleteClose = () => {
		setChallengeCompleteOpen(false)
		setChallengeCompleteData(null)
	}

	const handleChallengeCompleteShare = () => {
		if (challengeCompleteData) {
			shareWithFallback({
				title: `Challenge Complete: ${challengeCompleteData.challengeTitle}!`,
				text: `I just completed "${challengeCompleteData.challengeTitle}" on ChefKix and earned ${challengeCompleteData.bonusXp} bonus XP! 🎯`,
				url: window.location.origin,
			})
		}
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
		showStreakSaved,
		showStreakMilestone,
		showStreakBroken,
		showChallengeComplete,
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
					stats={
						levelUpData.stats ?? {
							totalXp: 0,
							recipesCooked: 0,
							postsShared: 0,
						}
					}
					unlocks={levelUpData.unlocks ?? []}
					xpToNextLevel={levelUpData.xpToNextLevel ?? 0}
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
								shareWithFallback({
									title: 'Check out my creation!',
									text: `I just made ${postSuccessData.recipeName} on ChefKix!`,
									url: window.location.origin,
								})
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
						shareWithFallback({
							title: 'I just cooked my first recipe!',
							text: `Just made ${firstCookData.recipeName} on ChefKix! 🎉`,
							url: window.location.origin,
						})
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

			{/* Streak Saved Toast */}
			{streakSavedData && (
				<StreakSavedToast
					newStreak={streakSavedData.newStreak}
					bonusXp={streakSavedData.bonusXp}
					isNewStreak={streakSavedData.isNewStreak}
					isVisible={streakSavedVisible}
					onClose={handleStreakSavedClose}
				/>
			)}

			{/* Streak Milestone Card (shown as modal overlay) */}
			{streakMilestoneOpen && streakMilestoneData && (
				<Portal>
					<div className='fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm p-6'>
						<div className='w-full max-w-md'>
							<StreakMilestoneCard
								days={streakMilestoneData.days}
								badgeName={streakMilestoneData.badgeName}
								badgeEmoji={streakMilestoneData.badgeEmoji}
								nextMilestone={streakMilestoneData.nextMilestone}
								onShare={handleStreakMilestoneShare}
							/>
							<button
								onClick={handleStreakMilestoneClose}
								className='mt-4 w-full py-3 text-sm text-muted-foreground hover:text-text transition-colors'
							>
								Continue
							</button>
						</div>
					</div>
				</Portal>
			)}

			{/* Streak Broken Modal */}
			{streakBrokenData && (
				<StreakBrokenModal
					isOpen={streakBrokenOpen}
					lostStreak={streakBrokenData.lostStreak}
					totalBonusXpEarned={streakBrokenData.totalBonusXpEarned}
					bestStreak={streakBrokenData.bestStreak}
					onStartNewStreak={handleStartNewStreak}
					onDismiss={handleStreakBrokenClose}
				/>
			)}

			{/* Challenge Complete Modal */}
			{challengeCompleteOpen && challengeCompleteData && (
				<ChallengeComplete
					challengeTitle={challengeCompleteData.challengeTitle}
					challengeIcon={challengeCompleteData.challengeIcon}
					recipeName={challengeCompleteData.recipeName}
					bonusXp={challengeCompleteData.bonusXp}
					streakDays={challengeCompleteData.streakDays}
					daysToMilestone={challengeCompleteData.daysToMilestone}
					milestoneReward={challengeCompleteData.milestoneReward}
					onContinue={handleChallengeCompleteClose}
					onShare={handleChallengeCompleteShare}
				/>
			)}
		</CelebrationContext.Provider>
	)
}
