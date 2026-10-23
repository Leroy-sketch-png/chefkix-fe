'use client'

import { useTranslations } from 'next-intl'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { createGroupPost } from '@/services/post'
import { moderateContent } from '@/services/ai'
import { useAuthStore } from '@/store/authStore'
import { logDevError } from '@/lib/dev-log'

interface GroupCreatePostBoxProps {
	groupId: string
	groupName: string
	onPostCreated?: () => void
}

/**
 * Simple Facebook-like post creation box for groups
 * Creates posts and submits to the backend
 */
export function GroupCreatePostBox({
	groupId,
	groupName,
	onPostCreated,
}: GroupCreatePostBoxProps) {
	const user = useAuthStore(state => state.user)
	const [isOpen, setIsOpen] = useState(false)
	const [content, setContent] = useState('')
	const t = useTranslations('groups')
	const socialT = useTranslations('social')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async () => {
		if (!content.trim()) {
			toast.error(t('gpPostEmpty'))
			return
		}

		setIsSubmitting(true)
		try {
			const moderationResult = await moderateContent(
				content.trim(),
				'post_caption',
			)
			if (!moderationResult.success) {
				toast.error(socialT('createPostModerationFailed'))
				return
			}

			const moderationAction = moderationResult.data?.action
			if (moderationAction !== 'approve') {
				if (moderationAction === 'block') {
					toast.error(socialT('createPostBlocked'))
				} else if (moderationAction === 'flag') {
					toast.warning(socialT('createPostFlagged'))
				} else {
					toast.error(socialT('createPostModerationFailed'))
				}
				return
			}

			// Create post with group context using the group-specific endpoint
			const response = await createGroupPost(groupId, {
				content: content.trim(),
				avatarUrl: user?.avatarUrl || '',
				postType: 'GROUP',
			})

			if (!response.success || !response.data) {
				toast.error(t('gpPostFailed'), {
					position: 'top-right',
					duration: 3000,
				})
				return
			}

			// Show corner toast with success message
			toast.success(t('gpPostCreated'), {
				position: 'top-right',
				duration: 3000,
			})

			setContent('')
			setIsOpen(false)
			onPostCreated?.()
		} catch (error) {
			toast.error(t('gpPostFailed'), {
				position: 'top-right',
				duration: 3000,
			})
			logDevError('Post creation error:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!isOpen) {
		return (
			<motion.div
				data-group-post-box
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/60 rounded-2xl p-4 border border-border-subtle/80 mb-6 shadow-card'
			>
				<button
					type='button'
					onClick={() => setIsOpen(true)}
					className='w-full text-left px-4 py-3 bg-bg rounded-full text-text-secondary hover:bg-bg/80 transition-colors'
				>
					{t('gpWhatsOnMind')}
				</button>
			</motion.div>
		)
	}

	return (
		<motion.div
			data-group-post-box
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className='bg-bg-card rounded-xl p-6 border border-border mb-6 shadow-card'
		>
			<div className='mb-4'>
				<p className='text-sm font-medium text-text-primary mb-3'>
					{t('gpPostTo', { groupName })}
				</p>
				<Textarea
					value={content}
					onChange={e => setContent(e.target.value)}
					placeholder={t('gpWhatsOnMind')}
					autoComplete='off'
					autoCorrect='off'
					autoCapitalize='none'
					spellCheck={false}
					className='resize-none focus-visible:ring-brand'
					rows={4}
					maxLength={2000}
					disabled={isSubmitting}
				/>
				{content.length > 0 && (
					<p
						className={`mt-1 text-right text-xs ${content.length > 1600 ? (content.length >= 2000 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}
					>
						{content.length}/2000
					</p>
				)}
			</div>

			<div className='flex justify-end gap-2'>
				<Button
					variant='outline'
					onClick={() => {
						setIsOpen(false)
						setContent('')
					}}
					disabled={isSubmitting}
				>
					{t('gpCancel')}
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || !content.trim()}
					className='bg-brand hover:bg-brand/90'
				>
					{isSubmitting ? (
						<>
							<Loader2 className='mr-2 size-4 animate-spin' />
							{t('gpPosting')}
						</>
					) : (
						t('gpPost')
					)}
				</Button>
			</div>
		</motion.div>
	)
}
