'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BorderBeam } from '@/components/ui/border-beam'
import { startTrial } from '@/services/subscription'
import { logDevError } from '@/lib/dev-log'

interface PremiumUpgradeModalProps {
	isOpen: boolean
	onClose: () => void
	featureName?: string | null
}

const PREMIUM_PERKS = [
	{
		title: 'Custom Profile Themes',
		desc: 'Unlock Gradient Sunset, Midnight Gold, Cyber, & Emerald themes',
	},
	{
		title: 'Advanced Creator Analytics',
		desc: 'Detailed per-recipe performance, cook retention, & audience insights',
	},
	{
		title: 'Custom Kitchen Timer Sounds',
		desc: 'Chef voice cues and exclusive audio notification sounds',
	},
	{
		title: 'Ad-Free Experience & Unlimited Saves',
		desc: 'Clean distraction-free feeds and unlimited collection bookmarks',
	},
]

export function PremiumUpgradeModal({
	isOpen,
	onClose,
	featureName,
}: PremiumUpgradeModalProps) {
	const router = useRouter()
	const t = useTranslations('premium')
	const [isStartingTrial, setIsStartingTrial] = useState(false)

	const handleStartTrial = async () => {
		setIsStartingTrial(true)
		try {
			const res = await startTrial()
			if (res.success) {
				toast.success(t('toastTrialStarted'))
				onClose()
			} else {
				toast.error(res.message || t('toastTrialFailed'))
			}
		} catch (err) {
			logDevError('Start trial error:', err)
			toast.error(t('toastTrialFailed'))
		} finally {
			setIsStartingTrial(false)
		}
	}

	const handleGoToSettings = () => {
		onClose()
		router.push('/settings?tab=premium')
	}

	return (
		<Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
			<DialogContent
				className='relative max-w-md overflow-hidden rounded-2xl border-border bg-bg-card p-0 shadow-2xl sm:max-w-lg'
			>
				<BorderBeam
					color='#f59e0b'
					colorTo='#eab308'
					duration={8}
					beamSize={150}
					className='p-6 w-full'
				>
					<DialogHeader className='text-center sm:text-center'>
						<div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner'>
							<Crown className='h-8 w-8 text-amber-500 animate-pulse' />
						</div>
						<DialogTitle className='text-2xl font-bold tracking-tight text-text-primary'>
							{featureName ? `Unlock ${featureName}` : t('title')}
						</DialogTitle>
						<DialogDescription className='text-sm text-text-muted mt-1'>
							Elevate your culinary journey with creator studio tools, custom themes, and ad-free browsing.
						</DialogDescription>
					</DialogHeader>

					{/* Perks list */}
					<div className='my-5 space-y-3 rounded-xl bg-bg-elevated/60 p-4 border border-border-subtle'>
						{PREMIUM_PERKS.map((perk, index) => (
							<div key={index} className='flex items-start gap-3'>
								<div className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500'>
									<Check className='h-3.5 w-3.5 stroke-[2.5]' />
								</div>
								<div className='text-left'>
									<p className='text-sm font-semibold text-text-primary leading-tight'>
										{perk.title}
									</p>
									<p className='text-xs text-text-muted leading-relaxed'>
										{perk.desc}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Actions */}
					<div className='space-y-2.5 pt-1'>
						<Button
							type='button'
							onClick={handleStartTrial}
							disabled={isStartingTrial}
							className='w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-2.5 shadow-md flex items-center justify-center gap-2'
						>
							{isStartingTrial ? (
								<>
									<Loader2 className='h-4 w-4 animate-spin' />
									<span>Starting Trial...</span>
								</>
							) : (
								<>
									<Sparkles className='h-4 w-4 text-amber-200' />
									<span>{t('startTrial')}</span>
								</>
							)}
						</Button>

						<Button
							type='button'
							variant='outline'
							onClick={handleGoToSettings}
							className='w-full rounded-xl border-border hover:bg-bg-hover text-text-secondary font-medium py-2 flex items-center justify-center gap-1.5'
						>
							<span>Explore All Features</span>
							<ArrowRight className='h-4 w-4' />
						</Button>
					</div>

					{/* Invariant Truth Disclaimer */}
					<p className='mt-4 text-center text-[11px] text-text-muted leading-normal'>
						Zero credit card needed for trial. All recipes, cooking player features, and social interactions remain permanently free.
					</p>
				</BorderBeam>
			</DialogContent>
		</Dialog>
	)
}

export default PremiumUpgradeModal
