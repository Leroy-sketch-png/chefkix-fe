import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { ApiResponse } from '@/lib/types'
import {
	SkillTreeResponse,
	Achievement,
	UserAchievement,
} from '@/lib/types/achievement'
import { logDevError } from '@/lib/dev-log'

// ============================================
// SKILL TREE
// ============================================

export async function getMySkillTree(): Promise<SkillTreeResponse | null> {
	try {
		const res = await api.get<ApiResponse<SkillTreeResponse>>(
			API_ENDPOINTS.ACHIEVEMENTS.MY_SKILL_TREE,
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('Failed to get my skill tree:', error)
		return null
	}
}

export async function getUserSkillTree(
	userId: string,
): Promise<SkillTreeResponse | null> {
	try {
		const res = await api.get<ApiResponse<SkillTreeResponse>>(
			API_ENDPOINTS.ACHIEVEMENTS.USER_SKILL_TREE(userId),
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('Failed to get user skill tree:', error)
		return null
	}
}

// ============================================
// ACHIEVEMENT BLUEPRINTS
// ============================================

/** @deprecated SkillTree (`getMySkillTree`/`getUserSkillTree`) is the primary achievement UI. This flat list is for future achievement browser. */
export async function getAllAchievements(): Promise<Achievement[]> {
	try {
		const res = await api.get<ApiResponse<Achievement[]>>(
			API_ENDPOINTS.ACHIEVEMENTS.ALL,
		)
		return res.data.data ?? []
	} catch (error) {
		logDevError('Failed to get all achievements:', error)
		return []
	}
}

// ============================================
// USER ACHIEVEMENTS
// ============================================

/** @deprecated SkillTree is the primary achievement UI. This flat list is for future achievement browser. */
export async function getMyUnlockedAchievements(): Promise<UserAchievement[]> {
	try {
		const res = await api.get<ApiResponse<UserAchievement[]>>(
			API_ENDPOINTS.ACHIEVEMENTS.MY_UNLOCKED,
		)
		return res.data.data ?? []
	} catch {
		return []
	}
}
