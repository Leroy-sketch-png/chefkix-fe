'use client'

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
			toast.success(`Group "${newGroup.name}" created successfully!`)
			form.reset()
			onOpenChange(false)
			onSuccess?.(newGroup)
		} catch (error) {
			toast.error('Failed to create group. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>Create a New Group</DialogTitle>
					<DialogDescription>
						Build a community around your cooking interests. Groups can be public
						or private.
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
									<FormLabel>Group Name *</FormLabel>
									<FormControl>
										<Input
											placeholder='e.g., Spicy Food Lovers'
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
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder='Describe what this group is about...'
											{...field}
											disabled={isSubmitting}
											rows={4}
										/>
									</FormControl>
									<FormDescription>
										Max 500 characters to help others find your group
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
									<FormLabel>Privacy *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										disabled={isSubmitting}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder='Select privacy level' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value='PUBLIC'>
												<div className='flex flex-col'>
													<span>Public</span>
													<span className='text-xs text-text-secondary'>
														Anyone can find and join
													</span>
												</div>
											</SelectItem>
											<SelectItem value='PRIVATE'>
												<div className='flex flex-col'>
													<span>Private</span>
													<span className='text-xs text-text-secondary'>
														Members must be approved to join
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
									<FormLabel>Tags</FormLabel>
									<FormControl>
										<Input
											placeholder='e.g., spicy, asian, vegetarian (comma-separated)'
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
										Help people find your group with relevant tags
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
								Cancel
							</Button>
							<Button
								type='submit'
								className='bg-brand hover:bg-brand/90 text-white'
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<>
										<Loader2 className='size-4 mr-2 animate-spin' />
										Creating...
									</>
								) : (
									'Create Group'
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
