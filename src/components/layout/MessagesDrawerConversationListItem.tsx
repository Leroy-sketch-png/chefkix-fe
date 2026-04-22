'use client'

import Image from 'next/image'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'

interface MessagesDrawerConversationListItemProps {
	name: string
	avatar: string
	previewText?: string
	unreadCount?: number
	onClick: () => void
}

function MessagesDrawerConversationListItemFallback({
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

function MessagesDrawerConversationListItemContent({
	name,
	avatar,
	previewText,
	unreadCount,
	onClick,
}: MessagesDrawerConversationListItemProps) {
	return (
		<button
			type='button'
			onClick={onClick}
			className='flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-bg-hover'
		>
			<div className='relative size-9 flex-shrink-0 overflow-hidden rounded-full'>
				<Image
					src={avatar}
					alt={name}
					fill
					sizes='36px'
					className='object-cover'
				/>
			</div>
			<div className='min-w-0 flex-1'>
				<p className='truncate text-sm font-medium'>{name}</p>
				{previewText ? (
					<p className='truncate text-xs text-text-secondary'>{previewText}</p>
				) : null}
			</div>
			{unreadCount && unreadCount > 0 ? (
				<span className='flex size-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white'>
					{unreadCount}
				</span>
			) : null}
		</button>
	)
}

export function MessagesDrawerConversationListItem(
	props: MessagesDrawerConversationListItemProps,
) {
	return (
		<ErrorBoundary
			fallbackRender={({ error, onReset }) => (
				<MessagesDrawerConversationListItemFallback
					error={error}
					onReset={onReset}
				/>
			)}
		>
			<MessagesDrawerConversationListItemContent {...props} />
		</ErrorBoundary>
	)
}
