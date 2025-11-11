'use client'

import { useState } from 'react'
import { Settings, Filter, User, Menu, Bell, MessageSquare } from 'lucide-react'
import {
	Sheet,
	SheetTrigger,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetBody,
	SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { CheckboxFilter, RadioFilter } from '@/components/shared/FilterSort'
import { RangeSlider } from '@/components/ui/range-slider'

/**
 * Sheet Examples Component
 *
 * Demonstrates Sheet component variants and real-world use cases:
 * - Right side: Settings, filters, user profile
 * - Left side: Navigation, menu
 * - Bottom: Mobile filters, details drawer
 */

export const SheetExamples = () => {
	// Settings sheet state
	const [notifications, setNotifications] = useState(true)
	const [emailUpdates, setEmailUpdates] = useState(false)
	const [darkMode, setDarkMode] = useState(false)

	// Filter sheet state
	const [selectedDietary, setSelectedDietary] = useState<string[]>([])
	const [difficulty, setDifficulty] = useState('all')
	const [cookingTime, setCookingTime] = useState(30)

	return (
		<div className='container mx-auto max-w-6xl space-y-8 py-12'>
			<div className='space-y-2'>
				<h1 className='text-3xl font-bold'>Sheet Component</h1>
				<p className='text-text-secondary'>
					Mobile-first slide-out panels with smooth animations. Perfect for
					filters, settings, and navigation.
				</p>
			</div>

			{/* Right Side Sheets */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Right Side Sheets</h2>
				<p className='text-sm text-text-secondary'>
					Slides from right - ideal for settings, filters, and details
				</p>
				<div className='flex flex-wrap gap-3'>
					{/* Settings Sheet */}
					<Sheet side='right'>
						<SheetTrigger asChild>
							<Button variant='outline'>
								<Settings className='mr-2 h-4 w-4' />
								Settings
							</Button>
						</SheetTrigger>
						<SheetContent>
							<SheetHeader>
								<SheetTitle>Settings</SheetTitle>
								<SheetDescription>
									Manage your account preferences
								</SheetDescription>
							</SheetHeader>
							<SheetBody>
								<div className='space-y-6'>
									{/* Notifications */}
									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label>Push Notifications</Label>
											<p className='text-sm text-text-secondary'>
												Receive notifications about your activity
											</p>
										</div>
										<Switch
											checked={notifications}
											onCheckedChange={setNotifications}
										/>
									</div>

									<Separator />

									{/* Email Updates */}
									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label>Email Updates</Label>
											<p className='text-sm text-text-secondary'>
												Get weekly recipe roundups
											</p>
										</div>
										<Switch
											checked={emailUpdates}
											onCheckedChange={setEmailUpdates}
										/>
									</div>

									<Separator />

									{/* Dark Mode */}
									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label>Dark Mode</Label>
											<p className='text-sm text-text-secondary'>
												Toggle dark theme
											</p>
										</div>
										<Switch checked={darkMode} onCheckedChange={setDarkMode} />
									</div>

									<Separator />

									{/* Profile Info */}
									<div className='space-y-4'>
										<Label>Profile Information</Label>
										<div className='space-y-2'>
											<Input
												placeholder='Display name'
												defaultValue='ChefMaster'
											/>
											<Input
												placeholder='Email'
												defaultValue='[email protected]'
											/>
											<Input
												placeholder='Bio'
												defaultValue='Passionate home cook'
											/>
										</div>
									</div>
								</div>
							</SheetBody>
							<SheetFooter>
								<Button variant='outline'>Cancel</Button>
								<Button>Save Changes</Button>
							</SheetFooter>
						</SheetContent>
					</Sheet>

					{/* Filter Sheet */}
					<Sheet side='right'>
						<SheetTrigger asChild>
							<Button variant='outline'>
								<Filter className='mr-2 h-4 w-4' />
								Filters
							</Button>
						</SheetTrigger>
						<SheetContent>
							<SheetHeader>
								<SheetTitle>Filter Recipes</SheetTitle>
								<SheetDescription>Refine your recipe search</SheetDescription>
							</SheetHeader>
							<SheetBody>
								<div className='space-y-6'>
									{/* Dietary Restrictions */}
									<div className='space-y-3'>
										<Label>Dietary Restrictions</Label>
										<CheckboxFilter
											label='Vegetarian'
											checked={selectedDietary.includes('veg')}
											onChange={() => {}}
										/>
										<CheckboxFilter
											label='Vegan'
											checked={selectedDietary.includes('vegan')}
											onChange={() => {}}
										/>
										<CheckboxFilter
											label='Gluten-Free'
											checked={selectedDietary.includes('gluten-free')}
											onChange={() => {}}
										/>
									</div>

									<Separator />

									{/* Difficulty */}
									<div className='space-y-3'>
										<Label>Difficulty Level</Label>
										<RadioFilter
											name='difficulty'
											label='All Levels'
											checked={difficulty === 'all'}
											onChange={() => setDifficulty('all')}
										/>
										<RadioFilter
											name='difficulty'
											label='Easy'
											checked={difficulty === 'easy'}
											onChange={() => setDifficulty('easy')}
										/>
										<RadioFilter
											name='difficulty'
											label='Medium'
											checked={difficulty === 'medium'}
											onChange={() => setDifficulty('medium')}
										/>
										<RadioFilter
											name='difficulty'
											label='Hard'
											checked={difficulty === 'hard'}
											onChange={() => setDifficulty('hard')}
										/>
									</div>

									<Separator />

									{/* Cooking Time */}
									<div className='space-y-3'>
										<Label>Maximum Cooking Time</Label>
										<RangeSlider
											min={15}
											max={120}
											step={5}
											value={cookingTime}
											onChange={setCookingTime}
											formatLabel={val => `${val} min`}
										/>
									</div>
								</div>
							</SheetBody>
							<SheetFooter>
								<Button variant='outline'>Reset</Button>
								<Button>Apply Filters</Button>
							</SheetFooter>
						</SheetContent>
					</Sheet>

					{/* User Profile Sheet */}
					<Sheet side='right'>
						<SheetTrigger asChild>
							<Button variant='outline'>
								<User className='mr-2 h-4 w-4' />
								Profile
							</Button>
						</SheetTrigger>
						<SheetContent>
							<SheetHeader>
								<SheetTitle>User Profile</SheetTitle>
								<SheetDescription>View profile details</SheetDescription>
							</SheetHeader>
							<SheetBody>
								<div className='space-y-6'>
									{/* Avatar */}
									<div className='flex items-center gap-4'>
										<div className='h-20 w-20 rounded-full bg-primary/20' />
										<div>
											<h3 className='font-semibold'>ChefMaster</h3>
											<p className='text-sm text-text-secondary'>@chefmaster</p>
										</div>
									</div>

									<Separator />

									{/* Stats */}
									<div className='grid grid-cols-3 gap-4'>
										<div className='text-center'>
											<p className='text-2xl font-bold'>42</p>
											<p className='text-sm text-text-secondary'>Recipes</p>
										</div>
										<div className='text-center'>
											<p className='text-2xl font-bold'>1.2K</p>
											<p className='text-sm text-text-secondary'>Followers</p>
										</div>
										<div className='text-center'>
											<p className='text-2xl font-bold'>156</p>
											<p className='text-sm text-text-secondary'>Following</p>
										</div>
									</div>

									<Separator />

									{/* Bio */}
									<div className='space-y-2'>
										<Label>About</Label>
										<p className='text-sm text-text-secondary'>
											Passionate home cook sharing delicious recipes. Love
											experimenting with flavors!
										</p>
									</div>

									{/* Badges */}
									<div className='space-y-2'>
										<Label>Achievements</Label>
										<div className='flex flex-wrap gap-2'>
											<span className='rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold'>
												🏆 Master Chef
											</span>
											<span className='rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary'>
												⭐ 100 Recipes
											</span>
										</div>
									</div>
								</div>
							</SheetBody>
							<SheetFooter>
								<Button variant='outline'>Message</Button>
								<Button>Follow</Button>
							</SheetFooter>
						</SheetContent>
					</Sheet>
				</div>
			</Card>

			{/* Left Side Sheets */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Left Side Sheets</h2>
				<p className='text-sm text-text-secondary'>
					Slides from left - perfect for navigation and menus
				</p>
				<div className='flex flex-wrap gap-3'>
					<Sheet side='left'>
						<SheetTrigger asChild>
							<Button variant='outline'>
								<Menu className='mr-2 h-4 w-4' />
								Navigation
							</Button>
						</SheetTrigger>
						<SheetContent>
							<SheetHeader>
								<SheetTitle>Navigation</SheetTitle>
								<SheetDescription>Browse the app</SheetDescription>
							</SheetHeader>
							<SheetBody>
								<nav className='space-y-2'>
									<Button variant='ghost' className='w-full justify-start'>
										Dashboard
									</Button>
									<Button variant='ghost' className='w-full justify-start'>
										Discover Recipes
									</Button>
									<Button variant='ghost' className='w-full justify-start'>
										My Cookbook
									</Button>
									<Button variant='ghost' className='w-full justify-start'>
										Challenges
									</Button>
									<Button variant='ghost' className='w-full justify-start'>
										Community
									</Button>
									<Separator />
									<Button variant='ghost' className='w-full justify-start'>
										Settings
									</Button>
									<Button variant='ghost' className='w-full justify-start'>
										Help & Support
									</Button>
								</nav>
							</SheetBody>
						</SheetContent>
					</Sheet>
				</div>
			</Card>

			{/* Bottom Sheets */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Bottom Sheets</h2>
				<p className='text-sm text-text-secondary'>
					Slides from bottom - best for mobile, feels native
				</p>
				<div className='flex flex-wrap gap-3'>
					{/* Mobile Filters */}
					<Sheet side='bottom'>
						<SheetTrigger asChild>
							<Button variant='outline'>
								<Filter className='mr-2 h-4 w-4' />
								Mobile Filters
							</Button>
						</SheetTrigger>
						<SheetContent>
							<SheetHeader>
								<SheetTitle>Filter Recipes</SheetTitle>
								<SheetDescription>Quick filter options</SheetDescription>
							</SheetHeader>
							<SheetBody>
								<div className='space-y-4'>
									<div className='grid grid-cols-2 gap-2'>
										<Button variant='outline' size='sm'>
											Vegetarian
										</Button>
										<Button variant='outline' size='sm'>
											Vegan
										</Button>
										<Button variant='outline' size='sm'>
											Quick ({'<'}30min)
										</Button>
										<Button variant='outline' size='sm'>
											Easy
										</Button>
									</div>
								</div>
							</SheetBody>
							<SheetFooter>
								<Button variant='outline'>Clear</Button>
								<Button>Apply</Button>
							</SheetFooter>
						</SheetContent>
					</Sheet>

					{/* Recipe Quick View */}
					<Sheet side='bottom'>
						<SheetTrigger asChild>
							<Button variant='outline'>Recipe Details</Button>
						</SheetTrigger>
						<SheetContent>
							<SheetHeader>
								<SheetTitle>Chocolate Cake</SheetTitle>
								<SheetDescription>
									Rich and moist chocolate cake
								</SheetDescription>
							</SheetHeader>
							<SheetBody>
								<div className='space-y-4'>
									<div className='flex gap-4'>
										<div className='text-center'>
											<p className='font-semibold'>30 min</p>
											<p className='text-xs text-text-secondary'>Prep</p>
										</div>
										<div className='text-center'>
											<p className='font-semibold'>45 min</p>
											<p className='text-xs text-text-secondary'>Cook</p>
										</div>
										<div className='text-center'>
											<p className='font-semibold'>8</p>
											<p className='text-xs text-text-secondary'>Servings</p>
										</div>
									</div>
									<Separator />
									<p className='text-sm text-text-secondary'>
										A decadent chocolate cake that&apos;s perfect for any
										celebration. Moist, fluffy, and incredibly chocolatey!
									</p>
								</div>
							</SheetBody>
							<SheetFooter>
								<Button variant='outline'>Save</Button>
								<Button>View Full Recipe</Button>
							</SheetFooter>
						</SheetContent>
					</Sheet>
				</div>
			</Card>

			{/* Controlled Sheet Example */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Controlled Sheet</h2>
				<p className='text-sm text-text-secondary'>
					Programmatically control sheet state
				</p>
				<ControlledSheetExample />
			</Card>
		</div>
	)
}

// Controlled Sheet Example
const ControlledSheetExample = () => {
	const [open, setOpen] = useState(false)

	return (
		<div className='space-y-4'>
			<div className='flex gap-2'>
				<Button onClick={() => setOpen(true)}>Open Sheet</Button>
				<Button variant='outline' onClick={() => setOpen(false)}>
					Close Sheet
				</Button>
			</div>

			<Sheet open={open} onOpenChange={setOpen} side='right'>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>Controlled Sheet</SheetTitle>
						<SheetDescription>
							This sheet is controlled externally
						</SheetDescription>
					</SheetHeader>
					<SheetBody>
						<p className='text-sm text-text-secondary'>
							You can control this sheet using the buttons above, or close it
							with the X button or Escape key.
						</p>
					</SheetBody>
					<SheetFooter>
						<Button onClick={() => setOpen(false)}>Done</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	)
}
