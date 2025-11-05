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
}

export interface LoginSuccessResponse {
	accessToken: string
	refreshToken: null // Always null in response body; real refreshToken is in HttpOnly cookie
}

export interface VerifyOtpDto {
	email: string
	otp: string
}

export interface SendOtpDto {
	email: string
}

export interface GoogleSignInDto {
	code: string
}
