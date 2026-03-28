import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { ApiResponse } from '@/lib/types'
import {
	SkillTreeResponse,
	Achievement,
	UserAchievement,
} from '@/lib/types/achievement'

// ============================================
// SKILL TREE
// ============================================

export async function getMySkillTree(): Promise<SkillTreeResponse | null> {
	try {
		const res = await api.get<ApiResponse<SkillTreeResponse>>(
			API_ENDPOINTS.ACHIEVEMENTS.MY_SKILL_TREE,
		)
		return res.data.data ?? null
	} catch {
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
	} catch {
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
	} catch {
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
