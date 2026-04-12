import { PATHS } from '@/constants'

const GOOGLE_STATE_KEY = 'google-oauth-state'
const GOOGLE_CODE_VERIFIER_KEY = 'google-oauth-code-verifier'
const GOOGLE_RETURN_TO_KEY = 'google-oauth-return-to'

const KEYCLOAK_URL =
	process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180'
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'nottisn'
const KEYCLOAK_FRONTEND_CLIENT_ID =
	process.env.NEXT_PUBLIC_KEYCLOAK_SPA_CLIENT_ID || 'chefkix-frontend'

function toBase64Url(input: ArrayBuffer | Uint8Array): string {
	const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
	let binary = ''
	bytes.forEach(byte => {
		binary += String.fromCharCode(byte)
	})

	return btoa(binary)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '')
}

function generateRandomString(length: number): string {
	const bytes = new Uint8Array(length)
	crypto.getRandomValues(bytes)
	return toBase64Url(bytes)
}

async function createCodeChallenge(verifier: string): Promise<string> {
	const encoded = new TextEncoder().encode(verifier)
	const digest = await crypto.subtle.digest('SHA-256', encoded)
	return toBase64Url(digest)
}

export interface GoogleSsoSession {
	codeVerifier: string
	redirectUri: string
	returnTo: string | null
}

export async function startGoogleSignIn(
	returnTo?: string | null,
): Promise<void> {
	const codeVerifier = generateRandomString(64)
	const state = generateRandomString(32)
	const codeChallenge = await createCodeChallenge(codeVerifier)
	const redirectUri = `${window.location.origin}${PATHS.AUTH.GOOGLE_CALLBACK}`

	sessionStorage.setItem(GOOGLE_STATE_KEY, state)
	sessionStorage.setItem(GOOGLE_CODE_VERIFIER_KEY, codeVerifier)
	if (returnTo && returnTo.startsWith('/')) {
		sessionStorage.setItem(GOOGLE_RETURN_TO_KEY, returnTo)
	} else {
		sessionStorage.removeItem(GOOGLE_RETURN_TO_KEY)
	}

	const params = new URLSearchParams({
		client_id: KEYCLOAK_FRONTEND_CLIENT_ID,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'openid profile email',
		kc_idp_hint: 'google',
		prompt: 'select_account',
		state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
	})

	window.location.assign(
		`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params.toString()}`,
	)
}

export function consumeGoogleSignInSession(
	expectedState: string,
): GoogleSsoSession | null {
	const storedState = sessionStorage.getItem(GOOGLE_STATE_KEY)
	const codeVerifier = sessionStorage.getItem(GOOGLE_CODE_VERIFIER_KEY)
	const returnTo = sessionStorage.getItem(GOOGLE_RETURN_TO_KEY)
	const redirectUri = `${window.location.origin}${PATHS.AUTH.GOOGLE_CALLBACK}`

	if (!storedState || storedState !== expectedState || !codeVerifier) {
		clearGoogleSignInSession()
		return null
	}

	return {
		codeVerifier,
		redirectUri,
		returnTo: returnTo && returnTo.startsWith('/') ? returnTo : null,
	}
}

export function clearGoogleSignInSession(): void {
	sessionStorage.removeItem(GOOGLE_STATE_KEY)
	sessionStorage.removeItem(GOOGLE_CODE_VERIFIER_KEY)
	sessionStorage.removeItem(GOOGLE_RETURN_TO_KEY)
}
