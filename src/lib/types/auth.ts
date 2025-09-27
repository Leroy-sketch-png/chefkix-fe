export interface User {
	id: number
	email: string
	username: string
}

export interface SignInDto {
	emailOrUsername: string
	password: string
}

export interface SignUpDto {
	username: string
	email: string
	password: string
}

export interface IntrospectRequest {
	token: string
}

export interface IntrospectResponse {
	valid: boolean
}

export interface LoginSuccessResponse {
	user: User
	token: string
}

export interface VerifyOtpDto {
	email: string
	otp: string
}

export interface SendOtpDto {
	email: string
}
