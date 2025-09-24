'use client'

import { useState } from 'react'
import { signIn } from '@/services/auth'
import { AuthSuccessResponse } from '@/lib/types'

const SignInForm = () => {
	const [usernameOrEmail, setUsernameOrEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [user, setUser] = useState<AuthSuccessResponse['user'] | null>(null)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoading(true)
		setError(null)

		const response = await signIn({ usernameOrEmail, password })

		setLoading(false)

		if (response.success && response.data) {
			setUser(response.data.user)
			// In a real app, you'd redirect or save the token.
			// For now, we'll just log it and show a success message.
			console.log('Login successful!', response.data)
		} else {
			setError(response.message || 'An unknown error occurred.')
		}
	}

	// If login is successful, show a success message instead of the form
	if (user) {
		return (
			<div className='text-center'>
				<h2 className='text-2xl font-bold text-green-600'>Login Successful!</h2>
				<p className='mt-4 text-gray-700'>Welcome, {user.firstName}!</p>
				<p className='mt-2 text-gray-500'>Your email is: {user.email}</p>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-6'>
			{error && (
				<div
					className='rounded-md bg-red-50 p-4 text-sm text-red-700'
					role='alert'
				>
					{error}
				</div>
			)}
			<div>
				<label
					htmlFor='email'
					className='block text-sm font-medium text-gray-700'
				>
					Email Address
				</label>
				<input
					id='email'
					name='email'
					type='email'
					autoComplete='email'
					required
					value={usernameOrEmail}
					onChange={e => setUsernameOrEmail(e.target.value)}
					className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900'
				/>
			</div>
			<div>
				<label
					htmlFor='password'
					className='block text-sm font-medium text-gray-700'
				>
					Password
				</label>
				<input
					id='password'
					name='password'
					type='password'
					autoComplete='current-password'
					required
					value={password}
					onChange={e => setPassword(e.target.value)}
					className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900'
				/>
			</div>
			<div>
				<button
					type='submit'
					disabled={loading}
					className='flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
				>
					{loading ? 'Signing In...' : 'Sign In'}
				</button>
			</div>
		</form>
	)
}

export default SignInForm
