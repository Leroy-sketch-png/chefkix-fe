import { PATHS } from './paths'

// These are routes that do not require authentication
export const PUBLIC_ROUTES = [
	PATHS.HOME,
	PATHS.AUTH.SIGN_IN,
	PATHS.AUTH.SIGN_UP,
	PATHS.AUTH.VERIFY_OTP,
	PATHS.AUTH.FORGOT_PASSWORD,
	PATHS.AUTH.RESET_PASSWORD,
	PATHS.AUTH.GOOGLE_CALLBACK, // OAuth callback must be public
]

// These are routes that require authentication
export const PROTECTED_ROUTES = [PATHS.DASHBOARD]

// These are routes that are used for authentication
// Users will be redirected to the dashboard if they are already authenticated
export const AUTH_ROUTES = [PATHS.AUTH.SIGN_IN, PATHS.AUTH.SIGN_UP]
