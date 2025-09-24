import { ApiResponse, AuthSuccessResponse, SignInDto } from '@/lib/types'

// Mock sign-in function
export const signIn = (
	data: SignInDto,
): Promise<ApiResponse<AuthSuccessResponse>> => {
	return new Promise(resolve => {
		// Simulate a network delay of 1.5 seconds
		setTimeout(() => {
			if (
				data.usernameOrEmail === 'test@example.com' &&
				data.password === 'password'
			) {
				// On success, resolve with a mock user and token
				const mockSuccessResponse: ApiResponse<AuthSuccessResponse> = {
					success: true,
					statusCode: 200,
					data: {
						user: {
							id: '1',
							email: 'test@example.com',
							firstName: 'Test',
							lastName: 'User',
						},
						token: 'fake-jwt-token-for-development',
					},
					message: 'Login successful',
				}
				resolve(mockSuccessResponse)
			} else {
				// On failure, resolve with a mock error response
				const mockErrorResponse: ApiResponse<AuthSuccessResponse> = {
					success: false,
					statusCode: 401,
					message: 'Invalid credentials. Please try again.',
					error: {
						general: ['Invalid username or password'],
					},
				}
				resolve(mockErrorResponse)
			}
		}, 1500)
	})
}
