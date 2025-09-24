'use client'

import { useState } from 'react'
import { signUp } from '@/services/auth'

const SignUpForm = () => {
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
	const [loading, setLoading] = useState(false)
	const [success, setSuccess] = useState(false)

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoading(true)
		setErrors({})

		const response = await signUp({ username, email, password })

		setLoading(false)

		if (response.success && response.data) {
			setSuccess(true)
			console.log('Sign-up successful!', response.data)
		} else {
			if (response.error) {
				setErrors(response.error)
			} else {
				setErrors({
					general: [response.message || 'An unknown error occurred.'],
				})
			}
		}
	}

	if (success) {
		return (
			<div className='text-center'>
				<h2 className='text-2xl font-bold text-green-600'>Account Created!</h2>
				<p className='mt-4 text-gray-700'>You can now sign in.</p>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-6'>
			{errors.general && (
				<div
					className='rounded-md bg-red-50 p-4 text-sm text-red-700'
					role='alert'
				>
					{errors.general.join(', ')}
				</div>
			)}
			<div>
				<label
					htmlFor='username'
					className='block text-sm font-medium text-gray-700'
				>
					Username
				</label>
				<input
					id='username'
					name='username'
					type='text'
					autoComplete='username'
					required
					value={username}
					onChange={e => setUsername(e.target.value)}
					className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900'
				/>
			</div>
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
					value={email}
					onChange={e => setEmail(e.target.value)}
					className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900'
				/>
				{errors.email && (
					<p className='mt-2 text-sm text-red-600'>{errors.email.join(', ')}</p>
				)}
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
					autoComplete='new-password'
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
					className='flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm
  hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
				>
					{loading ? 'Creating Account...' : 'Create Account'}
				</button>
			</div>
		</form>
	)
}

export default SignUpForm
