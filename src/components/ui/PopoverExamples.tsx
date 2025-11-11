'use client'

import {
	User,
	Info,
	MoreHorizontal,
	Heart,
	MessageCircle,
	Bookmark,
} from 'lucide-react'
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

/**
 * Popover Examples Component
 *
 * Demonstrates Popover component with real-world use cases:
 * - User hover cards (profile preview)
 * - Recipe previews (quick look)
 * - Help tooltips (contextual info)
 * - Action menus (more options)
 */

export const PopoverExamples = () => {
	return (
		<div className='container mx-auto max-w-6xl space-y-8 py-12'>
			<div className='space-y-2'>
				<h1 className='text-3xl font-bold'>Popover Component</h1>
				<p className='text-text-secondary'>
					Floating content containers for hover cards, tooltips, and contextual
					menus.
				</p>
			</div>

			{/* User Hover Cards */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>User Hover Cards</h2>
				<p className='text-sm text-text-secondary'>
					Hover over usernames to see profile previews
				</p>
				<div className='flex flex-wrap gap-4'>
					<Popover triggerMode='hover'>
						<PopoverTrigger asChild>
							<button className='flex items-center gap-2 rounded-lg border border-border px-4 py-2 transition-colors hover:border-primary hover:bg-primary/5'>
								<Avatar className='h-8 w-8'>
									<AvatarFallback>CM</AvatarFallback>
								</Avatar>
								<span className='font-semibold'>@chefmaster</span>
							</button>
						</PopoverTrigger>
						<PopoverContent className='w-80'>
							<div className='space-y-3'>
								<div className='flex items-start gap-3'>
									<Avatar className='h-12 w-12'>
										<AvatarFallback>CM</AvatarFallback>
									</Avatar>
									<div className='flex-1'>
										<h3 className='font-semibold'>ChefMaster</h3>
										<p className='text-sm text-text-secondary'>@chefmaster</p>
									</div>
								</div>
								<p className='text-sm text-text-secondary'>
									Passionate home cook sharing delicious recipes. Love
									experimenting with flavors!
								</p>
								<div className='flex gap-4 text-sm'>
									<span>
										<strong>42</strong> recipes
									</span>
									<span>
										<strong>1.2K</strong> followers
									</span>
									<span>
										<strong>156</strong> following
									</span>
								</div>
								<Separator />
								<div className='flex gap-2'>
									<Button size='sm' className='flex-1'>
										Follow
									</Button>
									<Button size='sm' variant='outline'>
										Message
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>

					<Popover triggerMode='hover'>
						<PopoverTrigger asChild>
							<button className='flex items-center gap-2 rounded-lg border border-border px-4 py-2 transition-colors hover:border-primary hover:bg-primary/5'>
								<Avatar className='h-8 w-8'>
									<AvatarFallback>BK</AvatarFallback>
								</Avatar>
								<span className='font-semibold'>@bakingqueen</span>
							</button>
						</PopoverTrigger>
						<PopoverContent className='w-80'>
							<div className='space-y-3'>
								<div className='flex items-start gap-3'>
									<Avatar className='h-12 w-12'>
										<AvatarFallback>BK</AvatarFallback>
									</Avatar>
									<div className='flex-1'>
										<h3 className='font-semibold'>Baking Queen</h3>
										<p className='text-sm text-text-secondary'>@bakingqueen</p>
										<div className='mt-1 flex gap-1'>
											<Badge variant='secondary' className='text-xs'>
												Verified
											</Badge>
											<Badge className='bg-gold/20 text-xs text-gold'>
												Master Baker
											</Badge>
										</div>
									</div>
								</div>
								<p className='text-sm text-text-secondary'>
									Professional pastry chef with 10+ years experience. Teaching
									the art of baking!
								</p>
								<div className='flex gap-4 text-sm'>
									<span>
										<strong>127</strong> recipes
									</span>
									<span>
										<strong>15.3K</strong> followers
									</span>
									<span>
										<strong>89</strong> following
									</span>
								</div>
								<Separator />
								<div className='flex gap-2'>
									<Button size='sm' className='flex-1'>
										Follow
									</Button>
									<Button size='sm' variant='outline'>
										Message
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</Card>

			{/* Recipe Previews */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Recipe Previews</h2>
				<p className='text-sm text-text-secondary'>
					Hover over recipe titles for quick previews
				</p>
				<div className='space-y-3'>
					<Popover triggerMode='hover'>
						<PopoverTrigger asChild>
							<button className='group flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5'>
								<div>
									<h3 className='font-semibold group-hover:text-primary'>
										Chocolate Lava Cake
									</h3>
									<p className='text-sm text-text-secondary'>
										Decadent dessert with molten center
									</p>
								</div>
								<Badge>⭐ 4.8</Badge>
							</button>
						</PopoverTrigger>
						<PopoverContent className='w-96' side='right'>
							<div className='space-y-3'>
								<div>
									<h3 className='font-semibold'>Chocolate Lava Cake</h3>
									<p className='text-sm text-text-secondary'>
										Decadent dessert with molten chocolate center
									</p>
								</div>
								<div className='flex gap-4 text-sm'>
									<span>
										🕐 <strong>25 min</strong>
									</span>
									<span>
										👥 <strong>2 servings</strong>
									</span>
									<span>
										⭐ <strong>4.8/5</strong>
									</span>
								</div>
								<Separator />
								<div>
									<p className='text-xs font-semibold text-text-secondary'>
										KEY INGREDIENTS
									</p>
									<div className='mt-2 flex flex-wrap gap-1'>
										<Badge variant='secondary' className='text-xs'>
											Dark Chocolate
										</Badge>
										<Badge variant='secondary' className='text-xs'>
											Butter
										</Badge>
										<Badge variant='secondary' className='text-xs'>
											Eggs
										</Badge>
										<Badge variant='secondary' className='text-xs'>
											Sugar
										</Badge>
									</div>
								</div>
								<Separator />
								<div className='flex gap-2'>
									<Button size='sm' variant='outline' className='flex-1'>
										<Heart className='mr-1 h-3 w-3' />
										Save
									</Button>
									<Button size='sm' className='flex-1'>
										View Recipe
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>

					<Popover triggerMode='hover'>
						<PopoverTrigger asChild>
							<button className='group flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5'>
								<div>
									<h3 className='font-semibold group-hover:text-primary'>
										Thai Green Curry
									</h3>
									<p className='text-sm text-text-secondary'>
										Authentic spicy coconut curry
									</p>
								</div>
								<Badge>⭐ 4.9</Badge>
							</button>
						</PopoverTrigger>
						<PopoverContent className='w-96' side='right'>
							<div className='space-y-3'>
								<div>
									<h3 className='font-semibold'>Thai Green Curry</h3>
									<p className='text-sm text-text-secondary'>
										Authentic spicy coconut curry with vegetables
									</p>
								</div>
								<div className='flex gap-4 text-sm'>
									<span>
										🕐 <strong>45 min</strong>
									</span>
									<span>
										👥 <strong>4 servings</strong>
									</span>
									<span>
										⭐ <strong>4.9/5</strong>
									</span>
								</div>
								<Separator />
								<div>
									<p className='text-xs font-semibold text-text-secondary'>
										KEY INGREDIENTS
									</p>
									<div className='mt-2 flex flex-wrap gap-1'>
										<Badge variant='secondary' className='text-xs'>
											Green Curry Paste
										</Badge>
										<Badge variant='secondary' className='text-xs'>
											Coconut Milk
										</Badge>
										<Badge variant='secondary' className='text-xs'>
											Chicken
										</Badge>
										<Badge variant='secondary' className='text-xs'>
											Basil
										</Badge>
									</div>
								</div>
								<div>
									<p className='text-xs font-semibold text-text-secondary'>
										DIETARY
									</p>
									<div className='mt-1 flex gap-1'>
										<Badge className='bg-success/20 text-xs text-success'>
											Gluten-Free
										</Badge>
										<Badge className='bg-info/20 text-xs text-info'>
											Spicy
										</Badge>
									</div>
								</div>
								<Separator />
								<div className='flex gap-2'>
									<Button size='sm' variant='outline' className='flex-1'>
										<Heart className='mr-1 h-3 w-3' />
										Save
									</Button>
									<Button size='sm' className='flex-1'>
										View Recipe
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</Card>

			{/* Help Tooltips */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Help Tooltips</h2>
				<p className='text-sm text-text-secondary'>
					Click info icons for contextual help
				</p>
				<div className='space-y-4'>
					<div className='flex items-center gap-2'>
						<span className='text-sm font-semibold'>Difficulty Level</span>
						<Popover>
							<PopoverTrigger asChild>
								<button className='rounded-full text-text-secondary transition-colors hover:text-primary'>
									<Info className='h-4 w-4' />
								</button>
							</PopoverTrigger>
							<PopoverContent className='w-64'>
								<div className='space-y-2'>
									<h4 className='font-semibold'>Difficulty Levels</h4>
									<ul className='space-y-1 text-sm text-text-secondary'>
										<li>
											<strong>Easy:</strong> 30 min or less, basic skills
										</li>
										<li>
											<strong>Medium:</strong> 30-60 min, some technique
											required
										</li>
										<li>
											<strong>Hard:</strong> 60+ min, advanced skills needed
										</li>
									</ul>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<div className='flex items-center gap-2'>
						<span className='text-sm font-semibold'>Cooking Time</span>
						<Popover>
							<PopoverTrigger asChild>
								<button className='rounded-full text-text-secondary transition-colors hover:text-primary'>
									<Info className='h-4 w-4' />
								</button>
							</PopoverTrigger>
							<PopoverContent className='w-64'>
								<div className='space-y-2'>
									<h4 className='font-semibold'>Time Breakdown</h4>
									<p className='text-sm text-text-secondary'>
										Total cooking time includes both prep time (chopping,
										mixing) and active cook time (on stove/in oven).
									</p>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<div className='flex items-center gap-2'>
						<span className='text-sm font-semibold'>Achievement Badges</span>
						<Popover>
							<PopoverTrigger asChild>
								<button className='rounded-full text-text-secondary transition-colors hover:text-primary'>
									<Info className='h-4 w-4' />
								</button>
							</PopoverTrigger>
							<PopoverContent className='w-80'>
								<div className='space-y-2'>
									<h4 className='font-semibold'>How to Earn Badges</h4>
									<ul className='space-y-2 text-sm text-text-secondary'>
										<li>
											🏆 <strong>First Recipe:</strong> Complete your first
											recipe
										</li>
										<li>
											⭐ <strong>Perfect 10:</strong> Cook 10 recipes perfectly
										</li>
										<li>
											🔥 <strong>Hot Streak:</strong> Cook daily for 7 days
										</li>
										<li>
											👨‍🍳 <strong>Master Chef:</strong> Unlock all other badges
										</li>
									</ul>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</Card>

			{/* Action Menus */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Action Menus</h2>
				<p className='text-sm text-text-secondary'>
					Click more options for contextual actions
				</p>
				<div className='flex gap-4'>
					<Card className='w-64 p-4'>
						<div className='flex items-start justify-between'>
							<div>
								<h3 className='font-semibold'>Pasta Carbonara</h3>
								<p className='text-sm text-text-secondary'>@chefmaster</p>
							</div>
							<Popover>
								<PopoverTrigger asChild>
									<button className='rounded-full p-1 transition-colors hover:bg-muted'>
										<MoreHorizontal className='h-5 w-5' />
									</button>
								</PopoverTrigger>
								<PopoverContent className='w-48 p-2' align='end'>
									<div className='space-y-1'>
										<button className='flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted'>
											<Heart className='h-4 w-4' />
											Save to Collection
										</button>
										<button className='flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted'>
											<MessageCircle className='h-4 w-4' />
											Comment
										</button>
										<button className='flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted'>
											<Bookmark className='h-4 w-4' />
											Add to Meal Plan
										</button>
										<Separator />
										<button className='flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-error transition-colors hover:bg-error/10'>
											Report
										</button>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					</Card>
				</div>
			</Card>

			{/* Positioning Demo */}
			<Card className='space-y-4 p-6'>
				<h2 className='text-xl font-semibold'>Positioning Options</h2>
				<p className='text-sm text-text-secondary'>
					Popovers can appear on any side
				</p>
				<div className='flex items-center justify-center gap-8 py-8'>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant='outline'>Left</Button>
						</PopoverTrigger>
						<PopoverContent side='left'>
							<p className='text-sm'>Appears on the left</p>
						</PopoverContent>
					</Popover>

					<div className='flex flex-col gap-8'>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant='outline'>Top</Button>
							</PopoverTrigger>
							<PopoverContent side='top'>
								<p className='text-sm'>Appears on top</p>
							</PopoverContent>
						</Popover>

						<Popover>
							<PopoverTrigger asChild>
								<Button variant='outline'>Bottom</Button>
							</PopoverTrigger>
							<PopoverContent side='bottom'>
								<p className='text-sm'>Appears on bottom</p>
							</PopoverContent>
						</Popover>
					</div>

					<Popover>
						<PopoverTrigger asChild>
							<Button variant='outline'>Right</Button>
						</PopoverTrigger>
						<PopoverContent side='right'>
							<p className='text-sm'>Appears on the right</p>
						</PopoverContent>
					</Popover>
				</div>
			</Card>
		</div>
	)
}
