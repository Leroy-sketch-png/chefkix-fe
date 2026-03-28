'use client'

import { useState } from 'react'
import { Group } from '@/lib/types/group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { updateGroup, changeGroupPrivacy } from '@/services/group'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface GroupSettingsModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	group: Group
	onSettingsUpdated?: (updatedGroup: Group) => void
}

/**
 * Admin settings modal for group management
 * Allows admins to:
 * - Change group name and description
 * - Change privacy type
 * - Delete group (owner only)
 *
 * Simple code for beginners - no complex state management
 */
export function GroupSettingsModal({
	open,
	onOpenChange,
	group,
	onSettingsUpdated,
}: GroupSettingsModalProps) {
	// Form state
	const [name, setName] = useState(group.name)
	const [description, setDescription] = useState(group.description || '')
	const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>(group.privacyType as 'PUBLIC' | 'PRIVATE')

	// UI state
	const [isLoading, setIsLoading] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	const isOwner = group.myRole === 'OWNER'

	// Handle save changes
	const handleSaveChanges = async () => {
		if (!name.trim()) {
			toast.error('Group name cannot be empty')
			return
		}

		setIsLoading(true)
		try {
			// Update name and description
			const updatedGroup = await updateGroup(group.id, {
				name: name.trim(),
				description: description.trim(),
			})

			// Update privacy if changed
			if (privacy !== group.privacyType) {
				await changeGroupPrivacy(group.id, privacy)
			}

			toast.success('Group updated successfully!')
			onSettingsUpdated?.(updatedGroup)
			onOpenChange(false)
		} catch (error) {
			toast.error('Failed to update group')
		} finally {
			setIsLoading(false)
		}
	}

	// Handle delete group
	const handleDeleteGroup = async () => {
		toast.info('Group deletion is not yet available.')
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Group Settings</DialogTitle>
						<DialogDescription>
							Update your group information
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						{/* Group Name */}
						<div>
							<label className='block text-sm font-medium text-text mb-2'>
								Group Name
							</label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder='Enter group name'
								className='bg-bg border-border'
							/>
						</div>

						{/* Description */}
						<div>
							<label className='block text-sm font-medium text-text mb-2'>
								Description
							</label>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder='Enter group description (optional)'
								className='bg-bg border-border resize-none'
								rows={4}
							/>
						</div>

						{/* Privacy */}
						<div>
							<label className='block text-sm font-medium text-text mb-2'>
								Privacy
							</label>
							<Select value={privacy} onValueChange={(value) => setPrivacy(value as 'PUBLIC' | 'PRIVATE')}>
								<SelectTrigger className='bg-bg border-border'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='PUBLIC'>
										Public - Anyone can find and join
									</SelectItem>
									<SelectItem value='PRIVATE'>
										Private - Members only
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Save Button */}
						<Button
							onClick={handleSaveChanges}
							disabled={isLoading}
							className='w-full bg-brand hover:bg-brand/90 text-white'
						>
							{isLoading ? (
								<>
									<Loader2 className='w-4 h-4 mr-2 animate-spin' />
									Saving...
								</>
							) : (
								'Save Changes'
							)}
						</Button>

						{/* Delete Button (Owner Only) */}
						{isOwner && (
							<Button
								onClick={() => setShowDeleteConfirm(true)}
								disabled={isLoading}
								variant='outline'
								className='w-full text-red-600 border-red-200 hover:bg-red-50'
							>
								<AlertTriangle className='w-4 h-4 mr-2' />
								Delete Group
							</Button>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				title='Delete Group?'
				description='This action cannot be undone. All posts and members data will be removed.'
				confirmLabel='Delete'
				cancelLabel='Cancel'
				variant='destructive'
				onConfirm={handleDeleteGroup}
			/>
		</>
	)
}
