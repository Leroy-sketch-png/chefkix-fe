'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorState } from '@/components/ui/error-state'

interface Props {
	children: ReactNode
	fallback?: ReactNode
	onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
	hasError: boolean
	error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	}

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo)
		this.props.onError?.(error, errorInfo)
	}

	private handleReset = () => {
		this.setState({ hasError: false, error: undefined })
	}

	public render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback
			}

			return (
				<div className='flex min-h-panel-md items-center justify-center p-6'>
					<ErrorState
						title='Something went wrong'
						message={
							this.state.error?.message ||
							'An unexpected error occurred. Please try again.'
						}
						onRetry={this.handleReset}
					/>
				</div>
			)
		}

		return this.props.children
	}
}
