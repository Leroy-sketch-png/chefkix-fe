'use client'

import { useTranslations } from 'next-intl'

import { Group } from '@/lib/types/group'
import { Users, Clock, Globe, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { LIST_ITEM_HOVER, LIST_ITEM_TAP } from '@/lib/motion'
import { Button } from '@/components/ui/button'

interface GroupAboutSectionProps {
	group: Group
	onViewMembers?: () => void
}

/**
 * Rich About section for group detail page
 * Shows description, privacy, member count, creation date, tags
 * Similar to Facebook group About tab
 */
export function GroupAboutSection({ group, onViewMembers }: GroupAboutSectionProps) {
	const t = useTranslations('groups')
	const createdDate = new Date(group.createdAt)
	const formattedDate = createdDate.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: 0.1 }}
			className='space-y-6'
		>
			{/* Description */}
			{group.description && (
				<div className='bg-bg-card rounded-lg p-6 border border-border'>
					<h3 className='font-bold text-lg text-text mb-3'>{t('gaDescription')}</h3>
					<p className='text-text-secondary leading-relaxed'>
						{group.description}
					</p>
				</div>
			)}

			{/* Stats Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				{/* Members Card - Clickable */}
				<motion.button
					type='button'
					onClick={onViewMembers}
				whileHover={LIST_ITEM_HOVER}
				whileTap={LIST_ITEM_TAP}
					className='bg-bg-card rounded-lg p-6 border border-border hover:border-brand/50 transition-all text-left focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					<div className='flex items-start gap-4'>
						<div className='p-3 bg-brand/10 rounded-lg'>
							<Users className='size-6 text-brand' />
						</div>
						<div>
							<p className='text-sm text-text-secondary mb-1'>{t('gaMembers')}</p>
							<p className='text-2xl font-bold tabular-nums text-text'>
								{group.memberCount.toLocaleString()}
							</p>
							<p className='text-xs text-brand mt-2'>{t('gaViewMembers')}</p>
						</div>
					</div>
				</motion.button>

				{/* Creation Date Card */}
				<div className='bg-bg-card rounded-lg p-6 border border-border'>
					<div className='flex items-start gap-4'>
						<div className='p-3 bg-brand/10 rounded-lg'>
							<Clock className='size-6 text-brand' />
						</div>
						<div>
							<p className='text-sm text-text-secondary mb-1'>{t('gaCreated')}</p>
							<p className='font-semibold text-text'>{formattedDate}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Privacy */}
			<div className='bg-bg-card rounded-lg p-6 border border-border'>
				<div className='flex items-start gap-4'>
					<div className='p-3 bg-brand/10 rounded-lg'>
						{group.privacyType === 'PRIVATE' ? (
							<Lock className='size-6 text-brand' />
						) : (
							<Globe className='size-6 text-brand' />
						)}
					</div>
					<div>
						<p className='text-sm text-text-secondary mb-1'>{t('privacyLabel')}</p>
						<p className='font-semibold text-text'>
							{group.privacyType === 'PRIVATE'
								? t('gaPrivateGroup')
								: t('gaPublicGroup')}
						</p>
						<p className='text-xs text-text-secondary mt-2'>
							{group.privacyType === 'PRIVATE'
								? t('gaPrivateDesc')
								: t('gaPublicDesc')}
						</p>
					</div>
				</div>
			</div>

			{/* Tags */}
			{group.tags && group.tags.length > 0 && (
				<div className='bg-bg-card rounded-lg p-6 border border-border'>
					<h3 className='font-bold text-text mb-4'>{t('gaTags')}</h3>
					<div className='flex flex-wrap gap-2'>
						{group.tags.map((tag) => (
							<span
								key={tag}
								className='px-4 py-2 bg-brand/10 text-brand text-sm font-medium rounded-full hover:bg-brand/20 transition-colors'
							>
								#{tag}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Rules Section - Will be populated from backend later */}
			{group.rules && group.rules.length > 0 && (
				<div className='bg-bg-card rounded-lg p-6 border border-border'>
					<h3 className='font-bold text-lg text-text mb-4'>{t('gaGroupRules')}</h3>
					<div className='space-y-3'>
						{group.rules.map((rule, index) => (
							<div key={index} className='flex gap-3'>
								<span className='flex items-center justify-center size-6 rounded-full bg-brand/10 text-brand text-sm font-bold flex-shrink-0'>
									{index + 1}
								</span>
								<p className='text-text-secondary leading-relaxed pt-0.5'>
									{rule}
								</p>
							</div>
						))}
					</div>
				</div>
			)}
		</motion.div>
	)
}
