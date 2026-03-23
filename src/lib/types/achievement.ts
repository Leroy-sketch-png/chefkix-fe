/**
 * Achievement / Skill Tree Types
 * Matches BE DTOs: SkillTreeResponse, Achievement, UserAchievement
 *
 * ENUMS: AchievementCategory uses @JsonValue Title Case ("Cuisine", "Technique", etc.)
 *        CriteriaType uses @JsonValue snake_case ("cook_cuisine_count", etc.)
 */

// ============================================
// ENUMS (match BE @JsonValue exactly)
// ============================================

export type AchievementCategory =
	| 'Cuisine'
	| 'Technique'
	| 'Social'
	| 'Hidden'
	| 'Seasonal'

export type CriteriaType =
	| 'cook_cuisine_count'
	| 'use_technique_count'
	| 'total_cooks'
	| 'streak_days'
	| 'cook_after_midnight'
	| 'beat_estimated_time'
	| 'recipes_published'
	| 'followers_count'
	| 'likes_received'
	| 'others_cooked_your_recipes'

// ============================================
// SKILL TREE RESPONSE (matches SkillTreeResponse.java)
// ============================================

export interface SkillTreeResponse {
	paths: SkillPath[]
	totalUnlocked: number
	totalAchievements: number
}

export interface SkillPath {
	pathId: string
	pathName: string
	category: AchievementCategory
	nodes: AchievementNode[]
	unlockedCount: number
	totalCount: number
}

export interface AchievementNode {
	code: string
	name: string
	description: string
	icon: string
	tier: number // 1-4
	category: AchievementCategory
	hidden: boolean
	premium: boolean
	// Progress
	currentProgress: number
	requiredProgress: number
	unlocked: boolean
	unlockedAt: string | null // ISO datetime
	// Tree structure
	prerequisiteCode: string | null
	prerequisiteMet: boolean
}

// ============================================
// ACHIEVEMENT BLUEPRINT (matches Achievement.java)
// ============================================

export interface Achievement {
	id: string
	code: string
	name: string
	description: string
	category: AchievementCategory
	tier: number
	icon: string
	pathId: string
	prerequisiteCode: string | null
	criteriaType: CriteriaType
	criteriaTarget: string | null
	criteriaThreshold: number
	hidden: boolean
	premium: boolean
	createdAt: string
}

// ============================================
// USER ACHIEVEMENT (matches UserAchievement.java)
// ============================================

export interface UserAchievement {
	id: string
	userId: string
	achievementCode: string
	currentProgress: number
	requiredProgress: number
	unlocked: boolean
	unlockedAt: string | null
	createdAt: string
	updatedAt: string
}
