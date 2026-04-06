'use client'

import { useTranslations } from 'next-intl'

import { useEffect, useState } from 'react'
import { getMyGroups } from '@/services/group'
import { Group } from '@/lib/types/group'
import { GroupCard } from './GroupCard'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { PATHS } from '@/constants/paths'
import { motion } from 'framer-motion'
import { DURATION_S } from '@/lib/motion'

interface MyGroupsSidebarProps {
	currentUserId?: string
	maxGroups?: number
}

/**
 * Compact sidebar widget showing user's 5 most recent groups
 * Used in main layout sidebars for quick access
 */
export const MyGroupsSidebar = ({
	currentUserId,
	maxGroups = 5,
}: MyGroupsSidebarProps) => {
	const t = useTranslations('groups')
	const [groups, setGroups] = useState<Group[]>([])
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if (!currentUserId) return

		const loadGroups = async () => {
			setIsLoading(true)
			try {
				const response = await getMyGroups(undefined, 0, maxGroups)
				setGroups(response.content)
			} catch (error) {
				// Silently fail for sidebar
			} finally {
				setIsLoading(false)
			}
		}

		loadGroups()
	}, [currentUserId, maxGroups])

	if (!currentUserId) {
		return null
	}

	return (
		<motion.div
			className='bg-bg-card rounded-lg border border-border p-4 space-y-4'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: DURATION_S.smooth }}
		>
			<div className='flex items-center justify-between'>
				<h3 className='font-bold text-text flex items-center gap-2'>
					<Users className='size-4 text-brand' />
					{t('msMyGroups')}
				</h3>
				<Link href={PATHS.GROUPS.EXPLORE}>
					<Button
						size='sm'
						variant='outline'
						className='h-7 text-xs'
					>
						<Plus className='size-3' />
					</Button>
				</Link>
			</div>

			{isLoading ? (
				<div className='flex justify-center py-4'>
					<Loader2 className='size-4 animate-spin text-brand' />
				</div>
			) : groups.length === 0 ? (
				<div className='text-center py-4'>
					<p className='text-xs text-text-secondary mb-3'>
						{t('msNoGroups')}
					</p>
					<Link href={PATHS.GROUPS.EXPLORE} className='block'>
						<Button
							size='sm'
							className='w-full bg-brand hover:bg-brand/90 text-white text-xs h-7'
						>
							{t('msExploreGroups')}
						</Button>
					</Link>
				</div>
			) : (
				<div className='space-y-2'>
					{groups.map((group) => (
						<GroupCard
							key={group.id}
							group={group}
							variant='compact'
							currentUserId={currentUserId}
							isJoinable={false}  // Already member in "My Groups"
						/>
					))}

					{groups.length > 0 && (
						<Link
							href={PATHS.GROUPS.MY_GROUPS}
							className='block'
						>
							<Button
								variant='ghost'
								className='w-full text-xs text-brand hover:bg-brand/5'
							>
								{t('msViewAll')}
							</Button>
						</Link>
					)}
				</div>
			)}
		</motion.div>
	)
}
