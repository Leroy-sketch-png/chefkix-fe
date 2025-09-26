import Link from 'next/link'
import { SignUpForm } from './components/SignUpForm'

const SignUpPage = () => {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50'>
			<div className='w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-lg'>
				<h1 className='mb-4 text-center text-3xl font-bold text-gray-900'>
					Create an Account
				</h1>
				<p className='mb-8 text-center text-gray-600'>
					Join ChefKix and gamify your cooking.
				</p>
				<SignUpForm />
			</div>
		</div>
	)
}

export default SignUpPage
