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
			let fallback: ReactNode

			if (this.props.fallbackRender) {
				fallback = this.props.fallbackRender({
					error: this.state.error,
					onReset: this.handleReset,
				})
			} else if (this.props.fallback) {
				fallback = this.props.fallback
			} else {
				fallback = (
					<ErrorBoundaryFallback
						error={this.state.error}
						onReset={this.handleReset}
					/>
				)
			}

			return (
				<div
					data-error-boundary='active'
					data-error-boundary-message={this.state.error?.message ?? ''}
				>
					{fallback}
				</div>
			)
		}

		return this.props.children
	}
}
