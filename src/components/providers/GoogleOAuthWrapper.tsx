'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { ReactNode } from 'react'

interface GoogleOAuthWrapperProps {
	children: ReactNode
}

/**
 * Wrapper that conditionally renders GoogleOAuthProvider only when
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured. This prevents the
 * "Missing required parameter client_id" error when Google OAuth
 * is not set up.
 *
 * When Google OAuth is not configured:
 * - GoogleSignInButton will be disabled/hidden
 * - useGoogleLogin hook will not crash the app
 */
export function GoogleOAuthWrapper({ children }: GoogleOAuthWrapperProps) {
	const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

	// If no Google Client ID is configured, render children without the provider
	// This allows the app to work without Google OAuth
	if (!clientId) {
		return <>{children}</>
	}

	return (
		<GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
	)
}
