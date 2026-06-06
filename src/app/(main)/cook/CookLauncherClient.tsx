'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChefHat, Compass, Users, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PATHS } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import { useCookingStore } from '@/store/cookingStore'
import { useUiStore } from '@/store/uiStore'
import { hasActiveCookSession } from './cook-launcher.logic'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Button } from '@/components/ui/button'

export function CookLauncherClient() {
	const t = useTranslations('common')
	const router = useRouter()
	const launchStartedRef = useRef(false)
	const { isAuthenticated, isHydrated } = useAuth()
	const { session, resumeExistingSession } = useCookingStore()
	const { openCookingPanel, expandCookingPanel } = useUiStore()
	const [isCheckingSession, setIsCheckingSession] = useState(true)

	useEffect(() => {
		if (!isHydrated || launchStartedRef.current) return
		launchStartedRef.current = true

		if (!isAuthenticated) {
			setIsCheckingSession(false)
			return
		}

		const openCookingUi = () => {
			const isDesktop = window.innerWidth >= 1280
			if (isDesktop) {
				openCookingPanel()
			} else {
				expandCookingPanel()
			}
		}

		const launch = async () => {
			const hasStoreSession = hasActiveCookSession(session)
			if (hasStoreSession) {
				setIsCheckingSession(false)
				openCookingUi()
				router.replace(PATHS.DASHBOARD)
				return
			}

			const resumed = await resumeExistingSession()
			setIsCheckingSession(false)
			if (resumed) {
				openCookingUi()
				router.replace(PATHS.DASHBOARD)
				return
			}
		}

		void launch()
	}, [
		isAuthenticated,
		isHydrated,
		router,
		session,
		resumeExistingSession,
		openCookingPanel,
		expandCookingPanel,
	])

	if (!isHydrated || isCheckingSession) {
		return (
			<PageTransition>
				<PageContainer maxWidth='md'>
					<div className='mx-auto mt-16 rounded-2xl border border-border-subtle bg-bg-card p-8 text-center shadow-card'>
						<Loader2 className='mx-auto mb-4 size-8 animate-spin text-brand' />
						<p className='text-sm font-semibold uppercase tracking-widest text-text-muted'>
							{t('startCooking')}
						</p>
						<h1 className='mt-2 text-2xl font-black text-text-primary'>
							{t('cookLauncherPreparingKitchen')}
						</h1>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='md'>
				<div className='mx-auto mt-16 rounded-2xl border border-border-subtle bg-bg-card p-8 shadow-card'>
					<p className='text-xs font-semibold uppercase tracking-widest text-text-muted'>
						{t('startCooking')}
					</p>
					<h1 className='mt-2 text-2xl font-black text-text-primary'>
						{t('cookLauncherChooseNextCook')}
					</h1>
					<p className='mt-2 text-sm text-text-secondary'>
						{t('cookLauncherNoActiveSession')}
					</p>

					<div className='mt-6 grid gap-3'>
						<Link
							href={`${PATHS.EXPLORE}?from=cook-launcher`}
							className='flex items-center justify-between rounded-xl border border-border-subtle bg-bg-elevated px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-hover'
						>
							<span className='inline-flex items-center gap-2'>
								<Compass className='size-4 text-brand' />
								{t('cookLauncherFindRecipe')}
							</span>
							<span>→</span>
						</Link>

						<Link
							href='/cook-together'
							className='flex items-center justify-between rounded-xl border border-border-subtle bg-bg-elevated px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-hover'
						>
							<span className='inline-flex items-center gap-2'>
								<Users className='size-4 text-brand' />
								{t('cookLauncherStartCookTogether')}
							</span>
							<span>→</span>
						</Link>
					</div>
				</div>
			</PageContainer>
		</PageTransition>
	)
}
