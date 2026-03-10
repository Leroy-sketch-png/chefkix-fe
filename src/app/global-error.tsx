'use client'

/**
 * Global error boundary — catches errors in the root layout itself.
 * This is the last line of defense. Must include its own <html> and <body>.
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	return (
		<html lang='en'>
			<body
				style={{
					margin: 0,
					fontFamily: 'system-ui, sans-serif',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '100vh',
					backgroundColor: '#f8f4ef',
					color: '#2c2420',
				}}
			>
				<div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
					<div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👨‍🍳</div>
					<h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
						Something went wrong
					</h1>
					<p
						style={{
							fontSize: '0.875rem',
							color: '#6b5e56',
							marginBottom: '1.5rem',
						}}
					>
						A critical error occurred. Please refresh to try again.
					</p>
					<button
						onClick={reset}
						style={{
							padding: '0.75rem 1.5rem',
							backgroundColor: '#ff5a36',
							color: 'white',
							border: 'none',
							borderRadius: '0.5rem',
							fontSize: '0.875rem',
							fontWeight: 600,
							cursor: 'pointer',
						}}
					>
						Try Again
					</button>
				</div>
			</body>
		</html>
	)
}
