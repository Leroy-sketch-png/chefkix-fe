import {
	ApiResponse,
	AuthSuccessResponse,
	SignInDto,
	SignUpDto,
} from '@/lib/types'

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

// Mock sign-up function
export const signUp = (
	data: SignUpDto,
): Promise<ApiResponse<AuthSuccessResponse>> => {
	return new Promise(resolve => {
		// Simulate a network delay of 1.5 seconds
		setTimeout(() => {
			if (data.email === 'test@example.com') {
				// Simulate a user already exists error
				const mockErrorResponse: ApiResponse<AuthSuccessResponse> = {
					success: false,
					statusCode: 409, // 409 Conflict
					message: 'A user with this email already exists.',
					error: {
						email: ['A user with this email already exists.'],
					},
				}
				resolve(mockErrorResponse)
			} else {
				// On success, resolve with a new mock user and token
				const mockSuccessResponse: ApiResponse<AuthSuccessResponse> = {
					success: true,
					statusCode: 201, // 201 Created
					data: {
						user: {
							id: '2', // New user ID
							email: data.email,
							firstName: data.username, // Use username as firstName for mock
							lastName: '',
						},
						token: 'new-fake-jwt-token-for-development',
					},
					message: 'Account created successfully!',
				}
				resolve(mockSuccessResponse)
			}
		}, 1500)
	})
}