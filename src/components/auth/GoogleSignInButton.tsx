import React from 'react'
import { Button } from '@/components/ui/button'
import { useGoogleLogin } from '@react-oauth/google'

interface GoogleSignInButtonProps {
	onSuccess: (code: string) => void
	onFailure: (error: any) => void
	text?: string
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
	onSuccess,
	onFailure,
	text = 'Sign in with Google',
}) => {
	const login = useGoogleLogin({
		onSuccess: tokenResponse => {
			if (tokenResponse.code) {
				onSuccess(tokenResponse.code)
			} else {
				onFailure(new Error('No authorization code found in Google response'))
			}
		},
		onError: error => {
			onFailure(error)
		},
		flow: 'auth-code', // Still request secure authorization code
	})

	return (
		<Button onClick={() => login()} className='w-full'>
			{text}
		</Button>
	)
}

export default GoogleSignInButton
