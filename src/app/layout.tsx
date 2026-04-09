import {
	Plus_Jakarta_Sans,
	Space_Grotesk,
	Playfair_Display,
} from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { TokenRefreshProvider } from '@/components/providers/TokenRefreshProvider'
import { CelebrationProvider } from '@/components/providers/CelebrationProvider'
import { GoogleOAuthWrapper } from '@/components/providers/GoogleOAuthWrapper'
import { NetworkStatusProvider } from '@/components/providers/NetworkStatusProvider'
import { BlockedUsersProvider } from '@/components/providers/BlockedUsersProvider'
import { LiveAnnouncerProvider } from '@/components/a11y/LiveAnnouncer'
import { ReducedMotionProvider } from '@/components/providers/ReducedMotionProvider'
import { FirstVisitHintsProvider } from '@/components/onboarding/FirstVisitHints'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'

// Primary font: Plus Jakarta Sans - Modern, friendly, slightly rounded
// Perfect for a social cooking app - warm but professional
const plusJakarta = Plus_Jakarta_Sans({
	variable: '--font-sans',
	subsets: ['latin'],
	display: 'swap',
	weight: ['400', '500', '600', '700', '800'],
})

// Display font: Space Grotesk - Bold, geometric, gaming vibes
// For headings, stats, XP numbers - gives that Duolingo energy
const spaceGrotesk = Space_Grotesk({
	variable: '--font-display',
	subsets: ['latin'],
	display: 'swap',
	weight: ['400', '500', '600', '700'],
})

// Accent font: Playfair Display - Elegant serif for recipe titles
// Adds sophistication, like a cookbook or food magazine
const playfair = Playfair_Display({
	variable: '--font-serif',
	subsets: ['latin'],
	display: 'swap',
	weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
	title: {
		default: 'Chefkix - Gamified Cooking Recipes & Community',
		template: '%s | Chefkix',
	},
	description:
		'Transform cooking into an interactive game! Follow step-by-step recipes with timers, earn badges, level up, and connect with a community of food enthusiasts.',
	manifest: '/manifest.json',
	keywords: [
		'cooking recipes',
		'gamified cooking',
		'step-by-step recipes',
		'cooking community',
		'cooking timers',
		'recipe sharing',
		'culinary challenges',
	],
	authors: [{ name: 'Chefkix Team' }],
	openGraph: {
		type: 'website',
		locale: 'en_US',
		siteName: 'Chefkix',
		title: 'Chefkix - Gamified Cooking Recipes',
		description:
			'Transform cooking into an interactive game! Earn badges, level up, and master recipes with our step-by-step cooking platform.',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Chefkix - Gamified Cooking Recipes',
		description:
			'Transform cooking into an interactive game! Earn badges and master recipes.',
	},
	robots: {
		index: true,
		follow: true,
	},
	icons: {
		icon: [
			{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
			{ url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
		],
	},
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#ff5a36' },
		{ media: '(prefers-color-scheme: dark)', color: '#0f0d0c' },
	],
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const messages = await getMessages()

	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t==='system'||!t)&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}})()`,
					}}
				/>
			</head>
			<body
				className={`${plusJakarta.variable} ${spaceGrotesk.variable} ${playfair.variable} font-sans antialiased`}
			>
				{/* Skip to main content link - WCAG 2.4.1 */}
				<a
					href='#main-content'
					className='sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-tooltip focus:rounded-radius-sm focus:bg-brand focus:px-4 focus:py-2 focus:text-white focus:shadow-lg'
				>
					Skip to main content
				</a>
				<GoogleOAuthWrapper>
					<NextIntlClientProvider messages={messages}>
						<AuthProvider>
							<TokenRefreshProvider>
								<BlockedUsersProvider>
									<CelebrationProvider>
										<LiveAnnouncerProvider>
											<ReducedMotionProvider>
												<FirstVisitHintsProvider>
													{children}
													<NetworkStatusProvider />
												</FirstVisitHintsProvider>
											</ReducedMotionProvider>
										</LiveAnnouncerProvider>
									</CelebrationProvider>
								</BlockedUsersProvider>
							</TokenRefreshProvider>
						</AuthProvider>
					</NextIntlClientProvider>
				</GoogleOAuthWrapper>
				<Toaster position='bottom-center' />
			</body>
		</html>
	)
}
