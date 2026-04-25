'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { ChatMessage } from '@/services/chat'

interface MessagesDrawerMessageBubbleProps {
	message: ChatMessage
}

function MessagesDrawerMessageBubbleFallback({
	error,
	onReset,
}: {
	error?: Error
	onReset: () => void
}) {
	const tCommon = useTranslations('common')

	return (
		<div
			role='alert'
			className='rounded-lg border border-destructive/20 bg-bg-card p-2 shadow-card'
		>
			<div className='flex flex-col gap-2'>
				<div className='flex items-start gap-2'>
					<div className='rounded-full bg-destructive/10 p-2 text-destructive'>
						<AlertCircle className='size-4' />
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-text-primary'>
							{tCommon('somethingWentWrong')}
						</p>
						<p className='mt-1 text-xs text-text-secondary'>
							{error?.message || tCommon('unexpectedError')}
						</p>
					</div>
				</div>
				<button
					type='button'
					onClick={onReset}
					className='inline-flex h-9 w-fit items-center justify-center rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-primary transition-colors hover:bg-bg-elevated'
				>
					{tCommon('tryAgain')}
				</button>
			</div>
		</div>
	)
}

function MessagesDrawerMessageBubbleContent({
	message,
}: MessagesDrawerMessageBubbleProps) {
	return (
		<div
			className={`flex items-end ${message.me ? 'justify-end' : 'justify-start'}`}
		>
			<div
				className={`max-w-[70%] rounded-lg p-2 ${
					message.me
						? 'rounded-br-none bg-brand text-white'
						: 'rounded-bl-none bg-bg-elevated'
				}`}
			>
				<p className='text-sm'>{message.message}</p>
			</div>
		</div>
	)
}

export function MessagesDrawerMessageBubble(
	props: MessagesDrawerMessageBubbleProps,
) {
	return (
		<ErrorBoundary
			fallbackRender={({ error, onReset }) => (
				<MessagesDrawerMessageBubbleFallback error={error} onReset={onReset} />
			)}
		>
			<MessagesDrawerMessageBubbleContent {...props} />
		</ErrorBoundary>
	)
}
