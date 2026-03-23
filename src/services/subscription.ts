import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse } from '@/lib/types/common'
import type { SubscriptionResponse, ActivateSubscriptionRequest } from '@/lib/types/subscription'
import type { AxiosError } from 'axios'

function handleError<T>(error: unknown, fallback: string): ApiResponse<T> {
  const axiosErr = error as AxiosError<ApiResponse<T>>
  if (axiosErr.response?.data) return axiosErr.response.data
  return { success: false, message: fallback, statusCode: 500 }
}

export async function getMySubscription(): Promise<ApiResponse<SubscriptionResponse>> {
  try {
    const response = await api.get(API_ENDPOINTS.SUBSCRIPTION.MY)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to fetch subscription')
  }
}

export async function getPremiumStatus(): Promise<ApiResponse<boolean>> {
  try {
    const response = await api.get(API_ENDPOINTS.SUBSCRIPTION.PREMIUM_STATUS)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to check premium status')
  }
}

export async function activateSubscription(
  request: ActivateSubscriptionRequest
): Promise<ApiResponse<SubscriptionResponse>> {
  try {
    const response = await api.post(API_ENDPOINTS.SUBSCRIPTION.ACTIVATE, request)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to activate subscription')
  }
}

export async function startTrial(): Promise<ApiResponse<SubscriptionResponse>> {
  try {
    const response = await api.post(API_ENDPOINTS.SUBSCRIPTION.TRIAL)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to start trial')
  }
}

export async function cancelSubscription(): Promise<ApiResponse<SubscriptionResponse>> {
  try {
    const response = await api.post(API_ENDPOINTS.SUBSCRIPTION.CANCEL)
    return response.data
  } catch (error) {
    return handleError(error, 'Failed to cancel subscription')
  }
}
