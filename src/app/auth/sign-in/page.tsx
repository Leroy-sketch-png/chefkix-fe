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
		</div>
	)
}

export default SignInPage
