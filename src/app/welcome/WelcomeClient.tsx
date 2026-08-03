'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
	ArrowRight,
	Bookmark,
	ChefHat,
	Compass,
	Flame,
	Search,
	Share2,
	Sparkles,
	Target,
	TrendingUp,
	Trophy,
	Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants'
import { cn } from '@/lib/utils'

const productSignals = [
	{ icon: Sparkles, labelKey: 'socialProofChefs' },
	{ icon: Users, labelKey: 'socialProofRecipes' },
	{ icon: ChefHat, labelKey: 'socialProofMeals' },
] as const

const features = [
	{
		icon: Trophy,
		titleKey: 'featureXpTitle',
		descriptionKey: 'featureXpDesc',
		accent: 'bg-brand/10 text-brand-text',
	},
	{
		icon: Flame,
		titleKey: 'featureStreaksTitle',
		descriptionKey: 'featureStreaksDesc',
		accent: 'bg-streak/10 text-streak-text',
	},
	{
		icon: Target,
		titleKey: 'featureCookingTitle',
		descriptionKey: 'featureCookingDesc',
		accent: 'bg-xp/10 text-xp-text',
	},
	{
		icon: Users,
		titleKey: 'featureFriendsTitle',
		descriptionKey: 'featureFriendsDesc',
		accent: 'bg-combo/10 text-combo',
	},
	{
		icon: Search,
		titleKey: 'featureQualityTitle',
		descriptionKey: 'featureQualityDesc',
		accent: 'bg-badge/10 text-badge-text',
	},
	{
		icon: TrendingUp,
		titleKey: 'featureCreatorTitle',
		descriptionKey: 'featureCreatorDesc',
		accent: 'bg-level/10 text-level-text',
	},
] as const

const journeySteps = [
	{ icon: Compass, titleKey: 'step01Title', descriptionKey: 'step01Desc' },
	{ icon: Bookmark, titleKey: 'step02Title', descriptionKey: 'step02Desc' },
	{ icon: ChefHat, titleKey: 'step03Title', descriptionKey: 'step03Desc' },
	{ icon: Share2, titleKey: 'step04Title', descriptionKey: 'step04Desc' },
] as const

const HeroSection = () => {
	const t = useTranslations('welcome')

	return (
		<section
			aria-labelledby='welcome-title'
			className='relative isolate flex min-h-[88svh] items-center overflow-hidden bg-black text-white'
		>
			<Image
				src='/images/hero/cacio-e-pepe.png'
				alt='Cacio e Pepe shared on ChefKix'
				fill
				className='object-cover object-center'
				sizes='100vw'
				priority
			/>
			<div aria-hidden='true' className='absolute inset-0 bg-black/65' />

			<div className='container relative z-10 mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-12'>
				<div className='max-w-3xl'>
					<p className='mb-8 text-sm font-semibold text-white/85'>
						{t('heroTagline')}
					</p>

					<h1
						id='welcome-title'
						className='font-display text-5xl font-black leading-tight sm:text-6xl'
					>
						ChefKix
					</h1>
					<p className='mt-5 max-w-2xl text-2xl font-bold leading-snug text-white sm:text-3xl'>
						{t('heroPromise')}
					</p>
					<p className='mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg'>
						{t('heroDescription')}
					</p>

					<div className='mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
						<Button
							asChild
							size='lg'
							className='h-14 w-full rounded-lg bg-brand px-7 text-base font-bold text-white shadow-warm hover:bg-brand-hover sm:w-auto'
						>
							<Link href={PATHS.AUTH.SIGN_UP}>
								{t('startCooking')}
								<ArrowRight className='ml-2 size-5' />
							</Link>
						</Button>
						<Button
							asChild
							variant='outline'
							size='lg'
							className='h-14 w-full rounded-lg border-white/60 bg-black/30 px-7 text-base font-semibold text-white hover:bg-white hover:text-text-primary sm:w-auto'
						>
							<Link href={PATHS.EXPLORE}>
								<Users className='mr-2 size-5' />
								{t('exploreRecipes')}
							</Link>
						</Button>
					</div>

					<ul className='mt-9 grid max-w-3xl gap-3 sm:grid-cols-3'>
						{productSignals.map(signal => {
							const Icon = signal.icon
							return (
								<li
									key={signal.labelKey}
									className='flex items-start gap-2 text-sm font-medium text-white/85'
								>
									<Icon className='mt-0.5 size-4 shrink-0 text-brand' />
									<span>{t(signal.labelKey)}</span>
								</li>
							)
						})}
					</ul>
				</div>
			</div>
		</section>
	)
}

const FeaturesSection = () => {
	const t = useTranslations('welcome')

	return (
		<section aria-labelledby='welcome-features' className='bg-bg py-20'>
			<div className='container mx-auto max-w-7xl px-6 sm:px-8'>
				<div className='max-w-3xl'>
					<h2
						id='welcome-features'
						className='text-3xl font-bold text-text-primary sm:text-4xl'
					>
						{t('whyDifferentTitle')}
					</h2>
					<p className='mt-4 text-base leading-relaxed text-text-secondary sm:text-lg'>
						{t('whyDifferentSubtitle')}
					</p>
				</div>

				<div className='mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
					{features.map(feature => {
						const Icon = feature.icon
						return (
							<article
								key={feature.titleKey}
								className='rounded-lg border border-border-subtle bg-bg-card p-6 shadow-card'
							>
								<div
									className={cn(
										'flex size-11 items-center justify-center rounded-lg',
										feature.accent,
									)}
								>
									<Icon className='size-5' />
								</div>
								<h3 className='mt-5 text-lg font-bold text-text-primary'>
									{t(feature.titleKey)}
								</h3>
								<p className='mt-2 text-sm leading-relaxed text-text-secondary'>
									{t(feature.descriptionKey)}
								</p>
							</article>
						)
					})}
				</div>
			</div>
		</section>
	)
}

const HowItWorksSection = () => {
	const t = useTranslations('welcome')

	return (
		<section
			aria-labelledby='welcome-journey'
			className='border-y border-border-subtle bg-bg-elevated py-20'
		>
			<div className='container mx-auto max-w-7xl px-6 sm:px-8'>
				<div className='max-w-3xl'>
					<h2
						id='welcome-journey'
						className='text-3xl font-bold text-text-primary sm:text-4xl'
					>
						{t('howItWorksTitle')}
					</h2>
					<p className='mt-4 text-base text-text-secondary sm:text-lg'>
						{t('howItWorksSubtitle')}
					</p>
				</div>

				<ol className='mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
					{journeySteps.map((step, index) => {
						const Icon = step.icon
						return (
							<li key={step.titleKey} className='border-t-2 border-brand pt-5'>
								<div className='flex items-center justify-between'>
									<Icon className='size-6 text-brand-text' />
									<span className='font-display text-sm font-bold text-text-muted'>
										0{index + 1}
									</span>
								</div>
								<h3 className='mt-5 text-lg font-bold text-text-primary'>
									{t(step.titleKey)}
								</h3>
								<p className='mt-2 text-sm leading-relaxed text-text-secondary'>
									{t(step.descriptionKey)}
								</p>
							</li>
						)
					})}
				</ol>
			</div>
		</section>
	)
}

const CTASection = () => {
	const t = useTranslations('welcome')

	return (
		<section aria-labelledby='welcome-cta' className='bg-bg py-20'>
			<div className='container mx-auto max-w-4xl px-6 text-center sm:px-8'>
				<h2
					id='welcome-cta'
					className='text-3xl font-bold text-text-primary sm:text-4xl'
				>
					{t('readyToLevelUp')}
				</h2>
				<p className='mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg'>
					{t('ctaDescription')}
				</p>
				<div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
					<Button
						asChild
						size='lg'
						className='h-14 w-full rounded-lg bg-brand px-7 text-base font-bold text-white hover:bg-brand-hover sm:w-auto'
					>
						<Link href={PATHS.AUTH.SIGN_UP}>
							{t('createFreeAccount')}
							<ArrowRight className='ml-2 size-5' />
						</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						size='lg'
						className='h-14 w-full rounded-lg px-7 text-base font-semibold sm:w-auto'
					>
						<Link href={PATHS.AUTH.SIGN_IN}>{t('signIn')}</Link>
					</Button>
				</div>
				<p className='mt-5 text-sm text-text-muted'>{t('ctaDisclaimer')}</p>
			</div>
		</section>
	)
}

export default function WelcomePage() {
	return (
		<div className='min-h-screen bg-bg'>
			<HeroSection />
			<FeaturesSection />
			<HowItWorksSection />
			<CTASection />
		</div>
	)
}
