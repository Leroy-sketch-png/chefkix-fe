'use client'

import { useTranslations } from 'next-intl'

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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateGroup, changeGroupPrivacy } from '@/services/group'

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
	const t = useTranslations('groups')
	const [description, setDescription] = useState(group.description || '')
	const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>(
		group.privacyType as 'PUBLIC' | 'PRIVATE',
	)

	// UI state
	const [isLoading, setIsLoading] = useState(false)

	// Handle save changes
	const handleSaveChanges = async () => {
		if (!name.trim()) {
			toast.error(t('gsNameEmpty'))
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

			toast.success(t('gsUpdated'))
			onSettingsUpdated?.(updatedGroup)
			onOpenChange(false)
		} catch (error) {
			toast.error(t('gsUpdateFailed'))
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>{t('gsTitle')}</DialogTitle>
					<DialogDescription>{t('gsDescription')}</DialogDescription>
				</DialogHeader>

				<div className='space-y-4'>
					{/* Group Name */}
					<div>
						<label className='block text-sm font-medium text-text mb-2'>
							{t('gsNameLabel')}
						</label>
						<Input
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder={t('gsNamePlaceholder')}
							className='bg-bg border-border-subtle'
							maxLength={50}
						/>
					</div>

					{/* Description */}
					<div>
						<label className='block text-sm font-medium text-text mb-2'>
							{t('gsDescLabel')}
						</label>
						<Textarea
							value={description}
							onChange={e => setDescription(e.target.value)}
							placeholder={t('gsDescPlaceholder')}
							className='bg-bg border-border-subtle resize-none'
							rows={4}
							maxLength={500}
						/>
						{description.length > 0 && (
						<p className={`mt-1 text-right text-xs ${description.length > 400 ? (description.length >= 500 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}>
								{description.length}/500
							</p>
						)}
					</div>

					{/* Privacy */}
					<div>
						<label className='block text-sm font-medium text-text mb-2'>
							{t('gsPrivacyLabel')}
						</label>
						<Select
							value={privacy}
							onValueChange={value => setPrivacy(value as 'PUBLIC' | 'PRIVATE')}
						>
							<SelectTrigger className='bg-bg border-border-subtle'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='PUBLIC'>
									{t('gsPublicOption')}
								</SelectItem>
								<SelectItem value='PRIVATE'>{t('gsPrivateOption')}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Save Button */}
					<Button
						onClick={handleSaveChanges}
						disabled={isLoading || !name.trim()}
						className='w-full bg-brand hover:bg-brand/90 text-white'
					>
						{isLoading ? (
							<>
								<Loader2 className='size-4 mr-2 animate-spin' />
								{t('gsSaving')}
							</>
						) : (
							t('gsSaveChanges')
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
