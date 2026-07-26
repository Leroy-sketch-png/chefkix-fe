import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Props {
	storyId: string
	storyOwnerId?: string
	thumbnailUrl?: string
	isOwn: boolean
}

export default function RepliedStoryPreview({
	storyId,
	storyOwnerId,
	thumbnailUrl,
	isOwn,
}: Props) {
	const messages = useTranslations('messages')
	const story = useTranslations('story')

	if (!thumbnailUrl || !storyId) return null

	const title = messages(isOwn ? 'storyReplyOwn' : 'storyReplyReceived')
	const preview = (
		<>
			<div className='relative h-16 w-10 flex-shrink-0 overflow-hidden rounded-md border border-border-subtle'>
				<img
					src={thumbnailUrl}
					alt={story('storyMediaAlt')}
					className='h-full w-full object-cover'
				/>
			</div>

			<div className='flex min-w-0 flex-col pr-2'>
				<span className='text-caption font-medium leading-tight text-text-primary'>
					{title}
				</span>
				<span className='mt-1 text-2xs text-text-muted'>
					{storyOwnerId
						? messages('tapToView')
						: messages('storyReplyUnavailable')}
				</span>
			</div>
		</>
	)

	const className =
		'mb-1 flex w-fit max-w-xs items-center gap-3 rounded-lg border border-border-subtle bg-bg-elevated p-2 shadow-card'

	if (!storyOwnerId) {
		return <div className={className}>{preview}</div>
	}

	const linkHref = `/story/view/${encodeURIComponent(storyOwnerId)}?startAt=${encodeURIComponent(storyId)}`

	return (
		<Link
			href={linkHref}
			aria-label={`${title}. ${messages('tapToView')}`}
			className={`${className} transition-colors hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.98]`}
		>
			{preview}
		</Link>
	)
}
