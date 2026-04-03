import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { ApiResponse } from '@/lib/types'
import { SkillTreeResponse } from '@/lib/types/achievement'

// ============================================
// SKILL TREE
// ============================================

export async function getMySkillTree(): Promise<SkillTreeResponse | null> {
	const res = await api.get<ApiResponse<SkillTreeResponse>>(
		API_ENDPOINTS.ACHIEVEMENTS.MY_SKILL_TREE,
	)
	return res.data.data ?? null
}

export async function getUserSkillTree(
	userId: string,
): Promise<SkillTreeResponse | null> {
	const res = await api.get<ApiResponse<SkillTreeResponse>>(
		API_ENDPOINTS.ACHIEVEMENTS.USER_SKILL_TREE(userId),
	)
	return res.data.data ?? null
}
