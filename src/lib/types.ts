export interface ApiResponse<T> {
	data?: T
	message?: string
	success: boolean
	statusCode?: number
	error?: { [key: string]: string[] }
}

export interface User {
	id: string
	email: string
	firstName?: string
	lastName?: string
}

export interface ChildrenProps {
	children: React.ReactNode
}

export interface SignInDto {
	usernameOrEmail: string
	password: string
}

export interface SignUpDto {
	username: string
	email: string
	password: string
}
