import type { ReactNode } from 'react'

type ProfilePageShellProps = {
	children: ReactNode
}

export function ProfilePageShell({ children }: ProfilePageShellProps) {
	return (
		<div className='min-h-screen bg-bg'>
			<div className='mx-auto w-full max-w-container-xl px-4 py-4 md:px-6 lg:px-8'>
				{children}
			</div>
		</div>
	)
}
