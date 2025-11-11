import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from '@/components/ui/toaster'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: {
		default: 'Chefkix - Gamified Cooking Recipes & Community',
		template: '%s | Chefkix',
	},
	description:
		'Transform cooking into an interactive game! Follow step-by-step recipes with timers, earn badges, level up, and connect with a community of food enthusiasts.',
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
	viewport: {
		width: 'device-width',
		initialScale: 1,
		maximumScale: 1,
	},
	robots: {
		index: true,
		follow: true,
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='en'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<GoogleOAuthProvider
					clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
				>
					<AuthProvider>{children}</AuthProvider>
				</GoogleOAuthProvider>
				<Toaster position='top-right' maxToasts={5} />
			</body>
		</html>
	)
}
