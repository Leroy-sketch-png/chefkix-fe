'use client'

import { motion } from 'framer-motion'
import { AlertCircle, Clock, Copy, FileText, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { cn } from '@/lib/utils'
import { ICON_BUTTON_HOVER, ICON_BUTTON_TAP, staggerItem } from '@/lib/motion'
import { RecipeSummary } from '@/lib/types/recipe'

interface DraftsListCardProps {
	draft: RecipeSummary
	isDuplicating: boolean
	onSelectDraft: (draftId: string) => void
	onDuplicate: (draftId: string) => void
	onDelete: (draft: RecipeSummary) => void
}

function DraftsListCardFallback({
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
			className='rounded-2xl border border-destructive/20 bg-bg-card p-4 shadow-card'
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

function DraftsListCardContent({
	draft,
	isDuplicating,
	onSelectDraft,
	onDuplicate,
	onDelete,
}: DraftsListCardProps) {
	const t = useTranslations('recipe')

	return (
		<motion.div
			variants={staggerItem}
			layout
			exit={{ opacity: 0, x: -20 }}
			className='group relative flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4 transition-all hover:border-brand/50 hover:bg-bg-elevated'
		>
			<div className='flex size-16 flex-shrink-0 items-center justify-center rounded-xl bg-bg-elevated text-2xl'>
				{draft.coverImageUrl?.[0] ? (
					<Image
						src={draft.coverImageUrl[0]}
						alt={draft.title}
						width={64}
						height={64}
						className='size-full rounded-xl object-cover'
					/>
				) : (
					<FileText className='size-6 text-text-muted' />
				)}
			</div>

			<button
				type='button'
				onClick={() => onSelectDraft(draft.id)}
				className='flex flex-1 flex-col items-start text-left'
			>
				<div className='font-semibold text-text'>
					{draft.title || t('untitledRecipe')}
				</div>
				<div className='flex items-center gap-2 text-xs text-text-muted'>
					<Clock className='size-3' />
					<span>
						{draft.createdAt
							? t('createdAgo', {
									time: formatDistanceToNow(new Date(draft.createdAt), {
										addSuffix: true,
									}),
								})
							: t('draft')}
					</span>
				</div>
				{draft.description && (
					<div className='mt-1 line-clamp-1 text-sm text-text-secondary'>
						{draft.description}
					</div>
				)}
			</button>

			<div className='flex items-center gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100'>
				<motion.button
					type='button'
					onClick={e => {
						e.stopPropagation()
						onDuplicate(draft.id)
					}}
					whileHover={ICON_BUTTON_HOVER}
					whileTap={ICON_BUTTON_TAP}
					disabled={isDuplicating}
					title={t('duplicateDraft')}
					className='flex size-9 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-brand/10 hover:text-brand disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					<Copy className={cn('size-4', isDuplicating && 'animate-pulse')} />
				</motion.button>
				<motion.button
					type='button'
					onClick={e => {
						e.stopPropagation()
						onDelete(draft)
					}}
					whileHover={ICON_BUTTON_HOVER}
					whileTap={ICON_BUTTON_TAP}
					title={t('deleteDraft')}
					className='flex size-9 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-error/10 hover:text-error focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					<Trash2 className='size-4' />
				</motion.button>
			</div>
		</motion.div>
	)
}

export function DraftsListCard(props: DraftsListCardProps) {
	return (
		<ErrorBoundary
			fallbackRender={({ error, onReset }) => (
				<DraftsListCardFallback error={error} onReset={onReset} />
			)}
		>
			<DraftsListCardContent {...props} />
		</ErrorBoundary>
	)
}
