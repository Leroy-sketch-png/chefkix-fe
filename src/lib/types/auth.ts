import { Profile } from './profile'

// User is the authenticated user, which is essentially a Profile
export type User = Profile

export interface SignInDto {
	emailOrUsername: string
	password: string
}

export interface SignUpDto {
	username: string
	email: string
	password: string
	firstName: string
	lastName: string
}

/**
 * Login response from BE AuthenticationResponse.java
 * RefreshToken is set as HttpOnly cookie, so only accessToken is needed in body.
 * Other fields (idToken, scope, authenticated, lastLogin, user) exist in BE
 * but are optional for FE consumption.
 */
export interface LoginSuccessResponse {
	accessToken: string
	refreshToken?: string | null // Usually null in body; real refreshToken is in HttpOnly cookie
	idToken?: string
	scope?: string
	authenticated?: boolean
	lastLogin?: string // ISO timestamp
	user?: Profile
}

export interface VerifyOtpDto {
	email: string
	otp: string
}

export interface SendOtpDto {
	email: string
}

export interface ForgotPasswordDto {
	email: string
}

export interface VerifyOtpPasswordDto {
	email: string
	otp: string
	newPassword: string
}

export interface ChangePasswordDto {
	oldPassword: string
	newPassword: string
}

export interface GoogleSignInDto {
	code: string
}
