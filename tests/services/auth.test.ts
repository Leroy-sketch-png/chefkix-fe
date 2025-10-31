import { api } from '@/lib/axios'
import { signIn, signUp, sendOtp, verifyOtp } from '@/services/auth'
import { LoginSuccessResponse, User } from '@/lib/types'

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

		const mockUser: User = {
			id: 'user-id-1',
			email: 'test@example.com',
			name: 'testuser',
			provider: 'credentials',
			emailVerified: true,
			profileId: 'profile-id-1',
			userId: 'user-id-1',
			username: 'testuser',
			firstName: 'Test',
			lastName: 'User',
			dob: '2000-01-01',
			displayName: 'Test User',
			phoneNumber: null,
			avatarUrl: 'http://example.com/avatar.png',
			bio: 'A test user',
			accountType: 'user',
			location: 'Test City',
			preferences: [],
			statistics: {
				followerCount: 0,
				followingCount: 0,
				friendCount: 0,
				friendRequestCount: 0,
				currentLevel: 1,
			},
			friends: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}

		const mockSuccessData: LoginSuccessResponse = {
			user: mockUser,
			token: 'fake-jwt-token',
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
		expect(response.data?.user.email).toBe('test@example.com')
		expect(response.data?.token).toBe('fake-jwt-token')
		expect(mockedApi.post).toHaveBeenCalledWith(
			'/api/auth/login',
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
			'/api/auth/register',
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
			'/api/auth/send-otp',
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
			'/api/auth/verify-otp',
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
