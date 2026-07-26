import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Database, Trash2, Mail } from 'lucide-react'

export const metadata: Metadata = {
	title: 'Privacy Policy',
	description:
		'Chefkix Privacy Policy — how we collect, use, and protect your personal data.',
	robots: { index: true, follow: true },
}

const sections = [
	{
		icon: Database,
		title: 'Data We Collect',
		items: [
			'Account information: display name, email address, and profile photo',
			'Content you post: recipes, photos, comments, and cooking sessions',
			'Usage data: interactions, likes, saves, and feature usage patterns',
			'Device information: browser type, operating system, and basic analytics',
		],
	},
	{
		icon: Eye,
		title: 'How We Use Your Data',
		items: [
			'To provide and improve the Chefkix cooking and social experience',
			'To personalize your feed, recommendations, and cooking suggestions',
			'To communicate service updates, achievements, and community activity',
			'To ensure platform safety through content moderation',
		],
	},
	{
		icon: Shield,
		title: 'Data Protection',
		items: [
			'We encrypt data in transit using TLS and at rest using industry-standard encryption',
			'We implement access controls and regular security audits',
			'We do not sell your personal data to third parties',
			'We use minimal necessary data for analytics and personalization',
		],
	},
	{
		icon: Trash2,
		title: 'Your Rights',
		items: [
			'Access, update, or delete your account and personal data at any time',
			'Export your content and activity history',
			'Control notification preferences and privacy settings',
			'Request permanent deletion of your data from our systems',
		],
	},
	{
		icon: Mail,
		title: 'Contact',
		items: [
			'For privacy inquiries, reach out to our support team',
			'We respond to all privacy requests within 30 days',
			'Data protection questions are handled by our security team',
		],
	},
]

export default function PrivacyPage() {
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
					Privacy Policy
				</h1>
				<p className='mt-2 text-sm text-text-muted'>Last updated: July 2026</p>

				<div className='mt-10 grid gap-6'>
					{sections.map(section => {
						const Icon = section.icon
						return (
							<section
								key={section.title}
								className='rounded-2xl border border-border-subtle bg-bg-card p-6'
							>
								<div className='flex items-start gap-4'>
									<div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand'>
										<Icon className='size-5' />
									</div>
									<div className='min-w-0'>
										<h2 className='text-lg font-bold text-text-primary'>
											{section.title}
										</h2>
										<ul className='mt-3 space-y-2'>
											{section.items.map(item => (
												<li
													key={item}
													className='flex items-start gap-2 text-sm leading-relaxed text-text-secondary'
												>
													<span className='mt-1.5 block size-1.5 shrink-0 rounded-full bg-brand/40' />
													{item}
												</li>
											))}
										</ul>
									</div>
								</div>
							</section>
						)
					})}
				</div>
			</div>
		</div>
	)
}
