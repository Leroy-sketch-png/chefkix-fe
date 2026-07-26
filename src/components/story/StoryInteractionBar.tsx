import React, { useState } from 'react'
import { Frown, Heart, Send, Smile, ThumbsDown, Zap } from 'lucide-react'
import { useTranslations } from '@/i18n/hooks'

interface Props {
	onReact: (event: React.MouseEvent<HTMLButtonElement>, type: string) => void
	onReply: (text: string) => Promise<void>
	onComposingChange?: (isComposing: boolean) => void
}

const reactions = [
	{ type: 'LOVE', label: 'reactionLove', icon: Heart, color: 'text-error' },
	{ type: 'HAHA', label: 'reactionLaugh', icon: Smile, color: 'text-warning' },
	{ type: 'WOW', label: 'reactionWow', icon: Zap, color: 'text-xp' },
	{ type: 'SAD', label: 'reactionSad', icon: Frown, color: 'text-info' },
	{
		type: 'ANGRY',
		label: 'reactionAngry',
		icon: ThumbsDown,
		color: 'text-error',
	},
] as const

export default function StoryInteractionBar({
	onReact,
	onReply,
	onComposingChange,
}: Props) {
	const [text, setText] = useState('')
	const [isSending, setIsSending] = useState(false)
	const [error, setError] = useState('')
	const t = useTranslations('story')

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const content = text.trim()
		if (!content || isSending) return

		setIsSending(true)
		setError('')
		try {
			await onReply(content)
			setText('')
		} catch {
			setError(t('replyFailed'))
		} finally {
			setIsSending(false)
		}
	}

	return (
		<div className='flex w-full flex-col gap-2'>
			<form className='flex items-center gap-2' onSubmit={handleSubmit}>
				<input
					value={text}
					onChange={event => setText(event.target.value)}
					onFocus={() => onComposingChange?.(true)}
					onBlur={() => onComposingChange?.(false)}
					placeholder={t('replyPlaceholder')}
					aria-label={t('replyPlaceholder')}
					aria-describedby={error ? 'story-reply-error' : undefined}
					className='h-11 min-w-0 flex-1 rounded-full border border-white/20 bg-black/45 px-4 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/60 focus-visible:border-white/70 focus-visible:ring-2 focus-visible:ring-white/30'
				/>
				<button
					type='submit'
					disabled={!text.trim() || isSending}
					className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-45'
					aria-label={isSending ? t('replySending') : t('replySend')}
					title={isSending ? t('replySending') : t('replySend')}
				>
					<Send size={18} aria-hidden='true' />
				</button>
			</form>

			{error && (
				<p
					id='story-reply-error'
					role='alert'
					className='px-1 text-xs font-medium text-red-200'
				>
					{error}
				</p>
			)}

			<div className='flex items-center justify-center gap-3'>
				{reactions.map(({ type, label, icon: Icon, color }) => (
					<button
						key={type}
						type='button'
						onClick={event => onReact(event, type)}
						className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
						aria-label={t(label)}
						title={t(label)}
					>
						<Icon size={18} className={color} aria-hidden='true' />
					</button>
				))}
			</div>
		</div>
	)
}
