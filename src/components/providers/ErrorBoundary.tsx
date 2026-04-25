'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ErrorState } from '@/components/ui/error-state'
import { logDevError } from '@/lib/dev-log'

interface Props {
	children: ReactNode
	fallback?: ReactNode
	fallbackRender?: (props: { error?: Error; onReset: () => void }) => ReactNode
	onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
	hasError: boolean
	error?: Error
}

function ErrorBoundaryFallback({
	error,
	onReset,
}: {
	error?: Error
	onReset: () => void
}) {
	const t = useTranslations('common')
	return (
		<div className='flex min-h-panel-md items-center justify-center p-6'>
			<ErrorState
				title={t('somethingWentWrong')}
				message={error?.message || t('unexpectedError')}
				onRetry={onReset}
			/>
		</div>
	)
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	}

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		if (process.env.NODE_ENV === 'development') {
			logDevError('ErrorBoundary caught an error:', error, errorInfo)
		}
		this.props.onError?.(error, errorInfo)
	}

	private handleReset = () => {
		this.setState({ hasError: false, error: undefined })
	}

	public render() {
		if (this.state.hasError) {
			if (this.props.fallbackRender) {
				return this.props.fallbackRender({
					error: this.state.error,
					onReset: this.handleReset,
				})
			}

			if (this.props.fallback) {
				return this.props.fallback
			}

			return (
				<ErrorBoundaryFallback
					error={this.state.error}
					onReset={this.handleReset}
				/>
			)
		}

		return this.props.children
	}
}
