import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, Camera, ScanLine, ShieldCheck } from 'lucide-react'
import { DishPhotoRetrievalPanel } from '@/components/scan/DishPhotoRetrievalPanel'
import { ScanIngredientWorkspace } from '@/components/scan/ScanIngredientWorkspace'
import { PATHS } from '@/constants/paths'

export default async function ScanIngredientsPage() {
	const t = await getTranslations('cooking')

	return (
		<main className='mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10'>
			<div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
				<div>
					<Link
						href={PATHS.COOK}
						className='mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						<ArrowLeft className='size-4' />
						{t('scanBackToCooking')}
					</Link>
					<p className='mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-brand'>
						<ScanLine className='size-4' /> {t('scanKitchenScanner')}
					</p>
					<h1 className='text-3xl font-bold tracking-tight text-text-primary sm:text-4xl'>
						{t('scanPageTitle')}
					</h1>
					<p className='mt-3 max-w-2xl text-base leading-7 text-text-secondary'>
						{t('scanPageDescription')}
					</p>
				</div>
				<div className='hidden rounded-2xl border border-success/20 bg-success/5 p-4 sm:block'>
					<ShieldCheck className='mb-2 size-5 text-success' />
					<p className='text-sm font-semibold text-text-primary'>
						{t('scanPrivatePreview')}
					</p>
					<p className='mt-1 max-w-40 text-xs leading-5 text-text-secondary'>
						{t('scanPrivatePreviewDescription')}
					</p>
				</div>
			</div>

			<div className='grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]'>
				<div className='rounded-3xl border border-border-subtle bg-bg-card p-4 shadow-card sm:p-6'>
					<div className='mb-5 flex items-center gap-3'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand'>
							<Camera className='size-5' />
						</div>
						<div>
							<h2 className='font-semibold text-text-primary'>
								{t('scanCameraPreviewTitle')}
							</h2>
							<p className='text-sm text-text-secondary'>
								{t('scanGoodLight')}
							</p>
						</div>
					</div>
					<ScanIngredientWorkspace />
				</div>

				<aside className='rounded-3xl border border-border-subtle bg-bg-elevated p-5 sm:p-6'>
					<h2 className='font-semibold text-text-primary'>
						{t('scanMakeItCount')}
					</h2>
					<ul className='mt-4 space-y-4 text-sm leading-6 text-text-secondary'>
						<li className='flex gap-3'>
							<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white'>
								1
							</span>
							<span>{t('scanTipSpread')}</span>
						</li>
						<li className='flex gap-3'>
							<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white'>
								2
							</span>
							<span>{t('scanTipSteady')}</span>
						</li>
						<li className='flex gap-3'>
							<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white'>
								3
							</span>
							<span>{t('scanTipReview')}</span>
						</li>
					</ul>
					<div className='mt-6 rounded-2xl border border-warning/20 bg-warning/8 p-4 text-sm leading-6 text-warning-vivid'>
						{t('scanSafetyDisclaimer')}
					</div>
				</aside>
			</div>

			<div className='mt-6'>
				<DishPhotoRetrievalPanel />
			</div>
		</main>
	)
}
