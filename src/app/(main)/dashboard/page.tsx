import type { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
	title: 'Dashboard',
	description:
		'Your Chefkix home for cooking streaks, active sessions, feed updates, and kitchen progress.',
	robots: {
		index: false,
		follow: false,
	},
}

export default function DashboardPage() {
	return <DashboardClient />
}
