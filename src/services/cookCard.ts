import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse } from '@/lib/types/common'
import type { CookCardData } from '@/lib/types/cookCard'

export async function getCookCardData(
  sessionId: string
): Promise<ApiResponse<CookCardData>> {
  try {
    const response = await api.get(
      API_ENDPOINTS.COOKING_SESSIONS.COOK_CARD(sessionId)
    )
    return response.data
  } catch (error) {
    return { success: false, statusCode: 500, message: 'Failed to load cook card data' } as ApiResponse<CookCardData>
  }
}
