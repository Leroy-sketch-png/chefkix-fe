'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function CreateRecipePage() {
	return (
		<div className='mx-auto max-w-6xl p-4'>
			<h1 className='mb-6 text-3xl font-bold'>Create New Recipe</h1>
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				{/* Left Column: Form */}
				<div className='flex flex-col gap-6'>
					<div className='rounded-lg border bg-card p-6 shadow-sm'>
						<h2 className='mb-4 text-2xl font-bold'>Recipe Details</h2>
						<div className='grid gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor='recipe-title'>Recipe Title</Label>
								<Input
									id='recipe-title'
									placeholder='e.g., Spicy Tomato Ramen'
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='recipe-desc'>Description</Label>
								<Textarea
									id='recipe-desc'
									placeholder='A short summary of your dish...'
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='recipe-image'>Upload Media</Label>
								<Input id='recipe-image' type='file' />
							</div>
						</div>
					</div>

					<div className='rounded-lg border bg-card p-6 shadow-sm'>
						<h2 className='mb-4 text-2xl font-bold'>Steps</h2>
						{/* Template: Step Item */}
						<div className='mb-6 rounded-md border bg-muted/40 p-4'>
							<div className='mb-3 flex items-center justify-between'>
								<span className='text-lg font-semibold'>Step 1</span>
								<Button variant='ghost' size='icon'>
									<Trash2 className='h-4 w-4 text-muted-foreground' />
								</Button>
							</div>
							<div className='grid gap-4'>
								<div className='grid gap-2'>
									<Label>Step Title</Label>
									<Input placeholder='e.g., Prepare the broth' />
								</div>
								<div className='grid gap-2'>
									<Label>Step Instructions</Label>
									<Textarea placeholder='Sauté garlic and ginger...' />
								</div>
							</div>
						</div>
						<Button variant='outline' className='w-full'>
							<Plus className='mr-2 h-4 w-4' /> Add Step
						</Button>
					</div>
				</div>

				{/* Right Column: Preview */}
				<div className='flex flex-col gap-6'>
					<div className='rounded-lg border bg-card p-6 shadow-sm'>
						<h2 className='mb-4 text-2xl font-bold'>Live Preview</h2>
						<div className='text-muted-foreground'>
							<p>Your recipe card will update here as you type.</p>
						</div>
						<Button className='mt-6 w-full'>Publish Recipe</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
