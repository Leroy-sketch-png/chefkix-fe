'use client'

import { useState, useEffect, useCallback } from 'react'
import { exploreGroups } from '@/services/group'
import { Group, GroupExploreQuery, PrivacyType } from '@/lib/types/group'
import { GroupCard } from './GroupCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Search, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { CreateGroupModal } from './CreateGroupModal'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface GroupsExploreGridProps {
	currentUserId?: string
}

/**
 * Main explore groups page/section
 * Displays groups in a grid with filters for search, privacy, and sorting
 */
export const GroupsExploreGrid = ({
	currentUserId,
}: GroupsExploreGridProps) => {
	const [groups, setGroups] = useState<Group[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [hasMore, setHasMore] = useState(true)
	const [page, setPage] = useState(0)

	// Filters
	const [searchTerm, setSearchTerm] = useState('')
	const [privacyFilter, setPrivacyFilter] = useState<PrivacyType | 'ALL'>(
		'ALL'
	)
	const [sortBy, setSortBy] = useState<'LATEST' | 'MEMBERS' | 'TRENDING'>(
		'LATEST'
	)

	// Modal state
	const [showCreateModal, setShowCreateModal] = useState(false)
	const user = useAuthStore((state) => state.user)

	// Load groups
	const loadGroups = useCallback(
		async (pageNum: number = 0, append: boolean = false) => {
			setIsLoading(true)
			try {
				const query: Partial<GroupExploreQuery> = {
					searchTerm: searchTerm || undefined,
					privacyType:
						privacyFilter === 'ALL' ? undefined : privacyFilter,
					sortBy,
				}

				const response = await exploreGroups(query, pageNum, 12)

				setGroups((prev) =>
					append ? [...prev, ...response.content] : response.content
				)
				setPage(pageNum)
				setHasMore(pageNum < response.totalPages - 1)
			} catch (error) {
				toast.error('Failed to load groups')
			} finally {
				setIsLoading(false)
			}
		},
		[searchTerm, privacyFilter, sortBy]
	)

	// Initial load and filter changes
	useEffect(() => {
		loadGroups(0, false)
	}, [searchTerm, privacyFilter, sortBy, loadGroups])

	const handleLoadMore = () => {
		loadGroups(page + 1, true)
	}

	const handleGroupCreated = (newGroup: Group) => {
		setGroups((prev) => [newGroup, ...prev])
		// Optionally scroll to top
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	return (
		<div className='space-y-6'>
			{/* Facebook-style Header */}
			<div className='bg-gradient-to-r from-brand/10 to-brand/5 rounded-xl border border-brand/20 p-6'>
				<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
					<div>
						<h1 className='text-4xl font-bold text-text'>Groups</h1>
						<p className='text-text-secondary mt-2 text-lg'>
							Connect, explore, and join communities around your cooking interests
						</p>
					</div>

					{currentUserId && (
						<motion.button
							onClick={() => setShowCreateModal(true)}
							className='flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-brand to-brand/80 hover:from-brand/90 hover:to-brand/70 text-white font-semibold shadow-lg shadow-brand/30 transition-all duration-300 whitespace-nowrap'
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.98 }}
						>
							<Plus className='w-5 h-5' />
							Create Group
						</motion.button>
					)}
				</div>
			</div>

			{/* Search and Filters */}
			<div className='flex flex-col gap-4'>
				{/* Search Bar - Facebook Style */}
				<div className='relative'>
					<Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary' />
					<Input
						placeholder='Search for groups by name, interests, or topics...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className='pl-12 py-3 text-base rounded-full bg-bg-elevated border-2 border-border hover:border-brand/40 focus:border-brand transition-colors'
						disabled={isLoading}
					/>
				</div>

				{/* Filters Row */}
				<div className='flex flex-col sm:flex-row gap-3'>
					{/* Privacy Filter */}
					<Select
						value={privacyFilter}
						onValueChange={(val) =>
							setPrivacyFilter(val as PrivacyType | 'ALL')
						}
						disabled={isLoading}
					>
						<SelectTrigger className='w-full sm:w-48 rounded-full bg-bg-elevated border-2 border-border hover:border-brand/40 focus:border-brand'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='ALL'>All Groups</SelectItem>
							<SelectItem value='PUBLIC'>Public Only</SelectItem>
							<SelectItem value='PRIVATE'>Private Only</SelectItem>
						</SelectContent>
					</Select>

					{/* Sort */}
					<Select
						value={sortBy}
						onValueChange={(val) =>
							setSortBy(val as 'LATEST' | 'MEMBERS' | 'TRENDING')
						}
						disabled={isLoading}
					>
						<SelectTrigger className='w-full sm:w-48 rounded-full bg-bg-elevated border-2 border-border hover:border-brand/40 focus:border-brand'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='LATEST'>Latest Groups</SelectItem>
							<SelectItem value='MEMBERS'>Most Members</SelectItem>
							<SelectItem value='TRENDING'>Trending</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Groups Grid */}
			{isLoading && groups.length === 0 ? (
				<div className='flex justify-center py-20'>
					<div className='text-center'>
						<Loader2 className='w-10 h-10 animate-spin text-brand mx-auto mb-4' />
						<p className='text-text-secondary'>Loading groups...</p>
					</div>
				</div>
			) : groups.length === 0 ? (
				<motion.div
					className='text-center py-20 bg-bg-card rounded-xl border-2 border-dashed border-border-subtle'
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<Users className='w-16 h-16 text-text-muted mx-auto mb-4 opacity-50' />
					<p className='text-lg font-semibold text-text mb-2'>
						No groups found
					</p>
					<p className='text-text-secondary mb-6'>
						{searchTerm
							? 'Try adjusting your search or filters'
							: 'Start by creating your first group or exploring existing ones'}
					</p>
					{currentUserId && (
						<Button
							onClick={() => setShowCreateModal(true)}
							className='bg-brand hover:bg-brand/90 text-white'
						>
							<Plus className='w-4 h-4 mr-2' />
							Create First Group
						</Button>
					)}
				</motion.div>
			) : (
				<>
					{/* Results Count */}
					<div className='text-text-secondary text-sm'>
						Showing {groups.length} group{groups.length !== 1 ? 's' : ''}
					</div>

					{/* Groups Grid */}
					<motion.div
						className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						{groups.map((group, idx) => (
							<motion.div
								key={group.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.3,
									delay: idx * 0.05,
								}}
							>
								<GroupCard
									group={group}
									variant='default'
									currentUserId={currentUserId}
									isJoinable={!group.isJoined}
									onJoinSuccess={(updatedGroup) => {
										setGroups((prev) =>
											prev.map((g) =>
												g.id === updatedGroup.id
													? { ...g, isJoined: true }
													: g
											)
										)
									}}
								/>
							</motion.div>
						))}
					</motion.div>
				</>
			)}

			{/* Load More Button */}
			{hasMore && groups.length > 0 && (
				<div className='flex justify-center pt-6'>
					<Button
						variant='outline'
						onClick={handleLoadMore}
						disabled={isLoading}
						className='w-full sm:w-auto'
					>
						{isLoading ? (
							<>
								<Loader2 className='w-4 h-4 mr-2 animate-spin' />
								Loading...
							</>
						) : (
							'Load More Groups'
						)}
					</Button>
				</div>
			)}

			{/* Create Group Modal */}
			<CreateGroupModal
				open={showCreateModal}
				onOpenChange={setShowCreateModal}
				onSuccess={handleGroupCreated}
			/>
		</div>
	)
}
