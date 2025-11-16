'use client'

import { User, Shield, Bell, Eye, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'

export default function SettingsPage() {
	return (
		<PageTransition>
			<PageContainer maxWidth='md'>
				<h1 className='mb-6 text-3xl font-bold'>Settings</h1>
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]'>
					{/* Settings Navigation */}
					<nav className='flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm'>
						<a
							href='#'
							className='flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-primary transition-colors hover:text-primary'
						>
							<User className='h-4 w-4' /> Account
						</a>
						<a
							href='#'
							className='flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-primary'
						>
							<Shield className='h-4 w-4' /> Security
						</a>
						<a
							href='#'
							className='flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-primary'
						>
							<Bell className='h-4 w-4' /> Notifications
						</a>
						<a
							href='#'
							className='flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-primary'
						>
							<Eye className='h-4 w-4' /> Appearance
						</a>
					</nav>

					{/* Settings Content */}
					<div className='rounded-lg border bg-card p-6 shadow-sm'>
						<h2 className='mb-4 text-2xl font-bold'>Account Information</h2>
						<div className='space-y-4'>
							<div className='grid gap-2'>
								<Label htmlFor='name'>Full Name</Label>
								<Input id='name' type='text' defaultValue='Your Name Here' />
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='email'>Email</Label>
								<Input
									id='email'
									type='email'
									defaultValue='yourname@example.com'
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='bio'>Bio</Label>
								<Textarea
									id='bio'
									defaultValue="Passionate home cook exploring global cuisines. Co-founder of the 'Spicy Club'. 🌶️🌮🍣"
								/>
							</div>
							<Button className='mt-4'>
								<Save className='mr-2 h-4 w-4' /> Save Changes
							</Button>
						</div>
					</div>
				</div>
			</PageContainer>
		</PageTransition>
	)
}
