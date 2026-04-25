'use client'

import { useEffect } from 'react'
import { logDevError } from '@/lib/dev-log'

/**
 * Root-level error boundary. Catches errors outside (main)/ route group.
 * Intentionally minimal — no design system deps that could themselves error.
 */
export default function RootError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		logDevError('[RootError]', error)
	}, [error])

	return (
		<div
			style={{
				display: 'flex',
				minHeight: '60vh',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '2rem',
			}}
		>
			<div style={{ maxWidth: '400px', textAlign: 'center' }}>
				<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍳</div>
				<h2
					style={{
						fontSize: '1.25rem',
						fontWeight: 700,
						marginBottom: '0.5rem',
					}}
				>
					Something went wrong
				</h2>
				<p
					style={{
						fontSize: '0.875rem',
						color: '#666',
						marginBottom: '1.5rem',
					}}
				>
					An unexpected error occurred. Please try again.
				</p>
				{process.env.NODE_ENV === 'development' && (
					<pre
						style={{
							fontSize: '0.75rem',
							color: '#c00',
							textAlign: 'left',
							background: '#fef2f2',
							padding: '0.75rem',
							borderRadius: '0.5rem',
							overflow: 'auto',
							marginBottom: '1rem',
						}}
					>
						{error.message}
					</pre>
				)}
				<button
					onClick={reset}
					style={{
						padding: '0.5rem 1.5rem',
						background: '#ff5a36',
						color: 'white',
						border: 'none',
						borderRadius: '0.5rem',
						cursor: 'pointer',
						fontWeight: 600,
					}}
				>
					Try Again
				</button>
			</div>
		</div>
	)
}
