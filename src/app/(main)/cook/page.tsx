import type { Metadata } from 'next'
import { CookLauncherClient } from './CookLauncherClient'

export const metadata: Metadata = {
	title: 'Start Cooking',
	description:
		'Resume your active cooking session or jump into explore to start a new one.',
}

export default function CookLauncherPage() {
	return <CookLauncherClient />
}
