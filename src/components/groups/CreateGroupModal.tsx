'use client'

import { useTranslations } from 'next-intl'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createGroup } from '@/services/group'
import { Group, CreateGroupRequest, PrivacyType } from '@/lib/types/group'
import { Loader2, Upload } from 'lucide-react'

const createGroupSchema = z.object({
	name: z
		.string()
		.min(3, 'Group name must be at least 3 characters')
		.max(50, 'Group name cannot exceed 50 characters'),
	description: z
		.string()
		.max(500, 'Description cannot exceed 500 characters'),
	privacyType: z.enum(['PUBLIC', 'PRIVATE']),
	tags: z.array(z.string()),
})

type CreateGroupFormValues = z.infer<typeof createGroupSchema>

interface CreateGroupModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess?: (group: Group) => void
}

/**
 * Modal for creating a new group
 * Allows user to set name, description, privacy, and tags
 */
export const CreateGroupModal = ({
	open,
	onOpenChange,
	onSuccess,
}: CreateGroupModalProps) => {
	const t = useTranslations('groups')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<CreateGroupFormValues>({
		resolver: zodResolver(createGroupSchema),
		defaultValues: {
			name: '',
			description: '',
			privacyType: 'PUBLIC',
			tags: [],
		},
	})

	const onSubmit = async (values: CreateGroupFormValues) => {
		setIsSubmitting(true)
		try {
			const payload: CreateGroupRequest = {
				name: values.name,
				description: values.description || '',
				privacyType: values.privacyType as PrivacyType,
				tags: values.tags || [],
			}

			const newGroup = await createGroup(payload)
			toast.success(t('cgCreated', { name: newGroup.name }))
			form.reset()
			onOpenChange(false)
			onSuccess?.(newGroup)
		} catch (error) {
			toast.error(t('cgCreateFailed'))
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{t('cgTitle')}</DialogTitle>
					<DialogDescription>
						{t('cgDescription')}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-6'
					>
						{/* Group Name */}
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('cgNameLabel')}</FormLabel>
									<FormControl>
										<Input
											placeholder={t('cgNamePlaceholder')}
											{...field}
											disabled={isSubmitting}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Description */}
						<FormField
							control={form.control}
							name='description'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('cgDescLabel')}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t('cgDescPlaceholder')}
											{...field}
											disabled={isSubmitting}
											rows={4}
										/>
									</FormControl>
									<FormDescription>
										{t('cgDescHint')}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Privacy Type */}
						<FormField
							control={form.control}
							name='privacyType'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('cgPrivacyLabel')}</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										disabled={isSubmitting}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={t('cgPrivacyPlaceholder')} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value='PUBLIC'>
												<div className='flex flex-col'>
														<span>{t('cgPublic')}</span>
														<span className='text-xs text-text-secondary'>
															{t('cgPublicDesc')}
														</span>
													</div>
												</SelectItem>
												<SelectItem value='PRIVATE'>
													<div className='flex flex-col'>
														<span>{t('cgPrivate')}</span>
														<span className='text-xs text-text-secondary'>
															{t('cgPrivateDesc')}
													</span>
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Tags */}
						<FormField
							control={form.control}
							name='tags'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('cgTagsLabel')}</FormLabel>
									<FormControl>
										<Input
											placeholder={t('cgTagsPlaceholder')}
											onChange={(e) => {
												const values = e.target.value
													.split(',')
													.map((tag) => tag.trim())
													.filter(Boolean)
												field.onChange(values)
											}}
											value={field.value?.join(', ') || ''}
											disabled={isSubmitting}
										/>
									</FormControl>
									<FormDescription>
										{t('cgTagsHint')}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Submit Button */}
						<div className='flex gap-3 justify-end pt-4'>
							<Button
								variant='outline'
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								{t('cgCancel')}
							</Button>
							<Button
								type='submit'
								className='bg-brand hover:bg-brand/90 text-white'
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<>
										<Loader2 className='size-4 mr-2 animate-spin' />
										{t('cgCreating')}
									</>
								) : (
									t('cgCreateGroup')
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
