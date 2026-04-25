'use client'

import { motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'

type MessageRole = 'user' | 'assistant'
type MessageType = 'text' | 'substitution' | 'technique' | 'warning' | 'tip'

export interface AiAssistantMessage {
	id: string
	role: MessageRole
	type: MessageType
	content: string
	timestamp: Date
	metadata?: {
		substitution?: {
			original: string
			replacement: string
			ratio?: string
		}
		confidence?: number
	}
}

interface AiAssistantChatMessageProps {
	message: AiAssistantMessage
}

function AiAssistantChatMessageFallback({
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
			className='rounded-xl border border-destructive/20 bg-bg-card p-3 shadow-card'
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

function AiAssistantChatMessageContent({
	message,
}: AiAssistantChatMessageProps) {
	const t = useTranslations('cooking')
	const isUser = message.role === 'user'

	return (
		<motion.div
			initial={{ opacity: 0, y: 10, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={TRANSITION_SPRING}
			className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}
		>
			<div
				className={cn(
					'flex size-8 shrink-0 items-center justify-center rounded-full text-sm',
					isUser ? 'bg-brand text-white' : 'bg-gradient-indigo text-white',
				)}
			>
				{isUser ? '👤' : '✨'}
			</div>

			<div
				className={cn(
					'max-w-[80%] rounded-2xl px-4 py-2.5',
					isUser ? 'bg-brand text-white' : 'bg-bg-elevated text-text',
					message.type === 'warning' &&
						!isUser &&
						'border border-warning/30 bg-warning/10',
					message.type === 'tip' &&
						!isUser &&
						'border border-success/30 bg-success/10',
				)}
			>
				{message.type === 'warning' && (
					<div className='mb-1.5 flex items-center gap-1.5 text-warning'>
						<AlertTriangle className='size-4' />
						<span className='text-xs font-semibold uppercase'>
							{t('aiWarning')}
						</span>
					</div>
				)}
				{message.type === 'tip' && (
					<div className='mb-1.5 flex items-center gap-1.5 text-success'>
						<Lightbulb className='size-4' />
						<span className='text-xs font-semibold uppercase'>
							{t('aiProTip')}
						</span>
					</div>
				)}

				{message.type === 'substitution' && message.metadata?.substitution && (
					<div className='mb-2 rounded-lg bg-bg-card p-3'>
						<p className='text-xs font-medium uppercase text-text-tertiary'>
							Substitution
						</p>
						<div className='mt-1 flex items-center gap-2'>
							<span className='font-medium line-through opacity-60'>
								{message.metadata.substitution.original}
							</span>
							<span>→</span>
							<span className='font-bold text-success'>
								{message.metadata.substitution.replacement}
							</span>
						</div>
						{message.metadata.substitution.ratio && (
							<p className='mt-1 text-sm text-text-secondary'>
								{t('aiRatio', { ratio: message.metadata.substitution.ratio })}
							</p>
						)}
					</div>
				)}

				<p className='text-sm leading-relaxed'>{message.content}</p>
			</div>
		</motion.div>
	)
}

export function AiAssistantChatMessage(props: AiAssistantChatMessageProps) {
	return (
		<ErrorBoundary
			fallbackRender={({ error, onReset }) => (
				<AiAssistantChatMessageFallback error={error} onReset={onReset} />
			)}
		>
			<AiAssistantChatMessageContent {...props} />
		</ErrorBoundary>
	)
}
