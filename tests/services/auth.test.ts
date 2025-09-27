import { api } from '@/lib/axios'
import { signIn, signUp } from '@/services/auth'
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
		const mockSuccessData: LoginSuccessResponse = {
			user: {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
			},
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
