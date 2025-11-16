import { api } from '@/lib/axios'
import {
	signIn,
	signUp,
	sendOtp,
	verifyOtp,
	forgotPassword,
	verifyOtpPassword,
	changePassword,
} from '@/services/auth'
import { LoginSuccessResponse } from '@/lib/types'

// Mock the entire axios module to avoid real network calls
jest.mock('@/lib/axios')

// Create a type-safe mock of the api object
const mockedApi = api as jest.Mocked<typeof api>

describe('signIn', () => {
	beforeEach(() => {
		// Clear mock history before each test
		jest.clearAllMocks()
	})

	it('should successfully sign in a user with valid credentials', async () => {
		// Arrange
		const validCredentials = {
			emailOrUsername: 'test@example.com',
			password: 'password123',
		}

		// The current API returns tokens in the login response (accessToken & refreshToken)
		const mockSuccessData: LoginSuccessResponse = {
			accessToken: 'fake-jwt-token',
			refreshToken: null,
		}
		const mockApiResponse = {
			data: {
				success: true,
				statusCode: 200,
				message: 'Login successful',
				data: mockSuccessData,
			},
		}
		mockedApi.post.mockResolvedValue(mockApiResponse)

		// Act
		const response = await signIn(validCredentials)

		// Assert
		expect(response.success).toBe(true)
		// Response contains tokens according to current types
		expect(response.data?.accessToken).toBe('fake-jwt-token')
		expect(response.data?.refreshToken).toBeNull()
		expect(mockedApi.post).toHaveBeenCalledWith(
			'/api/v1/auth/login',
			validCredentials,
		)
	})

	it('should return a transformed error for invalid credentials', async () => {
		// Arrange
		const invalidCredentials = {
			emailOrUsername: 'wrong@example.com',
			password: 'wrongpassword',
		}
		const mockErrorResponse = {
			response: {
				data: {
					success: false,
					statusCode: 401,
					message: 'Invalid credentials',
					error: { general: ['Invalid username or password'] },
				},
			},
		}
		mockedApi.post.mockRejectedValue(mockErrorResponse)

		// Act
		const response = await signIn(invalidCredentials)

		// Assert
		expect(response.success).toBe(false)
		expect(response.statusCode).toBe(401)
		expect(response.message).toBe('Invalid credentials')
		expect(response.error?.general).toEqual(['Invalid username or password'])
	})
})

describe('signUp', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should successfully sign up and return a success message', async () => {
		// Arrange
		const newUserData = {
			username: 'newUser',
			email: 'newuser@example.com',
			password: 'newPassword123',
		}
		const mockApiResponse = {
			data: {
				success: true,
				statusCode: 201,
				message: 'Account created successfully!',
				data: 'User registered successfully. Please check your email for verification.',
			},
		}
		mockedApi.post.mockResolvedValue(mockApiResponse)

		// Act
		const response = await signUp(newUserData)

		// Assert
		expect(response.success).toBe(true)
		expect(response.statusCode).toBe(201)
		expect(typeof response.data).toBe('string')
		expect(mockedApi.post).toHaveBeenCalledWith(
			'/api/v1/auth/register',
			newUserData,
		)
	})

	it('should return a transformed error if the email already exists', async () => {
		// Arrange
		const existingUserData = {
			username: 'existingUser',
			email: 'test@example.com',
			password: 'anyPassword',
		}
		const mockErrorResponse = {
			response: {
				data: {
					success: false,
					statusCode: 409,
					message: 'Conflict',
					error: { email: ['A user with this email already exists.'] },
				},
			},
		}
		mockedApi.post.mockRejectedValue(mockErrorResponse)

		// Act
		const response = await signUp(existingUserData)

		// Assert
		expect(response.success).toBe(false)
		expect(response.statusCode).toBe(409)
		expect(response.error?.email).toEqual([
			'A user with this email already exists.',
		])
	})
})

describe('sendOtp', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should successfully send an OTP', async () => {
		// Arrange
		const otpRequest = { email: 'test@example.com' }
		const mockApiResponse = {
			data: {
				success: true,
				statusCode: 200,
				message: 'OTP sent successfully.',
				data: 'OTP has been sent to your email.',
			},
		}
		mockedApi.post.mockResolvedValue(mockApiResponse)

		// Act
		const response = await sendOtp(otpRequest)

		// Assert
		expect(response.success).toBe(true)
		expect(response.statusCode).toBe(200)
		expect(response.message).toBe('OTP sent successfully.')
		expect(mockedApi.post).toHaveBeenCalledWith(
			'/api/v1/auth/send-otp',
			otpRequest,
		)
	})

	it('should return an error if the email does not exist', async () => {
		// Arrange
		const otpRequest = { email: 'notfound@example.com' }
		const mockErrorResponse = {
			response: {
				data: {
					success: false,
					statusCode: 404,
					message: 'User not found',
				},
			},
		}
		mockedApi.post.mockRejectedValue(mockErrorResponse)

		// Act
		const response = await sendOtp(otpRequest)

		// Assert
		expect(response.success).toBe(false)
		expect(response.statusCode).toBe(404)
		expect(response.message).toBe('User not found')
	})
})

describe('verifyOtp', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should successfully verify a valid OTP', async () => {
		// Arrange
		const verificationData = { email: 'test@example.com', otp: '123456' }
		const mockApiResponse = {
			data: {
				success: true,
				statusCode: 200,
				message: 'Email verified successfully.',
			},
		}
		mockedApi.post.mockResolvedValue(mockApiResponse)

		// Act
		const response = await verifyOtp(verificationData)

		// Assert
		expect(response.success).toBe(true)
		expect(response.statusCode).toBe(200)
		expect(response.message).toBe('Email verified successfully.')
		expect(mockedApi.post).toHaveBeenCalledWith(
			'/api/v1/auth/verify-otp-user',
			verificationData,
		)
	})

	it('should return an error for an invalid OTP', async () => {
		// Arrange
		const invalidVerificationData = { email: 'test@example.com', otp: '654321' }
		const mockErrorResponse = {
			response: {
				data: {
					success: false,
					statusCode: 400,
					message: 'Invalid or expired OTP.',
				},
			},
		}
		mockedApi.post.mockRejectedValue(mockErrorResponse)

		// Act
		const response = await verifyOtp(invalidVerificationData)

		// Assert
		expect(response.success).toBe(false)
		expect(response.statusCode).toBe(400)
		expect(response.message).toBe('Invalid or expired OTP.')
	})
})

describe('forgotPassword', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should successfully request a password reset email', async () => {
		const requestData = { email: 'reset@example.com' }
		const mockApiResponse = {
			data: {
				success: true,
				statusCode: 200,
				message: 'Reset email sent',
				data: 'Check your inbox',
			},
		}
		mockedApi.post.mockResolvedValue(mockApiResponse)

		const response = await forgotPassword(requestData)

		expect(response.success).toBe(true)
		expect(mockedApi.post).toHaveBeenCalledWith(
			`/api/v1/auth/forgot-password?email=${encodeURIComponent(requestData.email)}`,
		)
	})

	it('should surface backend error responses when reset fails', async () => {
		const requestData = { email: 'missing@example.com' }
		const mockErrorResponse = {
			response: {
				data: {
					success: false,
					statusCode: 404,
					message: 'User not found',
				},
			},
		}
		mockedApi.post.mockRejectedValue(mockErrorResponse)

		const response = await forgotPassword(requestData)

		expect(response.success).toBe(false)
		expect(response.statusCode).toBe(404)
	})
})

describe('verifyOtpPassword', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should verify OTP and accept new password', async () => {
		const payload = {
			email: 'reset@example.com',
			otp: '123456',
			newPassword: 'SecurePass123!',
		}
		const mockApiResponse = {
			data: {
				success: true,
				statusCode: 200,
				message: 'Password updated',
			},
		}
		mockedApi.put.mockResolvedValue(mockApiResponse)

		const response = await verifyOtpPassword(payload)

		expect(response.success).toBe(true)
		expect(mockedApi.put).toHaveBeenCalledWith(
			'/api/v1/auth/verify-otp-password',
			payload,
		)
	})

	it('should return backend error when OTP verification fails', async () => {
		const payload = {
			email: 'reset@example.com',
			otp: '000000',
			newPassword: 'SecurePass123!',
		}
		const mockErrorResponse = {
			response: {
				data: {
					success: false,
					statusCode: 400,
					message: 'Invalid or expired OTP',
				},
			},
		}
		mockedApi.put.mockRejectedValue(mockErrorResponse)

		const response = await verifyOtpPassword(payload)

		expect(response.success).toBe(false)
		expect(response.message).toBe('Invalid or expired OTP')
	})
})

describe('changePassword', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should change password when current password is correct', async () => {
		const payload = {
			oldPassword: 'OldPass123!',
			newPassword: 'NewPass456!',
		}
		const mockApiResponse = {
			data: {
				success: true,
				statusCode: 200,
				message: 'Password changed successfully',
			},
		}
		mockedApi.put.mockResolvedValue(mockApiResponse)

		const response = await changePassword(payload)

		expect(response.success).toBe(true)
		expect(mockedApi.put).toHaveBeenCalledWith(
			'/api/v1/auth/change-password',
			payload,
		)
	})

	it('should surface backend validation errors for wrong current password', async () => {
		const payload = {
			oldPassword: 'WrongPass!',
			newPassword: 'NewPass456!',
		}
		const mockErrorResponse = {
			response: {
				data: {
					success: false,
					statusCode: 400,
					message: 'Current password incorrect',
				},
			},
		}
		mockedApi.put.mockRejectedValue(mockErrorResponse)

		const response = await changePassword(payload)

		expect(response.success).toBe(false)
		expect(response.statusCode).toBe(400)
	})
})
