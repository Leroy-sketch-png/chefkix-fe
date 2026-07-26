import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
	title: 'Terms of Service',
	description:
		'Chefkix Terms of Service — the rules and guidelines for using our cooking community platform.',
	robots: { index: true, follow: true },
}

const sections = [
	{
		title: '1. Acceptance of Terms',
		content:
			'By creating an account or using Chefkix, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.',
	},
	{
		title: '2. Account Registration',
		content:
			'You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.',
	},
	{
		title: '3. User Content',
		content:
			'You retain ownership of content you post. By posting, you grant Chefkix a non-exclusive, royalty-free license to display, distribute, and promote your content within the Service. You represent that your content does not violate any third-party rights.',
	},
	{
		title: '4. Acceptable Use',
		content:
			'You agree not to misuse the Service for spam, harassment, impersonation, or any unlawful activity. We reserve the right to remove content and suspend accounts that violate these rules.',
	},
	{
		title: '5. Termination',
		content:
			'You may delete your account at any time. We may suspend or terminate access for violations of these Terms. Upon termination, your content may be removed or anonymized.',
	},
	{
		title: '6. Changes to Terms',
		content:
			'We may update these Terms. Continued use after changes constitutes acceptance. We will notify you of material changes via email or in-app notice.',
	},
]

export default function TermsPage() {
	return (
		<div className='min-h-screen bg-bg'>
			<div className='mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16'>
				<Link
					href='/auth/sign-up'
					className='mb-8 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-brand'
				>
					<ArrowLeft className='size-4' />
					Back to sign up
				</Link>

				<h1 className='font-display text-3xl font-bold text-text-primary sm:text-4xl'>
					Terms of Service
				</h1>
				<p className='mt-2 text-sm text-text-muted'>Last updated: July 2026</p>

				<div className='mt-10 space-y-8'>
					{sections.map(section => (
						<section key={section.title}>
							<h2 className='text-xl font-bold text-text-primary'>
								{section.title}
							</h2>
							<p className='mt-2 leading-relaxed text-text-secondary'>
								{section.content}
							</p>
						</section>
					))}
				</div>

				<div className='mt-12 rounded-2xl border border-border-subtle bg-bg-card p-6'>
					<h2 className='text-lg font-bold text-text-primary'>Contact</h2>
					<p className='mt-2 leading-relaxed text-text-secondary'>
						For questions about these Terms, please contact our support team.
					</p>
				</div>
			</div>
		</div>
	)
}
