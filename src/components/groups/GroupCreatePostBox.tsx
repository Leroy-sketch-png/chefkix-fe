'use client'

import { useTranslations } from 'next-intl'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Image as ImageIcon, Smile, MapPin, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { createGroupPost } from '@/services/post'
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
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async () => {
		if (!content.trim()) {
			toast.error(t('gpPostEmpty'))
			return
		}

		setIsSubmitting(true)
		try {
			// Create post with group context using the group-specific endpoint
			await createGroupPost(groupId, {
				content: content.trim(),
				avatarUrl: user?.avatarUrl || '',
				postType: 'GROUP',
			})

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
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='bg-bg-card rounded-lg p-4 border border-border mb-6'
			>
				<button
					type='button'
					onClick={() => setIsOpen(true)}
					className='w-full text-left px-4 py-3 bg-bg rounded-full text-text-secondary hover:bg-bg/80 transition-colors'
				>
					{t('gpWhatsOnMind')}
				</button>

				<div className='flex gap-2 mt-4 flex-wrap'>
					<button
						type='button'
						className='flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-brand rounded-md transition-colors'
					>
						<ImageIcon className='size-5' />
						{t('gpPhoto')}
					</button>
					<button
						type='button'
						className='flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-brand rounded-md transition-colors'
					>
						<Smile className='size-5' />
						{t('gpFeeling')}
					</button>
					<button
						type='button'
						className='flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-brand rounded-md transition-colors'
					>
						<MapPin className='size-5' />
						{t('gpLocation')}
					</button>
				</div>
			</motion.div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className='bg-bg-card rounded-lg p-6 border border-border mb-6 shadow-card'
		>
			<div className='mb-4'>
				<p className='text-sm font-medium text-text mb-3'>
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
