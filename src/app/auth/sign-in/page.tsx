import Link from 'next/link'
import SignInForm from './components/SignInForm'

const SignInPage = () => {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50'>
			<div className='w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-lg'>
				<h1 className='mb-4 text-center text-3x1 font-bold text-gray-900'>
					Sign In
				</h1>
				<p className='mb-8 text-center text-gray-600'>
					Welcome back! Please enter your credentials.
				</p>
				<SignInForm />
			</div>
			<p className='mt-6 text-center text-sm text-gray-600'>
				Don&apos;t have an account?{' '}
				<Link
					href='/auth/sign-up'
					className='font-medium text-indigo-600 hover:text-indigo-500'
				>
					Sign Up
				</Link>
			</p>
		</div>
	)
}

export default SignInPage
