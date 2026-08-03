'use client'

import { useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'
import { logDevError } from '@/lib/dev-log'

export function GlobalErrorReporter({ error }: { error: Error }) {
	useEffect(() => {
		logDevError('[GlobalError]', error)
	}, [error])

	return null
}

export function GlobalErrorContent({ reset }: { reset: () => void }) {
	return (
		<div
			role='alert'
			style={{
				width: '100%',
				maxWidth: '28rem',
				padding: '2rem',
				textAlign: 'center',
			}}
		>
			<div
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: '4rem',
					height: '4rem',
					marginBottom: '1.25rem',
					borderRadius: '9999px',
					backgroundColor: '#fee2e2',
					color: '#b42318',
				}}
			>
				<TriangleAlert aria-hidden='true' size={32} strokeWidth={2} />
			</div>
			<h1 style={{ margin: 0, fontSize: '1.5rem', lineHeight: 1.25 }}>
				Something went wrong
			</h1>
			<p
				style={{
					margin: '0.75rem 0 1.5rem',
					fontSize: '0.9375rem',
					lineHeight: 1.5,
					color: '#5f625d',
				}}
			>
				ChefKix could not load. Try again, or return home and start fresh.
			</p>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					gap: '0.75rem',
				}}
			>
				<button
					type='button'
					onClick={reset}
					style={{
						minHeight: '2.75rem',
						padding: '0.75rem 1.25rem',
						border: 'none',
						borderRadius: '0.5rem',
						backgroundColor: '#e84a2a',
						color: '#ffffff',
						fontSize: '0.875rem',
						fontWeight: 700,
						cursor: 'pointer',
					}}
				>
					Try again
				</button>
				<form action='/' method='get' style={{ margin: 0 }}>
					<button
						type='submit'
						style={{
							minHeight: '2.75rem',
							padding: '0.75rem 1.25rem',
							border: '1px solid #d6d8d2',
							borderRadius: '0.5rem',
							backgroundColor: '#ffffff',
							color: '#242621',
							fontSize: '0.875rem',
							fontWeight: 700,
							cursor: 'pointer',
						}}
					>
						Return home
					</button>
				</form>
			</div>
		</div>
	)
}

/**
 * Global error boundary - catches errors in the root layout itself.
 * This is the last line of defense. Must include its own html and body.
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
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '100vh',
					backgroundColor: '#f7f7f5',
					color: '#242621',
					fontFamily: 'system-ui, -apple-system, sans-serif',
				}}
			>
				<GlobalErrorReporter error={error} />
				<GlobalErrorContent reset={reset} />
			</body>
		</html>
	)
}
