import type { ApiResponse } from '@/lib/types/common'

interface OptimisticMutationOptions<T> {
	request: () => Promise<ApiResponse<T>>
	onSuccess: (data: T) => void
	onFailure: () => void
	onSettled?: () => void
}

/** Settles APIs that encode command rejection in the response instead of throwing. */
export async function settleOptimisticMutation<T>({
	request,
	onSuccess,
	onFailure,
	onSettled,
}: OptimisticMutationOptions<T>): Promise<boolean> {
	try {
		let response: ApiResponse<T>
		try {
			response = await request()
		} catch {
			onFailure()
			return false
		}

		if (!response.success || response.data == null) {
			onFailure()
			return false
		}

		onSuccess(response.data)
		return true
	} finally {
		onSettled?.()
	}
}
