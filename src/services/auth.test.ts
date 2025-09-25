import { signIn, signUp } from '../services/auth'

describe('signIn', () => {
	it('should successfully sign in a user with valid credentials', async () => {
		// Arrange
		const validCredentials = {
			usernameOrEmail: 'test@example.com',
			password: 'password',
		}

		// Act
		const response = await signIn(validCredentials)

		// Assert
		expect(response.success).toBe(true)
		expect(response.statusCode).toBe(200)
		expect(response.message).toBe('Login successful')
		expect(response.data).toBeDefined()
		expect(response.data?.user).toBeDefined()
		expect(response.data?.user.email).toBe('test@example.com')
		expect(response.data?.token).toBeDefined()
	})

	it('should return an error for invalid credentials', async () => {
		// Arrange
		const invalidCredentials = {
			usernameOrEmail: 'wrong@example.com',
			password: 'wrongpassword',
		}

		// Act
		const response = await signIn(invalidCredentials)

		// Assert
		expect(response.success).toBe(false)
		expect(response.statusCode).toBe(401)
		expect(response.message).toBe('Invalid credentials. Please try again.')
		expect(response.error).toBeDefined()
		expect(response.error?.general).toEqual(['Invalid username or password'])
	})
})

describe('signUp', () => {
	it('should successfully sign up a new user with valid data', async () => {
		// Arrange
		const newUserData = {
			username: 'newUser',
			email: 'newuser@example.com',
			password: 'newPassword123',
		}

		// Act
		const response = await signUp(newUserData)

		// Assert
		expect(response.success).toBe(true)
		expect(response.statusCode).toBe(201)
		expect(response.message).toBe('Account created successfully!')
		expect(response.data).toBeDefined()
		expect(response.data?.user).toBeDefined()
		expect(response.data?.user.email).toBe('newuser@example.com')
		expect(response.data?.token).toBeDefined()
	})

	it('should return an error if the email already exists', async () => {
		// Arrange
		const existingUserData = {
			username: 'existingUser',
			email: 'test@example.com', // This email triggers the error in mock
			password: 'anyPassword',
		}

		// Act
		const response = await signUp(existingUserData)

		// Assert
		expect(response.success).toBe(false)
		expect(response.statusCode).toBe(409) // 409 Conflict for existing email
		expect(response.message).toBe('A user with this email already exists.')
		expect(response.error).toBeDefined()
		expect(response.error?.email).toEqual([
			'A user with this email already exists.',
		])
	})
})
