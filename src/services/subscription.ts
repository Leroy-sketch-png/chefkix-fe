import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse } from '@/lib/types/common'
import type { SubscriptionResponse, ActivateSubscriptionRequest } from '@/lib/types/subscription'

export async function getMySubscription(): Promise<ApiResponse<SubscriptionResponse>> {
  const response = await api.get(API_ENDPOINTS.SUBSCRIPTION.MY)
  return response.data
}

export async function getPremiumStatus(): Promise<ApiResponse<boolean>> {
  const response = await api.get(API_ENDPOINTS.SUBSCRIPTION.PREMIUM_STATUS)
  return response.data
}

export async function activateSubscription(
  request: ActivateSubscriptionRequest
): Promise<ApiResponse<SubscriptionResponse>> {
  const response = await api.post(API_ENDPOINTS.SUBSCRIPTION.ACTIVATE, request)
  return response.data
}

export async function startTrial(): Promise<ApiResponse<SubscriptionResponse>> {
  const response = await api.post(API_ENDPOINTS.SUBSCRIPTION.TRIAL)
  return response.data
}

export async function cancelSubscription(): Promise<ApiResponse<SubscriptionResponse>> {
  const response = await api.post(API_ENDPOINTS.SUBSCRIPTION.CANCEL)
  return response.data
}
