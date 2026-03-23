import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse } from '@/lib/types/common'
import type { CookCardData } from '@/lib/types/cookCard'

export async function getCookCardData(
  sessionId: string
): Promise<ApiResponse<CookCardData>> {
  const response = await api.get(
    API_ENDPOINTS.COOKING_SESSIONS.COOK_CARD(sessionId)
  )
  return response.data
}
