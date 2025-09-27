'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { PATHS } from '@/constants'

const DashboardPage = () => {
	const { user, logout } = useAuth()
	const router = useRouter()

	const handleLogout = () => {
		logout()
		router.push(PATHS.AUTH.SIGN_IN)
	}

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4'>
			<div className='w-full max-w-md rounded-lg bg-white p-8 shadow-md'>
				<h1 className='text-center text-3xl font-bold text-gray-900'>
					Welcome to Your Dashboard
				</h1>
				<div className='mt-6 text-center'>
					{user ? (
						<p className='text-lg text-gray-700'>
							You are signed in as{' '}
							<span className='font-semibold'>{user.username}</span>.
						</p>
					) : (
						<p className='text-lg text-gray-700'>Loading user data...</p>
					)}
				</div>
				<div className='mt-8'>
					<Button
						onClick={handleLogout}
						className='w-full'
						variant='destructive'
					>
						Sign Out
					</Button>
				</div>
			</div>
		</div>
	)
}

export default DashboardPage
