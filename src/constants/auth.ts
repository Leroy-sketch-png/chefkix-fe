import { PATHS } from './paths'

// This is a list of routes that are accessible to the public and do not require authentication.
export const PUBLIC_ROUTES = [
	PATHS.HOME,
	PATHS.AUTH.SIGN_IN,
	PATHS.AUTH.SIGN_UP,
]

// This is a list of routes that are only for unauthenticated users.
// If an authenticated user tries to access these, they will be redirected to the dashboard.
export const AUTH_ROUTES = [PATHS.AUTH.SIGN_IN, PATHS.AUTH.SIGN_UP]
