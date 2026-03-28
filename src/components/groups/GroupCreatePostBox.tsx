'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Image, Smile, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { createGroupPost } from '@/services/post'
import { useAuthStore } from '@/store/authStore'

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
	const user = useAuthStore((state) => state.user)
	const [isOpen, setIsOpen] = useState(false)
	const [content, setContent] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async () => {
		if (!content.trim()) {
			toast.error('Post cannot be empty')
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
			toast.success('Post created successfully! 🎉', {
				position: 'top-right',
				duration: 3000,
			})

			setContent('')
			setIsOpen(false)
			onPostCreated?.()
		} catch (error) {
			toast.error('Failed to create post', {
				position: 'top-right',
				duration: 3000,
			})
			console.error('Post creation error:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!isOpen) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="bg-bg-card rounded-lg p-4 border border-border mb-6"
			>
				<button
					onClick={() => setIsOpen(true)}
					className="w-full text-left px-4 py-3 bg-bg rounded-full text-text-secondary hover:bg-bg/80 transition-colors"
				>
					What&apos;s on your mind?
				</button>

				<div className="flex gap-2 mt-4 flex-wrap">
					<button className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-brand transition-colors">
						<Image className="w-5 h-5" alt="Add photo" />
						Photo
					</button>
					<button className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-brand transition-colors">
						<Smile className="w-5 h-5" />
						Feeling
					</button>
					<button className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-brand transition-colors">
						<MapPin className="w-5 h-5" />
						Location
					</button>
				</div>
			</motion.div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-bg-card rounded-lg p-6 border border-border mb-6 shadow-sm"
		>
			<div className="mb-4">
				<p className="text-sm font-medium text-text mb-3">Post to {groupName}</p>
				<Textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="What's on your mind?"
					className="resize-none focus-visible:ring-brand"
					rows={4}
					disabled={isSubmitting}
				/>
			</div>

			<div className="flex justify-end gap-2">
				<Button
					variant="outline"
					onClick={() => {
						setIsOpen(false)
						setContent('')
					}}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || !content.trim()}
					className="bg-brand hover:bg-brand/90"
				>
					{isSubmitting ? 'Posting...' : 'Post'}
				</Button>
			</div>
		</motion.div>
	)
}
