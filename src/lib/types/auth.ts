import { Profile } from './profile'

// User is the authenticated user, which is essentially a Profile
export type User = Profile

/**
 * Minimal user info returned by BE AuthenticationResponse.user.
 * This is UserResponse.java — NOT the full Profile.
 * Full Profile must be fetched separately via GET /api/v1/profiles/me.
 */
export interface LoginUser {
	id: string
	username: string
	email: string
	enabled: boolean
	roles: string[]
}

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
 *
 * IMPORTANT: `user` is a minimal UserResponse (id, username, email, enabled, roles).
 * It is NOT a full Profile. Use GET /api/v1/profiles/me for full Profile data.
 */
export interface LoginSuccessResponse {
	accessToken: string
	refreshToken?: string | null // Usually null in body; real refreshToken is in HttpOnly cookie
	idToken?: string
	scope?: string
	authenticated?: boolean
	lastLogin?: string // ISO timestamp (BE: LocalDateTime, no timezone)
	user?: LoginUser // Minimal user — NOT full Profile. See LoginUser type.
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
